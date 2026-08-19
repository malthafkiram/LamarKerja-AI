/**
 * Agregasi berita loker & magang dari Google News RSS (bukan scrape HTML portal berita).
 */
import { Op } from 'sequelize';
import axios from 'axios';
import JobNews from '../models/JobNews.js';
import JobDirectory from '../models/JobDirectory.js';
import { toPublicList } from '../views/serialize.js';
import { isDirectJobPostingUrl } from './jobHubParsers.js';
import { PURGE_AFTER_DAYS, purgeCutoffDate } from './jobHubWindow.js';
import {
  FALLBACK_NEWS_FEEDS,
  GOOGLE_NEWS_QUERIES,
  calendarDayJakarta,
  dedupeNewsItems,
  filterAndClassifyNews,
  googleNewsRssUrl,
  looksLikeRssXml,
  normalizeTitle,
  parseGoogleNewsRss
} from './jobNewsParse.js';

const NEWS_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/rss+xml, application/xml, text/xml, */*',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
};

function newsRecencyWhere(now = new Date()) {
  const cutoff = purgeCutoffDate(now);
  return {
    [Op.or]: [
      { published_at: { [Op.gte]: cutoff } },
      { published_at: { [Op.is]: null }, createdAt: { [Op.gte]: cutoff } }
    ]
  };
}

function jobRecencyWhere(now = new Date()) {
  const cutoff = purgeCutoffDate(now);
  return {
    [Op.or]: [
      { posted_at: { [Op.gte]: cutoff } },
      { posted_at: { [Op.is]: null }, createdAt: { [Op.gte]: cutoff } }
    ]
  };
}

async function fetchRssXml(url) {
  try {
    const res = await axios.get(url, {
      headers: NEWS_HEADERS,
      timeout: 12000,
      responseType: 'text',
      maxRedirects: 5,
      validateStatus: (status) => status < 500
    });
    if (res.status !== 200) {
      console.warn(`[JobNews] ${url}: HTTP ${res.status} — lewati`);
      return null;
    }
    const xml = String(res.data || '');
    if (!looksLikeRssXml(xml)) {
      console.warn(
        `[JobNews] ${url}: bukan RSS (HTML/consent, ${xml.length} byte) — lewati`
      );
      return null;
    }
    return xml;
  } catch (err) {
    console.warn(`[JobNews] gagal fetch ${url}:`, err.message);
    return null;
  }
}

async function attachMatchedJobs(records) {
  const items = toPublicList(records);
  const guesses = [
    ...new Set(
      items
        .map((item) => String(item.company_guess || '').trim())
        .filter((name) => name.length >= 4)
    )
  ];
  if (!guesses.length) {
    return items.map((item) => ({ ...item, matched_job: null }));
  }

  const jobs = await JobDirectory.findAll({
    where: {
      [Op.and]: [
        jobRecencyWhere(),
        {
          [Op.or]: guesses.map((name) => ({
            company: { [Op.iLike]: `%${name.replace(/[%_]/g, '')}%` }
          }))
        }
      ]
    },
    attributes: ['id', 'title', 'company', 'job_url', 'platform'],
    order: [['posted_at', 'DESC']],
    limit: 250
  });

  const liveJobs = jobs.filter((job) => isDirectJobPostingUrl(job.job_url));

  return items.map((item) => {
    const guess = String(item.company_guess || '').trim().toLowerCase();
    if (!guess) return { ...item, matched_job: null };
    const hit = liveJobs.find((job) => {
      const company = String(job.company || '').toLowerCase();
      return company.includes(guess) || guess.includes(company);
    });
    if (!hit) return { ...item, matched_job: null };
    return {
      ...item,
      matched_job: {
        id: hit.id,
        title: hit.title,
        company: hit.company,
        job_url: hit.job_url,
        platform: hit.platform
      }
    };
  });
}

/**
 * Fetch Google News RSS for loker + magang, upsert, prune stale.
 * Soft-fails to an error object instead of throwing when sources are blocked.
 */
