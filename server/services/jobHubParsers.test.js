import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isBlockedBoardUrl,
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

describe('isSearchHubUrl / isDirectJobPostingUrl', () => {
  it('rejects Glints, JobStreet, Indeed, and Kalibrr URLs as blocked boards', () => {
    assert.equal(isBlockedBoardUrl('https://glints.com/id/opportunities/jobs/explore?keyword=DevOps'), true);
    assert.equal(isDirectJobPostingUrl('https://glints.com/id/opportunities/jobs/devops-engineer/017acd48-ae45-40f0-94c4-da5e9d3e8adc'), false);
    assert.equal(isDirectJobPostingUrl('https://www.jobstreet.co.id/id/job/software-engineer-123'), false);
    assert.equal(isDirectJobPostingUrl('https://id.indeed.com/viewjob?jk=abc'), false);
    assert.equal(isDirectJobPostingUrl('https://www.kalibrr.com/c/company/jobs/12345/software-engineer'), false);
  });

  it('rejects LinkedIn / Dealls keyword-search and listing hub URLs', () => {
    assert.equal(isDirectJobPostingUrl('https://www.linkedin.com/jobs/search/?keywords=DevOps&location=Indonesia'), false);
    assert.equal(isDirectJobPostingUrl('https://dealls.com/loker?search=DevOps'), false);
    assert.equal(isDirectJobPostingUrl('https://karir.jakarta.go.id/jobs'), false);
    assert.equal(isDirectJobPostingUrl('https://toploker.com/loker/daftar'), false);
    assert.equal(isDirectJobPostingUrl('https://portal.karirlink.id/jobs'), false);
    assert.equal(isDirectJobPostingUrl('https://karirhub.kemnaker.go.id/lowongan-dalam-negeri/lowongan'), false);
  });

  it('accepts LinkedIn view URLs and Dealls /loker/slug~company URLs', () => {
    assert.equal(
      isDirectJobPostingUrl('https://id.linkedin.com/jobs/view/software-engineer-at-cermati-com-4403894880'),
      true
    );
    assert.equal(
      isDirectJobPostingUrl('https://dealls.com/loker/fullstack-developer-32~kanggo'),
      true
    );
    assert.equal(
      isDirectJobPostingUrl('https://himalayas.app/companies/stripe/jobs/senior-software-engineer'),
      true
    );
    assert.equal(
      isDirectJobPostingUrl('https://himalayas.app/jobs?keyword=engineer'),
      false
    );
  });
});

describe('isCloudflareChallengeHtml', () => {
  it('detects a challenge page, not a normal listing that mentions Cloudflare in CSP', () => {
    assert.equal(isCloudflareChallengeHtml('<title>Just a moment...</title><div id="cf-challenge">cloudflare</div>'), true);
    assert.equal(isCloudflareChallengeHtml('<html><head><title>Jobs</title></head><body>Lowongan</body></html>'), false);
  });
});

describe('parseKarirJakartaJobsFromHtml', () => {
  it('extracts /job/{slug} cards and skips autocomplete / listing links', () => {
    const html = `
      <a href="https://karir.jakarta.go.id/jobs">Semua</a>
      <a href="https://karir.jakarta.go.id/job/autocomplete">auto</a>
      <a href="https://karir.jakarta.go.id/job/barista-1787041477-6a8416c5e1579" class="jobcardStyle1">
        <span class="tw-text-lg tw-font-medium">BARISTA</span>
        <span>Full Time</span>
        <span class="tw-card-title">PT Indomarco Prismatama</span>
        <span class="tw-location">Indonesia</span>
      </a>
      <a href="https://karir.jakarta.go.id/job/karirhub/bb59fbba-b82b-4984-9e58-44c4684c8db3" class="jobcardStyle1">
        <span class="tw-text-lg tw-font-medium">Surveyor</span>
        <span class="tw-card-title">Karirhub DKI</span>
        <span class="tw-location">Jakarta Selatan</span>
      </a>
    `;
    const jobs = parseKarirJakartaJobsFromHtml(html);
    assert.equal(jobs.length, 2);
    assert.equal(jobs[0].title, 'BARISTA');
    assert.equal(jobs[0].company, 'PT Indomarco Prismatama');
    assert.equal(jobs[0].location, 'Jakarta / DKI');
    assert.equal(jobs[0].job_url, 'https://karir.jakarta.go.id/job/barista-1787041477-6a8416c5e1579');
    assert.equal(jobs[1].job_url, 'https://karir.jakarta.go.id/job/karirhub/bb59fbba-b82b-4984-9e58-44c4684c8db3');
    assert.equal(jobs[1].location, 'Jakarta Selatan');
  });
});

