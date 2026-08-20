/**
 * Gmail SMTP auth helpers. App Passwords are 16 chars; account passwords get 535.
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
