import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import JobDirectoryHub from "./components/JobDirectoryHub";
import BrochureScanner from "./components/BrochureScanner";
import LiveCodeArena from "./components/LiveCodeArena";
import ATSResumeChecker from "./components/ATSResumeChecker";
import CVGenerator from "./components/CVGenerator";
import ApplicationTracker from "./components/ApplicationTracker";
import ProfileManager from "./components/ProfileManager";
import TutorialGuide from "./components/TutorialGuide";
import SettingsModal from "./components/SettingsModal";
import AuthModal from "./components/AuthModal";
import LockedFeature from "./components/LockedFeature";
import HRInboxModal from "./components/HRInboxModal";
import InterviewSimulatorModal from "./components/InterviewSimulatorModal";
import AboutModal from "./components/AboutModal";
import SecurityModal from "./components/SecurityModal";
import ContactModal from "./components/ContactModal";
import InstallAppModal from "./components/InstallAppModal";
import UpgradeProModal from "./components/UpgradeProModal";
import LoadingOverlay from "./components/LoadingOverlay";
import BrandLogo from "./components/BrandLogo";
import SocialProofStats from "./components/SocialProofStats";
import PlanStatusBanner from "./components/PlanStatusBanner";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import useSocialProof from "./hooks/useSocialProof";
import { pickSmtpFields } from "./utils/smtpConfig";
import { fetchWithTimeout } from "./utils/fetchWithTimeout";

const BOOT_FETCH_MS = 8000;

