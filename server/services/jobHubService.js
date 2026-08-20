import { Op, fn, col } from 'sequelize';
import JobDirectory from '../models/JobDirectory.js';
import HunterJob from '../models/HunterJob.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { toPublicList } from '../views/serialize.js';
import {
  isCloudflareChallengeHtml,
  isDirectJobPostingUrl,
  mapHimalayasJobs,
  mapRemoteOkJobs,
  parseDeallsJobsFromHtml,
  parseDisnakerjaFeedXml,
  parseKarirJakartaJobsFromHtml,
  parseKarirhubJobsFromHtml,
  parseKarirlinkJobsFromHtml,
  parseToplokerJobsFromHtml
} from './jobHubParsers.js';
import {
  INGEST_WINDOW_DAYS,
  PURGE_AFTER_DAYS,
  filterJobsWithinIngestWindow,
  purgeCutoffDate
} from './jobHubWindow.js';

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
};

async function fetchPublicHtml(url, timeout = 10000) {
  const res = await axios.get(url, {
    headers: BROWSER_HEADERS,
    timeout,
    validateStatus: (status) => status < 500
  });
  const html = String(res.data || '');
  if (res.status !== 200) {
    console.warn(`Fetch ${url}: HTTP ${res.status} — skip source`);
    return null;
  }
  if (isCloudflareChallengeHtml(html)) {
    console.warn(`Fetch ${url}: Cloudflare challenge — tidak di-bypass; lewati sumber ini`);
    return null;
  }
  return html;
}

function inferCategory(title, extra = '') {
  const lower = `${title} ${extra}`.toLowerCase();
  if (/(bumn|cpns|pns|instansi|kementerian)/i.test(lower)) return 'BUMN & Instansi';
  if (/(developer|engineer|programmer|data|qa|devops|\bit\b|software|teknisi)/i.test(lower)) return 'IT & Software';
  if (/(market|sales|business|brand|commerce|telemarketing)/i.test(lower)) return 'Marketing & Sales';
  if (/(design|ui|ux|creative|content)/i.test(lower)) return 'Design & Kreatif';
  if (/(finance|account|tax|audit|treasury)/i.test(lower)) return 'Finance';
  if (/(admin|hr|human resource|recruiter|customer|security|collection)/i.test(lower)) return 'Admin & HR';
  return 'Admin & HR';
}

