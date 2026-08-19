import React, { useState, useEffect } from 'react';
import { 
  Bot, Search, MapPin, Globe, Sparkles, Send, CheckCircle2, 
  ExternalLink, Mail, RefreshCw, AlertCircle, Filter, ArrowUpRight 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import LoadingOverlay from './LoadingOverlay';
import { useLanguage } from '../context/LanguageContext';

export default function AutoHunter({ profile, settings, onApplicationSent, onOpenSettings }) {
  const { t, lang } = useLanguage();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');

  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Load existing hunter jobs on mount
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/hunter/jobs');
      const data = await res.json();
      if (data.success && data.jobs) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error('Failed to load hunter jobs:', err);
    }
  };

  const handleStartCrawl = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch('/api/hunter/crawl', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ keyword, location })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal mencari lowongan pekerjaan');
      }

      setJobs(data.jobs);
      setSuccessMessage(`Berhasil menemukan ${data.total} lowongan kerja baru untuk kata kunci "${keyword}"!`);
      if (data.total > 0) {
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        } catch {}
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyJob = async (job) => {
    if (!settings.smtp_user || !settings.smtp_pass) {
      setErrorMessage('Konfigurasi Gmail SMTP belum lengkap. Silakan atur di menu Pengaturan.');
      if (onOpenSettings) onOpenSettings();
      return;
    }

    setApplyingJobId(job.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch(`/api/hunter/apply/${job.id}`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal mengirim lamaran kerja');
      }

      setAppliedJobs(prev => ({ ...prev, [job.id]: true }));
      setSuccessMessage(`Lamaran kerja berhasil dikirim ke ${job.company} (${job.contact_email})!`);
      try {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      } catch {}

      if (onApplicationSent) onApplicationSent();
      fetchJobs();
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setApplyingJobId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Hero Header */}
      <div className="glass-panel" style={{
        padding: '24px 32px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-cyan">AI Auto-Hunter</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {lang === 'id' ? 'Pencari Lowongan Otomatis' : 'Automated Job Search Engine'}
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '6px' }}>
            {lang === 'id' ? 'Jelajahi Lowongan Kerja di Internet & Lamar dalam 1-Klik' : 'Discover Jobs on the Web & Apply in 1-Click'}
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            {lang === 'id' 
              ? 'Bot akan mencari lowongan pekerjaan baru yang mencantumkan email rekrutmen, mencocokkan dengan kualifikasi CV Anda, dan mengirimkan email lamaran otomatis.'
              : 'Our crawler searches for fresh vacancies with direct recruitment contacts, calculates match scores against your CV, and prepares automated applications.'}
          </p>
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {lang === 'id' ? 'Pilihan Kata Kunci Cepat:' : 'Quick Keyword Suggestions:'}
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '380px' }}>
            {['Frontend Developer', 'Fullstack Engineer', 'Admin Staff', 'Graphic Designer', 'Data Analyst'].map(k => (
              <button
                key={k}
                onClick={() => setKeyword(k)}
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '4px 10px', borderRadius: '8px' }}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Filter Controls */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr auto', gap: '14px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              {lang === 'id' ? 'Posisi / Kata Kunci Pekerjaan:' : 'Job Position / Keyword:'}
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
              <input
                type="text"
                className="input-field"
                style={{ paddingLeft: '38px' }}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={lang === 'id' ? 'Contoh: React Developer, Marketing, Admin...' : 'e.g. React Developer, Marketing, Admin...'}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              {lang === 'id' ? 'Lokasi / Tipe Kerja:' : 'Location / Work Type:'}
            </label>
            <div style={{ position: 'relative' }}>
              <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
              <input
                type="text"
                className="input-field"
                style={{ paddingLeft: '38px' }}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Indonesia / Remote / Jakarta..."
              />
            </div>
          </div>

          <button
            onClick={handleStartCrawl}
            disabled={isLoading}
            className="btn-primary"
            style={{ padding: '11px 24px', height: '44px', fontWeight: 600 }}
          >
            {isLoading ? (
              <>
                <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                <span>{lang === 'id' ? 'Mencari Loker...' : 'Searching Vacancies...'}</span>
              </>
            ) : (
              <>
                <Bot size={18} />
                <span>{lang === 'id' ? 'Cari Loker Sekarang' : 'Find Vacancies Now'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {errorMessage && (
        <div style={{
          padding: '14px 20px',
          borderRadius: '12px',
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.35)',
          color: '#FDA4AF',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={18} color="#F43F5E" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div style={{
          padding: '14px 20px',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          color: '#34D399',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} color="#10B981" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Job Vacancy Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              {lang === 'id' ? `Daftar Lowongan Terverifikasi (${jobs.length})` : `Verified Job Opportunities (${jobs.length})`}
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {lang === 'id' 
                ? 'Terhubung ke Direktori LinkedIn, Dealls, Disnakerja, KarirJakarta, Karirhub, Toploker, Karirlink & API Global'
                : 'Connected to LinkedIn, Dealls, Disnakerja, KarirJakarta, Karirhub, Toploker, Karirlink & Global Career APIs'}
            </span>
          </div>
        </div>

        {isLoading ? (
          <LoadingOverlay 
            fullScreen={false} 
            message={lang === 'id' ? 'Auto-Hunter Sedang Memindai Lowongan...' : 'Auto-Hunter Scanning Vacancies...'}
            submessage={lang === 'id' ? 'Menjelajahi portal pekerjaan dan mencocokkan kualifikasi dengan AI...' : 'Scouring career networks and scoring matches with Groq AI...'}
          />
        ) : jobs.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bot size={48} style={{ opacity: 0.4, marginBottom: '12px', color: '#0EA5E9' }} />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '4px' }}>
              {lang === 'id' ? 'Belum ada loker yang dicari' : 'No jobs found yet'}
            </h3>
            <p style={{ fontSize: '0.88rem' }}>
              {lang === 'id' 
                ? 'Ketik kata kunci pekerjaan (misal: "Frontend", "Admin", "Designer") dan klik "Cari Loker Sekarang" di atas.'
                : 'Type a target job title (e.g. "Frontend", "Admin", "Designer") and click "Find Vacancies Now" above.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '18px' }}>
            {jobs.map((job) => {
              const isApplied = job.status === 'applied' || appliedJobs[job.id];
              const isApplying = applyingJobId === job.id;
              const hasEmail = Boolean(job.contact_email && job.contact_email.includes('@'));

              return (
                <div 
                  key={job.id} 
                  className="glass-panel" 
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    borderLeft: `4px solid ${job.match_score >= 85 ? '#10B981' : job.match_score >= 75 ? '#0EA5E9' : '#FBBF24'}`
                  }}
                >
                  <div>
                    {/* Top Meta */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                          {job.platform || job.source || 'Career Portal'}
                        </span>
                        {hasEmail ? (
                          <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                            {lang === 'id' ? 'Email Auto-Send' : 'Direct Email'}
                          </span>
                        ) : (
                          <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
                            {lang === 'id' ? 'Portal Resmi' : 'Official Portal'}
                          </span>
                        )}
                      </div>

                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: job.match_score >= 85 ? '#34D399' : '#38BDF8',
                        background: 'rgba(15, 23, 42, 0.8)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        {job.match_score || 75}% {lang === 'id' ? 'Cocok' : 'Match'}
                      </span>
                    </div>

                    {/* Title & Company */}
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px', color: '#F8FAFC' }}>
                      {job.title}
                    </h3>
                    <div style={{ fontSize: '0.88rem', color: '#94A3B8', fontWeight: 500, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{job.company}</span>
                      <span>•</span>
                      <span style={{ color: '#64748B' }}>{job.location}</span>
                    </div>

                    {/* Email Contact or Direct Link Indicator */}
                    {hasEmail ? (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        color: '#38BDF8',
                        marginBottom: '10px'
                      }}>
                        <Mail size={13} />
                        <span>{job.contact_email}</span>
                      </div>
                    ) : (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        color: '#A5B4FC',
                        marginBottom: '10px'
                      }}>
                        <ExternalLink size={13} />
                        <span>{lang === 'id' ? `Tersedia di ${job.platform || 'Portal Karir'}` : `Available on ${job.platform || 'Career Board'}`}</span>
                      </div>
                    )}

                    {/* Requirements / Skill Tags */}
                    {job.requirements && job.requirements.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                        {job.requirements.slice(0, 4).map((req, rIdx) => (
                          <span key={rIdx} style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: '5px', background: 'rgba(255, 255, 255, 0.05)', color: '#94A3B8' }}>
                            {req}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Snippet */}
                    <p style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-muted)',
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      margin: 0
                    }}>
                      {job.description}
                    </p>
                  </div>

                  {/* Actions: Direct Link or 1-Click Email */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--border-glass)' }}>
                    {hasEmail ? (
                      <button
                        onClick={() => handleApplyJob(job)}
                        disabled={isApplied || isApplying}
                        className={isApplied ? "btn-secondary" : "btn-primary"}
                        style={{
                          flex: 1,
                          padding: '9px 14px',
                          fontSize: '0.88rem',
                          background: isApplied ? 'rgba(16, 185, 129, 0.15)' : undefined,
                          color: isApplied ? '#34D399' : undefined,
                          borderColor: isApplied ? 'rgba(16, 185, 129, 0.3)' : undefined
                        }}
                      >
                        {isApplying ? (
                          <>
                            <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                            <span>{lang === 'id' ? 'Mengirim Lamaran...' : 'Sending Application...'}</span>
                          </>
                        ) : isApplied ? (
                          <>
                            <CheckCircle2 size={15} color="#10B981" />
                            <span>{lang === 'id' ? 'Sudah Terkirim' : 'Application Sent'}</span>
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            <span>{lang === 'id' ? 'Kirim CV via Gmail' : 'Send CV via Gmail'}</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <a
                        href={job.job_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary"
                        style={{
                          flex: 1,
                          padding: '9px 14px',
                          fontSize: '0.88rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          textDecoration: 'none',
                          color: '#fff',
                          background: 'linear-gradient(135deg, #0284C7, #4F46E5)'
                        }}
                      >
                        <span>{lang === 'id' ? `Lamar di ${job.platform || 'Portal Resmi'}` : `Apply on ${job.platform || 'Official Portal'}`}</span>
                        <ExternalLink size={14} />
                      </a>
                    )}


                    {job.job_url && hasEmail && (
                      <a
                        href={job.job_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary"
                        style={{ padding: '9px 12px', borderRadius: '10px' }}
                        title="Buka Website Resmi Lowongan"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
