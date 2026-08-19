import React, { useState, useEffect } from 'react';
import { 
  Settings, Key, Mail, Shield, CheckCircle2, AlertCircle, 
  ExternalLink, Save, RefreshCw, X, HelpCircle, Lock, Database, 
  ShieldAlert, UserCheck, Languages, Smartphone, Download, Sparkles, Check,
  User, LogIn, LogOut, Crown, Users, Search, Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLanguage } from '../context/LanguageContext';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  settings, 
  currentUser, 
  onSettingsUpdated,
  onLogout,
  onOpenAuth,
  deferredPrompt,
  onInstallApp
}) {
  if (!isOpen) return null;

  const { lang, setLanguage, t } = useLanguage();
  const isAdmin = currentUser?.role === 'admin';

  // Device detection: Check if user is accessing from Android / Mobile / Tablet
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const isMobileAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Tablet/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth <= 1024;
      setIsMobileOrTablet(isMobileAgent || isSmallScreen);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const [formData, setFormData] = useState({
    // User's SMTP settings
    smtp_user: '',
    smtp_pass: '',
    sender_name: '',
    smtp_host: 'smtp.gmail.com',
    smtp_port: 465,
    smtp_secure: 1,

    // Admin-only Global Settings
    groq_api_key: settings?.groq_api_key || '',
    mongodb_uri: settings?.mongodb_uri || '',
    ai_provider: 'groq',
    ai_model: settings?.ai_model || 'llama-3.3-70b-versatile',
    daily_limit: settings?.daily_limit || 30,
    auto_send_enabled: settings?.auto_send_enabled || 0,
    min_match_score: settings?.min_match_score || 70,
  });

  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  // Admin Groq AI settings state
  const [isAdminSaving, setIsAdminSaving] = useState(false);
  const [adminSaveSuccess, setAdminSaveSuccess] = useState(false);
  const [adminErrorMessage, setAdminErrorMessage] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // Admin User Management State
  const [adminUsers, setAdminUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [upgradingUserId, setUpgradingUserId] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const fetchAdminUsers = async () => {
    if (currentUser?.role !== 'admin') return;
    setIsLoadingUsers(true);
    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch('/api/admin/users', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setAdminUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchAdminUsers();
    }
  }, [currentUser]);

  const handleAdminUpgradeUser = async (userId, plan, durationDays, role) => {
    setUpgradingUserId(userId);
    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch('/api/admin/upgrade-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ userId, plan, durationDays, role })
      });
      const data = await res.json();
      if (data.success) {
        try {
          confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
        } catch {}
        fetchAdminUsers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpgradingUserId(null);
    }
  };

  const handleAdminDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Yakin ingin menghapus akun "${userName}" secara permanen? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    setUpgradingUserId(userId);
    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch(`/api/admin/user/${userId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        fetchAdminUsers();
      } else {
        alert(data.error || 'Gagal menghapus pengguna');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpgradingUserId(null);
    }
  };

  // Load user's personal profile SMTP settings
  useEffect(() => {
    loadUserSmtp();
  }, [currentUser]);

  const loadUserSmtp = async () => {
    try {
      const token = localStorage.getItem('lamarkerja_token');
      if (token) {
        const res = await fetch('/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.profile) {
          setFormData(prev => ({
            ...prev,
            smtp_user: data.profile.smtp_user || prev.smtp_user || settings?.smtp_user || '',
            smtp_pass: data.profile.smtp_pass || prev.smtp_pass || settings?.smtp_pass || '',
            sender_name: data.profile.sender_name || data.profile.full_name || prev.sender_name || settings?.sender_name || ''
          }));
        }
      } else {
        setFormData(prev => ({
          ...prev,
          smtp_user: settings?.smtp_user || '',
          smtp_pass: settings?.smtp_pass || '',
          sender_name: settings?.sender_name || ''
        }));
      }
    } catch (err) {
      console.warn('Failed to load personal SMTP:', err.message);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTestSmtp = async () => {
    if (!formData.smtp_user || !formData.smtp_pass) {
      setErrorMessage(lang === 'id' ? 'Harap isi Alamat Email Gmail dan App Password terlebih dahulu.' : 'Please fill in Gmail Address and App Password first.');
      return;
    }

    setIsTestingSmtp(true);
    setErrorMessage(null);
    setTestResult(null);

    try {
      const res = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtp_user: formData.smtp_user,
          smtp_pass: formData.smtp_pass
        })
      });

      const data = await res.json();
      setTestResult(data);
      if (data.success) {
        try {
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
        } catch {}
      }
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleSaveSmtp = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const token = localStorage.getItem('lamarkerja_token');
      if (token) {
        const res = await fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            smtp_user: formData.smtp_user,
            smtp_pass: formData.smtp_pass,
            sender_name: formData.sender_name
          })
        });
        const data = await res.json();
        if (data.success) {
          setSaveSuccess(true);
          if (onSettingsUpdated) onSettingsUpdated(formData);
          setTimeout(() => setSaveSuccess(false), 3000);
        } else {
          setErrorMessage(data.error || 'Gagal menyimpan pengaturan.');
        }
      } else {
        setSaveSuccess(true);
        if (onSettingsUpdated) onSettingsUpdated(formData);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      setErrorMessage('Terjadi kesalahan saat menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAdminSettings = async () => {
    setIsAdminSaving(true);
    setAdminErrorMessage(null);
    setAdminSaveSuccess(false);

    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          groq_api_key: formData.groq_api_key,
          ai_model: formData.ai_model,
          daily_limit: Number(formData.daily_limit) || 30,
          min_match_score: Number(formData.min_match_score) || 70,
          mongodb_uri: formData.mongodb_uri
        })
      });

      const data = await res.json();
      if (data.success) {
        setAdminSaveSuccess(true);
        if (onSettingsUpdated) onSettingsUpdated(data.settings);
        try {
          confetti({ particleCount: 35, spread: 55, origin: { y: 0.7 } });
        } catch {}
        setTimeout(() => setAdminSaveSuccess(false), 3500);
      } else {
        setAdminErrorMessage(data.error || (lang === 'id' ? 'Gagal menyimpan pengaturan API Key.' : 'Failed to save API Key settings.'));
      }
    } catch (err) {
      setAdminErrorMessage(lang === 'id' ? 'Gagal menghubungi server untuk memperbarui API Key.' : 'Failed to reach server to update API Key.');
    } finally {
      setIsAdminSaving(false);
    }
  };

  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setInstalledSuccess(true);
          try {
            confetti({ particleCount: 50, spread: 70, origin: { y: 0.5 } });
          } catch {}
        }
      } catch (err) {
        console.error('Install prompt error:', err);
      }
    } else if (onInstallApp) {
      onInstallApp();
    }
  };

  const userDisplayName = currentUser?.full_name || currentUser?.name || currentUser?.email?.split('@')[0] || 'User';
  const userInitial = userDisplayName.charAt(0).toUpperCase();

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '640px',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'rgba(15, 23, 42, 0.98)',
        padding: '24px',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        border: '1px solid var(--border-glass)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0EA5E9, #6366F1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#F8FAFC' }}>
                {lang === 'id' ? 'Profil & Pengaturan Akun' : 'User Profile & Settings'}
              </h2>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {lang === 'id' ? 'Informasi Akun, Koneksi SMTP, AI, & Kelola Sistem' : 'Account Details, SMTP Credentials, AI & System'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '6px 10px', borderRadius: '10px' }}>
            <X size={16} />
          </button>
        </div>

        {/* SECTION 1: Status Akun & Login/Logout (Account Profile & Auth inside Settings) */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          padding: '16px',
          borderRadius: '14px',
          border: '1px solid var(--border-glass)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {lang === 'id' ? '👤 Informasi Akun Pengguna:' : '👤 User Account Profile:'}
          </div>

          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0EA5E9, #10B981)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: '#fff',
                  boxShadow: '0 0 14px rgba(14, 165, 233, 0.4)'
                }}>
                  {userInitial}
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC' }}>
                    {currentUser.full_name || currentUser.name || 'Pengguna LamarKerja'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                    {currentUser.email}
                  </div>
                  <span className="badge badge-emerald" style={{ fontSize: '0.62rem', marginTop: '3px' }}>
                    {currentUser.role === 'admin' ? 'Administrator' : 'Job Seeker PRO'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#EF4444',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <LogOut size={14} />
                <span>{lang === 'id' ? 'Keluar Akun' : 'Logout'}</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F8FAFC' }}>
                  {lang === 'id' ? 'Status: Belum Masuk Akun' : 'Status: Not Signed In'}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  {lang === 'id' ? 'Masuk untuk sinkronisasi CV, riwayat lamaran & live code' : 'Sign in to sync your CV, application history & code tests'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.82rem', fontWeight: 700 }}
              >
                <LogIn size={14} />
                <span>{lang === 'id' ? 'Masuk / Daftar Akun' : 'Sign In / Register'}</span>
              </button>
            </div>
          )}
        </div>

        {/* SECTION 2: Pengaturan Bahasa (Language Selector) */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          padding: '16px',
          borderRadius: '14px',
          border: '1px solid var(--border-glass)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Languages size={18} color="#38BDF8" />
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F8FAFC' }}>
                {lang === 'id' ? 'Pengaturan Bahasa (Language)' : 'Language Preferences'}
              </span>
            </div>
            <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
              {lang === 'id' ? 'Aktif: Indonesia' : 'Active: English'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setLanguage('id')}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: lang === 'id' ? '2px solid #0EA5E9' : '1px solid var(--border-glass)',
                background: lang === 'id' ? 'rgba(14, 165, 233, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                color: lang === 'id' ? '#38BDF8' : 'var(--text-muted)',
                fontWeight: lang === 'id' ? 700 : 500,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>🇮🇩</span>
              <span>Bahasa Indonesia</span>
              {lang === 'id' && <Check size={14} color="#38BDF8" />}
            </button>

            <button
              type="button"
              onClick={() => setLanguage('en')}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: lang === 'en' ? '2px solid #0EA5E9' : '1px solid var(--border-glass)',
                background: lang === 'en' ? 'rgba(14, 165, 233, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                color: lang === 'en' ? '#38BDF8' : 'var(--text-muted)',
                fontWeight: lang === 'en' ? 700 : 500,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>🇬🇧</span>
              <span>English (US)</span>
              {lang === 'en' && <Check size={14} color="#38BDF8" />}
            </button>
          </div>
        </div>

        {/* SECTION 3: Install Aplikasi di Android / Tablet (ONLY SHOWN ON MOBILE / TABLET) */}
        {isMobileOrTablet && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
            padding: '16px',
            borderRadius: '14px',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={18} color="#34D399" />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#34D399' }}>
                    {lang === 'id' ? '📲 Pasang di Android & Tablet' : '📲 Install on Android & Tablet'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                    {lang === 'id' ? 'Akses cepat dari layar utama HP tanpa membuka browser' : 'Fast homescreen access without typing URL'}
                  </div>
                </div>
              </div>
              <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>PWA Ready</span>
            </div>

            {installedSuccess ? (
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '10px', borderRadius: '8px', color: '#34D399', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={15} /> {lang === 'id' ? 'Aplikasi berhasil dipasang di perangkat Anda!' : 'App installed successfully!'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {deferredPrompt ? (
                  <button
                    type="button"
                    onClick={handleTriggerInstall}
                    className="btn-emerald"
                    style={{ width: '100%', padding: '9px 14px', fontSize: '0.84rem', fontWeight: 700 }}
                  >
                    <Download size={15} />
                    <span>{lang === 'id' ? '⚡ Pasang / Install ke Android Sekarang' : '⚡ Install to Android Now'}</span>
                  </button>
                ) : (
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-glass)',
                    fontSize: '0.76rem',
                    color: '#CBD5E1',
                    lineHeight: '1.4'
                  }}>
                    <strong>{lang === 'id' ? 'Cara Pasang di Chrome Android:' : 'How to Install on Chrome Android:'}</strong>
                    <ol style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
                      <li>{lang === 'id' ? 'Ketuk menu titik tiga (⋮) di pojok kanan atas Chrome.' : 'Tap 3-dots menu (⋮) in Chrome.'}</li>
                      <li>{lang === 'id' ? 'Pilih "Tambahkan ke Layar Utama" / "Install Aplikasi".' : 'Select "Add to Home Screen" / "Install App".'}</li>
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SECTION 4: SMTP Settings Form */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          padding: '16px',
          borderRadius: '14px',
          border: '1px solid var(--border-glass)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={17} color="#38BDF8" />
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F8FAFC' }}>
                {lang === 'id' ? 'Koneksi Gmail SMTP Pribadi' : 'Personal Gmail SMTP Connection'}
              </span>
            </div>
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '0.72rem', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
            >
              <span>{lang === 'id' ? 'App Password (16 Digit)' : 'App Password'}</span>
              <ExternalLink size={11} />
            </a>
          </div>

          <p style={{ fontSize: '0.76rem', color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
            {lang === 'id'
              ? 'Isi Google App Password 16 karakter — jangan password akun Google. Nilai tersimpan di profiles.smtp_pass (teks di PostgreSQL server ini), dipakai hanya untuk smtp.gmail.com, tidak dikirim ke Groq, tidak dibagi ke user lain. Siapa yang akses mesin ini bisa membacanya; jangan bagikan laptop. Menu Keamanan menjelaskan lebih lengkap.'
              : 'Use a 16-character Google App Password — not your Google account password. It is stored in profiles.smtp_pass (plain text in this server’s PostgreSQL), used only for smtp.gmail.com, not sent to Groq, not shared with other users. Anyone with machine access can read it; don’t share the laptop. See Security for the full note.'}
          </p>

          <div>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
              {lang === 'id' ? 'Nama Pengirim di Email:' : 'Sender Display Name:'}
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Contoh: Budi Santoso, S.Kom"
              value={formData.sender_name}
              onChange={(e) => handleChange('sender_name', e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
              {lang === 'id' ? 'Alamat Gmail Pengirim:' : 'Sender Gmail Address:'}
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="contoh: namaanda@gmail.com"
              value={formData.smtp_user}
              onChange={(e) => handleChange('smtp_user', e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
              {lang === 'id' ? 'Google App Password (16 Karakter):' : 'Google App Password (16 Characters):'}
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="abcd efgh ijkl mnop (tanpa spasi)"
              value={formData.smtp_pass}
              onChange={(e) => handleChange('smtp_pass', e.target.value)}
            />
          </div>

          {/* Test SMTP Feedback */}
          {testResult && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '10px',
              background: testResult.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: testResult.success ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              color: testResult.success ? '#34D399' : '#F87171',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {testResult.success ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              <span>{testResult.message || testResult.error}</span>
            </div>
          )}

          {saveSuccess && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34D399',
              fontSize: '0.8rem',
              fontWeight: 600
            }}>
              ✓ {lang === 'id' ? 'Pengaturan berhasil disimpan!' : 'Settings saved successfully!'}
            </div>
          )}

          {errorMessage && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#F87171',
              fontSize: '0.8rem'
            }}>
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
            <button
              type="button"
              onClick={handleTestSmtp}
              disabled={isTestingSmtp || !formData.smtp_user || !formData.smtp_pass}
              className="btn-secondary"
              style={{ flex: 1, padding: '9px', fontSize: '0.82rem' }}
            >
              {isTestingSmtp ? (
                <>
                  <RefreshCw className="animate-spin" size={13} />
                  <span>{lang === 'id' ? 'Menguji...' : 'Testing...'}</span>
                </>
              ) : (
                <>
                  <Key size={13} />
                  <span>{lang === 'id' ? 'Uji Koneksi SMTP' : 'Test SMTP'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSaveSmtp}
              disabled={isSaving}
              className="btn-primary"
              style={{ flex: 1, padding: '9px', fontSize: '0.82rem', fontWeight: 700 }}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="animate-spin" size={13} />
                  <span>{lang === 'id' ? 'Menyimpan...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Save size={13} />
                  <span>{lang === 'id' ? 'Simpan Pengaturan' : 'Save Settings'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* SECTION 5: Groq AI API Key & Model Configuration (For Admin / AI Engine) */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(14, 165, 233, 0.08) 100%)',
          padding: '16px',
          borderRadius: '14px',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={17} color="#818CF8" />
              <div>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F8FAFC' }}>
                  {lang === 'id' ? '🔑 Pengaturan Groq AI API Key & Model' : '🔑 Groq AI API Key & Engine Config'}
                </span>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  {lang === 'id'
                    ? 'Kunci Groq: env GROQ_API_KEY atau settings.groq_api_key (teks di PostgreSQL). Hanya admin. Bukan profil pelamar. Tidak terkait App Password Gmail.'
                    : 'Groq key: GROQ_API_KEY env or settings.groq_api_key (plain text in PostgreSQL). Admin only. Not on applicant profiles. Unrelated to the Gmail App Password.'}
                </div>
              </div>
            </div>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '0.72rem', color: '#818CF8', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 600 }}
            >
              <span>Groq Console</span>
              <ExternalLink size={11} />
            </a>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {lang === 'id' ? 'Groq API Key (Aktif):' : 'Groq API Key (Active):'}
              </label>
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                style={{ background: 'none', border: 'none', color: '#38BDF8', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
              >
                {showApiKey ? (lang === 'id' ? 'Sembunyikan' : 'Hide') : (lang === 'id' ? 'Tampilkan' : 'Show')}
              </button>
            </div>
            <input
              type={showApiKey ? 'text' : 'password'}
              className="input-field"
              placeholder="gsk_..."
              value={formData.groq_api_key}
              onChange={(e) => handleChange('groq_api_key', e.target.value)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                {lang === 'id' ? 'Model AI Utama:' : 'Primary AI Model:'}
              </label>
              <select
                className="input-field"
                value={formData.ai_model}
                onChange={(e) => handleChange('ai_model', e.target.value)}
                style={{ fontSize: '0.82rem' }}
              >
                <option value="openai/gpt-oss-120b">openai/gpt-oss-120b (default Groq)</option>
                <option value="openai/gpt-oss-20b">openai/gpt-oss-20b</option>
                <option value="qwen/qwen3.6-27b">qwen/qwen3.6-27b</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                {lang === 'id' ? 'Batas Harian (Limit):' : 'Daily Limit:'}
              </label>
              <input
                type="number"
                min="1"
                max="200"
                className="input-field"
                value={formData.daily_limit}
                onChange={(e) => handleChange('daily_limit', e.target.value)}
                style={{ fontSize: '0.82rem' }}
              />
            </div>
          </div>

          {adminSaveSuccess && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34D399',
              fontSize: '0.8rem',
              fontWeight: 600
            }}>
              ✓ {lang === 'id' ? 'Groq API Key & Pengaturan AI berhasil disimpan!' : 'Groq API Key & AI Settings updated successfully!'}
            </div>
          )}

          {adminErrorMessage && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#F87171',
              fontSize: '0.8rem'
            }}>
              ⚠️ {adminErrorMessage}
            </div>
          )}

          <button
            type="button"
            onClick={handleSaveAdminSettings}
            disabled={isAdminSaving || !formData.groq_api_key}
            className="btn-primary"
            style={{
              padding: '10px',
              fontSize: '0.84rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #6366F1, #0284C7)'
            }}
          >
            {isAdminSaving ? (
              <>
                <RefreshCw className="animate-spin" size={14} />
                <span>{lang === 'id' ? 'Menyimpan API Key...' : 'Updating API Key...'}</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>{lang === 'id' ? 'Simpan Pengaturan Groq AI' : 'Save Groq AI Config'}</span>
              </>
            )}
          </button>
        </div>

        {/* SECTION 6: User Management & PRO Status Activation (ADMIN ONLY) */}
        {isAdmin && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
            padding: '16px',
            borderRadius: '14px',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crown size={18} color="#FBBF24" />
                <div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F8FAFC' }}>
                    {lang === 'id' ? '👑 Kelola Pengguna & Aktivasi Status PRO (Admin)' : '👑 User Management & PRO Activation (Admin)'}
                  </span>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                    {lang === 'id' ? 'Aktifkan paket PRO 1-klik untuk user yang sudah transfer via WhatsApp' : 'Activate PRO status for users with confirmed payments'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={fetchAdminUsers}
                disabled={isLoadingUsers}
                className="btn-secondary"
                style={{ fontSize: '0.72rem', padding: '4px 8px', gap: '4px' }}
              >
                <RefreshCw size={12} className={isLoadingUsers ? 'animate-spin' : ''} />
                <span>{lang === 'id' ? 'Segarkan' : 'Refresh'}</span>
              </button>
            </div>

            {/* Search Input for Admin */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-field"
                placeholder={lang === 'id' ? '🔍 Cari nama atau email pengguna...' : '🔍 Search user by name or email...'}
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                style={{ fontSize: '0.82rem', padding: '8px 12px' }}
              />
            </div>

            {/* Users List */}
            {isLoadingUsers ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Memuat daftar pengguna...
              </div>
            ) : adminUsers.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Belum ada pengguna terdaftar lain.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                {adminUsers
                  .filter(u => 
                    !userSearchQuery || 
                    u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                    u.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
                  )
                  .map((u) => {
                    const isPro = u.plan === 'pro';
                    const isVip = u.plan === 'vip';
                    const isUpgrading = upgradingUserId === u.id;
                    const isSelf = u.id === currentUser?.id;

                    return (
                      <div 
                        key={u.id}
                        style={{
                          background: 'rgba(15, 23, 42, 0.7)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.84rem', color: '#F8FAFC' }}>
                              {u.name}
                            </span>
                            <span className={`badge ${isVip ? 'badge-amber' : isPro ? 'badge-emerald' : 'badge-cyan'}`} style={{ fontSize: '0.62rem', fontWeight: 800 }}>
                              {u.plan?.toUpperCase()}
                            </span>
                            {u.role === 'admin' ? (
                              <span className="badge badge-rose" style={{ fontSize: '0.6rem' }}>ADMIN</span>
                            ) : (
                              <span className="badge" style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.1)', color: '#94A3B8' }}>USER</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            {u.email} {u.referral_code ? `• Ref: ${u.referral_code}` : ''}
                            {u.plan_expires_at && (
                              <span style={{ color: '#38BDF8', marginLeft: '6px' }}>
                                (Exp: {new Date(u.plan_expires_at).toLocaleDateString('id-ID')})
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                          {/* Upgrade to PRO */}
                          {!isPro && (
                            <button
                              type="button"
                              onClick={() => handleAdminUpgradeUser(u.id, 'pro', 30)}
                              disabled={isUpgrading}
                              className="btn-primary"
                              style={{ fontSize: '0.68rem', padding: '4px 7px', background: 'linear-gradient(135deg, #0EA5E9, #6366F1)' }}
                              title="Aktifkan status PRO (30 Hari)"
                            >
                              PRO (30H)
                            </button>
                          )}

                          {/* Upgrade to VIP */}
                          {!isVip && (
                            <button
                              type="button"
                              onClick={() => handleAdminUpgradeUser(u.id, 'vip', 90)}
                              disabled={isUpgrading}
                              className="btn-primary"
                              style={{ fontSize: '0.68rem', padding: '4px 7px', background: 'linear-gradient(135deg, #F59E0B, #EA580C)' }}
                              title="Aktifkan status VIP (90 Hari)"
                            >
                              VIP (90H)
                            </button>
                          )}

                          {/* Reset to Free */}
                          {(isPro || isVip) && (
                            <button
                              type="button"
                              onClick={() => handleAdminUpgradeUser(u.id, 'free', 0)}
                              disabled={isUpgrading}
                              className="btn-secondary"
                              style={{ fontSize: '0.68rem', padding: '4px 7px', color: '#F87171' }}
                            >
                              Free
                            </button>
                          )}

                          {/* Role Toggle (Admin/User) */}
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => handleAdminUpgradeUser(u.id, undefined, undefined, u.role === 'admin' ? 'user' : 'admin')}
                              disabled={isUpgrading}
                              className="btn-secondary"
                              style={{ fontSize: '0.68rem', padding: '4px 7px', color: u.role === 'admin' ? '#FBBF24' : '#38BDF8' }}
                              title={u.role === 'admin' ? 'Ubah menjadi Akun User Biasa' : 'Jadikan Akun Admin'}
                            >
                              {u.role === 'admin' ? 'Jadikan User' : 'Jadikan Admin'}
                            </button>
                          )}

                          {/* Delete User */}
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => handleAdminDeleteUser(u.id, u.name)}
                              disabled={isUpgrading}
                              className="btn-secondary"
                              style={{ fontSize: '0.68rem', padding: '4px 7px', color: '#EF4444' }}
                              title="Hapus akun pengguna"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Footer & Close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            LamarKerja AI v2.4
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '7px 16px', fontSize: '0.82rem' }}>
            {lang === 'id' ? 'Tutup' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
