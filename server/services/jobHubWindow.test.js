import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  INGEST_WINDOW_DAYS,
  INGEST_WINDOW_SECONDS,
  PURGE_AFTER_DAYS,
  coercePostedAt,
  filterJobsWithinIngestWindow,
  ingestCutoffDate,
  isWithinIngestWindow,
  purgeCutoffDate
} from './jobHubWindow.js';

describe('job directory date windows', () => {
  it('matches LinkedIn f_TPR=r691200 (8 days in seconds)', () => {
    assert.equal(INGEST_WINDOW_DAYS, 8);
    assert.equal(INGEST_WINDOW_SECONDS, 691200);
    assert.equal(PURGE_AFTER_DAYS, 18);
  });

  it('keeps jobs posted within 8 days and drops older ones', () => {
    const now = new Date('2026-08-19T03:00:00Z');
    assert.equal(isWithinIngestWindow(now, now), true);
    assert.equal(isWithinIngestWindow(new Date('2026-08-12T03:00:00Z'), now), true);
    assert.equal(isWithinIngestWindow(new Date('2026-08-11T02:59:59Z'), now), false);
    assert.equal(isWithinIngestWindow(new Date('2026-07-01T00:00:00Z'), now), false);
  });

  it('treats missing dates as now so live listings ingest, but still age out later', () => {
    const now = new Date('2026-08-19T03:00:00Z');
    assert.equal(isWithinIngestWindow(null, now), true);
    assert.equal(isWithinIngestWindow(undefined, now), true);
    const coerced = coercePostedAt(null, now);
    assert.equal(coerced.getTime(), now.getTime());
  });

  it('sets posted_at=now on undated jobs and drops stale API dumps', () => {
    const now = new Date('2026-08-19T03:00:00Z');
    const filtered = filterJobsWithinIngestWindow([
      { job_url: 'https://example.com/new', posted_at: new Date('2026-08-18T00:00:00Z') },
      { job_url: 'https://example.com/old', posted_at: new Date('2026-07-01T00:00:00Z') },
      { job_url: 'https://example.com/live' }
    ], now);

    assert.equal(filtered.length, 2);
    assert.equal(filtered[0].job_url, 'https://example.com/new');
    assert.equal(filtered[1].job_url, 'https://example.com/live');
    assert.equal(filtered[1].posted_at.getTime(), now.getTime());
  });

  it('computes 8-day ingest and 18-day purge cutoffs', () => {
    const now = new Date('2026-08-19T00:00:00Z');
    assert.equal(ingestCutoffDate(now).toISOString(), '2026-08-11T00:00:00.000Z');
    assert.equal(purgeCutoffDate(now).toISOString(), '2026-08-01T00:00:00.000Z');
  });
});
