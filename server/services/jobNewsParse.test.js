import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FALLBACK_NEWS_FEEDS,
  GOOGLE_NEWS_QUERIES,
  calendarDayJakarta,
  canonicalizeUrl,
  classifyNewsKind,
  dedupeNewsItems,
  filterAndClassifyNews,
  googleNewsRssUrl,
  guessCompany,
  looksLikeRssXml,
  normalizeTitle,
  parseGoogleNewsRss,
  shouldKeepNews
} from './jobNewsParse.js';

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <item>
    <title>PT Telkom Buka Lowongan Kerja 2026 untuk Fresh Graduate - Kompas.com</title>
    <link>https://news.google.com/rss/articles/CBMiTELKOM</link>
    <pubDate>Mon, 18 Aug 2026 09:00:00 GMT</pubDate>
    <description>&lt;a href="https://www.kompas.com/telkom-buka-lowongan"&gt;PT Telkom Buka Lowongan Kerja&lt;/a&gt;&amp;nbsp;&amp;nbsp;&lt;font&gt;Kompas.com&lt;/font&gt;&lt;br&gt;Telkom membuka rekrutmen beberapa posisi.</description>
    <source url="https://www.kompas.com">Kompas.com</source>
  </item>
  <item>
    <title>Kemdikbud Buka Program Magang MSIB Kampus Merdeka Batch Baru - Detik</title>
    <link>https://news.google.com/rss/articles/CBMiMSIB</link>
    <pubDate>Sun, 17 Aug 2026 04:00:00 GMT</pubDate>
    <description>Pendaftaran program magang MSIB dan Kampus Merdeka dibuka.</description>
    <source url="https://www.detik.com">Detik</source>
  </item>
  <item>
    <title>IHSG anjlok, saham BUMN terkoreksi tajam - CNBC</title>
    <link>https://news.google.com/rss/articles/CBMiSAHAM</link>
    <pubDate>Mon, 18 Aug 2026 08:00:00 GMT</pubDate>
    <description>Indeks saham dan dividen menjadi sorotan investor.</description>
    <source url="https://www.cnbcindonesia.com">CNBC</source>
  </item>
