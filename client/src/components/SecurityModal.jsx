import React from 'react';
import {
  X, Shield, ShieldAlert, Mail, Key, Server, Lock, Globe, FileText,
  CheckCircle2, AlertTriangle, User, Wifi
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { FEATURES, JOB_HUB_SOURCES_SHORT } from '../data/productFacts';

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(3, 7, 18, 0.85)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1050,
  padding: '16px'
};

const panelStyle = {
  width: '100%',
  maxWidth: '760px',
  maxHeight: '90vh',
  overflowY: 'auto',
  background: 'rgba(15, 23, 42, 0.97)',
  border: '1px solid rgba(56, 189, 248, 0.3)',
  boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 30px rgba(14, 165, 233, 0.18)',
  borderRadius: '24px',
  padding: '28px'
};

function FactCard({ icon: Icon, iconColor, title, children, tone = 'slate' }) {
  const tones = {
    slate: { bg: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-glass)' },
    amber: { bg: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.35)' },
    cyan: { bg: 'rgba(14, 165, 233, 0.08)', border: '1px solid rgba(56, 189, 248, 0.28)' },
    rose: { bg: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.28)' }
  };
  return (
    <div style={{
      ...tones[tone],
      borderRadius: '14px',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px'
    }}>
      <Icon size={18} color={iconColor} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div>
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.55 }}>{children}</div>
      </div>
    </div>
  );
}

