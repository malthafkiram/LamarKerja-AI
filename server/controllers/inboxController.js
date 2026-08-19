/**
 * Controller kotak masuk HRD (notifikasi simulasi).
 */
import { getUserInbox, markNotificationAsRead, syncHrResponses } from '../services/inboxService.js';
import { ok, fail, uid } from '../helpers/response.js';

export async function getInbox(req, res) {
  try {
    const inboxData = await getUserInbox(uid(req.user));
    return ok(res, inboxData);
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function syncInbox(req, res) {
  try {
    const updatedInbox = await syncHrResponses(uid(req.user));
    return ok(res, { ...updatedInbox, message: 'Kotak masuk balasan HRD berhasil disinkronkan!' });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function markRead(req, res) {
  try {
    const { notificationId } = req.body;
    await markNotificationAsRead(uid(req.user), notificationId);
    return ok(res, { message: 'Notifikasi ditandai telah dibaca' });
  } catch (error) {
    return fail(res, error.message);
  }
}
