import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toFormProfile, buildProfilePayload } from './profileForm.js';

const SAVED = {
  id: 1,
  userId: 1,
  full_name: 'Siti Pelamar',
  email: 'siti@example.com',
  phone: '081234567890',
  city: 'Bandung',
  headline: 'Backend Engineer',
  summary: 'Ringkasan karir yang diketik user',
  linkedin_url: 'https://linkedin.com/in/siti',
  portfolio_url: 'https://github.com/siti',
  skills: ['Python', 'SQL', 'React'],
  cv_filename: 'CV Siti.pdf',
  cv_path: '/uploads/cv/siti.pdf'
};

describe('toFormProfile', () => {
  it('keeps city, summary, LinkedIn, portfolio, skills, and identity after a saved profile loads', () => {
    const form = toFormProfile(SAVED);
    assert.equal(form.city, 'Bandung');
    assert.equal(form.summary, 'Ringkasan karir yang diketik user');
    assert.equal(form.linkedin_url, 'https://linkedin.com/in/siti');
    assert.equal(form.portfolio_url, 'https://github.com/siti');
    assert.deepEqual(form.skills, ['Python', 'SQL', 'React']);
    assert.equal(form.full_name, 'Siti Pelamar');
    assert.equal(form.email, 'siti@example.com');
    assert.equal(form.headline, 'Backend Engineer');
    assert.equal(form.cv_filename, 'CV Siti.pdf');
  });

  it('does not strip user-saved skills even if they overlap the old seed list', () => {
    const form = toFormProfile({
      ...SAVED,
      skills: ['JavaScript', 'React']
    });
    assert.deepEqual(form.skills, ['JavaScript', 'React']);
  });

  it('keeps the full former seed list when the user saved those skills themselves', () => {
    const form = toFormProfile({
      full_name: '',
      email: '',
      headline: '',
      city: '',
      summary: '',
      skills: ['JavaScript', 'React', 'Node.js', 'Komunikasi', 'Problem Solving']
    });
    assert.deepEqual(form.skills, [
      'JavaScript',
      'React',
      'Node.js',
      'Komunikasi',
      'Problem Solving'
    ]);
  });

  it('parses skills from a JSON or comma-separated string so chips still render after GET', () => {
    assert.deepEqual(
      toFormProfile({ ...SAVED, skills: '["Python","SQL","React"]' }).skills,
      ['Python', 'SQL', 'React']
    );
    assert.deepEqual(
      toFormProfile({ ...SAVED, skills: 'Python, SQL, React' }).skills,
      ['Python', 'SQL', 'React']
    );
  });

  it('never auto-fills skills on a brand-new empty profile', () => {
    const form = toFormProfile({
      full_name: '',
      email: '',
      headline: '',
      city: '',
      summary: '',
      skills: []
    });
    assert.deepEqual(form.skills, []);
  });

  it('never blanks city/summary/urls when stripping dummy identity on a new profile', () => {
    const form = toFormProfile({
      full_name: 'Kandidat Pelamar',
      email: '',
      headline: 'Software Developer / Professional',
      skills: [],
      city: '',
      summary: '',
      linkedin_url: '',
      portfolio_url: ''
    });
    assert.equal(form.city, '');
    assert.equal(form.summary, '');
    assert.equal(form.linkedin_url, '');
    assert.equal(form.portfolio_url, '');
    assert.equal(form.full_name, '');
    assert.equal(form.headline, '');
    assert.deepEqual(form.skills, []);
  });

  it('keeps cv_filename while also keeping other saved fields', () => {
    const form = toFormProfile(SAVED);
    assert.equal(form.cv_filename, 'CV Siti.pdf');
    assert.equal(form.city, 'Bandung');
    assert.deepEqual(form.skills, ['Python', 'SQL', 'React']);
  });
});

describe('buildProfilePayload', () => {
  it('always sends city, summary, urls, skills, and identity so save cannot drop them', () => {
    const payload = buildProfilePayload({
      ...SAVED,
      id: 99,
      createdAt: '2026-01-01',
      smtp_pass: 'secret'
    });
    assert.equal(payload.city, 'Bandung');
    assert.equal(payload.summary, 'Ringkasan karir yang diketik user');
    assert.equal(payload.linkedin_url, 'https://linkedin.com/in/siti');
    assert.equal(payload.portfolio_url, 'https://github.com/siti');
    assert.deepEqual(payload.skills, ['Python', 'SQL', 'React']);
    assert.equal(payload.full_name, 'Siti Pelamar');
    assert.equal(payload.email, 'siti@example.com');
    assert.equal(payload.headline, 'Backend Engineer');
    assert.equal(payload.id, undefined);
    assert.equal(payload.smtp_pass, undefined);
  });

  it('sends empty strings for missing keys instead of omitting them', () => {
    const payload = buildProfilePayload({ skills: ['Go'] });
    assert.equal(payload.city, '');
    assert.equal(payload.summary, '');
    assert.equal(payload.linkedin_url, '');
    assert.equal(payload.portfolio_url, '');
    assert.deepEqual(payload.skills, ['Go']);
  });

  it('coerces string skills into an array so Sequelize ARRAY is updated', () => {
    const payload = buildProfilePayload({ skills: 'Go, Rust' });
    assert.deepEqual(payload.skills, ['Go', 'Rust']);
  });
});
