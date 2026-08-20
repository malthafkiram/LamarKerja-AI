import React from 'react';
import { Clock, Send, Crown, AlertTriangle } from 'lucide-react';
import { buildPlanNotices } from '../utils/planStatus';

const TONE = {
  ok: { bg: 'rgba(14, 165, 233, 0.1)', border: 'rgba(56, 189, 248, 0.28)', color: '#7DD3FC' },
  warn: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.4)', color: '#FBBF24' },
  urgent: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.4)', color: '#F87171' }
};

export default function PlanStatusBanner({
  currentUser,
  stats,
  settings,
  lang = 'id',
  onOpenUpgradePro
}) {
  if (!currentUser) return null;

  const notices = buildPlanNotices({
    user: currentUser,
    sentToday: stats?.sent_today,
    dailyLimit: settings?.daily_limit,
    lang
  });

  if (!notices.showExpiry && !notices.showQuota) return null;

  const worst =
    notices.quotaTone === 'urgent' || notices.expiryTone === 'urgent'
      ? 'urgent'
      : notices.quotaTone === 'warn' || notices.expiryTone === 'warn'
        ? 'warn'
        : 'ok';
  const tone = TONE[worst];

  return (
    <div
      style={{
        margin: '0 auto 16px',
        maxWidth: '1440px',
        padding: '10px 14px',
        borderRadius: '12px',
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        color: tone.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
        fontSize: '0.82rem',
        fontWeight: 600
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
        {notices.showExpiry && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Crown size={14} />
            {notices.expiryText}
          </span>
        )}
        {notices.showQuota && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            {notices.quotaTone === 'urgent' ? <AlertTriangle size={14} /> : <Send size={14} />}
            {notices.quotaText}
          </span>
        )}
        {notices.daysLeft != null && notices.daysLeft <= 7 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: 0.9 }}>
            <Clock size={14} />
            {lang === 'id' ? 'Perpanjang paket agar fitur PRO tidak terputus.' : 'Renew so PRO features stay on.'}
          </span>
        )}
      </div>
      {onOpenUpgradePro && (notices.daysLeft != null && notices.daysLeft <= 7 || notices.quotaRemaining <= 1) && (
        <button
          type="button"
          onClick={onOpenUpgradePro}
          className="btn-primary"
          style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 800, borderRadius: '9px' }}
        >
          {lang === 'id' ? 'Perpanjang / Top-Up' : 'Renew / Top-Up'}
        </button>
      )}
    </div>
  );
}
