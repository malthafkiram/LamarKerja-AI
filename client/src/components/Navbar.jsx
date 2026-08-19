import React, { useState } from 'react';
import { 
  Sparkles, Bot, FileText, Send, Settings, CheckCircle2, 
  AlertTriangle, ShieldCheck, BookOpen, Globe, LogIn, LogOut, 
  User, Shield, Bell, Code2, Info, Menu, X, FileCheck, Crown,
  HelpCircle, Phone, ChevronDown, FilePlus
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import BrandLogo from './BrandLogo';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  settings, 
  stats, 
  currentUser, 
  onOpenSettings, 
  onOpenAuth, 
  onLogout,
  onOpenInbox,
  onOpenAbout,
  onOpenSecurity,
  onOpenContact,
  onOpenUpgradePro,
  unreadInboxCount = 0
}) {
  const { lang, t } = useLanguage();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [infoDropdownOpen, setInfoDropdownOpen] = useState(false);

  const navItems = [
    { id: 'jobs', label: t('nav_directory', 'Jelajah Loker'), icon: Globe },
    { id: 'cv-builder', label: t('nav_cv_builder', 'Buat CV AI'), icon: FilePlus },
    { id: 'ats', label: t('nav_ats', 'Audit CV ATS'), icon: FileCheck },
    { id: 'livecode', label: t('nav_livecode', 'Live Code'), icon: Code2 },
    { id: 'scanner', label: t('nav_dropsend', 'Drop & Send'), icon: Send },
    { id: 'tracker', label: t('nav_history', 'Riwayat'), icon: FileText, count: stats?.total_sent || 0 },
    { id: 'profile', label: t('nav_profile', 'Profil & CV'), icon: User },
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setMobileDrawerOpen(false);
  };

  return (
    <>
      {/* Main Top Header Bar */}
      <header style={{
        borderBottom: '1px solid var(--border-glass)',
        background: 'rgba(7, 9, 14, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '0 20px'
      }}>
        <div style={{
          maxWidth: '1440px',
          margin: '0 auto',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          {/* Left: Brand Logo & Title */}
          <div 
            onClick={() => handleTabClick('jobs')} 
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 }}
          >
            <BrandLogo size={38} />
          </div>

          {/* Center: Desktop Navigation Tabs (Hidden on Mobile/Tablet via CSS) */}
          <nav className="desktop-nav" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(15, 23, 42, 0.65)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid var(--border-glass)'
          }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    background: isActive ? 'linear-gradient(135deg, #0284C7, #4F46E5)' : 'transparent',
                    boxShadow: isActive ? '0 4px 12px rgba(2, 132, 199, 0.35)' : 'none',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span style={{
                      background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                      padding: '1px 6px',
                      borderRadius: '999px',
                      fontSize: '0.68rem',
                      fontWeight: 700
                    }}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Actions (Notifikasi, Tentang, Panduan, Pengaturan) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            
            {/* HR Inbox Bell Notification Button (Always Visible) */}
            <button
              onClick={onOpenInbox}
              className="btn-secondary"
              style={{
                padding: '7px 10px',
                borderRadius: '10px',
                borderColor: unreadInboxCount > 0 ? 'rgba(239, 68, 68, 0.5)' : 'var(--border-glass)',
                background: unreadInboxCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                color: unreadInboxCount > 0 ? '#F87171' : '#CBD5E1',
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={lang === 'id' ? 'Kotak Masuk & Notifikasi HRD' : 'HR Inbox & Notifications'}
            >
              <Bell size={16} color={unreadInboxCount > 0 ? '#EF4444' : '#94A3B8'} />
              {unreadInboxCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#EF4444',
                  color: '#fff',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)'
                }}>
                  {unreadInboxCount}
                </span>
              )}
            </button>

            {/* Desktop Only: Bantuan & Informasi Sub-Menu Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setInfoDropdownOpen(!infoDropdownOpen)}
                className="btn-secondary nav-about-btn"
                style={{ padding: '7px 12px', borderRadius: '10px', fontSize: '0.82rem', color: 'var(--text-muted)', gap: '6px' }}
                title={lang === 'id' ? 'Bantuan & Informasi' : 'Help & Information'}
              >
                <HelpCircle size={15} color="#38BDF8" />
                <span>{lang === 'id' ? 'Bantuan & Info' : 'Help & Info'}</span>
                <ChevronDown size={13} style={{ transform: infoDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {infoDropdownOpen && (
                <div 
                  className="glass-panel"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '220px',
                    background: '#0B0F19',
                    border: '1px solid rgba(14, 165, 233, 0.3)',
                    borderRadius: '14px',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.85)',
                    zIndex: 100
                  }}
                >
                  <button
                    onClick={() => { handleTabClick('tutorial'); setInfoDropdownOpen(false); }}
                    className="btn-secondary"
                    style={{ width: '100%', justifyContent: 'flex-start', border: 'none', background: 'transparent', padding: '8px 10px', fontSize: '0.8rem', gap: '8px' }}
                  >
                    <BookOpen size={14} color="#34D399" />
                    <span>{lang === 'id' ? 'Panduan Lengkap' : 'Guide & FAQ'}</span>
                  </button>

                  <button
                    onClick={() => { onOpenAbout(); setInfoDropdownOpen(false); }}
                    className="btn-secondary"
                    style={{ width: '100%', justifyContent: 'flex-start', border: 'none', background: 'transparent', padding: '8px 10px', fontSize: '0.8rem', gap: '8px' }}
                  >
                    <Info size={14} color="#38BDF8" />
                    <span>{lang === 'id' ? 'Tentang Aplikasi' : 'About Platform'}</span>
                  </button>

                  <button
                    onClick={() => { onOpenSecurity(); setInfoDropdownOpen(false); }}
                    className="btn-secondary"
                    style={{ width: '100%', justifyContent: 'flex-start', border: 'none', background: 'transparent', padding: '8px 10px', fontSize: '0.8rem', gap: '8px' }}
                  >
                    <ShieldCheck size={14} color="#FBBF24" />
                    <span>{t('nav_security', lang === 'id' ? 'Keamanan' : 'Security')}</span>
                  </button>

                  <button
                    onClick={() => { onOpenContact(); setInfoDropdownOpen(false); }}
                    className="btn-secondary"
                    style={{ width: '100%', justifyContent: 'flex-start', border: 'none', background: 'transparent', padding: '8px 10px', fontSize: '0.8rem', gap: '8px' }}
                  >
                    <Phone size={14} color="#F59E0B" />
                    <span>{lang === 'id' ? 'Hubungi Kami (Contact)' : 'Contact Us'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Upgrade PRO Button (No Star Icon) */}
            <button
              onClick={onOpenUpgradePro}
              className="btn-primary"
              style={{
                padding: '6px 12px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 800,
                background: currentUser?.plan === 'pro' || currentUser?.plan === 'vip' 
                  ? 'linear-gradient(135deg, #F59E0B, #EA580C)' 
                  : 'linear-gradient(135deg, #0EA5E9, #6366F1)',
                boxShadow: currentUser?.plan === 'pro' || currentUser?.plan === 'vip'
                  ? '0 0 14px rgba(245, 158, 11, 0.45)'
                  : '0 0 14px rgba(14, 165, 233, 0.4)',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title={lang === 'id' ? 'Upgrade ke PRO Unlimited' : 'Upgrade to PRO Unlimited'}
            >
              <Crown size={14} color="#fff" />
              <span>{currentUser?.plan === 'pro' || currentUser?.plan === 'vip' ? 'PRO' : (lang === 'id' ? 'Upgrade PRO' : 'Get PRO')}</span>
            </button>

            {/* User Account / Login Button */}
            {currentUser ? (
              <button
                onClick={onOpenSettings}
                className="btn-secondary"
                style={{
                  padding: '5px 10px',
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: 'rgba(56, 189, 248, 0.4)',
                  background: 'rgba(14, 165, 233, 0.08)'
                }}
                title={`Akun: ${currentUser.name} (${currentUser.role})`}
              >
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0EA5E9, #6366F1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: '#fff'
                }}>
                  {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="settings-text-desktop" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F8FAFC', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.name?.split(' ')[0]}
                </span>
                <span className={`badge ${currentUser.plan === 'vip' ? 'badge-amber' : currentUser.plan === 'pro' ? 'badge-emerald' : 'badge-cyan'}`} style={{ fontSize: '0.58rem', fontWeight: 800, padding: '1px 5px' }}>
                  {currentUser.plan?.toUpperCase()}
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="btn-secondary"
                style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#38BDF8',
                  borderColor: 'rgba(56, 189, 248, 0.4)'
                }}
              >
                <LogIn size={14} color="#38BDF8" />
                <span className="settings-text-desktop">Masuk</span>
              </button>
            )}

            {/* Mobile Hamburger Button (Strictly HIDDEN on desktop, ONLY rendered on mobile <= 900px) */}
            <button
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="btn-secondary mobile-only-hamburger"
              style={{
                display: 'none',
                padding: '7px 10px',
                borderRadius: '10px'
              }}
              title="Menu Navigasi Mobile"
            >
              {mobileDrawerOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Slide-Down Mobile Drawer Menu (ONLY for Android / Mobile screens) */}
      {mobileDrawerOpen && (
        <div className="mobile-drawer-overlay" style={{
          position: 'fixed',
          top: '64px',
          left: 0,
          right: 0,
          background: 'rgba(7, 9, 14, 0.98)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--border-glass)',
          padding: '16px',
          zIndex: 99,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.85)',
          maxHeight: 'calc(100vh - 130px)',
          overflowY: 'auto'
        }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {lang === 'id' ? 'Menu Navigasi:' : 'Navigation Menu:'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: isActive ? '1px solid #0EA5E9' : '1px solid var(--border-glass)',
                    background: isActive ? 'rgba(14, 165, 233, 0.2)' : 'rgba(15, 23, 42, 0.8)',
                    color: isActive ? '#38BDF8' : '#E2E8F0',
                    fontSize: '0.82rem',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <Icon size={16} color={isActive ? '#38BDF8' : '#94A3B8'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div style={{ height: '1px', background: 'var(--border-glass)', margin: '2px 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button
              onClick={() => { handleTabClick('tutorial'); }}
              className="btn-secondary"
              style={{ padding: '8px 6px', justifyContent: 'center', fontSize: '0.76rem', gap: '4px' }}
            >
              <BookOpen size={14} color="#34D399" />
              <span>{t('nav_guide', 'Panduan')}</span>
            </button>

            <button
              onClick={() => { onOpenAbout(); setMobileDrawerOpen(false); }}
              className="btn-secondary"
              style={{ padding: '8px 6px', justifyContent: 'center', fontSize: '0.76rem', gap: '4px' }}
            >
              <Info size={14} color="#38BDF8" />
              <span>{t('nav_about', 'Tentang')}</span>
            </button>

            <button
              onClick={() => { onOpenSecurity(); setMobileDrawerOpen(false); }}
              className="btn-secondary"
              style={{ padding: '8px 6px', justifyContent: 'center', fontSize: '0.76rem', gap: '4px' }}
            >
              <ShieldCheck size={14} color="#FBBF24" />
              <span>{t('nav_security', 'Keamanan')}</span>
            </button>

            <button
              onClick={() => { onOpenContact(); setMobileDrawerOpen(false); }}
              className="btn-secondary"
              style={{ padding: '8px 6px', justifyContent: 'center', fontSize: '0.76rem', gap: '4px' }}
            >
              <Phone size={14} color="#F59E0B" />
              <span>Kontak</span>
            </button>
          </div>

          <div>
            <button
              onClick={() => { onOpenUpgradePro(); setMobileDrawerOpen(false); }}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '10px',
                justifyContent: 'center',
                fontSize: '0.84rem',
                gap: '8px',
                background: currentUser?.plan === 'pro' || currentUser?.plan === 'vip' 
                  ? 'linear-gradient(135deg, #F59E0B, #EA580C)' 
                  : 'linear-gradient(135deg, #0EA5E9, #6366F1)'
              }}
            >
              <Crown size={15} />
              <span>{currentUser?.plan === 'pro' || currentUser?.plan === 'vip' ? '👑 Status PRO Aktif' : '👑 Upgrade LamarKerja PRO'}</span>
            </button>
          </div>

          {!currentUser ? (
            <button
              onClick={() => { onOpenAuth(); setMobileDrawerOpen(false); }}
              className="btn-primary"
              style={{
                padding: '12px',
                justifyContent: 'center',
                fontSize: '0.86rem',
                gap: '8px',
                background: 'linear-gradient(135deg, #0284C7, #4F46E5)'
              }}
            >
              <LogIn size={16} />
              <span>Masuk atau Daftar Akun Gratis</span>
            </button>
          ) : (
            <div 
              onClick={() => { onOpenSettings(); setMobileDrawerOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(15, 23, 42, 0.85)',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                cursor: 'pointer'
              }}
              title="Klik untuk membuka Profil & Pengaturan Akun"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0EA5E9, #6366F1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#fff'
                }}>
                  {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#F8FAFC' }}>
                    {currentUser.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#38BDF8' }}>
                    {currentUser.email} • Kelola Profil &gt;
                  </div>
                </div>
              </div>
              <span className={`badge ${currentUser.plan === 'vip' ? 'badge-amber' : currentUser.plan === 'pro' ? 'badge-emerald' : 'badge-cyan'}`} style={{ fontSize: '0.62rem', fontWeight: 800 }}>
                {currentUser.plan?.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Sticky Mobile Bottom Navigation Bar (Android / Mobile Ergonomics) */}
      <nav className="mobile-bottom-nav" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '62px',
        background: 'rgba(7, 9, 14, 0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-glass)',
        zIndex: 9999,
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 4px',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.6)'
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              style={{
                flex: 1,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                background: 'transparent',
                border: 'none',
                color: isActive ? '#38BDF8' : '#64748B',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <div style={{
                position: 'relative',
                padding: '4px 10px',
                borderRadius: '12px',
                background: isActive ? 'rgba(14, 165, 233, 0.18)' : 'transparent',
                transition: 'all 0.2s ease'
              }}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                {item.count !== undefined && item.count > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    background: '#0EA5E9',
                    color: '#fff',
                    fontSize: '0.58rem',
                    fontWeight: 800,
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {item.count}
                  </span>
                )}
              </div>
              <span style={{
                fontSize: '0.64rem',
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '-0.01em',
                lineHeight: 1
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