describe('parseKarirhubJobsFromHtml', () => {
  it('keeps SSR /lowongan/.../{slug}-{uuid} links and skips the listing path', () => {
    const html = `
      <a href="/lowongan-dalam-negeri/lowongan">Listing</a>
      <h4><a href="/lowongan-dalam-negeri/lowongan/staff-admin-01a0162a-799c-701d-9f31-1fe0c3543545">STAFF ADMIN</a></h4>
      <p>PT Bintang Bandung Sejati</p>
    `;
    const jobs = parseKarirhubJobsFromHtml(html);
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].title, 'STAFF ADMIN');
    assert.equal(
      jobs[0].job_url,
      'https://karirhub.kemnaker.go.id/lowongan-dalam-negeri/lowongan/staff-admin-01a0162a-799c-701d-9f31-1fe0c3543545'
    );
    assert.equal(isDirectJobPostingUrl(jobs[0].job_url), true);
  });
});

describe('parseToplokerJobsFromHtml', () => {
  it('extracts /lowongan/date!title!di!company posting URLs only', () => {
    const html = `
      <a href="https://toploker.com/loker/daftar">Daftar</a>
      <div class="card">
        <a href="https://toploker.com/lowongan/2026-08-17!admin-142!di!telefast">logo</a>
        <span class="text-uppercase">telefast</span>
        <span class="text-capitalize">admin</span>
        <span>Full Time</span>
      </div>
    `;
    const jobs = parseToplokerJobsFromHtml(html);
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].title.toLowerCase(), 'admin');
    assert.match(jobs[0].company, /telefast/i);
    assert.equal(jobs[0].job_url, 'https://toploker.com/lowongan/2026-08-17!admin-142!di!telefast');
    assert.equal(jobs[0].posted_at instanceof Date, true);
    assert.equal(jobs[0].posted_at.toISOString().startsWith('2026-08-17'), true);
  });
});

describe('parseKarirlinkJobsFromHtml', () => {
  it('extracts portal.karirlink.id/jobs/{slug} cards', () => {
    const html = `
      <a href="https://portal.karirlink.id/jobs">Semua</a>
      <a href="https://portal.karirlink.id/jobs/online-sales-hotel-reddoorz-remote-pt-commeasure-1787046725702" class="front-vacancy__card">
        <h3 class="front-vacancy__company">PT Commeasure</h3>
        <h3 class="front-vacancy__card-title">Online Sales Hotel Reddoorz - Remote</h3>
        <p class="front-vacancy__card-text">Kota Bekasi, Jawa Barat</p>
        <span>Remote</span>
      </a>
    `;
    const jobs = parseKarirlinkJobsFromHtml(html);
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].title, 'Online Sales Hotel Reddoorz - Remote');
    assert.equal(jobs[0].company, 'PT Commeasure');
    assert.equal(jobs[0].work_type, 'Remote / WFH');
    assert.equal(
      jobs[0].job_url,
      'https://portal.karirlink.id/jobs/online-sales-hotel-reddoorz-remote-pt-commeasure-1787046725702'
    );
  });
});

describe('parseDisnakerjaFeedXml', () => {
  it('maps RSS items onto posting URLs from <link>, not search pages', () => {
    const xml = `<?xml version="1.0"?><rss><channel>
      <item>
        <title>PT Contoh Sejahtera</title>
        <link>https://www.disnakerja.com/lowongan-kerja-pt-contoh-sejahtera/</link>
        <description>Lowongan BUMN terbaru</description>
        <category>BUMN</category>
        <category>Jawa Tengah</category>
        <pubDate>Tue, 18 Aug 2026 15:39:28 +0000</pubDate>
      </item>
      <item>
        <title>Search junk</title>
        <link>https://disnakerja.com/?s=BUMN</link>
      </item>
    </channel></rss>`;
    const jobs = parseDisnakerjaFeedXml(xml);
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].job_url, 'https://www.disnakerja.com/lowongan-kerja-pt-contoh-sejahtera/');
    assert.match(jobs[0].location, /Jawa Tengah/);
  });
});


describe('parseDeallsJobsFromHtml', () => {
  it('extracts real /loker/{slug}~{company} cards with title and company', () => {
    const html = `
      <a href="/loker/industri">Industri</a>
      <a href="/loker/fullstack-developer-32~kanggo" target="_blank">
        <h2>FULLSTACK DEVELOPER</h2>
        <div>Kanggo</div>
        <span>On-site • Tangerang Selatan</span>
        <span>Rp6.000.000 – 9.000.000</span>
      </a>
    `;
    const jobs = parseDeallsJobsFromHtml(html);
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].title, 'FULLSTACK DEVELOPER');
    assert.equal(jobs[0].company, 'Kanggo');
    assert.equal(jobs[0].job_url, 'https://dealls.com/loker/fullstack-developer-32~kanggo');
    assert.equal(jobs[0].location.includes('Tangerang'), true);
  });
});

