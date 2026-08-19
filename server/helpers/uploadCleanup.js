/**
 * Disk hygiene for EC2 uploads: unlink temp flyers / ATS files,
 * and refuse a second profile CV until the first is deleted.
 */
import fs from 'fs';
import path from 'path';
import { flyersDir } from '../middleware/upload.js';

export const FLYER_MAX_AGE_MS = 60 * 60 * 1000;

export function unlinkQuiet(filePath) {
  if (!filePath || typeof filePath !== 'string') return false;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function hasStoredCvFile(profile) {
  const stored = profile?.cv_path;
  return Boolean(stored && fs.existsSync(stored));
}

export function sweepStaleFlyers({
  dir = flyersDir,
  maxAgeMs = FLYER_MAX_AGE_MS,
  now = Date.now()
} = {}) {
  if (!dir || !fs.existsSync(dir)) return { deleted: 0 };
  let deleted = 0;
  let names = [];
  try {
    names = fs.readdirSync(dir);
  } catch {
    return { deleted: 0 };
  }
  for (const name of names) {
    const full = path.join(dir, name);
    try {
      const st = fs.statSync(full);
      if (!st.isFile()) continue;
      if (now - st.mtimeMs >= maxAgeMs) {
        fs.unlinkSync(full);
        deleted += 1;
      }
    } catch {
      /* skip locked / vanished files */
    }
  }
  return { deleted };
}

export function startFlyerSweep({ intervalMs = FLYER_MAX_AGE_MS } = {}) {
  try {
    sweepStaleFlyers();
  } catch (err) {
    console.warn('Flyer sweep:', err.message);
  }
  const timer = setInterval(() => {
    try {
      sweepStaleFlyers();
    } catch (err) {
      console.warn('Flyer sweep:', err.message);
    }
  }, intervalMs);
  if (typeof timer.unref === 'function') timer.unref();
  return timer;
}
