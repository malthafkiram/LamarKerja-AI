/**
 * Validasi & normalisasi field lamaran (manual tracker + update status).
 */
export const APPLICATION_SOURCES = [
  'Glints',
  'JobStreet',
  'LinkedIn',
  'Dealls',
  'KarirJakarta',
  'Remotive',
  'LamarKerja',
  'Lainnya'
];

export const APPLICATION_STATUSES = [
  'draft',
  'sent',
  'interview',
  'offering',
  'rejected',
  'accepted',
  'failed'
];

export const DEFAULT_SOURCE = 'LamarKerja';

const SOURCE_LOOKUP = Object.fromEntries(
  APPLICATION_SOURCES.map((name) => [name.toLowerCase(), name])
);

export function resolveSource(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return DEFAULT_SOURCE;
  return SOURCE_LOOKUP[value.toLowerCase()] || 'Lainnya';
}

export function parseAppliedAt(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  const date = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function trimStr(value) {
  return String(value ?? '').trim();
}

export function normalizeCreatePayload(body = {}) {
  const company_name = trimStr(body.company_name || body.company);
  const position = trimStr(body.position);
  if (!company_name) {
    return { ok: false, error: 'Nama perusahaan wajib diisi.' };
  }
  if (!position) {
    return { ok: false, error: 'Posisi lowongan wajib diisi.' };
  }

  const status = trimStr(body.status) || 'sent';
  if (!APPLICATION_STATUSES.includes(status)) {
    return { ok: false, error: 'Status lamaran tidak valid.' };
  }

  const applied_at = parseAppliedAt(body.applied_at) || new Date();
  const data = {
    company_name,
    position,
    job_url: trimStr(body.job_url || body.url),
    source: resolveSource(body.source || body.platform),
    status,
    notes: trimStr(body.notes),
    applied_at,
    recipient_email: trimStr(body.recipient_email),
    email_subject: trimStr(body.email_subject),
    email_body: trimStr(body.email_body)
  };

  if (status === 'sent') {
    data.sent_at = applied_at;
  }

  return { ok: true, data };
}

export const FOLLOW_UP_AFTER_DAYS = 5;

export function appliedMoment(app = {}) {
  return app.applied_at || app.sent_at || app.createdAt || null;
}

export function followUpInfo(app = {}, now = new Date()) {
  const when = appliedMoment(app);
  if (app.status !== 'sent' || !when) {
    return { needs_follow_up: false, follow_up_days: 0 };
  }
  const days = Math.floor((new Date(now) - new Date(when)) / (1000 * 60 * 60 * 24));
  if (days < 0) return { needs_follow_up: false, follow_up_days: 0 };
  return {
    needs_follow_up: days >= FOLLOW_UP_AFTER_DAYS,
    follow_up_days: days
  };
}

export function pickUpdateFields(body = {}) {
  const fields = {};

  if (body.company_name !== undefined || body.company !== undefined) {
    const company_name = trimStr(body.company_name || body.company);
    if (company_name) fields.company_name = company_name;
  }
  if (body.position !== undefined) {
    const position = trimStr(body.position);
    if (position) fields.position = position;
  }
  if (body.source !== undefined || body.platform !== undefined) {
    fields.source = resolveSource(body.source || body.platform);
  }
  if (body.job_url !== undefined || body.url !== undefined) {
    fields.job_url = trimStr(body.job_url || body.url);
  }
  if (body.notes !== undefined) {
    fields.notes = String(body.notes ?? '');
  }
  if (body.status !== undefined) {
    const status = trimStr(body.status);
    if (!APPLICATION_STATUSES.includes(status)) {
      return { error: 'Status lamaran tidak valid.' };
    }
    fields.status = status;
  }
  if (body.applied_at !== undefined) {
    const applied_at = parseAppliedAt(body.applied_at);
    if (applied_at) {
      fields.applied_at = applied_at;
      if (fields.status === 'sent') fields.sent_at = applied_at;
    }
  }

  return fields;
}