export async function syncJobNews(now = new Date()) {
  console.log('📰 [JobNews] Mengambil berita loker & magang (Google News RSS)...');

  const collected = [];
  const queryErrors = [];
  const fallbackUsed = [];

  const fetches = await Promise.all(
    GOOGLE_NEWS_QUERIES.map(async (query) => {
      const url = googleNewsRssUrl(query);
      const xml = await fetchRssXml(url);
      if (!xml) {
        queryErrors.push(query);
        return [];
      }
      const parsed = parseGoogleNewsRss(xml, query, now);
      console.log(`[JobNews] Google "${query}": ${parsed.length} item`);
      return parsed;
    })
  );

  for (const batch of fetches) collected.push(...batch);

  let filtered = dedupeNewsItems(filterAndClassifyNews(collected, now));
  console.log(`[JobNews] Google: fetched ${collected.length}, kept ${filtered.length}`);

  if (!filtered.length) {
    console.warn('[JobNews] Google News kosong/diblokir — coba RSS cadangan resmi');
    const fallbackBatches = await Promise.all(
      FALLBACK_NEWS_FEEDS.map(async (feed) => {
        const xml = await fetchRssXml(feed.url);
        if (!xml) {
          queryErrors.push(feed.label || feed.url);
          return [];
        }
        const parsed = parseGoogleNewsRss(xml, feed.label || feed.url, now);
        console.log(`[JobNews] fallback ${feed.label}: ${parsed.length} item`);
        if (parsed.length) fallbackUsed.push(feed.label);
        return parsed;
      })
    );
    for (const batch of fallbackBatches) collected.push(...batch);
    filtered = dedupeNewsItems(filterAndClassifyNews(collected, now));
    console.log(`[JobNews] Setelah fallback: fetched ${collected.length}, kept ${filtered.length}`);
  }

  const staleWhere = {
    [Op.or]: [
      { published_at: { [Op.lt]: purgeCutoffDate(now) } },
      {
        published_at: { [Op.is]: null },
        createdAt: { [Op.lt]: purgeCutoffDate(now) }
      }
    ]
  };
  const purged = await JobNews.destroy({ where: staleWhere });

  let inserted = 0;
  let updated = 0;

  if (filtered.length) {
    const urls = filtered.map((row) => row.url);
    const existing = await JobNews.findAll({
      where: { url: { [Op.in]: urls } },
      attributes: ['url', 'title', 'published_at']
    });
    const existingUrls = new Set(existing.map((row) => row.url));

    const existingTitleDays = new Set(
      (await JobNews.findAll({
        where: newsRecencyWhere(now),
        attributes: ['title', 'published_at']
      })).map((row) => `${normalizeTitle(row.title)}|${calendarDayJakarta(row.published_at, now)}`)
    );

    const rows = [];
    for (const item of filtered) {
      const titleDay = `${normalizeTitle(item.title)}|${calendarDayJakarta(item.published_at, now)}`;

      if (!existingUrls.has(item.url) && existingTitleDays.has(titleDay)) continue;
      existingTitleDays.add(titleDay);
      rows.push({
        title: item.title.slice(0, 255),
        source: (item.source || '').slice(0, 255),
        url: item.url,
        published_at: item.published_at,
        snippet: item.snippet || '',
        kind: item.kind,
        company_guess: item.company_guess || null,
        raw_query: (item.raw_query || '').slice(0, 255)
      });
    }

    inserted = rows.filter((row) => !existingUrls.has(row.url)).length;
    updated = rows.length - inserted;

    if (rows.length) {
      await JobNews.bulkCreate(rows, {
        conflictFields: ['url'],
        updateOnDuplicate: [
          'title',
          'source',
          'published_at',
          'snippet',
          'kind',
          'company_guess',
          'raw_query'
        ]
      });
    }
  }

  const total = await JobNews.count({ where: newsRecencyWhere(now) });
  console.log(
    `✓ [JobNews] Selesai. Ditambahkan: ${inserted}, Diperbarui: ${updated}, Purge >${PURGE_AFTER_DAYS} hari: ${purged}, Total: ${total}`
  );

  let error;
  let warning;
  if (!total) {
    error = queryErrors.length
      ? `Gagal mengambil berita (${queryErrors.length} sumber gagal). Google News RSS mungkin diblokir.`
      : 'Tidak ada berita loker/magang yang lolos filter. Coba sinkronkan lagi nanti.';
  } else if (fallbackUsed.length) {
    warning = `Google News kosong; memakai RSS cadangan: ${fallbackUsed.join(', ')}.`;
  } else if (queryErrors.length) {
    warning = `${queryErrors.length} kueri Google News gagal; berita lain tetap ditampilkan.`;
  }

  const result = {
    total,
    inserted,
    updated,
    purged,
    fetched: collected.length,
    kept: filtered.length,
    query_errors: queryErrors.length ? queryErrors : undefined,
    fallback_used: fallbackUsed.length ? fallbackUsed : undefined,
    error,
    warning
  };
  lastIngestMeta = result;
  return result;
}

