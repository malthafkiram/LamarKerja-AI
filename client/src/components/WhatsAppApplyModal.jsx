import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, Send, Copy, CheckCircle2, ExternalLink, RefreshCw, X, Sparkles, 
  User, Briefcase, Phone, UploadCloud, FileText, Image as ImageIcon, Clipboard, Check, AlertCircle, Building 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function WhatsAppApplyModal({ isOpen, onClose, jobDetails, profile }) {
  if (!isOpen) return null;

  // Active Tab Mode: 'current' (Loker Terpilih) | 'drop_scan' (Upload/Paste Gambar) | 'text_scan' (Paste Teks Loker)
  const [activeMode, setActiveMode] = useState(jobDetails ? 'current' : 'drop_scan');
  
  // Job & Contact State
  const [phone, setPhone] = useState(jobDetails?.whatsapp_number || jobDetails?.phone || '');
  const [companyName, setCompanyName] = useState(jobDetails?.company_name || jobDetails?.company || '');
  const [position, setPosition] = useState(jobDetails?.position || jobDetails?.title || '');
  const [requirements, setRequirements] = useState(jobDetails?.requirements || []);
  
  // OCR & Image Drop State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  
  // Chat Generator State
  const [chatData, setChatData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const initialPhone = jobDetails?.whatsapp_number || jobDetails?.phone || '';
      setPhone(initialPhone);
      setCompanyName(jobDetails?.company_name || jobDetails?.company || '');
      setPosition(jobDetails?.position || jobDetails?.title || '');
      setRequirements(jobDetails?.requirements || []);
      
      if (jobDetails) {
        setActiveMode('current');
        handleGenerateChat(initialPhone, jobDetails?.company_name || jobDetails?.company, jobDetails?.position || jobDetails?.title, jobDetails?.requirements);
      } else {
        setActiveMode('drop_scan');
      }
    }
  }, [isOpen, jobDetails]);

  // Global Paste (Ctrl+V) listener for images
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            handleProcessImageFile(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const handleProcessImageFile = async (file) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setActiveMode('drop_scan');
    setIsScanning(true);
    setError(null);
    setScanStatus('Memindai brosur & mendeteksi nomor WhatsApp HRD...');

    try {
      const token = localStorage.getItem('lamarkerja_token');
      const formData = new FormData();
      formData.append('flyer_image', file);

      const res = await fetch('/api/scan-brochure', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal memindai gambar');
      }

      const extracted = data.jobDetails || {};
      const detectedPhone = extracted.whatsapp_number || extracted.phone || '';
      const detectedComp = extracted.company_name || 'Perusahaan Teridentifikasi';
      const detectedPos = extracted.position || 'Posisi Terbuka';
      const detectedReqs = extracted.requirements || [];

      setPhone(detectedPhone);
      setCompanyName(detectedComp);
      setPosition(detectedPos);
      setRequirements(detectedReqs);

      setScanStatus('✓ Nomor WA dan data loker berhasil diekstrak!');

      // Automatically generate WhatsApp tailored pitch
      await handleGenerateChat(detectedPhone, detectedComp, detectedPos, detectedReqs);
    } catch (err) {
      console.error(err);
      setError('Gagal mengekstrak nomor WhatsApp dari brosur: ' + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleProcessPastedText = async () => {
    if (!pastedText.trim()) return;
    setIsScanning(true);
    setError(null);
    setScanStatus('AI sedang menganalisis teks untuk menemukan nomor WhatsApp & kualifikasi...');

    try {
      const token = localStorage.getItem('lamarkerja_token');
      // Extract phone via regex first
      const phoneMatch = pastedText.match(/(\+62|62|08)[0-9\s-]{8,15}/g);
      let detectedPhone = phoneMatch ? phoneMatch[0].replace(/[\s-]/g, '') : '';

      // Call AI to extract details and generate chat
      const res = await fetch('/api/whatsapp/generate-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          jobDetails: {
            company_name: companyName || 'Perusahaan Terkait',
            position: position || 'Posisi Lowongan',
            requirements: [pastedText.slice(0, 500)],
            whatsapp_number: detectedPhone
          }
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Gagal menganalisis teks');

      if (detectedPhone) setPhone(detectedPhone);
      setChatData(data.chatData);
      setScanStatus('✓ Pesan WhatsApp berhasil disusun!');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleGenerateChat = async (targetPhone = phone, targetComp = companyName, targetPos = position, targetReqs = requirements) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch('/api/whatsapp/generate-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          jobDetails: {
            company_name: targetComp,
            position: targetPos,
            requirements: targetReqs,
            whatsapp_number: targetPhone
          }
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal menyusun pesan WhatsApp');
      }

      setChatData(data.chatData);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyChat = () => {
    if (!chatData?.chat_message) return;
    navigator.clipboard.writeText(chatData.chat_message);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    if (!chatData?.chat_message) return;
    let targetNum = phone.replace(/[^0-9]/g, '');
    if (targetNum.startsWith('08')) targetNum = '628' + targetNum.slice(2);
    else if (targetNum.startsWith('8')) targetNum = '628' + targetNum.slice(1);

    const waUrl = targetNum
      ? `https://wa.me/${targetNum}?text=${encodeURIComponent(chatData.chat_message)}`
      : `https://wa.me/?text=${encodeURIComponent(chatData.chat_message)}`;

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch {}

    window.open(waUrl, '_blank');
  };

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
        maxWidth: '750px',
        maxHeight: '92vh',
        overflowY: 'auto',
        background: '#0B0F19',
        border: '1px solid rgba(37, 211, 102, 0.35)',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(37, 211, 102, 0.15)',
              border: '1px solid rgba(37, 211, 102, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MessageCircle size={24} color="#25D366" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-emerald" style={{ background: 'rgba(37, 211, 102, 0.2)', color: '#25D366', borderColor: 'rgba(37, 211, 102, 0.4)' }}>
                  WhatsApp Auto-Apply & Drop-Scan
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deteksi Otomatis Nomor WA HRD</span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '2px 0 0 0', color: '#F8FAFC' }}>
                Lamar via WhatsApp dengan AI Scanner
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

        {/* Mode Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
          <button
            onClick={() => setActiveMode('current')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: activeMode === 'current' ? '#25D366' : 'transparent',
              color: activeMode === 'current' ? '#000' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Briefcase size={14} />
            <span>Loker Ini</span>
          </button>

          <button
            onClick={() => setActiveMode('drop_scan')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: activeMode === 'drop_scan' ? '#25D366' : 'transparent',
              color: activeMode === 'drop_scan' ? '#000' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <UploadCloud size={14} />
            <span>Drop & Scan Brosur / Screenshot WA</span>
          </button>

          <button
            onClick={() => setActiveMode('text_scan')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: activeMode === 'text_scan' ? '#25D366' : 'transparent',
              color: activeMode === 'text_scan' ? '#000' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Clipboard size={14} />
            <span>Paste Teks Loker</span>
          </button>
        </div>

        {/* Mode 2: Drop & Scan Brosur Screenshot */}
        {activeMode === 'drop_scan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              onClick={() => !isScanning && fileInputRef.current?.click()}
              style={{
                border: '2px dashed rgba(37, 211, 102, 0.4)',
                borderRadius: '14px',
                padding: '24px 20px',
                textAlign: 'center',
                background: 'rgba(37, 211, 102, 0.04)',
                cursor: isScanning ? 'wait' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*,.pdf"
                onChange={(e) => e.target.files?.[0] && handleProcessImageFile(e.target.files[0])}
              />
              
              {isScanning ? (
                <>
                  <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: '#25D366' }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F8FAFC' }}>
                    {scanStatus || 'Sedang Memindai Brosur...'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Mengekstrak nomor WhatsApp, perusahaan, dan posisi lowongan
                  </div>
                </>
              ) : (
                <>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(37, 211, 102, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UploadCloud size={22} color="#25D366" />
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F8FAFC' }}>
                    Drag & Drop Gambar Brosur / Screenshot Chat WA di sini
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Atau tekan <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Ctrl + V</kbd> untuk paste screenshot langsung
                  </div>
                </>
              )}
            </div>

            {imagePreview && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(15, 23, 42, 0.6)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                <img src={imagePreview} alt="Preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                <div style={{ flex: 1, fontSize: '0.8rem', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {imageFile?.name || 'Screenshot Hasil Paste'}
                </div>
                <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>Terpindai</span>
              </div>
            )}
          </div>
        )}

        {/* Mode 3: Paste Teks Loker */}
        {activeMode === 'text_scan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Tempelkan teks postingan lowongan kerja dari WhatsApp/Telegram/Instagram di sini..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            />
            <button
              onClick={handleProcessPastedText}
              disabled={isScanning || !pastedText.trim()}
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.85rem', background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff', alignSelf: 'flex-end' }}
            >
              {isScanning ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={14} />}
              <span>{isScanning ? 'Menganalisis Teks...' : 'Ekstrak Nomor WA & Susun Chat'}</span>
            </button>
          </div>
        )}

        {/* Target Info & Phone Editor Bar */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid var(--border-glass)',
          borderRadius: '12px',
          padding: '16px',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1.2fr 1fr auto',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <div>
            <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Perusahaan Target:
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Nama PT / Perusahaan"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Posisi yang Dilamar:
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Posisi Lowongan"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Nomor WhatsApp HRD:
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={13} style={{ position: 'absolute', left: '10px', top: '12px', color: '#25D366' }} />
              <input
                type="text"
                className="input-field"
                style={{ paddingLeft: '30px', fontSize: '0.85rem' }}
                placeholder="0812xxxx / 628..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={() => handleGenerateChat(phone, companyName, position, requirements)}
            disabled={isLoading || isScanning}
            className="btn-secondary"
            style={{ height: '40px', padding: '0 14px', fontSize: '0.82rem', borderColor: 'rgba(37, 211, 102, 0.4)', color: '#25D366' }}
            title="Generate Ulang dengan AI"
          >
            {isLoading ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={15} />}
            <span>Generate</span>
          </button>
        </div>

        {/* Error Notice */}
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.35)', color: '#FDA4AF', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* Live Chat Bubble Preview */}
        {isLoading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: '#25D366' }} />
            <h4 style={{ fontSize: '1rem', color: '#F8FAFC', margin: 0 }}>Menyusun Pesan WhatsApp Profesional...</h4>
            <p style={{ fontSize: '0.82rem', margin: 0 }}>Memadukan profil keahlian CV Anda dengan kebutuhan posisi di {companyName || 'perusahaan'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                💬 Pratinjau Pesan WhatsApp:
              </span>
              <button
                onClick={handleCopyChat}
                style={{ background: 'none', border: 'none', color: isCopied ? '#34D399' : '#38BDF8', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
              >
                {isCopied ? <CheckCircle2 size={14} color="#10B981" /> : <Copy size={14} />}
                <span>{isCopied ? 'Tersalin ke Clipboard!' : 'Salin Pesan'}</span>
              </button>
            </div>

            {/* Simulated WhatsApp Bubble */}
            <div style={{
              background: '#0B141A',
              backgroundImage: 'radial-gradient(rgba(37, 211, 102, 0.05) 1px, transparent 0)',
              backgroundSize: '16px 16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '20px',
              position: 'relative'
            }}>
              <div style={{
                background: '#005C4B',
                color: '#E9EDEF',
                padding: '16px 18px',
                borderRadius: '12px 12px 2px 12px',
                fontSize: '0.9rem',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                maxWidth: '94%',
                marginLeft: 'auto'
              }}>
                {chatData?.chat_message || 'Sedang menyiapkan draf pesan...'}
              </div>
              <div style={{ textAlign: 'right', marginTop: '6px', fontSize: '0.72rem', color: '#8696A0' }}>
                ✓✓ Dibaca • Siap Dikirim Langsung ke {phone || 'HRD'}
              </div>
            </div>

            {/* Quick Tips */}
            <div style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(37, 211, 102, 0.08)',
              border: '1px solid rgba(37, 211, 102, 0.2)',
              fontSize: '0.8rem',
              color: '#86EFAC',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Sparkles size={16} color="#25D366" />
              <span><b>Tips Lamar via WA:</b> Setelah WhatsApp terbuka, jangan lupa lampirkan file PDF CV Anda di chat sebelum menekan tombol kirim!</span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-glass)' }}>
              <button
                onClick={handleCopyChat}
                className="btn-secondary"
                style={{ flex: 1, padding: '12px', fontSize: '0.9rem' }}
              >
                {isCopied ? <CheckCircle2 size={16} color="#10B981" /> : <Copy size={16} />}
                <span>{isCopied ? 'Teks Berhasil Disalin!' : 'Salin Teks Pesan'}</span>
              </button>

              <button
                onClick={handleOpenWhatsApp}
                className="btn-primary"
                style={{
                  flex: 1.4,
                  padding: '12px',
                  fontSize: '0.92rem',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <MessageCircle size={18} />
                <span>Buka WhatsApp & Kirim</span>
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
