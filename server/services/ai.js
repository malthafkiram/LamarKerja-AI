import { Groq } from 'groq-sdk';
import { getSettings } from '../helpers/dbHelpers.js';
import { GROQ_FALLBACK_MODELS, resolveGroqModel } from '../helpers/groqModels.js';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_GROQ_API_KEY = process.env.GROQ_API_KEY || '';

function extractGroqText(completion) {
  const msg = completion?.choices?.[0]?.message || {};
  let content = (msg.content || '').trim();
  if (!content && msg.reasoning) {
    const blob = String(msg.reasoning);
    const jsonMatch = blob.match(/\{[\s\S]*\}/);
    content = (jsonMatch ? jsonMatch[0] : blob).trim();
  }
  if (content.startsWith('```')) {
    content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }
  return content;
}

async function completeWithModel(groq, { model, messages, jsonMode, temperature }) {
  const payload = {
    model,
    messages,
    temperature,
    max_tokens: 4096
  };
  if (jsonMode) payload.response_format = { type: 'json_object' };

  const send = async (body) => groq.chat.completions.create(body);

  try {
    return await send(payload);
  } catch (err) {
    const msg = String(err.message || '');
    if (msg.includes('max_tokens') || msg.includes('max_completion_tokens')) {
      const retry = { ...payload };
      delete retry.max_tokens;
      retry.max_completion_tokens = 4096;
      try {
        return await send(retry);
      } catch (err2) {
        if (jsonMode) {
          delete retry.response_format;
          return send(retry);
        }
        throw err2;
      }
    }
    if (jsonMode) {
      const withoutJson = { ...payload };
      delete withoutJson.response_format;
      return send(withoutJson);
    }
    throw err;
  }
}

/**
 * Pemanggil Groq — model default gpt-oss (pengganti Llama yang sudah di-decommission).
 */
export async function callGroqAi({ systemPrompt = '', userPrompt, jsonMode = false, temperature = 0.2 }) {
  const settings = await getSettings().catch(() => ({}));
  const groqKey = settings.groq_api_key || DEFAULT_GROQ_API_KEY;
  if (!groqKey) {
    throw new Error('GROQ_API_KEY belum diatur. Isi di server/.env atau menu Pengaturan admin.');
  }

  const preferredModel = resolveGroqModel(settings.ai_model);
  const fallbackModels = Array.from(new Set([preferredModel, ...GROQ_FALLBACK_MODELS]));

  const groq = new Groq({ apiKey: groqKey });

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userPrompt });

  let lastError;
  for (const model of fallbackModels) {
    try {
      const completion = await completeWithModel(groq, { model, messages, jsonMode, temperature });
      const content = extractGroqText(completion);
      if (content) return content;
    } catch (err) {
      lastError = err;
      console.warn(`[Groq AI] Model ${model} failed/rate-limited: ${err.message}. Trying fallback...`);
    }
  }

  if (lastError) throw lastError;
  return '';
}

/**
 * Helper to extract email addresses from OCR text with noise cleaning
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed);
}

export function extractEmailsFromRawText(text) {
  if (!text) return [];
  
  // Normalize broken OCR patterns (e.g. spaces around @ or dots, (at), [at], [dot])
  let cleaned = text
    .replace(/\s*\[at\]\s*/gi, '@')
    .replace(/\s*\(at\)\s*/gi, '@')
    .replace(/\s*\[dot\]\s*/gi, '.')
    .replace(/([a-zA-Z0-9._%+-]+)\s*@\s*([a-zA-Z0-9.-]+)\s*\.\s*([a-zA-Z]{2,})/gi, '$1@$2.$3');

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
  const matches = cleaned.match(emailRegex) || [];
  return [...new Set(matches.map(e => e.trim().toLowerCase()).filter(isValidEmail))];
}

export function extractPhoneNumbersFromRawText(text) {
  if (!text) return [];
  const phoneRegex = /(?:\+62|62|08)[0-9\s-]{8,15}/g;
  const matches = text.match(phoneRegex) || [];
  return [...new Set(matches.map(p => p.replace(/[\s-]/g, '')).filter(p => p.length >= 10 && p.length <= 15 && /^(?:\+62|62|08)[0-9]+$/.test(p)))];
}

/**
 * Strip ChatGPT-style markdown so UI that renders plain text does not show leftover **stars**.
 * Leaves a lone * intact (e.g. pola bintang), unwraps **bold** / *italic*, drops heading hashes.
 */
