import React, { useState, useRef, useEffect } from 'react';
import { 
  User, FileText, Sparkles, UploadCloud, CheckCircle2, 
  Plus, X, Briefcase, GraduationCap, Link as LinkIcon, Save, RefreshCw, AlertCircle, Code, Compass, ArrowRight, Target, Zap, Building2, Code2, Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import ProjectPitchModal from './ProjectPitchModal';
import CareerRoadmapModal from './CareerRoadmapModal';
import CoverLetterModal from './CoverLetterModal';
import CompanyIntelligenceModal from './CompanyIntelligenceModal';
import LiveCodeModal from './LiveCodeModal';
import { useLanguage } from '../context/LanguageContext';
import { toFormProfile, buildProfilePayload } from '../utils/profileForm';

export default function ProfileManager({ profile, onProfileUpdated }) {
  const { t, lang } = useLanguage();
  const [formData, setFormData] = useState(() => toFormProfile(profile));
  const hydratedProfileId = useRef(null);

  useEffect(() => {
    if (!profile?.id) return;
    if (hydratedProfileId.current === profile.id) return;
    hydratedProfileId.current = profile.id;
    setFormData(toFormProfile(profile));
  }, [profile]);

  const [newSkill, setNewSkill] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [isDeletingCv, setIsDeletingCv] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Modals state
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false);
  const [showCompanySpyModal, setShowCompanySpyModal] = useState(false);
  const [showLiveCodeModal, setShowLiveCodeModal] = useState(false);

  const fileInputRef = useRef(null);
  const hasCvFile = Boolean(formData.cv_filename || formData.cv_path);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    const skills = formData.skills || [];
    if (!skills.includes(newSkill.trim())) {
      setFormData(prev => ({ ...prev, skills: [...skills, newSkill.trim()] }));
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: (prev.skills || []).filter(s => s !== skillToRemove)
    }));
  };

  // Upload CV PDF
  const handleUploadCv = async (file) => {
    if (!file) return;
    if (hasCvFile) {
      setErrorMessage(lang === 'id'
        ? 'Hapus CV lama dulu sebelum mengunggah yang baru.'
        : 'Delete the current CV before uploading a new one.');
      return;
    }

    setIsUploadingCv(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const uploadFormData = new FormData();
    uploadFormData.append('cv_file', file);

    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch('/api/profile/upload-cv', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: uploadFormData
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal mengunggah berkas CV');
      }

      setFormData((prev) => toFormProfile({
        ...data.profile,
        full_name: prev.full_name,
        email: prev.email,
        phone: prev.phone,
        headline: prev.headline,
        skills: prev.skills,
        city: prev.city,
        summary: prev.summary,
        linkedin_url: prev.linkedin_url,
        portfolio_url: prev.portfolio_url
      }));
      setSuccessMessage(`Berkas CV "${file.name}" berhasil diunggah & teks berhasil diekstrak!`);
      if (onProfileUpdated) onProfileUpdated(data.profile);
      try {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      } catch {}
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setIsUploadingCv(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteCv = async () => {
    const confirmed = window.confirm(
      lang === 'id'
        ? 'Hapus CV dari server? Unggah yang baru hanya setelah file ini dihapus.'
        : 'Delete the CV from the server? You can upload a new file only after this one is removed.'
    );
    if (!confirmed) return;

    setIsDeletingCv(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch('/api/profile/cv', {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || (lang === 'id' ? 'Gagal menghapus CV' : 'Failed to delete CV'));
      }
      setFormData((prev) => toFormProfile({
        ...data.profile,
        full_name: prev.full_name,
        email: prev.email,
        phone: prev.phone,
        headline: prev.headline,
        skills: prev.skills,
        city: prev.city,
        summary: prev.summary,
        linkedin_url: prev.linkedin_url,
        portfolio_url: prev.portfolio_url
      }));
      setSuccessMessage(lang === 'id' ? 'CV dihapus. Sekarang bisa unggah file baru.' : 'CV deleted. You can upload a new file now.');
      if (onProfileUpdated) onProfileUpdated(data.profile);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setIsDeletingCv(false);
    }
  };

  // Optimize Summary with Groq AI
  const handleOptimizeProfile = async () => {
    setIsOptimizing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch('/api/profile/optimize', { 
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal mengoptimalkan profil');
      }

      if (data.suggestions) {
        setFormData(prev => ({
          ...prev,
          headline: data.suggestions.optimized_headline || prev.headline,
          summary: data.suggestions.optimized_summary || prev.summary
        }));
        setSuccessMessage('Headline & Ringkasan Karir berhasil dioptimalkan oleh Groq AI!');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Save Full Profile
  const handleSaveProfile = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem('lamarkerja_token');
      const payload = buildProfilePayload(formData);
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal menyimpan profil');
      }

      const saved = toFormProfile({ ...formData, ...data.profile });
      setFormData(saved);
      setSuccessMessage('Profil & Berkas CV berhasil disimpan!');
      if (onProfileUpdated) onProfileUpdated(data.profile);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Top Banner */}
      <div className="glass-panel page-hero" style={{
        padding: '24px 32px',
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-cyan">{lang === 'id' ? 'Profil Pelamar' : 'Applicant Profile'}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {lang === 'id' ? 'Otomatis Terlampir di Setiap Email' : 'Auto-Attached in Every Application'}
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '6px' }}>
            {lang === 'id' ? 'Profil Kandidat & Berkas Lampiran CV' : 'Candidate Profile & CV Resume Attachment'}
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            {lang === 'id' 
              ? 'Lengkapi data diri dan unggah file PDF CV Anda. Data ini digunakan oleh AI untuk menghitung kecocokan loker dan otomatis dilampirkan saat mengirim lamaran.'
              : 'Complete your profile and upload your resume PDF. This data is used by AI to compute match scores and attach to outgoing job applications.'}
          </p>
        </div>

        <button
          onClick={handleOptimizeProfile}
          disabled={isOptimizing}
          className="btn-secondary"
          style={{ padding: '10px 18px', fontWeight: 600, border: '1px solid rgba(56, 189, 248, 0.3)' }}
        >
          {isOptimizing ? (
            <RefreshCw size={16} color="#38BDF8" style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Sparkles size={16} color="#38BDF8" />
          )}
          <span>{isOptimizing ? (lang === 'id' ? 'Mengoptimalkan via AI...' : 'Optimizing with AI...') : (lang === 'id' ? 'Optimalkan Profil via AI' : 'Optimize Profile with AI')}</span>
        </button>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div style={{ padding: '14px 20px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.35)', color: '#FDA4AF', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={18} color="#F43F5E" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div style={{ padding: '14px 20px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#34D399', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} color="#10B981" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* AI Career Booster & Project Pitch Tools */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
        gap: '16px'
      }}>
        {/* Card 1: Pitch Proyek */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(15, 23, 42, 0.85))',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '14px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Code size={18} color="#C084FC" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#F8FAFC' }}>AI GitHub & Project Pitch</h3>
                <span style={{ fontSize: '0.72rem', color: '#C084FC', fontWeight: 600 }}>
                  {lang === 'id' ? 'Storytelling Teknis Portofolio' : 'Technical Portfolio Storytelling'}
                </span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {lang === 'id'
                ? 'Ubah proyek GitHub Anda menjadi 30s elevator pitch, arsitektur teknis, dan STAR story untuk memukau Lead Engineer saat wawancara.'
                : 'Turn your GitHub projects into 30s elevator pitches, technical architecture summaries, and STAR stories to impress interviewers.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowPitchModal(true)}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.82rem', justifyContent: 'center', borderColor: 'rgba(168, 85, 247, 0.4)', color: '#E9D5FF' }}
          >
            <Sparkles size={14} color="#C084FC" />
            <span>{lang === 'id' ? 'Buka Generator Pitch Proyek' : 'Launch Project Pitch Generator'}</span>
          </button>
        </div>

        {/* Card 2: Roadmap Karir */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(15, 23, 42, 0.85))',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '14px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Compass size={18} color="#34D399" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#F8FAFC' }}>AI Career Roadmap & Skill Gap</h3>
                <span style={{ fontSize: '0.72rem', color: '#34D399', fontWeight: 600 }}>
                  {lang === 'id' ? 'Analisis loker aktif di hub' : 'Benchmark active hub vacancies'}
                </span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {lang === 'id'
                ? 'Bandingkan profil Anda dengan seluruh database lowongan kerja aktif dan temukan skill yang perlu dipelajari untuk kenaikan gaji.'
                : 'Compare your profile against active job openings and discover the most valued skills needed for career progression.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowRoadmapModal(true)}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.82rem', justifyContent: 'center', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#A7F3D0' }}
          >
            <Target size={14} color="#34D399" />
            <span>{lang === 'id' ? 'Lihat Analisis Roadmap Karir' : 'View Career Roadmap'}</span>
          </button>
        </div>

        {/* Card 3: AI Official Cover Letter Builder */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(15, 23, 42, 0.85))',
          border: '1px solid rgba(14, 165, 233, 0.35)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '14px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={18} color="#38BDF8" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#F8FAFC' }}>AI Cover Letter Builder</h3>
                <span style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 600 }}>
                  {lang === 'id' ? 'Format Baku Resmi & Cetak PDF' : 'Formal Standards & PDF Export'}
                </span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {lang === 'id'
                ? 'Buat Surat Lamaran Kerja resmi dan persuasif untuk perusahaan target dalam Bahasa Indonesia atau English secara instan.'
                : 'Generate tailored, persuasive cover letters formatted for corporate standards in Indonesian or English.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCoverLetterModal(true)}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.82rem', justifyContent: 'center', borderColor: 'rgba(14, 165, 233, 0.4)', color: '#BAE6FD' }}
          >
            <FileText size={14} color="#38BDF8" />
            <span>{lang === 'id' ? 'Buat Surat Lamaran Resmi' : 'Generate Cover Letter'}</span>
          </button>
        </div>

        {/* Card 4: AI Company Intelligence & Spy */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12), rgba(15, 23, 42, 0.85))',
          border: '1px solid rgba(236, 72, 153, 0.35)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '14px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(236, 72, 153, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={18} color="#F472B6" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#F8FAFC' }}>AI Company Intelligence</h3>
                <span style={{ fontSize: '0.72rem', color: '#F472B6', fontWeight: 600 }}>
                  {lang === 'id' ? 'Mata-Mata & Kisi-Kisi Interview' : 'Company Intel & Cheat Sheet'}
                </span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {lang === 'id'
                ? 'Bongkar model bisnis, budaya kerja, dan trik memikat interviewer di perusahaan impian Anda sebelum hari wawancara.'
                : 'Explore business models, corporate culture, and strategic tips to impress interviewers before interview day.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCompanySpyModal(true)}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.82rem', justifyContent: 'center', borderColor: 'rgba(236, 72, 153, 0.4)', color: '#FBCFE8' }}
          >
            <Building2 size={14} color="#F472B6" />
            <span>{lang === 'id' ? 'Bongkar Profil Perusahaan' : 'Explore Company Intel'}</span>
          </button>
        </div>

        {/* Card 5: AI Live Technical Code Arena */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(15, 23, 42, 0.85))',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '14px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Code2 size={18} color="#FBBF24" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#F8FAFC' }}>Live Technical Code Arena</h3>
                <span style={{ fontSize: '0.72rem', color: '#FBBF24', fontWeight: 600 }}>
                  {lang === 'id' ? 'Tes Koding & Eksekusi Browser' : 'Live Coding Runner & Evaluation'}
                </span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {lang === 'id'
                ? 'Uji kemampuan algoritma, JavaScript, dan backend Anda dengan live runner serta review sekelas Senior Principal Engineer.'
                : 'Solve real-world algorithm, frontend, and backend challenges with in-browser runner and AI code review.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowLiveCodeModal(true)}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.82rem', justifyContent: 'center', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#FDE68A' }}
          >
            <Code2 size={14} color="#FBBF24" />
            <span>{lang === 'id' ? 'Mulai Simulasi Live Coding' : 'Start Code Test Simulator'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Upload CV File & Profile Form */}
      <div className="stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '24px' }}>
        
        {/* Left Column: Upload CV & Attachments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* CV Upload Box */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#38BDF8" />
              {lang === 'id' ? 'Berkas PDF CV Utama' : 'Main Resume / CV PDF'}
            </h2>

            <div
              onClick={() => {
                if (hasCvFile || isUploadingCv || isDeletingCv) return;
                fileInputRef.current?.click();
              }}
              style={{
                border: '2px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                cursor: (hasCvFile || isUploadingCv || isDeletingCv) ? 'not-allowed' : 'pointer',
                background: isUploadingCv ? 'rgba(56, 189, 248, 0.08)' : 'rgba(15, 23, 42, 0.4)',
                opacity: hasCvFile ? 0.55 : 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              {isUploadingCv ? (
                <RefreshCw size={30} style={{ animation: 'spin 1s linear infinite', color: '#38BDF8' }} />
              ) : (
                <UploadCloud size={32} color="#38BDF8" />
              )}
              <div>
                <p style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: '2px' }}>
                  {isUploadingCv 
                    ? (lang === 'id' ? 'Sedang Mengunggah & Membaca CV...' : 'Uploading & Extracting CV...') 
                    : hasCvFile
                      ? (lang === 'id' ? 'Hapus CV lama dulu untuk unggah yang baru' : 'Delete the current CV to upload a new one')
                      : (lang === 'id' ? 'Klik untuk Unggah PDF CV' : 'Click to Upload Resume PDF')}
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {lang === 'id' ? 'Satu file di server. Format PDF / DOC (Maks 15MB)' : 'One file on the server. PDF / DOC (Max 15MB)'}
                </p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="application/pdf,image/*"
                onChange={(e) => e.target.files?.[0] && handleUploadCv(e.target.files[0])}
              />
            </div>

            {formData.cv_filename && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-glass)',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', minWidth: 0 }}>
                  <FileText size={18} color="#34D399" />
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{formData.cv_filename}</div>
                    <div style={{ fontSize: '0.72rem', color: '#34D399' }}>
                      {lang === 'id' ? 'Siap dilampirkan otomatis' : 'Ready for auto-attachment'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteCv}
                  disabled={isDeletingCv}
                  className="btn-secondary"
                  style={{
                    flexShrink: 0,
                    fontSize: '0.72rem',
                    padding: '6px 10px',
                    gap: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    borderColor: 'rgba(248, 113, 113, 0.4)',
                    color: '#FCA5A5'
                  }}
                >
                  {isDeletingCv ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={13} />}
                  {lang === 'id' ? 'Hapus CV' : 'Delete CV'}
                </button>
              </div>
            )}
          </div>

          {/* Skills Tag Management */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#818CF8" />
              {lang === 'id' ? 'Keahlian & Kemampuan (Skills)' : 'Core Skills & Competencies'}
            </h2>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="input-field"
                placeholder={lang === 'id' ? 'Tambah skill (misal: React, Node.js)...' : 'Add skill (e.g. React, Node.js)...'}
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
              />
              <button onClick={handleAddSkill} className="btn-secondary" style={{ padding: '0 14px' }}>
                <Plus size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {(formData.skills || []).map((skill) => (
                <span
                  key={skill}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38BDF8',
                    fontSize: '0.82rem',
                    fontWeight: 600
                  }}
                >
                  {skill}
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex' }}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Personal Data & Form */}
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={20} color="#0EA5E9" />
            {lang === 'id' ? 'Data Informasi Diri' : 'Personal & Contact Details'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                {lang === 'id' ? 'Nama Lengkap Pelamar:' : 'Full Applicant Name:'}
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.full_name || ''}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder={lang === 'id' ? 'Contoh: Nama Lengkap Anda' : 'e.g. Your Full Name'}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                {lang === 'id' ? 'Nomor HP / WhatsApp:' : 'Phone / WhatsApp Number:'}
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder={lang === 'id' ? 'Contoh: 0812-xxxx-xxxx' : 'e.g. 0812-xxxx-xxxx'}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                {lang === 'id' ? 'Email Pribadi:' : 'Personal Email Address:'}
              </label>
              <input
                type="email"
                className="input-field"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@anda.com"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                {lang === 'id' ? 'Domisili / Kota:' : 'City / Location:'}
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Jakarta / Bandung / Yogyakarta..."
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                {lang === 'id' ? 'Headline / Profesi:' : 'Professional Headline:'}
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.headline || ''}
                onChange={(e) => handleChange('headline', e.target.value)}
                placeholder={lang === 'id' ? 'Contoh: Frontend Developer / IT Specialist' : 'e.g. Frontend Developer / IT Specialist'}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                {lang === 'id' ? 'Ringkasan Karir & Pengalaman (Professional Summary):' : 'Professional Summary & Background:'}
              </label>
              <textarea
                className="input-field"
                rows={5}
                value={formData.summary || ''}
                onChange={(e) => handleChange('summary', e.target.value)}
                placeholder={lang === 'id' ? 'Tuliskan pengalaman kerja singkat, keunggulan Anda, dan pencapaian...' : 'Summarize your career highlights, strengths, and key achievements...'}
                style={{ resize: 'vertical', lineHeight: '1.6' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                {lang === 'id' ? 'Link LinkedIn:' : 'LinkedIn URL:'}
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.linkedin_url || ''}
                onChange={(e) => handleChange('linkedin_url', e.target.value)}
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                {lang === 'id' ? 'Link Portofolio / GitHub:' : 'Portfolio / GitHub URL:'}
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.portfolio_url || ''}
                onChange={(e) => handleChange('portfolio_url', e.target.value)}
                placeholder="https://github.com/username"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="btn-primary"
              style={{ padding: '12px 28px', fontSize: '1rem' }}
            >
              <Save size={18} />
              <span>{isSaving ? (lang === 'id' ? 'Menyimpan...' : 'Saving...') : (lang === 'id' ? 'Simpan Perubahan Profil' : 'Save Profile Changes')}</span>
            </button>
          </div>
        </div>


      </div>

      {/* MODALS */}
      <ProjectPitchModal
        isOpen={showPitchModal}
        onClose={() => setShowPitchModal(false)}
        defaultProject={{
          name: formData.headline || '',
          techStack: (formData.skills || []).slice(0, 6).join(', '),
          description: formData.summary || '',
          githubUrl: formData.portfolio_url || formData.github_url || ''
        }}
      />

      <CareerRoadmapModal
        isOpen={showRoadmapModal}
        onClose={() => setShowRoadmapModal(false)}
        profile={formData}
      />

      <CoverLetterModal
        isOpen={showCoverLetterModal}
        onClose={() => setShowCoverLetterModal(false)}
        defaultCompany=""
        defaultPosition={formData.headline || ''}
        defaultRequirements={formData.skills || []}
        profile={formData}
      />

      <CompanyIntelligenceModal
        isOpen={showCompanySpyModal}
        onClose={() => setShowCompanySpyModal(false)}
        defaultCompany=""
        defaultPosition={formData.headline || ''}
        defaultIndustry=""
      />

      <LiveCodeModal
        isOpen={showLiveCodeModal}
        onClose={() => setShowLiveCodeModal(false)}
        jobDetails={{
          position: formData.headline || '',
          company_name: '',
          requirements: formData.skills || []
        }}
        profile={formData}
      />

    </div>
  );
}
