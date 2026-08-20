import React, { useState, useEffect } from 'react';
import { 
  Bell, Mail, Calendar, MessageSquare, ExternalLink, 
  CheckCircle2, RefreshCw, X, Sparkles, Building, Clock 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLanguage } from '../context/LanguageContext';

export default function HRInboxModal({ isOpen, onClose, onLaunchInterview }) {
  const { lang, t } = useLanguage();
  const [inboxList, setInboxList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchInbox();
  }, [isOpen]);

  const fetchInbox = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch('/api/inbox', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setInboxList(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch inbox:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncInbox = async () => {
    setIsSyncing(true);
    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch('/api/inbox/sync', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setInboxList(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        try {
          confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
        } catch {}
      }
    } catch (err) {
      console.error('Failed to sync inbox:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('lamarkerja_token');
      await fetch('/api/inbox/read', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ notificationId })
      });
      fetchInbox();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 120,
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
        gap: '18px'
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
              <Bell size={22} color="#EF4444" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  {lang === 'id' ? 'Kotak Masuk & Balasan HRD' : 'HR Inbox & Notifications'}
                </h2>
                {unreadCount > 0 && (
                  <span className="badge badge-rose" style={{ fontSize: '0.7rem' }}>
                    {unreadCount} {lang === 'id' ? 'Baru' : 'New'}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {lang === 'id' 
                  ? 'Deteksi otomatis respon, undangan interview, dan panggilan seleksi dari HRD'
                  : 'Automated detection of HR replies, interview invites, and candidate follow-ups'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleSyncInbox}
              disabled={isSyncing}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '7px 12px' }}
            >
              <RefreshCw size={14} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
              <span>{isSyncing ? (lang === 'id' ? 'Memeriksa...' : 'Checking...') : (lang === 'id' ? 'Cek Balasan' : 'Check Replies')}</span>
            </button>

            <button 
              onClick={onClose} 
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.3rem' }}
            >
              ✕
            </button>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '50px', gap: '10px', color: 'var(--text-muted)' }}>
            <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', color: '#0EA5E9' }} />
            <span>{lang === 'id' ? 'Memuat kotak masuk HRD...' : 'Loading HR inbox...'}</span>
          </div>
        ) : inboxList.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '50px 20px',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '16px',
            border: '1px dashed var(--border-glass)',
            textAlign: 'center',
            gap: '12px'
          }}>
            <Mail size={42} color="#64748B" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              {lang === 'id' ? 'Belum Ada Email Balasan Baru' : 'No New HR Responses Yet'}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '420px', lineHeight: '1.5' }}>
              {lang === 'id'
                ? 'Klik tombol "Cek Balasan" di atas setelah mengirim lamaran untuk mendeteksi respon terbaru dari HRD.'
                : 'Click "Check Replies" above after dispatching applications to detect latest responses from recruiters.'}
            </p>
            <button onClick={handleSyncInbox} disabled={isSyncing} className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
              <RefreshCw size={14} /> {lang === 'id' ? 'Cek Status Sekarang' : 'Check Status Now'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {inboxList.map((item) => (
              <div 
                key={item.id}
                style={{
                  background: item.is_read ? 'rgba(15, 23, 42, 0.6)' : 'linear-gradient(135deg, rgba(2, 132, 199, 0.12), rgba(15, 23, 42, 0.85))',
                  border: item.is_read ? '1px solid var(--border-glass)' : '1px solid rgba(2, 132, 199, 0.4)',
                  borderRadius: '14px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Building size={16} color="#38BDF8" />
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#F8FAFC' }}>
                      {item.company_name}
                    </span>
                    <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
                      {item.position || (lang === 'id' ? 'Posisi' : 'Position')}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {new Date(item.createdAt).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'medium' })}
                  </span>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#38BDF8', margin: '0 0 4px 0' }}>
                    {item.title}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
                    {item.message}
                  </p>
                </div>

                {item.meeting_link && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#34D399', background: 'rgba(16, 185, 129, 0.08)', padding: '6px 12px', borderRadius: '8px' }}>
                    <Calendar size={13} />
                    <span>{lang === 'id' ? 'Jadwal Wawancara Online Tersedia' : 'Online Interview Schedule Available'}</span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', paddingTop: '6px' }}>
                  {!item.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(item.id)}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                    >
                      <CheckCircle2 size={13} /> {lang === 'id' ? 'Tandai Dibaca' : 'Mark as Read'}
                    </button>
                  )}

                  {onLaunchInterview && (
                    <button
                      onClick={() => {
                        onClose();
                        onLaunchInterview({ position: item.position, company_name: item.company_name, requirements: [item.position] });
                      }}
                      className="btn-primary"
                      style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                    >
                      <MessageSquare size={13} /> {lang === 'id' ? 'Latihan Interview untuk Loker Ini' : 'Practice Interview for This Job'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