function toDirectoryRow(parsed, { platform, color, tags, defaultLocation }) {
  const location = parsed.location || defaultLocation || 'Indonesia';
  return {
    title: parsed.title,
    company: parsed.company,
    location,
    platform,
    platform_badge_color: color,
    job_url: parsed.job_url,
    contact_email: '',
    salary: parsed.salary || 'Kompetitif',
    experience_level: parsed.experience_level || 'Semua Level',
    work_type: parsed.work_type || 'Full-time',
    category: inferCategory(parsed.title, parsed.company),
    description: parsed.description || `Lowongan ${parsed.title} di ${parsed.company} (${location}) melalui ${platform}.`,
    requirements: parsed.requirements || ['Kualifikasi Sesuai', 'Komunikasi Baik'],
    tags,
    posted_at: parsed.posted_at || new Date()
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function unixToDate(value) {
  const n = Number(value);
  if (Number.isFinite(n) && n > 0) {
    return new Date(n < 1e12 ? n * 1000 : n);
  }
  return new Date();
}

function staleDirectoryWhere(now = new Date()) {
  const cutoff = purgeCutoffDate(now);
  return {
    [Op.or]: [
      { posted_at: { [Op.lt]: cutoff } },
      {
        posted_at: { [Op.is]: null },
        [Op.or]: [
          { createdAt: { [Op.lt]: cutoff } },
          { updatedAt: { [Op.lt]: cutoff } }
        ]
      }
    ]
  };
}

function recencyListWhere(now = new Date()) {
  const cutoff = purgeCutoffDate(now);
  return {
    [Op.or]: [
      { posted_at: { [Op.gte]: cutoff } },
      { posted_at: { [Op.is]: null }, createdAt: { [Op.gte]: cutoff } }
    ]
  };
}

/**
 * Fetch live jobs from LinkedIn Guest API posted in the last 8 days (f_TPR=r691200).
 * Guest pages return ~10 cards; start=0 and start=10 doubles coverage per keyword.
 */
async function fetchLinkedInLiveJobs8Days() {
  console.log('🚀 [JobHub] Mengambil Lowongan Live LinkedIn Indonesia (8 Hari Terakhir: f_TPR=r691200)...');
  const linkedInKeywords = [
    'Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Fullstack Developer',
    'Mobile Developer',
    'Data Analyst',
    'UI UX Designer',
    'Product Manager',
    'DevOps Cloud',
    'Digital Marketing',
    'Human Resources',
    'Finance Accounting',
    'Admin Staff',
    'Sales Executive',
    'Customer Service',
    'BUMN',
    'Quality Assurance',
    'Project Manager',
    'Graphic Designer',
    'Content Writer',
    'Machine Learning'
  ];
  const pageStarts = [0, 10];

  const jobs = [];
  const seenUrls = new Set();

  const parseCards = (html, kw) => {
    const $ = cheerio.load(html);
    $('li').each((_, el) => {
      const title = $(el).find('.base-search-card__title').text().trim();
      const company = $(el).find('.base-search-card__subtitle').text().trim();
      const location = $(el).find('.job-search-card__location').text().trim();
      let link = $(el).find('.base-card__full-link').attr('href');
      const timeEl = $(el).find('time');
      const timeAgo = timeEl.text().trim();
      const datetimeAttr = timeEl.attr('datetime');
      const postedFromAttr = datetimeAttr ? new Date(datetimeAttr) : null;
      const posted_at = postedFromAttr && !Number.isNaN(postedFromAttr.getTime())
        ? postedFromAttr
        : new Date();

      if (title && company && link) {
        link = link.split('?')[0];
        if (!seenUrls.has(link)) {
          seenUrls.add(link);

          let category = 'IT & Software';
          const lowerTitle = (title + ' ' + kw).toLowerCase();
          if (lowerTitle.includes('market') || lowerTitle.includes('sales') || lowerTitle.includes('business dev')) category = 'Marketing & Sales';
          else if (lowerTitle.includes('admin') || lowerTitle.includes('hr') || lowerTitle.includes('human resource') || lowerTitle.includes('recruiter')) category = 'Admin & HR';
          else if (lowerTitle.includes('finance') || lowerTitle.includes('account') || lowerTitle.includes('tax') || lowerTitle.includes('audit')) category = 'Finance';
          else if (lowerTitle.includes('design') || lowerTitle.includes('ux') || lowerTitle.includes('creative') || lowerTitle.includes('graphic')) category = 'Design & Kreatif';
          else if (lowerTitle.includes('bumn')) category = 'BUMN & Instansi';

          jobs.push({
            title,
            company,
            location: location || 'Indonesia',
            platform: 'LinkedIn',
            platform_badge_color: '#0A66C2',
            job_url: link,
            contact_email: '',
            salary: 'Kompetitif (Standar LinkedIn)',
            experience_level: 'Semua Level',
            work_type: location.toLowerCase().includes('remote') ? 'Remote / WFH' : (location.toLowerCase().includes('hybrid') ? 'Hybrid' : 'Full-time'),
            category,
            description: `Lowongan kerja posisi ${title} di ${company} (${location || 'Indonesia'}). Diposting ${timeAgo || 'dalam 8 hari terakhir'} di LinkedIn.`,
            requirements: [kw, 'Pengalaman Relevan', 'Komunikasi Baik', 'Portofolio / CV Terkini'],
            tags: ['LinkedIn', kw, timeAgo || '8 Hari Terakhir', 'Terverifikasi'],
            posted_at
          });
        }
      }
    });
  };

  for (const kw of linkedInKeywords) {
    for (const start of pageStarts) {
      try {
        const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(kw)}&location=Indonesia&f_TPR=r691200&start=${start}`;
        const res = await axios.get(url, {
          headers: BROWSER_HEADERS,
          timeout: 9000
        });
        parseCards(res.data, kw);
      } catch (err) {
        console.warn(`LinkedIn keyword "${kw}" start=${start} note:`, err.message);
      }
      await sleep(250);
    }
  }

  const recent = filterJobsWithinIngestWindow(jobs);
  console.log(`✓ [JobHub] Berhasil menarik ${recent.length} loker live LinkedIn dari 8 hari terakhir`);
  return recent;
}

/**
 * Scrape live BUMN & national jobs from Disnakerja HTML + RSS feed.
 */
async function fetchDisnakerjaScraper() {
  const scrapedJobs = [];
  const seen = new Set();

  const pushRow = (item) => {
    if (!item?.job_url || seen.has(item.job_url) || !isDirectJobPostingUrl(item.job_url)) return;
    seen.add(item.job_url);
    scrapedJobs.push(item);
  };

  try {
    const html = await fetchPublicHtml('https://disnakerja.com/');
    if (html) {
      const $ = cheerio.load(html);
      $('article').each((_, el) => {
        const titleEl = $(el).find('h2 a, .entry-title a');
        const title = titleEl.text().trim();
        const job_url = titleEl.attr('href');
        const desc = $(el).find('.entry-summary, p').first().text().trim();
        if (!title || !job_url) return;

        let company = 'Perusahaan Terkemuka / BUMN';
        if (title.toLowerCase().includes('bumn')) company = 'Rekrutmen BUMN';
        else if (title.toLowerCase().includes('pt ')) {
          const match = title.match(/PT\s+[^–-]+/i);
          if (match) company = match[0].trim();
        }

        pushRow({
          title,
          company,
          location: 'Indonesia (Nasional)',
          platform: 'Disnakerja',
          platform_badge_color: '#10B981',
          job_url,
          contact_email: '',
          salary: 'Standar BUMN / Industri Nasional',
          experience_level: 'Fresh Graduate',
          work_type: 'Full-time',
          category: 'BUMN & Instansi',
          description: desc || 'Penerimaan lowongan kerja resmi melalui portal karir Disnakerja Indonesia.',
          requirements: ['Warga Negara Indonesia', 'Pendidikan D3/S1/S2', 'Sehat Jasmani & Rohani', 'IPK Memenuhi Syarat'],
          tags: ['BUMN', 'Disnakerja', 'Nasional', '8 Hari Terakhir'],
          posted_at: new Date()
        });
      });
    }
  } catch (err) {
    console.warn('Disnakerja Scraper note:', err.message);
  }

  try {
    const xml = await fetchPublicHtml('https://disnakerja.com/feed/');
    if (xml) {
      for (const parsed of parseDisnakerjaFeedXml(xml)) {
        pushRow(toDirectoryRow(parsed, {
          platform: 'Disnakerja',
          color: '#10B981',
          tags: parsed.tags || ['BUMN', 'Disnakerja', 'Nasional'],
          defaultLocation: 'Indonesia (Nasional)'
        }));
      }
    }
  } catch (err) {
    console.warn('Disnakerja RSS note:', err.message);
  }

  return filterJobsWithinIngestWindow(scrapedJobs);
}

/**
 * Fetch live remote tech, design, marketing jobs from Remotive Public API
 */
async function fetchRemotiveJobs() {
  try {
    const res = await axios.get('https://remotive.com/api/remote-jobs?limit=200', { timeout: 15000 });
    const remoteJobs = (res.data?.jobs || []).map(j => ({
      title: j.title,
      company: j.company_name,
      location: j.candidate_required_location || '100% Worldwide Remote',
      platform: 'Remote',
      platform_badge_color: '#06B6D4',
      job_url: j.url,
      contact_email: '',
      salary: j.salary || 'Standar Global ($ USD)',
      experience_level: 'Semua Level',
      work_type: 'Remote / WFH',
      category: j.category?.includes('Software') || j.category?.includes('Dev') ? 'IT & Software' : (j.category?.includes('Marketing') ? 'Marketing & Sales' : 'IT & Software'),
      description: (j.description || '').replace(/<[^>]*>?/gm, '').slice(0, 300) + '...',
      requirements: (j.tags || []).slice(0, 4),
      tags: ['Remote', 'Luar Negeri', 'Remotive', ...(j.tags || []).slice(0, 3)],
      posted_at: j.publication_date ? new Date(j.publication_date) : new Date()
    }));
    const recent = filterJobsWithinIngestWindow(remoteJobs);
    console.log(`✓ [JobHub] Remotive: ${recent.length}/${remoteJobs.length} dalam 8 hari`);
    return recent;
  } catch (err) {
    console.warn('Remotive API fetch note:', err.message);
    return [];
  }
}

/**
 * Fetch live tech, product, and data jobs from Arbeitnow Public API
 */
async function fetchArbeitnowJobs() {
  const jobs = [];
  const seen = new Set();
  const maxPages = 3;
  try {
    for (let page = 1; page <= maxPages; page++) {
      const res = await axios.get(`https://www.arbeitnow.com/api/job-board-api?page=${page}`, { timeout: 12000 });
      const rows = res.data?.data || [];
      if (!rows.length) break;

      const mapped = rows.map((j) => ({
        title: j.title,
        company: j.company_name,
        location: j.location || 'Remote / European Friendly',
        platform: 'Remote',
        platform_badge_color: '#06B6D4',
        job_url: j.url,
        contact_email: '',
        salary: 'Kompetitif (EUR / USD)',
        experience_level: '1-3 Tahun',
        work_type: j.remote ? 'Remote / WFH' : 'Hybrid',
        category: 'IT & Software',
        description: (j.description || '').replace(/<[^>]*>?/gm, '').slice(0, 300) + '...',
        requirements: (j.tags || []).slice(0, 4),
        tags: ['Tech', 'Luar Negeri', 'Arbeitnow', ...(j.tags || []).slice(0, 3)],
        posted_at: unixToDate(j.created_at)
      }));
      const recent = filterJobsWithinIngestWindow(mapped);
      for (const job of recent) {
        if (!job.job_url || seen.has(job.job_url)) continue;
        seen.add(job.job_url);
        jobs.push(job);
      }
      if (mapped.length > 0 && recent.length === 0) break;
      if (!res.data?.links?.next) break;
    }
    console.log(`✓ [JobHub] Arbeitnow: ${jobs.length} lowongan dalam 8 hari`);
    return jobs;
  } catch (err) {
    console.warn('Arbeitnow API fetch note:', err.message);
    return jobs;
  }
}

/**
 * Scrape public Dealls job cards. Listing pages include real /loker/{slug}~{company} links.
 */
async function fetchDeallsJobs() {
  const jobs = [];
  const seen = new Set();
  for (const url of ['https://dealls.com/jobs', 'https://dealls.com/loker']) {
    try {
      const res = await axios.get(url, { headers: BROWSER_HEADERS, timeout: 12000 });
      for (const parsed of parseDeallsJobsFromHtml(res.data)) {
        if (!parsed.job_url || seen.has(parsed.job_url)) continue;
        seen.add(parsed.job_url);
        const lower = `${parsed.title} ${parsed.company}`.toLowerCase();
        let category = 'Admin & HR';
        if (/(developer|engineer|programmer|data|qa|devops|it)/i.test(lower)) category = 'IT & Software';
        else if (/(market|sales|business|brand|commerce)/i.test(lower)) category = 'Marketing & Sales';
        else if (/(design|ui|ux|creative|content)/i.test(lower)) category = 'Design & Kreatif';
        else if (/(finance|account|tax|audit)/i.test(lower)) category = 'Finance';
        jobs.push({
          title: parsed.title,
          company: parsed.company,
          location: parsed.location || 'Indonesia',
          platform: 'Dealls',
          platform_badge_color: '#8B5CF6',
          job_url: parsed.job_url,
          contact_email: '',
          salary: parsed.salary || 'Kompetitif',
          experience_level: parsed.experience_level || 'Semua Level',
          work_type: parsed.work_type || 'Full-time',
          category,
          description: `Lowongan ${parsed.title} di ${parsed.company} (${parsed.location || 'Indonesia'}) melalui Dealls.`,
          requirements: ['Kualifikasi Sesuai', 'Komunikasi Baik'],
          tags: ['Dealls', 'Indonesia'],
          posted_at: new Date()
        });
      }
    } catch (err) {
      console.warn(`Dealls fetch note (${url}):`, err.message);
    }
  }
  const recent = filterJobsWithinIngestWindow(jobs);
  console.log(`✓ [JobHub] Dealls: ${recent.length} lowongan dengan tautan posting asli`);
  return recent;
}

async function fetchMappedHtmlSource(label, urls, parseFn, meta) {
  const jobs = [];
  const seen = new Set();
  for (const url of urls) {
    try {
      const html = await fetchPublicHtml(url);
      if (!html) continue;
      for (const parsed of parseFn(html)) {
        if (!parsed.job_url || seen.has(parsed.job_url) || !isDirectJobPostingUrl(parsed.job_url)) continue;
        seen.add(parsed.job_url);
        jobs.push(toDirectoryRow(parsed, meta));
      }
    } catch (err) {
      console.warn(`${label} fetch note (${url}):`, err.message);
    }
  }
  const recent = filterJobsWithinIngestWindow(jobs);
  console.log(`✓ [JobHub] ${label}: ${recent.length} lowongan dengan tautan posting asli`);
  return recent;
}

async function fetchKarirJakartaJobs() {
  return fetchMappedHtmlSource(
    'KarirJakarta',
    ['https://karir.jakarta.go.id/jobs', 'https://karir.jakarta.go.id/karirhub-jobs'],
    parseKarirJakartaJobsFromHtml,
    {
      platform: 'KarirJakarta',
      color: '#FF6636',
      tags: ['KarirJakarta', 'Dalam Negeri', 'Jakarta'],
      defaultLocation: 'Jakarta / DKI'
    }
  );
}

async function fetchKarirhubJobs() {
  return fetchMappedHtmlSource(
    'Karirhub',
    ['https://karirhub.kemnaker.go.id/lowongan-dalam-negeri/lowongan'],
    parseKarirhubJobsFromHtml,
    {
      platform: 'Karirhub',
      color: '#CA8A04',
      tags: ['Karirhub', 'Dalam Negeri', 'Kemnaker'],
      defaultLocation: 'Indonesia'
    }
  );
}

async function fetchToplokerJobs() {
  return fetchMappedHtmlSource(
    'Toploker',
    ['https://toploker.com/loker/daftar'],
    parseToplokerJobsFromHtml,
    {
      platform: 'Toploker',
      color: '#149FC0',
      tags: ['Toploker', 'Dalam Negeri', 'Indonesia'],
      defaultLocation: 'Indonesia'
    }
  );
}

async function fetchKarirlinkJobs() {
  return fetchMappedHtmlSource(
    'Karirlink',
    ['https://portal.karirlink.id/jobs'],
    parseKarirlinkJobsFromHtml,
    {
      platform: 'Karirlink',
      color: '#E11D48',
      tags: ['Karirlink', 'Dalam Negeri', 'Indonesia'],
      defaultLocation: 'Indonesia'
    }
  );
}

/**
 * Extra overseas remote jobs from Jobicy's public, keyless API.
 */
async function fetchJobicyJobs() {
  try {
    const res = await axios.get('https://jobicy.com/api/v2/remote-jobs?count=100', { timeout: 12000 });
    const mapped = (res.data?.jobs || []).map((j) => ({
      title: j.jobTitle,
      company: j.companyName,
      location: j.jobGeo || 'Remote / Worldwide',
      platform: 'Remote',
      platform_badge_color: '#06B6D4',
      job_url: j.url,
      contact_email: '',
      salary: j.salaryMin && j.salaryMax
        ? `${j.salaryCurrency || ''} ${j.salaryMin}–${j.salaryMax} / ${j.salaryPeriod || 'year'}`.trim()
        : 'Kompetitif (USD)',
      experience_level: j.jobLevel && j.jobLevel !== 'Any' ? j.jobLevel : 'Semua Level',
      work_type: 'Remote / WFH',
      category: Array.isArray(j.jobIndustry) && j.jobIndustry.some((x) => /design|creative/i.test(x))
        ? 'Design & Kreatif'
        : (Array.isArray(j.jobIndustry) && j.jobIndustry.some((x) => /market|sales/i.test(x))
          ? 'Marketing & Sales'
          : 'IT & Software'),
      description: String(j.jobExcerpt || j.jobDescription || '').replace(/<[^>]*>?/gm, '').slice(0, 300),
      requirements: Array.isArray(j.jobType) ? j.jobType.slice(0, 4) : [],
      tags: ['Remote', 'Luar Negeri', 'Jobicy'],
      posted_at: j.pubDate ? new Date(j.pubDate) : new Date()
    }));
    const recent = filterJobsWithinIngestWindow(mapped);
    console.log(`✓ [JobHub] Jobicy: ${recent.length}/${mapped.length} dalam 8 hari`);
    return recent;
  } catch (err) {
    console.warn('Jobicy API fetch note:', err.message);
    return [];
  }
}

/**
 * Extra overseas remote jobs from Himalayas public, keyless API.
 * Official docs: https://himalayas.app/docs/remote-jobs-api (max 20 per request, no auth).
 */
async function fetchHimalayasJobs() {
  const jobs = [];
  const seen = new Set();
  const limit = 20;
  const maxPages = 8;
  try {
    for (let page = 0; page < maxPages; page++) {
      const offset = page * limit;
      let payload;
      try {
        const res = await axios.get(`https://himalayas.app/jobs/api?limit=${limit}&offset=${offset}`, { timeout: 10000 });
        payload = res.data;
      } catch (err) {
        const status = err.response?.status;
        console.warn(
          'Himalayas API fetch note:',
          status === 429
            ? `HTTP 429 rate limit — keep ${jobs.length} jobs already fetched`
            : err.message
        );
        break;
      }

      const mapped = mapHimalayasJobs(payload).filter((item) => isDirectJobPostingUrl(item.job_url));
      const recent = filterJobsWithinIngestWindow(mapped);
      for (const job of recent) {
        if (seen.has(job.job_url)) continue;
        seen.add(job.job_url);
        jobs.push(job);
      }

      const rawCount = Array.isArray(payload?.jobs) ? payload.jobs.length : 0;
      const totalCount = Number(payload?.totalCount) || 0;
      if (rawCount === 0) break;
      if (totalCount > 0 && offset + limit >= totalCount) break;
      if (mapped.length > 0 && recent.length === 0) break;
      if (page < maxPages - 1) await sleep(150);
    }
    console.log(`✓ [JobHub] Himalayas: ${jobs.length} lowongan dalam 8 hari (paginasi max ${maxPages}×${limit})`);
    return jobs;
  } catch (err) {
    console.warn('Himalayas API fetch note:', err.message);
    return jobs;
  }
}

/**
 * Remote OK public, keyless JSON API. Requires a User-Agent and attribution.
 * Docs: https://remoteok.com/api
 */
async function fetchRemoteOkJobs() {
  try {
    const res = await axios.get('https://remoteok.com/api', {
      timeout: 12000,
      headers: {
        'User-Agent': 'LamarKerja/1.0 (job directory; non-commercial aggregator)',
        Accept: 'application/json'
      }
    });
    const jobs = mapRemoteOkJobs(res.data).filter((item) => isDirectJobPostingUrl(item.job_url));
    const recent = filterJobsWithinIngestWindow(jobs);
    console.log(`✓ [JobHub] Remote OK: ${recent.length}/${jobs.length} dalam 8 hari`);
    return recent;
  } catch (err) {
    const status = err.response?.status;
    console.warn(
      'Remote OK API fetch note:',
      status === 429
        ? 'HTTP 429 rate limit — skip this source until the next sync'
        : err.message
    );
    return [];
  }
}

async function purgeDeadAndSearchListings() {
  const where = {
    [Op.or]: [
      { platform: { [Op.in]: ['Glints', 'JobStreet', 'Kalibrr', 'Indeed'] } },
      { job_url: { [Op.iLike]: '%glints.com%' } },
      { job_url: { [Op.iLike]: '%jobstreet.%' } },
      { job_url: { [Op.iLike]: '%indeed.%' } },
      { job_url: { [Op.iLike]: '%kalibrr.com%' } },
      { job_url: { [Op.iLike]: '%/opportunities/jobs/explore%' } },
      { job_url: { [Op.iLike]: '%linkedin.com/jobs/search/%' } },
      { job_url: { [Op.iLike]: '%/job-search/%' } },
      { job_url: { [Op.iLike]: '%loker?search=%' } },
      { job_url: { [Op.iLike]: '%jobs?keyword=%' } },
      { job_url: { [Op.iLike]: '%disnakerja.com/?s=%' } },
      { job_url: { [Op.iLike]: '%karir.jakarta.go.id/jobs%' } },
      { job_url: { [Op.iLike]: '%/loker/daftar%' } }
    ]
  };

  const [dirDeleted, hunterDeleted] = await Promise.all([
    JobDirectory.destroy({ where }),
    HunterJob.destroy({ where })
  ]);
  if (dirDeleted || hunterDeleted) {
    console.log(
      `✓ [JobHub] Menghapus sisa tautan mati/pencarian: direktori ${dirDeleted}, hunter ${hunterDeleted}`
    );
  }
  return dirDeleted;
}

async function purgeStaleDirectoryJobs() {
  const purged = await JobDirectory.destroy({ where: staleDirectoryWhere() });
  if (purged) {
    console.log(
      `✓ [JobHub] Menghapus ${purged} loker lebih dari ${PURGE_AFTER_DAYS} hari (posted_at < now-${PURGE_AFTER_DAYS}d, atau createdAt/updatedAt jika posted_at null)`
    );
  }
  return purged;
}

const SEARCH_URL_EXCLUDE = {
  [Op.and]: [
    { [Op.notILike]: '%/opportunities/jobs/explore%' },
    { [Op.notILike]: '%linkedin.com/jobs/search/%' },
    { [Op.notILike]: '%/job-search/%' },
    { [Op.notILike]: '%loker?search=%' },
    { [Op.notILike]: '%jobs?keyword=%' },
    { [Op.notILike]: '%glints.com%' },
    { [Op.notILike]: '%jobstreet.%' },
    { [Op.notILike]: '%indeed.%' },
    { [Op.notILike]: '%kalibrr.com%' }
  ]
};

/**
 * Seed or Sync Multi-Platform Jobs from live feeds into PostgreSQL
 */
export async function seedOrSyncDirectoryJobs() {
  console.log(`🔄 [JobHub] Memulai sinkronisasi lowongan komprehensif dari ${INGEST_WINDOW_DAYS} hari terakhir...`);

  try {
    const before = await JobDirectory.count();
    const purgedDead = await purgeDeadAndSearchListings();
    const purgedStale = await purgeStaleDirectoryJobs();

    const [
      linkedInJobs,
      disnakerjaJobs,
      remotiveJobs,
      arbeitJobs,
      deallsJobs,
      jobicyJobs,
      himalayasJobs,
      remoteOkJobs,
      karirJakartaJobs,
      karirhubJobs,
      toplokerJobs,
      karirlinkJobs
    ] = await Promise.all([
      fetchLinkedInLiveJobs8Days(),
      fetchDisnakerjaScraper(),
      fetchRemotiveJobs(),
      fetchArbeitnowJobs(),
      fetchDeallsJobs(),
      fetchJobicyJobs(),
      fetchHimalayasJobs(),
      fetchRemoteOkJobs(),
      fetchKarirJakartaJobs(),
      fetchKarirhubJobs(),
      fetchToplokerJobs(),
      fetchKarirlinkJobs()
    ]);

    const allSources = [
      ...linkedInJobs,
      ...deallsJobs,
      ...disnakerjaJobs,
      ...karirJakartaJobs,
      ...karirhubJobs,
      ...toplokerJobs,
      ...karirlinkJobs,
      ...remotiveJobs,
      ...arbeitJobs,
      ...jobicyJobs,
      ...himalayasJobs,
      ...remoteOkJobs
    ];

    console.log(`📊 [JobHub] Total data terkumpul dari semua kanal: ${allSources.length} lowongan`);

    const rows = filterJobsWithinIngestWindow(allSources)
      .filter((item) => isDirectJobPostingUrl(item.job_url))
      .map((item) => ({
        title: item.title,
        company: item.company,
        location: item.location,
        platform: item.platform,
        platform_badge_color: item.platform_badge_color,
        job_url: item.job_url,
        contact_email: item.contact_email || '',
        salary: item.salary || 'Kompetitif',
        experience_level: item.experience_level || 'Semua Level',
        work_type: item.work_type || 'Full-time',
        category: item.category || 'IT & Software',
        description: item.description,
        requirements: item.requirements || [],
        tags: item.tags || [item.platform, 'Terverifikasi', '8 Hari Terakhir'],
        posted_at: item.posted_at || new Date()
      }));

    const breakdown = {
      linkedIn: linkedInJobs.length,
      dealls: deallsJobs.length,
      disnakerja: disnakerjaJobs.length,
      karirJakarta: karirJakartaJobs.length,
      karirhub: karirhubJobs.length,
      toploker: toplokerJobs.length,
      karirlink: karirlinkJobs.length,
      remote: remotiveJobs.length + arbeitJobs.length + jobicyJobs.length + himalayasJobs.length + remoteOkJobs.length
    };

    if (!rows.length) {
      const totalInDb = await JobDirectory.count({ where: { job_url: SEARCH_URL_EXCLUDE } });
      return {
        success: true,
        total: totalInDb,
        inserted: 0,
        updated: 0,
        before,
        purged_dead: purgedDead,
        purged_stale: purgedStale,
        breakdown
      };
    }

    const existing = await JobDirectory.findAll({
      where: { job_url: { [Op.in]: rows.map((r) => r.job_url) } },
      attributes: ['job_url']
    });
    const existingUrls = new Set(existing.map((e) => e.job_url));
    const inserted = rows.filter((r) => !existingUrls.has(r.job_url)).length;
    const updated = rows.length - inserted;

    await JobDirectory.bulkCreate(rows, {
      updateOnDuplicate: [
        'title', 'company', 'location', 'platform', 'platform_badge_color',
        'contact_email', 'salary', 'experience_level', 'work_type', 'category',
        'description', 'requirements', 'tags', 'posted_at'
      ]
    });

    let purgedUnseenRemote = 0;
    const remoteUrls = rows.filter((r) => r.platform === 'Remote').map((r) => r.job_url);
    if (remoteUrls.length >= 10) {
      purgedUnseenRemote = await JobDirectory.destroy({
        where: {
          platform: 'Remote',
          job_url: { [Op.notIn]: remoteUrls }
        }
      });
      if (purgedUnseenRemote) {
        console.log(
          `✓ [JobHub] Menghapus ${purgedUnseenRemote} loker Remote yang tidak masuk jendela ${INGEST_WINDOW_DAYS} hari`
        );
      }
    }

    const totalInDb = await JobDirectory.count({ where: { job_url: SEARCH_URL_EXCLUDE } });
    const purgedStaleTotal = purgedStale + purgedUnseenRemote;
    console.log(
      `Sinkronisasi selesai. Sebelum: ${before}, Ditambahkan: ${inserted}, Diperbarui: ${updated}, Purge stale: ${purgedStaleTotal}, Total: ${totalInDb}`
    );

    return {
      success: true,
      total: totalInDb,
      inserted,
      updated,
      before,
      purged_dead: purgedDead,
      purged_stale: purgedStaleTotal,
      breakdown
    };
  } catch (err) {
    console.error('❌ [JobHub] Sinkronisasi Gagal:', err);
    throw err;
  }
}

/**
 * Query and filter multi-platform jobs with high limits
 */
export async function getDirectoryJobs({
  search = '',
  platform = '',
  category = '',
  work_type = '',
  location = '',
  experience_level = '',
  page = 1,
  limit = 100
}) {
  const and = [
    { job_url: SEARCH_URL_EXCLUDE },
    recencyListWhere()
  ];

  if (platform && platform !== 'all') {
    and.push({ platform });
  } else {
    and.push({ platform: { [Op.notIn]: ['Glints', 'JobStreet', 'Kalibrr', 'Indeed'] } });
  }

  if (search && search.trim()) {
    const like = `%${search.trim()}%`;
    and.push({
      [Op.or]: [
        { title: { [Op.iLike]: like } },
        { company: { [Op.iLike]: like } },
        { description: { [Op.iLike]: like } },
        { category: { [Op.iLike]: like } },
        { location: { [Op.iLike]: like } }
      ]
    });
  }

  if (category && category !== 'all') and.push({ category });
  if (work_type && work_type !== 'all') and.push({ work_type });
  if (location && location !== 'all') and.push({ location: { [Op.iLike]: `%${location}%` } });
  if (experience_level && experience_level !== 'all') and.push({ experience_level });

  const where = { [Op.and]: and };
  const countWhere = {
    [Op.and]: [
      { job_url: SEARCH_URL_EXCLUDE },
      recencyListWhere(),
      { platform: { [Op.notIn]: ['Glints', 'JobStreet', 'Kalibrr', 'Indeed'] } }
    ]
  };

  const parsedLimit = parseInt(limit, 10) || 100;
  const offset = (page - 1) * parsedLimit;

  const [jobs, total] = await Promise.all([
    JobDirectory.findAll({
      where,
      order: [['posted_at', 'DESC'], ['createdAt', 'DESC']],
      offset,
      limit: parsedLimit
    }),
    JobDirectory.count({ where })
  ]);

  const platformCounts = await JobDirectory.findAll({
    attributes: ['platform', [fn('COUNT', col('id')), 'count']],
    where: countWhere,
    group: ['platform'],
    raw: true
  });

  const countsMap = {
    all: await JobDirectory.count({ where: countWhere })
  };
  platformCounts.forEach((p) => {
    countsMap[p.platform] = parseInt(p.count, 10);
  });

  return {
    jobs: toPublicList(jobs),
    total,
    page,
    totalPages: Math.ceil(total / parsedLimit),
    countsMap
  };
}

export async function seedJobDirectoryIfEmpty() {
  const existing = await JobDirectory.count();
  if (existing > 0) {
    console.log(
      `✓ [JobHub] Direktori sudah berisi ${existing} loker — skip sinkronisasi penuh saat boot (gunakan POST /api/directory/sync untuk refresh).`
    );
    return { skipped: true, total: existing };
  }
  return seedOrSyncDirectoryJobs();
}

export const syncAllJobs = seedOrSyncDirectoryJobs;
