/**
 * Directory ingest / purge windows.
 * LinkedIn guest search uses f_TPR=r691200 (8 days in seconds).
 */
export const INGEST_WINDOW_DAYS = 8;
export const PURGE_AFTER_DAYS = 18;
export const INGEST_WINDOW_SECONDS = INGEST_WINDOW_DAYS * 24 * 60 * 60;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysAgo(days, now = new Date()) {
  return new Date(now.getTime() - days * MS_PER_DAY);
}

export function ingestCutoffDate(now = new Date()) {
  return daysAgo(INGEST_WINDOW_DAYS, now);
}

export function purgeCutoffDate(now = new Date()) {
  return daysAgo(PURGE_AFTER_DAYS, now);
}

/** Missing / invalid dates are treated as "now" (live listing, do not keep forever). */
export function coercePostedAt(value, now = new Date()) {
  if (value == null || value === '') return now;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? now : d;
}

export function isWithinIngestWindow(postedAt, now = new Date()) {
  const d = coercePostedAt(postedAt, now);
  return d.getTime() >= ingestCutoffDate(now).getTime();
}

/**
 * Keep jobs posted in the last 8 days.
 * Listings without a date get posted_at=now so they ingest once, then age out via purge.
 */
export function filterJobsWithinIngestWindow(jobs, now = new Date()) {
  return (Array.isArray(jobs) ? jobs : [])
    .map((job) => ({ ...job, posted_at: coercePostedAt(job?.posted_at, now) }))
    .filter((job) => isWithinIngestWindow(job.posted_at, now));
}