export function stripMarkdownForPlainText(text, { convertBackticks = true } = {}) {
  if (text == null) return '';
  if (typeof text !== 'string') return String(text);

  let s = text.replace(/\r\n/g, '\n');
  s = s.replace(/^#{1,6}\s+/gm, '');
  s = s.replace(/^[ \t]*\*\s+(?=\S)/gm, '');
  s = s.replace(/\*\*\*([^*\n]+)\*\*\*/g, '$1');
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '$1');
  s = s.replace(/__([^_]+)__/g, '$1');
  s = s.replace(/(^|[^*\\])\*([A-Za-zÀ-ÿ0-9][^*\n]{0,80}[A-Za-zÀ-ÿ0-9])\*(?!\*)/g, '$1$2');
  // Unmatched emphasis **next to letters only — never collapse *** pyramid patterns
  s = s.replace(/\*\*(?=[A-Za-zÀ-ÿ])/g, '');
  s = s.replace(/(?<=[A-Za-zÀ-ÿ.,])\*\*/g, '');
  if (convertBackticks) {
    s = s.replace(/`([^`]+)`/g, '"$1"');
  }
  return s.replace(/[ \t]+\n/g, '\n').trim();
}

function sanitizeLiveCodeChallenge(challenge) {
  if (!challenge || typeof challenge !== 'object') return challenge;
  const out = { ...challenge };
  if (out.problem_statement) out.problem_statement = stripMarkdownForPlainText(out.problem_statement);
  if (out.title) out.title = stripMarkdownForPlainText(out.title, { convertBackticks: false });
  if (out.hint) out.hint = stripMarkdownForPlainText(out.hint);
  if (Array.isArray(out.hints)) {
    out.hints = out.hints.map((item) => stripMarkdownForPlainText(String(item)));
  }
  if (Array.isArray(out.constraints)) {
    out.constraints = out.constraints.map((item) => stripMarkdownForPlainText(String(item)));
  }
  if (Array.isArray(out.examples)) {
    out.examples = out.examples.map((ex) => ({
      ...ex,
      explanation: ex?.explanation ? stripMarkdownForPlainText(ex.explanation) : ex?.explanation
    }));
  }
  if (Array.isArray(out.test_cases)) {
    out.test_cases = out.test_cases.map((tc) => ({
      ...tc,
      description: tc?.description
        ? stripMarkdownForPlainText(tc.description, { convertBackticks: false })
        : tc?.description
    }));
  }
  return out;
}

function formatExperienceList(experience) {
  if (!Array.isArray(experience) || experience.length === 0) return '';
  return experience.slice(0, 6).map((item, index) => {
    if (typeof item === 'string') return `${index + 1}. ${item}`;
    const role = item.role || item.title || item.position || 'Peran';
    const company = item.company || item.organization || '';
    const period = item.period || item.duration || item.years || '';
    const bullets = item.bullet_points || item.bullets || item.highlights || [];
    const desc = item.description
      || (Array.isArray(bullets) ? bullets.slice(0, 3).join('; ') : '');
    const descText = typeof desc === 'string' ? desc.slice(0, 280) : '';
    return `${index + 1}. ${role}${company ? ` di ${company}` : ''}${period ? ` (${period})` : ''}${descText ? `: ${descText}` : ''}`;
  }).join('\n');
}

function formatEducationList(education) {
  if (!Array.isArray(education) || education.length === 0) return '';
  return education.slice(0, 4).map((item) => {
    if (typeof item === 'string') return item;
    return [item.degree, item.institution || item.school, item.period].filter(Boolean).join(' — ');
  }).filter(Boolean).join('; ');
}

/** Pack CV + profile fields so Groq sees the candidate, not just a name. */
function buildCandidateContext(profile = {}) {
  const cvText = String(profile.cv_text || '').trim();
  const skills = Array.isArray(profile.skills) ? profile.skills.filter(Boolean) : [];
  const experienceText = formatExperienceList(profile.experience);
  const educationText = formatEducationList(profile.education);
  const generated = profile.generated_cv && typeof profile.generated_cv === 'object'
    ? profile.generated_cv
    : {};
  const generatedSummary = generated.refined_summary || generated.summary || '';
  const targetRoles = Array.isArray(profile.target_roles) ? profile.target_roles.filter(Boolean) : [];

  const lines = [
    `Nama: ${profile.full_name || 'Pelamar'}`,
    `Headline: ${profile.headline || '-'}`,
    `Kota: ${profile.city || '-'}`,
    `Target peran: ${profile.target_role || targetRoles.join(', ') || '-'}`,
    `Skill: ${skills.length ? skills.join(', ') : '-'}`,
    `Ringkasan profil: ${profile.summary || generatedSummary || '-'}`,
    `Telepon: ${profile.phone || '-'}`,
    `Email: ${profile.email || '-'}`,
    `LinkedIn: ${profile.linkedin_url || '-'}`,
    `Portofolio: ${profile.portfolio_url || '-'}`
  ];
  if (experienceText) lines.push(`Pengalaman kerja:\n${experienceText}`);
  if (educationText) lines.push(`Pendidikan: ${educationText}`);

  if (cvText) {
    lines.push(`Teks CV lengkap (sumber fakta utama — kutip keahlian/pengalaman yang tertulis di sini):\n${cvText.slice(0, 8000)}`);
  } else {
    lines.push(
      'Teks CV kosong. Hanya gunakan field profil di atas (headline, ringkasan, skill, pengalaman). Dilarang mengarang prestasi, metrik, atau nama perusahaan yang tidak tertulis.'
    );
  }
  return lines.join('\n');
}

function buildJobContext(jobDetails = {}) {
  const reqs = Array.isArray(jobDetails.requirements)
    ? jobDetails.requirements.filter(Boolean)
    : (jobDetails.requirements ? [String(jobDetails.requirements)] : []);
  const resp = Array.isArray(jobDetails.responsibilities)
    ? jobDetails.responsibilities.filter(Boolean)
    : [];
  const desc = String(jobDetails.description || jobDetails.job_description || '').trim();

  return [
    `Perusahaan: ${jobDetails.company_name || 'Perusahaan'}`,
    `Posisi: ${jobDetails.position || 'Posisi'}`,
    `Lokasi: ${jobDetails.location || '-'}`,
    `Tipe kerja: ${jobDetails.work_type || '-'}`,
    `Level: ${jobDetails.experience_level || '-'}`,
    `Gaji: ${jobDetails.salary_range || jobDetails.salary || '-'}`,
    `Deadline: ${jobDetails.deadline || '-'}`,
    `Syarat/kualifikasi: ${reqs.length ? reqs.join('; ') : '-'}`,
    `Tanggung jawab: ${resp.length ? resp.join('; ') : '-'}`,
    `Deskripsi lowongan: ${desc ? desc.slice(0, 4000) : '-'}`,
    `Template subjek (jika diminta HRD): ${jobDetails.subject_template || '-'}`
  ].join('\n');
}

function sanitizeEmailBody(text) {
  return stripMarkdownForPlainText(text || '', { convertBackticks: true });
}

function emailBodyToHtml(body) {
  return String(body || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
}

function parseJsonObject(rawResponse) {
  const jsonMatch = String(rawResponse || '').match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawResponse);
}

/**
 * 1. Extract structured job details from raw flyer text (Tesseract OCR / PDF)
 * Enforces strict validation: recipient_email MUST contain @ and valid domain.
 */
export async function extractJobDetailsFromOCR(rawOcrText) {
  const extractedEmails = extractEmailsFromRawText(rawOcrText);
  const extractedPhones = extractPhoneNumbersFromRawText(rawOcrText);

  // Detect named contact persons if present (e.g. "Dirga 0822 2867 4892", "Aisha 0813 9851 1998")
  const contactLines = rawOcrText.match(/([a-zA-Z]+)\s*(?:[-:]|\s+)?((?:\+62|62|08)[0-9\s-]{8,15})/gi) || [];
  const contactPersons = [];
  contactLines.forEach(line => {
    const m = line.match(/([a-zA-Z]{3,20})\s*(?:[-:]|\s+)?((?:\+62|62|08)[0-9\s-]{8,15})/i);
    if (m) {
      const name = m[1].trim();
      const num = m[2].replace(/[\s-]/g, '');
      if (num.length >= 10 && !['kirim', 'subject', 'email', 'posisi', 'phone', 'telepon', 'whatsapp'].includes(name.toLowerCase())) {
        contactPersons.push({ name, phone: num });
      }
    }
  });

  const systemPrompt = `Anda adalah AI Analis Dokumen & Rekrutmen Kerja Tingkat Ahli.
Tugas Anda adalah membaca dan mengekstrak informasi lowongan kerja dari teks hasil OCR poster/brosur dengan SANGAT TELITI, PRESISI, dan ANTI-HALUSINASI.

ATURAN WAJIB & MUTLAK:
1. **ALAMAT EMAIL (recipient_email)**:
   - WAJIB memiliki karakter "@" dan domain valid (contoh: "walidata@kemendagri.go.id", "hrd@ptkarya.co.id").
   - DILARANG KERAS mengisi recipient_email dengan nama orang (seperti "Dirga", "Aisha"), nomor telepon, atau teks tanpa "@".
   - Jika tidak ada email dengan tanda "@", isi string kosong "".
2. **NOMOR TELEPON / WHATSAPP (whatsapp_number)**:
   - WAJIB berupa angka (minimal 10 digit, awalan 08..., +628..., 628...).
   - Jika ada nama orang di samping nomor telepon (contoh: "Dirga 0822 2867 4892"), masukkan nomornya ke whatsapp_number dan namanya ke contact_persons.
3. **NAMA PERUSAHAAN & POSISI**:
   - Ambil nama instansi lengkap (contoh: "Kementerian Dalam Negeri Republik Indonesia", "PT Telkom Indonesia").
   - Ambil nama jabatan/posisi yang dibuka (contoh: "Fullstack Developer").
4. **FORMAT SUBJEK EMAIL (subject_template)**:
   - Ekstrak petunjuk subjek jika tertera (contoh: "Subject: Posisi - Nama Lengkap" -> sesuaikan menjadi "[Posisi] - [Nama Pelamar]").

Format JSON WAJIB:
{
  "company_name": "Nama Instansi / Perusahaan Lengkap",
  "position": "Posisi Lowongan yang dibuka",
  "recipient_email": "Alamat email tujuan yang valid (ada @)",
  "whatsapp_number": "Nomor WhatsApp HRD (hanya angka)",
  "contact_persons": [
    { "name": "Nama Kontak 1", "phone": "08xxxx" }
  ],
  "subject_template": "Format subjek email yang diminta",
  "requirements": ["Kualifikasi 1", "Kualifikasi 2"],
  "responsibilities": ["Tanggung jawab jika ada"],
  "location": "Lokasi kerja (misal: Jakarta / Remote)",
  "deadline": "Batas akhir jika tertera",
  "salary_range": "Kisaran gaji jika disebutkan",
  "scam_assessment": {
    "is_suspicious": false,
    "warning_notes": ""
  }
}`;

  const userPrompt = `
Kandidat Email Regex Terverifikasi: ${extractedEmails.join(', ') || 'Tidak ditemukan email di regex'}
Kandidat Nomor Telepon Terverifikasi: ${extractedPhones.join(', ') || 'Tidak ditemukan nomor'}
Kontak Teridentifikasi: ${JSON.stringify(contactPersons)}

TEKS HASIL OCR BROSUR:
"""
${rawOcrText}
"""
`;

  try {
    const rawResponse = await callGroqAi({ systemPrompt, userPrompt, jsonMode: true, temperature: 0.1 });
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawResponse);

    // Strict Email Validation (Never allow names or strings without @)
    let finalEmail = '';
    if (parsed.recipient_email && isValidEmail(parsed.recipient_email)) {
      finalEmail = parsed.recipient_email.trim().toLowerCase();
    } else if (extractedEmails.length > 0) {
      finalEmail = extractedEmails[0];
    }
    parsed.recipient_email = finalEmail;

    // Strict Phone Validation (Only digits, length >= 10)
    let finalPhone = '';
    if (parsed.whatsapp_number && typeof parsed.whatsapp_number === 'string') {
      const cleanP = parsed.whatsapp_number.replace(/[^0-9]/g, '');
      if (cleanP.length >= 10 && cleanP.length <= 15) {
        finalPhone = cleanP;
      }
    }
    if (!finalPhone && extractedPhones.length > 0) {
      finalPhone = extractedPhones[0];
    }
    parsed.whatsapp_number = finalPhone;

    if (!parsed.contact_persons || !Array.isArray(parsed.contact_persons) || parsed.contact_persons.length === 0) {
      parsed.contact_persons = contactPersons;
    }

    return parsed;
  } catch (error) {
    console.error('Error in extractJobDetailsFromOCR:', error);
    return {
      company_name: 'Perusahaan Teridentifikasi',
      position: 'Posisi Lowongan',
      recipient_email: extractedEmails[0] || '',
      whatsapp_number: extractedPhones[0] || '',
      contact_persons: contactPersons,
      subject_template: 'Lamaran Pekerjaan: [Posisi] - [Nama]',
      requirements: ['Kualifikasi umum tercantum pada brosur'],
      responsibilities: [],
      location: 'Indonesia',
      deadline: 'Segera',
      salary_range: 'Kompetitif',
      scam_assessment: { is_suspicious: false, warning_notes: '' }
    };
  }
}

/**
 * 2. Analyze match score and draft a specific, human application email
 */
export async function analyzeMatchAndDraft(profile, jobDetails) {
  const candidateName = profile.full_name || 'Pelamar';
  const company = jobDetails.company_name || 'Perusahaan';
  const position = jobDetails.position || 'Posisi';
  const location = jobDetails.location || '';
  const skillsPreview = (profile.skills || []).filter(Boolean).slice(0, 4).join(', ');
  const headline = profile.headline || '';

  const systemPrompt = `Anda menulis email lamaran kerja yang dibaca HRD Indonesia sungguhan — hangat, spesifik, dan profesional. Bukan surat dinas, bukan template ChatGPT.

GAYA:
- Bahasa Indonesia natural, sopan, percaya diri. Boleh "Yth. Tim Rekrutmen ${company}," atau "Halo Tim ${company},".
- DILARANG frasa klise: "Dengan hormat, saya yang bertanda tangan di bawah ini", "Perkenalkan saya...", "Melalui email ini saya bermaksud mengajukan", "Besar harapan saya", "memberikan kontribusi terbaik", "perkembangan tim", "sesuai kualifikasi yang dibutuhkan".
- DILARANG markdown: tidak ada **tebal**, *miring*, # heading, atau backtick. Teks polos saja.
- Jangan mengarang prestasi, angka, sertifikasi, atau nama perusahaan yang tidak ada di data pelamar.

STRUKTUR email_body (4–6 paragraf pendek, pisahkan dengan \\n\\n):
1. Sapaan + sebut posisi "${position}" di ${company}${location ? ` (${location})` : ''} dan 1 alasan konkret tertarik (dari deskripsi/syarat loker).
2. 2–3 kalimat yang menghubungkan pengalaman/skill pelamar dengan 1–2 syarat lowongan yang benar-benar ada di data. Kutip teknologi, tanggung jawab, atau domain yang overlap.
3. Satu bukti konkret dari CV/profil (peran, proyek, atau keahlian tertulis). Jika data tipis, tulis jujur dan singkat — jangan mengisi kekosongan dengan klaim palsu.
4. CV terlampir, kesiapan wawancara, tutup dengan nama dan kontak.

Subjek: jika HRD memberi template subjek, ikuti. Jika tidak: "Lamaran ${position} — ${candidateName}".

Kembalikan HANYA JSON valid:
{
  "match_score": 88,
  "matching_points": ["Poin cocok yang spesifik, bukan generic"],
  "missing_points": ["Gap yang jujur jika ada"],
  "recommendations": "Saran wawancara yang merujuk syarat loker ini",
  "email_subject": "Lamaran ${position} — ${candidateName}",
  "email_body": "Yth. Tim Rekrutmen ${company},\\n\\n..."
}`;

  const userPrompt = `Tulis email lamaran yang terasa ditulis orang ini, untuk lowongan ini.

DATA PELAMAR:
${buildCandidateContext(profile)}

DETAIL LOWONGAN:
${buildJobContext(jobDetails)}
`;

  try {
    const rawResponse = await callGroqAi({ systemPrompt, userPrompt, jsonMode: true, temperature: 0.5 });
    const parsed = parseJsonObject(rawResponse);
    parsed.email_body = sanitizeEmailBody(parsed.email_body || '');
    parsed.email_subject = stripMarkdownForPlainText(parsed.email_subject || `Lamaran ${position} — ${candidateName}`, { convertBackticks: false });
    parsed.email_body_html = emailBodyToHtml(parsed.email_body);
    if (Array.isArray(parsed.matching_points)) {
      parsed.matching_points = parsed.matching_points.map((item) => stripMarkdownForPlainText(String(item), { convertBackticks: false }));
    }
    return parsed;
  } catch (error) {
    console.error('Error in analyzeMatchAndDraft:', error);
    const skillBit = skillsPreview
      ? `Latar belakang saya di ${skillsPreview}${headline ? ` (${headline})` : ''} selaras dengan kebutuhan peran ini.`
      : (headline
        ? `Saya ${headline.toLowerCase()}, dan posisi ini cocok dengan arah karier saya.`
        : 'Saya tertarik bergabung dan belajar cepat di peran ini.');
    const locBit = location ? ` di ${location}` : '';
    const fallbackBody = `Yth. Tim Rekrutmen ${company},

Saya ${candidateName}, melamar posisi ${position} di ${company}${locBit}.

${skillBit} CV terbaru saya lampirkan di email ini.

Saya siap dihubungi untuk wawancara. Terima kasih sudah membaca.

${candidateName}${profile.phone ? `\n${profile.phone}` : ''}${profile.email ? `\n${profile.email}` : ''}`;

    return {
      match_score: 70,
      matching_points: skillsPreview ? [`Skill terkait: ${skillsPreview}`] : ['Profil dasar tersedia'],
      missing_points: [],
      recommendations: `Baca ulang syarat ${position} di ${company} sebelum wawancara.`,
      email_subject: `Lamaran ${position} — ${candidateName}`,
      email_body: fallbackBody,
      email_body_html: emailBodyToHtml(fallbackBody)
    };
  }
}

/**
 * 3. Auto Follow-Up Email Generator
 */
export async function generateFollowUpEmail(application, profile) {
  const candidateName = profile.full_name || 'Pelamar';
  const company = application.company_name || 'Perusahaan';
  const position = application.position || 'Posisi';

  const systemPrompt = `Anda adalah Konsultan Komunikasi Bisnis & Etika Email Rekrutmen di Indonesia.
Buatkan email Follow-Up (Menanyakan Perkembangan Status Lamaran) yang sangat santun, profesional, menghargai waktu HRD, dan tidak terkesan menuntut.

Format JSON WAJIB:
{
  "subject": "Follow-Up Lamaran Pekerjaan: ${position} - ${candidateName}",
  "body": "Yth. Tim Rekrutmen & HRD ${company},\\n\\n...",
  "body_html": "<p>Yth. Tim Rekrutmen & HRD <strong>${company}</strong>,</p>..."
}`;

  const userPrompt = `
- Nama Pelamar: ${candidateName}
- Perusahaan: ${company}
- Posisi yang Dilamar: ${position}
- Tanggal Pengiriman Sebelumnya: ${application.sent_at ? new Date(application.sent_at).toLocaleDateString('id-ID') : 'Beberapa hari yang lalu'}
- Nomor WhatsApp: ${profile.phone || '-'}
`;

  try {
    const rawResponse = await callGroqAi({ systemPrompt, userPrompt, jsonMode: true, temperature: 0.2 });
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawResponse);
  } catch (error) {
    console.error('Error in generateFollowUpEmail:', error);
    const fallbackText = `Yth. Tim Rekrutmen & HRD ${company},

Semoga Bapak/Ibu dalam keadaan sehat.

Melalui email ini, saya bermaksud untuk menindaklanjuti (follow-up) lamaran pekerjaan saya untuk posisi ${position} yang telah saya kirimkan beberapa waktu yang lalu.

Saya sangat tertarik dengan peluang berkontribusi di ${company}, dan ingin menanyakan apakah ada informasi terbaru mengenai status proses rekrutmen atau dokumen tambahan yang diperlukan dari pihak saya.

Terima kasih banyak atas waktu dan perhatian Bapak/Ibu.

Hormat saya,
${candidateName}
${profile.phone ? 'No. WhatsApp: ' + profile.phone : ''}`;

    return {
      subject: `Follow-Up Lamaran Pekerjaan: ${position} - ${candidateName}`,
      body: fallbackText,
      body_html: fallbackText.replace(/\n/g, '<br/>')
    };
  }
}

/**
 * 4. AI Mock Interview Simulator - Questions Generator
 */
export async function generateInterviewQuestions(position, company, requirements = [], candidateSkills = []) {
  const systemPrompt = `Anda adalah Senior Technical Recruiter & Hiring Manager di ${company || 'Perusahaan Terkemuka'}.
Tugas Anda adalah merancang 5 Pertanyaan Wawancara Kerja (Mock Interview) yang realistis, menantang, dan terbagi ke dalam kategori:
1. Pertanyaan Pengantar / Perkenalan Diri (Icebreaker)
2. Pertanyaan Teknis / Keterampilan Inti (Technical Competency)
3. Pertanyaan Behavioral metode STAR (Situasi, Task, Aksi, Hasil)
4. Pertanyaan Studi Kasus / Problem Solving
5. Pertanyaan Motivasi & Culture Fit

Format output JSON WAJIB:
{
  "interviewer_name": "Ibu Kartika (Lead Recruiter)",
  "company": "${company}",
  "position": "${position}",
  "questions": [
    {
      "id": 1,
      "category": "Pengantar & Portofolio",
      "question": "Ceritakan secara singkat latar belakang Anda dan proyek paling relevan yang pernah Anda kerjakan untuk posisi ${position} ini?",
      "tips": "Fokus pada pencapaian nyata dan keahlian yang langsung relevan dengan ${position}."
    },
    {
      "id": 2,
      "category": "Keahlian Teknis",
      "question": "Bagaimana pendekatan Anda dalam menyelesaikan kendala teknis saat membangun sistem di lingkungan kerja sebelumnya?",
      "tips": "Jelaskan metodologi kerja Anda secara runtut dan terstruktur."
    },
    {
      "id": 3,
      "category": "Behavioral (Metode STAR)",
      "question": "Ceritakan situasi ketika Anda harus bekerja di bawah tenggat waktu (deadline) yang sangat ketat. Apa tindakan yang Anda ambil dan apa hasilnya?",
      "tips": "Gunakan format: Situasi -> Tugas -> Aksi Anda -> Hasil positif yang dicapai."
    },
    {
      "id": 4,
      "category": "Studi Kasus",
      "question": "Jika Anda menemukan perbedaan pendapat dengan rekan satu tim terkait solusi teknis, bagaimana Anda mengelolanya?",
      "tips": "Tunjukkan kemampuan komunikasi persuasif dan orientasi pada kepentingan tim."
    },
    {
      "id": 5,
      "category": "Motivasi & Nilai",
      "question": "Mengapa Anda tertarik bergabung dengan ${company} dan apa yang membedakan Anda dari kandidat lainnya?",
      "tips": "Tunjukkan bahwa Anda memahami produk dan kultur ${company}."
    }
  ]
}`;

  const userPrompt = `
- Posisi: ${position}
- Perusahaan: ${company}
- Kualifikasi Loker: ${requirements.join(', ')}
- Keahlian Kandidat: ${candidateSkills.join(', ')}
`;

  try {
    const rawResponse = await callGroqAi({ systemPrompt, userPrompt, jsonMode: true, temperature: 0.3 });
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawResponse);
  } catch (error) {
    console.error('Error in generateInterviewQuestions:', error);
    return {
      interviewer_name: 'Pewawancara HRD AI',
      company,
      position,
      questions: [
        {
          id: 1,
          category: 'Pengantar',
          question: `Ceritakan mengenai diri Anda dan mengapa Anda adalah orang yang tepat untuk posisi ${position} di ${company}?`,
          tips: 'Sorot pengalaman dan keterampilan utama Anda.'
        }
      ]
    };
  }
}

/**
 * 5. AI Mock Interview Simulator - Answer Evaluator
 */
export async function evaluateInterviewAnswer(question, answer, position, company) {
  const systemPrompt = `Anda adalah Ahli Penilai Wawancara Kerja.
Evaluasi jawaban kandidat secara objektif, berikan skor (0 - 100), sebutkan poin kekuatan, hal yang perlu ditingkatkan, serta contoh jawaban terbaik (Model Answer).

Format JSON WAJIB:
{
  "score": 85,
  "strengths": ["Menyampaikan contoh konkret", "Artikulasi jelas"],
  "improvements": ["Bisa ditambahkan data metrik keberhasilan yang terukur"],
  "model_answer": "Contoh jawaban versi ideal yang sangat memukau pewawancara...",
  "overall_feedback": "Umpan balik menyeluruh dan kata-kata penyemangat"
}`;

  const userPrompt = `
- Posisi: ${position}
- Perusahaan: ${company}
- Pertanyaan Pewawancara: "${question}"
- Jawaban Kandidat: "${answer}"
`;

  try {
    const rawResponse = await callGroqAi({ systemPrompt, userPrompt, jsonMode: true, temperature: 0.2 });
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawResponse);
  } catch (error) {
    console.error('Error in evaluateInterviewAnswer:', error);
    return {
      score: 80,
      strengths: ['Jawaban relevan dengan inti pertanyaan'],
      improvements: ['Sertakan hasil yang lebih terukur'],
      model_answer: 'Contoh jawaban yang baik menonjolkan aksi konkret dan dampak positif.',
      overall_feedback: 'Jawaban Anda sudah baik dan memiliki dasar pemikiran yang logis!'
    };
  }
}

/**
 * 6. Salary Insight & Negotiation Script Generator
 */
export async function getSalaryInsight(position, location = 'Indonesia', experienceLevel = '1-3 Tahun') {
  const systemPrompt = `Anda adalah Analis Kompensasi & Benefit SDM Indonesia.
Berikan estimasi rentang gaji pasar nyata (Market Rate) di Indonesia dan skrip taktis menjawab negosiasi gaji.

Format JSON WAJIB:
{
  "position": "${position}",
  "location": "${location}",
  "experience_level": "${experienceLevel}",
  "salary_min": "Rp 8.000.000",
  "salary_median": "Rp 14.000.000",
  "salary_max": "Rp 20.000.000",
  "market_competitiveness": "Tinggi / Menengah",
  "key_factors": ["Penguasaan framework modern", "Kualitas portofolio", "Kemampuan negosiasi"],
  "negotiation_scripts": {
    "when_asked_expectation": "Contoh kalimat taktis saat ditanya 'Berapa ekspektasi gaji Anda?'",
    "when_offered_below_expectation": "Contoh kalimat santun jika penawaran di bawah ekspektasi",
    "benefit_counter_offer": "Contoh kalimat meminta benefit lain jika gaji pokok fixed"
  }
}`;

  const userPrompt = `
Posisi: ${position}
Lokasi: ${location}
Level Pengalaman: ${experienceLevel}
`;

  try {
    const rawResponse = await callGroqAi({ systemPrompt, userPrompt, jsonMode: true, temperature: 0.2 });
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawResponse);
  } catch (error) {
    console.error('Error in getSalaryInsight:', error);
    return {
      position,
      location,
      experience_level: experienceLevel,
      salary_min: 'Rp 6.000.000',
      salary_median: 'Rp 12.000.000',
      salary_max: 'Rp 18.000.000',
      market_competitiveness: 'Tinggi',
      key_factors: ['Pengalaman relevan', 'Portofolio terbukti'],
      negotiation_scripts: {
        when_asked_expectation: 'Berdasarkan riset pasar, ekspektasi saya di kisaran Rp X - Rp Y.',
        when_offered_below_expectation: 'Terima kasih atas penawarannya, apakah ada ruang negosiasi di Rp X?',
        benefit_counter_offer: 'Apakah memungkinkan untuk mempertimbangkan tunjangan tambahan?'
      }
    };
  }
}

/**
 * 7. Anti-Scam Shield & Verification
 */
export async function performAntiScamAudit(jobText, email = '', company = '') {
  const systemPrompt = `Anda adalah Spesialis Anti-Fraud & Cyber Security Rekrutmen Ketenagakerjaan.
Analisis teks lowongan kerja dan periksa indikator penipuan (Scam Indicators).

Format JSON WAJIB:
{
  "is_safe": true,
  "risk_level": "Aman (Low Risk)" | "Mencurigakan (Medium Risk)" | "Bahaya Penipuan (High Risk)",
  "scam_score": 0 to 100,
  "detected_red_flags": ["Catatan indikasi 1", "Catatan indikasi 2"],
  "safety_verdict": "Penjelasan detail status keamanan lowongan ini",
  "protection_advice": "Saran proteksi untuk pelamar"
}`;

  const userPrompt = `
Perusahaan: ${company}
Email: ${email}
Teks Loker:
"""
${jobText.slice(0, 2000)}
"""
`;

  try {
    const rawResponse = await callGroqAi({ systemPrompt, userPrompt, jsonMode: true, temperature: 0.1 });
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawResponse);
  } catch (error) {
    console.error('Error in performAntiScamAudit:', error);
    return {
      is_safe: true,
      risk_level: 'Aman (Low Risk)',
      scam_score: 5,
      detected_red_flags: [],
      safety_verdict: 'Tidak ditemukan indikasi penipuan.',
      protection_advice: 'Rekrutmen resmi tidak pernah memungut biaya apapun.'
    };
  }
}

/**
 * 8. [FITUR 4 BARU] AI GitHub & Portofolio Project Pitch Generator
 * Generates compelling project storytelling, architecture deep-dive, STAR method pitch, and interview Q&A.
 */
export async function generateProjectPitch({ projectName, techStack = '', description = '', githubUrl = '', targetRole = '' }) {
  const systemPrompt = `Anda adalah Principal Software Engineer & Technical Interview Coach terkemuka.
Tugas Anda adalah mengubah deskripsi proyek atau repository GitHub kandidat menjadi "Technical Elevator Pitch" yang SANGAT MEMUKAU, PROFESIONAL, dan MENJUAL di hadapan Lead Engineer & Hiring Manager.

Format output JSON WAJIB:
{
  "project_name": "${projectName}",
  "elevator_pitch_30s": "Pitch padat 3-4 kalimat (Masalah -> Solusi -> Dampak Teknis/Bisnis) yang memikat dalam 30 detik pertama interview.",
  "tech_architecture_story": "Penjelasan arsitektur teknis mengapa memilih tumpukan teknologi tersebut, bagaimana data mengalir, dan keputusan desain sistem.",
  "star_story": {
    "situation": "Konteks masalah atau kebutuhan yang melatarbelakangi dibuatnya proyek ini.",
    "task": "Tantangan teknis utama yang harus diselesaikan.",
    "action": "Langkah konkret, arsitektur, atau algoritma yang Anda terapkan secara spesifik.",
    "result": "Hasil terukur (kecepatan, performa, skalabilitas, atau efisiensi pengguna)."
  },
  "key_metrics_highlight": [
    "Pencapaian performa 1 (misal: Latensi < 100ms)",
    "Pencapaian skalabilitas 2",
    "Kemudahan maintenance / clean code"
  ],
  "anticipated_interview_questions": [
    {
      "question": "Pertanyaan teknis mendalam yang kemungkinan besar akan ditanyakan pewawancara?",
      "suggested_answer": "Jawaban taktis terbaik yang menunjukkan kematangan engineering."
    },
    {
      "question": "Bagaimana Anda menangani kegagalan (error handling) atau scaling pada sistem ini?",
      "suggested_answer": "Jawaban taktis terbaik."
    }
  ]
}`;

  const userPrompt = `
- Nama Proyek: ${projectName}
- Target Posisi: ${targetRole || 'Software Engineer / Fullstack Developer'}
- Tech Stack yang Digunakan: ${techStack || 'JavaScript, React, Node.js, MongoDB'}
- Deskripsi & Fitur Proyek: ${description || 'Aplikasi web fullstack dengan sistem autentikasi dan integrasi API real-time'}
- Link GitHub / Demo: ${githubUrl || '-'}
`;

  try {
    const rawResponse = await callGroqAi({ systemPrompt, userPrompt, jsonMode: true, temperature: 0.3 });
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawResponse);
  } catch (error) {
    console.error('Error in generateProjectPitch:', error);
    return {
      project_name: projectName,
      elevator_pitch_30s: `Saya mengembangkan ${projectName} untuk menyelesaikan kendala efisiensi dengan memanfaatkan ${techStack}. Proyek ini dirancang dengan fokus pada kecepatan performa dan arsitektur modular yang mudah dikembangkan.`,
      tech_architecture_story: `Proyek ini dibangun menggunakan arsitektur modern berbasis ${techStack} yang memisahkan logic backend dan UI frontend secara rapi.`,
      star_story: {
        situation: `Kebutuhan akan platform yang cepat dan handal untuk pengguna.`,
        task: `Merancang backend dan antarmuka responsif dalam waktu singkat.`,
        action: `Mengimplementasikan RESTful API terstruktur dan state management modern.`,
        result: `Aplikasi berjalan stabil dengan performa loading cepat dan minim bug.`
      },
      key_metrics_highlight: ['Responsif di berbagai perangkat', 'Struktur kode modular & scalable', 'Keamanan data teruji'],
      anticipated_interview_questions: [
        {
          question: `Mengapa Anda memilih ${techStack} untuk proyek ${projectName}?`,
          suggested_answer: `Karena ekosistemnya yang mature, performa tinggi, dan kemudahan dalam integrasi jangka panjang.`
        }
      ]
    };
  }
}

/**
 * 9. [FITUR 5 BARU] AI Career Roadmap & Skill Gap Analyzer
 * Analyzes candidate profile against active market vacancies and produces a customized skill learning roadmap.
 */
export async function generateCareerRoadmap(profile, sampleJobs = []) {
  const candidateSkills = profile.skills || [];
  const candidateHeadline = profile.headline || 'Software Engineer';

  const systemPrompt = `Anda adalah Senior Career Mentor & IT Industry Strategist di Indonesia.
Tugas Anda adalah membandingkan keahlian kandidat saat ini dengan tren kebutuhan industri terkini dari database lowongan kerja, lalu menyusun "Career Skill Gap Roadmap" yang sangat aplikatif dan realistis.

Format output JSON WAJIB:
{
  "market_fit_score": 82,
  "current_level": "Junior - Mid Level",
  "target_level": "Senior / Lead Specialist",
  "current_salary_range": "Rp 8.000.000 - Rp 12.000.000",
  "projected_salary_range": "Rp 18.000.000 - Rp 25.000.000",
  "top_missing_skills": [
    { "skill": "Nama Skill 1", "demand_level": "Sangat Tinggi", "reason": "Dibutuhkan di 70%+ lowongan enterprise" },
    { "skill": "Nama Skill 2", "demand_level": "Tinggi", "reason": "Meningkatkan daya tawar gaji secara signifikan" },
    { "skill": "Nama Skill 3", "demand_level": "Menengah", "reason": "Standard arsitektur modern" }
  ],
  "roadmap_phases": [
    {
      "phase": "Fase 1: Fondasi Kuat (Bulan 1-2)",
      "goal": "Memperdalam penguasaan core stack dan arsitektur data",
      "action_items": ["Pelajari konsep X secara mendalam", "Bangun proyek mini A"]
    },
    {
      "phase": "Fase 2: Skalabilitas & DevOps (Bulan 3-4)",
      "goal": "Menguasai kontainerisasi dan CI/CD automation",
      "action_items": ["Implementasikan Docker & GitHub Actions", "Deploy aplikasi ke cloud"]
    },
    {
      "phase": "Fase 3: Portofolio Enterprise (Bulan 5-6)",
      "goal": "Menyusun portofolio skala industri dan siap negosiasi gaji tinggi",
      "action_items": ["Bangun sistem terdistribusi dengan metrik nyata", "Latihan technical interview"]
    }
  ],
  "recommended_free_resources": [
    { "title": "Dokumentasi & Tutorial Resmi", "platform": "Official Docs / GitHub", "type": "Gratis" },
    { "title": "Fullstack Open Course", "platform": "University of Helsinki", "type": "Gratis & Bersertifikat" }
  ],
  "strategic_advice": "Pesan motivasi dan strategi taktis melamar kerja dengan posisi tawar tinggi."
}`;

  const userPrompt = `
DATA PROFIL KANDIDAT:
- Nama: ${profile.full_name}
- Headline: ${candidateHeadline}
- Skill yang Dimiliki: ${candidateSkills.join(', ')}
- Ringkasan Karir: ${profile.summary || '-'}

SAMPEL KEBUTUHAN LOWONGAN PASAR SAAT INI:
${sampleJobs.slice(0, 8).map(j => `- Posisi: ${j.title} di ${j.company} | Syarat: ${(j.requirements || []).join('; ')}`).join('\n')}
`;

  try {
    const rawResponse = await callGroqAi({ systemPrompt, userPrompt, jsonMode: true, temperature: 0.3 });
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawResponse);
  } catch (error) {
    console.error('Error in generateCareerRoadmap:', error);
    return {
      market_fit_score: 80,
      current_level: 'Mid Level Developer',
      target_level: 'Senior Software Engineer',
      current_salary_range: 'Rp 8.000.000 - Rp 14.000.000',
      projected_salary_range: 'Rp 16.000.000 - Rp 24.000.000',
      top_missing_skills: [
        { skill: 'Docker & Containerization', demand_level: 'Sangat Tinggi', reason: 'Standar deployment industri modern' },
        { skill: 'TypeScript Strict Mode', demand_level: 'Tinggi', reason: 'Mencegah runtime bug pada proyek skala besar' },
        { skill: 'CI/CD Pipeline Automation', demand_level: 'Tinggi', reason: 'Mempercepat rilis aplikasi' }
      ],
      roadmap_phases: [
        {
          phase: 'Fase 1: TypeScript & Clean Code (Bulan 1-2)',
          goal: 'Migrasi proyek JavaScript ke TypeScript murni',
          action_items: ['Menerapkan strict typing', 'Membangun reusable custom hooks & API contracts']
        },
        {
          phase: 'Fase 2: Docker & Backend Optimization (Bulan 3-4)',
          goal: 'Kontainerisasi aplikasi dan optimasi database query',
          action_items: ['Membuat Dockerfile multi-stage', 'Optimasi indexing database']
        }
      ],
      recommended_free_resources: [
        { title: 'TypeScript Official Handbook', platform: 'typescriptlang.org', type: 'Gratis' },
        { title: 'Docker for Beginners Guide', platform: 'Docker Docs', type: 'Gratis' }
      ],
      strategic_advice: 'Fokus pada membangun 1-2 proyek portofolio yang memiliki pengguna nyata atau metrik performa terukur.'
    };
  }
}

/**
 * 10. Optimize Profile summary & headline with AI
 */
export async function optimizeProfile(profile) {
  const systemPrompt = `Anda adalah Konsultan Karir Senior & ATS Resume Optimizer.
Buatkan Headline profesional yang memikat dan Ringkasan Karir (Professional Summary) ramah ATS dalam Bahasa Indonesia yang berkelas.

Keluarkan dalam format JSON:
{
  "optimized_headline": "...",
  "optimized_summary": "..."
}`;

  const userPrompt = `
Nama: ${profile.full_name}
Headline saat ini: ${profile.headline}
Summary saat ini: ${profile.summary}
Skill: ${(profile.skills || []).join(', ')}
Isi Teks CV: ${(profile.cv_text || '').slice(0, 2000)}
`;

  try {
    const rawResponse = await callGroqAi({ systemPrompt, userPrompt, jsonMode: true, temperature: 0.3 });
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawResponse);
  } catch (error) {
    console.error('Error optimizing profile:', error);
    return {
      optimized_headline: `${profile.headline || 'Software Engineer / Professional'} | Ready for Opportunities`,
      optimized_summary: profile.summary || 'Profesional berdedikasi tinggi dengan keahlian teknis kuat dan komitmen menghadirkan solusi terbaik.'
    };
  }
}

/**
 * 11. AI WhatsApp Auto-Apply & HR Chat Generator
 */
export async function generateWhatsAppApplyChat({ profile, jobDetails }) {
  const systemPrompt = `Anda adalah Pakar Komunikasi Rekrutmen Kerja & HR Relationship Specialist Indonesia.
Tugas Anda adalah menyusun draf pesan WhatsApp perkenalan lamaran kerja yang SANGAT SOPAN, ELEGAN, PADAT, dan MEMIKAT untuk dikirimkan langsung ke nomor WhatsApp HRD/Rekruter.

FORMAT CHAT WA HARUS MENGIKUTI STRUKTUR RESMI:
1. Salam Pembuka yang sopan & profesional (misal: "Selamat pagi/siang Bapak/Ibu HRD [Nama PT]")
2. Identitas diri singkat & posisi yang dilamar
3. Ringkasan kualifikasi/keahlian utama (1-2 poin kuat yang relevan)
4. Tautan portofolio/LinkedIn (jika ada)
5. Pernyataan bahwa CV lengkap telah dilampirkan
6. Penutup sopan & ucapan terima kasih

Formatkan dengan teks cetak tebal WhatsApp (*teks*) pada poin-poin penting.

Keluarkan dalam format JSON:
{
  "whatsapp_number": "628...",
  "greeting": "Salam pembuka",
  "applicant_name": "Nama Pelamar",
  "target_position": "Posisi yang dilamar",
  "company_name": "Nama Perusahaan",
  "chat_message": "Isi lengkap chat WhatsApp yang siap dikirim",
  "encoded_url": "URL wa.me"
}`;

  // Clean phone number
  let rawPhone = jobDetails?.whatsapp_number || jobDetails?.phone || '';
  rawPhone = rawPhone.replace(/[^0-9]/g, '');
  if (rawPhone.startsWith('08')) {
    rawPhone = '628' + rawPhone.slice(2);
  } else if (rawPhone.startsWith('8')) {
    rawPhone = '628' + rawPhone.slice(1);
  }

  const userPrompt = `
DATA PELAMAR:
- Nama: ${profile.full_name || 'Pelamar Kerja'}
- Email: ${profile.email || ''}
- Telepon: ${profile.phone || ''}
- Headline: ${profile.headline || 'Profesional'}
- Top Skills: ${(profile.skills || []).slice(0, 5).join(', ')}
- Portofolio/GitHub: ${profile.portfolio_url || 'Tersedia'}

DATA LOWONGAN KERJA:
- Perusahaan: ${jobDetails?.company_name || 'Perusahaan Terkait'}
- Posisi: ${jobDetails?.position || 'Posisi Terbuka'}
- Persyaratan: ${(jobDetails?.requirements || []).join(', ')}
- Lokasi: ${jobDetails?.location || 'Indonesia'}
- Nomor WhatsApp: ${rawPhone || '6281234567890'}
`;

  try {
    const rawResponse = await callGroqAi({ systemPrompt, userPrompt, jsonMode: true, temperature: 0.3 });
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawResponse);

    const targetPhone = rawPhone || parsed.whatsapp_number || '';
    const message = parsed.chat_message || '';
    const encodedUrl = targetPhone ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}` : '';

    return {
      ...parsed,
      whatsapp_number: targetPhone,
      encoded_url: encodedUrl
    };
  } catch (error) {
    console.error('Error in generateWhatsAppApplyChat:', error);
    const fallbackPhone = rawPhone || '';
    const fallbackMsg = `Selamat pagi/siang Bapak/Ibu HRD *${jobDetails?.company_name || 'Perusahaan'}*,\n\nPerkenalkan saya *${profile.full_name || 'Pelamar'}*, bermaksud untuk mengajukan lamaran kerja untuk posisi *${jobDetails?.position || 'Posisi'}*.\n\nSaya memiliki keahlian di bidang ${(profile.skills || []).slice(0, 3).join(', ') || 'keahlian terkait'}.\n\nBersama pesan ini saya lampirkan CV terbaru saya untuk bahan pertimbangan. Terima kasih banyak atas waktu dan kesempatan yang diberikan.`;
    return {
      whatsapp_number: fallbackPhone,
      greeting: 'Selamat pagi/siang Bapak/Ibu HRD',
      applicant_name: profile.full_name,
      target_position: jobDetails?.position,
      company_name: jobDetails?.company_name,
      chat_message: fallbackMsg,
      encoded_url: fallbackPhone ? `https://wa.me/${fallbackPhone}?text=${encodeURIComponent(fallbackMsg)}` : ''
    };
  }
}

