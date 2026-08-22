import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Compass, Award, BookOpen, CheckCircle2, 
  ArrowRight, DollarSign, Target, Sparkles, RefreshCw, X, Zap, ShieldAlert 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CareerRoadmapModal({ isOpen, onClose, profile }) {
  const [isLoading, setIsLoading] = useState(true);
  const [roadmap, setRoadmap] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchRoadmap();
  }, [isOpen]);

  const fetchRoadmap = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch('/api/career/roadmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal menyusun roadmap karir');
      }

      setRoadmap(data.roadmap);
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
        maxWidth: '900px',
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
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Compass size={22} color="#10B981" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>AI Career Roadmap & Skill Gap Analyzer</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Analisis perbandingan profil Anda terhadap 240+ loker aktif & proyeksi kenaikan gaji
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

        {error && (
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.35)', color: '#FDA4AF', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '12px', color: 'var(--text-muted)' }}>
            <RefreshCw size={26} style={{ animation: 'spin 1s linear infinite', color: '#10B981' }} />
            <span>Membandingkan profil Anda dengan seluruh database lowongan kerja...</span>
          </div>
        ) : (
          roadmap && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Market Fit & Salary Projection Banner */}
              <div className="stack-mobile" style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr 1fr',
                gap: '12px',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(6, 78, 59, 0.25))',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '16px',
                padding: '20px'
              }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Kesesuaian dengan Pasar:</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34D399' }}>{roadmap.market_fit_score}%</span>
                    <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>Tinggi</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px' }}>
                    {roadmap.current_level} ➔ <b>{roadmap.target_level}</b>
                  </div>
                </div>

                <div style={{ borderLeft: '1px solid var(--border-glass)', paddingLeft: '16px' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Gaji Saat Ini:</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#94A3B8', marginTop: '4px' }}>
                    {roadmap.current_salary_range}
                  </div>
                </div>

                <div style={{ borderLeft: '1px solid var(--border-glass)', paddingLeft: '16px' }}>
                  <div style={{ fontSize: '0.78rem', color: '#34D399', fontWeight: 700 }}>Target Gaji Setelah Roadmap:</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34D399', marginTop: '4px' }}>
                    {roadmap.projected_salary_range} 🔥
                  </div>
                </div>
              </div>

              {/* Top Missing Skills (Demand vs Gap) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#FDE68A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={16} /> Skill yang Paling Dibutuhkan & Perlu Dipelajari:
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: '10px' }}>
                  {(roadmap.top_missing_skills || []).map((sk, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '12px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#F8FAFC' }}>{sk.skill}</span>
                        <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>{sk.demand_level}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        {sk.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Learning Phases */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Target size={16} /> Roadmap Langkah Belajar (Step-by-Step):
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(roadmap.roadmap_phases || []).map((phase, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '12px',
                      padding: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.88rem', color: '#38BDF8', marginBottom: '6px' }}>
                        <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0284C7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>{idx + 1}</span>
                        <span>{phase.phase}</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#F8FAFC', marginBottom: '8px' }}>
                        <b>Fokus:</b> {phase.goal}
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {(phase.action_items || []).map((item, aIdx) => (
                          <li key={aIdx} style={{ marginBottom: '3px' }}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Free Resources & Strategic Advice */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '0.84rem',
                lineHeight: '1.6'
              }}>
                <div style={{ fontWeight: 700, color: '#34D399', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={16} /> Rekomendasi Sumber Belajar Gratis:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  {(roadmap.recommended_free_resources || []).map((res, idx) => (
                    <span key={idx} style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem' }}>
                      📚 <b>{res.title}</b> ({res.platform})
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8', borderTop: '1px solid var(--border-glass)', paddingTop: '8px' }}>
                  💡 <b>Pesan Mentor:</b> {roadmap.strategic_advice}
                </div>
              </div>

            </div>
          )
        )}

      </div>
    </div>
  );
}
