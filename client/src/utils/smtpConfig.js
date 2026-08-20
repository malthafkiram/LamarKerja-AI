/**
 * Personal Gmail SMTP lives on the user profile; global settings are fallback only.
 */
export function normalizeAppPassword(pass) {
  return String(pass ?? '').replace(/\s/g, '');
}

export function pickSmtpFields(data = {}) {
  return {
    smtp_user: String(data.smtp_user || '').trim(),
    smtp_pass: normalizeAppPassword(data.smtp_pass),
    sender_name: String(data.sender_name || '').trim()
  };
}

export function hasSmtpCredentials(profile = {}, settings = {}) {
  const user = String(profile?.smtp_user || settings?.smtp_user || '').trim();
  const pass = normalizeAppPassword(profile?.smtp_pass || settings?.smtp_pass);
  return Boolean(user && pass);
}
