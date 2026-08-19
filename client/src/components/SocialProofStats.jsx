import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { formatSocialProofLine } from '../utils/socialProof';

export default function SocialProofStats({
  visitors = 0,
  registered = 0,
  live = false,
  variant = 'line'
}) {
  const { lang, t } = useLanguage();
  const line = formatSocialProofLine({ visitors, registered }, lang);

  const pulse = (
    <span
      aria-hidden="true"
      title={live ? t('proof_live', lang === 'id' ? 'langsung' : 'live') : ''}
      style={{
        width: variant === 'cards' ? 8 : 7,
        height: variant === 'cards' ? 8 : 7,
        borderRadius: '50%',
        background: live ? '#34D399' : '#64748B',
        boxShadow: live ? '0 0 8px rgba(52, 211, 153, 0.85)' : 'none',
        flexShrink: 0
      }}
    />
  );

  if (variant === 'cards') {
    const items = [
      {
        label: t('proof_visitors_label', lang === 'id' ? 'Pengunjung unik' : 'Unique visitors'),
        value: visitors
      },
      {
        label: t('proof_registered_label', lang === 'id' ? 'Sudah daftar' : 'Registered'),
        value: registered
      }
    ];
    return (
      <div style={{ marginBottom: '22px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '10px',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: '#38BDF8'
        }}>
          {pulse}
          <span>{t('proof_about_title', lang === 'id' ? 'Pengunjung & pendaftar' : 'Visitors & sign-ups')}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {items.map((item) => (
            <div
              key={item.label}
              style={{
                background: 'rgba(14, 165, 233, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '14px',
                padding: '14px 16px'
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.02em' }}>
                {item.label}
              </div>
              <div style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#F8FAFC',
                fontVariantNumeric: 'tabular-nums',
                marginTop: '6px'
              }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '8px 0 0', lineHeight: 1.45 }}>
          {t(
            'proof_hint',
            lang === 'id'
              ? 'Pengunjung unik (cookie anonim). Pendaftar = jumlah akun di database.'
              : 'Unique visitors (anonymous cookie). Registered = account count in the database.'
          )}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: variant === 'auth' ? '0.78rem' : '0.74rem',
        color: '#94A3B8',
        fontVariantNumeric: 'tabular-nums',
        background: variant === 'auth' ? 'rgba(14, 165, 233, 0.08)' : 'transparent',
        border: variant === 'auth' ? '1px solid rgba(56, 189, 248, 0.22)' : 'none',
        borderRadius: variant === 'auth' ? '999px' : 0,
        padding: variant === 'auth' ? '6px 12px' : 0
      }}
      title={t(
        'proof_hint',
        lang === 'id'
          ? 'Pengunjung unik (cookie anonim). Pendaftar = jumlah akun di database.'
          : 'Unique visitors (anonymous cookie). Registered = account count in the database.'
      )}
    >
      {pulse}
      <span>{line}</span>
    </div>
  );
}
