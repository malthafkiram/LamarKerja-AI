/**
 * Controller pengaturan sistem, kesehatan API, dan tes SMTP.
 */
import { getSettings, updateSettings, updateProfile, logAction } from '../helpers/dbHelpers.js';
import { verifySmtp } from '../services/email.js';
import { toClientSettings } from '../helpers/settingsPublic.js';
import { ok, fail, uid } from '../helpers/response.js';

export function health(_req, res) {
  return res.json({ status: 'ok', database: 'PostgreSQL', timestamp: new Date().toISOString() });
}

export async function getAppSettings(req, res) {
  try {
    const settings = await getSettings();
    const isAdmin = req.user?.role === 'admin';
    return ok(res, { settings: toClientSettings(settings, { isAdmin }) });
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
    const updated = await updateSettings(req.body);
    await logAction('INFO', 'Pengaturan sistem & Groq AI API Key berhasil diperbarui');
    return ok(res, { settings: toClientSettings(updated, { isAdmin: true }) });
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
