/**
 * Personal Gmail SMTP lives on the user profile; global settings are fallback only.
 * Google App Passwords are 16 letters; copy-paste often includes spaces or NBSP.
 */
export function normalizeAppPassword(pass) {
  return String(pass ?? '')
    .replace(/[\s\u00A0\u200B-\u200D\uFEFF]/g, '')
    .toLowerCase();
}

export function isGoogleAppPassword(pass) {
  return /^[a-z0-9]{16}$/.test(normalizeAppPassword(pass));
}

export function gmailSmtpGuard(user, pass) {
  const email = String(user || '').trim();
  const appPass = normalizeAppPassword(pass);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Alamat pengirim harus email lengkap, misalnya namaanda@gmail.com — harus akun Google yang sama dengan App Password.';
  }
  if (!isGoogleAppPassword(appPass)) {
    return `Bukan Google App Password. Yang diminta 16 huruf (boleh tempel "abcd efgh ijkl mnop"), sekarang ${appPass.length} karakter. Jangan isi password login Google — buat App Password di https://myaccount.google.com/apppasswords`;
  }
  return null;
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

/**
 * Firefox reports a dead SMTP hang as NetworkError; Chrome as Failed to fetch.
 * That is not a CORS bug — Railway Hobby blocks outbound SMTP before Gmail replies.
 */
export function formatSmtpTestError(err) {
  const message = String(err?.message || err || '');
  if (/networkerror|failed to fetch|load failed|network request failed|the operation was aborted/i.test(message)) {
    return 'Server Railway tidak bisa menyambung ke Gmail SMTP (port 465/587 diblokir di paket Hobby/Trial). Itu sebabnya di situs live muncul NetworkError, bukan error 535 seperti di komputer lokal. Upgrade Railway ke Pro lalu redeploy, atau kirim email lewat API HTTPS (Resend/SendGrid).';
  }
  return message;
}

