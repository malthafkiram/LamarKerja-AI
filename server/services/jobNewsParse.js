/**
 * Pure helpers for Google News RSS: parse, filter, classify, dedup.
 * Network I/O lives in jobNewsService.js.
 */
import * as cheerio from 'cheerio';
import { coercePostedAt, isWithinIngestWindow } from './jobHubWindow.js';

export const GOOGLE_NEWS_QUERIES = [
  'lowongan kerja',
  '"buka lowongan" OR "membuka lowongan" OR rekrutmen',
  'magang OR internship OR "program magang" OR MSIB OR "Kampus Merdeka"',
  '"buka magang" OR "lowongan magang"',
  '(BUMN OR CPNS OR PPPK) AND (rekrutmen OR lowongan OR formasi)'
];

/** Official RSS only (not HTML scrape, not Glints/JobStreet). Used if Google News is empty/blocked. */
export const FALLBACK_NEWS_FEEDS = [
  { url: 'https://www.disnakerja.com/feed/', label: 'Disnakerja' },
  { url: 'https://www.antaranews.com/rss/ekonomi', label: 'ANTARA Ekonomi' }
];

export function looksLikeRssXml(body) {
  const raw = String(body || '');
  if (!raw.trim()) return false;
  const head = raw.slice(0, 2000);
  const hasRss = /<(rss|feed|rdf:RDF)[\s>]/i.test(raw);
  const hasItem = /<(item|entry)[\s>]/i.test(raw);
  const htmlDoc = /<html[\s>]/i.test(head);
  if (htmlDoc && !hasRss) return false;
  return hasRss || hasItem;
}

const KEEP_RE =
  /\b(lowongan|loker|rekrutmen|rekrut|magang|internship|\binterns?\b|hiring|buka posisi|msib|kampus merdeka|cpns|pppk|membuka lowongan|buka lowongan|program magang|penerimaan pegawai|formasi)\b/i;

const MAGANG_RE =
  /\b(magang|internship|\binterns?\b|msib|kampus merdeka|program magang|lowongan magang|buka magang)\b/i;

const LOKER_RE =
  /\b(lowongan|loker|rekrutmen|hiring|buka posisi|cpns|pppk|membuka lowongan|buka lowongan|penerimaan pegawai|formasi)\b/i;

const HIRING_STRONG_RE =
  /\b(buka lowongan|membuka lowongan|rekrutmen|hiring|buka posisi|membuka magang|lowongan magang|buka magang|formasi cpns|formasi pppk)\b/i;

const GENERIC_COMPANY_RE =
  /^(indonesia|pemerintah|bumn|kementerian|google news|kompas|detik|cnbc|antara|news|hrd|karir)$/i;

export function googleNewsRssUrl(query, { when = '8d' } = {}) {
  const q = when ? `${query} when:${when}` : query;
  return `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=id&gl=ID&ceid=ID:id`;
}

export function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function calendarDayJakarta(date, now = new Date()) {
  const d = date instanceof Date ? date : new Date(date || now);
  const safe = Number.isNaN(d.getTime()) ? now : d;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(safe);
}

