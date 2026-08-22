import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, FileImage, Sparkles, CheckCircle, AlertTriangle, Send, 
  RefreshCw, ShieldAlert, Check, Copy, Paperclip, Briefcase, Building, 
  Mail, MapPin, Calendar, DollarSign, ArrowRight, Eye, Edit3, MessageSquare, ShieldCheck, Award,
  MessageCircle, FileText, Building2, Phone, ZoomIn, ZoomOut, Maximize2, RotateCw, X, User, Code2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import InterviewSimulatorModal from './InterviewSimulatorModal';
import SalaryInsightModal from './SalaryInsightModal';
import AntiScamModal from './AntiScamModal';
import WhatsAppApplyModal from './WhatsAppApplyModal';
import CoverLetterModal from './CoverLetterModal';
import CompanyIntelligenceModal from './CompanyIntelligenceModal';
import LiveCodeModal from './LiveCodeModal';
import { hasSmtpCredentials } from '../utils/smtpConfig';
import { useLanguage } from '../context/LanguageContext';

export default function BrochureScanner({ profile, settings, onApplicationSent, onOpenSettings }) {
  const { t, lang } = useLanguage();
  const [file, setFile] = useState(null);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(''); // 'ocr', 'ai_extract', 'match_eval'
  const [scanResult, setScanResult] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Image Zoom / Lightbox State
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomRotation, setZoomRotation] = useState(0);

  // Modals state
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showAntiScamModal, setShowAntiScamModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false);
  const [showCompanySpyModal, setShowCompanySpyModal] = useState(false);
  const [showLiveCodeModal, setShowLiveCodeModal] = useState(false);

  // Editable Form Fields after extraction
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [contactPersons, setContactPersons] = useState([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [matchScore, setMatchScore] = useState(0);
  const [salaryRange, setSalaryRange] = useState('');
  const [location, setLocation] = useState('');
  const [applicationId, setApplicationId] = useState(null);

  const fileInputRef = useRef(null);

  // Support pasting image from clipboard (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const pastedFile = e.clipboardData.files[0];
        if (pastedFile.type.startsWith('image/') || pastedFile.type.includes('pdf')) {
          handleSelectFile(pastedFile);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleSelectFile = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setScanResult(null);
    setErrorMessage(null);
    setSendSuccess(false);

    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectFile(e.dataTransfer.files[0]);
    }
  };

  // Perform AI Scan & Match
  const handleStartScan = async () => {
    if (!file) return;

    setIsScanning(true);
    setErrorMessage(null);
    setScanStep('Membaca teks dari brosur menggunakan OCR Tesseract...');

    try {
      const formData = new FormData();
      formData.append('flyer_image', file);

      setTimeout(() => {
        setScanStep(lang === 'id' ? 'Groq AI mengekstrak posisi, email HRD, & syarat loker...' : 'Groq AI extracting role, HR email, and requirements...');
      }, 1500);

      setTimeout(() => {
        setScanStep('Mencocokkan kualifikasi dengan profil CV Anda & membuat draf email...');
      }, 3500);

      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch('/api/scan-brochure', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal memindai brosur lowongan');
      }

      setScanResult(data);
      setCompanyName(data.jobDetails.company_name || '');
      setPosition(data.jobDetails.position || '');
      setRecipientEmail(data.jobDetails.recipient_email || '');
      setWhatsappNumber(data.jobDetails.whatsapp_number || '');
      setContactPersons(data.jobDetails.contact_persons || []);
      setEmailSubject(data.matchAndDraft.email_subject || '');
      setEmailBody(data.matchAndDraft.email_body || '');

      if (data.autoSent) {
        setSendSuccess(true);
        triggerConfetti();
        if (onApplicationSent) onApplicationSent();
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  // Send Application via Gmail SMTP
  const handleSendApplication = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setErrorMessage('Harap periksa kembali alamat email tujuan HRD (wajib mengandung tanda @).');
      return;
    }

    if (!hasSmtpCredentials(profile, settings)) {
      setErrorMessage('Konfigurasi Gmail SMTP belum lengkap. Silakan atur email dan App Password di menu Pengaturan.');
      if (onOpenSettings) onOpenSettings();
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch('/api/send-application', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          applicationId: scanResult?.applicationId,
          recipientEmail,
          subject: emailSubject,
          bodyText: emailBody
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal mengirim email lamaran');
      }

      setSendSuccess(true);
      triggerConfetti();
      if (onApplicationSent) onApplicationSent();
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setIsSending(false);
    }
  };

  // Demo Brochure Generator (Creates a quick sample image flyer if user has no image right away)
  const handleUseDemoFlyer = (type = 'frontend') => {
    const canvas = document.createElement('canvas');
    canvas.width = 700;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');

    // Gradient Background
    const grad = ctx.createLinearGradient(0, 0, 700, 900);
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(1, '#1E293B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 700, 900);

    // Decorative top header
    ctx.fillStyle = '#0EA5E9';
    ctx.fillRect(0, 0, 700, 18);

    // Company Header
    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('PT INOVASI TEKNOLOGI NUSANTARA', 65, 80);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '18px sans-serif';
    ctx.fillText('Jakarta Selatan, DKI Jakarta • www.techinovasi.co.id', 65, 115);

    // Divider
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(65, 140);
    ctx.lineTo(635, 140);
    ctx.stroke();

    // Big Hiring Headline
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('WE ARE HIRING!', 65, 205);

    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 32px sans-serif';
    const jobTitle = type === 'frontend' ? 'FRONTEND DEVELOPER (REACT.JS)' : 'FULLSTACK DEVELOPER (NODE & REACT)';
    ctx.fillText(jobTitle, 65, 255);

    ctx.fillStyle = '#FBBF24';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Gaji: Rp 9.000.000 - Rp 16.000.000 / Bulan (Remote / Hybrid)', 65, 300);

    // Qualifications Section
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('KUALIFIKASI YANG DIBUTUHKAN:', 65, 365);

    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#E2E8F0';
    const lines = [
      '• Minimal 1 tahun pengalaman atau Fresh Graduate bertalenta',
      '• Menguasai JavaScript, React.js, HTML5, CSS3 / Tailwind',
      '• Memahami REST API dan integrasi backend (Node.js)',
      '• Disiplin, komunikatif, dan mampu bekerja dalam tim',
      '• Memiliki portofolio proyek yang dapat ditunjukkan'
    ];
    lines.forEach((line, i) => {
      ctx.fillText(line, 65, 420 + i * 38);
    });

    // How to Apply Box
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(65, 630, 570, 180);
    ctx.fillStyle = '#34D399';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('CARA MELAMAR:', 85, 670);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px sans-serif';
    ctx.fillText('Kirimkan CV & Portofolio terbaru Anda ke:', 85, 710);
    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('karir@techinovasi.co.id', 85, 745);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '16px sans-serif';
    ctx.fillText('Subject: [Loker] Frontend Dev - Nama Anda', 85, 785);

    canvas.toBlob((blob) => {
      const demoFile = new File([blob], `loker_${type}_demo.png`, { type: 'image/png' });
      handleSelectFile(demoFile);
    });
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  };

  const resetAll = () => {
    setFile(null);
    setPreviewUrl(null);
    setScanResult(null);
    setSendSuccess(false);
    setErrorMessage(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Banner / Hero */}
      <div className="glass-panel page-hero" style={{
        padding: '24px 32px',
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(99, 102, 241, 0.08) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ maxWidth: '680px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-cyan">Drop & Send Mode</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {lang === 'id' ? 'Cukup Lempar Gambar Brosur' : 'Simply Drop Recruitment Flyers'}
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '6px' }}>
            {lang === 'id' ? 'Unggah Brosur Loker, AI Otomatis Ekstrak & Siapkan Email' : 'Upload Job Flyer, AI Extracts & Drafts Application'}
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            {lang === 'id' 
              ? 'Tinggal drag-and-drop atau paste screenshot (Ctrl+V) poster loker. Groq AI akan membaca email HRD, mengecek kecocokan dengan CV Anda, lalu membuatkan surat lamaran profesional.'
              : 'Drag-and-drop or paste screenshots (Ctrl+V) of job flyers. Groq AI extracts HR contacts, calculates CV match scores, and composes professional cover letters.'}
          </p>
        </div>

        {/* Quick Demo Flyer Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {lang === 'id' ? 'Belum punya gambar brosur?' : 'No flyer image handy?'}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => handleUseDemoFlyer('frontend')} 
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}
            >
              <Sparkles size={14} color="#38BDF8" /> {lang === 'id' ? 'Contoh Brosur Frontend' : 'Frontend Flyer Demo'}
            </button>
            <button 
              onClick={() => handleUseDemoFlyer('fullstack')} 
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}
            >
              <Sparkles size={14} color="#818CF8" /> {lang === 'id' ? 'Contoh Brosur Fullstack' : 'Fullstack Flyer Demo'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div style={{
          padding: '14px 20px',
          borderRadius: '12px',
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.35)',
          color: '#FDA4AF',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertTriangle size={20} color="#F43F5E" />
          <div style={{ flex: 1, fontSize: '0.9rem' }}>{errorMessage}</div>
          <button 
            onClick={() => setErrorMessage(null)} 
            style={{ background: 'none', border: 'none', color: '#FDA4AF', cursor: 'pointer', fontSize: '1.1rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Banner */}
      {sendSuccess && (
        <div className="glass-panel" style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.1))',
          borderColor: 'rgba(16, 185, 129, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #10B981'
            }}>
              <CheckCircle size={28} color="#10B981" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34D399' }}>
                {lang === 'id' ? '🎉 Lamaran Kerja Berhasil Terkirim ke HRD!' : '🎉 Application Successfully Sent to HR!'}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                {lang === 'id' 
                  ? <>Email telah berhasil dikirim ke <b>{recipientEmail}</b> via Gmail SMTP beserta lampiran CV Anda.</>
                  : <>Email has been sent to <b>{recipientEmail}</b> via Gmail SMTP with your CV attached.</>}
              </p>
            </div>
          </div>
          <button onClick={resetAll} className="btn-primary">
            <RefreshCw size={16} /> {lang === 'id' ? 'Scan Brosur Lain' : 'Scan Another Flyer'}
          </button>
        </div>
      )}

      {/* Main Grid: Upload Dropzone & Results */}
      <div className="stack-mobile" style={{ display: 'grid', gridTemplateColumns: scanResult ? '1fr 1.4fr' : '1fr', gap: '24px' }}>
        
        {/* Left Column: Dropzone & Image Preview */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileImage size={20} color="#38BDF8" />
              {lang === 'id' ? '1. Berkas Poster / Brosur Loker' : '1. Recruitment Flyer / Poster File'}
            </h2>
            {file && (
              <button 
                onClick={resetAll} 
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RefreshCw size={13} /> {lang === 'id' ? 'Ganti File' : 'Change File'}
              </button>
            )}
          </div>


          {/* Interactive Dropzone */}
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? '#38BDF8' : 'rgba(255, 255, 255, 0.15)'}`,
                borderRadius: '16px',
                padding: '48px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragging ? 'rgba(56, 189, 248, 0.08)' : 'rgba(15, 23, 42, 0.4)',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                minHeight: '280px'
              }}
            >
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(56, 189, 248, 0.2)'
              }}>
                <UploadCloud size={32} color="#38BDF8" />
              </div>
              <div>
                <p style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '4px' }}>
                  {lang === 'id' ? 'Klik untuk pilih file atau Drag & Drop di sini' : 'Click to select file or Drag & Drop here'}
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {lang === 'id' ? 'Mendukung PNG, JPG, JPEG, WebP, atau PDF Brosur (Maks 20MB)' : 'Supports PNG, JPG, JPEG, WebP, or PDF Flyers (Max 20MB)'}
                </p>
                <p style={{ fontSize: '0.78rem', color: '#38BDF8', marginTop: '8px', fontWeight: 500 }}>
                  {lang === 'id' 
                    ? <>💡 Tips: Anda juga bisa langsung tekan <b>Ctrl + V</b> untuk paste screenshot!</>
                    : <>💡 Tip: You can also press <b>Ctrl + V</b> to paste screenshots directly!</>}
                </p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*,application/pdf"
                onChange={(e) => e.target.files?.[0] && handleSelectFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Preview Box with Interactive Zoom Trigger */}
              <div style={{
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#0B0F19',
                border: '1px solid var(--border-glass)',
                maxHeight: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }} className={isScanning ? 'scanner-laser-box' : ''}>
                {isScanning && <div className="scanner-laser-bar" />}
                {previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt="Brosur Loker Preview"
                      style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', cursor: 'zoom-in' }}
                      onClick={() => setIsZoomOpen(true)}
                    />
                    <button
                      type="button"
                      onClick={() => setIsZoomOpen(true)}
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        color: '#38BDF8',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(6px)'
                      }}
                    >
                      <Maximize2 size={13} />
                      <span>{lang === 'id' ? '🔍 Zoom & Periksa Detail Brosur' : '🔍 Zoom & Inspect Flyer Details'}</span>
                    </button>
                  </>
                ) : (
                  <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <FileImage size={48} style={{ marginBottom: '12px', opacity: 0.7 }} />
                    <p style={{ fontWeight: 600 }}>{file.name}</p>
                    <p style={{ fontSize: '0.8rem' }}>{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                )}
              </div>

              {/* Start Scan Button */}
              {!scanResult && (
                <button
                  onClick={handleStartScan}
                  disabled={isScanning}
                  className="btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
                >
                  {isScanning ? (
                    <>
                      <RefreshCw size={18} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
                      <span>{lang === 'id' ? 'Sedang Memproses...' : 'Processing Extraction...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>{lang === 'id' ? 'Pindai Brosur & Analisis dengan Groq AI' : 'Scan Flyer & Analyze with Groq AI'}</span>
                    </>
                  )}
                </button>
              )}

              {/* Scanning Step Status */}
              {isScanning && (
                <div style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  fontSize: '0.85rem',
                  color: '#38BDF8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div className="pulse-active" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#38BDF8' }} />
                  <span>{scanStep}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Extracted Information & Email Composer */}
        {scanResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* AI Cross-Check Disclaimer Alert */}
            <div style={{
              padding: '14px 18px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <AlertTriangle size={20} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ lineHeight: '1.5' }}>
                <b style={{ color: '#FBBF24', fontSize: '0.88rem' }}>
                  {lang === 'id' ? 'Periksa Kembali Data (AI Cross-Check):' : 'Double-Check Extracted Data (AI Cross-Check):'}
                </b>
                <p style={{ margin: '2px 0 0 0', color: '#FEF3C7', fontSize: '0.82rem' }}>
                  {lang === 'id'
                    ? <>AI dapat melakukan kesalahan dalam mengenali teks poster. Silakan gunakan tombol <b>Zoom Gambar</b> di sebelah kiri untuk memeriksa ulang kebenaran alamat email tujuan (wajib mengandung tanda <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: '4px' }}>@</code>), subjek, dan nomor WhatsApp sebelum mengirim.</>
                    : <>AI can make mistakes when parsing poster text. Please use the <b>Zoom Image</b> button on the left to verify recipient email (<code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: '4px' }}>@</code>), subject, and WhatsApp numbers before sending.</>}
                </p>
              </div>
            </div>


            {/* Match Score & Scam Assessment Bar */}
            <div className="glass-panel" style={{
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              {/* Score Meter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: scanResult.matchAndDraft.match_score >= 75 
                    ? 'conic-gradient(#10B981 0% 85%, rgba(16, 185, 129, 0.2) 85% 100%)'
                    : 'conic-gradient(#F59E0B 0% 65%, rgba(245, 158, 11, 0.2) 65% 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '5px'
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    color: scanResult.matchAndDraft.match_score >= 75 ? '#34D399' : '#FBBF24'
                  }}>
                    {scanResult.matchAndDraft.match_score}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {lang === 'id' ? 'Skor Kecocokan CV' : 'CV Match Score'}
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    {scanResult.matchAndDraft.match_score >= 75 
                      ? (lang === 'id' ? 'Sangat Relevan & Siap Lamar' : 'Highly Relevant & Ready') 
                      : (lang === 'id' ? 'Cukup Cocok' : 'Fair Match')}
                  </div>
                </div>
              </div>

              {/* Anti-Scam Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '10px',
                background: scanResult.jobDetails.scam_assessment?.is_suspicious 
                  ? 'rgba(244, 63, 94, 0.15)' 
                  : 'rgba(16, 185, 129, 0.15)',
                border: `1px solid ${scanResult.jobDetails.scam_assessment?.is_suspicious ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                color: scanResult.jobDetails.scam_assessment?.is_suspicious ? '#FB7185' : '#34D399',
                fontSize: '0.82rem',
                fontWeight: 600
              }}>
                {scanResult.jobDetails.scam_assessment?.is_suspicious ? (
                  <>
                    <ShieldAlert size={16} />
                    <span>{lang === 'id' ? 'Perhatian: Ada Indikasi Kejanggalan' : 'Notice: Potential Irregularities Detected'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    <span>{lang === 'id' ? 'Loker Terverifikasi Wajar' : 'Verified Genuine Vacancy'}</span>
                  </>
                )}
              </div>
            </div>

            {/* Extracted Details Box */}
            <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                {lang === 'id' ? 'Hasil Ekstraksi Brosur' : 'Flyer Extraction Results'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(15, 23, 42, 0.5)', padding: '10px 14px', borderRadius: '10px' }}>
                  <Building size={18} color="#38BDF8" />
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{lang === 'id' ? 'Perusahaan / Instansi' : 'Company / Employer'}</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{companyName || '-'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(15, 23, 42, 0.5)', padding: '10px 14px', borderRadius: '10px' }}>
                  <Briefcase size={18} color="#818CF8" />
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{lang === 'id' ? 'Posisi' : 'Position'}</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{position || '-'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(15, 23, 42, 0.5)', padding: '10px 14px', borderRadius: '10px' }}>
                  <Mail size={18} color="#34D399" />
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{lang === 'id' ? 'Email HRD (Tujuan)' : 'Recipient HR Email'}</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: recipientEmail ? '#34D399' : '#FDA4AF' }}>
                      {recipientEmail || (lang === 'id' ? 'Tidak terdeteksi (isi manual)' : 'Not detected (fill manually)')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(15, 23, 42, 0.5)', padding: '10px 14px', borderRadius: '10px' }}>
                  <Phone size={18} color="#25D366" />
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{lang === 'id' ? 'WhatsApp / Kontak' : 'WhatsApp / Contact'}</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#25D366' }}>
                      {whatsappNumber || scanResult.jobDetails.whatsapp_number || '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Persons Chips (e.g. Dirga, Aisha) */}
              {contactPersons.length > 0 && (
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                    {lang === 'id' ? 'Kontak Person Teridentifikasi:' : 'Identified Contact Persons:'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {contactPersons.map((cp, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setWhatsappNumber(cp.phone);
                          setShowWhatsAppModal(true);
                        }}
                        style={{
                          background: 'rgba(37, 211, 102, 0.12)',
                          border: '1px solid rgba(37, 211, 102, 0.35)',
                          color: '#25D366',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <User size={13} />
                        <span><b>{cp.name}</b>: {cp.phone}</span>
                        <MessageCircle size={12} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Highlights */}
              {scanResult.matchAndDraft.matching_points?.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '6px', fontWeight: 600 }}>
                    {lang === 'id' ? 'Kualifikasi yang Cocok dengan CV Anda:' : 'Qualifications Matching Your CV:'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {scanResult.matchAndDraft.matching_points.map((pt, idx) => (
                      <span key={idx} className="badge badge-emerald" style={{ fontSize: '0.72rem', textTransform: 'none' }}>
                        ✓ {pt}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Multichannel Booster Suite */}
              <div style={{
                marginTop: '10px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-glass)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(130px, 100%), 1fr))',
                gap: '8px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowWhatsAppModal(true)}
                  className="btn-secondary"
                  style={{ padding: '8px 10px', fontSize: '0.78rem', borderColor: 'rgba(37, 211, 102, 0.4)', color: '#25D366' }}
                >
                  <MessageCircle size={14} />
                  <span>{lang === 'id' ? 'Lamar via WA' : 'Apply via WA'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCoverLetterModal(true)}
                  className="btn-secondary"
                  style={{ padding: '8px 10px', fontSize: '0.78rem', borderColor: 'rgba(14, 165, 233, 0.4)', color: '#38BDF8' }}
                >
                  <FileText size={14} />
                  <span>{lang === 'id' ? 'Surat Lamaran' : 'Cover Letter'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCompanySpyModal(true)}
                  className="btn-secondary"
                  style={{ padding: '8px 10px', fontSize: '0.78rem', borderColor: 'rgba(168, 85, 247, 0.4)', color: '#C084FC' }}
                >
                  <Building2 size={14} />
                  <span>{lang === 'id' ? 'Profil PT' : 'Company Intel'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowInterviewModal(true)}
                  className="btn-secondary"
                  style={{ padding: '8px 10px', fontSize: '0.78rem', borderColor: 'rgba(14, 165, 233, 0.4)' }}
                >
                  <MessageSquare size={14} color="#0EA5E9" />
                  <span>{lang === 'id' ? 'Interview' : 'Interview'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSalaryModal(true)}
                  className="btn-secondary"
                  style={{ padding: '8px 10px', fontSize: '0.78rem', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                >
                  <DollarSign size={14} color="#10B981" />
                  <span>{lang === 'id' ? 'Riset Gaji' : 'Salary Insight'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAntiScamModal(true)}
                  className="btn-secondary"
                  style={{ padding: '8px 10px', fontSize: '0.78rem', borderColor: 'rgba(244, 63, 94, 0.4)' }}
                >
                  <ShieldCheck size={14} color="#FB7185" />
                  <span>{lang === 'id' ? 'Anti-Scam' : 'Anti-Scam'}</span>
                </button>
              </div>
            </div>

            {/* Email Composer & One-Click Send */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Send size={18} color="#0EA5E9" />
                  {lang === 'id' ? '2. Pratinjau & Pengiriman Email Lamaran' : '2. Application Email Preview & Sender'}
                </h3>
                <span className="badge badge-cyan">{lang === 'id' ? 'Siap Kirim' : 'Ready to Send'}</span>
              </div>

              {/* Recipient Email Input */}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  {lang === 'id' ? 'Email Tujuan HRD:' : 'Recipient HR Email:'}
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="hrd@perusahaan.com"
                />
              </div>

              {/* Subject Input */}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  {lang === 'id' ? 'Subject Email:' : 'Email Subject:'}
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>

              {/* Email Body Textarea */}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  {lang === 'id' ? 'Isi Surat Lamaran (Cover Letter):' : 'Application Letter Body (Cover Letter):'}
                </label>
                <textarea
                  className="input-field"
                  rows={8}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  style={{ fontFamily: 'inherit', resize: 'vertical', lineHeight: '1.6' }}
                />
              </div>

              {/* Attachments Preview */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '12px 16px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid var(--border-glass)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Paperclip size={16} color="#38BDF8" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{lang === 'id' ? 'Lampiran Berkas:' : 'File Attachments:'}</span>
                  <span style={{ fontSize: '0.85rem', color: '#38BDF8' }}>
                    {profile.cv_filename ? profile.cv_filename : (lang === 'id' ? 'CV_Pelamar.pdf (dari Profil)' : 'Resume_Applicant.pdf (from Profile)')}
                  </span>
                </div>
                <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>Auto-Attach</span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={handleSendApplication}
                  disabled={isSending || sendSuccess}
                  className="btn-primary"
                  style={{ flex: 1, padding: '14px', fontSize: '1rem' }}
                >
                  {isSending ? (
                    <>
                      <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>{lang === 'id' ? 'Mengirim via Gmail SMTP...' : 'Sending via Gmail SMTP...'}</span>
                    </>
                  ) : sendSuccess ? (
                    <>
                      <Check size={18} />
                      <span>{lang === 'id' ? 'Sudah Terkirim!' : 'Sent Successfully!'}</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>{lang === 'id' ? 'Kirim Lamaran Sekarang (1-Klik)' : 'Send Application Now (1-Click)'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>


          </div>
        )}

        {/* MODALS */}
        <InterviewSimulatorModal
          isOpen={showInterviewModal}
          onClose={() => setShowInterviewModal(false)}
          jobDetails={scanResult?.jobDetails || { position, company_name: companyName, requirements: [position] }}
        />

        <SalaryInsightModal
          isOpen={showSalaryModal}
          onClose={() => setShowSalaryModal(false)}
          defaultPosition={position}
          defaultLocation={location}
        />

        <AntiScamModal
          isOpen={showAntiScamModal}
          onClose={() => setShowAntiScamModal(false)}
          jobDetails={scanResult?.jobDetails || { position, company_name: companyName, recipient_email: recipientEmail }}
          rawText={scanResult?.rawOcrText || ''}
        />

        <WhatsAppApplyModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          jobDetails={scanResult?.jobDetails || { position, company_name: companyName, requirements: scanResult?.jobDetails?.requirements || [position], whatsapp_number: scanResult?.jobDetails?.whatsapp_number || '' }}
          profile={profile}
        />

        <CoverLetterModal
          isOpen={showCoverLetterModal}
          onClose={() => setShowCoverLetterModal(false)}
          defaultCompany={companyName}
          defaultPosition={position}
          defaultRequirements={scanResult?.jobDetails?.requirements || []}
          defaultLocation={scanResult?.jobDetails?.location || ''}
          defaultDescription={scanResult?.rawOcrText || scanResult?.jobDetails?.description || ''}
          profile={profile}
        />

        <CompanyIntelligenceModal
          isOpen={showCompanySpyModal}
          onClose={() => setShowCompanySpyModal(false)}
          defaultCompany={companyName}
          defaultPosition={position}
          defaultIndustry="Teknologi & Bisnis"
        />

        <LiveCodeModal
          isOpen={showLiveCodeModal}
          onClose={() => setShowLiveCodeModal(false)}
          jobDetails={{ position, company_name: companyName, requirements: scanResult?.jobDetails?.requirements || [position] }}
          profile={profile}
        />

        {/* FULLSCREEN INTERACTIVE IMAGE ZOOM LIGHTBOX */}
        {isZoomOpen && previewUrl && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.94)',
            backdropFilter: 'blur(14px)',
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            {/* Top Toolbar Controls */}
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '14px',
              padding: '8px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
              zIndex: 210
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38BDF8' }}>
                🔍 Zoom: {Math.round(zoomLevel * 100)}%
              </span>
              
              <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)' }} />

              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.3, 4.0))}
                className="btn-secondary"
                style={{ padding: '6px 12px', height: '34px', fontSize: '0.82rem', gap: '6px' }}
                title="Perbesar (+)"
              >
                <ZoomIn size={16} color="#38BDF8" />
                <span>Perbesar</span>
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.3, 0.5))}
                className="btn-secondary"
                style={{ padding: '6px 12px', height: '34px', fontSize: '0.82rem', gap: '6px' }}
                title="Perkecil (-)"
              >
                <ZoomOut size={16} />
                <span>Perkecil</span>
              </button>

              <button
                type="button"
                onClick={() => setZoomRotation(prev => (prev + 90) % 360)}
                className="btn-secondary"
                style={{ padding: '6px 12px', height: '34px', fontSize: '0.82rem', gap: '6px' }}
                title="Putar 90 Derajat"
              >
                <RotateCw size={15} />
                <span>Putar</span>
              </button>

              <button
                type="button"
                onClick={() => { setZoomLevel(1); setZoomRotation(0); }}
                className="btn-secondary"
                style={{ padding: '6px 12px', height: '34px', fontSize: '0.8rem' }}
              >
                Reset 100%
              </button>

              <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)' }} />

              <button
                type="button"
                onClick={() => {
                  setIsZoomOpen(false);
                  setZoomLevel(1);
                  setZoomRotation(0);
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#EF4444',
                  borderRadius: '10px',
                  padding: '6px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                  fontSize: '0.84rem'
                }}
              >
                <X size={16} />
                <span>Tutup Preview</span>
              </button>
            </div>

            {/* Scrollable / Pan Zoom Container */}
            <div style={{
              width: '92vw',
              height: '82vh',
              overflow: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '45px',
              cursor: zoomLevel > 1 ? 'grab' : 'default'
            }}>
              <img
                src={previewUrl}
                alt="Brosur Loker High Resolution"
                style={{
                  transform: `scale(${zoomLevel}) rotate(${zoomRotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out',
                  maxWidth: '88%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  borderRadius: '10px',
                  boxShadow: '0 0 40px rgba(0,0,0,0.9)'
                }}
              />
            </div>

            <div style={{
              position: 'absolute',
              bottom: '16px',
              background: 'rgba(15, 23, 42, 0.85)',
              padding: '6px 16px',
              borderRadius: '20px',
              border: '1px solid var(--border-glass)',
              color: '#94A3B8',
              fontSize: '0.8rem'
            }}>
              💡 <b>Tips:</b> Gunakan zoom untuk memeriksa ejaan email (@) dan digit nomor WhatsApp pada poster
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
