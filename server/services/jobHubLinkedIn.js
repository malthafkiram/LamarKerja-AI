import axios from 'axios';
import * as cheerio from 'cheerio';

export const LIVE_SEARCH_MIN_CHARS = 3;
export const LIVE_SEARCH_TTL_MS = 15 * 60 * 1000;
export const LIVE_SEARCH_PAGE_STARTS = [0, 10, 20, 30];

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizeLiveSearchQuery(raw) {
  return String(raw || '').replace(/\s+/g, ' ').trim().slice(0, 80);
}

export function shouldLiveIngestSearch(query, { page = 1, platform = 'all' } = {}) {
  const keyword = normalizeLiveSearchQuery(query);
  if (keyword.length < LIVE_SEARCH_MIN_CHARS) return false;
  if (Number(page) !== 1) return false;
  const board = platform || 'all';
  return board === 'all' || board === 'LinkedIn';
}

export function buildLinkedInGuestSearchUrl(keyword, start = 0) {
  const kw = normalizeLiveSearchQuery(keyword);
  return `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(kw)}&location=Indonesia&f_TPR=r691200&start=${Number(start) || 0}`;
}

function inferLinkedInCategory(title, kw) {
  const lowerTitle = `${title} ${kw}`.toLowerCase();
  if (lowerTitle.includes('market') || lowerTitle.includes('sales') || lowerTitle.includes('business dev')) {
    return 'Marketing & Sales';
  }
  if (lowerTitle.includes('admin') || lowerTitle.includes('hr') || lowerTitle.includes('human resource') || lowerTitle.includes('recruiter')) {
    return 'Admin & HR';
  }
  if (lowerTitle.includes('finance') || lowerTitle.includes('account') || lowerTitle.includes('tax') || lowerTitle.includes('audit')) {
    return 'Finance';
  }
  if (lowerTitle.includes('design') || lowerTitle.includes('ux') || lowerTitle.includes('creative') || lowerTitle.includes('graphic')) {
    return 'Design & Kreatif';
  }
  if (lowerTitle.includes('bumn')) return 'BUMN & Instansi';
  return 'IT & Software';
}

export function parseLinkedInGuestCards(html, kw, seenUrls = new Set()) {
  const jobs = [];
  const $ = cheerio.load(String(html || ''));
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

    if (!title || !company || !link) return;
    link = link.split('?')[0];
    if (seenUrls.has(link)) return;
    seenUrls.add(link);

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
      work_type: location.toLowerCase().includes('remote')
        ? 'Remote / WFH'
        : (location.toLowerCase().includes('hybrid') ? 'Hybrid' : 'Full-time'),
      category: inferLinkedInCategory(title, kw),
      description: `Lowongan kerja posisi ${title} di ${company} (${location || 'Indonesia'}). Diposting ${timeAgo || 'dalam 8 hari terakhir'} di LinkedIn.`,
      requirements: [kw, 'Pengalaman Relevan', 'Komunikasi Baik', 'Portofolio / CV Terkini'],
      tags: ['LinkedIn', kw, timeAgo || '8 Hari Terakhir', 'Terverifikasi'],
      posted_at
    });
  });
  return jobs;
}

export function createLiveSearchCache() {
  const map = new Map();
  return {
    isFresh(key, now, ttl = LIVE_SEARCH_TTL_MS) {
      const ts = map.get(key);
      if (!ts) return false;
      return now - ts < ttl;
    },
    touch(key, now) {
      map.set(key, now);
    }
  };
}

export const liveSearchCache = createLiveSearchCache();

async function defaultFetchHtml(url) {
  const res = await axios.get(url, {
    headers: BROWSER_HEADERS,
    timeout: 8000
  });
  return String(res.data || '');
}

export async function collectLinkedInJobsForKeyword(keyword, {
  fetchHtml = defaultFetchHtml,
  pageStarts = [0, 10],
  sleepFn = sleep,
  delayMs = 180,
  seenUrls = new Set()
} = {}) {
  const jobs = [];
  const kw = normalizeLiveSearchQuery(keyword);
  if (!kw) return jobs;

  for (const start of pageStarts) {
    try {
      const html = await fetchHtml(buildLinkedInGuestSearchUrl(kw, start));
      const batch = parseLinkedInGuestCards(html, kw, seenUrls);
      jobs.push(...batch);
      if (batch.length === 0) break;
    } catch (err) {
      console.warn(`LinkedIn keyword "${kw}" start=${start} note:`, err.message);
      break;
    }
    await sleepFn(delayMs);
  }
  return jobs;
}

export async function ingestLinkedInLiveSearch(query, {
  fetchHtml = defaultFetchHtml,
  persistJobs,
  cache = liveSearchCache,
  now = Date.now(),
  pageStarts = LIVE_SEARCH_PAGE_STARTS,
  sleepFn = sleep
} = {}) {
  const keyword = normalizeLiveSearchQuery(query);
  if (keyword.length < LIVE_SEARCH_MIN_CHARS) {
    return { attempted: false, skipped: 'short', keyword, fetched: 0, inserted: 0, updated: 0 };
  }
  if (cache?.isFresh?.(keyword, now)) {
    return { attempted: false, skipped: 'cache', keyword, fetched: 0, inserted: 0, updated: 0 };
  }

  const jobs = await collectLinkedInJobsForKeyword(keyword, {
    fetchHtml,
    pageStarts,
    sleepFn
  });
  const saved = persistJobs
    ? await persistJobs(jobs)
    : { inserted: jobs.length, updated: 0 };
  cache?.touch?.(keyword, now);
  return {
    attempted: true,
    skipped: false,
    keyword,
    fetched: jobs.length,
    inserted: saved.inserted || 0,
    updated: saved.updated || 0
  };
}
