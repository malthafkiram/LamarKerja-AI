import * as cheerio from 'cheerio';

const UUID_RE = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

const SEARCH_HUB_PATTERNS = [
  /\/opportunities\/jobs\/explore(?:\?|$)/i,
  /linkedin\.com\/jobs\/search\//i,
  /\/job-search\//i,
  /dealls\.com\/loker\?search=/i,
  /dealls\.com\/jobs\?keyword=/i,
  /disnakerja\.com\/\?s=/i,
  /weworkremotely\.com\/remote-jobs\/search/i,
  /himalayas\.app\/jobs(?:\/api)?(?:\?|$)/i,
  /remoteok\.com\/?(?:\?|$)/i,
  /remoteok\.com\/remote-jobs\/?(?:\?|$)/i,
  /karir\.jakarta\.go\.id\/jobs(?:\?|$)/i,
  /karir\.jakarta\.go\.id\/karirhub-jobs/i,
  /karir\.jakarta\.go\.id\/job\/autocomplete/i,
  /karirhub\.kemnaker\.go\.id\/lowongan-dalam-negeri\/lowongan(?:\?|$)/i,
  /toploker\.com\/loker\/daftar/i,
  /portal\.karirlink\.id\/jobs(?:\?|$)/i
];

/** Boards that cannot be scraped (WAF / SPA / 403) — never store as apply links. */
const BLOCKED_BOARD_PATTERNS = [
  /glints\.com/i,
  /jobstreet\./i,
  /indeed\./i,
  /kalibrr\.com/i,
  /loker\.id/i,
  /(?:^|\/\/)(?:www\.)?karir\.com\//i
];

export function isSearchHubUrl(url) {
  if (!url || typeof url !== 'string') return true;
  return SEARCH_HUB_PATTERNS.some((re) => re.test(url));
}

export function isBlockedBoardUrl(url) {
  if (!url || typeof url !== 'string') return true;
  return BLOCKED_BOARD_PATTERNS.some((re) => re.test(url));
}

export function isDirectJobPostingUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (!/^https?:\/\//i.test(url)) return false;
  if (isBlockedBoardUrl(url)) return false;
  return !isSearchHubUrl(url);
}

export function isCloudflareChallengeHtml(html) {
  const low = String(html || '').toLowerCase();
  if (!low) return true;
  if (low.includes('just a moment') && low.includes('cloudflare')) return true;
  if (low.includes('cf-challenge') || low.includes('cf-browser-verification')) return true;
  if (low.includes('checking your browser before accessing')) return true;
  return false;
}

function absoluteUrl(href, origin) {
  const raw = String(href || '').split('#')[0].split('?')[0].replace(/\/$/, '');
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (raw.startsWith('/')) return `${origin}${raw}`;
  return '';
}

function mapWorkType(text) {
  const t = String(text || '');
  if (/remote|wfh|jarak jauh|work from home/i.test(t)) return 'Remote / WFH';
  if (/hybrid/i.test(t)) return 'Hybrid';
  if (/part\s*time|paruh/i.test(t)) return 'Part-time';
  if (/intern|magang/i.test(t)) return 'Internship';
  if (/kontrak|contractual|kontraktual/i.test(t)) return 'Contract';
  return 'Full-time';
}

