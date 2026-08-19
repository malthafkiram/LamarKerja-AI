import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import BrandLogo from './BrandLogo';

export default function LoadingOverlay({ 
  message, 
  submessage, 
  fullScreen = true, 
  compact = false 
}) {
  const { lang, t } = useLanguage();

  const defaultMsg = message || (lang === 'id' ? 'Memuat LamarKerja AI...' : 'Loading LamarKerja AI...');
  const defaultSub = submessage || (lang === 'id' ? 'Menghubungkan ke PostgreSQL & Groq AI...' : 'Connecting to PostgreSQL & Groq AI...');

  if (compact) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '24px',
        color: '#38BDF8'
      }}>
        <div className="modern-spinner-ring" style={{ width: '28px', height: '28px' }} />
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
          {defaultMsg}
        </span>
      </div>
    );
  }

  const content = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '40px 32px',
      maxWidth: '460px',
      width: '90%',
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(56, 189, 248, 0.25)',
      borderRadius: '24px',
      boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px -10px rgba(56, 189, 248, 0.2)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Ambient background glow */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        width: '180px',
        height: '180px',
        background: 'radial-gradient(circle, rgba(14, 165, 233, 0.35) 0%, rgba(99, 102, 241, 0) 70%)',
        filter: 'blur(30px)',
        pointerEvents: 'none'
      }} />

      {/* Animated Multi-Ring Glowing Orb */}
      <div style={{ position: 'relative', width: '90px', height: '90px', marginBottom: '24px' }}>
        {/* Outer rotating gradient ring */}
        <div className="loader-outer-orbit" />
        
        {/* Middle reverse rotating ring */}
        <div className="loader-inner-orbit" />

        {/* Center brand mark */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'corePulse 2s ease-in-out infinite'
        }}>
          <BrandLogo size={52} showWordmark={false} />
        </div>
      </div>

      {/* Main Title / Message */}
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: 800,
        marginBottom: '8px',
        letterSpacing: '-0.01em',
        background: 'linear-gradient(135deg, #F8FAFC 0%, #BAE6FD 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        {defaultMsg}
      </h3>

      {/* Subtitle / Tip */}
      <p style={{
        fontSize: '0.84rem',
        color: '#94A3B8',
        lineHeight: '1.5',
        marginBottom: '20px'
      }}>
        {defaultSub}
      </p>

      {/* Animated Shimmer Progress Bar */}
      <div style={{
        width: '100%',
        maxWidth: '280px',
        height: '5px',
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '999px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div className="shimmer-progress-fill" />
      </div>

      {/* Live Status Indicator */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        marginTop: '16px',
        fontSize: '0.75rem',
        color: '#38BDF8',
        fontWeight: 600
      }}>
        <span style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: '#38BDF8',
          boxShadow: '0 0 8px #38BDF8',
          animation: 'dotPulse 1.2s infinite'
        }} />
        {lang === 'id' ? 'Sistem Otomatisasi AI Aktif' : 'AI Automation Active'}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        background: 'rgba(7, 9, 14, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {content}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 16px'
    }}>
      {content}
    </div>
  );
}
