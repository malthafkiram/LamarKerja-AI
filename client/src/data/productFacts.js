/**
 * Fakta produk yang boleh ditampilkan ke pengguna.
 * Sengaja tidak mengklaim enkripsi SMTP, SOC2, atau feed Glints/JobStreet.
 */

export const JOB_HUB_SOURCES = [
  'LinkedIn (guest API)',
  'Dealls',
  'Disnakerja',
  'KarirJakarta',
  'Karirhub Kemnaker',
  'Toploker',
  'Karirlink',
  'Remotive',
  'Arbeitnow',
  'Jobicy',
  'Himalayas',
  'Remote OK'
];

export const JOB_HUB_SOURCES_SHORT =
  'LinkedIn guest, Dealls, Disnakerja, KarirJakarta, Karirhub, Toploker, Karirlink, Remotive, Arbeitnow, Jobicy, Himalayas, Remote OK';

export const FEATURES = [
  {
    id: 'hub',
    accent: '#38BDF8',
    title: {
      id: 'Jelajah Loker (direktori multi-portal)',
      en: 'Job Hub (multi-portal directory)'
    },
    body: {
      id: 'Menghimpun lowongan dari LinkedIn guest, Dealls, Disnakerja, KarirJakarta, Karirhub, Toploker, Karirlink, plus API remote Remotive, Arbeitnow, Jobicy, Himalayas, dan Remote OK. Glints, JobStreet, Indeed, dan Kalibrr tidak di-scrape sebagai feed live. Pakai saat ingin melihat lowongan terbaru di satu tempat, lalu buka posting resmi di portal asalnya.',
      en: 'Aggregates vacancies from LinkedIn guest, Dealls, Disnakerja, KarirJakarta, Karirhub, Toploker, Karirlink, plus Remotive, Arbeitnow, Jobicy, Himalayas, and Remote OK APIs. Glints, JobStreet, Indeed, and Kalibrr are not scraped as live feeds. Use it to browse recent openings, then apply on the official posting.'
    }
  },
  {
    id: 'window',
    accent: '#7DD3FC',
    title: {
      id: 'Jendela 8 hari & retensi 18 hari',
      en: '8-day ingest & 18-day retention'
    },
    body: {
      id: 'Lowongan baru hanya diambil jika tanggal posting dalam 8 hari terakhir (selaras filter LinkedIn guest). Listing yang sudah tua dibersihkan setelah sekitar 18 hari agar direktori tidak menumpuk iklan kedaluwarsa.',
      en: 'New vacancies are ingested only if posted within the last 8 days (aligned with LinkedIn guest filters). Older listings are purged after about 18 days so the directory does not keep stale ads.'
    }
  },
  {
    id: 'globe',
    accent: '#22D3EE',
    title: {
      id: 'Globe 3D lowongan remote',
      en: '3D globe for remote jobs'
    },
    body: {
      id: 'Tampilan globe di Jelajah Loker memetakan lowongan remote/luar negeri dari Remotive, Arbeitnow, Jobicy, Himalayas, dan Remote OK. Pakai bila ingin melihat sebaran geografis; di layar kecil atau tanpa WebGL, daftar biasa tetap tersedia.',
      en: 'The Job Hub globe plots remote/overseas roles from Remotive, Arbeitnow, Jobicy, Himalayas, and Remote OK. Use it for geographic browsing; on small screens or without WebGL, the list view stays available.'
    }
  },
  {
    id: 'news',
    accent: '#FBBF24',
    title: {
      id: 'Berita loker & magang',
      en: 'Job & internship news'
    },
    body: {
      id: 'Tab Berita di Jelajah Loker menghimpun artikel dari Google News RSS (bukan scraping HTML Kompas/Detik). Ini berita rekrutmen/magang dengan tautan ke artikel — bukan kartu lamar palsu. Google News bisa delay beberapa jam.',
      en: 'The Job Hub News tab aggregates articles from Google News RSS (not Kompas/Detik HTML scraping). These are hiring/internship stories with links to the article — not fake apply cards. Google News can lag by a few hours.'
    }
  },
  {
    id: 'tracker',
    accent: '#34D399',
    title: {
      id: 'Riwayat = CRM lamaran',
      en: 'History = application CRM'
    },
    body: {
      id: 'Bukan feed portal. Anda mencatat sendiri lamaran (manual add), mengatur pipeline status (draf, terkirim, interview, offering, ditolak, diterima), dan menandai follow-up jika masih “Terkirim” lebih dari 5 hari. Tombol “Catat sebagai dilamar” di kartu loker juga masuk ke sini. Boleh mencatat lamaran yang Anda kirim di Glints/JobStreet — itu catatan Anda, bukan scraping live.',
      en: 'Not a job feed. You log applications yourself (manual add), move a status pipeline (draft, sent, interview, offering, rejected, accepted), and get a follow-up flag if still “Sent” after 5 days. “Mark as applied” on job cards lands here too. Logging a Glints/JobStreet apply is your CRM note — not a live scrape.'
    }
  },
  {
    id: 'cv',
    accent: '#818CF8',
    title: {
      id: 'Buat CV AI & PDF ATS',
      en: 'AI CV builder & ATS PDF'
    },
    body: {
      id: 'Isi pengalaman/pendidikan apa adanya. Groq merapikan bullet STAR + metrik, lalu Anda ekspor PDF A4 yang lebih ramah parser ATS. Pakai sebelum melamar, atau simpan hasilnya ke Profil.',
      en: 'Enter raw experience and education. Groq polishes STAR bullets with metrics, then you export an A4 PDF that is easier for ATS parsers. Use it before applying, or save the result to Profile.'
    }
  },
  {
    id: 'ats',
    accent: '#A78BFA',
    title: {
      id: 'Audit CV ATS',
      en: 'ATS resume audit'
    },
    body: {
      id: 'Memindai CV terhadap posisi target: skor 0–100, red flag format, kata kunci yang hilang, dan rewriter STAR. Pakai untuk menguji CV yang sama berkali-kali sebelum dikirim ke HRD.',
      en: 'Scans a CV against a target role: 0–100 score, format red flags, missing keywords, and STAR rewrites. Use it to stress-test the same resume before sending it to HR.'
    }
  },
  {
    id: 'dropsend',
    accent: '#FBBF24',
    title: {
      id: 'Drop & Send (OCR brosur)',
      en: 'Drop & Send (flyer OCR)'
    },
    body: {
      id: 'Unggah/paste screenshot atau PDF pamflet. OCR + Groq mengekstrak posisi, email HRD, dan WA, lalu menyusun surat lamaran. Kirim lewat Gmail SMTP Anda (App Password), bukan lewat Groq. Wajib cek ulang alamat email sebelum klik kirim.',
      en: 'Upload or paste a flyer screenshot/PDF. OCR + Groq extract the role, HR email, and WhatsApp, then draft a cover letter. Send goes through your Gmail SMTP (App Password), not Groq. Always re-check the address before sending.'
    }
  },
  {
    id: 'smtp',
    accent: '#F59E0B',
    title: {
      id: 'Gmail SMTP pribadi',
      en: 'Personal Gmail SMTP'
    },
    body: {
      id: 'Email lamaran keluar dari Gmail Anda sendiri (smtp.gmail.com). Simpan Google App Password 16 karakter di profil — jangan password akun Google. Sandi itu dipakai server Anda hanya untuk mengirim surat, tidak dibagikan ke pengguna lain, dan tidak dikirim ke Groq.',
      en: 'Application mail is sent from your own Gmail (smtp.gmail.com). Store a 16-character Google App Password on your profile — not your Google account password. The server uses it only to send mail; it is not shared with other users and is not sent to Groq.'
    }
  },
  {
    id: 'cover',
    accent: '#38BDF8',
    title: {
      id: 'Cover letter AI',
      en: 'AI cover letter'
    },
    body: {
      id: 'Menyusun surat lamaran formal (ID/EN) dari CV + deskripsi loker. Pakai dari kartu lowongan atau Drop & Send, lalu sunting sebelum dikirim agar tetap suara Anda.',
      en: 'Drafts a formal ID/EN cover letter from your CV plus the job text. Use it from a job card or Drop & Send, then edit so it still sounds like you.'
    }
  },
  {
    id: 'wa',
    accent: '#34D399',
    title: {
      id: 'Lamar via WhatsApp',
      en: 'Apply via WhatsApp'
    },
    body: {
      id: 'Menyusun pesan WA formal dan membuka wa.me ke nomor HRD yang terdeteksi. Pakai jika brosur/loker mencantumkan WhatsApp, bukan email.',
      en: 'Drafts a formal WhatsApp message and opens wa.me to a detected HR number. Use it when the flyer or posting lists WhatsApp instead of email.'
    }
  },
  {
    id: 'livecode',
    accent: '#FB923C',
    title: {
      id: 'Live Code Arena',
      en: 'Live Code Arena'
    },
    body: {
      id: 'Editor JavaScript di browser: soal pola, struktur data, async, plus unit test dan rapor Groq. Pakai untuk latihan live coding sebelum interview teknis.',
      en: 'In-browser JavaScript editor: pattern, data-structure, and async drills with unit tests and a Groq scorecard. Use it to rehearse live coding before a technical interview.'
    }
  },
  {
    id: 'interview',
    accent: '#F472B6',
    title: {
      id: 'Simulasi wawancara AI',
      en: 'AI interview simulator'
    },
    body: {
      id: 'Latihan tanya-jawab dengan persona rekruter Groq (termasuk input suara jika browser mendukung). Pakai dari Riwayat, inbox, atau kartu loker sebelum hari H.',
      en: 'Q&A practice with a Groq recruiter persona (voice input if the browser supports it). Launch it from History, inbox, or a job card before interview day.'
    }
  },
  {
    id: 'salary',
    accent: '#4ADE80',
    title: {
      id: 'Insight gaji & negosiasi',
      en: 'Salary insight & negotiation'
    },
    body: {
      id: 'Perkiraan rentang pasar Indonesia berdasarkan posisi/kota plus skrip negosiasi. Ini bantuan riset Groq, bukan data gaji resmi BPS — pakai sebagai bekal, bukan angka kontrak.',
      en: 'Estimated Indonesian market ranges by role/city plus a negotiation script. This is Groq research assistance, not official salary data — use it as prep, not a contract number.'
    }
  },
  {
    id: 'scam',
    accent: '#F87171',
    title: {
      id: 'Anti-scam (deteksi loker palsu)',
      en: 'Anti-scam (fake-job check)'
    },
    body: {
      id: 'Mengaudit teks/pamflet untuk modus umum: biaya pemberangkatan, domain email aneh, janji gaji tidak wajar. Pakai sebelum transfer uang atau kirim data sensitif. Bukan jaminan hukum.',
      en: 'Audits flyer/job text for common scams: travel fees, odd email domains, unrealistic pay. Use it before sending money or sensitive data. Not a legal guarantee.'
    }
  },
  {
    id: 'intel',
    accent: '#94A3B8',
    title: {
      id: 'Bedah perusahaan',
      en: 'Company intel'
    },
    body: {
      id: 'Ringkasan model bisnis, budaya, dan sudut wawancara untuk perusahaan di kartu loker. Pakai semalam sebelum interview; selalu cocokkan dengan sumber resmi perusahaan.',
      en: 'A short brief on business model, culture, and interview angles for the company on a job card. Use it the night before; always cross-check official sources.'
    }
  },
  {
    id: 'roadmap',
    accent: '#2DD4BF',
    title: {
      id: 'Roadmap karir & skill gap',
      en: 'Career roadmap & skill gap'
    },
    body: {
      id: 'Membandingkan profil Anda dengan lowongan aktif di hub, lalu mengusulkan skill yang kurang dan kurikulum belajar bertahap. Ada di tab Profil.',
      en: 'Compares your profile with active hub vacancies, then suggests missing skills and a staged learning path. Lives on the Profile tab.'
    }
  },
  {
    id: 'pitch',
    accent: '#C084FC',
    title: {
      id: 'Pitch proyek / GitHub',
      en: 'Project / GitHub pitch'
    },
    body: {
      id: 'Mengubah repo atau proyek jadi elevator pitch 30 detik, cerita STAR, dan pertanyaan teknis yang mungkin muncul. Pakai di Profil sebelum interview.',
      en: 'Turns a repo or project into a 30-second pitch, STAR story, and likely technical questions. Use it from Profile before interviews.'
    }
  },
  {
    id: 'hunter',
    accent: '#38BDF8',
    title: {
      id: 'Auto-Hunter',
      en: 'Auto-Hunter'
    },
    body: {
      id: 'Memindai lowongan dari sumber hub yang sama (bukan Glints/JobStreet), menghitung kecocokan CV, dan dapat mengirim email jika SMTP + kuota harian siap. Tetap tinjau draf — ini otomasi, bukan magang HRD.',
      en: 'Scans vacancies from the same hub sources (not Glints/JobStreet), scores CV fit, and can send mail if SMTP and the daily quota are ready. Always review drafts — automation, not an HR intern.'
    }
  },
  {
    id: 'inbox',
    accent: '#FBBF24',
    title: {
      id: 'Kotak masuk HRD',
      en: 'HR inbox'
    },
    body: {
      id: 'Lonceng notifikasi untuk catatan/pesan terkait lamaran di akun Anda, plus jalan pintas ke simulasi wawancara. Bukan Gmail inbox penuh.',
      en: 'A notification bell for application-related notes in your account, plus a shortcut into interview practice. Not a full Gmail inbox.'
    }
  },
  {
    id: 'profile',
    accent: '#E2E8F0',
    title: {
      id: 'Profil, CV PDF, dan keahlian',
      en: 'Profile, CV PDF, and skills'
    },
    body: {
      id: 'Data diri, skill, pengalaman, dan berkas CV tersimpan di PostgreSQL pada server/database yang menjalankan aplikasi ini (milik Anda jika self-host). Dipakai untuk personalisasi surat dan lampiran email.',
      en: 'Bio, skills, experience, and CV files live in PostgreSQL on the server/database running this app (yours if self-hosted). Used to personalize letters and attach the resume.'
    }
  },
  {
    id: 'groq',
    accent: '#818CF8',
    title: {
      id: 'Mesin AI Groq',
      en: 'Groq AI engine'
    },
    body: {
      id: 'CV, ATS, interview, cover letter, anti-scam, livecode, gaji, dan sejenisnya memanggil API Groq. Kunci Groq ada di pengaturan server (env / tabel settings, diubah admin). Teks CV/loker dikirim ke Groq agar model bisa menjawab; App Password Gmail tidak.',
      en: 'CV, ATS, interview, cover letter, anti-scam, livecode, salary, and similar tools call Groq. The Groq key lives in server settings (env / settings table, admin-changed). CV/job text is sent to Groq so the model can answer; your Gmail App Password is not.'
    }
  },
  {
    id: 'pwa',
    accent: '#67E8F9',
    title: {
      id: 'Pasang di Android (PWA)',
      en: 'Install on Android (PWA)'
    },
    body: {
      id: 'Bisa ditambahkan ke layar utama lewat Chrome. Ini aplikasi web, bukan listing Play Store.',
      en: 'Can be added to the home screen via Chrome. This is a web app, not a Play Store listing.'
    }
  }
];
