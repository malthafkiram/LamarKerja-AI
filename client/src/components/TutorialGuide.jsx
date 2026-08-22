import React, { useState } from 'react';
import { 
  BookOpen, Key, Mail, UploadCloud, Bot, FileText, CheckCircle2, 
  AlertTriangle, ShieldAlert, Sparkles, HelpCircle, ArrowRight, 
  ChevronDown, ChevronUp, ExternalLink, Lightbulb, Zap, ShieldCheck, Check, Code2, Smartphone
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function TutorialGuide({ onOpenSettings, onNavigateTab }) {
  const { t, lang } = useLanguage();
  const [openFaq, setOpenFaq] = useState(null);
  const [openError, setOpenError] = useState(null);


  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const toggleError = (index) => {
    setOpenError(openError === index ? null : index);
  };

  const troubleshootingList = lang === 'id' ? [
    {
      title: "1. Error: 'Invalid login: 535-5.7.8 Username and Password not accepted'",
      badge: "Email SMTP",
      cause: "Anda memasukkan kata sandi (password) login akun Google biasa, bukan 'App Password' khusus 16 karakter, atau fitur Verifikasi 2 Langkah belum aktif.",
      solution: [
        "Pastikan akun Google Anda sudah mengaktifkan Verifikasi 2 Langkah (2-Step Verification).",
        "Buka halaman resmi Google: myaccount.google.com/apppasswords",
        "Buat App Password baru dengan nama 'LamarKerja' lalu salin 16 karakter sandi yang muncul (misal: 'abcd efgh ijkl mnop').",
        "Buka menu Pengaturan di aplikasi ini, masukkan 16 karakter tersebut (tanpa spasi) ke kolom 'Google App Password', lalu klik 'Test Koneksi SMTP'."
      ]
    },
    {
      title: "2. Error: 'NetworkError when attempting to fetch resource' (hanya di situs live)",
      badge: "Railway SMTP",
      cause: "Paket Railway Hobby/Trial memblokir keluar ke smtp.gmail.com port 465/587. Request Uji SMTP menggantung sampai proxy memutus, jadi browser menampilkan NetworkError. Di komputer lokal port SMTP terbuka, jadi yang muncul adalah error Gmail 535 (password salah).",
      solution: [
        "Perbaiki App Password dulu di aplikasi lokal sampai Uji Koneksi berhasil (bukan 535).",
        "Untuk kirim dari https://lamarkerja.kabanroom.web.id: upgrade Railway ke Pro, lalu redeploy service-nya.",
        "Atau ganti pengiriman ke layanan email HTTPS (Resend, SendGrid, Mailgun) — tidak memakai port SMTP.",
        "Hard refresh sekali setelah deploy agar service worker lama tidak menahan halaman."
      ]
    },
    {
      title: "3. Error: 'Teks pada gambar brosur tidak dapat terbaca oleh OCR'",
      badge: "Scanner OCR",
      cause: "Gambar poster/brosur terlalu buram, resolusi terlalu kecil, teks tertutup ornamen grafis tebal, atau kontras warna font terlalu redup.",
      solution: [
        "Ambil screenshot ulang (crop) khusus pada bagian informasi posisi, syarat kualifikasi, dan kontak email HRD agar lebih jelas.",
        "Pastikan teks pada gambar masih terbaca jelas oleh mata Anda.",
        "Gunakan format file PNG atau JPG beresolusi sedang-tinggi.",
        "Anda juga bisa langsung mengunggah file brosur berformat PDF asli jika tersedia."
      ]
    },
    {
      title: "4. Error: 'Batas pengiriman email harian (30 email/hari) telah tercapai'",
      badge: "Anti-Spam",
      cause: "Sistem mengaktifkan pengaman anti-spam harian untuk menjaga reputasi akun Gmail Anda agar tidak dicap sebagai spammer oleh Google.",
      solution: [
        "Tunggu hingga keesokan harinya agar kuota harian ter-reset otomatis.",
        "Jika Anda ingin menaikkan batas limit harian, buka menu Pengaturan (ikon gear ⚙️) lalu ubah 'Batas Pengiriman Harian' menjadi 40 atau 50 email/hari."
      ]
    },
    {
      title: "5. Error: 'Email tujuan HRD tidak terdeteksi pada brosur'",
      badge: "Ekstraksi AI",
      cause: "Poster lowongan tidak mencantumkan email penerimaan (misalnya hanya mencantumkan link website form Google / portal karir internal).",
      solution: [
        "Periksa apakah ada alamat email lain di website atau media sosial perusahaan tersebut.",
        "Setelah AI selesai memindai brosur, Anda bisa langsung mengetikkan alamat email HRD secara manual pada kolom 'Email Tujuan HRD' sebelum menekan tombol Kirim."
      ]
    },
    {
      title: "6. Error: 'Gagal terhubung ke PostgreSQL / Sequelize Connection Timeout'",
      badge: "Database",
      cause: "PostgreSQL di mesin Anda belum berjalan, DATABASE_URL salah, atau jaringan ke host database terputus. LamarKerja memakai PostgreSQL lokal/self-hosted, bukan MongoDB Atlas.",
      solution: [
        "Pastikan layanan PostgreSQL aktif (contoh: sudo systemctl status postgresql).",
        "Periksa DATABASE_URL di server/.env: postgres://USER:PASSWORD@HOST:5432/lamarkerja",
        "Buat database jika belum ada: createdb lamarkerja",
        "Jangan whitelist IP di cloud.mongodb.com — stack ini tidak memakai MongoDB."
      ]
    }
  ] : [
    {
      title: "1. Error: 'Invalid login: 535-5.7.8 Username and Password not accepted'",
      badge: "Email SMTP",
      cause: "You entered your regular Google password instead of a dedicated 16-character 'App Password', or 2-Step Verification is disabled.",
      solution: [
        "Ensure 2-Step Verification is active on your Google account.",
        "Go to the official Google page: myaccount.google.com/apppasswords",
        "Generate a new App Password named 'LamarKerja' and copy the 16-character code (e.g. 'abcd efgh ijkl mnop').",
        "Open Settings in this app, paste the code into 'Google App Password', and click 'Test SMTP Connection'."
      ]
    },
    {
      title: "2. Error: 'NetworkError when attempting to fetch resource' (live site only)",
      badge: "Railway SMTP",
      cause: "Railway Hobby/Trial blocks outbound SMTP to smtp.gmail.com on ports 465/587. The test request hangs until the proxy drops it, so the browser shows NetworkError. On your laptop SMTP is open, so you see Gmail's 535 instead.",
      solution: [
        "Fix the App Password locally until Test SMTP succeeds (not 535).",
        "To send from the live site: upgrade Railway to Pro, then redeploy.",
        "Or send through an HTTPS email API (Resend, SendGrid, Mailgun) instead of Gmail SMTP.",
        "Hard-refresh once after deploy so an old service worker does not keep a stale page."
      ]
    },
    {
      title: "3. Error: 'Text on job flyer unreadable by OCR engine'",
      badge: "Scanner OCR",
      cause: "The flyer image is too blurry, resolution is low, or text contrast is inadequate.",
      solution: [
        "Crop or retake a clear screenshot focusing on position, requirements, and HR email contacts.",
        "Ensure text is visibly legible before dropping.",
        "Use PNG or high-res JPG formats.",
        "Original PDF flyers can also be uploaded directly."
      ]
    },
    {
      title: "4. Error: 'Daily application delivery limit reached'",
      badge: "Anti-Spam",
      cause: "Daily anti-spam protection is engaged to protect your personal Gmail domain reputation.",
      solution: [
        "Wait until the next day for automatic quota reset.",
        "To adjust your quota, open Settings (⚙️) and modify 'Daily Delivery Limit'."
      ]
    },
    {
      title: "5. Error: 'Recipient HR email not detected on flyer'",
      badge: "AI Extraction",
      cause: "The poster only contains website application links or internal Google forms.",
      solution: [
        "Check official company social media or career pages for contact info.",
        "Manually type the destination email into the 'Recipient HR Email' field before sending."
      ]
    },
    {
      title: "6. Error: 'Failed to connect to PostgreSQL / Sequelize Connection Timeout'",
      badge: "Database",
      cause: "PostgreSQL on this machine is down, DATABASE_URL is wrong, or the database host is unreachable. LamarKerja uses local/self-hosted PostgreSQL, not MongoDB Atlas.",
      solution: [
        "Confirm PostgreSQL is running (e.g. sudo systemctl status postgresql).",
        "Check DATABASE_URL in server/.env: postgres://USER:PASSWORD@HOST:5432/lamarkerja",
        "Create the database if missing: createdb lamarkerja",
        "Do not whitelist IPs on cloud.mongodb.com — this stack does not use MongoDB."
      ]
    }
  ];

  const faqList = lang === 'id' ? [
    {
      q: "Apakah aplikasi ini 100% gratis?",
      a: "Klien LamarKerja bisa dipakai tanpa bayar ke kami. Groq punya kuota gratis/berbayar sendiri, Gmail SMTP memakai kuota Google Anda, dan PostgreSQL berjalan di mesin Anda. Paket PRO di aplikasi adalah opsi kuota fitur, bukan klaim bahwa seluruh internet gratis selamanya."
    },
    {
      q: "Apakah sandi Gmail dienkripsi / tidak pernah disimpan?",
      a: "Jujur: Google App Password disimpan sebagai teks di kolom profiles.smtp_pass pada PostgreSQL server ini. Bukan password akun Google, tidak dikirim ke Groq, tidak dibagi ke pengguna lain. Siapa yang punya akses ke mesin/database bisa membacanya — jangan bagikan laptop, dan cabut App Password jika ragu. Detail: menu Keamanan."
    },
    {
      q: "Apakah LamarKerja men-scrape Glints / JobStreet / Indeed / Kalibrr?",
      a: "Tidak sebagai feed live. Jelajah Loker mengambil LinkedIn guest, Dealls, Disnakerja, KarirJakarta, Karirhub, Toploker, Karirlink, Remotive, Arbeitnow, Jobicy, Himalayas, dan Remote OK. Tab Berita memakai Google News RSS (bukan scraping HTML Kompas/Detik). Di Riwayat Anda boleh mencatat lamaran yang dikirim di Glints/JobStreet secara manual — itu CRM, bukan scraping."
    },
    {
      q: "Bagaimana AI mencocokkan CV dengan loker?",
      a: "Teks CV diekstrak di server Anda. Groq membandingkannya dengan kualifikasi loker, menghitung match score, dan bisa membuat cover letter. Kunci Groq ada di server (env/settings), bukan di profil SMTP Anda."
    },
    {
      q: "Apakah file PDF CV otomatis terlampir saat kirim email?",
      a: "Ya. PDF yang diunggah di tab Profil dilampirkan pada email yang dikirim lewat Gmail SMTP Anda."
    },
    {
      q: "Kapan waktu terbaik mengirim email lamaran?",
      a: "Hari kerja Senin–Kamis, sekitar pukul 08.00–10.00 atau 13.00–14.00, biasanya lebih mudah terlihat di inbox HRD."
    }
  ] : [
    {
      q: "Is LamarKerja free?",
      a: "The LamarKerja client can be used without paying us. Groq has its own free/paid quota, Gmail SMTP uses your Google quota, and PostgreSQL runs on your machine. In-app PRO is a feature-quota option, not a claim that the whole internet is free forever."
    },
    {
      q: "Is the Gmail password encrypted / never stored?",
      a: "Honestly: the Google App Password is stored as text in profiles.smtp_pass on this server’s PostgreSQL. It is not your Google account password, is not sent to Groq, and is not shared with other users. Anyone with machine/database access can read it — don’t share the laptop, and revoke the App Password if unsure. See Security."
    },
    {
      q: "Does LamarKerja scrape Glints / JobStreet / Indeed / Kalibrr?",
      a: "Not as live feeds. The Job Hub pulls LinkedIn guest, Dealls, Disnakerja, KarirJakarta, Karirhub, Toploker, Karirlink, Remotive, Arbeitnow, Jobicy, Himalayas, and Remote OK. The News tab uses Google News RSS (not Kompas/Detik HTML scraping). In History you may manually log applications you already sent on Glints/JobStreet — that is CRM, not scraping."
    },
    {
      q: "How does AI match my CV to a job?",
      a: "CV text is extracted on your server. Groq compares it with the job requirements, scores the match, and can draft a cover letter. The Groq key lives on the server (env/settings), not in your SMTP profile."
    },
    {
      q: "Is my CV PDF attached when applying?",
      a: "Yes. The PDF uploaded in Profile is attached to mail sent through your Gmail SMTP."
    },
    {
      q: "When is the best time to send applications?",
      a: "Weekdays Monday–Thursday, around 08:00–10:00 or 13:00–14:00, are usually easier for HR inboxes."
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Hero Header */}
      <div className="glass-panel page-hero" style={{
        padding: '32px 36px',
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(99, 102, 241, 0.12) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <BookOpen size={13} /> {lang === 'id' ? 'Panduan Lengkap' : 'Comprehensive Guide'}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {lang === 'id' ? 'Petunjuk Pemakaian & Solusi Error' : 'User Manual & Troubleshooting'}
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>
            {lang === 'id' ? 'Panduan Menggunakan ' : 'How to Use '}<span className="gradient-text">LamarKerja AI</span>
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            {lang === 'id' 
              ? 'Pelajari alur kerja melamar pekerjaan cerdas dalam hitungan detik, simulasi live coding, hingga cara memasang aplikasi di Android.'
              : 'Master smart automated job applications, live coding interview practice, and Android PWA installation in minutes.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => onNavigateTab && onNavigateTab('scanner')} 
            className="btn-primary"
            style={{ padding: '12px 20px' }}
          >
            <Sparkles size={16} /> {lang === 'id' ? 'Mulai Melamar Sekarang' : 'Start Applying Now'}
          </button>
        </div>
      </div>

      {/* Quick 4-Step Visual Workflow */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Zap size={22} color="#0EA5E9" />
          {lang === 'id' ? 'Alur Kerja 4 Langkah Praktis' : '4-Step Practical Workflow'}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: '18px' }}>
          
          <div className="glass-panel" style={{ padding: '22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '12px', right: '16px', fontSize: '2.5rem', fontWeight: 900, color: 'rgba(255, 255, 255, 0.04)' }}>01</div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <FileText size={22} color="#38BDF8" />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>
              {lang === 'id' ? '1. Buat CV AI / Unggah Profil' : '1. Build AI CV or Upload Resume'}
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {lang === 'id' 
                ? 'Gunakan tab "Buat CV AI" untuk membuat CV format STAR lolos uji ATS dan ekspor PDF A4, atau unggah berkas CV yang sudah Anda miliki.'
                : 'Use "Build AI CV" to auto-generate an ATS-compliant resume and export PDF, or upload your existing resume in the Profile tab.'}
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '12px', right: '16px', fontSize: '2.5rem', fontWeight: 900, color: 'rgba(255, 255, 255, 0.04)' }}>02</div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <FileText size={22} color="#10B981" />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>
              {lang === 'id' ? '2. Audit CV di ATS Checker' : '2. Audit CV with ATS Checker'}
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {lang === 'id'
                ? 'Scan berkas CV Anda di tab Audit CV ATS. AI akan menganalisis red flags, missing keywords, dan skor kelayakan 0-100.'
                : 'Scan your CV in the ATS tab. AI detects red flags, missing keywords, and calculates 0-100 ATS compliance score.'}
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '12px', right: '16px', fontSize: '2.5rem', fontWeight: 900, color: 'rgba(255, 255, 255, 0.04)' }}>03</div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <UploadCloud size={22} color="#818CF8" />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>
              {lang === 'id' ? '3. Scan Brosur / Jelajah Loker' : '3. Scan Flyers & Vacancies'}
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {lang === 'id'
            ? 'Drop pamflet loker ke Drop & Send untuk deteksi kontak, atau jelajah LinkedIn guest, Dealls, Disnakerja, KarirJakarta, Karirhub, Toploker, Karirlink, dan API remote (bukan Glints/JobStreet).'
            : 'Drop job posters into Drop & Send, or browse LinkedIn guest, Dealls, Disnakerja, KarirJakarta, Karirhub, Toploker, Karirlink, and remote APIs (not Glints/JobStreet).'}
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '12px', right: '16px', fontSize: '2.5rem', fontWeight: 900, color: 'rgba(255, 255, 255, 0.04)' }}>04</div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <CheckCircle2 size={22} color="#F59E0B" />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>
              {lang === 'id' ? '4. Review & Kirim (1-Klik)' : '4. 1-Click Send & Apply'}
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {lang === 'id'
                ? 'AI membuatkan surat lamaran dan pesan WhatsApp formal. Klik Kirim Lamaran untuk melamar secara instan!'
                : 'AI generates formal cover letters and WhatsApp messages. Click send to apply instantly to HR!'}
            </p>
          </div>

        </div>
      </div>

      {/* Detailed Setup Guide Section */}
      <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', color: '#38BDF8' }}>
          <Key size={22} />
          {lang === 'id' ? 'Panduan Detail Setup Gmail SMTP (Google App Password)' : 'Gmail SMTP Setup Guide (Google App Password)'}
        </h2>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          {lang === 'id'
            ? 'Agar surat keluar dari Gmail Anda, Google mewajibkan App Password 16 karakter (bukan password akun). Sandi itu disimpan di profil Anda pada PostgreSQL server ini, dipakai hanya untuk SMTP, tidak dikirim ke Groq. Jangan bagikan mesin. Lihat menu Keamanan.'
            : 'To send from your Gmail, Google requires a 16-character App Password (not your account password). It is stored on your profile in this server’s PostgreSQL, used only for SMTP, and not sent to Groq. Do not share the machine. See Security.'}
        </p>

        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid var(--border-glass)',
          borderRadius: '14px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0284C7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>1</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '2px' }}>
                {lang === 'id' ? 'Aktifkan Verifikasi 2 Langkah (2-Step Verification)' : 'Enable 2-Step Verification'}
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                {lang === 'id' ? (
                  <>Buka akun Google Anda di <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" style={{ color: '#38BDF8', textDecoration: 'underline' }}>myaccount.google.com/security</a> dan pastikan <i>Verifikasi 2 Langkah</i> sudah aktif.</>
                ) : (
                  <>Open your Google Account at <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" style={{ color: '#38BDF8', textDecoration: 'underline' }}>myaccount.google.com/security</a> and verify <i>2-Step Verification</i> is ON.</>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0284C7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>2</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '2px' }}>
                {lang === 'id' ? 'Buka Halaman Google App Passwords' : 'Open Google App Passwords Page'}
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                {lang === 'id' ? (
                  <>Kunjungi link resmi: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: '#38BDF8', textDecoration: 'underline', fontWeight: 600 }}>myaccount.google.com/apppasswords</a>.</>
                ) : (
                  <>Visit official link: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: '#38BDF8', textDecoration: 'underline', fontWeight: 600 }}>myaccount.google.com/apppasswords</a>.</>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0284C7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>3</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '2px' }}>
                {lang === 'id' ? 'Beri Nama & Buat Sandi' : 'Name & Generate Password'}
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                {lang === 'id' 
                  ? <>Ketik nama aplikasi, misalnya <b>LamarKerja</b>, lalu klik tombol biru <b>Buat (Create)</b>.</>
                  : <>Enter an app label (e.g. <b>LamarKerja</b>), then click <b>Create</b>.</>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0284C7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>4</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '2px' }}>
                {lang === 'id' ? 'Salin & Masukkan ke Menu Pengaturan Aplikasi' : 'Paste into LamarKerja Settings'}
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                {lang === 'id'
                  ? <>Salin 16 karakter sandi yang muncul di kotak kuning (contoh: <code>abcd efgh ijkl mnop</code>). Buka menu Pengaturan di LamarKerja AI, tempelkan ke kolom <b>Google App Password</b>, lalu klik <b>Test Koneksi SMTP</b>.</>
                  : <>Copy the 16-character code (e.g. <code>abcd efgh ijkl mnop</code>). Open Settings in LamarKerja AI, paste into <b>Google App Password</b>, and click <b>Test SMTP Connection</b>.</>}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onOpenSettings} className="btn-secondary" style={{ fontSize: '0.88rem' }}>
            <Key size={15} /> {lang === 'id' ? 'Buka Menu Pengaturan Sekarang' : 'Open Settings Now'}
          </button>
        </div>
      </div>

      {/* Troubleshooting & Error Anticipation Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={24} color="#F43F5E" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {lang === 'id' ? 'Kemungkinan Error & Solusi Antisipasinya (Troubleshooting)' : 'Error Diagnostics & Solutions (Troubleshooting)'}
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {troubleshootingList.map((item, idx) => {
            const isOpen = openError === idx;
            return (
              <div 
                key={idx} 
                className="glass-panel" 
                style={{ 
                  padding: '18px 24px', 
                  borderLeft: '4px solid #F43F5E',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => toggleError(idx)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertTriangle size={18} color="#FB7185" />
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.title}</span>
                    <span className="badge badge-rose" style={{ fontSize: '0.68rem' }}>{item.badge}</span>
                  </div>
                  <button style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>

                {isOpen && (
                  <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-glass)', fontSize: '0.86rem', lineHeight: '1.6' }}>
                    <div style={{ marginBottom: '10px', color: '#FDA4AF' }}>
                      <b>{lang === 'id' ? 'Penyebab:' : 'Cause:'}</b> {item.cause}
                    </div>
                    <div style={{ color: 'var(--text-main)' }}>
                      <b>{lang === 'id' ? 'Langkah Solusi:' : 'Resolution Steps:'}</b>
                      <ol style={{ paddingLeft: '20px', marginTop: '6px', color: 'var(--text-muted)' }}>
                        {item.solution.map((sol, sIdx) => (
                          <li key={sIdx} style={{ marginBottom: '4px' }}>{sol}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Frequently Asked Questions (FAQ) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HelpCircle size={24} color="#38BDF8" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {lang === 'id' ? 'Pertanyaan yang Sering Diajukan (FAQ)' : 'Frequently Asked Questions (FAQ)'}
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqList.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx} 
                className="glass-panel" 
                style={{ 
                  padding: '18px 24px', 
                  cursor: 'pointer',
                  borderLeft: '4px solid #38BDF8'
                }}
                onClick={() => toggleFaq(idx)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.q}</span>
                  <button style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>

                {isOpen && (
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-glass)', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pro Tips Card */}
      <div className="glass-panel" style={{
        padding: '24px 30px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.08))',
        borderColor: 'rgba(16, 185, 129, 0.3)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px'
      }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Lightbulb size={22} color="#34D399" />
        </div>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#34D399', marginBottom: '4px' }}>
            {lang === 'id' ? '💡 Tips Pro Agar Cepat Dipanggil Interview:' : '💡 Pro Tips for Higher Interview Conversion:'}
          </h3>
          <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', paddingLeft: '18px' }}>
            {lang === 'id' ? (
              <>
                <li>Gunakan format CV PDF yang bersih (<i>ATS-Friendly</i> tanpa layout kolom terlalu rumit).</li>
                <li>Pastikan nomor WhatsApp aktif dan bisa dihubungi untuk undangan interview.</li>
                <li>Kirim lamaran pada jam kerja aktif (pukul 08:00 - 10:00 pagi) agar email Anda berada di tumpukan teratas inbox HRD.</li>
                <li>Gunakan fitur <b>Optimalkan Profil via AI</b> di tab Profil secara berkala untuk memperbarui kata kunci keahlian Anda.</li>
              </>
            ) : (
              <>
                <li>Use clean, ATS-friendly PDF resume formats without convoluted multi-column tables.</li>
                <li>Ensure your WhatsApp number is active and reachable for interview invites.</li>
                <li>Deliver applications during peak business hours (08:00 - 10:00 AM) for top inbox placement.</li>
                <li>Regularly use the <b>Optimize Profile with AI</b> tool in your Profile tab to refresh skill keywords.</li>
              </>
            )}
          </ul>
        </div>
      </div>

    </div>
  );
}

