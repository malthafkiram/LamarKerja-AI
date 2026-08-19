import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { Op } from 'sequelize';
import { getSettings, logAction } from '../helpers/dbHelpers.js';
import { Application } from '../models/index.js';

/**
 * Create Nodemailer Transporter based on personal or system settings
 */
export function getMailTransporter(smtpConfig) {
  const user = smtpConfig.smtp_user ? smtpConfig.smtp_user.trim() : '';
  const pass = smtpConfig.smtp_pass ? smtpConfig.smtp_pass.trim() : '';

  if (!user || !pass) {
    throw new Error('Konfigurasi SMTP Gmail belum lengkap. Silakan masukkan Alamat Gmail dan Google App Password di menu Pengaturan.');
  }

  return nodemailer.createTransport({
    host: smtpConfig.smtp_host || 'smtp.gmail.com',
    port: parseInt(smtpConfig.smtp_port, 10) || 465,
    secure: smtpConfig.smtp_secure === 1 || smtpConfig.smtp_port == 465 || true,
    auth: { user, pass }
  });
}

/**
 * Cek kuota email harian di PostgreSQL.
 */
export async function checkDailyLimit(userId = null) {
  const settings = await getSettings();
  const limit = settings.daily_limit || 30;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const where = {
    status: 'sent',
    sent_at: { [Op.between]: [startOfDay, endOfDay] }
  };
  if (userId) where.userId = userId;

  const totalToday = await Application.count({ where });

  if (totalToday >= limit) {
    throw new Error(`Batas pengiriman email harian (${limit} email/hari) telah tercapai demi keamanan akun Gmail Anda.`);
  }

  return { totalToday, limit, remaining: limit - totalToday };
}

/**
 * Send job application email using user's personal SMTP (or system fallback)
 */
export async function sendApplicationEmail({
  recipientEmail,
  subject,
  bodyText,
  bodyHtml,
  attachmentPaths = [],
  senderName = '',
  customSmtp = null,
  userId = null
}) {
  // 1. Check daily limit
  await checkDailyLimit(userId);

  const systemSettings = await getSettings();
  const activeSmtp = {
    smtp_host: customSmtp?.smtp_host || systemSettings.smtp_host || 'smtp.gmail.com',
    smtp_port: customSmtp?.smtp_port || systemSettings.smtp_port || 465,
    smtp_secure: customSmtp?.smtp_secure || systemSettings.smtp_secure || 1,
    smtp_user: customSmtp?.smtp_user || systemSettings.smtp_user,
    smtp_pass: customSmtp?.smtp_pass || systemSettings.smtp_pass
  };

  const fromName = senderName || customSmtp?.sender_name || systemSettings.sender_name || 'Pelamar Kerja';
  const fromAddress = `"${fromName}" <${activeSmtp.smtp_user}>`;

  // 2. Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!recipientEmail || !emailRegex.test(recipientEmail.trim())) {
    throw new Error(`Alamat email tujuan HRD tidak valid: ${recipientEmail}`);
  }

  // 3. Prepare attachments
  const mailAttachments = [];
  for (const filePath of attachmentPaths) {
    if (filePath && fs.existsSync(filePath)) {
      mailAttachments.push({
        filename: path.basename(filePath),
        path: filePath
      });
    }
  }

  // 4. Create Transporter
  const transporter = getMailTransporter(activeSmtp);

  // 5. Send Mail
  const mailOptions = {
    from: fromAddress,
    to: recipientEmail.trim(),
    subject: subject.trim(),
    text: bodyText || '',
    html: bodyHtml || bodyText.replace(/\n/g, '<br/>'),
    attachments: mailAttachments
  };

  const info = await transporter.sendMail(mailOptions);

  await logAction('EMAIL_SENT', `Email lamaran terkirim ke ${recipientEmail} (${fromAddress})`, {
    messageId: info.messageId,
    subject,
    attachmentsCount: mailAttachments.length,
    userId
  });

  return info;
}

/**
 * Verify SMTP connection credentials
 */
export async function verifySmtp(smtpConfig) {
  const transporter = getMailTransporter(smtpConfig);
  await transporter.verify();
  return { success: true, message: '✓ Koneksi Gmail SMTP Berhasil Terhubung!' };
}
