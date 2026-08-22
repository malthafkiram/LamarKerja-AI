import React, { useState } from 'react';
import { 
  Lock, Mail, User, AlertCircle, X, LogIn, UserPlus, Eye, EyeOff 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import BrandLogo from './BrandLogo';
import SocialProofStats from './SocialProofStats';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, onSuccess, visitors = 0, registered = 0, live = false }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanName = name.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMessage('Silakan isi email dan kata sandi.');
      setIsLoading(false);
      return;
    }

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login' 
      ? { email: cleanEmail, password: cleanPassword } 
      : { name: cleanName, email: cleanEmail, password: cleanPassword };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || (mode === 'login' ? 'Email atau kata sandi salah.' : 'Pendaftaran gagal.'));
      }

      // Save token & user to localStorage
      localStorage.setItem('lamarkerja_token', data.token);
      localStorage.setItem('lamarkerja_user', JSON.stringify(data.user));

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } catch {}

      // Trigger callback (support both prop names)
      const callback = onAuthSuccess || onSuccess;
      if (callback) {
        callback(data.user, data.token);
      }

      onClose();
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan pada server.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '460px',
        background: '#0B0F19',
        border: '1px solid var(--border-glass)',
        borderRadius: '24px',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BrandLogo size={40} showWordmark={false} />
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                {mode === 'login' ? 'Masuk ke Akun' : 'Daftar Akun Baru'}
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {mode === 'login' ? 'Akses seluruh fitur otomatisasi lamaran' : 'Mulai melamar kerja otomatis & cerdas'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="btn-secondary"
            style={{ padding: '6px', borderRadius: '50%', width: '32px', height: '32px', justifyContent: 'center' }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <SocialProofStats
            variant="auth"
            visitors={visitors}
            registered={registered}
            live={live}
          />
        </div>

        {/* Tab Switcher (Masuk vs Daftar) */}
        <div className="keep-cols" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'rgba(15, 23, 42, 0.8)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-glass)'
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMessage(null); }}
            style={{
              padding: '9px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: mode === 'login' ? 'linear-gradient(135deg, #0284C7, #4F46E5)' : 'transparent',
              color: mode === 'login' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            <LogIn size={15} /> Masuk
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMessage(null); }}
            style={{
              padding: '9px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: mode === 'register' ? 'linear-gradient(135deg, #0284C7, #4F46E5)' : 'transparent',
              color: mode === 'register' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            <UserPlus size={15} /> Daftar
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div style={{
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            color: '#FDA4AF',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} color="#F43F5E" style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'register' && (
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                Nama Lengkap:
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  required
                  className="input-field"
                  style={{ paddingLeft: '36px' }}
                  placeholder="Nama Lengkap Anda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
              Alamat Email:
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
              <input
                type="email"
                required
                className="input-field"
                style={{ paddingLeft: '36px' }}
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
              Kata Sandi:
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                className="input-field"
                style={{ paddingLeft: '36px', paddingRight: '36px' }}
                placeholder="Minimal 6 karakter..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '10px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
            style={{ width: '100%', padding: '13px', marginTop: '6px', fontSize: '0.95rem', fontWeight: 700, justifyContent: 'center' }}
          >
            {isLoading ? (
              <span>Memproses...</span>
            ) : mode === 'login' ? (
              <>
                <LogIn size={16} />
                <span>Masuk Sekarang</span>
              </>
            ) : (
              <>
                <UserPlus size={16} />
                <span>Buat Akun Baru</span>
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          {mode === 'login' ? (
            <span>
              Belum punya akun?{' '}
              <button 
                type="button" 
                onClick={() => setMode('register')} 
                style={{ background: 'none', border: 'none', color: '#38BDF8', cursor: 'pointer', fontWeight: 600 }}
              >
                Daftar sekarang
              </button>
            </span>
          ) : (
            <span>
              Sudah punya akun?{' '}
              <button 
                type="button" 
                onClick={() => setMode('login')} 
                style={{ background: 'none', border: 'none', color: '#38BDF8', cursor: 'pointer', fontWeight: 600 }}
              >
                Masuk di sini
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