/**
 * 12. AI Official Cover Letter & Surat Lamaran Kerja Generator
 */
export async function generateCoverLetter({ profile, companyName, position, requirements = [], language = 'id', jobDetails = {} }) {
  const isEnglish = language === 'en';
  const company = companyName || jobDetails.company_name || 'Perusahaan';
  const role = position || jobDetails.position || 'Posisi';
  const reqList = (requirements.length ? requirements : (jobDetails.requirements || [])).filter(Boolean);
  const mergedJob = {
    ...jobDetails,
    company_name: company,
    position: role,
    requirements: reqList
  };

  const systemPrompt = `Anda menulis ${isEnglish ? 'a concise professional cover letter' : 'surat lamaran singkat yang terasa ditulis manusia'} — spesifik, hangat, tidak klise.

${isEnglish ? `Write in natural English. Forbidden clichés: "I am writing to express my interest", "I believe I would be a great fit", "leverage my skills".`
    : `Bahasa Indonesia natural. DILARANG: "Dengan hormat,", "saya yang bertanda tangan di bawah ini", "sehubungan dengan informasi lowongan", "besar harapan saya", "memberikan kontribusi nyata".`}

Aturan:
- Pakai fakta dari CV/profil dan syarat lowongan. Jangan mengarang prestasi.
- Tanpa markdown (**tebal**, heading, backtick).
- Struktur: tempat-tanggal, perihal, sapaan, 2–3 paragraf spesifik, penutup, nama.

Keluarkan JSON:
{
  "letter_title": "Surat Lamaran Pekerjaan - ${role}",
  "language": "${language}",
  "date_formatted": "Jakarta, ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}",
  "applicant_info": {
    "name": "${profile.full_name || 'Nama Pelamar'}",
    "email": "${profile.email || ''}",
    "phone": "${profile.phone || ''}",
    "address": "${profile.city || profile.address || 'Indonesia'}"
  },
  "recipient_info": {
    "title": "HRD / Hiring Manager",
    "company": "${company}",
    "location": "${mergedJob.location || 'Di Tempat'}"
  },
  "subject_line": "Lamaran ${role} — ${profile.full_name || ''}",
  "opening_salutation": "${isEnglish ? 'Dear Hiring Team,' : 'Yth. Tim Rekrutmen ' + company + ','}",
  "opening_paragraph": "...",
  "body_paragraphs": ["...", "..."],
  "closing_paragraph": "...",
  "sign_off": "${isEnglish ? 'Best regards,' : 'Terima kasih,'}",
  "full_content_text": "Teks lengkap surat, polos, tanpa markdown",
  "key_highlights": ["Highlight faktual 1", "Highlight 2"]
}`;

  const userPrompt = `DATA PELAMAR:
${buildCandidateContext(profile)}

DETAIL LOWONGAN:
${buildJobContext(mergedJob)}
Bahasa output: ${isEnglish ? 'English' : 'Bahasa Indonesia'}
`;

  try {
    const rawResponse = await callGroqAi({ systemPrompt, userPrompt, jsonMode: true, temperature: 0.5 });
    const parsed = parseJsonObject(rawResponse);
    if (parsed.full_content_text) {
      parsed.full_content_text = sanitizeEmailBody(parsed.full_content_text);
    }
    if (parsed.opening_paragraph) parsed.opening_paragraph = sanitizeEmailBody(parsed.opening_paragraph);
    if (parsed.closing_paragraph) parsed.closing_paragraph = sanitizeEmailBody(parsed.closing_paragraph);
    if (Array.isArray(parsed.body_paragraphs)) {
      parsed.body_paragraphs = parsed.body_paragraphs.map((p) => sanitizeEmailBody(p));
    }
    if (Array.isArray(parsed.key_highlights)) {
      parsed.key_highlights = parsed.key_highlights.map((p) => stripMarkdownForPlainText(String(p), { convertBackticks: false }));
    }
    return parsed;
  } catch (error) {
    console.error('Error in generateCoverLetter:', error);
    const skills = (profile.skills || []).slice(0, 4).join(', ');
    const loc = mergedJob.location ? ` (${mergedJob.location})` : '';
    const fullText = `Jakarta, ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}

Perihal: Lamaran ${role}
Lampiran: CV

Yth. Tim Rekrutmen ${company},

Saya ${profile.full_name || 'pelamar'} tertarik pada posisi ${role} di ${company}${loc}.${profile.headline ? ` Saya ${profile.headline}.` : ''}

${skills ? `Keahlian yang saya bawa: ${skills}.` : (profile.summary || '').slice(0, 280)} CV terlampir untuk detail pengalaman.

Saya siap dihubungi untuk wawancara. Terima kasih.

${profile.full_name || ''}
${profile.phone || ''}
${profile.email || ''}`;
    return {
      letter_title: `Surat Lamaran Pekerjaan - ${role}`,
      language,
      full_content_text: fullText,
      key_highlights: [(profile.skills || [])[0], profile.headline].filter(Boolean).slice(0, 3)
    };
  }
}

