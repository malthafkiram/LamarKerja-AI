import React, { useState, useEffect } from 'react';
import { Mail, Clock, Send, CheckCircle2, AlertCircle, Sparkles, RefreshCw, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function FollowUpModal({ isOpen, onClose, application, onFollowUpSent }) {
  if (!isOpen || !application) return null;

  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [draft, setDraft] = useState({ subject: '', body: '', body_html: '' });
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    fetchDraft();
  }, [application]);

  const fetchDraft = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch(`/api/applications/${application.id || application._id}/follow-up-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal membuat draf follow-up');
      }

      setDraft(data.draft);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendFollowUp = async () => {
    setIsSending(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch(`/api/applications/${application.id || application._id}/send-follow-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: draft.subject,
          bodyText: draft.body,
          bodyHtml: draft.body_html
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal mengirim email follow-up');
      }

      setSuccessMsg(data.message);
      try {
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      } catch {}

      if (onFollowUpSent) onFollowUpSent(application.id || application._id);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsSending(false);
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
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: '#0B0F19',
        border: '1px solid var(--border-glass)',
        padding: '26px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={20} color="#F59E0B" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Kirim Email Follow-Up Sopan ke HRD</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Follow-up lamaran untuk posisi <b>{application.position}</b> di <b>{application.company_name}</b>
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

        {successMsg && (
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#34D399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '10px', color: 'var(--text-muted)' }}>
            <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Menyusun draf follow-up santun dengan Groq AI...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Tujuan Email HRD:
              </label>
              <input
                type="text"
                disabled
                className="input-field"
                value={application.recipient_email}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Subjek Email:
              </label>
              <input
                type="text"
                className="input-field"
                value={draft.subject}
                onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Isi Pesan Follow-Up:
              </label>
              <textarea
                className="input-field"
                rows={8}
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value, body_html: e.target.value.replace(/\n/g, '<br/>') })}
                style={{ fontFamily: 'inherit', lineHeight: '1.6' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
              <button
                type="button"
                onClick={fetchDraft}
                disabled={isLoading || isSending}
                className="btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                <Sparkles size={14} /> Re-Generate AI
              </button>

              <button
                type="button"
                onClick={handleSendFollowUp}
                disabled={isSending}
                className="btn-primary"
                style={{ padding: '10px 24px', fontSize: '0.9rem', background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
              >
                <Send size={16} />
                <span>{isSending ? 'Mengirim Follow-Up...' : '🚀 Kirim Follow-Up Sekarang (1-Klik)'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
