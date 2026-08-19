import React, { useState, useEffect } from 'react';
import {
  FileText, CheckCircle2, Clock, Calendar, Mail,
  Trash2, ExternalLink, RefreshCw, Eye, Search, MessageSquare, AlertCircle, X, Plus, Pencil, Bell
} from 'lucide-react';
import FollowUpModal from './FollowUpModal';
import InterviewSimulatorModal from './InterviewSimulatorModal';
import LoadingOverlay from './LoadingOverlay';
import { useLanguage } from '../context/LanguageContext';

const APPLICATION_SOURCES = [
  'Glints',
  'JobStreet',
  'LinkedIn',
  'Dealls',
  'KarirJakarta',
  'Remotive',
  'LamarKerja',
  'Lainnya'
];

function toDateInputValue(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function emptyForm() {
  return {
    company_name: '',
    position: '',
    job_url: '',
    source: 'LamarKerja',
    status: 'sent',
    applied_at: toDateInputValue(),
    notes: ''
  };
}

function authJsonHeaders() {
  const token = localStorage.getItem('lamarkerja_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export default function ApplicationTracker({ stats, onRefresh }) {
  const { t, lang } = useLanguage();
  const [applications, setApplications] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [followUpApp, setFollowUpApp] = useState(null);
  const [interviewApp, setInterviewApp] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [listStats, setListStats] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch('/api/applications', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications || []);
        if (data.stats) setListStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: 'PATCH',
        headers: authJsonHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchApplications();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDelete = async (appId) => {
    if (!window.confirm(lang === 'id' ? 'Yakin ingin menghapus riwayat lamaran ini?' : 'Delete this application record?')) return;
    try {
      const token = localStorage.getItem('lamarkerja_token');
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        fetchApplications();
        if (onRefresh) onRefresh();
        if (selectedApp?.id === appId) setSelectedApp(null);
      }
    } catch (err) {
      console.error('Failed to delete application:', err);
    }
  };

  const openCreateForm = () => {
    setEditingApp(null);
    setForm(emptyForm());
    setFormError('');
    setFormOpen(true);
  };

  const openEditForm = (app) => {
    setEditingApp(app);
    setForm({
      company_name: app.company_name || '',
      position: app.position || '',
      job_url: app.job_url || '',
      source: app.source || 'LamarKerja',
      status: app.status || 'sent',
      applied_at: toDateInputValue(app.applied_at || app.sent_at),
      notes: app.notes || ''
    });
    setFormError('');
    setFormOpen(true);
    setSelectedApp(null);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingApp(null);
    setFormError('');
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!form.company_name.trim() || !form.position.trim()) {
      setFormError(lang === 'id' ? 'Perusahaan dan posisi wajib diisi.' : 'Company and position are required.');
      return;
    }
    setFormSaving(true);
    setFormError('');
    try {
      const payload = {
        company_name: form.company_name.trim(),
        position: form.position.trim(),
        job_url: form.job_url.trim(),
        source: form.source,
        status: form.status,
        applied_at: form.applied_at || undefined,
        notes: form.notes
      };
      const url = editingApp
        ? `/api/applications/${editingApp.id}/status`
        : '/api/applications';
      const res = await fetch(url, {
        method: editingApp ? 'PATCH' : 'POST',
        headers: authJsonHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || (lang === 'id' ? 'Gagal menyimpan lamaran.' : 'Failed to save application.'));
      }
      closeForm();
      fetchApplications();
      if (onRefresh) onRefresh();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSaving(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      app.company_name?.toLowerCase().includes(q) ||
      app.position?.toLowerCase().includes(q) ||
      app.recipient_email?.toLowerCase().includes(q) ||
      app.source?.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (filterStatus === 'all') return true;
    if (filterStatus === 'followup') return Boolean(app.needs_follow_up);
    return app.status === filterStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'sent':
        return <span className="badge badge-emerald">{lang === 'id' ? 'Terkirim' : 'Sent'}</span>;
      case 'interview':
        return <span className="badge badge-cyan">Interview</span>;
      case 'offering':
        return <span className="badge badge-cyan" style={{ background: 'rgba(168, 85, 247, 0.18)', color: '#E9D5FF', borderColor: 'rgba(168, 85, 247, 0.4)' }}>Offering</span>;
      case 'accepted':
        return <span className="badge badge-emerald" style={{ background: '#10B981', color: '#fff' }}>{lang === 'id' ? 'Diterima 🎉' : 'Accepted 🎉'}</span>;
      case 'rejected':
        return <span className="badge badge-rose">{lang === 'id' ? 'Ditolak' : 'Rejected'}</span>;
      case 'failed':
        return <span className="badge badge-rose">{lang === 'id' ? 'Gagal' : 'Failed'}</span>;
      case 'draft':
      default:
        return <span className="badge badge-amber">{lang === 'id' ? 'Draft' : 'Draft'}</span>;
    }
  };

  const sourceBadge = (source) => (
    <span className="badge badge-cyan" style={{ textTransform: 'none', fontSize: '0.68rem', letterSpacing: 0 }}>
      {source || 'LamarKerja'}
    </span>
  );

  const appliedLabel = (app) => {
    const when = app.applied_at || app.sent_at;
    if (!when) return lang === 'id' ? 'Belum tercatat' : 'Not logged yet';
    return new Date(when).toLocaleString(lang === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const fieldLabel = { fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'block' };
  const displayStats = listStats || stats || {};
  const followUpDue = applications.filter((app) => app.needs_follow_up);
  const pipelineStages = [
    { id: 'draft', label: 'Draft', count: applications.filter((a) => a.status === 'draft').length, color: '#FBBF24' },
    { id: 'sent', label: lang === 'id' ? 'Terkirim' : 'Sent', count: applications.filter((a) => a.status === 'sent').length, color: '#34D399' },
    { id: 'interview', label: 'Interview', count: applications.filter((a) => a.status === 'interview').length, color: '#38BDF8' },
    { id: 'offering', label: 'Offering', count: applications.filter((a) => a.status === 'offering').length, color: '#C084FC' },
    { id: 'accepted', label: lang === 'id' ? 'Diterima' : 'Accepted', count: applications.filter((a) => a.status === 'accepted').length, color: '#10B981' },
    { id: 'rejected', label: lang === 'id' ? 'Ditolak' : 'Rejected', count: applications.filter((a) => a.status === 'rejected').length, color: '#FB7185' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      <div className="glass-panel" style={{
        padding: '24px 28px',
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-cyan">{lang === 'id' ? 'Manajer Lamaran' : 'Application Manager'}</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '6px' }}>{t('tracker_title')}</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5', maxWidth: '640px' }}>
            {t('tracker_desc')}
          </p>
        </div>
        <button onClick={openCreateForm} className="btn-primary" style={{ fontSize: '0.88rem' }}>
          <Plus size={16} /> {lang === 'id' ? 'Tambah lamaran' : 'Add application'}
        </button>
      </div>

      {/* Top Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={24} color="#38BDF8" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lang === 'id' ? 'Total Lamaran' : 'Total Applications'}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{displayStats.total || applications.length}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={24} color="#10B981" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lang === 'id' ? 'Terkirim Sukses' : 'Delivered Successfully'}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34D399' }}>{displayStats.total_sent || 0}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} color="#818CF8" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lang === 'id' ? 'Terkirim Hari Ini' : 'Sent Today'}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{displayStats.sent_today || 0} / 30</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={24} color="#F59E0B" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lang === 'id' ? 'Panggilan Interview' : 'Interview Invites'}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FBBF24' }}>{displayStats.interview || 0}</div>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '16px 18px' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '10px' }}>
          {lang === 'id' ? 'Pipeline status' : 'Status pipeline'}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'stretch' }}>
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.78rem', padding: '8px 12px', borderRadius: '10px' }}
          >
            {lang === 'id' ? 'Semua' : 'All'} · {applications.length}
          </button>
          {pipelineStages.map((stage, idx) => (
            <button
              key={stage.id}
              type="button"
              onClick={() => setFilterStatus(stage.id)}
              className="btn-secondary"
              style={{
                fontSize: '0.78rem',
                padding: '8px 12px',
                borderRadius: '10px',
                borderColor: filterStatus === stage.id ? stage.color : undefined,
                color: filterStatus === stage.id ? stage.color : undefined,
                boxShadow: filterStatus === stage.id ? `0 0 0 1px ${stage.color}` : undefined
              }}
            >
              {idx > 0 ? <span style={{ opacity: 0.45, marginRight: '6px' }}>→</span> : null}
              {stage.label} · {stage.count}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFilterStatus('followup')}
            className={filterStatus === 'followup' ? 'btn-primary' : 'btn-secondary'}
            style={{
              fontSize: '0.78rem',
              padding: '8px 12px',
              borderRadius: '10px',
              borderColor: 'rgba(245, 158, 11, 0.5)',
              color: '#FBBF24'
            }}
          >
            <Bell size={13} /> {lang === 'id' ? 'Perlu follow-up' : 'Needs follow-up'} · {followUpDue.length}
          </button>
        </div>
      </div>

      {followUpDue.length > 0 && filterStatus !== 'followup' && (
        <div className="glass-panel" style={{ padding: '14px 18px', borderColor: 'rgba(245, 158, 11, 0.35)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FBBF24', fontWeight: 700, fontSize: '0.88rem' }}>
              <Bell size={16} />
              {lang === 'id'
                ? `${followUpDue.length} lamaran masih Terkirim lebih dari 5 hari — perlu follow-up`
                : `${followUpDue.length} application(s) still Sent for 5+ days — follow up`}
            </div>
            <button type="button" className="btn-secondary" style={{ fontSize: '0.78rem', padding: '6px 10px' }} onClick={() => setFilterStatus('followup')}>
              {lang === 'id' ? 'Lihat daftar' : 'View list'}
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
          <Search size={18} color="var(--text-dim)" />
          <input
            type="text"
            className="input-field"
            style={{ padding: '8px 12px', maxWidth: '340px' }}
            placeholder={lang === 'id' ? 'Cari PT, posisi, sumber, atau email...' : 'Search company, position, source, or email...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={fetchApplications}
            className="btn-secondary"
            style={{ padding: '6px 10px', borderRadius: '8px' }}
            title={lang === 'id' ? 'Refresh Data' : 'Refresh Data'}
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={openCreateForm}
            className="btn-primary"
            style={{ fontSize: '0.8rem', padding: '6px 12px', borderRadius: '8px' }}
          >
            <Plus size={15} /> {lang === 'id' ? 'Tambah lamaran' : 'Add application'}
          </button>
        </div>
      </div>

      {/* Applications Table / Cards */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {isLoading ? (
          <LoadingOverlay
            fullScreen={false}
            message={lang === 'id' ? 'Memuat Riwayat Lamaran...' : 'Loading Application History...'}
            submessage={lang === 'id' ? 'Mengambil status dan catatan lamaran dari akun Anda' : 'Retrieving application records from your account'}
          />
        ) : filteredApps.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '4px' }}>
              {applications.length === 0
                ? (lang === 'id' ? 'Belum ada data lamaran' : 'No applications logged yet')
                : (lang === 'id' ? 'Tidak ada hasil yang cocok' : 'No matching applications')}
            </h3>
            <p style={{ fontSize: '0.88rem', maxWidth: '480px', margin: '0 auto 16px' }}>
              {applications.length === 0
                ? (lang === 'id'
                  ? 'CRM pribadi: tambah lamaran manual, atur pipeline, follow-up 5 hari, atau Catat sebagai dilamar dari kartu loker. Boleh mencatat apply di Glints/JobStreet — itu catatan Anda, bukan feed live.'
                  : 'Private CRM: add applications manually, move the pipeline, 5-day follow-up, or Mark as applied from a job card. Logging a Glints/JobStreet apply is your note — not a live feed.')
                : (lang === 'id' ? 'Coba ubah kata kunci atau filter status.' : 'Try a different search or status filter.')}
            </p>
            {applications.length === 0 && (
              <button onClick={openCreateForm} className="btn-primary" style={{ fontSize: '0.85rem' }}>
                <Plus size={15} /> {lang === 'id' ? 'Tambah lamaran' : 'Add application'}
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>{lang === 'id' ? 'Perusahaan & Posisi' : 'Company & Position'}</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>{lang === 'id' ? 'Sumber' : 'Source'}</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>{lang === 'id' ? 'Kontak / URL' : 'Contact / URL'}</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>{lang === 'id' ? 'Tanggal Lamar' : 'Applied'}</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>{lang === 'id' ? 'Aksi' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app) => (
                  <tr
                    key={app.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(30, 41, 59, 0.4)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{app.company_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app.position}</div>
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      {sourceBadge(app.source)}
                    </td>

                    <td style={{ padding: '14px 20px', color: '#38BDF8' }}>
                      {app.recipient_email ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={14} />
                          <span>{app.recipient_email}</span>
                        </div>
                      ) : app.job_url ? (
                        <a
                          href={app.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#38BDF8', textDecoration: 'none' }}
                        >
                          <ExternalLink size={14} />
                          <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {lang === 'id' ? 'Buka lowongan' : 'Open posting'}
                          </span>
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 20px', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                      <div>{appliedLabel(app)}</div>
                      {app.needs_follow_up && (
                        <div style={{ marginTop: '4px' }}>
                          <button
                            onClick={() => app.recipient_email ? setFollowUpApp(app) : openEditForm(app)}
                            className="badge badge-amber"
                            style={{ cursor: 'pointer', border: '1px solid #F59E0B', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Clock size={11} /> {lang === 'id' ? `Perlu follow-up (${app.follow_up_days}h)` : `Needs follow-up (${app.follow_up_days}d)`}
                          </button>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <select
                        value={app.status}
                        onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                        style={{
                          background: 'rgba(15, 23, 42, 0.8)',
                          color: 'var(--text-main)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '8px',
                          padding: '4px 8px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="draft">Draft</option>
                        <option value="sent">{lang === 'id' ? 'Terkirim' : 'Sent'}</option>
                        <option value="interview">Interview</option>
                        <option value="offering">Offering</option>
                        <option value="accepted">{lang === 'id' ? 'Diterima' : 'Accepted'}</option>
                        <option value="rejected">{lang === 'id' ? 'Ditolak' : 'Rejected'}</option>
                      </select>
                    </td>

                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setInterviewApp(app)}
                          className="btn-secondary"
                          style={{ padding: '6px 8px', fontSize: '0.76rem', borderRadius: '8px', borderColor: 'rgba(14, 165, 233, 0.4)' }}
                          title={lang === 'id' ? 'Latihan Wawancara AI untuk Posisi Ini' : 'AI Interview Practice for this Role'}
                        >
                          <MessageSquare size={13} color="#0EA5E9" /> Interview
                        </button>
                        <button
                          onClick={() => openEditForm(app)}
                          className="btn-secondary"
                          style={{ padding: '6px 8px', fontSize: '0.76rem', borderRadius: '8px' }}
                          title={lang === 'id' ? 'Ubah lamaran' : 'Edit application'}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="btn-secondary"
                          style={{ padding: '6px 8px', fontSize: '0.76rem', borderRadius: '8px' }}
                          title={lang === 'id' ? 'Lihat Detail' : 'View details'}
                        >
                          <Eye size={13} /> {lang === 'id' ? 'Detail' : 'Details'}
                        </button>
                        <button
                          onClick={() => handleDelete(app.id)}
                          style={{
                            background: 'rgba(244, 63, 94, 0.1)',
                            border: '1px solid rgba(244, 63, 94, 0.3)',
                            color: '#FB7185',
                            padding: '6px 8px',
                            borderRadius: '8px',
                            fontSize: '0.76rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title={lang === 'id' ? 'Hapus Riwayat Lamaran' : 'Delete Application'}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Follow-Up Modal */}
      <FollowUpModal
        isOpen={!!followUpApp}
        onClose={() => setFollowUpApp(null)}
        application={followUpApp}
        onFollowUpSent={() => {
          fetchApplications();
          if (onRefresh) onRefresh();
        }}
      />

      {/* Mock Interview Simulator Modal */}
      <InterviewSimulatorModal
        isOpen={!!interviewApp}
        onClose={() => setInterviewApp(null)}
        jobDetails={interviewApp ? { position: interviewApp.position, company_name: interviewApp.company_name, requirements: [interviewApp.position] } : null}
      />

      {/* Create / Edit form */}
      {formOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <form
            onSubmit={handleSaveForm}
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#0F172A',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  {editingApp
                    ? (lang === 'id' ? 'Ubah lamaran' : 'Edit application')
                    : (lang === 'id' ? 'Tambah lamaran' : 'Add application')}
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {lang === 'id'
                    ? 'Catat lamaran yang sudah Anda kirim di portal lain, atau perbarui data yang ada.'
                    : 'Log an application you already sent on another portal, or update an existing record.'}
                </p>
              </div>
              <button type="button" onClick={closeForm} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div>
              <label style={fieldLabel}>{lang === 'id' ? 'Perusahaan *' : 'Company *'}</label>
              <input
                className="input-field"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                placeholder="PT Contoh Sejahtera"
                required
              />
            </div>
            <div>
              <label style={fieldLabel}>{lang === 'id' ? 'Posisi *' : 'Position *'}</label>
              <input
                className="input-field"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="Backend Engineer"
                required
              />
            </div>
            <div>
              <label style={fieldLabel}>{lang === 'id' ? 'URL lowongan (opsional)' : 'Job URL (optional)'}</label>
              <input
                className="input-field"
                type="text"
                value={form.job_url}
                onChange={(e) => setForm({ ...form, job_url: e.target.value })}
                placeholder="https://glints.com/id/opportunities/jobs/..."
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={fieldLabel}>{lang === 'id' ? 'Sumber / platform' : 'Source / platform'}</label>
                <select
                  className="input-field"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                >
                  {APPLICATION_SOURCES.map((src) => (
                    <option key={src} value={src}>{src}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={fieldLabel}>Status</label>
                <select
                  className="input-field"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="sent">{lang === 'id' ? 'Terkirim' : 'Sent'}</option>
                  <option value="interview">Interview</option>
                  <option value="offering">Offering</option>
                  <option value="accepted">{lang === 'id' ? 'Diterima' : 'Accepted'}</option>
                  <option value="rejected">{lang === 'id' ? 'Ditolak' : 'Rejected'}</option>
                </select>
              </div>
            </div>
            <div>
              <label style={fieldLabel}>{lang === 'id' ? 'Tanggal lamar' : 'Applied date'}</label>
              <input
                className="input-field"
                type="date"
                value={form.applied_at}
                onChange={(e) => setForm({ ...form, applied_at: e.target.value })}
              />
            </div>
            <div>
              <label style={fieldLabel}>{lang === 'id' ? 'Catatan (opsional)' : 'Notes (optional)'}</label>
              <textarea
                className="input-field"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={lang === 'id' ? 'Misal: sudah upload CV, menunggu balasan HRD' : 'e.g. CV uploaded, waiting for HR'}
                style={{ resize: 'vertical', minHeight: '80px' }}
              />
            </div>

            {formError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FB7185', fontSize: '0.84rem' }}>
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button type="button" onClick={closeForm} className="btn-secondary">
                {lang === 'id' ? 'Batal' : 'Cancel'}
              </button>
              <button type="submit" className="btn-primary" disabled={formSaving}>
                {formSaving
                  ? (lang === 'id' ? 'Menyimpan...' : 'Saving...')
                  : (editingApp ? (lang === 'id' ? 'Simpan perubahan' : 'Save changes') : (lang === 'id' ? 'Simpan lamaran' : 'Save application'))}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Detail View Modal */}
      {selectedApp && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '740px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: '#0F172A',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selectedApp.company_name}</h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{selectedApp.position}</p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1.3rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(15, 23, 42, 0.8)', padding: '14px', borderRadius: '10px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{lang === 'id' ? 'Sumber:' : 'Source:'}</div>
                <div style={{ marginTop: '4px' }}>{sourceBadge(selectedApp.source)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Status:</div>
                <div>{getStatusBadge(selectedApp.status)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{lang === 'id' ? 'Tanggal lamar:' : 'Applied:'}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} /> {appliedLabel(selectedApp)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Email HRD:</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: selectedApp.recipient_email ? '#38BDF8' : 'var(--text-dim)' }}>
                  {selectedApp.recipient_email || '—'}
                </div>
              </div>
              {selectedApp.job_url && (
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{lang === 'id' ? 'URL lowongan:' : 'Job URL:'}</div>
                  <a href={selectedApp.job_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.88rem', color: '#38BDF8', wordBreak: 'break-all' }}>
                    {selectedApp.job_url}
                  </a>
                </div>
              )}
              {selectedApp.email_subject && (
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Subject Email:</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedApp.email_subject}</div>
                </div>
              )}
            </div>

            {selectedApp.notes && (
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>{lang === 'id' ? 'Catatan:' : 'Notes:'}</div>
                <div style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid var(--border-glass)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.88rem',
                  color: '#E2E8F0'
                }}>
                  {selectedApp.notes}
                </div>
              </div>
            )}

            {selectedApp.email_body && (
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>Isi Email Lamaran:</div>
                <div style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid var(--border-glass)',
                  padding: '16px',
                  borderRadius: '10px',
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.88rem',
                  lineHeight: '1.6',
                  color: '#E2E8F0',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {selectedApp.email_body}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => openEditForm(selectedApp)} className="btn-secondary" style={{ fontSize: '0.82rem' }}>
                  <Pencil size={14} /> {lang === 'id' ? 'Ubah' : 'Edit'}
                </button>
                {selectedApp.recipient_email && (
                  <button
                    onClick={() => {
                      const app = selectedApp;
                      setSelectedApp(null);
                      setFollowUpApp(app);
                    }}
                    className="btn-secondary"
                    style={{ fontSize: '0.82rem', borderColor: '#F59E0B', color: '#FDE68A' }}
                  >
                    <Clock size={14} color="#F59E0B" /> Kirim Follow-Up
                  </button>
                )}
              </div>

              <button onClick={() => setSelectedApp(null)} className="btn-primary" style={{ padding: '8px 20px' }}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
