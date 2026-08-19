/**
 * Konfigurasi Multer untuk unggah brosur loker dan file CV.
 */
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadBase = path.join(__dirname, '..', '..', 'uploads');
export const flyersDir = path.join(uploadBase, 'flyers');
export const cvsDir = path.join(uploadBase, 'cvs');
export const othersDir = path.join(uploadBase, 'others');

export function ensureUploadDirs() {
  [uploadBase, flyersDir, cvsDir, othersDir].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

const flyerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, flyersDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `flyer_${Date.now()}_${Math.round(Math.random() * 1e4)}${ext}`);
  }
});

const cvStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, cvsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `cv_${Date.now()}_${path.basename(file.originalname, ext)}${ext}`);
  }
});

export const uploadFlyer = multer({ storage: flyerStorage, limits: { fileSize: 20 * 1024 * 1024 } });
export const uploadCv = multer({ storage: cvStorage, limits: { fileSize: 20 * 1024 * 1024 } });