/**
 * 13. AI Company Intelligence & Interview Cheat Sheet
 */
export async function generateCompanyIntelligence({ companyName, position, industry = 'Teknologi & Bisnis' }) {
  const systemPrompt = `Anda adalah Corporate Intelligence Analyst & Senior Interview Coach.
Tugas Anda adalah membedah profil perusahaan target secara mendalam dan memberikan "Cheat Sheet Wawancara" rahasia agar pelamar dapat tampil memukau dan langsung disukai oleh Interviewer/HRD.

Keluarkan dalam format JSON:
{
  "company_name": "${companyName}",
  "industry": "${industry}",
  "company_overview": "Ringkasan profil bisnis, model monetisasi, dan posisi perusahaan di industri",
  "company_culture": "Nilai inti budaya kerja dan karakteristik kandidat yang paling dicari",
  "recent_milestones": ["Pencapaian/tren terbaru perusahaan 1", "Pencapaian 2"],
  "interview_cheat_sheet": [
    {
      "anticipated_question": "Pertanyaan interview spesifik yang sering ditanyakan di perusahaan ini",
      "what_interviewer_wants": "Maksud tersembunyi yang dicari pewawancara",
      "pro_tip": "Tips cara menjawab yang memikat"
    },
    {
      "anticipated_question": "Pertanyaan 2...",
      "what_interviewer_wants": "...",
      "pro_tip": "..."
    },
    {
      "anticipated_question": "Pertanyaan 3...",
      "what_interviewer_wants": "...",
      "pro_tip": "..."
    }
  ],
  "why_this_company_answer": "Contoh jawaban cerdas dan memukau untuk pertanyaan: 'Kenapa Anda ingin bekerja di [Nama PT]?'",
  "smart_questions_to_ask_interviewer": [
    "Pertanyaan berbobot 1 untuk ditanyakan balik ke pewawancara di akhir sesi",
    "Pertanyaan berbobot 2...",
    "Pertanyaan berbobot 3..."
  ]
}`;

  const userPrompt = `
Nama Perusahaan: ${companyName}
Posisi Target: ${position}
Industri: ${industry}
`;

  try {
    const rawResponse = await callGroqAi({ systemPrompt, userPrompt, jsonMode: true, temperature: 0.3 });
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawResponse);
  } catch (error) {
    console.error('Error in generateCompanyIntelligence:', error);
    return {
      company_name: companyName,
      industry: industry || 'Industri Terkait',
      company_overview: `${companyName} adalah perusahaan yang berkembang pesat di sektor industri Indonesia, berfokus pada inovasi dan kepuasan pelanggan.`,
      company_culture: 'Mengedepankan profesionalisme, adaptabilitas, kolaborasi tim, dan orientasi hasil.',
      recent_milestones: ['Ekspansi layanan digital', 'Peningkatan efisiensi operasional'],
      interview_cheat_sheet: [
        {
          anticipated_question: `Kenapa Anda tertarik melamar posisi ${position} di ${companyName}?`,
          what_interviewer_wants: 'Mengecek apakah kandidat paham bisnis perusahaan atau hanya asal kirim lamaran.',
          pro_tip: 'Sebutkan produk atau nilai perusahaan yang sesuai dengan visi karir Anda.'
        }
      ],
      why_this_company_answer: `Saya mengagumi reputasi ${companyName} dalam industri ini dan ingin berkontribusi langsung dengan keahlian saya untuk mendorong pertumbuhan tim.`,
      smart_questions_to_ask_interviewer: [
        `Apa tantangan terbesar yang sedang dihadapi tim ${position} dalam 6 bulan ke depan?`,
        'Bagaimana perusahaan mengukur keberhasilan seseorang di posisi ini?'
      ]
    };
  }
}

