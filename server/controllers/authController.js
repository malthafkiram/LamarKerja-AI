/**
 * Controller autentikasi: daftar, masuk, dan data sesi.
 */
import { User, Profile } from '../models/index.js';
import { generateToken, downgradeExpiredPlan } from '../middleware/auth.js';
import { logAction } from '../helpers/dbHelpers.js';
import { ok, fail, uid } from '../helpers/response.js';
import { toPublicUser } from '../views/serialize.js';
import { broadcastSocialProof } from '../services/socialProof.js';

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return fail(res, 'Nama, email, dan kata sandi wajib diisi.', 400);
    }

    const existingUser = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existingUser) {
      return fail(res, 'Email ini sudah terdaftar. Silakan login.', 400);
    }

    const totalUsers = await User.count();
    const assignedRole = totalUsers === 0 ? 'admin' : 'user';

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
      plan: assignedRole === 'admin' ? 'pro' : 'free',
      referral_code: Math.random().toString(36).substring(2, 8).toUpperCase()
    });

    await Profile.create({
      userId: user.id,
      full_name: '',
      email: '',
      headline: '',
      skills: []
    });

    const token = generateToken(user);
    await logAction('INFO', `Pengguna baru "${user.name}" (${user.role}) berhasil mendaftar`, { userId: user.id });
    broadcastSocialProof().catch(() => {});

    return ok(res, { token, user: toPublicUser(user) });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return fail(res, 'Email dan kata sandi wajib diisi.', 400);
    }

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) return fail(res, 'Email atau kata sandi salah.', 401);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return fail(res, 'Email atau kata sandi salah.', 401);

    await downgradeExpiredPlan(user);
    const token = generateToken(user);
    await logAction('INFO', `Pengguna "${user.name}" (${user.role}) berhasil masuk`, { userId: uid(user) });

    return ok(res, { token, user: toPublicUser(user) });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function me(req, res) {
  try {
    return ok(res, { user: toPublicUser(req.user) });
  } catch (error) {
    return fail(res, error.message);
  }
}
