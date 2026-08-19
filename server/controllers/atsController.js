/**
 * Controller ATS: audit resume dan rewrite pengalaman ke format STAR.
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { auditResumeATS, rewriteExperienceSTAR } from '../services/atsService.js';
import { unlinkQuiet } from '../helpers/uploadCleanup.js';
import { ok, fail } from '../helpers/response.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export async function auditResume(req, res) {
  try {
    let cvText = req.body.cv_text || '';
    const targetPosition = req.body.target_position || '';
    const targetIndustry = req.body.target_industry || '';

    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (ext === '.pdf') {
        const parsed = await pdfParse(fs.readFileSync(req.file.path));
        cvText = parsed.text || '';
      } else {
        cvText = fs.readFileSync(req.file.path, 'utf8');
      }
    }

    if (!cvText || cvText.trim().length < 40) {
      return fail(res, 'Teks CV tidak terdeteksi atau terlalu pendek (minimal 40 karakter). Silakan paste teks CV atau unggah file PDF yang berisi teks.', 400);
    }

    const auditResult = await auditResumeATS({ cvText, targetPosition, targetIndustry });
    return res.json(auditResult);
  } catch (error) {
    console.error('ATS Audit Error:', error);
    return fail(res, error.message);
  } finally {
    unlinkQuiet(req.file?.path);
  }
}

export async function rewriteStar(req, res) {
  try {
    const { position, original_text, target_role } = req.body;
    if (!original_text || !original_text.trim()) {
      return fail(res, 'Teks pengalaman kerja tidak boleh kosong.', 400);
    }
    const bulletPoints = await rewriteExperienceSTAR({
      position,
      originalText: original_text,
      targetRole: target_role || position
    });
    return ok(res, { bullet_points: bulletPoints });
  } catch (error) {
    return fail(res, error.message);
  }
}
