/**
 * Controller Auto-Hunter: daftar hasil crawl, jalankan crawl, lamar.
 */
import fs from 'fs';
import { HunterJob, Application } from '../models/index.js';
import { getProfile } from '../helpers/dbHelpers.js';
import { analyzeMatchAndDraft } from '../services/ai.js';
import { sendApplicationEmail } from '../services/email.js';
import { crawlJobs } from '../services/crawler.js';
import { ok, fail, uid } from '../helpers/response.js';
import { toPublicList } from '../views/serialize.js';

export async function listHunterJobs(_req, res) {
  try {
    const jobs = await HunterJob.findAll({
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    return ok(res, { jobs: toPublicList(jobs) });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function runCrawl(req, res) {
  try {
    const { keyword, location } = req.body;
    const results = await crawlJobs({ keyword, location }, uid(req.user));
    return ok(res, { jobs: results, total: results.length });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function applyHunterJob(req, res) {
  try {
    const job = await HunterJob.findByPk(req.params.jobId);
    if (!job) return fail(res, 'Lowongan tidak ditemukan', 404);

    if (!job.contact_email) {
      return fail(
        res,
        'Lowongan ini tidak mencantumkan email langsung. Silakan klik "Buka Tautan Loker" untuk melamar via portal resmi.',
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
      location: job.location
    });

    const attachments = [];
    if (profile.cv_path && fs.existsSync(profile.cv_path)) attachments.push(profile.cv_path);

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

    job.status = 'applied';
    job.applied_at = new Date();
    await job.save();

    const appliedAt = new Date();
    await Application.create({
      userId,
      company_name: job.company,
      position: job.title,
      source: job.platform || job.source || 'LamarKerja',
      job_url: job.job_url || '',
      recipient_email: job.contact_email,
      email_subject: matchAndDraft.email_subject,
      email_body: matchAndDraft.email_body,
      match_score: matchAndDraft.match_score || 80,
      attachments,
      status: 'sent',
      sent_at: appliedAt,
      applied_at: appliedAt
    });

    return ok(res, { message: `Berhasil melamar ke ${job.company}!` });
  } catch (error) {
    return fail(res, error.message);
  }
}