</channel></rss>`;

describe('Google News RSS query URLs', () => {
  it('covers both jobs and internships', () => {
    const blob = GOOGLE_NEWS_QUERIES.join(' ').toLowerCase();
    assert.match(blob, /lowongan kerja/);
    assert.match(blob, /magang/);
    assert.match(blob, /internship/);
    assert.match(blob, /msib/);
  });

  it('builds Indonesia Google News RSS URLs with when:8d', () => {
    const url = googleNewsRssUrl('lowongan kerja');
    assert.ok(url.startsWith('https://news.google.com/rss/search?'));
    assert.match(url, /hl=id/);
    assert.match(url, /gl=ID/);
    assert.match(url, /ceid=ID:id/);
    assert.match(decodeURIComponent(url), /when:8d/);
  });
});

describe('shouldKeepNews / classifyNewsKind', () => {
  it('keeps hiring and internship signals', () => {
    assert.equal(shouldKeepNews('Bank Mandiri buka lowongan kerja 2026'), true);
    assert.equal(shouldKeepNews('Pendaftaran program magang MSIB dibuka'), true);
    assert.equal(shouldKeepNews('Formasi CPNS 2026 resmi diumumkan'), true);
  });

  it('drops PHK-as-primary, saham, olahraga, and rejection templates', () => {
    assert.equal(shouldKeepNews('PHK massal di pabrik tekstil Jawa Barat'), false);
    assert.equal(shouldKeepNews('IHSG anjlok, saham emiten terkoreksi'), false);
    assert.equal(shouldKeepNews('Timnas menang di Piala Dunia, liga 1 ramai'), false);
    assert.equal(shouldKeepNews('We decided to move forward with other candidates'), false);
  });

  it('keeps PHK stories that are also hiring', () => {
    assert.equal(shouldKeepNews('Usai PHK, perusahaan membuka lowongan pengganti'), true);
  });

  it('classifies magang vs loker vs mixed', () => {
    assert.equal(classifyNewsKind('Lowongan kerja staff admin BUMN'), 'loker');
    assert.equal(classifyNewsKind('Program magang MSIB Kampus Merdeka'), 'magang');
    assert.equal(classifyNewsKind('BUMN buka lowongan dan program magang 2026'), 'mixed');
  });

  it('keeps official job-feed items when the URL has hiring signal but the title is just a company', () => {
    assert.equal(
      shouldKeepNews(
        'PT Forisa Nusapersada',
        'Lowongan terbaru dari DISNAKERJA.COM',
        'https://www.disnakerja.com/lowongan-kerja-pt-forisa-nusapersada'
      ),
      true
    );
    assert.equal(
      shouldKeepNews(
        'PT Forisa Nusapersada',
        '',
        'https://www.disnakerja.com/lowongan-kerja-pt-forisa-nusapersada'
      ),
      true
    );
  });
});

describe('RSS sniffing and fallback feeds', () => {
  it('accepts RSS/Atom and rejects HTML consent pages', () => {
    assert.equal(looksLikeRssXml('<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>'), true);
    assert.equal(
      looksLikeRssXml('<html><head><title>Just a moment...</title></head><body>consent</body></html>'),
      false
    );
    assert.equal(looksLikeRssXml(''), false);
  });

  it('lists official Indonesian job/news RSS fallbacks (not Glints/JobStreet HTML)', () => {
    assert.ok(Array.isArray(FALLBACK_NEWS_FEEDS) && FALLBACK_NEWS_FEEDS.length >= 2);
    const blob = FALLBACK_NEWS_FEEDS.map((f) => `${f.url} ${f.label || ''}`).join(' ').toLowerCase();
    assert.equal(/glints|jobstreet/.test(blob), false);
    assert.ok(FALLBACK_NEWS_FEEDS.every((f) => /^https:\/\//.test(f.url)));
  });
});

describe('parse / dedupe / recency', () => {
  it('parses Google News RSS, prefers original article URL, guesses company', () => {
    const now = new Date('2026-08-19T03:00:00Z');
    const items = parseGoogleNewsRss(SAMPLE_RSS, 'lowongan kerja', now);
    assert.equal(items.length, 3);
    assert.equal(items[0].source, 'Kompas.com');
    assert.match(items[0].url, /kompas\.com/);
    assert.equal(items[0].company_guess, 'PT Telkom');
    assert.equal(items[1].kind, 'magang');
  });

  it('filters noise and items older than 8 days, then dedupes title+day', () => {
    const now = new Date('2026-08-19T03:00:00Z');
    const parsed = parseGoogleNewsRss(SAMPLE_RSS, 'q', now);
    const kept = filterAndClassifyNews(parsed, now);
    assert.equal(kept.some((i) => /saham/i.test(i.title)), false);
    assert.equal(kept.length, 2);

    const duped = dedupeNewsItems([
      ...kept,
      { ...kept[0], url: `${kept[0].url}?utm_source=x` },
      {
        ...kept[0],
        url: 'https://news.google.com/rss/articles/OTHER',
        title: kept[0].title
      }
    ]);
    assert.equal(duped.length, 2);
  });

  it('normalizes titles and Jakarta calendar days', () => {
    assert.equal(
      normalizeTitle('PT Telkom Buka Lowongan - Kompas.com'),
      'pt telkom buka lowongan'
    );
    assert.equal(
      calendarDayJakarta(new Date('2026-08-18T17:30:00Z')),
      '2026-08-19'
    );
    assert.equal(
      canonicalizeUrl('https://News.Google.com/rss/articles/ABC/?utm_source=rss'),
      'https://news.google.com/rss/articles/ABC'
    );
  });

  it('does not invent a company from generic words', () => {
    assert.equal(guessCompany('Pemerintah buka formasi CPNS 2026'), null);
  });

  it('parses WordPress-style job RSS and keeps items via URL hiring signal', () => {
    const now = new Date('2026-08-19T03:00:00Z');
    const wp = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <item>
    <title>PT Forisa Nusapersada</title>
    <link>https://www.disnakerja.com/lowongan-kerja-pt-forisa-nusapersada</link>
    <pubDate>Mon, 18 Aug 2026 09:00:00 +0700</pubDate>
    <description>Lowongan terbaru di DISNAKERJA.COM</description>
  </item>
</channel></rss>`;
    const parsed = parseGoogleNewsRss(wp, 'disnakerja-feed', now);
    assert.equal(parsed.length, 1);
    assert.match(parsed[0].url, /disnakerja\.com/);
    const kept = filterAndClassifyNews(parsed, now);
    assert.equal(kept.length, 1);
  });
});
