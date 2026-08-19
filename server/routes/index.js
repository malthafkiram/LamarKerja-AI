/**
 * Routes API — hanya mapping URL ke controller. Logika ada di controllers/.
 */
import { Router } from "express";
import { requireAuth, requireAdmin, optionalAuth } from "../middleware/auth.js";
import { uploadFlyer, uploadCv } from "../middleware/upload.js";

import * as auth from "../controllers/authController.js";
import * as directory from "../controllers/directoryController.js";
import * as settings from "../controllers/settingsController.js";
import * as profile from "../controllers/profileController.js";
import * as applications from "../controllers/applicationController.js";
import * as hunter from "../controllers/hunterController.js";
import * as ai from "../controllers/aiController.js";
import * as ats from "../controllers/atsController.js";
import * as cv from "../controllers/cvController.js";
import * as inbox from "../controllers/inboxController.js";
import * as admin from "../controllers/adminController.js";
import * as stats from "../controllers/statsController.js";

const router = Router();

// Auth
router.post("/auth/register", auth.register);
router.post("/auth/login", auth.login);
router.get("/auth/me", requireAuth, auth.me);

// Job directory
router.get("/directory/jobs", optionalAuth, directory.listJobs);
router.get("/directory/news", optionalAuth, directory.listNews);
router.post("/directory/sync", directory.syncJobs);
router.post("/directory/apply/:jobId", requireAuth, directory.applyToJob);

// Settings & health
router.get("/health", settings.health);
router.get("/stats", stats.getStats);
router.get("/stats/stream", stats.streamStats);
router.get("/settings", settings.getAppSettings);
router.post("/settings/smtp", requireAuth, settings.savePersonalSmtp);
router.post("/settings", optionalAuth, settings.saveGlobalSettings);
router.post("/test-smtp", optionalAuth, settings.testSmtp);

// Profile
router.get("/profile", optionalAuth, profile.getUserProfile);
router.post("/profile", requireAuth, profile.saveUserProfile);
router.post(
  "/profile/upload-cv",
  requireAuth,
  uploadCv.single("cv_file"),
  profile.uploadCv,
);
router.delete("/profile/cv", requireAuth, profile.deleteCv);
router.post("/profile/optimize", requireAuth, profile.optimizeUserProfile);

// Applications
router.post(
  "/scan-brochure",
  requireAuth,
  uploadFlyer.single("flyer_image"),
  applications.scanBrochure,
);
router.post("/send-application", requireAuth, applications.sendApplication);
router.get("/applications", requireAuth, applications.listApplications);
router.post("/applications", requireAuth, applications.createApplication);
router.patch(
  "/applications/:id/status",
  requireAuth,
  applications.updateApplicationStatus,
);
router.patch(
  "/applications/:id",
  requireAuth,
  applications.updateApplicationStatus,
);
router.delete("/applications/:id", requireAuth, applications.deleteApplication);
router.post(
  "/applications/:id/follow-up-draft",
  requireAuth,
  applications.followUpDraft,
);
router.post(
  "/applications/:id/send-follow-up",
  requireAuth,
  applications.sendFollowUp,
);

// Auto-Hunter
router.get("/hunter/jobs", optionalAuth, hunter.listHunterJobs);
router.post("/hunter/crawl", requireAuth, hunter.runCrawl);
router.post("/hunter/apply/:jobId", requireAuth, hunter.applyHunterJob);

// AI career tools
router.post("/interview/start", optionalAuth, ai.startInterview);
router.post("/interview/evaluate", optionalAuth, ai.evaluateInterview);
router.post("/salary/insight", optionalAuth, ai.salaryInsight);
router.post("/antiscam/audit", optionalAuth, ai.antiScamAudit);
router.post("/project/pitch", optionalAuth, ai.projectPitch);
router.post("/career/roadmap", requireAuth, ai.careerRoadmap);
router.post("/whatsapp/generate-chat", requireAuth, ai.whatsappChat);
router.post("/cover-letter/generate", requireAuth, ai.coverLetter);
router.post("/company/intelligence", requireAuth, ai.companyIntelligence);
router.post("/livecode/generate-challenge", optionalAuth, ai.generateLiveCode);
router.post("/livecode/review-code", optionalAuth, ai.reviewLiveCode);
router.get("/livecode/preset-challenges", ai.presetChallenges);

// ATS & CV
router.post("/ats/audit", uploadCv.single("cv_file"), ats.auditResume);
router.post("/ats/rewrite-star", ats.rewriteStar);
router.post("/cv/refine", optionalAuth, cv.refineCv);
router.post("/cv/save", optionalAuth, cv.saveCv);
router.get("/cv/saved", optionalAuth, cv.getSavedCv);

// Inbox
router.get("/inbox", requireAuth, inbox.getInbox);
router.post("/inbox/sync", requireAuth, inbox.syncInbox);
router.patch("/inbox/read", requireAuth, inbox.markRead);

// Admin
router.get("/admin/users", requireAuth, requireAdmin, admin.listUsers);
router.post(
  "/admin/upgrade-user",
  requireAuth,
  requireAdmin,
  admin.upgradeUser,
);
router.delete(
  "/admin/user/:userId",
  requireAuth,
  requireAdmin,
  admin.deleteUser,
);
router.get("/logs", requireAuth, requireAdmin, admin.listLogs);

export default router;
