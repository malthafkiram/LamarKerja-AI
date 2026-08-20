export function effectiveSendLimit(dailyLimit = 30, bonusQuota = 0) {
  const daily = Number(dailyLimit) > 0 ? Number(dailyLimit) : 30;
  const bonus = Math.max(0, Number(bonusQuota) || 0);
  return daily + bonus;
}

export function isSmtpCountedSend(app = {}) {
  const email = String(app.recipient_email || '').trim();
  return app.status === 'sent' && Boolean(email);
}
