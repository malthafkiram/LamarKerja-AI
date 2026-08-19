import React, { useState } from 'react';
import { 
  Crown, Sparkles, Check, Copy, Zap, ShieldCheck, 
  ExternalLink, ArrowRight, MessageCircle, X, Gift, Users, CreditCard, QrCode
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLanguage } from '../context/LanguageContext';

export default function UpgradeProModal({ isOpen, onClose, currentUser }) {
  if (!isOpen) return null;

  const { lang, t } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState('pro'); // 'topup', 'pro', 'vip'
  const [paymentMethodTab, setPaymentMethodTab] = useState('qris'); // 'qris' | 'manual'
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const ewalletNumber = '085157715522';
  const ewalletFormatted = '0851-5771-5522';
  const ownerName = 'LamarKerja Ai';

  const userEmail = currentUser?.email || 'user@gmail.com';
  const userName = currentUser?.name || 'User';
  const refCode = currentUser?.referral_code || 'PROMO2026';
  const currentPlan = currentUser?.plan || 'free';

  const plans = [
    {
      id: 'topup',
      name: lang === 'id' ? 'Top-Up Kuota' : 'Quota Top-Up',
      price: 'Rp 9.000',
      period: lang === 'id' ? 'Sekali Bayar' : 'One-Time',
      badge: lang === 'id' ? 'Ekonomis' : 'Budget',
      badgeColor: '#64748B',
      features: [
        lang === 'id' ? '20 Kuota Kirim Lamaran AI' : '20 AI Applications Quota',
        lang === 'id' ? '2x Buat CV AI & Export PDF' : '2x AI CV Generator & PDF',
        lang === 'id' ? '2x Audit CV ATS Mendalam' : '2x Deep ATS CV Audits',
        lang === 'id' ? 'Kuota aktif selamanya (no expiry)' : 'Quota never expires'
      ]
    },
    {
      id: 'pro',
      name: lang === 'id' ? 'PRO Hunter' : 'PRO Hunter',
      price: 'Rp 29.000',
      period: lang === 'id' ? 'per 1 Bulan' : 'per Month',
      badge: lang === 'id' ? 'PALING LARIS' : 'BEST VALUE',
      badgeColor: '#0EA5E9',
      isPopular: true,
      features: [
        lang === 'id' ? '🚀 UNLIMITED Buat CV AI & Export PDF (ATS/Media)' : '🚀 UNLIMITED AI CV Generator & ATS PDF Export',
        lang === 'id' ? '🚀 UNLIMITED Drop & Send (Scan & Kirim)' : '🚀 UNLIMITED Drop & Send Applications',
        lang === 'id' ? '🚀 UNLIMITED Audit CV ATS & STAR Rewriter' : '🚀 UNLIMITED ATS Scanner & STAR Rewrites',
        lang === 'id' ? '🚀 UNLIMITED AI Live Code Arena & Rapor' : '🚀 UNLIMITED Live Code Challenges & Grading',
        lang === 'id' ? '✨ AI Auto Follow-Up Generator (H+5)' : '✨ AI Follow-Up Generator (>5 Days)',
        lang === 'id' ? '👑 Badge PRO Emas di Akun' : '👑 Gold PRO Badge'
      ]
    },
    {
      id: 'vip',
      name: lang === 'id' ? 'VIP Karir' : 'VIP Career',
      price: 'Rp 69.000',
      period: lang === 'id' ? 'per 3 Bulan' : 'per 3 Months',
      badge: lang === 'id' ? '👑 HEMAT 30%' : '👑 SAVE 30%',
      badgeColor: '#F59E0B',
      features: [
        lang === 'id' ? '🚀 Semua Fitur PRO Selama 90 Hari Penuh' : '🚀 Full PRO Access for 90 Days',
        lang === 'id' ? '🚀 UNLIMITED Buat CV AI, Audit ATS & Live Code' : '🚀 UNLIMITED AI CV Builder, ATS & Live Code',
        lang === 'id' ? '🎯 Akses Prioritas Fitur AI Terbaru' : '🎯 Priority Access to New AI Features',
        lang === 'id' ? '💼 Konsultasi Format CV via WhatsApp' : '💼 CV Consultation via WhatsApp Support',
        lang === 'id' ? '⚡ Jalur Server Cepat Tanpa Antrean' : '⚡ Dedicated Fast Server Processing'
      ]
    }
  ];

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(ewalletNumber);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2500);
  };

  const handleCopyRef = () => {
    const url = `${window.location.origin}?ref=${refCode}`;
    navigator.clipboard.writeText(url);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const getActivePlanDetails = () => {
    return plans.find(p => p.id === selectedPlan) || plans[1];
  };

  const handleWhatsAppConfirmation = () => {
    const selected = getActivePlanDetails();
    const message = encodeURIComponent(
      `Halo Admin LamarKerja AI! 🚀\n\nSaya ingin konfirmasi pembayaran untuk aktivasi akun:\n• Nama: ${userName}\n• Email Akun: ${userEmail}\n• Paket: ${selected.name} (${selected.price} / ${selected.period})\n• Metode: DANA / E-Wallet (0851-5771-5522)\n\nBerikut bukti transfer / struk pembayaran saya terlampir di bawah:`
    );
    window.open(`https://wa.me/6285157715522?text=${message}`, '_blank');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 7, 18, 0.88)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      zIndex: 1050,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '880px',
        maxHeight: '92vh',
        overflowY: 'auto',
        background: '#07090E',
        border: '1px solid rgba(14, 165, 233, 0.35)',
        borderRadius: '24px',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9)'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #F59E0B, #EA580C)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)'
            }}>
              <Crown size={26} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                  {lang === 'id' ? 'Upgrade LamarKerja AI ' : 'Upgrade LamarKerja AI '}<span className="gradient-text">PRO</span>
                </h2>
                {currentPlan !== 'free' && (
                  <span className="badge badge-emerald" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                    👑 {currentPlan.toUpperCase()} AKTIF
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {lang === 'id' 
                  ? 'Buka akses tanpa batas untuk melamar kerja lebih cepat dan dapatkan panggilan interview dalam hitungan hari.'
                  : 'Unlock unlimited job applications, deep ATS audits, and live coding interview practice.'}
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

        {/* Pricing Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {plans.map((p) => {
            const isSelected = selectedPlan === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                style={{
                  background: isSelected 
                    ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(99, 102, 241, 0.2))'
                    : 'rgba(15, 23, 42, 0.65)',
                  border: isSelected 
                    ? '2px solid #0EA5E9' 
                    : '1px solid var(--border-glass)',
                  borderRadius: '18px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 8px 25px rgba(14, 165, 233, 0.25)' : 'none'
                }}
              >
                {p.badge && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '16px',
                    background: p.badgeColor,
                    color: '#fff',
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                  }}>
                    {p.badge}
                  </div>
                )}

                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 6px 0' }}>
                    {p.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '1.55rem', fontWeight: 800, color: isSelected ? '#38BDF8' : '#F8FAFC' }}>
                      {p.price}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      / {p.period}
                    </span>
                  </div>
                </div>

                <div style={{ height: '1px', background: 'var(--border-glass)' }} />

                <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', flex: 1 }}>
                  {p.features.map((feat, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: '1.4' }}>
                      <Check size={14} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={isSelected ? 'btn-primary' : 'btn-secondary'}
                  style={{ width: '100%', padding: '8px', fontSize: '0.82rem', fontWeight: 700, justifyContent: 'center' }}
                >
                  {isSelected ? (lang === 'id' ? '✓ Paket Dipilih' : '✓ Selected') : (lang === 'id' ? 'Pilih Paket' : 'Choose Plan')}
                </button>
              </div>
            );
          })}
        </div>

        {/* Payment Methods & Instructions Box */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(14, 165, 233, 0.08) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '18px',
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} color="#34D399" />
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F8FAFC' }}>
                {lang === 'id' ? 'Metode Pembayaran (DANA, GoPay, OVO, ShopeePay, BCA, Mandiri):' : 'Payment Methods (DANA, GoPay, OVO, ShopeePay, BCA, All Banks):'}
              </span>
            </div>
            <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
              ✓ 0% Biaya Admin
            </span>
          </div>

          {/* Payment Method Switcher Tabs */}
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
            <button
              type="button"
              onClick={() => setPaymentMethodTab('qris')}
              className={paymentMethodTab === 'qris' ? 'btn-primary' : 'btn-secondary'}
              style={{ flex: 1, padding: '8px', fontSize: '0.8rem', justifyContent: 'center', gap: '6px' }}
            >
              <QrCode size={15} />
              <span>{lang === 'id' ? 'Scan QRIS (Semua E-Wallet / Bank)' : 'Scan QRIS (All E-Wallets / Banks)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethodTab('manual')}
              className={paymentMethodTab === 'manual' ? 'btn-primary' : 'btn-secondary'}
              style={{ flex: 1, padding: '8px', fontSize: '0.8rem', justifyContent: 'center', gap: '6px' }}
            >
              <CreditCard size={15} />
              <span>{lang === 'id' ? 'Transfer Nomor E-Wallet' : 'Transfer to E-Wallet Number'}</span>
            </button>
          </div>

          {/* TAB 1: QRIS Display */}
          {paymentMethodTab === 'qris' && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.85)',
              padding: '18px',
              borderRadius: '16px',
              border: '1px solid var(--border-glass)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'center'
            }}>
              <div style={{
                background: '#fff',
                padding: '12px',
                borderRadius: '16px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                maxWidth: '260px',
                width: '100%'
              }}>
                <img 
                  src="/qris-lamarkerja.jpg" 
                  alt="QRIS LamarKerja Ai"
                  style={{ width: '100%', height: 'auto', borderRadius: '10px', display: 'block' }}
                />
              </div>

              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#F8FAFC' }}>
                  LamarKerja Ai • NMID: ID1026572054777
                </div>
                <div style={{ fontSize: '0.76rem', color: '#94A3B8', marginTop: '3px' }}>
                  {lang === 'id' 
                    ? 'Bisa di-scan dari aplikasi DANA, GoPay, OVO, ShopeePay, BCA, Livin, BRImo, BNI, LinkAja & Semua Bank.'
                    : 'Supported by DANA, GoPay, OVO, ShopeePay, BCA, Mandiri, BRI, and all Indonesian banking apps.'}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Manual Transfer */}
          {paymentMethodTab === 'manual' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center', background: 'rgba(15, 23, 42, 0.85)', padding: '16px 18px', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
              <div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {lang === 'id' ? 'Nomor E-Wallet (DANA, GoPay, OVO, ShopeePay):' : 'E-Wallet Number (DANA, GoPay, OVO, ShopeePay):'}
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.04em', fontFamily: 'var(--font-mono)' }}>
                  {ewalletFormatted}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  a/n {ownerName}
                </div>
              </div>

              <button
                onClick={handleCopyNumber}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.8rem', gap: '6px' }}
              >
                {copiedNumber ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                <span>{copiedNumber ? (lang === 'id' ? 'Tersalin!' : 'Copied!') : (lang === 'id' ? 'Salin Nomor' : 'Copy Number')}</span>
              </button>
            </div>
          )}

          {/* 1-Click WhatsApp Confirmation Action */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={handleWhatsAppConfirmation}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '0.92rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #10B981, #059669)',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <MessageCircle size={18} />
              <span>{lang === 'id' ? `📲 Konfirmasi Pembayaran via WhatsApp (${getActivePlanDetails().price})` : `📲 Confirm Payment via WhatsApp (${getActivePlanDetails().price})`}</span>
            </button>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', margin: 0 }}>
              {lang === 'id' 
                ? 'Setelah transfer atau scan QRIS, klik tombol hijau di atas untuk kirim bukti struk. Akun Anda langsung diaktifkan oleh Admin.'
                : 'After scanning QRIS or transferring, click the green button above to attach your receipt. Admin will activate your PRO account instantly.'}
            </p>
          </div>
        </div>

        {/* Viral Referral Loop Box */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px dashed rgba(245, 158, 11, 0.4)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Gift size={22} color="#FBBF24" />
            <div>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FBBF24', margin: 0 }}>
                {lang === 'id' ? '🎁 Mau Kuota Gratis Tanpa Bayar?' : '🎁 Want Free Quota Without Paying?'}
              </h4>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {lang === 'id' 
                  ? 'Bagikan link referral Anda. Dapatkan +5 Kuota Lamaran Gratis setiap 1 teman mendaftar!'
                  : 'Share your referral link. Earn +5 free application quotas for every friend who registers!'}
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyRef}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 12px', gap: '6px' }}
          >
            {copiedRef ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
            <span>{copiedRef ? (lang === 'id' ? 'Link Tersalin!' : 'Link Copied!') : (lang === 'id' ? 'Salin Link Referral' : 'Copy Referral Link')}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