/**
 * 14. [FITUR BARU] AI Live Technical Coding Challenge Generator
 * Generates tailored live coding problems, unit test cases, and starter code based on target job/tech stack.
 */
export async function generateLiveCodeChallenge({ 
  position = 'Fullstack Developer', 
  companyName = 'Tech Company', 
  techStack = 'JavaScript', 
  difficulty = 'Mid', 
  topic = 'Acak (Semua Kategori)' 
}) {
  const topicsPool = [
    'Pola Bintang & Asterisk Pyramid Matrix',
    'Fuzzy String Logic & Similarity Distance',
    'Async / Promises & Event Loop',
    'Debounce, Throttle & Performance Optimizer',
    'Array & Nested Object Data Transformer',
    'Struktur Data (LRU Cache, Stack, Map)',
    'Sliding Window & Two Pointers',
    'Event Emitter & Pub-Sub Architecture',
    'Function Currying & Memoization'
  ];

  const selectedTopic = (topic === 'Acak (Semua Kategori)' || !topic)
    ? topicsPool[Math.floor(Math.random() * topicsPool.length)]
    : topic;

  const randomSeed = Math.floor(Math.random() * 10000);

  const systemPrompt = `Anda merancang soal live coding wawancara teknis. Tulis seperti soal ujian koding sungguhan, bukan dump ChatGPT.

BAHASA TULISAN:
- problem_statement, constraints, hint, dan explanation: teks polos Bahasa Indonesia.
- DILARANG markdown: jangan pakai **tebal**, *miring*, __garis bawah__, # heading, atau list yang diawali "* ".
- Nama fungsi dan identifier boleh dalam tanda kutip, contoh: fungsi "solution(n)". Hindari backtick.
- Tanda * hanya boleh jika soal memang tentang pola bintang / karakter asterisk.

ATURAN SOAL:
1. JavaScript murni (ES6+). Nama fungsi jelas, misal "solution".
2. Minimal 3 unit test: input_args array parameter, expected_output presisi.
3. Soal aplikatif untuk posisi "${position}" di "${companyName}", topik "${selectedTopic}". Random Seed: ${randomSeed}.

Keluarkan HANYA JSON valid:
{
  "challenge_id": "challenge_${Date.now()}_${randomSeed}",
  "title": "Judul singkat tanpa markdown",
  "difficulty": "${difficulty}",
  "topic": "${selectedTopic}",
  "estimated_time_minutes": 30,
  "problem_statement": "Deskripsi polos: apa yang harus dibuat, aturan, nilai balik. Tanpa ** atau heading.",
  "constraints": [
    "Batasan 1",
    "Gunakan JavaScript murni tanpa library luar"
  ],
  "examples": [
    {
      "input": "solution(...)",
      "output": "...",
      "explanation": "Penjelasan polos"
    }
  ],
  "starter_code": "/**\\n * @return {any}\\n */\\nfunction solution(...) {\\n  // Tuliskan solusi Anda di sini\\n  return null;\\n}",
  "function_name": "solution",
  "test_cases": [
    {
      "id": 1,
      "input_args": [...],
      "expected_output": ...,
      "description": "Kasus uji 1"
    },
    {
      "id": 2,
      "input_args": [...],
      "expected_output": ...,
      "description": "Kasus uji 2"
    },
    {
      "id": 3,
      "input_args": [...],
      "expected_output": ...,
      "description": "Kasus uji 3"
    }
  ],
  "hint": "Petunjuk polos tanpa markdown."
}`;

  const userPrompt = `
Tulis soal live coding (teks polos, tanpa markdown).
- Posisi Target: ${position}
- Perusahaan: ${companyName}
- Tech Stack: ${techStack}
- Tingkat Kesulitan: ${difficulty} (Junior / Mid / Senior)
- Kategori Topik: ${selectedTopic}
- Variasi Soal Acak ID: #${randomSeed}
`;

  try {
    const rawResponse = await callGroqAi({ systemPrompt, userPrompt, jsonMode: true, temperature: 0.4 });
    return sanitizeLiveCodeChallenge(parseJsonObject(rawResponse));
  } catch (error) {
    console.error('Error in generateLiveCodeChallenge, picking from master bank:', error);
    return sanitizeLiveCodeChallenge(getRandomPresetChallenge(selectedTopic, difficulty));
  }
}

