/**
 * Helper database: settings global, profil per user, dan audit log.
 */
import { Profile, Setting, Log } from '../models/index.js';
import { toPublic } from '../views/serialize.js';
import { DEFAULT_GROQ_MODEL, resolveGroqModel } from './groqModels.js';

const DEFAULT_SKILLS = [];
const DEFAULT_TARGET_ROLES = [];

function guestProfile() {
  return {
    id: null,
    userId: null,
    full_name: '',
    email: '',
    phone: '',
    city: '',
    linkedin_url: '',
    portfolio_url: '',
    github_url: '',
    headline: '',
    summary: '',
    skills: DEFAULT_SKILLS,
    experience: [],
    education: [],
    certifications: [],
    target_roles: DEFAULT_TARGET_ROLES,
    cv_filename: '',
    cv_path: '',
    cv_text: '',
    smtp_user: '',
    smtp_pass: '',
    sender_name: '',
    generated_cv: null,
    target_role: ''
  };
}

/**
 * Ambil satu baris pengaturan; buat default dari env jika belum ada.
 */
export async function getSettings() {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create({
      groq_api_key: process.env.GROQ_API_KEY || '',
      kimi_api_key: process.env.KIMI_API_KEY || '',
      gemini_api_key: process.env.GEMINI_API_KEY || '',
      database_url: process.env.DATABASE_URL || '',
      ai_provider: 'groq',
      ai_model: DEFAULT_GROQ_MODEL,
      daily_limit: 30,
      min_match_score: 70
    });
  }
  const resolved = resolveGroqModel(settings.ai_model);
  if (settings.ai_model !== resolved) {
    await settings.update({ ai_model: resolved });
  }
  return toPublic(settings);
}

export async function updateSettings(data) {
  const payload = { ...data };
  if (payload.ai_model) payload.ai_model = resolveGroqModel(payload.ai_model);
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create(payload);
  } else {
    await settings.update(payload);
  }
  return toPublic(settings);
}

/**
 * Ambil profil user; buat profil kosong jika belum ada.
 */
export async function getProfile(userId = null) {
  if (!userId) return guestProfile();
  let profile = await Profile.findOne({ where: { userId } });
  if (!profile) {
    profile = await Profile.create({
      userId,
      full_name: '',
      headline: '',
      skills: [],
      target_roles: []
    });
  }
  return toPublic(profile);
}

const PROFILE_UPDATE_KEYS = [
  'full_name',
  'email',
  'phone',
  'city',
  'linkedin_url',
  'portfolio_url',
  'github_url',
  'headline',
  'summary',
  'skills',
  'experience',
  'education',
  'certifications',
  'target_roles',
  'cv_filename',
  'cv_path',
  'cv_text',
  'portfolio_filename',
  'portfolio_path',
  'other_files',
  'smtp_user',
  'smtp_pass',
  'sender_name',
  'generated_cv',
  'target_role'
];

function normalizeSkillList(skills) {
  if (Array.isArray(skills)) {
    return skills.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof skills === 'string') {
    const trimmed = skills.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return normalizeSkillList(parsed);
      } catch {
        // fall through
      }
    }
    return trimmed
      .replace(/^\{|\}$/g, '')
      .split(',')
      .map((item) => item.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  }
  return [];
}

function pickProfileUpdates(data = {}) {
  const payload = {};
  for (const key of PROFILE_UPDATE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== undefined) {
      payload[key] = key === 'skills' ? normalizeSkillList(data[key]) : data[key];
    }
  }
  return payload;
}

export async function updateProfile(data, userId = null) {
  if (!userId) {
    throw new Error('Profil hanya dapat diperbarui oleh pengguna yang login.');
  }
  const payload = pickProfileUpdates(data);
  let profile = await Profile.findOne({ where: { userId } });
  if (!profile) {
    profile = await Profile.create({ ...payload, userId });
  } else {
    profile.set(payload);
    if (Object.prototype.hasOwnProperty.call(payload, 'skills')) {
      profile.changed('skills', true);
    }
    await profile.save();
  }
  return toPublic(profile);
}

export async function logAction(type, message, metadata = {}) {
  try {
    await Log.create({ type, message, metadata });
  } catch (err) {
    console.error('Gagal menyimpan log:', err.message);
  }
}

/** Seed pengaturan awal (tanpa secret hardcoded). */
export async function seedInitialData() {
  try {
    const count = await Setting.count();
    if (count === 0) {
      await Setting.create({
        groq_api_key: process.env.GROQ_API_KEY || '',
        kimi_api_key: process.env.KIMI_API_KEY || '',
        gemini_api_key: process.env.GEMINI_API_KEY || '',
        database_url: process.env.DATABASE_URL || '',
        ai_provider: 'groq',
        ai_model: DEFAULT_GROQ_MODEL,
        daily_limit: 30,
        min_match_score: 70
      });
      console.log('Pengaturan default berhasil di-seed.');
    }
  } catch (err) {
    console.warn('Seeding note:', err.message);
  }
}
