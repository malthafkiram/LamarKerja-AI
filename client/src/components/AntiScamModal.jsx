import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, X, RefreshCw, Lock, ExternalLink } from 'lucide-react';

export default function AntiScamModal({ isOpen, onClose, jobDetails, rawText }) {
  const [isLoading, setIsLoading] = useState(true);
  const [audit, setAudit] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    runAudit();
  }, [isOpen, jobDetails, rawText]);

  const runAudit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch('/api/antiscam/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          jobText: rawText || (jobDetails?.requirements || []).join(' ') || '',
          email: jobDetails?.recipient_email || '',
          company: jobDetails?.company_name || ''
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal memverifikasi keaslian lowongan');
      }

      setAudit(data.audit);
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
      zIndex: 110,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '680px',
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
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldAlert size={22} color="#EF4444" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Anti-Scam Shield & Verifikasi Loker</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Analisis keamanan lowongan <b>{jobDetails?.company_name || 'Perusahaan'}</b>
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '10px', color: 'var(--text-muted)' }}>
            <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', color: '#EF4444' }} />
            <span>Memindai indikator penipuan tiket travel, domain email, dan biaya rekrutmen...</span>
          </div>
        ) : (
          audit && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Verdict Banner */}
              <div style={{
                padding: '18px 20px',
                borderRadius: '14px',
                background: audit.is_safe ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.15)',
                border: audit.is_safe ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}>
                {audit.is_safe ? (
                  <ShieldCheck size={36} color="#10B981" style={{ flexShrink: 0 }} />
                ) : (
                  <AlertTriangle size={36} color="#EF4444" style={{ flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: audit.is_safe ? '#34D399' : '#F87171' }}>
                    Status Keamanan: {audit.risk_level}
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    {audit.safety_verdict}
                  </p>
                </div>
              </div>

              {/* Red Flags List if Any */}
              {audit.detected_red_flags && audit.detected_red_flags.length > 0 && (
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontWeight: 700, color: '#F87171', fontSize: '0.86rem', marginBottom: '8px' }}>
                    ⚠️ Peringatan Indikator Terdeteksi:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: '#FDA4AF', fontSize: '0.82rem' }}>
                    {audit.detected_red_flags.map((flag, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Standard Safe Recruitment Guidelines */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '0.84rem',
                lineHeight: '1.6'
              }}>
                <div style={{ fontWeight: 700, color: '#38BDF8', marginBottom: '6px' }}>
                  🛡️ Panduan Aman Melamar Kerja:
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-muted)' }}>
                  <li>Perusahaan resmi <b>TIDAK PERNAH</b> memungut biaya tes, tiket pesawat, atau akomodasi hotel.</li>
                  <li>Waspadai undangan tes yang mewajibkan transfer ke agen travel tertentu dengan janji <i>reimbursement</i>.</li>
                  <li>Perusahaan BUMN dan korporasi selalu menggunakan email domain resmi (contoh: <code>@telkom.co.id</code>, <code>@pertamina.com</code>, bukan <code>@gmail.com</code>).</li>
                </ul>
              </div>

            </div>
          )
        )}

      </div>
    </div>
  );
}
