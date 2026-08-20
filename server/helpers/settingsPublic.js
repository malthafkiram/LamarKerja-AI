const SECRET_KEYS = [
  'groq_api_key',
  'kimi_api_key',
  'gemini_api_key',
  'database_url',
  'mongodb_uri'
];

function maskSmtpPass(pass) {
  const value = String(pass || '');
  if (value.length <= 4) return '';
  return `${value.slice(0, 3)}••••••••${value.slice(-3)}`;
}

export function toClientSettings(settings = {}, { isAdmin = false } = {}) {
  const data = { ...settings };
  if (data.smtp_pass) {
    data.smtp_pass_masked = maskSmtpPass(data.smtp_pass);
  }
  if (!isAdmin) {
    for (const key of SECRET_KEYS) delete data[key];
    delete data.smtp_pass;
  }
  return data;
}
