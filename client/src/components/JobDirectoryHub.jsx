import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  Globe,
  Search,
  MapPin,
  Briefcase,
  DollarSign,
  Building,
  Newspaper,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Share2,
  Compass,
  Layers,
  Zap,
  MessageSquare,
  Award,
  MessageCircle,
  FileText,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Code2,
  BookmarkPlus,
  List,
} from "lucide-react";
import confetti from "canvas-confetti";
import InterviewSimulatorModal from "./InterviewSimulatorModal";
import SalaryInsightModal from "./SalaryInsightModal";
import WhatsAppApplyModal from "./WhatsAppApplyModal";
import CoverLetterModal from "./CoverLetterModal";
import CompanyIntelligenceModal from "./CompanyIntelligenceModal";
import LiveCodeModal from "./LiveCodeModal";
import LoadingOverlay from "./LoadingOverlay";
import { useLanguage } from "../context/LanguageContext";
import { isVerySmallScreen } from "../utils/jobGlobeGeo";

const JobGlobeView = lazy(() => import("./JobGlobeView"));

export default function JobDirectoryHub({
  profile,
  currentUser,
  onOpenAuth,
  onApplicationSent,
}) {
  const { t, lang } = useLanguage();
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [platformCounts, setPlatformCounts] = useState({});
  const [search, setSearch] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [selectedWorkType, setSelectedWorkType] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [interviewJob, setInterviewJob] = useState(null);
  const [salaryJob, setSalaryJob] = useState(null);
  const [whatsAppJob, setWhatsAppJob] = useState(null);
  const [coverLetterJob, setCoverLetterJob] = useState(null);
  const [companySpyJob, setCompanySpyJob] = useState(null);
  const [liveCodeJob, setLiveCodeJob] = useState(null);
  const [loggedUrls, setLoggedUrls] = useState({});
  const [logBusyId, setLogBusyId] = useState(null);
  const [logMessage, setLogMessage] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [globeJobs, setGlobeJobs] = useState([]);
  const [isGlobeLoading, setIsGlobeLoading] = useState(false);
  const [globeNotice, setGlobeNotice] = useState(null);
  const [newsItems, setNewsItems] = useState([]);
  const [newsTotal, setNewsTotal] = useState(0);
  const [newsPage, setNewsPage] = useState(1);
  const [newsTotalPages, setNewsTotalPages] = useState(1);
  const [newsKind, setNewsKind] = useState("all");
  const [newsError, setNewsError] = useState(null);
  const [newsNotice, setNewsNotice] = useState(null);

  const platforms = [
    { id: "all", label: "Semua Platform", color: "#0EA5E9" },
    {
      id: "LinkedIn",
      label: "LinkedIn",
      color: "#0A66C2",
      searchUrl: () => "https://www.linkedin.com/jobs/",
    },
    {
      id: "Dealls",
      label: "Dealls Jobs",
      color: "#8B5CF6",
      searchUrl: () => "https://dealls.com/jobs",
    },
    {
      id: "Disnakerja",
      label: "Disnakerja (BUMN)",
      color: "#10B981",
      searchUrl: () => "https://disnakerja.com/",
    },
    {
      id: "KarirJakarta",
      label: "KarirJakarta (DKI)",
      color: "#FF6636",
      searchUrl: () => "https://karir.jakarta.go.id/jobs",
    },
    {
      id: "Karirhub",
      label: "Karirhub Kemnaker",
      color: "#CA8A04",
      searchUrl: () =>
        "https://karirhub.kemnaker.go.id/lowongan-dalam-negeri/lowongan",
    },
    {
      id: "Toploker",
      label: "Toploker",
      color: "#149FC0",
      searchUrl: () => "https://toploker.com/loker/daftar",
    },
    {
      id: "Karirlink",
      label: "Karirlink",
      color: "#E11D48",
      searchUrl: () => "https://portal.karirlink.id/jobs",
    },
    {
      id: "Remote",
      label: "Remote / Luar Negeri",
      color: "#06B6D4",
      searchUrl: () => "https://himalayas.app/jobs",
    },
  ];

  const quickPortals = [
    {
      name: "LinkedIn Jobs",
      color: "#0A66C2",
      url: "https://www.linkedin.com/jobs/",
      desc: "Tech Giants, Startup & Profesional",
    },
    {
      name: "Dealls Jobs",
      color: "#8B5CF6",
      url: "https://dealls.com/jobs",
      desc: "Tech, Product & Fintech",
    },
    {
      name: "Disnakerja BUMN",
      color: "#10B981",
      url: "https://disnakerja.com/",
      desc: "Rekrutmen Bersama BUMN & CPNS",
    },
    {
      name: "KarirJakarta",
      color: "#FF6636",
      url: "https://karir.jakarta.go.id/jobs",
      desc: "Portal Karir Resmi DKI Jakarta",
    },
    {
      name: "Karirhub Kemnaker",
      color: "#CA8A04",
      url: "https://karirhub.kemnaker.go.id/lowongan-dalam-negeri/lowongan",
      desc: "Lowongan Dalam Negeri Kemnaker",
    },
    {
      name: "Toploker",
      color: "#149FC0",
      url: "https://toploker.com/loker/daftar",
      desc: "Lowongan Kerja Nasional",
    },
    {
      name: "Karirlink",
      color: "#E11D48",
      url: "https://portal.karirlink.id/jobs",
      desc: "Kampus & Perusahaan Mitra",
    },
    {
      name: "Himalayas",
      color: "#06B6D4",
      url: "https://himalayas.app/jobs",
      desc: "Remote jobs worldwide (Himalayas)",
    },
    {
      name: "Remote OK",
      color: "#FF4742",
      url: "https://remoteok.com",
      desc: "Remote jobs loaded from Remote OK",
    },
  ];

  const categories = [
    "all",
    "IT & Software",
    "Marketing & Sales",
    "Admin & HR",
    "Finance",
    "Design & Kreatif",
    "BUMN & Instansi",
  ];

  // Auto-fetch with debounce when search, platform, category, work type, page, or limit changes
  useEffect(() => {
    if (viewMode === "news") return undefined;
    const timer = setTimeout(() => {
      fetchJobs(search, page, limit);
    }, 300);
    return () => clearTimeout(timer);
  }, [
    search,
    selectedPlatform,
    selectedCategory,
    selectedWorkType,
    page,
    limit,
    viewMode,
  ]);

  useEffect(() => {
    if (viewMode !== "globe") return undefined;
    const timer = setTimeout(() => {
      fetchGlobeJobs();
    }, 300);
    return () => clearTimeout(timer);
  }, [viewMode, search, selectedCategory, selectedWorkType]);

  useEffect(() => {
    if (viewMode !== "news") return undefined;
    const timer = setTimeout(() => {
      fetchNews(search, newsPage, limit, newsKind);
    }, 300);
    return () => clearTimeout(timer);
  }, [viewMode, search, newsKind, newsPage, limit]);

  // Reset to page 1 when search filters change
  const handleFilterChange = (setter, val) => {
    setter(val);
    setPage(1);
  };

  const fetchJobs = async (
    searchQuery = search,
    pageNum = page,
    limitNum = limit,
  ) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery && searchQuery.trim())
        params.append("search", searchQuery.trim());
      if (selectedPlatform !== "all")
        params.append("platform", selectedPlatform);
      if (selectedCategory !== "all")
        params.append("category", selectedCategory);
      if (selectedWorkType !== "all")
        params.append("work_type", selectedWorkType);
      params.append("page", pageNum.toString());
      params.append("limit", limitNum.toString());

      const res = await fetch(`/api/directory/jobs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs || []);
        setTotal(data.total || 0);
        setTotalPages(
          data.totalPages || Math.ceil((data.total || 0) / limitNum) || 1,
        );
        if (data.countsMap) setPlatformCounts(data.countsMap);
      }
    } catch (err) {
      console.error("Failed to fetch directory jobs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGlobeJobs = async () => {
    setIsGlobeLoading(true);
    try {
      const params = new URLSearchParams();
      if (search && search.trim()) params.append("search", search.trim());
      params.append("platform", "Remote");
      if (selectedCategory !== "all")
        params.append("category", selectedCategory);
      if (selectedWorkType === "Remote / WFH")
        params.append("work_type", selectedWorkType);
      params.append("page", "1");
      params.append("limit", "400");

      const res = await fetch(`/api/directory/jobs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setGlobeJobs(data.jobs || []);
      }
    } catch (err) {
      console.error("Failed to fetch globe jobs:", err);
    } finally {
      setIsGlobeLoading(false);
    }
  };

  const fetchNews = async (
    searchQuery = search,
    pageNum = newsPage,
    limitNum = limit,
    kind = newsKind,
  ) => {
    setIsLoading(true);
    setNewsError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery && searchQuery.trim())
        params.append("search", searchQuery.trim());
      if (kind && kind !== "all") params.append("kind", kind);
      params.append("page", pageNum.toString());
      params.append("limit", limitNum.toString());

      const res = await fetch(`/api/directory/news?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setNewsItems(data.items || []);
        setNewsTotal(data.total || 0);
        setNewsTotalPages(
          data.totalPages || Math.ceil((data.total || 0) / limitNum) || 1,
        );
        setNewsNotice(data.notice || null);
        if (!(data.items || []).length && data.notice) {
          setNewsError(null);
        }
      } else {
        setNewsItems([]);
        setNewsError(
          data.error ||
            t("jdh_news_error", "Gagal memuat berita. Coba sinkronkan ulang."),
        );
      }
    } catch (err) {
      console.error("Failed to fetch directory news:", err);
      setNewsError(
        t("jdh_news_error", "Gagal memuat berita. Coba sinkronkan ulang."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewMode = (mode) => {
    if (mode === "globe") {
      if (isVerySmallScreen()) {
        setGlobeNotice(
          t(
            "jdh_globe_small_screen",
            "Layar kecil: globe berat, daftar tetap tersedia.",
          ),
        );
      } else {
        setGlobeNotice(null);
      }
    }
    setViewMode(mode);
  };

  const handleGlobeFallback = (reason) => {
    setViewMode("list");
    setGlobeNotice(
      reason === "webgl"
        ? t(
            "jdh_globe_webgl_fail",
            "WebGL tidak tersedia di perangkat ini. Tampilan daftar tetap bisa dipakai.",
          )
        : t(
            "jdh_globe_small_screen",
            "Layar kecil: globe berat, daftar tetap tersedia.",
          ),
    );
  };

  const handleLiveSync = async () => {
    setIsSyncing(true);
    setSyncMessage(
      "Mengambil lowongan terbaru (LinkedIn, Dealls, Disnakerja, KarirJakarta, Karirhub, Toploker, Karirlink, Remotive, Arbeitnow, Jobicy, Himalayas, Remote OK) dan berita loker/magang...",
    );
    try {
      const res = await fetch("/api/directory/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        const news = data.news || {};
        let newsPart = "";
        if (news.error) {
          newsPart = ` Berita: gagal (${news.error}).`;
        } else if (!news.total) {
          newsPart = ` Berita: masih kosong${news.warning ? ` (${news.warning})` : ". Coba buka tab Berita atau sinkronkan lagi."}`;
        } else {
          newsPart = ` ${news.total} berita loker/magang${news.warning ? ` — ${news.warning}` : ""}.`;
        }
        setSyncMessage(
          `✓ Berhasil menyinkronkan! Total ${data.total} lowongan aktif.${newsPart}`,
        );
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        } catch {}
        await fetchJobs();
        if (viewMode === "news") await fetchNews();
      } else {
        setSyncMessage(
          "Gagal menyinkronkan lowongan baru: " +
            (data.error || "Server timeout"),
        );
      }
    } catch (err) {
      setSyncMessage("Gagal terhubung ke server");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 12000);
    }
  };

  const getPlatformStyle = (platform) => {
    switch (platform) {
      case "LinkedIn":
        return {
          bg: "rgba(10, 102, 194, 0.15)",
          border: "rgba(10, 102, 194, 0.4)",
          color: "#38BDF8",
          btnBg: "linear-gradient(135deg, #0A66C2, #0284C7)",
        };
      case "Dealls":
        return {
          bg: "rgba(139, 92, 246, 0.15)",
          border: "rgba(139, 92, 246, 0.4)",
          color: "#A78BFA",
          btnBg: "linear-gradient(135deg, #7C3AED, #8B5CF6)",
        };
      case "Disnakerja":
        return {
          bg: "rgba(16, 185, 129, 0.15)",
          border: "rgba(16, 185, 129, 0.4)",
          color: "#34D399",
          btnBg: "linear-gradient(135deg, #059669, #10B981)",
        };
      case "KarirJakarta":
        return {
          bg: "rgba(255, 102, 54, 0.15)",
          border: "rgba(255, 102, 54, 0.4)",
          color: "#FB923C",
          btnBg: "linear-gradient(135deg, #EA580C, #FF6636)",
        };
      case "Karirhub":
        return {
          bg: "rgba(202, 138, 4, 0.15)",
          border: "rgba(202, 138, 4, 0.4)",
          color: "#FACC15",
          btnBg: "linear-gradient(135deg, #A16207, #CA8A04)",
        };
      case "Toploker":
        return {
          bg: "rgba(20, 159, 192, 0.15)",
          border: "rgba(20, 159, 192, 0.4)",
          color: "#67E8F9",
          btnBg: "linear-gradient(135deg, #0E7490, #149FC0)",
        };
      case "Karirlink":
        return {
          bg: "rgba(225, 29, 72, 0.15)",
          border: "rgba(225, 29, 72, 0.4)",
          color: "#FB7185",
          btnBg: "linear-gradient(135deg, #BE123C, #E11D48)",
        };
      case "Remote":
      default:
        return {
          bg: "rgba(6, 182, 212, 0.15)",
          border: "rgba(6, 182, 212, 0.4)",
          color: "#22D3EE",
          btnBg: "linear-gradient(135deg, #0891B2, #06B6D4)",
        };
    }
  };

  const formatNewsDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(lang === "id" ? "id-ID" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const newsKindLabel = (kind) => {
    if (kind === "magang") return t("jdh_news_filter_magang", "Magang");
    if (kind === "mixed") return t("jdh_news_badge_mixed", "Loker + Magang");
    return t("jdh_news_filter_loker", "Loker");
  };

  const newsKindStyle = (kind) => {
    if (kind === "magang")
      return {
        bg: "rgba(251, 191, 36, 0.15)",
        border: "rgba(251, 191, 36, 0.4)",
        color: "#FBBF24",
      };
    if (kind === "mixed")
      return {
        bg: "rgba(168, 85, 247, 0.15)",
        border: "rgba(168, 85, 247, 0.4)",
        color: "#C084FC",
      };
    return {
      bg: "rgba(56, 189, 248, 0.15)",
      border: "rgba(56, 189, 248, 0.4)",
      color: "#38BDF8",
    };
  };

  const handleShare = (job) => {
    navigator.clipboard.writeText(
      `${job.title} di ${job.company} - Lamar di: ${job.job_url}`,
    );
    setCopiedId(job.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogApplied = async (job) => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setLogBusyId(job.id);
    try {
      const token = localStorage.getItem("lamarkerja_token");
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          company_name: job.company,
          position: job.title,
          job_url: job.job_url,
          platform: job.platform,
          status: "sent",
        }),
      });
      const data = await res.json();
      if (!data.success)
        throw new Error(data.error || "Gagal mencatat lamaran");
      setLoggedUrls((prev) => ({
        ...prev,
        [job.job_url || String(job.id)]: true,
      }));
      setLogMessage(
        data.alreadyLogged
          ? lang === "id"
            ? "Sudah tercatat di Riwayat."
            : "Already in your tracker."
          : lang === "id"
            ? "Tercatat sebagai dilamar."
            : "Logged as applied.",
      );
      if (onApplicationSent) onApplicationSent();
    } catch (err) {
      setLogMessage(err.message);
    } finally {
      setLogBusyId(null);
      setTimeout(() => setLogMessage(null), 3500);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Hero Header */}
      <div
        className="glass-panel"
        style={{
          padding: "30px 34px",
          background:
            "linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(99, 102, 241, 0.12) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div style={{ maxWidth: "720px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <span
              className="badge badge-cyan"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Globe size={13} /> Multi-Portal Job Hub
            </span>
          </div>
          <h1
            style={{
              fontSize: "1.8rem",
              fontWeight: 800,
              marginBottom: "8px",
              letterSpacing: "-0.02em",
            }}
          >
            {t("jdh_hero_title", "Jelajah Lowongan Kerja Multi-Portal")}:{" "}
            <span className="gradient-text">
              {t(
                "jdh_hero_subtitle",
                "LinkedIn, Dealls, Disnakerja, KarirJakarta & Remote",
              )}
            </span>
          </h1>
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--text-muted)",
              lineHeight: "1.6",
            }}
          >
            {t("jdh_hero_desc")}
          </p>
        </div>

        {/* Action & Counter Badges */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "10px",
          }}
        >
          <button
            onClick={handleLiveSync}
            disabled={isSyncing}
            className="btn-primary"
            style={{
              padding: "10px 20px",
              fontSize: "0.88rem",
              fontWeight: 600,
              background: "linear-gradient(135deg, #059669, #10B981)",
              boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
            }}
          >
            <span>
              {isSyncing
                ? t("jdh_syncing", "Menyinkronkan...")
                : t("jdh_btn_sync", "Sinkronkan Loker & Berita")}
            </span>
          </button>

          <div
            style={{
              background: "rgba(15, 23, 42, 0.85)",
              border: "1px solid var(--border-glass)",
              borderRadius: "14px",
              padding: "10px 18px",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-dim)",
                  fontWeight: 600,
                }}
              >
                {t("jdh_total_active", "Total Lowongan Aktif")}
              </div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 900,
                  color: "#38BDF8",
                }}
              >
                {total} {lang === "id" ? "Lowongan" : "Jobs"}
              </div>
            </div>
            <span
              style={{
                fontSize: "0.72rem",
                color: "#34D399",
                fontWeight: 600,
                background: "rgba(16, 185, 129, 0.1)",
                padding: "4px 8px",
                borderRadius: "8px",
              }}
            >
              {t("jdh_realtime_sync", "✓ Real-time Sync")}
            </span>
          </div>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncMessage && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: "12px",
            background: /gagal|fail|error|kosong/i.test(syncMessage)
              ? "rgba(244, 63, 94, 0.15)"
              : "rgba(16, 185, 129, 0.15)",
            border: /gagal|fail|error|kosong/i.test(syncMessage)
              ? "1px solid rgba(244, 63, 94, 0.35)"
              : "1px solid rgba(16, 185, 129, 0.35)",
            color: /gagal|fail|error|kosong/i.test(syncMessage)
              ? "#FDA4AF"
              : "#34D399",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {syncMessage.includes("Gagal") ||
          /berita: gagal|masih kosong/i.test(syncMessage) ? (
            <AlertCircle size={16} />
          ) : (
            <CheckCircle2 size={16} />
          )}
          <span>{syncMessage}</span>
        </div>
      )}

      {logMessage && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: "12px",
            background: /gagal|fail|error/i.test(logMessage)
              ? "rgba(244, 63, 94, 0.15)"
              : "rgba(16, 185, 129, 0.15)",
            border: /gagal|fail|error/i.test(logMessage)
              ? "1px solid rgba(244, 63, 94, 0.35)"
              : "1px solid rgba(16, 185, 129, 0.35)",
            color: /gagal|fail|error/i.test(logMessage) ? "#FDA4AF" : "#34D399",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {/gagal|fail|error/i.test(logMessage) ? (
            <AlertCircle size={16} />
          ) : (
            <CheckCircle2 size={16} />
          )}
          <span>{logMessage}</span>
        </div>
      )}

      {/* Quick Launchers Bar (Direct Search Across Major Portals) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "#94A3B8",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Portal Karir Partner (Klik untuk Buka Langsung):
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
            Tautan pencarian langsung
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "10px",
          }}
        >
          {quickPortals.map((portal, idx) => (
            <a
              key={idx}
              href={
                search
                  ? platforms
                      .find((p) => p.label.includes(portal.name.split(" ")[0]))
                      ?.searchUrl?.(search) || portal.url
                  : portal.url
              }
              target="_blank"
              rel="noreferrer"
              style={{
                background: "rgba(15, 23, 42, 0.7)",
                border: "1px solid var(--border-glass)",
                borderRadius: "12px",
                padding: "12px 14px",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = portal.color;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-glass)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.86rem",
                    fontWeight: 700,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: portal.color,
                    }}
                  />
                  <span>{portal.name}</span>
                </div>
                <div
                  style={{
                    fontSize: "0.68rem",
                    color: "var(--text-muted)",
                    marginTop: "2px",
                  }}
                >
                  {portal.desc}
                </div>
              </div>
              <ExternalLink size={14} color="#94A3B8" />
            </a>
          ))}
        </div>
      </div>

      {/* Platform Filter Pills with Real Counts */}
      {viewMode !== "news" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "4px",
          }}
        >
          {platforms.map((p) => {
            const isSelected = selectedPlatform === p.id;
            const count = platformCounts[p.id] || (p.id === "all" ? total : 0);
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPlatform(p.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: isSelected
                    ? `1px solid ${p.color}`
                    : "1px solid var(--border-glass)",
                  background: isSelected
                    ? "rgba(15, 23, 42, 0.95)"
                    : "rgba(15, 23, 42, 0.6)",
                  color: isSelected ? "#fff" : "var(--text-muted)",
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: "0.86rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                  boxShadow: isSelected ? `0 0 14px ${p.color}40` : "none",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: p.color,
                  }}
                />
                <span>{p.label}</span>
                {count > 0 && (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      padding: "1px 6px",
                      borderRadius: "999px",
                      background: isSelected
                        ? p.color
                        : "rgba(255, 255, 255, 0.1)",
                      color: isSelected ? "#fff" : "var(--text-dim)",
                      fontWeight: 700,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {viewMode === "news" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "4px",
          }}
        >
          {[
            {
              id: "all",
              label: t("jdh_news_filter_all", "Semua"),
              color: "#0EA5E9",
            },
            {
              id: "loker",
              label: t("jdh_news_filter_loker", "Loker"),
              color: "#38BDF8",
            },
            {
              id: "magang",
              label: t("jdh_news_filter_magang", "Magang"),
              color: "#FBBF24",
            },
          ].map((chip) => {
            const active = newsKind === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  setNewsKind(chip.id);
                  setNewsPage(1);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: active
                    ? `1px solid ${chip.color}`
                    : "1px solid var(--border-glass)",
                  background: active
                    ? "rgba(15, 23, 42, 0.95)"
                    : "rgba(15, 23, 42, 0.6)",
                  color: active ? "#fff" : "var(--text-muted)",
                  fontWeight: active ? 700 : 500,
                  fontSize: "0.86rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: chip.color,
                  }}
                />
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              viewMode === "news" ? "1.8fr auto" : "1.8fr 1fr 1fr auto",
            gap: "12px",
            alignItems: "flex-end",
          }}
        >
          <div>
            <label
              style={{
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                display: "block",
                marginBottom: "4px",
                fontWeight: 600,
              }}
            >
              {viewMode === "news"
                ? lang === "id"
                  ? "Cari judul berita atau sumber:"
                  : "Search headline or source:"
                : lang === "id"
                  ? "Cari Posisi, Perusahaan, atau Skill:"
                  : "Search Position, Company, or Skill:"}
            </label>
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "12px",
                  color: "var(--text-dim)",
                }}
              />
              <input
                type="text"
                className="input-field"
                style={{
                  paddingLeft: "36px",
                  paddingRight: search ? "36px" : "12px",
                }}
                placeholder={
                  viewMode === "news"
                    ? t(
                        "jdh_news_search",
                        "Cari judul berita, sumber, atau perusahaan...",
                      )
                    : lang === "id"
                      ? "Ketik posisi, perusahaan, atau skill..."
                      : "Type position, company, or skills..."
                }
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                  setNewsPage(1);
                }}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  (viewMode === "news" ? fetchNews(search) : fetchJobs(search))
                }
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                    setNewsPage(1);
                    if (viewMode === "news") fetchNews("");
                    else fetchJobs("");
                  }}
                  style={{
                    position: "absolute",
                    right: "10px",
                    background: "none",
                    border: "none",
                    color: "#94A3B8",
                    cursor: "pointer",
                    fontSize: "1rem",
                    padding: "4px",
                  }}
                  title={lang === "id" ? "Hapus Pencarian" : "Clear Search"}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {viewMode !== "news" && (
            <>
              <div>
                <label
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: "4px",
                    fontWeight: 600,
                  }}
                >
                  {lang === "id" ? "Kategori Industri:" : "Industry Category:"}
                </label>
                <select
                  className="input-field"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c === "all"
                        ? lang === "id"
                          ? "Semua Kategori"
                          : "All Categories"
                        : c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: "4px",
                    fontWeight: 600,
                  }}
                >
                  {lang === "id" ? "Tipe Pekerjaan:" : "Work Type:"}
                </label>
                <select
                  className="input-field"
                  value={selectedWorkType}
                  onChange={(e) => setSelectedWorkType(e.target.value)}
                >
                  <option value="all">
                    {lang === "id" ? "Semua Tipe" : "All Types"}
                  </option>
                  <option value="Full-time">
                    {lang === "id" ? "Full-time (Penuh Waktu)" : "Full-time"}
                  </option>
                  <option value="Hybrid">
                    {lang === "id" ? "Hybrid (Campuran)" : "Hybrid"}
                  </option>
                  <option value="Remote / WFH">
                    {lang === "id" ? "Remote (Jarak Jauh)" : "Remote / WFH"}
                  </option>
                  <option value="Internship">
                    {lang === "id" ? "Magang (Internship)" : "Internship"}
                  </option>
                  <option value="Contract">
                    {lang === "id" ? "Kontrak (Contract)" : "Contract"}
                  </option>
                </select>
              </div>
            </>
          )}

          <button
            onClick={() =>
              viewMode === "news" ? fetchNews(search) : fetchJobs(search)
            }
            disabled={isLoading}
            className="btn-primary"
            style={{ padding: "10px 22px", height: "42px" }}
          >
            {isLoading ? (
              <RefreshCw
                size={16}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              <Search size={16} />
            )}
            <span>
              {isLoading
                ? lang === "id"
                  ? "Mencari..."
                  : "Searching..."
                : viewMode === "news"
                  ? lang === "id"
                    ? "Cari Berita"
                    : "Search News"
                  : lang === "id"
                    ? "Cari Lowongan"
                    : "Search Jobs"}
            </span>
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div
          role="group"
          aria-label={lang === "id" ? "Tampilan lowongan" : "Job view"}
          style={{
            display: "inline-flex",
            padding: "4px",
            borderRadius: "12px",
            border: "1px solid var(--border-glass)",
            background: "rgba(15, 23, 42, 0.7)",
          }}
        >
          {[
            { id: "list", icon: List, label: t("jdh_view_list", "Daftar") },
            { id: "globe", icon: Globe, label: t("jdh_view_globe", "Globe") },
            {
              id: "news",
              icon: Newspaper,
              label: t("jdh_view_news", "Berita"),
            },
          ].map((mode) => {
            const active = viewMode === mode.id;
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleViewMode(mode.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "9px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.84rem",
                  color: active ? "#fff" : "var(--text-muted)",
                  background: active
                    ? "linear-gradient(135deg, #0891B2, #6366F1)"
                    : "transparent",
                  boxShadow: active
                    ? "0 0 14px rgba(6, 182, 212, 0.35)"
                    : "none",
                }}
              >
                <Icon size={15} />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {globeNotice && viewMode === "globe" && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: "12px",
            background: "rgba(251, 191, 36, 0.12)",
            border: "1px solid rgba(251, 191, 36, 0.35)",
            color: "#FDE68A",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle size={16} />
          <span>{globeNotice}</span>
        </div>
      )}

      {newsNotice && viewMode === "news" && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: "12px",
            background: "rgba(251, 191, 36, 0.12)",
            border: "1px solid rgba(251, 191, 36, 0.35)",
            color: "#FDE68A",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle size={16} />
          <span>{newsNotice}</span>
        </div>
      )}

      {viewMode === "globe" ? (
        <Suspense
          fallback={
            <LoadingOverlay
              fullScreen={false}
              message={
                lang === "id"
                  ? "Menyiapkan globe 3D..."
                  : "Preparing 3D globe..."
              }
              submessage={
                lang === "id"
                  ? "Memuat peta lowongan remote"
                  : "Loading remote job map"
              }
            />
          }
        >
          <JobGlobeView
            jobs={globeJobs}
            isLoading={isGlobeLoading}
            lang={lang}
            loggedUrls={loggedUrls}
            logBusyId={logBusyId}
            onLogApplied={handleLogApplied}
            onFallback={handleGlobeFallback}
          />
        </Suspense>
      ) : viewMode === "news" ? (
        <>
          {isLoading ? (
            <LoadingOverlay
              fullScreen={false}
              message={t("jdh_news_loading", "Memuat berita loker & magang...")}
              submessage={t(
                "jdh_news_loading_sub",
                "Sumber: Google News RSS Indonesia",
              )}
            />
          ) : newsError ? (
            <div
              className="glass-panel"
              style={{
                padding: "60px 20px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                color: "var(--text-muted)",
              }}
            >
              <AlertCircle
                size={40}
                style={{ color: "#FB7185", opacity: 0.8 }}
              />
              <h3 style={{ fontSize: "1.15rem", color: "#F8FAFC", margin: 0 }}>
                {t(
                  "jdh_news_error",
                  "Gagal memuat berita. Coba sinkronkan ulang.",
                )}
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  maxWidth: "520px",
                  margin: 0,
                  lineHeight: "1.5",
                }}
              >
                {newsError}
              </p>
            </div>
          ) : newsItems.length === 0 ? (
            <div
              className="glass-panel"
              style={{
                padding: "60px 20px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                color: "var(--text-muted)",
              }}
            >
              <Newspaper size={40} style={{ color: "#64748B", opacity: 0.6 }} />
              <h3 style={{ fontSize: "1.15rem", color: "#F8FAFC", margin: 0 }}>
                {t("jdh_news_empty", "Belum ada berita loker/magang.")}
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  maxWidth: "520px",
                  margin: 0,
                  lineHeight: "1.5",
                }}
              >
                {newsNotice ||
                  t(
                    "jdh_news_empty_hint",
                    "Klik Sinkronkan Loker & Berita. Tab ini terisi otomatis saat server start; ini artikel berita, bukan kartu lamar.",
                  )}
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                gap: "20px",
              }}
            >
              {newsItems.map((item) => {
                const badge = newsKindStyle(item.kind);
                const related = item.matched_job && item.matched_job.job_url;
                return (
                  <div
                    key={item.id || item.url}
                    className="glass-panel"
                    style={{
                      padding: "22px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "14px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "10px",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "8px",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            background: badge.bg,
                            border: `1px solid ${badge.border}`,
                            color: badge.color,
                          }}
                        >
                          {newsKindLabel(item.kind)}
                        </span>
                        <span
                          style={{
                            fontSize: "0.74rem",
                            color: "var(--text-dim)",
                            fontWeight: 600,
                          }}
                        >
                          {formatNewsDate(item.published_at)}
                        </span>
                      </div>
                      <h3
                        style={{
                          fontSize: "1.08rem",
                          fontWeight: 800,
                          marginBottom: "6px",
                          lineHeight: "1.35",
                        }}
                      >
                        {item.title}
                      </h3>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "0.82rem",
                          color: "#94A3B8",
                          marginBottom: "10px",
                        }}
                      >
                        <Newspaper size={14} color="#FBBF24" />
                        <span style={{ fontWeight: 600 }}>
                          {item.source || "Google News"}
                        </span>
                        {item.company_guess ? (
                          <span>• {item.company_guess}</span>
                        ) : null}
                      </div>
                      {item.snippet ? (
                        <p
                          style={{
                            fontSize: "0.82rem",
                            color: "var(--text-muted)",
                            lineHeight: "1.5",
                            margin: 0,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {item.snippet}
                        </p>
                      ) : null}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        paddingTop: "12px",
                        borderTop: "1px solid var(--border-glass)",
                      }}
                    >
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "9px 14px",
                          borderRadius: "10px",
                          textDecoration: "none",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          color: "#fff",
                          background:
                            "linear-gradient(135deg, #0F766E, #0EA5E9)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                      >
                        <span>{t("jdh_news_open", "Buka artikel")}</span>
                        <ExternalLink size={15} />
                      </a>
                      {related ? (
                        <a
                          href={item.matched_job.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: "8px 12px",
                            borderRadius: "10px",
                            textDecoration: "none",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            color: "#67E8F9",
                            border: "1px solid rgba(34, 211, 238, 0.35)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          {t(
                            "jdh_news_related",
                            "Ada lowongan terkait di direktori",
                          )}{" "}
                          · {item.matched_job.platform}
                          <ExternalLink size={14} />
                        </a>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {newsTotalPages > 1 && !isLoading && newsItems.length > 0 && (
            <div
              className="glass-panel"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderRadius: "14px",
                marginTop: "18px",
                flexWrap: "wrap",
                gap: "14px",
              }}
            >
              <span style={{ fontSize: "0.84rem", color: "var(--text-muted)" }}>
                {lang === "id" ? (
                  <>
                    Menampilkan{" "}
                    <b style={{ color: "#F8FAFC" }}>
                      {(newsPage - 1) * limit + 1} -{" "}
                      {Math.min(newsPage * limit, newsTotal)}
                    </b>{" "}
                    dari <b style={{ color: "#38BDF8" }}>{newsTotal}</b> berita
                  </>
                ) : (
                  <>
                    Showing{" "}
                    <b style={{ color: "#F8FAFC" }}>
                      {(newsPage - 1) * limit + 1} -{" "}
                      {Math.min(newsPage * limit, newsTotal)}
                    </b>{" "}
                    of <b style={{ color: "#38BDF8" }}>{newsTotal}</b> articles
                  </>
                )}
              </span>
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <button
                  disabled={newsPage <= 1}
                  onClick={() => setNewsPage((p) => Math.max(1, p - 1))}
                  className="btn-secondary"
                  style={{
                    padding: "6px 12px",
                    height: "34px",
                    fontSize: "0.82rem",
                    opacity: newsPage <= 1 ? 0.35 : 1,
                  }}
                >
                  <ChevronLeft size={15} />
                  <span>{lang === "id" ? "Sebelumnya" : "Prev"}</span>
                </button>
                <button
                  disabled={newsPage >= newsTotalPages}
                  onClick={() =>
                    setNewsPage((p) => Math.min(newsTotalPages, p + 1))
                  }
                  className="btn-secondary"
                  style={{
                    padding: "6px 12px",
                    height: "34px",
                    fontSize: "0.82rem",
                    opacity: newsPage >= newsTotalPages ? 0.35 : 1,
                  }}
                >
                  <span>Next</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Loading State or Job Cards Grid */}
          {isLoading ? (
            <LoadingOverlay
              fullScreen={false}
              message={
                lang === "id"
                  ? "Memuat & Menyaring Lowongan Kerja..."
                  : "Filtering & Loading Active Vacancies..."
              }
              submessage={
                lang === "id"
                  ? "Mengambil lowongan dari LinkedIn guest, Dealls, Disnakerja, KarirJakarta, Karirhub, Toploker, Karirlink, Remotive, Arbeitnow, Jobicy, Himalayas, Remote OK"
                  : "Fetching vacancies from LinkedIn guest, Dealls, Disnakerja, KarirJakarta, Karirhub, Toploker, Karirlink, Remotive, Arbeitnow, Jobicy, Himalayas, Remote OK"
              }
            />
          ) : jobs.length === 0 ? (
            <div
              className="glass-panel"
              style={{
                padding: "60px 20px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                color: "var(--text-muted)",
              }}
            >
              <Search size={40} style={{ color: "#64748B", opacity: 0.6 }} />
              <h3 style={{ fontSize: "1.15rem", color: "#F8FAFC", margin: 0 }}>
                {t("jdh_no_jobs", "Tidak ada lowongan yang cocok")}
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  maxWidth: "520px",
                  margin: 0,
                  lineHeight: "1.5",
                }}
              >
                {t("jdh_try_reset")}
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedPlatform("all");
                  setSelectedCategory("all");
                  setSelectedWorkType("all");
                  fetchJobs("");
                }}
                className="btn-secondary"
                style={{
                  marginTop: "8px",
                  padding: "8px 18px",
                  fontSize: "0.85rem",
                }}
              >
                Reset Filter & Tampilkan Semua
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                gap: "20px",
              }}
            >
              {jobs.map((job) => {
                const style = getPlatformStyle(job.platform);
                const isCopied = copiedId === job.id;
                const canOpenPosting =
                  Boolean(job.job_url) &&
                  !/\/explore\?|\/jobs\/search\/|\/job-search\/|loker\?search=|jobs\?keyword=/.test(
                    job.job_url,
                  );

                return (
                  <div
                    key={job.id}
                    className="glass-panel"
                    style={{
                      padding: "22px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "16px",
                      position: "relative",
                      transition: "transform 0.2s ease, border-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = style.color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-glass)";
                    }}
                  >
                    <div>
                      {/* Platform Badge & Category */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "10px",
                        }}
                      >
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "8px",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            background: style.bg,
                            border: `1px solid ${style.border}`,
                            color: style.color,
                          }}
                        >
                          {job.platform}
                        </span>
                        <span
                          style={{
                            fontSize: "0.74rem",
                            color: "var(--text-dim)",
                            fontWeight: 600,
                          }}
                        >
                          {job.category}
                        </span>
                      </div>

                      {/* Job Title & Company */}
                      <h3
                        style={{
                          fontSize: "1.14rem",
                          fontWeight: 800,
                          marginBottom: "4px",
                          lineHeight: "1.3",
                        }}
                      >
                        {job.title}
                      </h3>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "0.86rem",
                          color: "#94A3B8",
                          marginBottom: "10px",
                        }}
                      >
                        <Building size={14} color="#38BDF8" />
                        <span style={{ fontWeight: 600 }}>{job.company}</span>
                      </div>

                      {/* Metadata Pills */}
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "7px",
                          marginBottom: "12px",
                          fontSize: "0.76rem",
                          color: "#CBD5E1",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "rgba(15, 23, 42, 0.7)",
                            padding: "3px 8px",
                            borderRadius: "6px",
                          }}
                        >
                          <MapPin size={12} color="#FBBF24" />
                          <span>{job.location}</span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "rgba(15, 23, 42, 0.7)",
                            padding: "3px 8px",
                            borderRadius: "6px",
                          }}
                        >
                          <Briefcase size={12} color="#818CF8" />
                          <span>{job.work_type}</span>
                        </div>
                        {job.salary && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              background: "rgba(16, 185, 129, 0.1)",
                              color: "#34D399",
                              padding: "3px 8px",
                              borderRadius: "6px",
                            }}
                          >
                            <DollarSign size={12} />
                            <span>{job.salary}</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--text-muted)",
                          lineHeight: "1.5",
                          marginBottom: "12px",
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {job.description}
                      </p>

                      {/* Requirements / Skill Tags */}
                      {job.requirements?.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "5px",
                          }}
                        >
                          {job.requirements.slice(0, 4).map((req, rIdx) => (
                            <span
                              key={rIdx}
                              style={{
                                fontSize: "0.7rem",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                background: "rgba(255, 255, 255, 0.06)",
                                color: "#94A3B8",
                              }}
                            >
                              {req}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* AI Quick Tools Suite */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(105px, 1fr))",
                          gap: "6px",
                          marginTop: "12px",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setWhatsAppJob(job)}
                          className="btn-secondary"
                          style={{
                            fontSize: "0.72rem",
                            padding: "6px 4px",
                            justifyContent: "center",
                            borderColor: "rgba(37, 211, 102, 0.4)",
                            color: "#25D366",
                          }}
                          title={
                            lang === "id"
                              ? "Lamar via WhatsApp HRD"
                              : "Apply via WhatsApp to HR"
                          }
                        >
                          <MessageCircle size={12} />
                          <span>{lang === "id" ? "Lamar WA" : "Apply WA"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCoverLetterJob(job)}
                          className="btn-secondary"
                          style={{
                            fontSize: "0.72rem",
                            padding: "6px 4px",
                            justifyContent: "center",
                            borderColor: "rgba(14, 165, 233, 0.4)",
                            color: "#38BDF8",
                          }}
                          title={
                            lang === "id"
                              ? "Buat Surat Lamaran Kerja Resmi"
                              : "Generate Formal Cover Letter"
                          }
                        >
                          <FileText size={12} />
                          <span>
                            {lang === "id" ? "Surat Lamaran" : "Cover Letter"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCompanySpyJob(job)}
                          className="btn-secondary"
                          style={{
                            fontSize: "0.72rem",
                            padding: "6px 4px",
                            justifyContent: "center",
                            borderColor: "rgba(168, 85, 247, 0.4)",
                            color: "#C084FC",
                          }}
                          title={
                            lang === "id"
                              ? "Bongkar Profil Perusahaan & Kisi-Kisi Interview"
                              : "Company Intel & Cheat Sheet"
                          }
                        >
                          <Building2 size={12} />
                          <span>
                            {lang === "id" ? "Profil PT" : "Company Intel"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setInterviewJob(job)}
                          className="btn-secondary"
                          style={{
                            fontSize: "0.72rem",
                            padding: "6px 4px",
                            justifyContent: "center",
                            borderColor: "rgba(14, 165, 233, 0.4)",
                          }}
                          title={
                            lang === "id"
                              ? "Latihan Wawancara untuk Loker ini"
                              : "Practice Interview for this Role"
                          }
                        >
                          <MessageSquare size={12} color="#0EA5E9" />
                          <span>
                            {lang === "id" ? "Interview" : "Interview"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setLiveCodeJob(job)}
                          className="btn-secondary"
                          style={{
                            fontSize: "0.72rem",
                            padding: "6px 4px",
                            justifyContent: "center",
                            borderColor: "rgba(56, 189, 248, 0.4)",
                            color: "#38BDF8",
                          }}
                          title={
                            lang === "id"
                              ? "Simulasi Tes Koding & Live Code untuk Loker ini"
                              : "Coding Challenge Simulator"
                          }
                        >
                          <Code2 size={12} />
                          <span>
                            {lang === "id" ? "Tes Koding" : "Code Test"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSalaryJob(job)}
                          className="btn-secondary"
                          style={{
                            fontSize: "0.72rem",
                            padding: "6px 4px",
                            justifyContent: "center",
                            borderColor: "rgba(16, 185, 129, 0.4)",
                          }}
                          title={
                            lang === "id"
                              ? "Riset Standar Gaji Posisi ini"
                              : "Research Salary Insights"
                          }
                        >
                          <DollarSign size={12} color="#10B981" />
                          <span>
                            {lang === "id" ? "Riset Gaji" : "Salary Insight"}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons: Direct Link to Platform */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        paddingTop: "12px",
                        borderTop: "1px solid var(--border-glass)",
                        flexWrap: "wrap",
                      }}
                    >
                      {canOpenPosting ? (
                        <a
                          href={job.job_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            flex: 1,
                            padding: "9px 14px",
                            borderRadius: "10px",
                            textDecoration: "none",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            color: "#fff",
                            background: style.btnBg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            boxShadow: `0 4px 14px ${style.border}`,
                            transition: "all 0.2s ease",
                          }}
                        >
                          <span>
                            {lang === "id"
                              ? `Lamar di ${job.platform}`
                              : `Apply on ${job.platform}`}
                          </span>
                          <ExternalLink size={15} />
                        </a>
                      ) : (
                        <span
                          style={{
                            flex: 1,
                            fontSize: "0.8rem",
                            color: "var(--text-muted)",
                            padding: "9px 4px",
                          }}
                        >
                          {lang === "id"
                            ? "Tautan lowongan asli tidak tersedia"
                            : "Direct job posting URL is not available"}
                        </span>
                      )}

                      <button
                        onClick={() => handleShare(job)}
                        className="btn-secondary"
                        style={{ padding: "9px 12px", borderRadius: "10px" }}
                        title={
                          lang === "id"
                            ? "Salin Tautan Lowongan"
                            : "Copy Job Link"
                        }
                      >
                        {isCopied ? (
                          <CheckCircle2 size={15} color="#10B981" />
                        ) : (
                          <Share2 size={15} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLogApplied(job)}
                        disabled={
                          logBusyId === job.id ||
                          Boolean(loggedUrls[job.job_url || String(job.id)])
                        }
                        className="btn-secondary"
                        style={{
                          padding: "9px 12px",
                          borderRadius: "10px",
                          borderColor: "rgba(16, 185, 129, 0.4)",
                          color: "#34D399",
                          fontSize: "0.78rem",
                          whiteSpace: "nowrap",
                        }}
                        title={
                          lang === "id"
                            ? "Catat ke Riwayat tanpa mengirim email"
                            : "Log to tracker without sending email"
                        }
                      >
                        {loggedUrls[job.job_url || String(job.id)] ? (
                          <>
                            <CheckCircle2 size={14} />{" "}
                            {lang === "id" ? "Tercatat" : "Logged"}
                          </>
                        ) : (
                          <>
                            <BookmarkPlus size={14} />{" "}
                            {lang === "id"
                              ? "Catat sebagai dilamar"
                              : "Mark as applied"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modern Pagination Controls */}
          {totalPages > 1 && (
            <div
              className="glass-panel"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderRadius: "14px",
                marginTop: "18px",
                flexWrap: "wrap",
                gap: "14px",
              }}
            >
              {/* Info & Limit Selector */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{ fontSize: "0.84rem", color: "var(--text-muted)" }}
                >
                  {lang === "id" ? (
                    <>
                      Menampilkan{" "}
                      <b style={{ color: "#F8FAFC" }}>
                        {(page - 1) * limit + 1} -{" "}
                        {Math.min(page * limit, total)}
                      </b>{" "}
                      dari <b style={{ color: "#38BDF8" }}>{total}</b> lowongan
                    </>
                  ) : (
                    <>
                      Showing{" "}
                      <b style={{ color: "#F8FAFC" }}>
                        {(page - 1) * limit + 1} -{" "}
                        {Math.min(page * limit, total)}
                      </b>{" "}
                      of <b style={{ color: "#38BDF8" }}>{total}</b> vacancies
                    </>
                  )}
                </span>

                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <span
                    style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}
                  >
                    {lang === "id" ? "Per halaman:" : "Per page:"}
                  </span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      const newLimit = parseInt(e.target.value);
                      setLimit(newLimit);
                      setPage(1);
                    }}
                    className="input-field"
                    style={{
                      width: "75px",
                      padding: "4px 8px",
                      fontSize: "0.8rem",
                      height: "32px",
                    }}
                  >
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                  </select>
                </div>
              </div>

              {/* Page Buttons */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <button
                  disabled={page <= 1}
                  onClick={() => {
                    setPage(1);
                    window.scrollTo({ top: 350, behavior: "smooth" });
                  }}
                  className="btn-secondary"
                  style={{
                    padding: "6px 8px",
                    height: "34px",
                    opacity: page <= 1 ? 0.35 : 1,
                  }}
                  title={lang === "id" ? "Halaman Pertama" : "First Page"}
                >
                  <ChevronsLeft size={16} />
                </button>

                <button
                  disabled={page <= 1}
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 350, behavior: "smooth" });
                  }}
                  className="btn-secondary"
                  style={{
                    padding: "6px 12px",
                    height: "34px",
                    fontSize: "0.82rem",
                    opacity: page <= 1 ? 0.35 : 1,
                  }}
                >
                  <ChevronLeft size={15} />
                  <span>{lang === "id" ? "Sebelumnya" : "Prev"}</span>
                </button>

                {/* Page Number Chips */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pNum;
                  if (totalPages <= 5) {
                    pNum = i + 1;
                  } else if (page <= 3) {
                    pNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pNum = totalPages - 4 + i;
                  } else {
                    pNum = page - 2 + i;
                  }

                  const isActive = page === pNum;
                  return (
                    <button
                      key={pNum}
                      onClick={() => {
                        setPage(pNum);
                        window.scrollTo({ top: 350, behavior: "smooth" });
                      }}
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "8px",
                        border: isActive
                          ? "1px solid #0EA5E9"
                          : "1px solid var(--border-glass)",
                        background: isActive
                          ? "#0EA5E9"
                          : "rgba(15, 23, 42, 0.6)",
                        color: isActive ? "#fff" : "var(--text-muted)",
                        fontWeight: 700,
                        fontSize: "0.84rem",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: isActive
                          ? "0 0 12px rgba(14, 165, 233, 0.4)"
                          : "none",
                      }}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  disabled={page >= totalPages}
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 350, behavior: "smooth" });
                  }}
                  className="btn-secondary"
                  style={{
                    padding: "6px 12px",
                    height: "34px",
                    fontSize: "0.82rem",
                    opacity: page >= totalPages ? 0.35 : 1,
                  }}
                >
                  <span>Next</span>
                  <ChevronRight size={15} />
                </button>

                <button
                  disabled={page >= totalPages}
                  onClick={() => {
                    setPage(totalPages);
                    window.scrollTo({ top: 350, behavior: "smooth" });
                  }}
                  className="btn-secondary"
                  style={{
                    padding: "6px 8px",
                    height: "34px",
                    opacity: page >= totalPages ? 0.35 : 1,
                  }}
                  title="Halaman Terakhir"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODALS */}
      <InterviewSimulatorModal
        isOpen={!!interviewJob}
        onClose={() => setInterviewJob(null)}
        jobDetails={
          interviewJob
            ? {
                position: interviewJob.title,
                company_name: interviewJob.company,
                requirements: interviewJob.requirements || [
                  interviewJob.description,
                ],
              }
            : null
        }
      />

      <SalaryInsightModal
        isOpen={!!salaryJob}
        onClose={() => setSalaryJob(null)}
        defaultPosition={salaryJob?.title || ""}
        defaultLocation={salaryJob?.location || ""}
      />

      <WhatsAppApplyModal
        isOpen={!!whatsAppJob}
        onClose={() => setWhatsAppJob(null)}
        jobDetails={
          whatsAppJob
            ? {
                position: whatsAppJob.title,
                company_name: whatsAppJob.company,
                requirements: whatsAppJob.requirements || [],
                whatsapp_number: whatsAppJob.contact_email || "",
              }
            : null
        }
        profile={profile}
      />

      <CoverLetterModal
        isOpen={!!coverLetterJob}
        onClose={() => setCoverLetterJob(null)}
        defaultCompany={coverLetterJob?.company || ""}
        defaultPosition={coverLetterJob?.title || ""}
        defaultRequirements={coverLetterJob?.requirements || []}
        defaultLocation={coverLetterJob?.location || ""}
        defaultDescription={coverLetterJob?.description || ""}
        profile={profile}
      />

      <CompanyIntelligenceModal
        isOpen={!!companySpyJob}
        onClose={() => setCompanySpyJob(null)}
        defaultCompany={companySpyJob?.company || ""}
        defaultPosition={companySpyJob?.title || ""}
        defaultIndustry={companySpyJob?.category || ""}
      />

      <LiveCodeModal
        isOpen={!!liveCodeJob}
        onClose={() => setLiveCodeJob(null)}
        jobDetails={
          liveCodeJob
            ? {
                position: liveCodeJob.title,
                company_name: liveCodeJob.company,
                requirements: liveCodeJob.requirements || [
                  liveCodeJob.description,
                ],
              }
            : null
        }
        profile={profile}
      />
    </div>
  );
}
