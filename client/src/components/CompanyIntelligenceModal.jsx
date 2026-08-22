import React, { useState, useEffect } from 'react';
import { Building2, Sparkles, HelpCircle, Lightbulb, MessageSquare, CheckCircle2, Copy, X, RefreshCw, Layers, ShieldCheck, Target, ArrowRight } from 'lucide-react';

export default function CompanyIntelligenceModal({ isOpen, onClose, defaultCompany, defaultPosition, defaultIndustry }) {
  const [companyName, setCompanyName] = useState(defaultCompany || '');
  const [position, setPosition] = useState(defaultPosition || '');
  const [industry, setIndustry] = useState(defaultIndustry || '');
  const [intelligence, setIntelligence] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setCompanyName(defaultCompany || '');
      setPosition(defaultPosition || '');
      setIntelligence(null);
      if (defaultCompany) {
        fetchIntelligence(defaultCompany, defaultPosition || '');
      }
    }
  }, [isOpen, defaultCompany, defaultPosition]);

  const fetchIntelligence = async (comp = companyName, pos = position) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch('/api/company/intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          companyName: comp,
          position: pos,
          industry
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal membedah profil perusahaan');
      }

      setIntelligence(data.intelligence);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.88)',
      backdropFilter: 'blur(10px)',
      zIndex: 120,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '850px',
        maxHeight: '92vh',
        overflowY: 'auto',
        background: '#0B0F19',
        border: '1px solid rgba(168, 85, 247, 0.35)',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={24} color="#A855F7" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-purple" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#C084FC', borderColor: 'rgba(168, 85, 247, 0.4)' }}>
                  AI Company Intelligence
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mata-Mata Profil & Kisi-Kisi Interview</span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '2px 0 0 0', color: '#F8FAFC' }}>
                Cheat Sheet & Profil Perusahaan Target
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.3rem', padding: '4px' }}
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div className="stack-mobile" style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid var(--border-glass)',
          borderRadius: '12px',
          padding: '16px',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr auto',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <div>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Nama Perusahaan Target:
            </label>
            <input
              type="text"
              className="input-field"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Contoh: Gojek, Traveloka, BCA, Shopee..."
            />
          </div>

          <div>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Posisi yang Dilamar:
            </label>
            <input
              type="text"
              className="input-field"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Contoh: Frontend Developer"
            />
          </div>

          <button
            onClick={() => fetchIntelligence(companyName, position)}
            disabled={isLoading}
            className="btn-primary"
            style={{ height: '40px', padding: '0 18px', fontSize: '0.85rem', background: 'linear-gradient(135deg, #7C3AED, #9333EA)' }}
          >
            {isLoading ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={15} />}
            <span>{isLoading ? 'Menganalisis...' : 'Bongkar Profil'}</span>
          </button>
        </div>

        {/* Error Notice */}
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.35)', color: '#FDA4AF', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* Results Container */}
        {isLoading ? (
          <div style={{ padding: '70px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', color: 'var(--text-muted)' }}>
            <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', color: '#A855F7' }} />
            <h4 style={{ fontSize: '1.05rem', color: '#F8FAFC', margin: 0 }}>Membedah Profil Bisnis & Kisi-Kisi Interview {companyName}...</h4>
            <p style={{ fontSize: '0.82rem', margin: 0 }}>Menganalisis model monetisasi, budaya kerja, dan trik memikat hiring manager</p>
          </div>
        ) : intelligence ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Section 1: Overview & Culture */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '14px' }}>
              <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={18} color="#C084FC" />
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: '#F8FAFC' }}>Model Bisnis & Posisi Industri</h4>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                  {intelligence.company_overview}
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="#34D399" />
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: '#F8FAFC' }}>Budaya Kerja & Karakteristik yang Dicari</h4>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                  {intelligence.company_culture}
                </p>
              </div>
            </div>

            {/* Section 2: Why Join Us Answer */}
            {intelligence.why_this_company_answer && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(15, 23, 42, 0.8))',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '14px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Target size={18} color="#E879F9" />
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FDF4FF' }}>
                      Jawaban Emas untuk: "Kenapa Anda Tertarik Bekerja di {companyName}?"
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(intelligence.why_this_company_answer, 'why_join')}
                    style={{ background: 'none', border: 'none', color: copiedKey === 'why_join' ? '#34D399' : '#C084FC', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                  >
                    {copiedKey === 'why_join' ? <CheckCircle2 size={13} color="#10B981" /> : <Copy size={13} />}
                    <span>{copiedKey === 'why_join' ? 'Tersalin!' : 'Salin Jawaban'}</span>
                  </button>
                </div>
                <p style={{ fontSize: '0.86rem', color: '#E2E8F0', lineHeight: '1.6', margin: 0, background: 'rgba(15, 23, 42, 0.6)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  "{intelligence.why_this_company_answer}"
                </p>
              </div>
            )}

            {/* Section 3: Interview Cheat Sheet (Anticipated Questions & Pro Tips) */}
            {intelligence.interview_cheat_sheet && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lightbulb size={18} color="#FBBF24" />
                  Kisi-Kisi Pertanyaan Khas di {companyName} & Trik Menjawab:
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {intelligence.interview_cheat_sheet.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>❓ {item.anticipated_question}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#F59E0B', fontWeight: 600 }}>Maksud HRD:</span>
                        <span>{item.what_interviewer_wants}</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#34D399', background: 'rgba(16, 185, 129, 0.08)', padding: '6px 10px', borderRadius: '8px', marginTop: '4px' }}>
                        <b>💡 Pro Tip:</b> {item.pro_tip}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 4: Smart Reverse Questions */}
            {intelligence.smart_questions_to_ask_interviewer && (
              <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={16} color="#0EA5E9" />
                  3 Pertanyaan Berbobot untuk Ditanyakan Balik ke Interviewer:
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  {intelligence.smart_questions_to_ask_interviewer.map((q, idx) => (
                    <li key={idx} style={{ lineHeight: '1.5' }}>
                      <span style={{ color: '#E2E8F0' }}>"{q}"</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        ) : null}
      </div>
    </div>
  );
}
