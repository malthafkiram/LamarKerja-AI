/**
 * Controller lamaran: scan brosur, kirim email, daftar, status, follow-up.
 */
import fs from 'fs';
import { Application, Notification } from '../models/index.js';
import { getProfile, getSettings, logAction } from '../helpers/dbHelpers.js';
import { extractTextFromFile } from '../services/ocr.js';
import { extractJobDetailsFromOCR, analyzeMatchAndDraft, generateFollowUpEmail } from '../services/ai.js';
import { sendApplicationEmail } from '../services/email.js';
import { ok, fail, uid } from '../helpers/response.js';
import { toPublic, toPublicList } from '../views/serialize.js';
import { normalizeCreatePayload, pickUpdateFields, followUpInfo } from '../helpers/applicationFields.js';
import { unlinkQuiet } from '../helpers/uploadCleanup.js';

export async function scanBrochure(req, res) {
  const filePath = req.file?.path;
  try {
    if (!req.file) return fail(res, 'File brosur lowongan kerja wajib diunggah.', 400);

    const rawOcrText = await extractTextFromFile(filePath, req.file.mimetype);
    if (!rawOcrText || rawOcrText.length < 5) {
      return fail(res, 'Teks pada gambar brosur tidak dapat terbaca. Pastikan gambar cukup terang dan tulisan terbaca jelas.', 400);
    }

    const userId = uid(req.user);
    const jobDetails = await extractJobDetailsFromOCR(rawOcrText);
    const profile = await getProfile(userId);
    const matchAndDraft = await analyzeMatchAndDraft(profile, {
      ...jobDetails,
      description: jobDetails.description || rawOcrText.slice(0, 4000)
    });
    const settings = await getSettings();

    const attachmentsList = [];
    if (profile.cv_path && fs.existsSync(profile.cv_path)) {
      attachmentsList.push(profile.cv_path);
    }

    const application = await Application.create({
      userId,
      company_name: jobDetails.company_name || 'Perusahaan',
      position: jobDetails.position || 'Posisi',
      source: 'LamarKerja',
      recipient_email: jobDetails.recipient_email || '',
      email_subject: matchAndDraft.email_subject || `Lamaran Pekerjaan: ${jobDetails.position} - ${profile.full_name}`,
      email_body: matchAndDraft.email_body || '',
      brochure_image_path: '',
      extracted_data: jobDetails,
      match_score: matchAndDraft.match_score || 0,
      match_analysis: {
        matching_points: matchAndDraft.matching_points || [],
        missing_points: matchAndDraft.missing_points || [],
        recommendations: matchAndDraft.recommendations || '',
        scam_assessment: jobDetails.scam_assessment || {}
      },
      attachments: attachmentsList,
      status: 'draft'
    });

    let autoSent = false;
    if (
      settings.auto_send_enabled === 1 &&
      jobDetails.recipient_email &&
      matchAndDraft.match_score >= (settings.min_match_score || 70) &&
      (!jobDetails.scam_assessment || !jobDetails.scam_assessment.is_suspicious)
    ) {
      try {
        await sendApplicationEmail({
          recipientEmail: jobDetails.recipient_email,
          subject: matchAndDraft.email_subject,
          bodyText: matchAndDraft.email_body,
          bodyHtml: matchAndDraft.email_body_html,
          attachmentPaths: attachmentsList,
          senderName: profile.sender_name || profile.full_name || req.user.name,
          customSmtp: profile,
          userId
        });
        application.status = 'sent';
        application.sent_at = new Date();
        application.applied_at = new Date();
        await application.save();
        autoSent = true;
      } catch (sendErr) {
        application.error_message = sendErr.message;
        await application.save();
      }
    }

    await logAction('SCAN_BROCHURE', `Brosur "${jobDetails.company_name} - ${jobDetails.position}" dipindai oleh ${req.user.name}`);

    return ok(res, {
      applicationId: application.id,
      jobDetails,
      matchAndDraft,
      rawOcrText,
      autoSent
    });
  } catch (error) {
    return fail(res, error.message);
  } finally {
    unlinkQuiet(filePath);
  }
}

export async function sendApplication(req, res) {
  try {
    const { applicationId, recipientEmail, subject, bodyText, bodyHtml } = req.body;
    const userId = uid(req.user);
    const profile = await getProfile(userId);

    if (!recipientEmail) return fail(res, 'Alamat email tujuan HRD tidak boleh kosong.', 400);

    const attachments = [];
    if (profile.cv_path && fs.existsSync(profile.cv_path)) attachments.push(profile.cv_path);

    const info = await sendApplicationEmail({
      recipientEmail,
      subject,
      bodyText,
      bodyHtml,
      attachmentPaths: attachments,
      senderName: profile.sender_name || profile.full_name || req.user.name,
      customSmtp: profile,
      userId
    });

    if (applicationId) {
      await Application.update({
        recipient_email: recipientEmail,
        email_subject: subject,
        email_body: bodyText,
        status: 'sent',
        sent_at: new Date(),
        applied_at: new Date(),
        error_message: ''
      }, { where: { id: applicationId, userId } });
    } else {
      await Application.create({
        userId,
        company_name: 'Perusahaan',
        position: 'Posisi',
        source: 'LamarKerja',
        recipient_email: recipientEmail,
        email_subject: subject,
        email_body: bodyText,
        attachments,
        status: 'sent',
        sent_at: new Date(),
        applied_at: new Date()
      });
    }

    return ok(res, { message: 'Email lamaran berhasil dikirim!', messageId: info.messageId });
  } catch (error) {
    const msg = error.message || 'Gagal mengirim email.';
    const isConfig = /smtp|gmail|app password|konfigurasi/i.test(msg);
    return fail(res, msg, isConfig ? 400 : 500);
  }
}

