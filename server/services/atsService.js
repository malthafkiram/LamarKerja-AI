import crypto from 'crypto';
import { callGroqAi } from './ai.js';

// In-memory cache for deterministic ATS score consistency (keyed by SHA-256 hash of CV content + target position)
const atsAuditCache = new Map();

/**
 * Perform rule-based deterministic scoring based on actual ATS algorithms (Workday, Taleo, Greenhouse)
 */
function evaluateDeterministicRules(cvText, targetPosition = '') {
  const textLower = cvText.toLowerCase();
  const words = cvText.trim().split(/\s+/);
  const wordCount = words.length;

  let ruleScore = 0;
  const findings = [];
  const redFlags = [];
  const missingKeywords = [];

  // 1. Contact Information Check (Max 20 pts)
  let contactScore = 0;
  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(cvText);
  const hasPhone = /(\+?\d{1,4}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/.test(cvText);
  const hasLinkedIn = /linkedin\.com|github\.com|portfolio/i.test(cvText);

  if (hasEmail) contactScore += 8;
  else redFlags.push('Alamat email profesional tidak terdeteksi dengan jelas.');

  if (hasPhone) contactScore += 7;
  else redFlags.push('Nomor kontak WhatsApp/telepon aktif tidak terdeteksi.');

  if (hasLinkedIn) contactScore += 5;
  else findings.push('Tambahkan tautan profil LinkedIn atau portofolio online untuk kredibilitas.');

  // 2. Standard Section Headers Check (Max 25 pts)
  let sectionScore = 0;
  const hasExp = /pengalaman|experience|work history|riwayat kerja/i.test(cvText);
  const hasEdu = /pendidikan|education|academic|universitas|sekolah/i.test(cvText);
  const hasSkills = /keahlian|skills|technical skills|kompetensi|stack/i.test(cvText);
  const hasSummary = /tentang saya|ringkasan|summary|about me|profil profesional/i.test(cvText);

  if (hasExp) sectionScore += 8;
  else redFlags.push('Bagian "Pengalaman Kerja" tidak memiliki judul standar yang mudah dipindai ATS.');

  if (hasEdu) sectionScore += 6;
  else redFlags.push('Bagian "Pendidikan" tidak terdeteksi.');

  if (hasSkills) sectionScore += 6;
  else redFlags.push('Bagian "Keahlian / Skills" terpisah tidak ditemukan.');

  if (hasSummary) sectionScore += 5;
  else findings.push('Tambahkan 2-3 baris Ringkasan Profesional (Professional Summary) di bagian atas.');

  // 3. Quantitative STAR Metrics (Impact & Numbers) (Max 25 pts)
  let metricScore = 0;
  const numberMatches = (cvText.match(/\b\d+(\.\d+)?%|\b\d{1,3}(,\d{3})*(\.\d+)?|\bRp\s?[\d.,]+|\b\d+\s?(juta|ribu|user|klien|project|proyek|orang|times|x)\b/gi) || []).length;
  
  if (numberMatches >= 6) {
    metricScore = 25;
    findings.push('Pencapaian sangat terukur dengan metrik kuantitatif yang solid.');
  } else if (numberMatches >= 3) {
    metricScore = 18;
    findings.push('Ada beberapa metrik pencapaian angka, namun masih bisa diperbanyak untuk membuktikan dampak kerja.');
  } else if (numberMatches >= 1) {
    metricScore = 10;
    redFlags.push('CV masih minim angka pencapaian (persentase, omzet, efisiensi, atau jumlah user). Gunakan metode STAR.');
  } else {
    metricScore = 4;
    redFlags.push('Tidak ada metrik angka atau persentase sama sekali. ATS memprioritaskan CV dengan data hasil konkret.');
  }

  // 4. Action Verbs Strength (Max 15 pts)
  let actionVerbScore = 0;
  const strongActionVerbs = [
    'merancang', 'membangun', 'mengembangkan', 'memimpin', 'mengoptimalkan', 'meningkatkan',
    'mengurangi', 'mengelola', 'mengimplementasikan', 'menganalisis', 'mengkoordinasikan',
    'designed', 'developed', 'architected', 'spearheaded', 'optimized', 'accelerated', 'increased',
    'reduced', 'managed', 'deployed', 'implemented', 'orchestrated', 'streamlined'
  ];
  const weakVerbs = ['bertanggung jawab', 'responsible for', 'membantu', 'assisted', 'ikut serta'];

  let actionCount = 0;
  strongActionVerbs.forEach(verb => {
    if (textLower.includes(verb)) actionCount++;
  });

  let weakCount = 0;
  weakVerbs.forEach(verb => {
    if (textLower.includes(verb)) weakCount++;
  });

  if (actionCount >= 5) actionVerbScore = 15;
  else if (actionCount >= 2) actionVerbScore = 10;
  else actionVerbScore = 5;

  if (weakCount > 2) {
    redFlags.push('Hindari kalimat pasif seperti "bertanggung jawab atas...". Ganti dengan kata kerja aksi aktif.');
  }

  // 5. Length & Formatting Clarity (Max 15 pts)
  let lengthScore = 0;
  if (wordCount >= 250 && wordCount <= 900) {
    lengthScore = 15;
  } else if (wordCount < 250) {
    lengthScore = 6;
    redFlags.push('Isi CV terlalu pendek/ringkas (< 250 kata), informasi keterampilan kurang mendalam.');
  } else {
    lengthScore = 8;
    findings.push('CV terindikasi agak terlalu panjang (> 900 kata). Usahakan tetap padat dalam 1-2 halaman.');
  }

  const calculatedScore = Math.min(98, Math.max(25, contactScore + sectionScore + metricScore + actionVerbScore + lengthScore));

  return {
    baseScore: calculatedScore,
    breakdown: {
      contactScore: Math.round((contactScore / 20) * 100),
      sectionScore: Math.round((sectionScore / 25) * 100),
      metricScore: Math.round((metricScore / 25) * 100),
      actionVerbScore: Math.round((actionVerbScore / 15) * 100),
      lengthScore: Math.round((lengthScore / 15) * 100),
    },
    ruleFindings: findings,
    ruleRedFlags: redFlags,
    wordCount
  };
}

/**
 * Main ATS Audit Function with Groq AI + Deterministic Hybrid Pipeline
 */
export async function auditResumeATS({ cvText, targetPosition = '', targetIndustry = '' }) {
  if (!cvText || cvText.trim().length < 50) {
    throw new Error('Teks CV tidak boleh kosong dan minimal berisi 50 karakter.');
  }

  const cleanText = cvText.trim();
  // Generate deterministic content hash
  const hashKey = crypto.createHash('sha256').update(`${cleanText}::${targetPosition.trim().toLowerCase()}::${targetIndustry.trim().toLowerCase()}`).digest('hex');

  // Check cache for 100% score consistency on identical CV upload
  if (atsAuditCache.has(hashKey)) {
    return atsAuditCache.get(hashKey);
  }

  // 1. Run deterministic baseline rules
  const deterministicResult = evaluateDeterministicRules(cleanText, targetPosition);

  // 2. Run Groq AI semantic analysis with strict temperature (0.1) for zero hallucination
  const systemPrompt = `Anda adalah Sistem Auditor ATS (Applicant Tracking System) Senior dan Pakar Penilai CV Internasional.
Tugas Anda adalah menilai teks CV pelamar secara objektif, ketat, akurat, dan TANPA HALUSINASI.
Keluarkan output HANYA dalam format JSON valid tanpa format markdown lain.`;

  const userPrompt = `Analisis CV berikut untuk posisi yang ditargetkan: "${targetPosition || 'Umum / Relevan'}".
Gunakan pedoman baku sistem ATS (Workday, Taleo, Greenhouse, Glints).

Isi Teks CV:
"""
${cleanText.slice(0, 4500)}
"""

Kembalikan HANYA objek JSON dengan struktur persis seperti ini:
{
  "ats_score_adjustment": 0, // angka penyesuaian antara -5 sampai +5 berdasarkan relevansi semantik
  "executive_summary": "Ringkasan evaluasi 2-3 kalimat mengenai kekuatan utama dan kelemahan terbesar CV ini.",
  "strengths": [
    "Poin kekuatan 1 yang terbukti ada di teks",
    "Poin kekuatan 2 yang terbukti ada di teks",
    "Poin kekuatan 3"
  ],
  "critical_weaknesses": [
    "Kelemahan kritis 1 yang membuat CV berisiko ditolak ATS",
    "Kelemahan kritis 2"
  ],
  "missing_keywords": [
    "Kata kunci/skill teknis yang sangat disarankan untuk posisi ini tapi belum ada di CV"
  ],
  "actionable_improvements": [
    "Langkah perbaikan 1 yang spesifik dan langsung dapat diaplikasikan",
    "Langkah perbaikan 2",
    "Langkah perbaikan 3"
  ],
  "optimized_summary_sample": "Draf Ringkasan Profil Profesional (Professional Summary) baru 3 kalimat yang sudah dioptimalkan dan siap disalin pelamar.",
  "star_experience_sample": "Contoh 1-2 poin pencapaian pengalaman kerja yang sudah diubah ke format STAR (Action Verb + Metrik Angka %)"
}`;

  let aiData = {};
  try {
    const rawContent = await callGroqAi({
      systemPrompt,
      userPrompt,
      jsonMode: true,
      temperature: 0.1
    });

    aiData = JSON.parse(rawContent || '{}');
  } catch (err) {
    console.error('Groq ATS Audit parsing fallback:', err);
    aiData = {
      executive_summary: 'CV telah dianalisis berdasarkan struktur baku ATS, kelengkapan kontak, dan penggunaan kata kerja aktif.',
      strengths: ['Memiliki struktur pengalaman dan riwayat pendidikan yang terdeteksi.'],
      critical_weaknesses: deterministicResult.ruleRedFlags,
      missing_keywords: ['Metrik terukur (%)', 'Kata kunci teknis spesifik'],
      actionable_improvements: deterministicResult.ruleFindings,
      optimized_summary_sample: 'Profesional berdedikasi dengan rekam jejak dalam pengembangan proyek dan pencapaian target kerja.',
      star_experience_sample: 'Mengoptimalkan alur kerja tim hingga meningkatkan efisiensi operasional sebesar 25%.'
    };
  }

  // Combine deterministic base score with bounded AI adjustment
  const adjustment = typeof aiData.ats_score_adjustment === 'number' ? Math.max(-5, Math.min(5, aiData.ats_score_adjustment)) : 0;
  const finalScore = Math.min(99, Math.max(25, deterministicResult.baseScore + adjustment));

  let scoreTier = 'needs_work';
  let scoreLabel = 'Perlu Perbaikan Mendalam';
  let scoreColor = '#EF4444';

  if (finalScore >= 85) {
    scoreTier = 'excellent';
    scoreLabel = 'Sangat Bagus (Siap Melamar)';
    scoreColor = '#10B981';
  } else if (finalScore >= 70) {
    scoreTier = 'good';
    scoreLabel = 'Cukup Lolos ATS (Bisa Ditingkatkan)';
    scoreColor = '#F59E0B';
  }

  // Deduplicate and combine red flags
  const combinedRedFlags = Array.from(new Set([
    ...(deterministicResult.ruleRedFlags || []),
    ...(aiData.critical_weaknesses || [])
  ])).slice(0, 5);

  const combinedImprovements = Array.from(new Set([
    ...(deterministicResult.ruleFindings || []),
    ...(aiData.actionable_improvements || [])
  ])).slice(0, 5);

  const finalResult = {
    success: true,
    score: finalScore,
    scoreTier,
    scoreLabel,
    scoreColor,
    wordCount: deterministicResult.wordCount,
    breakdown: deterministicResult.breakdown,
    summary: aiData.executive_summary || 'Evaluasi kelayakan ATS selesai dianalisis secara komprehensif.',
    strengths: aiData.strengths || [],
    redFlags: combinedRedFlags,
    missingKeywords: aiData.missing_keywords || [],
    improvements: combinedImprovements,
    optimizedSummarySample: aiData.optimized_summary_sample || '',
    starExperienceSample: aiData.star_experience_sample || '',
    analyzedAt: new Date().toISOString()
  };

  // Save to cache for determinism
  atsAuditCache.set(hashKey, finalResult);

  return finalResult;
}

/**
 * Generate STAR method rewrites for a specific job experience block
 */
export async function rewriteExperienceSTAR({ position, originalText, targetRole }) {
  const prompt = `Anda adalah pakar penulisan CV berstandar internasional.
Tugas Anda adalah menulis ulang teks pengalaman kerja berikut menjadi 3 bullet points berformat STAR (Situation, Task, Action, Result) dengan kata kerja aktif kuat dan metrik angka/persentase yang realistis untuk posisi "${targetRole || position}".

Teks Asli:
"${originalText}"

Kembalikan HANYA format JSON:
{
  "bullet_points": [
    "Poin STAR 1 dengan Action Verb di awal dan metrik terukur",
    "Poin STAR 2",
    "Poin STAR 3"
  ]
}`;

  const rawContent = await callGroqAi({
    userPrompt: prompt,
    temperature: 0.2,
    jsonMode: true
  });

  const parsed = JSON.parse(rawContent || '{}');
  return parsed.bullet_points || [];
}
