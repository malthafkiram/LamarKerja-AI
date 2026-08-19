/**
 * Load server/.env even when cwd is the repo root (Railway: npm --prefix server start).
 * Platform env vars (Railway Variables) still win over the file.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const serverDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(serverDir, '.env') });

const jwt = String(process.env.JWT_SECRET || '').trim();
const jwtLike = Object.keys(process.env).filter((k) => /jwt|secret/i.test(k));
console.log(
  `[boot] service=${process.env.RAILWAY_SERVICE_NAME || '-'} ` +
    `NODE_ENV=${process.env.NODE_ENV || '-'} ` +
    `JWT_SECRET=${jwt ? `set (${jwt.length} chars)` : 'MISSING'} ` +
    `jwtLikeKeys=${jwtLike.join(',') || '(none)'}`
);
