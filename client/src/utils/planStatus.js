export function isPaidPlan(user = {}) {
  const plan = user?.plan;
  return plan === 'pro' || plan === 'vip' || user?.role === 'admin';
}

export function daysRemaining(expiresAt, now = new Date()) {
  if (!expiresAt) return null;
  const end = new Date(expiresAt);
  if (Number.isNaN(end.getTime())) return null;
  const ms = end.getTime() - new Date(now).getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function effectiveSendLimit(dailyLimit = 30, bonusQuota = 0) {
  const daily = Number(dailyLimit) > 0 ? Number(dailyLimit) : 30;
  const bonus = Math.max(0, Number(bonusQuota) || 0);
  return daily + bonus;
}

export function remainingSendQuota(sentToday = 0, dailyLimit = 30, bonusQuota = 0) {
  return Math.max(0, effectiveSendLimit(dailyLimit, bonusQuota) - (Number(sentToday) || 0));
}

function expiryTone(daysLeft) {
  if (daysLeft == null) return 'ok';
  if (daysLeft <= 3) return 'urgent';
  if (daysLeft <= 7) return 'warn';
  return 'ok';
}

function quotaTone(remaining) {
  if (remaining <= 1) return 'urgent';
  if (remaining <= 3) return 'warn';
  return 'ok';
}

export function buildPlanNotices({
  user,
  sentToday = 0,
  dailyLimit = 30,
  lang = 'id',
  now = new Date()
} = {}) {
  const paid = isPaidPlan(user);
  const daysLeft = paid ? daysRemaining(user?.plan_expires_at, now) : null;
  const quotaRemaining = remainingSendQuota(
    sentToday,
    dailyLimit,
    user?.bonus_quota
  );
  const planLabel = (user?.plan || 'free').toUpperCase();
  const id = lang === 'id';

  let expiryText = '';
  if (paid && daysLeft == null) {
    expiryText = id ? `Paket ${planLabel} aktif` : `${planLabel} plan active`;
  } else if (paid && daysLeft === 0) {
    expiryText = id
      ? `Paket ${planLabel} berakhir hari ini`
      : `${planLabel} plan ends today`;
  } else if (paid) {
    expiryText = id
      ? `Paket ${planLabel} aktif · sisa ${daysLeft} hari`
      : `${planLabel} plan · ${daysLeft} days left`;
  }

  const quotaText = id
    ? quotaRemaining === 1
      ? 'Sisa kuota kirim lamaran tinggal 1 lagi'
      : `Sisa kuota kirim hari ini: ${quotaRemaining}`
    : quotaRemaining === 1
      ? 'Only 1 application send left today'
      : `Sends remaining today: ${quotaRemaining}`;

  return {
    daysLeft,
    quotaRemaining,
    expiryText,
    quotaText,
    expiryTone: expiryTone(daysLeft),
    quotaTone: quotaTone(quotaRemaining),
    showExpiry: Boolean(expiryText),
    showQuota: Boolean(user)
  };
}
