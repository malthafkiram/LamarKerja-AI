/**
 * Controller CV generator: refine AI, simpan ke profil, ambil CV tersimpan.
 */
import { Profile } from '../models/index.js';
import { refineCVWithAI } from '../services/cvService.js';
import { ok, fail, uid } from '../helpers/response.js';

export async function refineCv(req, res) {
  try {
    const rawData = req.body;
    if (!rawData || !rawData.target_role) {
      return fail(res, 'Posisi/Target pekerjaan yang dituju wajib diisi agar AI dapat mengoptimalkan kata kunci ATS.', 400);
    }

    const user = req.user;
    const isProOrVip = user && (user.plan === 'pro' || user.plan === 'vip' || user.role === 'admin');

    if (!isProOrVip && user) {
      if ((user.cv_builder_usage || 0) >= 1) {
        return res.status(403).json({
          success: false,
          error: 'Batas 1x uji coba gratis Buat CV AI telah tercapai. Silakan upgrade ke PRO untuk akses unlimited tanpa batas!',
          require_upgrade: true
        });
      }
    }

    const refinedResult = await refineCVWithAI(rawData);

    if (user && !isProOrVip) {
      user.cv_builder_usage = (user.cv_builder_usage || 0) + 1;
      await user.save();
    }

    return ok(res, {
      cv: refinedResult,
      usage: user ? user.cv_builder_usage : 1,
      is_pro: isProOrVip
    });
  } catch (error) {
    console.error('CV Refine API Error:', error);
    return fail(res, error.message || 'Gagal menyempurnakan CV dengan AI.');
  }
}

export async function saveCv(req, res) {
  try {
    const { cvData, targetRole } = req.body;
    if (!cvData) return fail(res, 'Data CV tidak boleh kosong.', 400);

    if (req.user) {
      const profile = await Profile.findOne({ where: { userId: uid(req.user) } });
      if (profile) {
        const updates = { generated_cv: cvData, target_role: targetRole || profile.target_role };
        if (cvData.refined_skills?.hard_skills) {
          updates.skills = [...new Set([...(profile.skills || []), ...cvData.refined_skills.hard_skills])];
        }
        await profile.update(updates);
      }
    }

    return ok(res, { message: 'CV berhasil disimpan ke profil akun Anda!' });
  } catch (error) {
    console.error('CV Save Error:', error);
    return fail(res, error.message);
  }
}

export async function getSavedCv(req, res) {
  try {
    if (!req.user) return ok(res, { savedCV: null });
    const profile = await Profile.findOne({ where: { userId: uid(req.user) } });
    return ok(res, {
      savedCV: profile?.generated_cv || null,
      targetRole: profile?.target_role || ''
    });
  } catch (error) {
    return fail(res, error.message);
  }
}
