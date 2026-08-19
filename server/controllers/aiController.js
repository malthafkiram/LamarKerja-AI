/**
 * Controller fitur AI: interview, gaji, anti-scam, pitch, roadmap, WA, surat, intel, live-code.
 */
import { JobDirectory } from '../models/index.js';
import { getProfile } from '../helpers/dbHelpers.js';
import {
  generateInterviewQuestions,
  evaluateInterviewAnswer,
  getSalaryInsight,
  performAntiScamAudit,
  generateProjectPitch,
  generateCareerRoadmap,
  generateWhatsAppApplyChat,
  generateCoverLetter,
  generateCompanyIntelligence,
  generateLiveCodeChallenge,
  reviewSubmittedCode,
  getAllPresetChallenges
} from '../services/ai.js';
import { ok, fail, uid } from '../helpers/response.js';
import { toPublicList } from '../views/serialize.js';

export async function startInterview(req, res) {
  try {
    const { position, company, requirements } = req.body;
    const profile = req.user ? await getProfile(uid(req.user)) : {};
    const interviewData = await generateInterviewQuestions(
      position || 'Software Engineer',
      company || 'Perusahaan Impian',
      requirements || [],
      profile.skills || []
    );
    return ok(res, { interviewData });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function evaluateInterview(req, res) {
  try {
    const { question, answer, position, company } = req.body;
    if (!answer || answer.trim().length < 5) {
      return fail(res, 'Harap berikan jawaban minimal 1 kalimat.', 400);
    }
    const evaluation = await evaluateInterviewAnswer(question, answer, position, company);
    return ok(res, { evaluation });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function salaryInsight(req, res) {
  try {
    const { position, location, experienceLevel } = req.body;
    const insight = await getSalaryInsight(
      position || 'Software Engineer',
      location || 'Indonesia',
      experienceLevel || '1-3 Tahun'
    );
    return ok(res, { insight });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function antiScamAudit(req, res) {
  try {
    const { jobText, email, company } = req.body;
    const audit = await performAntiScamAudit(jobText || '', email || '', company || '');
    return ok(res, { audit });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function projectPitch(req, res) {
  try {
    const { projectName, techStack, description, githubUrl, targetRole } = req.body;
    if (!projectName) return fail(res, 'Nama proyek tidak boleh kosong.', 400);
    const pitch = await generateProjectPitch({ projectName, techStack, description, githubUrl, targetRole });
    return ok(res, { pitch });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function careerRoadmap(req, res) {
  try {
    const profile = await getProfile(uid(req.user));
    const sampleJobs = await JobDirectory.findAll({ limit: 15 });
    const roadmap = await generateCareerRoadmap(profile, toPublicList(sampleJobs));
    return ok(res, { roadmap });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function whatsappChat(req, res) {
  try {
    const { jobDetails } = req.body;
    const profile = await getProfile(uid(req.user));
    const chatData = await generateWhatsAppApplyChat({ profile, jobDetails });
    return ok(res, { chatData });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function coverLetter(req, res) {
  try {
    const { companyName, position, requirements, language, location, description, jobDetails } = req.body;
    const profile = await getProfile(uid(req.user));
    const letterData = await generateCoverLetter({
      profile,
      companyName: companyName || jobDetails?.company_name || 'Perusahaan Terkait',
      position: position || jobDetails?.position || 'Software Engineer',
      requirements: requirements || jobDetails?.requirements || [],
      language: language || 'id',
      jobDetails: {
        ...(jobDetails || {}),
        location: location || jobDetails?.location,
        description: description || jobDetails?.description
      }
    });
    return ok(res, { letterData });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function companyIntelligence(req, res) {
  try {
    const { companyName, position, industry } = req.body;
    const intelligence = await generateCompanyIntelligence({
      companyName: companyName || 'Perusahaan Terkait',
      position: position || 'Posisi Terbuka',
      industry: industry || 'Teknologi & Bisnis'
    });
    return ok(res, { intelligence });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function generateLiveCode(req, res) {
  try {
    const { position, companyName, techStack, difficulty, topic } = req.body;
    const challenge = await generateLiveCodeChallenge({
      position: position || 'Fullstack Web Developer',
      companyName: companyName || 'Perusahaan Terkemuka',
      techStack: techStack || 'JavaScript, React, Node.js',
      difficulty: difficulty || 'Mid',
      topic: topic || 'Algoritma & Frontend'
    });
    return ok(res, { challenge });
  } catch (error) {
    return fail(res, error.message);
  }
}

export async function reviewLiveCode(req, res) {
  try {
    const { challengeTitle, problemStatement, candidateCode, language, testResults } = req.body;
    if (!candidateCode || !candidateCode.trim()) {
      return fail(res, 'Kode program tidak boleh kosong.', 400);
    }
    const review = await reviewSubmittedCode({
      challengeTitle: challengeTitle || 'Tantangan Koding',
      problemStatement: problemStatement || 'Selesaikan fungsi sesuai spesifikasi.',
      candidateCode,
      language: language || 'javascript',
      testResults: testResults || []
    });
    return ok(res, { review });
  } catch (error) {
    return fail(res, error.message);
  }
}

export function presetChallenges(req, res) {
  try {
    const { category, difficulty } = req.query;
    let challenges = getAllPresetChallenges();
    if (difficulty && difficulty !== 'all') {
      challenges = challenges.filter((c) => c.difficulty.toLowerCase() === difficulty.toLowerCase());
    }
    if (category && category !== 'all') {
      challenges = challenges.filter((c) => c.topic.toLowerCase().includes(category.toLowerCase()));
    }
    return ok(res, { challenges });
  } catch (error) {
    return fail(res, error.message);
  }
}
