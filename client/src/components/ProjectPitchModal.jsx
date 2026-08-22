import React, { useState } from 'react';
import { 
  GitBranch, Code, Sparkles, Copy, Check, ExternalLink, 
  MessageSquare, Star, RefreshCw, X, Layers, Target, CheckCircle2 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ProjectPitchModal({ isOpen, onClose, defaultProject = null }) {
  const [projectName, setProjectName] = useState(defaultProject?.name || '');
  const [techStack, setTechStack] = useState(defaultProject?.techStack || '');
  const [description, setDescription] = useState(defaultProject?.description || '');
  const [githubUrl, setGithubUrl] = useState(defaultProject?.githubUrl || '');
  const [targetRole, setTargetRole] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [pitchData, setPitchData] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [error, setError] = useState(null);

  const handleGeneratePitch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch('/api/project/pitch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ projectName, techStack, description, githubUrl, targetRole })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal menghasilkan pitch proyek');
      }

      setPitchData(data.pitch);
      try {
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
      } catch {}
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 115,
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
        border: '1px solid var(--border-glass)',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(168, 85, 247, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Code size={22} color="#A855F7" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>AI GitHub & Project Pitch Generator</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Ubah repositori proyek Anda menjadi storytelling teknis memukau untuk sesi wawancara
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.3rem' }}
          >
            ✕
          </button>
        </div>

        {/* Inputs */}
        <div className="stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Nama Proyek:
            </label>
            <input
              type="text"
              className="input-field"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Nama Proyek / Aplikasi"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Target Posisi yang Dilamar:
            </label>
            <input
              type="text"
              className="input-field"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Contoh: Software Engineer / Fullstack Dev"
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Tech Stack yang Digunakan:
            </label>
            <input
              type="text"
              className="input-field"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="Contoh: React.js, Node.js, Express, MongoDB Atlas, Docker"
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Deskripsi Singkat / Fitur Utama:
            </label>
            <textarea
              className="input-field"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan apa fungsi proyek ini dan masalah apa yang diselesaikannya..."
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleGeneratePitch}
            disabled={isLoading}
            className="btn-primary"
            style={{ padding: '10px 24px', fontSize: '0.9rem' }}
          >
            <Sparkles size={16} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isLoading ? 'Menyusun Technical Story...' : '✨ Generate Technical Pitch'}</span>
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.35)', color: '#FDA4AF', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {pitchData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* 1. Elevator Pitch Box (30s) */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(15, 23, 42, 0.8))',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              borderRadius: '14px',
              padding: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, color: '#C084FC', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={16} /> 1. 30-Second Elevator Pitch (Kalimat Pembuka di Interview):
                </span>
                <button
                  onClick={() => handleCopyText(pitchData.elevator_pitch_30s, 'pitch')}
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  {copiedKey === 'pitch' ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                  <span>{copiedKey === 'pitch' ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#F1F5F9', lineHeight: '1.6' }}>
                "{pitchData.elevator_pitch_30s}"
              </p>
            </div>

            {/* 2. STAR Method Storytelling */}
            {pitchData.star_story && (
              <div style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid var(--border-glass)', borderRadius: '14px', padding: '18px' }}>
                <div style={{ fontWeight: 700, color: '#38BDF8', fontSize: '0.92rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Target size={16} /> 2. STAR Method Story (Jawaban saat Ditanya Kendala Proyek):
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px' }}>
                    <b style={{ color: '#FBBF24' }}>📍 S - Situation (Konteks):</b>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>{pitchData.star_story.situation}</p>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px' }}>
                    <b style={{ color: '#60A5FA' }}>🎯 T - Task (Tantangan):</b>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>{pitchData.star_story.task}</p>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px' }}>
                    <b style={{ color: '#34D399' }}>⚙️ A - Action (Langkah Anda):</b>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>{pitchData.star_story.action}</p>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px' }}>
                    <b style={{ color: '#F43F5E' }}>🏆 R - Result (Hasil Nyata):</b>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>{pitchData.star_story.result}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Anticipated Interviewer Questions */}
            {pitchData.anticipated_interview_questions && (
              <div style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid var(--border-glass)', borderRadius: '14px', padding: '18px' }}>
                <div style={{ fontWeight: 700, color: '#FDE68A', fontSize: '0.92rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={16} /> 3. Prediksi Pertanyaan Lead Engineer & Jawaban Taktis:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {pitchData.anticipated_interview_questions.map((q, idx) => (
                    <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px', fontSize: '0.82rem' }}>
                      <div style={{ fontWeight: 700, color: '#F8FAFC', marginBottom: '4px' }}>
                        ❓ "{q.question}"
                      </div>
                      <div style={{ color: '#94A3B8', lineHeight: '1.5' }}>
                        💡 <b>Jawaban Rekomendasi:</b> {q.suggested_answer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
