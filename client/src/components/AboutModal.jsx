import React from 'react';
import {
  X, Sparkles, Zap, ShieldCheck, Globe, FileText, Send, Code2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { FEATURES, JOB_HUB_SOURCES_SHORT } from '../data/productFacts';
import BrandLogo from './BrandLogo';
import SocialProofStats from './SocialProofStats';

const FEATURE_ICONS = {
  hub: Globe,
  window: Globe,
  globe: Globe,
  news: FileText,
  tracker: FileText,
  cv: FileText,
  ats: FileText,
  dropsend: Send,
  smtp: Send,
  cover: FileText,
  wa: Send,
  livecode: Code2,
  interview: Sparkles,
  salary: Sparkles,
  scam: ShieldCheck,
  intel: Globe,
  roadmap: Sparkles,
  pitch: Sparkles,
  hunter: Zap,
  inbox: FileText,
  profile: FileText,
  groq: Sparkles,
  pwa: Sparkles
};

export default function AboutModal({ isOpen, onClose, onOpenSecurity, visitors = 0, registered = 0, live = false }) {
  const { t, lang } = useLanguage();
  const id = lang === 'id';

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 30px rgba(14, 165, 233, 0.2)',
          borderRadius: '24px',
          padding: '28px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BrandLogo size={44} showWordmark={false} />
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                {t('about_title', 'Tentang LamarKerja AI')}
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#38BDF8', margin: '2px 0 0 0', fontWeight: 600 }}>
                {t('brand_tagline', 'Smart Automated Job Application Suite')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '8px', borderRadius: '50%', border: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{
          background: 'rgba(14, 165, 233, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '22px',
          fontSize: '0.92rem',
          lineHeight: '1.6',
          color: '#E2E8F0'
        }}>
          {t('about_desc')}
        </div>

        <SocialProofStats
          variant="cards"
          visitors={visitors}
          registered={registered}
          live={live}
        />

        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} color="#FBBF24" />
          <span>{t('about_features_title', id ? 'Fitur (apa adanya):' : 'Features (as they are):')}</span>
        </h3>
        <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: '0 0 14px', lineHeight: 1.5 }}>
          {id
            ? `Sumber Jelajah Loker: ${JOB_HUB_SOURCES_SHORT}. Glints / JobStreet / Indeed / Kalibrr bukan feed live.`
            : `Job Hub sources: ${JOB_HUB_SOURCES_SHORT}. Glints / JobStreet / Indeed / Kalibrr are not live feeds.`}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {FEATURES.map((feat) => {
            const Icon = FEATURE_ICONS[feat.id] || FileText;
            return (
              <div
                key={feat.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-glass)'
                }}
              >
                <Icon size={18} color={feat.accent} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F8FAFC' }}>
                    {feat.title[lang] || feat.title.id}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '3px', lineHeight: 1.55 }}>
                    {feat.body[lang] || feat.body.id}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid var(--border-glass)',
          padding: '16px',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '16px',
          fontSize: '0.8rem',
          color: '#CBD5E1'
        }}>
          <div style={{ fontWeight: 700, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} />
            <span>{id ? 'Kantor & layanan pelanggan:' : 'Office & support:'}</span>
          </div>
          <div>📍 <strong>Alamat:</strong> Jl. Dwijaya 4 No. 13, Kebayoran Lama, Jakarta Selatan, DKI Jakarta 12240</div>
          <div>📧 <strong>Email:</strong> malthafkiram@gmail.com</div>
          <div>📞 <strong>WhatsApp / CS:</strong> +62 851-5771-5522 (085157715522)</div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          padding: '12px 16px',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <ShieldCheck size={20} color="#FBBF24" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div style={{ fontSize: '0.82rem', color: '#FDE68A', lineHeight: 1.55 }}>
            {id
              ? 'SMTP Gmail memakai App Password di profil Anda (teks di PostgreSQL server ini), bukan password akun Google, dan tidak dikirim ke Groq. Penjelasan lengkap ada di menu Keamanan.'
              : 'Gmail SMTP uses an App Password on your profile (plain text in this server’s PostgreSQL), not your Google account password, and it is not sent to Groq. Full detail is under Security.'}
            {onOpenSecurity && (
              <button
                type="button"
                onClick={() => { onClose(); onOpenSecurity(); }}
                style={{
                  display: 'block',
                  marginTop: '8px',
                  background: 'none',
                  border: 'none',
                  color: '#38BDF8',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {id ? 'Buka halaman Keamanan →' : 'Open Security page →'}
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onClose}
            className="btn-primary"
            style={{ padding: '10px 24px', borderRadius: '12px', fontSize: '0.9rem' }}
          >
            {t('about_close', 'Tutup')}
          </button>
        </div>
      </div>
    </div>
  );
}
