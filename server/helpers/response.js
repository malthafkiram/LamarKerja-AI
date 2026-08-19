/**
 * Helper response HTTP — bentuk JSON seragam { success, ... }.
 */
export function ok(res, data = {}, status = 200) {
  return res.status(status).json({ success: true, ...data });
}

export function fail(res, error, status = 500) {
  return res.status(status).json({ success: false, error });
}

/** Ambil id pengguna dari instance Sequelize (pengganti user._id Mongo). */
export function uid(user) {
  return user?.id ?? null;
}