export async function listApplications(req, res) {
  try {
    const userId = uid(req.user);
    const applications = await Application.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const publicApps = toPublicList(applications).map((app) => ({
      ...app,
      ...followUpInfo(app)
    }));

    const appliedAt = (r) => r.applied_at || r.sent_at;
    const stats = {
      total: publicApps.length,
      sent_today: publicApps.filter((r) => r.status === 'sent' && appliedAt(r) && new Date(appliedAt(r)) >= startOfDay).length,
      total_sent: publicApps.filter((r) => r.status === 'sent').length,
      interview: publicApps.filter((r) => r.status === 'interview').length,
      offering: publicApps.filter((r) => r.status === 'offering' || r.status === 'accepted').length,
      drafts: publicApps.filter((r) => r.status === 'draft').length,
      needs_follow_up: publicApps.filter((r) => r.needs_follow_up).length
    };

    ensureFollowUpNotifications(userId, publicApps).catch((err) => {
      console.warn('Follow-up notification note:', err.message);
    });

    return ok(res, { applications: publicApps, stats });
  } catch (error) {
    return fail(res, error.message);
  }
}

async function ensureFollowUpNotifications(userId, apps) {
  const due = apps.filter((app) => app.needs_follow_up);
  if (!due.length) return;

  for (const app of due) {
    const existing = await Notification.findOne({
      where: { userId, applicationId: app.id, type: 'status_update' }
    });
    if (existing) continue;
    await Notification.create({
      userId,
      applicationId: app.id,
      company_name: app.company_name,
      position: app.position,
      sender_email: app.recipient_email || '',
      type: 'status_update',
      title: `Perlu follow-up: ${app.company_name}`,
      message: `Lamaran ${app.position} di ${app.company_name} sudah ${app.follow_up_days} hari berstatus Terkirim. Saatnya follow-up.`
    });
  }
}

export async function createApplication(req, res) {
  try {
    const parsed = normalizeCreatePayload(req.body);
    if (!parsed.ok) return fail(res, parsed.error, 400);

    const userId = uid(req.user);
    if (parsed.data.job_url) {
      const existing = await Application.findOne({
        where: { userId, job_url: parsed.data.job_url }
      });
      if (existing) {
        return ok(res, { application: toPublic(existing), alreadyLogged: true });
      }
    }

    const application = await Application.create({
      userId,
      ...parsed.data
    });

    return ok(res, { application: toPublic(application) }, 201);
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function updateApplicationStatus(req, res) {
  try {
    const updateObj = pickUpdateFields(req.body);
    if (updateObj.error) return fail(res, updateObj.error, 400);
    if (Object.keys(updateObj).length === 0) {
      return fail(res, 'Tidak ada field lamaran yang diubah.', 400);
    }

    const [updated] = await Application.update(updateObj, {
      where: { id: req.params.id, userId: uid(req.user) }
    });
    if (!updated) return fail(res, 'Data lamaran tidak ditemukan', 404);
    return ok(res);
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function deleteApplication(req, res) {
  try {
    await Application.destroy({
      where: { id: req.params.id, userId: uid(req.user) }
    });
    return ok(res);
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function followUpDraft(req, res) {
  try {
    const application = await Application.findOne({
      where: { id: req.params.id, userId: uid(req.user) }
    });
    if (!application) return fail(res, 'Data lamaran tidak ditemukan', 404);

    const profile = await getProfile(uid(req.user));
    const draft = await generateFollowUpEmail(application, profile);
    return ok(res, { draft, application: toPublic(application) });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function sendFollowUp(req, res) {
  try {
    const { subject, bodyText, bodyHtml } = req.body;
    const application = await Application.findOne({
      where: { id: req.params.id, userId: uid(req.user) }
    });
    if (!application) return fail(res, 'Data lamaran tidak ditemukan', 404);

    const profile = await getProfile(uid(req.user));

    await sendApplicationEmail({
      recipientEmail: application.recipient_email,
      subject: subject || `Follow-Up: Lamaran Pekerjaan - ${profile.full_name}`,
      bodyText,
      bodyHtml,
      senderName: profile.sender_name || profile.full_name || req.user.name,
      customSmtp: profile,
      userId: uid(req.user)
    });

    application.status = 'interview';
    application.notes = (application.notes ? application.notes + ' | ' : '') +
      `Follow-up terkirim (${new Date().toLocaleDateString('id-ID')})`;
    await application.save();

    await logAction('EMAIL_SENT', `Email Follow-Up dikirim ke ${application.recipient_email} (${application.company_name})`);
    return ok(res, { message: `Email follow-up berhasil dikirim ke ${application.recipient_email}!` });
  } catch (error) {
    return fail(res, error.message);
  }
}