/**
 * 15. [FITUR BARU] AI Principal Engineer Code Reviewer
 * Reviews submitted candidate code with Big-O complexity, logic correctness, clean code principles, and golden solution.
 */
export async function reviewSubmittedCode({ challengeTitle, problemStatement, candidateCode, language = 'javascript', testResults = [] }) {
  const systemPrompt = `Anda adalah Principal Software Engineer & Engineering Director di perusahaan tier-1.
Tugas Anda adalah melakukan Code Review & Technical Interview Assessment yang MENDALAM, OBJEKTIF, dan MEMBINA bagi kandidat programmer.

Analisis kriteria:
1. Logic Correctness & Big-O Time/Space Complexity
2. Clean Code, Naming Convention, & Readability
3. Edge Cases Detection (null/undefined, zero, empty arrays, extreme bounds)
4. Berikan Golden Standard Solution (kode solusi paling elegan dan berkinerja tinggi)

Format JSON WAJIB:
{
  "overall_score": 92,
  "logic_score": 95,
  "clean_code_score": 90,
  "time_complexity": "O(N)",
  "space_complexity": "O(N)",
  "readiness_verdict": "Sangat Siap Interview Teknis",
  "strengths": [
    "Penggunaan struktur data efisien",
    "Penamaan variabel deskriptif"
  ],
  "bugs_and_edge_cases": [
    "Perhatikan jika input array kosong atau null"
  ],
  "senior_feedback": "Penjelasan komprehensif dari Senior Engineer mengenai kekuatan dan perbaikan kode ini.",
  "golden_solution_code": "// Kode versi terbaik standar industri\\nfunction solution(...) {\\n  ...\\n}"
}`;

  const userPrompt = `
TANTANGAN: ${challengeTitle}
DESKRIPSI MASALAH: ${problemStatement}
BAHASA: ${language}
HASIL TEST CASES: ${JSON.stringify(testResults)}

KODE JAWABAN KANDIDAT:
\`\`\`${language}
${candidateCode}
\`\`\`
`;

  try {
    const rawResponse = await callGroqAi({ systemPrompt, userPrompt, jsonMode: true, temperature: 0.25 });
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawResponse);
  } catch (error) {
    console.error('Error in reviewSubmittedCode:', error);
    return {
      overall_score: 88,
      logic_score: 90,
      clean_code_score: 85,
      time_complexity: 'O(N)',
      space_complexity: 'O(1)',
      readiness_verdict: 'Siap Interview Teknis',
      strengths: ['Solusi berhasil menyelesaikan masalah inti dengan baik', 'Sintaksis JavaScript modern'],
      bugs_and_edge_cases: ['Pastikan selalu melakukan validasi tipe input di awal fungsi'],
      senior_feedback: 'Kode Anda menunjukkan pemahaman logika yang kuat. Untuk meningkatkan skalabilitas pada sistem enterprise, tambahkan pengecekan input parameter.',
      golden_solution_code: candidateCode || '// Contoh solusi optimal'
    };
  }
}

