import React from 'react';
import { 
  Phone, Mail, MapPin, MessageCircle, Clock, 
  ExternalLink, Copy, Check, X, Building2, ShieldCheck, Heart
} from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function ContactModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const { lang } = useLanguage();
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const phone = '085157715522';
  const phoneFormatted = '+62 851-5771-5522';
  const email = 'malthafkiram@gmail.com';
  const officeAddress = 'Jl. Dwijaya 4 No. 13, Kebayoran Lama, Jakarta Selatan, DKI Jakarta 12240';

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2500);
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2500);
    }
  };

  const handleOpenWA = () => {
    const text = encodeURIComponent('Halo Tim LamarKerja AI! Saya butuh bantuan / informasi terkait aplikasi.');
    window.open(`https://wa.me/6285157715522?text=${text}`, '_blank');
  };

  const handleOpenMaps = () => {
    const query = encodeURIComponent('Jl. Dwijaya 4 No. 13, Kebayoran Lama, Jakarta Selatan');
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      zIndex: 1050,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '560px',
        background: '#07090E',
        border: '1px solid rgba(14, 165, 233, 0.35)',
        borderRadius: '24px',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0EA5E9, #6366F1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(14, 165, 233, 0.35)'
            }}>
              <Phone size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                {lang === 'id' ? 'Hubungi Kami (Contact Us)' : 'Contact Us'}
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {lang === 'id' ? 'Layanan Bantuan & Customer Support LamarKerja AI' : 'Official Support & Office Location'}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-secondary" style={{ padding: '8px', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* Contact Cards Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* WhatsApp / Phone */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid var(--border-glass)',
            borderRadius: '16px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageCircle size={20} color="#34D399" />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  WhatsApp & Telepon
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC', fontFamily: 'var(--font-mono)' }}>
                  {phoneFormatted}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => handleCopy(phone, 'phone')}
                className="btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                title="Salin Nomor"
              >
                {copiedPhone ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
              </button>
              <button
                onClick={handleOpenWA}
                className="btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#10B981', gap: '4px' }}
              >
                <span>Chat WA</span>
                <ExternalLink size={12} />
              </button>
            </div>
          </div>

          {/* Email */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid var(--border-glass)',
            borderRadius: '16px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.15)', border: '1px solid rgba(14, 165, 233, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={20} color="#38BDF8" />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Email Resmi
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC' }}>
                  {email}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => handleCopy(email, 'email')}
                className="btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                title="Salin Email"
              >
                {copiedEmail ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
              </button>
              <a
                href={`mailto:${email}`}
                className="btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.75rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <span>Kirim Email</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Office Address */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid var(--border-glass)',
            borderRadius: '16px',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin size={20} color="#FBBF24" />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Alamat Kantor (Office)
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', lineHeight: '1.4', marginTop: '2px' }}>
                    {officeAddress}
                  </div>
                </div>
              </div>

              <button
                onClick={handleOpenMaps}
                className="btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px', flexShrink: 0 }}
              >
                <span>Google Maps</span>
                <ExternalLink size={12} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-dim)', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <Clock size={13} color="#94A3B8" />
              <span>Jam Operasional: Senin - Minggu (08.00 - 22.00 WIB)</span>
            </div>
          </div>

        </div>

        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.28)',
          borderRadius: '14px',
          padding: '12px 16px',
          fontSize: '0.78rem',
          color: '#FDE68A',
          lineHeight: 1.55
        }}>
          {lang === 'id'
            ? 'Kirim lamaran memakai Gmail SMTP Anda (Google App Password di profil). Sandi tersimpan di PostgreSQL server ini, tidak dikirim ke Groq. Penjelasan jujur: menu Keamanan di Bantuan & Info.'
            : 'Applications send through your Gmail SMTP (Google App Password on your profile). It is stored in this server’s PostgreSQL and is not sent to Groq. Honest detail: Security under Help & Info.'}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="btn-secondary"
          style={{ width: '100%', padding: '10px', fontSize: '0.82rem', fontWeight: 600, justifyContent: 'center' }}
        >
          {lang === 'id' ? 'Tutup' : 'Close'}
        </button>
      </div>
    </div>
  );
}
