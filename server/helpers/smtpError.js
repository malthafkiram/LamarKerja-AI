/** Fail SMTP verify/send before Cloudflare/proxy kills the HTTP request. */
export const SMTP_CONNECT_TIMEOUT_MS = 8000;

export const RAILWAY_SMTP_BLOCKED =
  'Server Railway tidak bisa menyambung ke Gmail SMTP (port 465/587 diblokir di paket Hobby/Trial). Itu sebabnya di situs live muncul NetworkError, bukan error 535 seperti di komputer lokal. Upgrade Railway ke Pro lalu redeploy, atau kirim email lewat API HTTPS (Resend/SendGrid).';

/**
 * Map nodemailer/network failures to an actionable message.
 * Local Gmail 535 must stay visible; Railway port blocks must not hang as NetworkError.
 */
export function describeSmtpError(err) {
  const raw = String(err?.message || err || '').trim();
  const code = String(err?.code || '');
  const blob = `${code} ${raw}`.toLowerCase();

  if (/535|badcredentials|username and password not accepted|invalid login/i.test(raw)) {
    return `${raw} Password ditolak Gmail. Email pengirim harus akun Google yang sama dengan App Password. Buat App Password BARU di https://myaccount.google.com/apppasswords (butuh verifikasi 2 langkah), hapus isian lama, tempel 16 huruf, lalu Uji lagi. Password login Google selalu 535.`;
  }

  if (
    /etimedout|econnrefused|econnection|esocket|enotfound|eai_again|ehostunreach|econnreset/.test(blob) ||
    /connection timeout|greeting never received|connect failed|socket closed/.test(blob)
  ) {
    return RAILWAY_SMTP_BLOCKED;
  }

  return raw || 'Gagal menguji SMTP.';
}
