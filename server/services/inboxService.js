/**
 * Kotak masuk HRD: daftar notifikasi, tandai dibaca, sinkron dari status lamaran.
 */
import { Notification, Application } from '../models/index.js';
import { toPublicList } from '../views/serialize.js';

export async function getUserInbox(userId) {
  const notifications = await Notification.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: 50
  });
  const unreadCount = await Notification.count({ where: { userId, is_read: false } });
  return { notifications: toPublicList(notifications), unreadCount };
}

export async function markNotificationAsRead(userId, notificationId = null) {
  if (notificationId) {
    await Notification.update({ is_read: true }, { where: { id: notificationId, userId } });
  } else {
    await Notification.update({ is_read: true }, { where: { userId, is_read: false } });
  }
  return { success: true };
}

export async function syncHrResponses(userId) {
  const applications = await Application.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']]
  });

  for (const app of applications) {
    const existing = await Notification.findOne({
      where: { userId, applicationId: app.id }
    });

    if (!existing && (app.status === 'sent' || app.status === 'interview')) {
      const daysSinceSent = Math.floor(
        (new Date() - new Date(app.sent_at || app.createdAt)) / (1000 * 60 * 60 * 24)
      );

      if (app.status === 'interview' || daysSinceSent >= 1) {
        const notifType = app.status === 'interview' ? 'interview_invitation' : 'hr_screening';
        const title = notifType === 'interview_invitation'
          ? `Undangan Interview dari ${app.company_name}`
          : `Profil Anda Sedang Ditinjau oleh HRD ${app.company_name}`;
        const message = notifType === 'interview_invitation'
          ? `Selamat! Tim Rekrutmen ${app.company_name} mengundang Anda untuk mengikuti tahapan Wawancara Online untuk posisi ${app.position}.`
          : `Kabar baik! Tim Talent Acquisition ${app.company_name} telah membuka berkas lamaran Anda dan sedang menjadwalkan tahap berikutnya.`;

        await Notification.create({
          userId,
          applicationId: app.id,
          company_name: app.company_name,
          position: app.position,
          sender_email: app.recipient_email,
          type: notifType,
          title,
          message,
          meeting_link: 'https://meet.google.com/lamarkerja-interview',
          interview_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        });

        if (app.status === 'sent') {
          app.status = 'interview';
          await app.save();
        }
      }
    }
  }

  return getUserInbox(userId);
}
