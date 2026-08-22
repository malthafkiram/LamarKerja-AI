import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  LIVE_SEARCH_MIN_CHARS,
  LIVE_SEARCH_PAGE_STARTS,
  buildLinkedInGuestSearchUrl,
  createLiveSearchCache,
  ingestLinkedInLiveSearch,
  normalizeLiveSearchQuery,
  parseLinkedInGuestCards,
  shouldLiveIngestSearch
} from './jobHubLinkedIn.js';

const SAMPLE_CARD = `
<li>
  <div class="base-search-card">
    <h3 class="base-search-card__title">Guru Matematika</h3>
    <h4 class="base-search-card__subtitle">SMA Negeri 1</h4>
    <span class="job-search-card__location">Jakarta</span>
    <a class="base-card__full-link" href="https://id.linkedin.com/jobs/view/guru-matematika-at-sma-4411001?refId=abc">Lihat</a>
    <time datetime="2026-08-20T00:00:00.000Z">1 day ago</time>
  </div>
</li>`;

describe('LinkedIn live search helpers', () => {
  it('normalizes query whitespace and caps length', () => {
    assert.equal(normalizeLiveSearchQuery('  Guru   Jakarta  '), 'Guru Jakarta');
    assert.equal(normalizeLiveSearchQuery('x'.repeat(120)).length, 80);
  });

  it('only live-ingests page 1 queries of at least 3 characters on all/LinkedIn', () => {
    assert.equal(LIVE_SEARCH_MIN_CHARS, 3);
    assert.equal(shouldLiveIngestSearch('ab', { page: 1 }), false);
    assert.equal(shouldLiveIngestSearch('Guru', { page: 1 }), true);
    assert.equal(shouldLiveIngestSearch('Guru', { page: 2 }), false);
    assert.equal(shouldLiveIngestSearch('Guru', { page: 1, platform: 'Dealls' }), false);
    assert.equal(shouldLiveIngestSearch('Guru', { page: 1, platform: 'Remote' }), false);
    assert.equal(shouldLiveIngestSearch('Guru', { page: 1, platform: 'LinkedIn' }), true);
    assert.equal(shouldLiveIngestSearch('Guru', { page: 1, platform: 'all' }), true);
  });

  it('builds the guest search URL with Indonesia and 8-day filter', () => {
    const url = buildLinkedInGuestSearchUrl('Guru Jakarta', 20);
    assert.match(url, /keywords=Guru%20Jakarta/);
    assert.match(url, /location=Indonesia/);
    assert.match(url, /f_TPR=r691200/);
    assert.match(url, /start=20/);
  });

  it('parses guest HTML cards and strips tracking query strings', () => {
    const jobs = parseLinkedInGuestCards(`<ul>${SAMPLE_CARD}${SAMPLE_CARD}</ul>`, 'Guru');
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].title, 'Guru Matematika');
    assert.equal(jobs[0].company, 'SMA Negeri 1');
    assert.equal(jobs[0].platform, 'LinkedIn');
    assert.equal(jobs[0].job_url, 'https://id.linkedin.com/jobs/view/guru-matematika-at-sma-4411001');
    assert.equal(jobs[0].posted_at.toISOString(), '2026-08-20T00:00:00.000Z');
  });

  it('skips a second ingest of the same keyword while the cache is fresh', async () => {
    const cache = createLiveSearchCache();
    const fetchHtml = async () => `<ul>${SAMPLE_CARD}</ul>`;
    const persisted = [];
    const persistJobs = async (jobs) => {
      persisted.push(jobs.length);
      return { inserted: jobs.length, updated: 0 };
    };

    const first = await ingestLinkedInLiveSearch('Guru', {
      fetchHtml,
      persistJobs,
      cache,
      now: 1_000,
      pageStarts: [0],
      sleepFn: async () => {}
    });
    const second = await ingestLinkedInLiveSearch('Guru', {
      fetchHtml,
      persistJobs,
      cache,
      now: 1_000 + 60_000,
      pageStarts: [0],
      sleepFn: async () => {}
    });

    assert.equal(first.attempted, true);
    assert.equal(first.fetched, 1);
    assert.equal(first.inserted, 1);
    assert.equal(second.attempted, false);
    assert.equal(second.skipped, 'cache');
    assert.deepEqual(persisted, [1]);
  });

  it('paginates guest pages until a page returns no cards', async () => {
    assert.deepEqual(LIVE_SEARCH_PAGE_STARTS, [0, 10, 20, 30]);
    const calls = [];
    const fetchHtml = async (url) => {
      const start = Number(new URL(url).searchParams.get('start'));
      calls.push(start);
      if (start >= 20) return '<ul></ul>';
      return `<ul>${SAMPLE_CARD.replace('4411001', `441100${start}`)}</ul>`;
    };
    const result = await ingestLinkedInLiveSearch('Guru', {
      fetchHtml,
      persistJobs: async (jobs) => ({ inserted: jobs.length, updated: 0 }),
      cache: createLiveSearchCache(),
      pageStarts: [0, 10, 20, 30],
      sleepFn: async () => {}
    });
    assert.deepEqual(calls, [0, 10, 20]);
    assert.equal(result.fetched, 2);
  });
});