export function parseDeallsJobsFromHtml(html) {
  if (!html || typeof html !== 'string') return [];
  const $ = cheerio.load(html);
  const jobs = [];
  const seen = new Set();

  $('a[href*="/loker/"][href*="~"]').each((_, el) => {
    const href = ($(el).attr('href') || '').split('?')[0].replace(/\/$/, '');
    const pathMatch = href.match(/\/loker\/([^/]+)~([^/]+)$/);
    if (!pathMatch) return;

    const job_url = href.startsWith('http') ? href : `https://dealls.com${href}`;
    if (seen.has(job_url)) return;
    seen.add(job_url);

    const title = $(el).find('h2').first().text().trim() || slugToTitle(pathMatch[1].replace(/-\d+$/, ''));
    const companyFromCard = $(el).find('h2').first().next().text().trim();
    const company = companyFromCard || slugToTitle(pathMatch[2]);

    const cardText = $(el).text().replace(/\s+/g, ' ').trim();
    let location = 'Indonesia';
    $(el).find('span').each((__, span) => {
      const spanText = $(span).text().replace(/\s+/g, ' ').trim();
      const locMatch = spanText.match(/(?:On-site|Onsite|Hybrid|Remote)\s*[•·]\s*(.+)/i);
      if (locMatch) location = locMatch[1].trim();
    });
    const salaryMatch = cardText.match(/Rp[\d.\s–\-]+[\d.]*/);
    const workType = /hybrid/i.test(cardText) ? 'Hybrid' : (/remote/i.test(cardText) ? 'Remote / WFH' : 'Full-time');

    jobs.push({
      title,
      company,
      location: location || 'Indonesia',
      job_url,
      salary: salaryMatch ? salaryMatch[0].trim() : 'Kompetitif',
      work_type: workType,
      experience_level: /fresh/i.test(cardText) ? 'Fresh Graduate' : 'Semua Level'
    });
  });

  return jobs;
}

const KARIRJAKARTA_POSTING_RE = /^https?:\/\/karir\.jakarta\.go\.id\/job\/(?:karirhub\/[0-9a-f-]{36}|[a-z0-9][a-z0-9-]*)$/i;

export function isKarirJakartaPostingUrl(url) {
  const clean = String(url || '').split('?')[0].replace(/\/$/, '');
  if (/\/job\/autocomplete$/i.test(clean) || /\/job\/karirhub$/i.test(clean)) return false;
  return KARIRJAKARTA_POSTING_RE.test(clean);
}

export function parseKarirJakartaJobsFromHtml(html) {
  if (!html || typeof html !== 'string') return [];
  const $ = cheerio.load(html);
  const jobs = [];
  const seen = new Set();

  $('a[href*="/job/"]').each((_, el) => {
    const job_url = absoluteUrl($(el).attr('href'), 'https://karir.jakarta.go.id');
    if (!isKarirJakartaPostingUrl(job_url) || seen.has(job_url)) return;
    seen.add(job_url);

    const title = $(el).find('.tw-text-lg, span.tw-font-medium').first().text().replace(/\s+/g, ' ').trim()
      || $(el).find('span').first().text().replace(/\s+/g, ' ').trim();
    const company = $(el).find('.tw-card-title').first().text().replace(/\s+/g, ' ').trim()
      || 'Instansi / Perusahaan DKI Jakarta';
    const rawLocation = $(el).find('.tw-location').first().text().replace(/\s+/g, ' ').trim();
    const location = !rawLocation || /^indonesia$/i.test(rawLocation) ? 'Jakarta / DKI' : rawLocation;
    const cardText = $(el).text().replace(/\s+/g, ' ').trim();
    const salaryMatch = cardText.match(/Gaji:\s*([^\n]+?)(?:\s{2,}|$)/i);
    const salary = salaryMatch ? salaryMatch[1].trim() : 'Kompetitif';

    if (!title) return;
    jobs.push({
      title,
      company,
      location,
      job_url,
      salary: salary && salary !== '-' ? salary : 'Kompetitif',
      work_type: mapWorkType(cardText),
      experience_level: /fresh/i.test(cardText) ? 'Fresh Graduate' : 'Semua Level'
    });
  });

  return jobs;
}

const KARIRHUB_POSTING_RE = new RegExp(
  `^https?:\\/\\/karirhub\\.kemnaker\\.go\\.id\\/lowongan-dalam-negeri\\/lowongan\\/[^/?#]+-${UUID_RE}$`,
  'i'
);