function AppContent() {
  const { t, lang } = useLanguage();
  const socialProof = useSocialProof();
  const [activeTab, setActiveTab] = useState("jobs");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [isUpgradeProOpen, setIsUpgradeProOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);
  const [interviewJobForModal, setInterviewJobForModal] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [profile, setProfile] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    sent_today: 0,
    total_sent: 0,
    interview: 0,
    drafts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Catch PWA beforeinstallprompt event for 1-click Android installation
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setDeferredPrompt(null);
      console.log("LamarKerja AI installed successfully!");
    });

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  // Initialize auth and app data
  useEffect(() => {
    initAuthAndData();
  }, []);

  const persistUser = (user) => {
    if (!user) return;
    setCurrentUser((prev) => {
      const next = { ...(prev || {}), ...user };
      localStorage.setItem("lamarkerja_user", JSON.stringify(next));
      return next;
    });
  };

  const fetchInboxCount = async () => {
    try {
      const token = localStorage.getItem("lamarkerja_token");
      if (!token) return;
      const res = await fetch("/api/inbox", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setUnreadInboxCount(data.unreadCount || 0);
      }
    } catch {}
  };

  const initAuthAndData = async () => {
    try {
      const storedUser = localStorage.getItem("lamarkerja_user");
      const token = localStorage.getItem("lamarkerja_token");

      if (storedUser && token) {
        try {
          const userObj = JSON.parse(storedUser);
          setCurrentUser(userObj);

          // Verify token
          const meRes = await fetchWithTimeout(
            "/api/auth/me",
            { headers: { Authorization: `Bearer ${token}` } },
            BOOT_FETCH_MS,
          );
          const meData = await meRes.json();
          if (meData.success) {
            persistUser(meData.user);
          } else {
            handleLogout();
          }
        } catch {
          handleLogout();
        }
      }

      await loadInitialData();
    } catch (err) {
      console.error("Initialization error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInitialData = async () => {
    try {
      const token = localStorage.getItem("lamarkerja_token");
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Fetch Settings
      const resSettings = await fetchWithTimeout(
        "/api/settings",
        { headers: authHeaders },
        BOOT_FETCH_MS,
      );
      const dataSettings = await resSettings.json();
      if (dataSettings.success) setSettings(dataSettings.settings);

      // 2. Fetch Profile
      const resProfile = await fetchWithTimeout(
        "/api/profile",
        { headers: authHeaders },
        BOOT_FETCH_MS,
      );
      const dataProfile = await resProfile.json();
      if (dataProfile.success) setProfile(dataProfile.profile);

      // 3. Fetch Applications Stats & Inbox if logged in
      if (token) {
        const meRes = await fetchWithTimeout(
          "/api/auth/me",
          { headers: authHeaders },
          BOOT_FETCH_MS,
        );
        const meData = await meRes.json();
        if (meData.success) persistUser(meData.user);

        const resApps = await fetchWithTimeout(
          "/api/applications",
          { headers: authHeaders },
          BOOT_FETCH_MS,
        );
        const dataApps = await resApps.json();
        if (dataApps.success) setStats(dataApps.stats);
        await fetchInboxCount();
      }
    } catch (err) {
      console.error("Failed to load initial data:", err);
    }
  };

  const handleAuthSuccess = (user, token) => {
    persistUser(user);
    loadInitialData();
    fetchInboxCount();
  };

  const handleLogout = () => {
    localStorage.removeItem("lamarkerja_token");
    localStorage.removeItem("lamarkerja_user");
    setCurrentUser(null);
    setProfile({});
    setStats({
      total: 0,
      sent_today: 0,
      total_sent: 0,
      interview: 0,
      drafts: 0,
    });
    setActiveTab("jobs");
  };

  const refreshStats = async () => {
    try {
      const token = localStorage.getItem("lamarkerja_token");
      if (!token) return;
      const res = await fetch("/api/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) {
      console.error("Failed to refresh stats:", err);
    }
  };

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      {isLoading && <LoadingOverlay />}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        stats={stats}
        currentUser={currentUser}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenInbox={() => setIsInboxOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onOpenContact={() => setIsContactOpen(true)}
        onOpenUpgradePro={() => setIsUpgradeProOpen(true)}
        unreadInboxCount={unreadInboxCount}
      />

      {currentUser && (
        <div style={{ maxWidth: "1440px", width: "100%", margin: "0 auto", padding: "0 20px" }}>
          <PlanStatusBanner
            currentUser={currentUser}
            stats={stats}
            settings={settings}
            lang={lang}
            onOpenUpgradePro={() => setIsUpgradeProOpen(true)}
          />
        </div>
      )}

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          maxWidth: "1440px",
          width: "100%",
          margin: "0 auto",
          padding: "24px 20px",
        }}
      >
        {/* Tab 1: Multi-Platform Job Directory (Accessible to all) */}
        {activeTab === "jobs" && (
          <JobDirectoryHub
            profile={profile}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onApplicationSent={refreshStats}
          />
        )}

        {/* Tab 2: 1-Click AI CV Generator & ATS Builder */}
        {activeTab === "cv-builder" && (
          <CVGenerator
            currentUser={currentUser}
            onProfileUpdated={loadInitialData}
            onOpenUpgradePro={() => setIsUpgradeProOpen(true)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onUserUpdated={persistUser}
          />
        )}

        {/* Tab 3: AI ATS Resume Scanner & CV Auditor */}
        {activeTab === "ats" && (
          <ATSResumeChecker onNavigateTab={(tab) => setActiveTab(tab)} />
        )}

        {/* Tab 3: Drop & Send (Scanner) - Requires Login */}
        {activeTab === "scanner" &&
          (currentUser ? (
            <BrochureScanner
              profile={profile}
              settings={settings}
              currentUser={currentUser}
              onApplicationSent={refreshStats}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          ) : (
            <LockedFeature
              featureName={
                lang === "id"
                  ? "Drop & Send (Scanner Brosur)"
                  : "Drop & Send (Flyer OCR Scanner)"
              }
              description={
                lang === "id"
                  ? "Fitur pemindai brosur otomatis berbasis OCR Tesseract dan Groq AI memerlukan akun agar surat lamaran dan riwayat pengiriman dapat dipersonalisasi dengan profil CV Anda."
                  : "Flyer scanner powered by Tesseract OCR and Groq AI requires an account to personalize cover letters with your CV details."
              }
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          ))}

        {/* Tab 4: Live Code Arena - Interactive Coding & Skill Simulator */}
        {activeTab === "livecode" && (
          <LiveCodeArena
            profile={profile}
            initialJobDetails={interviewJobForModal}
          />
        )}

        {/* Tab 5: Tracker - Requires Login */}
        {activeTab === "tracker" &&
          (currentUser ? (
            <ApplicationTracker
              stats={stats}
              currentUser={currentUser}
              settings={settings}
              onRefresh={refreshStats}
            />
          ) : (
            <LockedFeature
              featureName={
                lang === "id"
                  ? "Riwayat & Pelacak Lamaran"
                  : "Application History & Tracker"
              }
              description={
                lang === "id"
                  ? "CRM lamaran pribadi: tambah manual, pipeline status, follow-up 5 hari, dan Catat sebagai dilamar. Bukan feed Glints/JobStreet."
                  : "Private application CRM: manual add, status pipeline, 5-day follow-up, and Mark as applied. Not a Glints/JobStreet feed."
              }
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          ))}

        {/* Tab 6: Profile & CV - Requires Login */}
        {activeTab === "profile" &&
          (currentUser ? (
            <ProfileManager
              profile={profile}
              currentUser={currentUser}
              onProfileUpdated={(updated) => setProfile(updated)}
            />
          ) : (
            <LockedFeature
              featureName={
                lang === "id"
                  ? "Profil & Manajemen CV"
                  : "Profile & CV Management"
              }
              description={
                lang === "id"
                  ? "Unggah PDF CV dan simpan keahlian di PostgreSQL pada server/database yang menjalankan aplikasi ini (akun diperlukan)."
                  : "Upload a PDF CV and store skills in PostgreSQL on the server running this app (an account is required)."
              }
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          ))}

        {/* Tab 7: Tutorial & FAQ (Accessible to all) */}
        {activeTab === "tutorial" && (
          <TutorialGuide
            onOpenSettings={() => setIsSettingsOpen(true)}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        currentUser={currentUser}
        onSmtpSaved={(smtp) => {
          const fields = pickSmtpFields(smtp);
          setProfile((prev) => ({ ...prev, ...fields }));
          setSettings((prev) => ({ ...prev, ...fields }));
        }}
        onSettingsUpdated={(updated) => {
          const next = { ...(updated || {}) };
          delete next.smtp_user;
          delete next.smtp_pass;
          delete next.sender_name;
          setSettings((prev) => ({ ...prev, ...next }));
        }}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        deferredPrompt={deferredPrompt}
        onInstallApp={() => setIsInstallOpen(true)}
        onUserUpdated={persistUser}
      />

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        visitors={socialProof.visitors}
        registered={socialProof.registered}
        live={socialProof.live}
      />

      {/* HR Inbox Modal */}
      <HRInboxModal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        currentUser={currentUser}
        onLaunchInterview={(job) => setInterviewJobForModal(job)}
        onInboxUpdated={fetchInboxCount}
      />

      {/* Simulated Interview Modal if triggered from Inbox */}
      <InterviewSimulatorModal
        isOpen={!!interviewJobForModal}
        onClose={() => setInterviewJobForModal(null)}
        jobDetails={interviewJobForModal}
      />

      {/* About Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        visitors={socialProof.visitors}
        registered={socialProof.registered}
        live={socialProof.live}
      />

      {/* Security / Features Modal */}
      <SecurityModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
      />

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      {/* Upgrade PRO Modal */}
      <UpgradeProModal
        isOpen={isUpgradeProOpen}
        onClose={() => setIsUpgradeProOpen(false)}
        currentUser={currentUser}
      />

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border-glass)",
          padding: "24px 20px",
          textAlign: "center",
          fontSize: "0.8rem",
          color: "var(--text-dim)",
          background: "rgba(7, 9, 14, 0.95)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <BrandLogo size={24} wordmarkSize="0.9rem" />
        </div>
        <SocialProofStats
          visitors={socialProof.visitors}
          registered={socialProof.registered}
          live={socialProof.live}
        />
        <div
          style={{
            fontSize: "0.74rem",
            color: "#94A3B8",
            display: "flex",
            gap: "14px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <span>📍 Jl. Dwijaya 4 No. 13, Kebayoran Lama, Jakarta Selatan</span>
          <span>📧 malthafkiram@gmail.com</span>
          <span>📞 +62 851-5771-5522</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
