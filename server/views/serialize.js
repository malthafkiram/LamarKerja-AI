/**
 * View JSON — ubah instance Sequelize jadi objek biasa dengan field `id`.
 * Frontend React memakai `id`, bukan `_id` Mongo.
 */
export function toPublic(record) {
  if (!record) return record;
  const data = typeof record.toJSON === 'function' ? record.toJSON() : { ...record };
  delete data.password;
  data.id = data.id;
  return data;
}

export function toPublicList(records = []) {
  return records.map(toPublic);
}

/** Ringkasan user yang dikirim ke client setelah login/register. */
export function toPublicUser(user) {
  if (!user) return null;
  const data = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    plan: data.plan || (data.role === 'admin' ? 'pro' : 'free'),
    plan_expires_at: data.plan_expires_at,
    bonus_quota: data.bonus_quota || 0,
    cv_builder_usage: data.cv_builder_usage || 0,
    referral_code: data.referral_code || ''
  };
}
