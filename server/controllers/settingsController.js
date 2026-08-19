/**
 * Controller pengaturan sistem, kesehatan API, dan tes SMTP.
 */
import { User } from '../models/index.js';
import { getSettings, updateSettings, updateProfile, logAction } from '../helpers/dbHelpers.js';
import { verifySmtp } from '../services/email.js';
import { ok, fail, uid } from '../helpers/response.js';

export function health(_req, res) {
  return res.json({ status: 'ok', database: 'PostgreSQL', timestamp: new Date().toISOString() });
}

export async function getAppSettings(_req, res) {
  try {
    const settings = await getSettings();
    const maskedSettings = { ...settings };
    if (maskedSettings.smtp_pass && maskedSettings.smtp_pass.length > 4) {
      maskedSettings.smtp_pass_masked =
        maskedSettings.smtp_pass.slice(0, 3) + '••••••••' + maskedSettings.smtp_pass.slice(-3);
    }
    return ok(res, { settings: maskedSettings });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function savePersonalSmtp(req, res) {
  try {
    const { smtp_user, smtp_pass, sender_name } = req.body;
    const profile = await updateProfile({ smtp_user, smtp_pass, sender_name }, uid(req.user));
    await logAction('INFO', `Pengguna "${req.user.name}" memperbarui kredensial Gmail SMTP pribadinya`);
    return ok(res, { message: 'Kredensial Gmail SMTP pribadi Anda berhasil disimpan!', profile });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function saveGlobalSettings(req, res) {
  try {
    const totalUsers = await User.count();
    if (totalUsers > 0 && req.user && req.user.role !== 'admin') {
      return fail(res, 'Akses ditolak. Pengaturan Groq AI API Key hanya dapat diubah oleh Administrator.', 403);
    }

    const updated = await updateSettings(req.body);
    await logAction('INFO', 'Pengaturan sistem & Groq AI API Key berhasil diperbarui');
    return ok(res, { settings: updated });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function testSmtp(req, res) {
  try {
    const result = await verifySmtp(req.body);
    return ok(res, { message: result.message });
  } catch (error) {
    return fail(res, error.message, 400);
  }
}