describe('mapHimalayasJobs', () => {
  const samplePayload = {
    jobs: [
      {
        title: 'Senior Software Engineer',
        excerpt: 'Build remote products with TypeScript.',
        description: '<p>Build remote products with TypeScript.</p>',
        companyName: 'Stripe',
        applicationLink: 'https://himalayas.app/companies/stripe/jobs/senior-software-engineer',
        employmentType: 'Full Time',
        seniority: ['Senior'],
        categories: ['Software-Engineering', 'TypeScript'],
        parentCategories: ['Developer'],
        locationRestrictions: ['United States'],
        pubDate: 1787077664,
        minSalary: 120000,
        maxSalary: 180000,
        currency: 'USD',
        salaryPeriod: 'annual'
      },
      {
        title: 'Missing URL Job',
        companyName: 'Nowhere Inc',
        applicationLink: '',
        parentCategories: ['Developer']
      },
      {
        title: 'Search page must be skipped',
        companyName: 'Bad Source',
        applicationLink: 'https://himalayas.app/jobs?keyword=engineer'
      }
    ]
  };

  it('maps Himalayas listings onto job_directories fields and skips jobs without a posting URL', () => {
    const jobs = mapHimalayasJobs(samplePayload);
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].title, 'Senior Software Engineer');
    assert.equal(jobs[0].company, 'Stripe');
    assert.equal(jobs[0].job_url, 'https://himalayas.app/companies/stripe/jobs/senior-software-engineer');
    assert.equal(jobs[0].platform, 'Remote');
    assert.equal(jobs[0].work_type, 'Remote / WFH');
    assert.equal(jobs[0].category, 'IT & Software');
    assert.equal(jobs[0].location.includes('United States'), true);
    assert.equal(jobs[0].tags.includes('Himalayas'), true);
    assert.equal(jobs[0].posted_at instanceof Date, true);
    assert.equal(jobs[0].posted_at.getFullYear() > 2020, true);
  });

  it('treats empty location restrictions as worldwide remote', () => {
    const jobs = mapHimalayasJobs({
      jobs: [{
        title: 'Designer',
        companyName: 'Linear',
        applicationLink: 'https://himalayas.app/companies/linear/jobs/designer',
        parentCategories: ['Design'],
        locationRestrictions: []
      }]
    });
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].category, 'Design & Kreatif');
    assert.match(jobs[0].location, /Remote/i);
  });
});

describe('mapRemoteOkJobs', () => {
  const samplePayload = [
    { legal: 'You must credit Remote OK as the source.' },
    {
      id: '12345',
      slug: 'remote-backend-engineer-acme',
      company: 'Acme',
      position: 'Backend Engineer',
      url: 'https://remoteok.com/remote-jobs/remote-backend-engineer-acme',
      description: '<p>Build APIs in Node.js.</p>',
      location: 'Worldwide',
      tags: ['dev', 'javascript', 'backend'],
      date: '2026-08-12T12:00:00+00:00',
      epoch: 1786536000
    },
    {
      id: '999',
      company: 'No URL Inc',
      position: 'Ghost Role'
    },
    {
      id: '888',
      company: 'Hub Inc',
      position: 'Search listing',
      url: 'https://remoteok.com/remote-jobs'
    }
  ];

  it('skips the legal banner and search-hub URLs, keeping real Remote OK postings', () => {
    const jobs = mapRemoteOkJobs(samplePayload);
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].title, 'Backend Engineer');
    assert.equal(jobs[0].company, 'Acme');
    assert.equal(jobs[0].job_url, 'https://remoteok.com/remote-jobs/remote-backend-engineer-acme');
    assert.equal(jobs[0].platform, 'Remote');
    assert.equal(jobs[0].work_type, 'Remote / WFH');
    assert.equal(jobs[0].tags.includes('Remote OK'), true);
    assert.equal(jobs[0].posted_at instanceof Date, true);
  });

  it('accepts Remote OK posting URLs and rejects the jobs index', () => {
    assert.equal(
      isDirectJobPostingUrl('https://remoteok.com/remote-jobs/remote-backend-engineer-acme'),
      true
    );
    assert.equal(isDirectJobPostingUrl('https://remoteok.com/remote-jobs'), false);
    assert.equal(isDirectJobPostingUrl('https://remoteok.com/'), false);
  });
});
