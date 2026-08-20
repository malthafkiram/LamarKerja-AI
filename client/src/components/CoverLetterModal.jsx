import React, { useState, useEffect } from 'react';
import { FileText, Copy, CheckCircle2, Download, Printer, RefreshCw, X, Sparkles, Globe, Languages, Send } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CoverLetterModal({ isOpen, onClose, defaultCompany, defaultPosition, defaultRequirements, defaultLocation, defaultDescription, profile }) {
  const [companyName, setCompanyName] = useState(defaultCompany || '');
  const [position, setPosition] = useState(defaultPosition || '');
  const [language, setLanguage] = useState('id'); // 'id' | 'en'
  const [letterData, setLetterData] = useState(null);
  const [editableText, setEditableText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setCompanyName(defaultCompany || '');
      setPosition(defaultPosition || '');
      setLetterData(null);
      setEditableText('');
      if (defaultCompany) {
        fetchCoverLetter(defaultCompany, defaultPosition || '', language);
      }
    }
  }, [isOpen, defaultCompany, defaultPosition]);

  const fetchCoverLetter = async (comp = companyName, pos = position, lang = language) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          companyName: comp,
          position: pos,
          requirements: defaultRequirements || [],
          location: defaultLocation || '',
          description: defaultDescription || '',
          language: lang
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal menyusun Surat Lamaran');
      }

      setLetterData(data.letterData);
      setEditableText(data.letterData.full_content_text || '');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editableText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleDownloadTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([editableText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Surat_Lamaran_${position.replace(/\s+/g, '_')}_${companyName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    } catch {}
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=900');
    printWindow.document.write(`
      <html>
        <head>
          <title>${letterData?.letter_title || 'Surat Lamaran Pekerjaan'}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.6; padding: 40px; color: #000; }
            p { margin-bottom: 12px; }
            .header { text-align: right; margin-bottom: 24px; }
            .recipient { margin-bottom: 20px; }
            .signature { margin-top: 40px; }
          </style>
        </head>
        <body>
          <pre style="font-family: inherit; font-size: inherit; white-space: pre-wrap;">${editableText}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
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
        maxWidth: '820px',
        maxHeight: '92vh',
        overflowY: 'auto',
        background: '#0B0F19',
        border: '1px solid rgba(14, 165, 233, 0.35)',
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
              background: 'rgba(14, 165, 233, 0.15)',
              border: '1px solid rgba(14, 165, 233, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={24} color="#0EA5E9" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-cyan">AI Cover Letter Builder</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Format Resmi & Baku</span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '2px 0 0 0', color: '#F8FAFC' }}>
                Generator Surat Lamaran Kerja Resmi
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

        {/* Target Inputs & Language Switcher */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid var(--border-glass)',
          borderRadius: '12px',
          padding: '16px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 120px auto',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <div>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Nama Perusahaan:
            </label>
            <input
              type="text"
              className="input-field"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Contoh: PT Telkom Indonesia"
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

          <div>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Bahasa:
            </label>
            <select
              className="input-field"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                fetchCoverLetter(companyName, position, e.target.value);
              }}
            >
              <option value="id">Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>

          <button
            onClick={() => fetchCoverLetter(companyName, position, language)}
            disabled={isLoading}
            className="btn-primary"
            style={{ height: '40px', padding: '0 16px', fontSize: '0.85rem' }}
          >
            {isLoading ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={15} />}
            <span>{isLoading ? 'Menulis...' : 'Generate'}</span>
          </button>
        </div>

        {/* Error Notice */}
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.35)', color: '#FDA4AF', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* Letter Preview & Editable Area */}
        {isLoading ? (
          <div style={{ padding: '70px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', color: 'var(--text-muted)' }}>
            <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', color: '#0EA5E9' }} />
            <h4 style={{ fontSize: '1.05rem', color: '#F8FAFC', margin: 0 }}>Menulis Surat Lamaran Kerja Resmi...</h4>
            <p style={{ fontSize: '0.82rem', margin: 0 }}>Menyelaraskan kualifikasi CV Anda dengan kebutuhan spesifik {companyName}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Highlights pills */}
            {letterData?.key_highlights && letterData.key_highlights.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', color: '#38BDF8', fontWeight: 600 }}>Poin Nilai Tambah Utama:</span>
                {letterData.key_highlights.map((h, i) => (
                  <span key={i} className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
                    ✓ {h}
                  </span>
                ))}
              </div>
            )}

            {/* Editable Textarea with Document Styling */}
            <div style={{
              background: '#0F172A',
              border: '1px solid var(--border-glass)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  📄 Anda dapat mengedit langsung teks di bawah ini sebelum mengunduh atau menyalin:
                </span>
                <button
                  onClick={handleCopy}
                  style={{ background: 'none', border: 'none', color: isCopied ? '#34D399' : '#38BDF8', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                >
                  {isCopied ? <CheckCircle2 size={14} color="#10B981" /> : <Copy size={14} />}
                  <span>{isCopied ? 'Tersalin!' : 'Salin Teks'}</span>
                </button>
              </div>

              <textarea
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                style={{
                  width: '100%',
                  height: '320px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#E2E8F0',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '16px',
                  fontFamily: 'serif',
                  fontSize: '0.95rem',
                  lineHeight: '1.7',
                  resize: 'vertical',
                  outline: 'none'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-glass)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleDownloadTxt}
                  className="btn-secondary"
                  style={{ padding: '10px 16px', fontSize: '0.85rem' }}
                >
                  <Download size={16} />
                  <span>Download .TXT</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="btn-secondary"
                  style={{ padding: '10px 16px', fontSize: '0.85rem' }}
                >
                  <Printer size={16} />
                  <span>Cetak / Simpan PDF</span>
                </button>
              </div>

              <button
                onClick={handleCopy}
                className="btn-primary"
                style={{ padding: '10px 22px', fontSize: '0.88rem' }}
              >
                {isCopied ? <CheckCircle2 size={16} color="#10B981" /> : <Copy size={16} />}
                <span>{isCopied ? 'Berhasil Disalin ke Clipboard!' : 'Salin Surat Lamaran Lengkap'}</span>
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
