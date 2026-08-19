/**
 * Controller profil CV: baca, simpan, unggah CV, dan saran AI.
 */
import fs from 'fs';
import { createRequire } from 'module';
import { getProfile, updateProfile, logAction } from '../helpers/dbHelpers.js';
import { extractTextFromFile } from '../services/ocr.js';
import { optimizeProfile } from '../services/ai.js';
import { hasStoredCvFile, unlinkQuiet } from '../helpers/uploadCleanup.js';
import { ok, fail, uid } from '../helpers/response.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export async function getUserProfile(req, res) {
  try {
    const profile = await getProfile(uid(req.user));
    return ok(res, { profile });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function saveUserProfile(req, res) {
  try {
    const profile = await updateProfile(req.body, uid(req.user));
    await logAction('INFO', `Pengguna "${req.user.name}" memperbarui profil CV`);
    return ok(res, { profile });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function uploadCv(req, res) {
  try {
    if (!req.file) return fail(res, 'Tidak ada file CV yang diunggah.', 400);

    const existing = await getProfile(uid(req.user));
    if (hasStoredCvFile(existing)) {
      unlinkQuiet(req.file.path);
      return fail(res, 'Hapus CV lama dulu sebelum mengunggah yang baru.', 409);
    }

    const filePath = req.file.path;
    let extractedCvText = '';

    if (req.file.mimetype.includes('pdf') || req.file.originalname.endsWith('.pdf')) {
      try {
        const pdfData = await pdfParse(fs.readFileSync(filePath));
        extractedCvText = pdfData.text || '';
      } catch (err) {
        console.warn('PDF text extraction error:', err.message);
      }
    } else {
      try {
        extractedCvText = await extractTextFromFile(filePath, req.file.mimetype);
      } catch (err) {
        console.warn('Image CV OCR error:', err.message);
      }
    }

    const updatedProfile = await updateProfile({
      cv_filename: req.file.originalname,
      cv_path: filePath,
      cv_text: extractedCvText.trim()
    }, uid(req.user));

    await logAction('INFO', `Pengguna "${req.user.name}" mengunggah CV "${req.file.originalname}"`);
    return ok(res, { profile: updatedProfile, extractedTextLength: extractedCvText.length });
  } catch (error) {
    unlinkQuiet(req.file?.path);
    return fail(res, error.message);
  }
}

export async function deleteCv(req, res) {
  try {
    const userId = uid(req.user);
    const profile = await getProfile(userId);
    unlinkQuiet(profile?.cv_path);
    const updatedProfile = await updateProfile({
      cv_filename: '',
      cv_path: ''
    }, userId);
    await logAction('INFO', `Pengguna "${req.user.name}" menghapus berkas CV`);
    return ok(res, { profile: updatedProfile });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function optimizeUserProfile(req, res) {
  try {
    const profile = await getProfile(uid(req.user));
    const suggestions = await optimizeProfile(profile);
    return ok(res, { suggestions });
  } catch (error) {
    return fail(res, error.message);
  }
}
