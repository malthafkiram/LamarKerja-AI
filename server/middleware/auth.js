/**
 * Middleware JWT: wajib login, opsional, dan khusus admin.
 */
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'lamarkerja_super_secret_jwt_key_2026';

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

async function loadUserById(id) {
  return User.findByPk(id, { attributes: { exclude: ['password'] } });
}

async function downgradeExpiredPlan(user) {
  if (user.plan && user.plan !== 'free' && user.plan_expires_at) {
    if (new Date() > new Date(user.plan_expires_at)) {
      user.plan = 'free';
      user.plan_expires_at = null;
      await user.save();
    }
  }
}

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Akses ditolak. Silakan login terlebih dahulu.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await loadUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Sesi pengguna tidak valid atau akun telah dihapus.' });
    }

    await downgradeExpiredPlan(user);
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Sesi telah kedaluwarsa. Silakan login kembali.' });
  }
}

export async function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Akses ditolak. Fitur ini hanya dapat diakses oleh Administrator.' });
  }
  next();
}

export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await loadUserById(decoded.id);
      if (user) {
        await downgradeExpiredPlan(user);
        req.user = user;
      }
    }
  } catch {
    // auth opsional: token rusak diabaikan
  }
  next();
}
