import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, HelpCircle, CheckCircle2, MessageSquare, RefreshCw, X, ShieldAlert, Sparkles } from 'lucide-react';

export default function SalaryInsightModal({ isOpen, onClose, defaultPosition, defaultLocation }) {
  if (!isOpen) return null;

  const [position, setPosition] = useState(defaultPosition || '');
  const [location, setLocation] = useState(defaultLocation || '');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [insight, setInsight] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (defaultPosition) fetchInsight();
  }, []);

  const fetchInsight = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch('/api/salary/insight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ position, location, experienceLevel })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal memuat riset gaji');
      }

      setInsight(data.insight);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 110,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '780px',
        maxHeight: '90vh',
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
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DollarSign size={22} color="#10B981" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Salary Insight & Negosiasi Gaji Indonesia</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Riset standar pasar gaji industri & skrip taktis menjawab HRD</p>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Posisi Pekerjaan:
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
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Lokasi Kerja:
            </label>
            <input
              type="text"
              className="input-field"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Jakarta / WFH"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Level:
            </label>
            <select
              className="input-field"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
            >
              <option value="">Pilih level...</option>
              <option value="Fresh Graduate (0-1 Tahun)">Fresh Graduate (0-1 Thn)</option>
              <option value="1-3 Tahun (Junior - Mid)">1-3 Tahun (Junior/Mid)</option>
              <option value="3-6 Tahun (Senior)">3-6 Tahun (Senior)</option>
              <option value="Lead / Manager (6+ Tahun)">Lead / Manager (6+ Thn)</option>
            </select>
          </div>

          <button
            onClick={fetchInsight}
            disabled={isLoading}
            className="btn-primary"
            style={{ height: '42px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={15} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isLoading ? 'Riset...' : 'Hitung'}</span>
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.35)', color: '#FDA4AF', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {insight && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Salary Gauge Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '12px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-glass)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Batas Minimum (Entry)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#94A3B8' }}>{insight.salary_min}</div>
              </div>

              <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.78rem', color: '#34D399', fontWeight: 700, marginBottom: '4px' }}>Rata-rata Pasar (Median) 🔥</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#34D399' }}>{insight.salary_median}</div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-glass)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Batas Tertinggi (Top Tier)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38BDF8' }}>{insight.salary_max}</div>
              </div>
            </div>

            {/* Negotiation Scripts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FDE68A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={16} /> Skrip Taktis Menjawab Pertanyaan Gaji:
              </h3>

              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '14px', fontSize: '0.84rem', lineHeight: '1.6' }}>
                <div style={{ fontWeight: 700, color: '#38BDF8', marginBottom: '4px' }}>
                  1. Saat ditanya: "Berapa ekspektasi gaji yang Anda inginkan?"
                </div>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                  "{insight.negotiation_scripts?.when_asked_expectation}"
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '14px', fontSize: '0.84rem', lineHeight: '1.6' }}>
                <div style={{ fontWeight: 700, color: '#F59E0B', marginBottom: '4px' }}>
                  2. Jika penawaran HRD di bawah ekspektasi Anda:
                </div>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                  "{insight.negotiation_scripts?.when_offered_below_expectation}"
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '14px', fontSize: '0.84rem', lineHeight: '1.6' }}>
                <div style={{ fontWeight: 700, color: '#34D399', marginBottom: '4px' }}>
                  3. Opsi negosiasi benefit & tunjangan tambahan:
                </div>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                  "{insight.negotiation_scripts?.benefit_counter_offer}"
                </p>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
