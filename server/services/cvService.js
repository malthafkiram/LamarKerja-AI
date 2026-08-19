import { callGroqAi } from './ai.js';

/**
 * AI CV Refiner & ATS Formatter Engine
 * Refines raw user inputs into executive-level STAR bullet points, professional summary,
 * and high-converting keyword enrichment without hallucinating dates, universities, or companies.
 * Uses automatic model fallback (Llama 3.3 70B -> Llama 3.1 8B -> Mixtral) to ensure 100% uptime.
 */
export async function refineCVWithAI(rawData) {
  const {
    target_role,
    personal_info = {},
    raw_summary = '',
    work_experiences = [],
    organizations = [],
    educations = [],
    skills = [],
    projects_certifications = []
  } = rawData;

  const systemPrompt = `Anda adalah Senior Executive Career Coach dan Ahli ATS Resume Internasional terkemuka di Indonesia.
Tugas Anda adalah memoles dan menyempurnakan data mentah CV pelamar agar 100% berstandar ATS, profesional, memukau HRD, dan bebas dari typo maupun kalimat pasif.

ATURAN ANTI-HALUSINASI KETAT:
1. DILARANG mengarang nama orang, email, nomor HP, nama perusahaan, nama universitas/sekolah, atau rentang tahun di luar yang diberikan pengguna.
2. Fokus tugas:
   - Buat Professional Summary 3-4 kalimat berbobot tinggi yang relevan untuk target "${target_role || 'Profesional'}".
   - Ubah kalimat tugas mentah pada setiap Pengalaman Kerja menjadi 3-4 poin pencapaian STAR (Action Verb + Konteks + Metrik % terukur).
   - Susun riwayat organisasi dengan fokus kepemimpinan dan koordinasi.
   - Kelompokkan keahlian menjadi 'hard_skills' dan 'soft_skills' yang relevan dengan posisi target.
   - Gunakan Bahasa Indonesia formal baku (EYD/PUEBI) yang anggun, tegas, dan 100% bebas typo.

OUTPUT WAJIB JSON MURNI:
{
  "refined_summary": "Ringkasan profesional 3-4 kalimat...",
  "refined_work_experiences": [
    {
      "company": "Nama perusahaan sesuai input",
      "role": "Jabatan sesuai input",
      "period": "Rentang waktu sesuai input",
      "location": "Lokasi jika ada",
      "bullet_points": [
        "Kata kerja aksi + tugas + hasil terukur...",
        "Kata kerja aksi + tugas + hasil terukur...",
        "Kata kerja aksi + tugas + hasil terukur..."
      ]
    }
  ],
  "refined_organizations": [
    {
      "name": "Nama organisasi sesuai input",
      "role": "Peran/Jabatan",
      "period": "Periode",
      "bullet_points": [
        "Poin inisiatif kepemimpinan..."
      ]
    }
  ],
  "refined_educations": [
    {
      "institution": "Nama institusi",
      "degree": "Gelar/Jurusan",
      "period": "Tahun masuk - lulus",
      "gpa": "IPK/Nilai jika ada",
      "highlights": "Pencapaian/fokus studi"
    }
  ],
  "refined_skills": {
    "hard_skills": ["Skill 1", "Skill 2"],
    "soft_skills": ["Komunikasi", "Problem Solving"]
  },
  "refined_projects_certifications": [
    {
      "title": "Nama sertifikasi/proyek",
      "issuer": "Penyelenggara",
      "year": "Tahun",
      "description": "Deskripsi singkat"
    }
  ]
}`;

  const userPrompt = `Data mentah pelamar:
Posisi Target: ${target_role || 'Umum'}

Data Diri:
- Nama: ${personal_info.name || ''}
- Email: ${personal_info.email || ''}
- No. HP: ${personal_info.phone || ''}
- Domisili: ${personal_info.city || ''}
- LinkedIn: ${personal_info.linkedin || ''}

Ringkasan Mentah:
${raw_summary || 'Belum ada ringkasan.'}

Riwayat Pengalaman Kerja Mentah:
${JSON.stringify(work_experiences, null, 2)}

Riwayat Organisasi Mentah:
${JSON.stringify(organizations, null, 2)}

Riwayat Pendidikan Mentah:
${JSON.stringify(educations, null, 2)}

Keahlian Mentah:
${Array.isArray(skills) ? skills.join(', ') : skills}

Sertifikasi & Proyek Mentah:
${JSON.stringify(projects_certifications, null, 2)}

Mohon transformasikan dan poles seluruh data di atas menjadi format JSON terstruktur.`;

  try {
    const rawContent = await callGroqAi({
      systemPrompt,
      userPrompt,
      jsonMode: true,
      temperature: 0.2
    });

    const parsed = JSON.parse(rawContent);
    return parsed;
  } catch (error) {
    console.error('Groq AI CV Refinement Error:', error.message);
    throw error;
  }
}
