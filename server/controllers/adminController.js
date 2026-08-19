/**
 * Controller admin: daftar user, upgrade paket, hapus akun, log sistem.
 */
import { User, Profile, Log } from '../models/index.js';
import { logAction } from '../helpers/dbHelpers.js';
import { ok, fail, uid } from '../helpers/response.js';
import { toPublicList } from '../views/serialize.js';

export async function listUsers(_req, res) {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: 150
    });
    const formatted = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      plan: u.plan || 'free',
      plan_expires_at: u.plan_expires_at,
      bonus_quota: u.bonus_quota || 0,
      referral_code: u.referral_code || '',
      createdAt: u.createdAt
    }));
    return ok(res, { users: formatted });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function upgradeUser(req, res) {
  try {
    const { userId, plan, durationDays, bonusQuota, role } = req.body;
    if (!userId) return fail(res, 'User ID wajib disertakan.', 400);

    const user = await User.findByPk(userId);
    if (!user) return fail(res, 'Pengguna tidak ditemukan.', 404);

    if (plan) {
      user.plan = plan;
      if (plan === 'pro' || plan === 'vip') {
        const days = durationDays || (plan === 'vip' ? 90 : 30);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
        user.plan_expires_at = expiresAt;
      } else {
        user.plan_expires_at = null;
      }
    }

    if (role && (role === 'admin' || role === 'user')) {
      user.role = role;
    }

    if (typeof bonusQuota === 'number') {
      user.bonus_quota = (user.bonus_quota || 0) + bonusQuota;
    }

    await user.save();
    await logAction(
      'INFO',
      `Admin "${req.user.name}" memperbarui status/role user "${user.name}" (${user.email}) -> Plan: ${user.plan}, Role: ${user.role}`
    );

    return ok(res, {
      message: `Status/Role akun "${user.name}" berhasil diperbarui!`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        plan_expires_at: user.plan_expires_at,
        bonus_quota: user.bonus_quota
      }
    });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function deleteUser(req, res) {
  try {
    const { userId } = req.params;
    if (String(uid(req.user)) === String(userId)) {
      return fail(res, 'Anda tidak dapat menghapus akun Anda sendiri.', 400);
    }

    const user = await User.findByPk(userId);
    if (!user) return fail(res, 'Pengguna tidak ditemukan.', 404);

    await Profile.destroy({ where: { userId } });
    await user.destroy();
    await logAction('WARN', `Admin "${req.user.name}" menghapus akun pengguna "${user.name}" (${user.email})`);

    return ok(res, { message: `Pengguna "${user.name}" berhasil dihapus dari sistem.` });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function listLogs(_req, res) {
  try {
    const logs = await Log.findAll({
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    return ok(res, { logs: toPublicList(logs) });
  } catch (error) {
    return fail(res, error.message);
  }
}
