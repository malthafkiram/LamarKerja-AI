import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  APPLICATION_SOURCES,
  APPLICATION_STATUSES,
  DEFAULT_SOURCE,
  followUpInfo,
  normalizeCreatePayload,
  pickUpdateFields
} from './applicationFields.js';

describe('APPLICATION_SOURCES', () => {
  it('lists portal sources plus LamarKerja and Lainnya', () => {
    assert.deepEqual(APPLICATION_SOURCES, [
      'Glints',
      'JobStreet',
      'LinkedIn',
      'Dealls',
      'KarirJakarta',
      'Remotive',
      'LamarKerja',
      'Lainnya'
    ]);
  });
});

describe('normalizeCreatePayload', () => {
  it('rejects missing company or position', () => {
    const noCompany = normalizeCreatePayload({ position: 'Backend Engineer' });
    assert.equal(noCompany.ok, false);
    assert.match(noCompany.error, /perusahaan/i);

    const noPosition = normalizeCreatePayload({ company_name: 'PT Contoh' });
    assert.equal(noPosition.ok, false);
    assert.match(noPosition.error, /posisi/i);
  });

  it('builds a manual application with Glints source, optional URL, notes, and applied date', () => {
    const result = normalizeCreatePayload({
      company_name: '  Gojek  ',
      position: '  DevOps Engineer ',
      job_url: 'https://glints.com/id/opportunities/jobs/devops/abc',
      source: 'Glints',
      status: 'sent',
      applied_at: '2026-08-10',
      notes: 'Sudah apply via portal'
    });

    assert.equal(result.ok, true);
    assert.equal(result.data.company_name, 'Gojek');
    assert.equal(result.data.position, 'DevOps Engineer');
    assert.equal(result.data.job_url, 'https://glints.com/id/opportunities/jobs/devops/abc');
    assert.equal(result.data.source, 'Glints');
    assert.equal(result.data.status, 'sent');
    assert.equal(result.data.notes, 'Sudah apply via portal');
    assert.equal(result.data.applied_at.toISOString().slice(0, 10), '2026-08-10');
    assert.equal(result.data.recipient_email, '');
    assert.equal(result.data.email_subject, '');
    assert.equal(result.data.email_body, '');
  });

  it('accepts platform as an alias of source and defaults empty source to LamarKerja', () => {
    const fromPlatform = normalizeCreatePayload({
      company: 'Tokopedia',
      position: 'SRE',
      platform: 'jobstreet'
    });
    assert.equal(fromPlatform.ok, true);
    assert.equal(fromPlatform.data.company_name, 'Tokopedia');
    assert.equal(fromPlatform.data.source, 'JobStreet');

    const untitled = normalizeCreatePayload({
      company_name: 'Internal',
      position: 'Intern'
    });
    assert.equal(untitled.ok, true);
    assert.equal(untitled.data.source, DEFAULT_SOURCE);
    assert.equal(untitled.data.status, 'sent');
    assert.ok(untitled.data.applied_at instanceof Date);
  });

  it('maps unknown portals to Lainnya and rejects invalid status', () => {
    const other = normalizeCreatePayload({
      company_name: 'PT X',
      position: 'QA',
      source: 'Kalibrr'
    });
    assert.equal(other.ok, true);
    assert.equal(other.data.source, 'Lainnya');

    const badStatus = normalizeCreatePayload({
      company_name: 'PT X',
      position: 'QA',
      status: 'ghosted'
    });
    assert.equal(badStatus.ok, false);
    assert.match(badStatus.error, /status/i);
  });

  it('sets sent_at from applied_at when status is sent', () => {
    const result = normalizeCreatePayload({
      company_name: 'PT Y',
      position: 'PM',
      applied_at: '2026-01-15',
      status: 'sent'
    });
    assert.equal(result.ok, true);
    assert.equal(result.data.sent_at.toISOString(), result.data.applied_at.toISOString());
  });
});

describe('pickUpdateFields', () => {
  it('allows company, position, source, url, notes, status, and applied date', () => {
    const fields = pickUpdateFields({
      company_name: 'NewCo',
      position: 'Frontend',
      source: 'linkedin',
      job_url: 'https://linkedin.com/jobs/view/1',
      notes: 'Follow up Senin',
      status: 'interview',
      applied_at: '2026-08-01',
      userId: 999,
      email_body: 'should not leak'
    });

    assert.equal(fields.company_name, 'NewCo');
    assert.equal(fields.position, 'Frontend');
    assert.equal(fields.source, 'LinkedIn');
    assert.equal(fields.job_url, 'https://linkedin.com/jobs/view/1');
    assert.equal(fields.notes, 'Follow up Senin');
    assert.equal(fields.status, 'interview');
    assert.equal(fields.applied_at.toISOString().slice(0, 10), '2026-08-01');
    assert.equal('userId' in fields, false);
    assert.equal('email_body' in fields, false);
  });

  it('returns empty object when nothing updatable is provided', () => {
    assert.deepEqual(pickUpdateFields({ foo: 1 }), {});
  });

  it('rejects invalid status via error property', () => {
    const fields = pickUpdateFields({ status: 'nope' });
    assert.equal(fields.error, 'Status lamaran tidak valid.');
  });

  it('allows offering as a pipeline status', () => {
    assert.equal(APPLICATION_STATUSES.includes('offering'), true);
    const created = normalizeCreatePayload({
      company_name: 'PT Z',
      position: 'Lead',
      status: 'offering'
    });
    assert.equal(created.ok, true);
    assert.equal(created.data.status, 'offering');
    const updated = pickUpdateFields({ status: 'offering' });
    assert.equal(updated.status, 'offering');
  });
});

describe('followUpInfo', () => {
  const now = new Date('2026-08-19T00:00:00.000Z');

  it('flags sent applications older than 5 days using applied_at or sent_at', () => {
    const due = followUpInfo({
      status: 'sent',
      applied_at: '2026-08-10T00:00:00.000Z'
    }, now);
    assert.equal(due.needs_follow_up, true);
    assert.equal(due.follow_up_days, 9);

    const fromSentAt = followUpInfo({
      status: 'sent',
      sent_at: '2026-08-01T00:00:00.000Z'
    }, now);
    assert.equal(fromSentAt.needs_follow_up, true);
    assert.ok(fromSentAt.follow_up_days >= 5);
  });

  it('does not flag recent sent rows or other pipeline stages', () => {
    const recent = followUpInfo({
      status: 'sent',
      applied_at: '2026-08-17T00:00:00.000Z'
    }, now);
    assert.equal(recent.needs_follow_up, false);

    const interview = followUpInfo({
      status: 'interview',
      applied_at: '2026-07-01T00:00:00.000Z'
    }, now);
    assert.equal(interview.needs_follow_up, false);
  });
});