export function parseKarirhubJobsFromHtml(html) {
  if (!html || typeof html !== 'string') return [];
  const $ = cheerio.load(html);
  const jobs = [];
  const seen = new Set();

  $('a[href*="/lowongan-dalam-negeri/lowongan/"]').each((_, el) => {
    const job_url = absoluteUrl($(el).attr('href'), 'https://karirhub.kemnaker.go.id');
    if (!KARIRHUB_POSTING_RE.test(job_url) || seen.has(job_url)) return;
    seen.add(job_url);

    const card = $(el).closest('div').parent();
    const title = $(el).text().replace(/\s+/g, ' ').trim() || slugToTitle(job_url.split('/').pop());
    const company = card.find('p').first().text().replace(/\s+/g, ' ').trim()
      || $(el).parent().next('p').text().replace(/\s+/g, ' ').trim()
      || 'Perusahaan (Karirhub Kemnaker)';
    const cardText = card.text().replace(/\s+/g, ' ').trim();
    const salaryMatch = cardText.match(/Rp[\d.,\sjtJT\-–]+/);

    if (!title) return;
    jobs.push({
      title,
      company: company || 'Perusahaan (Karirhub Kemnaker)',
      location: 'Indonesia',
      job_url,
      salary: salaryMatch ? salaryMatch[0].trim() : 'Kompetitif',
      work_type: mapWorkType(cardText),
      experience_level: 'Semua Level'
    });
  });

  return jobs;
}