let ingestInFlight = null;
let lastIngestMeta = null;
let lastEmptyRetryAt = 0;
const EMPTY_RETRY_MS = 5 * 60 * 1000;

/** Isi tabel berita jika kosong (startup + GET tab Berita), dengan cooldown jika gagal. */
export async function ensureJobNewsSeeded(now = new Date()) {
  const existing = await JobNews.count({ where: newsRecencyWhere(now) });
  if (existing > 0) return { total: existing, skipped: true };
  if (lastEmptyRetryAt && Date.now() - lastEmptyRetryAt < EMPTY_RETRY_MS && lastIngestMeta) {
    return lastIngestMeta;
  }
  if (!ingestInFlight) {
    ingestInFlight = syncJobNews(now)
      .then((meta) => {
        if (!meta.total) lastEmptyRetryAt = Date.now();
        return meta;
      })
      .finally(() => {
        ingestInFlight = null;
      });
  }
  return ingestInFlight;
}

export const seedJobNewsIfEmpty = ensureJobNewsSeeded;

export async function getJobNews({
  kind = 'all',
  search = '',
  page = 1,
  limit = 12
} = {}) {
  const seed = await ensureJobNewsSeeded();
  const and = [newsRecencyWhere()];

  if (kind === 'loker') and.push({ kind: { [Op.in]: ['loker', 'mixed'] } });
  else if (kind === 'magang') and.push({ kind: { [Op.in]: ['magang', 'mixed'] } });

  if (search && search.trim()) {
    const like = `%${search.trim()}%`;
    and.push({
      [Op.or]: [
        { title: { [Op.iLike]: like } },
        { source: { [Op.iLike]: like } },
        { snippet: { [Op.iLike]: like } },
        { company_guess: { [Op.iLike]: like } }
      ]
    });
  }

  const where = { [Op.and]: and };
  const parsedLimit = parseInt(limit, 10) || 12;
  const parsedPage = parseInt(page, 10) || 1;
  const offset = (parsedPage - 1) * parsedLimit;

  const [rows, total] = await Promise.all([
    JobNews.findAll({
      where,
      order: [
        ['published_at', 'DESC'],
        ['createdAt', 'DESC']
      ],
      offset,
      limit: parsedLimit
    }),
    JobNews.count({ where })
  ]);

  const items = await attachMatchedJobs(rows);
  const notice = seed?.skipped
    ? undefined
    : total
      ? seed?.warning
      : seed?.error || seed?.warning;

  return {
    items,
    total,
    page: parsedPage,
    totalPages: Math.max(1, Math.ceil(total / parsedLimit) || 1),
    notice
  };
}

export { FALLBACK_NEWS_FEEDS, GOOGLE_NEWS_QUERIES, googleNewsRssUrl };
