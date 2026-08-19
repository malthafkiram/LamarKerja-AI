import React from 'react';
import { Lock, Sparkles, LogIn, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function LockedFeature({ featureName = 'Fitur Ini', description, onOpenAuth }) {
  return (
    <div className="glass-panel" style={{
      padding: '48px 32px',
      textAlign: 'center',
      maxWidth: '680px',
      margin: '40px auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(11, 15, 25, 0.95))',
      border: '1px solid rgba(56, 189, 248, 0.25)',
      boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.6)'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '16px',
        background: 'rgba(56, 189, 248, 0.12)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Lock size={32} color="#38BDF8" />
      </div>

      <div style={{ maxWidth: '520px' }}>
        <span className="badge badge-cyan" style={{ marginBottom: '8px' }}>Fitur Memerlukan Akun</span>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '6px', marginBottom: '8px' }}>
          {featureName} Dikunci
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          {description || 'Silakan masuk atau daftarkan akun baru Anda secara gratis untuk mulai menggunakan fitur otomatisasi pelamaran kerja pintar ini.'}
        </p>
      </div>

      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid var(--border-glass)',
        borderRadius: '12px',
        padding: '16px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '16px',
        fontSize: '0.82rem',
        color: '#E2E8F0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={15} color="#10B981" />
          <span>100% Gratis & Bebas Biaya</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={15} color="#10B981" />
          <span>Data di PostgreSQL server Anda</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={15} color="#10B981" />
          <span>Auto-Send Gmail SMTP</span>
        </div>
      </div>

      <button
        onClick={onOpenAuth}
        className="btn-primary"
        style={{ padding: '12px 28px', fontSize: '1rem', marginTop: '6px' }}
      >
        <LogIn size={18} />
        <span>Masuk / Daftar Akun Gratis</span>
      </button>
    </div>
  );
}