const TOPLOKER_POSTING_RE = /^https?:\/\/(?:www\.)?toploker\.com\/lowongan\/\d{4}-\d{2}-\d{2}![^/?#]+$/i;

export function parseToplokerJobsFromHtml(html) {
  if (!html || typeof html !== 'string') return [];
  const $ = cheerio.load(html);
  const jobs = [];
  const seen = new Set();

  $('a[href*="/lowongan/"]').each((_, el) => {
    const job_url = absoluteUrl($(el).attr('href'), 'https://toploker.com');
    if (!TOPLOKER_POSTING_RE.test(job_url) || seen.has(job_url)) return;
    seen.add(job_url);

    const card = $(el).closest('.card');
    const slug = job_url.split('/lowongan/')[1] || '';
    const [left, companySlug] = slug.split('!di!');
    const titleFromSlug = slugToTitle((left || '').replace(/^\d{4}-\d{2}-\d{2}!/, '').replace(/-\d+$/, ''));
    const companyFromSlug = slugToTitle(companySlug || '');
    const title = card.find('.text-capitalize').first().text().replace(/\s+/g, ' ').trim() || titleFromSlug;
    const company = card.find('.text-uppercase').first().text().replace(/\s+/g, ' ').trim() || companyFromSlug || 'Perusahaan (Toploker)';
    const cardText = card.text().replace(/\s+/g, ' ').trim();
    const locIcon = card.find('.fa-map-marked-alt').parent().text().replace(/\s+/g, ' ').trim();
    const dateMatch = (left || '').match(/^(\d{4}-\d{2}-\d{2})/);
    const postedFromUrl = dateMatch ? new Date(`${dateMatch[1]}T00:00:00Z`) : null;
    const posted_at = postedFromUrl && !Number.isNaN(postedFromUrl.getTime()) ? postedFromUrl : undefined;

    if (!title) return;
    jobs.push({
      title,
      company,
      location: locIcon || 'Indonesia',
      job_url,
      salary: /Rp[\d.,\s]+/.test(cardText) ? cardText.match(/Rp[\d.,\s]+/)[0].trim() : 'Kompetitif',
      work_type: mapWorkType(cardText),
      experience_level: /fresh/i.test(cardText) ? 'Fresh Graduate' : 'Semua Level',
      posted_at
    });
  });

  return jobs;
}

const KARIRLINK_POSTING_RE = /^https?:\/\/portal\.karirlink\.id\/jobs\/[a-z0-9][a-z0-9-]+$/i;

export function parseKarirlinkJobsFromHtml(html) {
  if (!html || typeof html !== 'string') return [];
  const $ = cheerio.load(html);
  const jobs = [];
  const seen = new Set();

  $('a.front-vacancy__card[href*="/jobs/"], a[href*="portal.karirlink.id/jobs/"]').each((_, el) => {
    const job_url = absoluteUrl($(el).attr('href'), 'https://portal.karirlink.id');
    if (!KARIRLINK_POSTING_RE.test(job_url) || seen.has(job_url)) return;
    seen.add(job_url);

    const title = $(el).find('.front-vacancy__card-title').first().text().replace(/\s+/g, ' ').trim()
      || slugToTitle(job_url.split('/jobs/')[1]);
    const company = $(el).find('.front-vacancy__company').first().text().replace(/\s+/g, ' ').trim()
      || 'Perusahaan (Karirlink)';
    const location = $(el).find('.front-vacancy__card-text').first().text().replace(/\s+/g, ' ').trim()
      || 'Indonesia';
    const cardText = $(el).text().replace(/\s+/g, ' ').trim();

    if (!title) return;
    jobs.push({
      title,
      company,
      location,
      job_url,
      salary: 'Kompetitif',
      work_type: mapWorkType(cardText),
      experience_level: /intern|magang/i.test(cardText) ? 'Fresh Graduate' : 'Semua Level'
    });
  });

  return jobs;
}

export function parseDisnakerjaFeedXml(xml) {
  if (!xml || typeof xml !== 'string') return [];
  const $ = cheerio.load(xml, { xml: true });
  const jobs = [];
  const seen = new Set();

  $('item').each((_, el) => {
    const job_url = $(el).find('link').first().text().trim();
    if (!isDirectJobPostingUrl(job_url) || seen.has(job_url)) return;
    seen.add(job_url);

    const title = $(el).find('title').first().text().trim();
    const desc = $(el).find('description').first().text().replace(/<[^>]*>?/gm, '').trim();
    const pubDate = $(el).find('pubDate').first().text().trim();
    const categories = $(el).find('category').map((__, cat) => $(cat).text().trim()).get();
    const location = categories.find((c) => /(jawa|jakarta|sumatera|bali|kalimantan|sulawesi|papua|indonesia)/i.test(c))
      || 'Indonesia (Nasional)';
    const workType = categories.find((c) => /full\s*time|part\s*time|remote|kontrak/i.test(c)) || 'Full Time';

    if (!title) return;
    jobs.push({
      title: title.startsWith('Lowongan') ? title : `Lowongan ${title}`,
      company: title.replace(/^Lowongan Kerja\s+/i, '').trim() || 'Perusahaan Terkemuka / BUMN',
      location,
      job_url,
      salary: 'Standar BUMN / Industri Nasional',
      work_type: mapWorkType(workType),
      experience_level: categories.some((c) => /fresh/i.test(c)) ? 'Fresh Graduate' : 'Semua Level',
      description: desc,
      posted_at: pubDate ? new Date(pubDate) : new Date(),
      tags: ['BUMN', 'Disnakerja', 'Nasional', ...categories.slice(0, 2)]
    });
  });

  return jobs;
}

function slugToTitle(slug) {
  return String(slug || '')
    .replace(/-\d+$/, '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function himalayasPostedAt(pubDate) {
  if (pubDate == null || pubDate === '') return new Date();
  const n = Number(pubDate);
  if (Number.isFinite(n) && n > 0) {
    return new Date(n < 1e12 ? n * 1000 : n);
  }
  const parsed = new Date(pubDate);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function himalayasLocation(job) {
  const locs = Array.isArray(job?.locationRestrictions) ? job.locationRestrictions : [];
  const names = locs
    .map((item) => (typeof item === 'string' ? item : item?.name || ''))
    .map((name) => String(name).trim())
    .filter(Boolean);
  if (!names.length) return '100% Worldwide Remote';
  return `Remote / ${names.slice(0, 3).join(', ')}`;
}

function himalayasCategory(job) {
  const blob = [
    ...(Array.isArray(job?.parentCategories) ? job.parentCategories : []),
    ...(Array.isArray(job?.categories) ? job.categories : []),
    job?.title || ''
  ].join(' ').toLowerCase().replace(/-/g, ' ');

  if (/(market|sales|business)/i.test(blob)) return 'Marketing & Sales';
  if (/(design|ux|ui|creative)/i.test(blob)) return 'Design & Kreatif';
  if (/(finance|account|billing|legal|tax|audit)/i.test(blob)) return 'Finance';
  if (/(human resource|\bhr\b|admin|customer service|operations)/i.test(blob)) return 'Admin & HR';
  if (/(developer|engineer|software|programmer|devops|\bit\b|data|qa)/i.test(blob)) return 'IT & Software';
  return 'IT & Software';
}

function himalayasSalary(job) {
  const currency = job?.currency || 'USD';
  const period = job?.salaryPeriod || 'annual';
  if (job?.minSalary && job?.maxSalary) {
    return `${currency} ${job.minSalary}–${job.maxSalary} / ${period}`.trim();
  }
  if (job?.minSalary) return `${currency} ${job.minSalary}+ / ${period}`.trim();
  if (job?.maxSalary) return `${currency} up to ${job.maxSalary} / ${period}`.trim();
  return 'Kompetitif (USD)';
}

function himalayasExperience(job) {
  if (Array.isArray(job?.seniority) && job.seniority[0]) return job.seniority[0];
  if (typeof job?.seniority === 'string' && job.seniority) return job.seniority;
  return 'Semua Level';
}

/**
 * Map Himalayas public jobs API payload onto job_directories rows.
 * Uses applicationLink as the posting URL; drops listings without a real posting.
 */
export function mapHimalayasJobs(payload) {
  const jobs = Array.isArray(payload?.jobs) ? payload.jobs : [];
  const mapped = [];
  const seen = new Set();

  for (const job of jobs) {
    const job_url = String(job?.applicationLink || '').trim();
    if (!isDirectJobPostingUrl(job_url) || seen.has(job_url)) continue;
    seen.add(job_url);

    const descriptionSource = job.excerpt || String(job.description || '').replace(/<[^>]*>?/gm, '');
    mapped.push({
      title: job.title,
      company: job.companyName,
      location: himalayasLocation(job),
      platform: 'Remote',
      platform_badge_color: '#06B6D4',
      job_url,
      contact_email: '',
      salary: himalayasSalary(job),
      experience_level: himalayasExperience(job),
      work_type: 'Remote / WFH',
      category: himalayasCategory(job),
      description: String(descriptionSource || '').slice(0, 300),
      requirements: (Array.isArray(job.categories) ? job.categories : []).slice(0, 4),
      tags: ['Remote', 'Luar Negeri', 'Himalayas'],
      posted_at: himalayasPostedAt(job.pubDate)
    });
  }

  return mapped;
}

function remoteOkPostedAt(job) {
  if (job?.date) {
    const parsed = new Date(job.date);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (job?.epoch) {
    const n = Number(job.epoch);
    const ms = n > 1e12 ? n : n * 1000;
    const parsed = new Date(ms);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function remoteOkSalary(job) {
  if (job?.salary_min && job?.salary_max) {
    return `USD ${job.salary_min}–${job.salary_max}`;
  }
  if (job?.salary_min) return `USD ${job.salary_min}+`;
  return 'Kompetitif (USD)';
}

/**
 * Map Remote OK public JSON API (https://remoteok.com/api).
 * First array item is a legal/credit banner and must be skipped.
 * Uses job.url (Remote OK posting page), never search-index URLs.
 */
export function mapRemoteOkJobs(payload) {
  const rows = Array.isArray(payload) ? payload : [];
  const mapped = [];
  const seen = new Set();

  for (const job of rows) {
    if (!job || job.legal) continue;
    const title = String(job.position || '').trim();
    const company = String(job.company || '').trim();
    if (!title && !company) continue;

    const job_url = String(job.url || '').trim();
    if (!isDirectJobPostingUrl(job_url) || seen.has(job_url)) continue;
    seen.add(job_url);

    const tags = Array.isArray(job.tags) ? job.tags.map(String) : [];
    const descriptionSource = String(job.description || '').replace(/<[^>]*>?/gm, '');

    mapped.push({
      title: title || slugToTitle(job.slug || 'remote-role'),
      company: company || 'Remote company',
      location: job.location ? `Remote / ${job.location}` : '100% Worldwide Remote',
      platform: 'Remote',
      platform_badge_color: '#FF4742',
      job_url,
      contact_email: '',
      salary: remoteOkSalary(job),
      experience_level: 'Semua Level',
      work_type: 'Remote / WFH',
      category: himalayasCategory({ title, categories: tags, parentCategories: tags }),
      description: descriptionSource.slice(0, 300),
      requirements: tags.slice(0, 4),
      tags: ['Remote', 'Luar Negeri', 'Remote OK'],
      posted_at: remoteOkPostedAt(job)
    });
  }

  return mapped;
}