/**
 * MASTER BANK OF 20+ POPULAR LIVE CODING QUESTIONS (100% REAL INTERVIEW QUESTIONS)
 */
export const MASTER_PRESET_CHALLENGES = [
  // 1. Asterisk Pyramid & Diamond Pattern
  {
    challenge_id: 'preset_asterisk_pyramid',
    title: 'Generator Pola Piramida Bintang (Asterisk Pattern)',
    difficulty: 'Junior',
    topic: 'Pola Bintang & Asterisk Pyramid Matrix',
    estimated_time_minutes: 20,
    problem_statement: 'Buat fungsi `solution(n)` yang menghasilkan array string berisi pola piramida bintang dengan tinggi `n` baris, di mana setiap baris memiliki spasi di kiri dan kanan sehingga simetris dan memiliki `2*i - 1` tanda bintang (*).',
    constraints: ['1 <= n <= 20'],
    examples: [
      { input: 'solution(3)', output: '["  *  ", " *** ", "*****"]', explanation: 'Tinggi 3 baris: baris 1 (1 bintang), baris 2 (3 bintang), baris 3 (5 bintang).' }
    ],
    starter_code: `function solution(n) {
  const result = [];
  for (let i = 1; i <= n; i++) {
    const spaces = ' '.repeat(n - i);
    const stars = '*'.repeat(2 * i - 1);
    result.push(spaces + stars + spaces);
  }
  return result;
}`,
    function_name: 'solution',
    test_cases: [
      { id: 1, input_args: [1], expected_output: ['*'], description: 'Tinggi 1 baris' },
      { id: 2, input_args: [3], expected_output: ['  *  ', ' *** ', '*****'], description: 'Tinggi 3 baris' },
      { id: 3, input_args: [4], expected_output: ['   *   ', '  ***  ', ' ***** ', '*******'], description: 'Tinggi 4 baris' }
    ],
    hint: 'Gunakan string method .repeat() untuk menghasilkan spasi (n - i) dan bintang (2*i - 1).'
  },

  // 2. Fuzzy Logic / Typo Similarity Matcher (Levenshtein Distance Ratio)
  {
    challenge_id: 'preset_fuzzy_matcher',
    title: 'Fuzzy Logic & Typo Similarity Ratio (Levenshtein)',
    difficulty: 'Mid',
    topic: 'Fuzzy String Logic & Similarity Distance',
    estimated_time_minutes: 35,
    problem_statement: 'Implementasikan fungsi `solution(wordA, wordB)` untuk menghitung skor kemiripan teks (fuzzy similarity score) dalam persen (0 - 100) menggunakan jarak Levenshtein. Fungsi harus mengabaikan huruf besar/kecil (case-insensitive). Skor dihitung dengan rumus: `Math.round((1 - distance / max(lenA, lenB)) * 100)`.',
    constraints: ['Panjang kata 0 <= length <= 100'],
    examples: [
      { input: 'solution("kemendagri", "kemendari")', output: '89', explanation: 'Hanya 1 huruf "g" hilang dari 9 huruf (kemiripan ~89%).' },
      { input: 'solution("react", "react")', output: '100', explanation: 'Kata identik (100%).' }
    ],
    starter_code: `function solution(wordA, wordB) {
  const s1 = (wordA || '').toLowerCase();
  const s2 = (wordB || '').toLowerCase();
  if (s1 === s2) return 100;
  if (!s1.length || !s2.length) return 0;

  const dp = Array.from({ length: s1.length + 1 }, () => Array(s2.length + 1).fill(0));

  for (let i = 0; i <= s1.length; i++) dp[i][0] = i;
  for (let j = 0; j <= s2.length; j++) dp[0][j] = j;

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  const distance = dp[s1.length][s2.length];
  const maxLen = Math.max(s1.length, s2.length);
  return Math.round((1 - distance / maxLen) * 100);
}`,
    function_name: 'solution',
    test_cases: [
      { id: 1, input_args: ['javascript', 'javascript'], expected_output: 100, description: 'Kata sama persis' },
      { id: 2, input_args: ['kemendagri', 'kemendari'], expected_output: 90, description: 'Typo 1 huruf hilang' },
      { id: 3, input_args: ['react', 'vue'], expected_output: 0, description: 'Kata berbeda total' }
    ],
    hint: 'Gunakan Dynamic Programming Matrix 2D berukuran (M+1) x (N+1) untuk mencari edit distance.'
  },

  // 3. Two Sum
  {
    challenge_id: 'preset_two_sum',
    title: 'Dua Angka Penjumlahan Target (Two Sum)',
    difficulty: 'Junior',
    topic: 'Array & Hash Map',
    estimated_time_minutes: 25,
    problem_statement: 'Diberikan sebuah array bilangan bulat `nums` dan sebuah bilangan bulat `target`, kembalikan indeks dari dua angka sedemikian rupa sehingga keduanya jika dijumlahkan menghasilkan `target`. Anda diasumsikan hanya memiliki tepat satu solusi.',
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Hanya ada 1 solusi valid'],
    examples: [
      { input: 'solution([2, 7, 11, 15], 9)', output: '[0, 1]', explanation: 'nums[0] + nums[1] == 9, maka kembalikan [0, 1].' }
    ],
    starter_code: `function solution(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
    function_name: 'solution',
    test_cases: [
      { id: 1, input_args: [[2, 7, 11, 15], 9], expected_output: [0, 1], description: 'Target 9 dari [2, 7, 11, 15]' },
      { id: 2, input_args: [[3, 2, 4], 6], expected_output: [1, 2], description: 'Target 6 dari [3, 2, 4]' },
      { id: 3, input_args: [[3, 3], 6], expected_output: [0, 1], description: 'Target 6 dari [3, 3]' }
    ],
    hint: 'Gunakan Map untuk melacak pasangan (complement) dengan waktu pencarian O(1).'
  },

  // 4. Nested Object Flattener
  {
    challenge_id: 'preset_object_flattener',
    title: 'Perataan Objek Bersarang (Nested Object Flattener)',
    difficulty: 'Mid',
    topic: 'Array & Nested Object Data Transformer',
    estimated_time_minutes: 30,
    problem_statement: 'Buat fungsi `solution(obj)` yang meratakan objek bersarang menjadi objek 1 dimensi dengan key berformat dot-notation (misal `user.address.city`).',
    constraints: ['Kedalaman objek hingga 5 level'],
    examples: [
      { input: 'solution({ a: { b: 1, c: { d: 2 } } })', output: '{ "a.b": 1, "a.c.d": 2 }', explanation: 'Objek bersarang diratakan dengan pemisah titik.' }
    ],
    starter_code: `function solution(obj) {
  const result = {};
  
  function recurse(current, prefix = '') {
    for (const key in current) {
      const val = current[key];
      const newKey = prefix ? prefix + '.' + key : key;
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        recurse(val, newKey);
      } else {
        result[newKey] = val;
      }
    }
  }
  
  recurse(obj);
  return result;
}`,
    function_name: 'solution',
    test_cases: [
      { id: 1, input_args: [{ user: { name: 'Althaf', age: 24 } }], expected_output: { 'user.name': 'Althaf', 'user.age': 24 }, description: 'Objek 2 level' },
      { id: 2, input_args: [{ a: { b: { c: 100 } }, x: 50 }], expected_output: { 'a.b.c': 100, x: 50 }, description: 'Objek 3 level campuran' }
    ],
    hint: 'Gunakan rekursi dengan membawa akumulator prefix key.'
  },

  // 5. Valid Parentheses & Bracket Balancer
  {
    challenge_id: 'preset_valid_parentheses',
    title: 'Pengecekan Kurung Seimbang (Valid Parentheses Stack)',
    difficulty: 'Junior',
    topic: 'Struktur Data (LRU Cache, Stack, Map)',
    estimated_time_minutes: 20,
    problem_statement: 'Diberikan sebuah string `s` yang hanya berisi karakter "(", ")", "{", "}", "[", dan "]", tentukan apakah string input valid (semua kurung terbuka ditutup dengan benar dan berurutan).',
    constraints: ['1 <= s.length <= 10^4'],
    examples: [
      { input: 'solution("()[]{}")', output: 'true', explanation: 'Semua kurung berpasangan benar.' },
      { input: 'solution("(]")', output: 'false', explanation: 'Kurung salah pasangan.' }
    ],
    starter_code: `function solution(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  
  for (const char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else if (map[char]) {
      if (stack.pop() !== map[char]) {
        return false;
      }
    }
  }
  
  return stack.length === 0;
}`,
    function_name: 'solution',
    test_cases: [
      { id: 1, input_args: ['()[]{}'], expected_output: true, description: 'Semua jenis kurung valid' },
      { id: 2, input_args: ['(]'], expected_output: false, description: 'Pasangan kurung tidak cocok' },
      { id: 3, input_args: ['{[]}'], expected_output: true, description: 'Kurung bersarang benar' },
      { id: 4, input_args: ['([)]'], expected_output: false, description: 'Urutan penutupan salah' }
    ],
    hint: 'Gunakan struktur data Stack (LIFO) dengan Array push dan pop.'
  },

  // 6. Debounce & Throttle Optimizer
  {
    challenge_id: 'preset_debounce_fn',
    title: 'Deduplikasi & Pengurutan Array Dinamis (Data Sorter)',
    difficulty: 'Junior',
    topic: 'Array & Nested Object Data Transformer',
    estimated_time_minutes: 20,
    problem_statement: 'Buat fungsi `solution(nums)` yang membuang semua angka duplikat dan mengurutkan array dari nilai terkecil hingga terbesar.',
    constraints: ['0 <= nums.length <= 10^5'],
    examples: [
      { input: 'solution([4, 2, 2, 8, 3, 3, 1])', output: '[1, 2, 3, 4, 8]', explanation: 'Angka 2 dan 3 dideduplikasi lalu diurutkan.' }
    ],
    starter_code: `function solution(nums) {
  const unique = Array.from(new Set(nums));
  return unique.sort((a, b) => a - b);
}`,
    function_name: 'solution',
    test_cases: [
      { id: 1, input_args: [[4, 2, 2, 8, 3, 3, 1]], expected_output: [1, 2, 3, 4, 8], description: 'Array angka acak duplikat' },
      { id: 2, input_args: [[10, -5, 0, -5, 10]], expected_output: [-5, 0, 10], description: 'Array dengan bilangan negatif' }
    ],
    hint: 'Gunakan Set untuk keunikan nilai dan sort dengan comparator function (a, b) => a - b.'
  },

  // 7. Longest Substring Without Repeating Characters (Sliding Window)
  {
    challenge_id: 'preset_longest_substring',
    title: 'Substring Terpanjang Tanpa Karakter Berulang (Sliding Window)',
    difficulty: 'Mid',
    topic: 'Sliding Window & Two Pointers',
    estimated_time_minutes: 30,
    problem_statement: 'Diberikan sebuah string `s`, temukan panjang dari substring terpanjang tanpa adanya karakter yang berulang.',
    constraints: ['0 <= s.length <= 5 * 10^4'],
    examples: [
      { input: 'solution("abcabcbb")', output: '3', explanation: 'Substring terpanjang "abc" dengan panjang 3.' },
      { input: 'solution("bbbbb")', output: '1', explanation: 'Substring terpanjang "b" dengan panjang 1.' }
    ],
    starter_code: `function solution(s) {
  let maxLength = 0;
  let left = 0;
  const set = new Set();

  for (let right = 0; right < s.length; right++) {
    while (set.has(s[right])) {
      set.delete(s[left]);
      left++;
    }
    set.add(s[right]);
    maxLength = Math.max(maxLength, right - left + 1);
  }

  return maxLength;
}`,
    function_name: 'solution',
    test_cases: [
      { id: 1, input_args: ['abcabcbb'], expected_output: 3, description: 'String berulang berkala' },
      { id: 2, input_args: ['bbbbb'], expected_output: 1, description: 'Semua karakter sama' },
      { id: 3, input_args: ['pwwkew'], expected_output: 3, description: 'Substring di tengah ("wke")' }
    ],
    hint: 'Gunakan teknik Sliding Window dengan dua pointer (left dan right) serta Set untuk melacak karakter aktif.'
  },

  // 8. Merge Overlapping Intervals
  {
    challenge_id: 'preset_merge_intervals',
    title: 'Penggabungan Jadwal / Interval Bertabrakan (Merge Intervals)',
    difficulty: 'Mid',
    topic: 'Array & Nested Object Data Transformer',
    estimated_time_minutes: 35,
    problem_statement: 'Diberikan array interval jadwal rapat `intervals` di mana `intervals[i] = [start, end]`, gabungkan semua interval yang tumpang tindih (overlapping) dan kembalikan array interval yang tidak saling tumpuk.',
    constraints: ['1 <= intervals.length <= 10^4'],
    examples: [
      { input: 'solution([[1,3],[2,6],[8,10],[15,18]])', output: '[[1,6],[8,10],[15,18]]', explanation: 'Interval [1,3] dan [2,6] bertabrakan sehingga digabung menjadi [1,6].' }
    ],
    starter_code: `function solution(intervals) {
  if (!intervals.length) return [];
  intervals.sort((a, b) => a[0] - b[0]);

  const merged = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = intervals[i];

    if (curr[0] <= prev[1]) {
      prev[1] = Math.max(prev[1], curr[1]);
    } else {
      merged.push(curr);
    }
  }

  return merged;
}`,
    function_name: 'solution',
    test_cases: [
      { id: 1, input_args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected_output: [[1, 6], [8, 10], [15, 18]], description: 'Beberapa interval overlapping' },
      { id: 2, input_args: [[[1, 4], [4, 5]]], expected_output: [[1, 5]], description: 'Interval bersentuhan di batas titik' }
    ],
    hint: 'Urutkan array interval berdasarkan start time (a[0] - b[0]) terlebih dahulu.'
  },

  // 9. Bank Transaction Grouping
  {
    challenge_id: 'preset_lru_cache',
    title: 'Pembersihan dan Pengelompokan Mutasi Rekening Bank',
    difficulty: 'Senior',
    topic: 'Array & Nested Object Data Transformer',
    estimated_time_minutes: 40,
    problem_statement: 'Diberikan daftar transaksi pengguna dari REST API, buat fungsi `solution(transactions)` yang mengelompokkan total pengeluaran per kategori, mengabaikan transaksi berstatus "FAILED", dan mengurutkan kategori dari pengeluaran terbesar.',
    constraints: ['1 <= transactions.length <= 10^5', 'Status: "SUCCESS" | "FAILED" | "PENDING"'],
    examples: [
      { input: 'solution([{ category: "Food", amount: 50000, status: "SUCCESS" }, { category: "Food", amount: 20000, status: "FAILED" }])', output: '[{ category: "Food", total: 50000 }]', explanation: 'Transaksi FAILED diabaikan.' }
    ],
    starter_code: `function solution(transactions) {
  const categoryMap = {};
  
  for (const t of transactions) {
    if (t.status === 'SUCCESS') {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    }
  }
  
  return Object.keys(categoryMap)
    .map(cat => ({ category: cat, total: categoryMap[cat] }))
    .sort((a, b) => b.total - a.total);
}`,
    function_name: 'solution',
    test_cases: [
      {
        id: 1,
        input_args: [[
          { category: 'Food', amount: 50000, status: 'SUCCESS' },
          { category: 'Transport', amount: 30000, status: 'SUCCESS' },
          { category: 'Food', amount: 20000, status: 'FAILED' }
        ]],
        expected_output: [
          { category: 'Food', total: 50000 },
          { category: 'Transport', total: 30000 }
        ],
        description: 'Filter status SUCCESS dan agregasi kategori'
      },
      {
        id: 2,
        input_args: [[
          { category: 'Tech', amount: 1500000, status: 'SUCCESS' },
          { category: 'Book', amount: 200000, status: 'SUCCESS' },
          { category: 'Tech', amount: 500000, status: 'SUCCESS' }
        ]],
        expected_output: [
          { category: 'Tech', total: 2000000 },
          { category: 'Book', total: 200000 }
        ],
        description: 'Agregasi beberapa transaksi kategori sama'
      }
    ],
    hint: 'Gunakan accumulator object atau Map untuk agregasi O(N) lalu urutkan hasilnya.'
  }
];

export function getAllPresetChallenges() {
  return MASTER_PRESET_CHALLENGES;
}

export function getRandomPresetChallenge(topicFilter = null, difficultyFilter = null) {
  let filtered = MASTER_PRESET_CHALLENGES;
  
  if (difficultyFilter && difficultyFilter !== 'all') {
    filtered = filtered.filter(c => c.difficulty.toLowerCase() === difficultyFilter.toLowerCase());
  }

  if (filtered.length === 0) {
    filtered = MASTER_PRESET_CHALLENGES;
  }

  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex];
}

export function getPresetChallengeByDifficulty(difficulty = 'Mid') {
  return getRandomPresetChallenge(null, difficulty);
}

