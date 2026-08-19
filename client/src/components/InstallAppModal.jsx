import React, { useState, useEffect } from 'react';
import { 
  X, Smartphone, Download, CheckCircle2, Sparkles, HelpCircle, 
  ArrowRight, ShieldCheck, Share2, MoreVertical, PlusSquare
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function InstallAppModal({ isOpen, onClose, deferredPrompt, onInstalled }) {
  const { t, lang } = useLanguage();
  const [installStatus, setInstallStatus] = useState('idle'); // 'idle', 'installing', 'success', 'manual'
  const [deviceType, setDeviceType] = useState('android');

  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
      setDeviceType('ios');
    } else {
      setDeviceType('android');
    }
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      setInstallStatus('installing');
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setInstallStatus('success');
          if (onInstalled) onInstalled();
        } else {
          setInstallStatus('manual');
        }
      } catch (err) {
        console.error('Install prompt error:', err);
        setInstallStatus('manual');
      }
    } else {
      setInstallStatus('manual');
    }
  };

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
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(14, 165, 233, 0.4)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 30px rgba(14, 165, 233, 0.25)',
          borderRadius: '24px',
          padding: '28px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #10B981, #0EA5E9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
            }}>
              <Smartphone size={26} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                {lang === 'id' ? 'Pasang di HP / Android' : 'Install on Mobile & Tablet'}
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#38BDF8', margin: '2px 0 0 0', fontWeight: 600 }}>
                Progressive Web App (PWA) • Cepat & Ringan
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

        {/* Benefits Box */}
        <div style={{
          background: 'rgba(14, 165, 233, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '16px',
          padding: '16px 18px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#38BDF8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} />
            <span>{lang === 'id' ? 'Keunggulan Aplikasi Terpasang:' : 'PWA App Benefits:'}</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.84rem', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>{lang === 'id' ? 'Akses instan dari homescreen HP tanpa buka browser berkali-kali' : 'One-tap homescreen launch without opening browser'}</li>
            <li>{lang === 'id' ? 'Tampilan layar penuh (full screen) seperti aplikasi bawaan Android' : 'Full-screen app experience matching native Android/iOS apps'}</li>
            <li>{lang === 'id' ? 'Lebih hemat kuota, super cepat, dan ukuran file kurang dari 2MB' : 'Ultra-lightweight (<2MB) and zero bloatware'}</li>
          </ul>
        </div>

        {/* Native 1-Click Install Button if supported */}
        {deferredPrompt ? (
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <button
              onClick={handleNativeInstall}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: '1.02rem',
                fontWeight: 700,
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #10B981, #0EA5E9)',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <Download size={20} />
              <span>{lang === 'id' ? '📲 Klik Pasang Sekarang (1-Click Install)' : '📲 Install App Now (1-Click)'}</span>
            </button>
          </div>
        ) : null}

        {/* Step by Step Manual Guide */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid var(--border-glass)',
          borderRadius: '16px',
          padding: '18px',
          marginBottom: '20px'
        }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HelpCircle size={16} color="#FBBF24" />
            <span>
              {deviceType === 'ios' 
                ? (lang === 'id' ? 'Panduan Pasang di iPhone / iPad (Safari):' : 'Install Guide for iPhone / iPad (Safari):')
                : (lang === 'id' ? 'Panduan Pasang di Android (Google Chrome):' : 'Install Guide for Android (Google Chrome):')}
            </span>
          </h4>

          {deviceType === 'ios' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem', color: '#94A3B8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>1</div>
                <div>Buka web ini di browser <strong>Safari</strong> pada iPhone Anda.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>2</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Klik tombol <strong>Bagikan (Share)</strong></span>
                  <Share2 size={16} color="#38BDF8" />
                  <span>di bilah bawah.</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>3</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Pilih opsi <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong></span>
                  <PlusSquare size={16} color="#10B981" />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem', color: '#94A3B8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>1</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Klik tombol <strong>Titik Tiga (Menu)</strong></span>
                  <MoreVertical size={16} color="#38BDF8" />
                  <span>di sudut kanan atas browser Chrome.</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>2</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Pilih menu <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Install Aplikasi"</strong></span>
                  <Download size={16} color="#10B981" />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>3</div>
                <div>Klik <strong>"Install"</strong> dan ikon LamarKerja AI akan muncul langsung di menu HP Anda!</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onClose}
            className="btn-primary"
            style={{ padding: '10px 24px', borderRadius: '12px', fontSize: '0.9rem' }}
          >
            {t('btn_close', 'Tutup')}
          </button>
        </div>
      </div>
    </div>
  );
}
