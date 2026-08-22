/**
 * Controller direktori loker (Job Hub): daftar, sinkron, dan lamar via email.
 */
import fs from 'fs';
import { JobDirectory, Application } from '../models/index.js';
import { getProfile, logAction } from '../helpers/dbHelpers.js';
import { analyzeMatchAndDraft } from '../services/ai.js';
import { sendApplicationEmail } from '../services/email.js';
import { getDirectoryJobs, ingestLinkedInLiveSearchForDirectory, shouldLiveIngestSearch, syncAllJobs } from '../services/jobHubService.js';
import { getJobNews, syncJobNews } from '../services/jobNewsService.js';
import { ok, fail, uid } from '../helpers/response.js';

export async function listJobs(req, res) {
  try {
    const { search, platform, category, work_type, location, experience_level, page, limit } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    let liveIngest = null;

    if (shouldLiveIngestSearch(search, { page: pageNum, platform })) {
      try {
        liveIngest = await ingestLinkedInLiveSearchForDirectory(search);
      } catch (err) {
        console.warn('[JobHub] live LinkedIn search gagal:', err.message);
        liveIngest = {
          attempted: false,
          skipped: 'error',
          keyword: search,
          fetched: 0,
          inserted: 0,
          updated: 0,
          error: err.message
        };
      }
    }

    const result = await getDirectoryJobs({
      search,
      platform,
      category,
      work_type,
      location,
      experience_level,
      page: pageNum,
      limit: parseInt(limit, 10) || 100
    });
    return ok(res, { ...result, liveIngest });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function listNews(req, res) {
  try {
    const { kind, search, page, limit } = req.query;
    const result = await getJobNews({
      kind: kind || 'all',
      search,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 12
    });
    return ok(res, result);
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function syncJobs(req, res) {
  try {
    const newsPromise = syncJobNews().catch((err) => {
      console.warn('[JobNews] sinkron berita gagal (lowongan tetap tersimpan):', err.message);
      return {
        total: 0,
        inserted: 0,
        updated: 0,
        purged: 0,
        error: err.message
      };
    });
    const syncResult = await syncAllJobs();
    const news = await newsPromise;
    return res.json({ ...syncResult, news });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function applyToJob(req, res) {
  try {
    const job = await JobDirectory.findByPk(req.params.jobId);
    if (!job) return fail(res, 'Lowongan tidak ditemukan', 404);

    if (!job.contact_email) {
      return fail(
        res,
        'Lowongan ini tidak mencantumkan email rekrutmen. Silakan klik tombol "Buka Lowongan Asli" untuk melamar via portal.',
        400
      );
    }

    const userId = uid(req.user);
    const profile = await getProfile(userId);

    const matchAndDraft = await analyzeMatchAndDraft(profile, {
      company_name: job.company,
      position: job.title,
      recipient_email: job.contact_email,
      requirements: job.requirements || [],
      description: job.description || '',
      responsibilities: [],
      location: job.location,
      work_type: job.work_type,
      salary_range: job.salary,
      experience_level: job.experience_level
    });

    const attachments = [];
    if (profile.cv_path && fs.existsSync(profile.cv_path)) {
      attachments.push(profile.cv_path);
    }

    await sendApplicationEmail({
      recipientEmail: job.contact_email,
      subject: matchAndDraft.email_subject,
      bodyText: matchAndDraft.email_body,
      bodyHtml: matchAndDraft.email_body_html,
      attachmentPaths: attachments,
      senderName: profile.sender_name || profile.full_name || req.user.name,
      customSmtp: profile,
      userId
    });

    const appliedAt = new Date();
    await Application.create({
      userId,
      company_name: job.company,
      position: job.title,
      source: job.platform || 'LamarKerja',
      job_url: job.job_url || '',
      recipient_email: job.contact_email,
      email_subject: matchAndDraft.email_subject,
      email_body: matchAndDraft.email_body,
      match_score: matchAndDraft.match_score || 85,
      attachments,
      status: 'sent',
      sent_at: appliedAt,
      applied_at: appliedAt
    });

    await logAction('EMAIL_SENT', `Lamaran direktori ke ${job.company} (${job.platform})`);
    return ok(res, { message: `Berhasil melamar ke ${job.company} (${job.platform})!` });
  } catch (error) {
    return fail(res, error.message);
  }
}