export function normalizeTitle(title) {
  return String(title || '')
    .replace(/\s*[-–—|]\s*[^|-]+$/, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function canonicalizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  try {
    const parsed = new URL(url.trim());
    parsed.hash = '';
    parsed.hostname = parsed.hostname.toLowerCase();
    const drop = [];
    parsed.searchParams.forEach((_, key) => {
      if (/^utm_/i.test(key) || key === 'fbclid' || key === 'gclid') drop.push(key);
    });
    drop.forEach((key) => parsed.searchParams.delete(key));
    let href = parsed.toString();
    if (href.endsWith('/') && parsed.pathname !== '/') href = href.slice(0, -1);
    return href;
  } catch {
    return String(url).trim();
  }
}

function extractSourceFromTitle(title) {
  const m = String(title || '').match(/\s[-–—]\s+(.+)$/);
  return m ? m[1].trim() : '';
}

function stripSourceSuffix(title, source) {
  const t = String(title || '').trim();
  if (!t) return '';
  if (source) {
    const re = new RegExp(`\\s*[-–—]\\s*${escapeRegExp(source)}\\s*$`, 'i');
    const stripped = t.replace(re, '').trim();
    if (stripped) return stripped;
  }
  return t.replace(/\s*[-–—]\s+[^-–—|]{2,40}$/, '').trim() || t;
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractArticleUrl(descriptionHtml, rssLink) {
  const html = String(descriptionHtml || '');
  if (html) {
    const $ = cheerio.load(`<div>${html}</div>`);
    const hrefs = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) hrefs.push(href);
    });
    const original = hrefs.find((h) => /^https?:\/\//i.test(h) && !/news\.google\.com/i.test(h));
    if (original) return canonicalizeUrl(original);
    const google = hrefs.find((h) => /^https?:\/\//i.test(h));
    if (google) return canonicalizeUrl(google);
  }
  return canonicalizeUrl(rssLink);
}

export function classifyNewsKind(title, snippet = '', url = '') {
  const text = `${title} ${snippet} ${url}`;
  const magang = MAGANG_RE.test(text);
  const loker = LOKER_RE.test(text);
  if (magang && loker) return 'mixed';
  if (magang) return 'magang';
  return 'loker';
}

export function shouldKeepNews(title, snippet = '', url = '') {
  const text = `${title} ${snippet} ${url}`;
  if (/we decided to move forward/i.test(text)) return false;
  if (!KEEP_RE.test(text)) return false;

  const hiringStrong = HIRING_STRONG_RE.test(text) || KEEP_RE.test(text);
  const phkPrimary = /\b(phk massal|phk|layoff|dirumahkan|pemutusan hubungan kerja)\b/i.test(text);
  if (phkPrimary && !HIRING_STRONG_RE.test(text)) return false;

  if (
    /\b(saham|ihsg|dividen|\bipo\b|kapitalisasi pasar)\b/i.test(text) &&
    !/\b(lowongan|rekrutmen|magang|internship|hiring|cpns|pppk|formasi)\b/i.test(text)
  ) {
    return false;
  }

  if (
    /\b(liga 1|timnas|piala dunia|olimpiade|sea games|badminton|sepak bola|formula 1)\b/i.test(text) &&
    !hiringStrong
  ) {
    return false;
  }

  if (
    /\b(unjuk rasa|demo mahasiswa|aksi massa|pilpres|pileg|kampanye politik)\b/i.test(text) &&
    !HIRING_STRONG_RE.test(text)
  ) {
    return false;
  }

  return true;
}

export function guessCompany(title, snippet = '') {
  const titleStr = String(title || '').trim();
  const blob = `${titleStr} ${snippet || ''}`;

  const pt = blob.match(/\bPT\.?\s+([A-Za-z0-9][A-Za-z0-9&.,' -]{1,42})/i);
  if (pt) {
    const name = cleanCompany(`PT ${pt[1]}`);
    if (name) return name;
  }

  const opens = titleStr.match(
    /^([A-Z][A-Za-z0-9&. ]{2,42}?)\s+(?:buka|membuka)\s+(?:lowongan|magang|rekrutmen)/i
  );
  if (opens) {
    const name = cleanCompany(opens[1]);
    if (name) return name;
  }

  const di = blob.match(/\b(?:di|pada)\s+(PT\.?\s+)?([A-Z][A-Za-z0-9&. ]{2,35})/);
  if (di) {
    const name = cleanCompany(`${di[1] || ''}${di[2]}`);
    if (name) return name;
  }

  return null;
}

function cleanCompany(raw) {
  let name = String(raw || '')
    .replace(/\s+/g, ' ')
    .replace(/[,:;].*$/, '')
    .replace(/\s+(buka|membuka|untuk|bagi|tahun|202\d).*$/i, '')
    .trim();
  if (name.length < 3 || name.length > 48) return null;
  if (GENERIC_COMPANY_RE.test(name)) return null;
  if (KEEP_RE.test(name) && !/^PT\.?\s/i.test(name)) return null;
  return name;
}

export function parseGoogleNewsRss(xml, rawQuery = '', now = new Date()) {
  if (!xml || typeof xml !== 'string') return [];
  const $ = cheerio.load(xml, { xml: true });
  const items = [];

  $('item').each((_, el) => {
    const $el = $(el);
    const rawTitle = $el.find('title').first().text().trim();
    const rssLink = $el.find('link').first().text().trim();
    const pubDateRaw = $el.find('pubDate').first().text().trim();
    const sourceEl = $el.find('source').first();
    const source = sourceEl.text().trim() || extractSourceFromTitle(rawTitle);
    const descHtml = $el.find('description').first().text() || $el.find('description').first().html() || '';
    const url = extractArticleUrl(descHtml, rssLink);
    const snippet = stripHtml(descHtml).slice(0, 420);
    const title = stripSourceSuffix(rawTitle, source);
    const published_at = coercePostedAt(pubDateRaw ? new Date(pubDateRaw) : now, now);

    if (!title || !url) return;
    items.push({
      title,
      source,
      url,
      published_at,
      snippet,
      raw_query: rawQuery,
      company_guess: guessCompany(title, snippet),
      kind: classifyNewsKind(title, snippet, url)
    });
  });

  return items;
}

export function filterAndClassifyNews(items, now = new Date()) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => shouldKeepNews(item.title, item.snippet, item.url))
    .filter((item) => isWithinIngestWindow(item.published_at, now))
    .map((item) => ({
      ...item,
      kind: classifyNewsKind(item.title, item.snippet, item.url),
      url: canonicalizeUrl(item.url) || item.url
    }));
}

export function dedupeNewsItems(items) {
  const seenUrl = new Set();
  const seenTitleDay = new Set();
  const out = [];

  for (const item of Array.isArray(items) ? items : []) {
    const urlKey = canonicalizeUrl(item.url) || item.url;
    if (!urlKey || seenUrl.has(urlKey)) continue;
    const day = calendarDayJakarta(item.published_at);
    const titleKey = `${normalizeTitle(item.title)}|${day}`;
    if (!normalizeTitle(item.title) || seenTitleDay.has(titleKey)) continue;
    seenUrl.add(urlKey);
    seenTitleDay.add(titleKey);
    out.push({ ...item, url: urlKey });
  }

  return out;
}