export default function SecurityModal({ isOpen, onClose }) {
  const { lang, t } = useLanguage();
  if (!isOpen) return null;

  const id = lang === 'id';

  return (
    <div style={overlayStyle}>
      <div className="glass-panel" style={panelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0EA5E9, #0369A1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(14, 165, 233, 0.35)'
            }}>
              <Shield size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                {t('security_title', id ? 'Keamanan & Fitur' : 'Security & Features')}
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#38BDF8', margin: '2px 0 0 0', fontWeight: 600 }}>
                {id ? 'Penjelasan jujur: SMTP, Groq, dan apa yang aplikasi ini lakukan' : 'Plain facts: SMTP, Groq, and what this app actually does'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '8px', borderRadius: '50%', border: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{
          background: 'rgba(14, 165, 233, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '16px',
          padding: '14px 18px',
          marginBottom: '18px',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          color: '#E2E8F0'
        }}>
          {id
            ? 'Banyak orang ragu karena aplikasi mengirim lamaran lewat Gmail SMTP. Halaman ini menjelaskan apa yang benar-benar terjadi — tanpa badge “bank-grade” atau klaim “kami tidak pernah menyimpan sandi”.'
            : 'People worry because the app sends applications through Gmail SMTP. This page states what actually happens — no “bank-grade” badge and no “we never store passwords” claim.'}
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail size={18} color="#FBBF24" />
          {id ? 'Gmail SMTP: apa yang disimpan' : 'Gmail SMTP: what is stored'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <FactCard icon={ShieldAlert} iconColor="#FBBF24" tone="amber" title={id ? 'App Password tersimpan di database Anda' : 'The App Password is stored in your database'}>
            {id
              ? 'Kolom profiles.smtp_pass (dan cadangan settings.smtp_pass untuk konfigurasi sistem) adalah teks biasa di PostgreSQL — bukan sandi yang di-hash seperti login akun. Itu tinggal di server/database yang menjalankan LamarKerja (milik Anda jika self-host / lokal). Dipakai hanya untuk autentikasi ke smtp.gmail.com saat mengirim surat lamaran.'
              : 'The profiles.smtp_pass column (and settings.smtp_pass as a system fallback) is plain text in PostgreSQL — not hashed like your account login. It lives on the server/database running LamarKerja (yours if self-hosted). It is used only to authenticate to smtp.gmail.com when sending application mail.'}
          </FactCard>

          <FactCard icon={Key} iconColor="#38BDF8" tone="cyan" title={id ? 'Pakai Google App Password, bukan password akun' : 'Use a Google App Password, not your account password'}>
            {id
              ? 'Aktifkan Verifikasi 2 Langkah, buat App Password 16 karakter di myaccount.google.com/apppasswords, lalu tempel di Pengaturan. Jangan isi password login Google. Jika App Password bocor, cabut di akun Google — akun utama tetap utuh.'
              : 'Turn on 2-Step Verification, create a 16-character App Password at myaccount.google.com/apppasswords, and paste it in Settings. Do not store your Google login password. If the App Password leaks, revoke it in Google — the main account stays intact.'}
          </FactCard>

          <FactCard icon={Lock} iconColor="#34D399" tone="slate" title={id ? 'Tidak dikirim ke Groq, tidak dibagi ke user lain' : 'Not sent to Groq, not shared with other users'}>
            {id
              ? 'SMTP terikat profil userId Anda. Groq hanya menerima teks yang diminta model (CV, deskripsi loker, draf surat). App Password tidak ikut ke Groq. Pengguna lain tidak melihat kredensial Gmail Anda.'
              : 'SMTP is bound to your profile userId. Groq only receives text the model needs (CV, job text, letter drafts). The App Password is not sent to Groq. Other users cannot see your Gmail credentials.'}
          </FactCard>

          <FactCard icon={AlertTriangle} iconColor="#FB7185" tone="rose" title={id ? 'Yang tidak kami klaim' : 'What we do not claim'}>
            {id
              ? 'Tidak ada enkripsi setingkat bank pada smtp_pass. Tidak ada sertifikat SOC2. Siapa pun yang punya akses ke mesin/database ini bisa membaca App Password yang tersimpan. Jangan bagikan laptop/server, dan cabut App Password jika mesin tidak lagi dipercaya.'
              : 'There is no bank-grade encryption on smtp_pass. There is no SOC2 badge. Anyone with access to this machine/database can read the stored App Password. Do not share the machine, and revoke the App Password if the host is no longer trusted.'}
          </FactCard>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server size={18} color="#818CF8" />
          {id ? 'Akun, Groq, dan model self-host' : 'Accounts, Groq, and self-hosting'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
          <FactCard icon={User} iconColor="#38BDF8" title={id ? 'Login: sandi di-hash, sesi JWT' : 'Login: hashed password, JWT session'}>
            {id
              ? 'Kata sandi akun LamarKerja di-hash dengan bcrypt sebelum disimpan. Setelah masuk, browser menyimpan JWT (Bearer) untuk memanggil API. Ini proteksi sesi biasa — bukan vault untuk SMTP.'
              : 'LamarKerja account passwords are bcrypt-hashed before storage. After login, the browser keeps a JWT (Bearer) for API calls. That is ordinary session security — not a vault for SMTP.'}
          </FactCard>

          <FactCard icon={Key} iconColor="#A78BFA" title={id ? 'Kunci Groq di server, bukan di profil pelamar' : 'Groq key on the server, not on applicant profiles'}>
            {id
              ? 'GROQ_API_KEY di environment server dan/atau kolom settings.groq_api_key (teks di PostgreSQL). Hanya admin yang boleh mengganti kunci lewat Pengaturan. Pelamar tidak menempel kunci Groq di profil SMTP.'
              : 'GROQ_API_KEY lives in the server environment and/or settings.groq_api_key (plain text in PostgreSQL). Only an admin can change it in Settings. Applicants do not paste a Groq key into the SMTP profile.'}
          </FactCard>

          <FactCard icon={Wifi} iconColor="#67E8F9" title={id ? 'HTTPS di produksi, PostgreSQL milik Anda' : 'HTTPS in production, your PostgreSQL'}>
            {id
              ? 'Aplikasi ini dirancang self-hosted / lokal: Node + PostgreSQL di mesin Anda. Di produksi, pasang HTTPS (reverse proxy) agar JWT dan App Password tidak lewat HTTP polos. Kami tidak menyimpan data Anda di “MongoDB Atlas Cloud”.'
              : 'This app is built as a local/self-hosted stack: Node + PostgreSQL on your machine. In production, terminate HTTPS (reverse proxy) so the JWT and App Password are not sent over plain HTTP. We do not store your data on “MongoDB Atlas Cloud”.'}
          </FactCard>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={18} color="#38BDF8" />
          {id ? 'Fitur yang benar-benar ada' : 'Features that actually exist'}
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: '0 0 12px', lineHeight: 1.5 }}>
          {id
            ? `Direktori loker saat ini: ${JOB_HUB_SOURCES_SHORT}. Setiap item di bawah menjelaskan kapan dipakai.`
            : `Current job directory sources: ${JOB_HUB_SOURCES_SHORT}. Each item below says when to use it.`}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
          {FEATURES.map((feat) => (
            <div
              key={feat.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                background: 'rgba(15, 23, 42, 0.7)',
                padding: '12px 14px',
                borderRadius: '14px',
                border: '1px solid var(--border-glass)'
              }}
            >
              <FileText size={16} color={feat.accent} style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#F8FAFC' }}>{feat.title[lang] || feat.title.id}</div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '3px', lineHeight: 1.55 }}>
                  {feat.body[lang] || feat.body.id}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '12px 16px',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <CheckCircle2 size={18} color="#10B981" style={{ flexShrink: 0, marginTop: '1px' }} />
          <span style={{ fontSize: '0.82rem', color: '#A7F3D0', lineHeight: 1.55 }}>
            {id
              ? 'Saran praktis: App Password (bukan password Google), jangan bagikan mesin/database, cabut sandi aplikasi jika ragu, dan selalu tinjau draf sebelum kirim.'
              : 'Practical advice: App Password (not your Google password), do not share the machine/database, revoke the app password if unsure, and always review drafts before send.'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-primary" style={{ padding: '10px 24px', borderRadius: '12px', fontSize: '0.9rem' }}>
            {t('about_close', id ? 'Tutup' : 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
}
