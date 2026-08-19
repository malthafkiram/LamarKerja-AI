import React, { useState } from "react";
import {
  FileCheck,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  FileText,
  ArrowRight,
  Target,
  Award,
  ShieldAlert,
  Zap,
  BookOpen,
  Layers,
  ChevronRight,
  FilePlus,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useLanguage } from "../context/LanguageContext";

export default function ATSResumeChecker({ onNavigateTab }) {
  const { lang, t } = useLanguage();

  const [inputType, setInputType] = useState("upload"); // 'upload' or 'text'
  const [cvFile, setCvFile] = useState(null);
  const [cvText, setCvText] = useState("");
  const [targetPosition, setTargetPosition] = useState("");
  const [targetIndustry, setTargetIndustry] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedSTAR, setCopiedSTAR] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCvFile(file);
      setErrorMessage(null);
    }
  };

  const handleAudit = async () => {
    if (inputType === "upload" && !cvFile) {
      setErrorMessage(
        lang === "id"
          ? "Silakan pilih berkas CV (PDF / TXT) terlebih dahulu."
          : "Please select a CV file (PDF / TXT) first.",
      );
      return;
    }

    if (inputType === "text" && (!cvText || cvText.trim().length < 40)) {
      setErrorMessage(
        lang === "id"
          ? "Teks CV terlalu pendek (minimal 40 karakter)."
          : "CV text is too short (min 40 characters).",
      );
      return;
    }

    setIsAuditing(true);
    setErrorMessage(null);

    try {
      let res;
      if (inputType === "upload") {
        const formData = new FormData();
        formData.append("cv_file", cvFile);
        formData.append("target_position", targetPosition);
        formData.append("target_industry", targetIndustry);

        res = await fetch("/api/ats/audit", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/ats/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cv_text: cvText,
            target_position: targetPosition,
            target_industry: targetIndustry,
          }),
        });
      }

      const data = await res.json();
      if (data.success) {
        setAuditResult(data);
        if (data.score >= 80) {
          try {
            confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
          } catch {}
        }
      } else {
        setErrorMessage(
          data.error ||
            (lang === "id"
              ? "Gagal memproses audit ATS."
              : "Failed to process ATS audit."),
        );
      }
    } catch (err) {
      setErrorMessage(
        lang === "id"
          ? "Terjadi kesalahan saat menghubungkan ke server auditor ATS."
          : "Error connecting to ATS auditor server.",
      );
    } finally {
      setIsAuditing(false);
    }
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === "summary") {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } else {
      setCopiedSTAR(true);
      setTimeout(() => setCopiedSTAR(false), 2000);
    }
  };

  const handleReset = () => {
    setAuditResult(null);
    setCvFile(null);
    setCvText("");
    setErrorMessage(null);
  };

  return (
    <div
      style={{ maxWidth: "1200px", margin: "0 auto", padding: "10px 0 40px 0" }}
    >
      {/* Hero Header */}
      <div
        className="glass-panel"
        style={{
          padding: "30px 24px",
          borderRadius: "20px",
          marginBottom: "24px",
          background:
            "linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)",
          border: "1px solid rgba(14, 165, 233, 0.3)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            className="badge badge-cyan"
            style={{ fontSize: "0.72rem", padding: "3px 8px" }}
          >
            <Sparkles size={13} style={{ marginRight: "4px" }} />
            {lang === "id"
              ? "Anti-Halusinasi & Terkalibrasi Standar ATS"
              : "Calibrated ATS Standard & Anti-Hallucination"}
          </span>
          <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
            • Workday, Taleo, Greenhouse
          </span>
        </div>

        <h1
          style={{
            fontSize: "1.85rem",
            fontWeight: 800,
            color: "#F8FAFC",
            margin: "4px 0",
            letterSpacing: "-0.02em",
          }}
        >
          {lang === "id"
            ? "AI ATS Resume Scanner & "
            : "AI ATS Resume Scanner & "}
          <span className="gradient-text">
            {lang === "id" ? "Auditor CV" : "CV Auditor"}
          </span>
        </h1>

        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--text-muted)",
            margin: 0,
            maxWidth: "850px",
            lineHeight: "1.6",
          }}
        >
          {lang === "id"
            ? "Pindai dan uji kecocokan CV Anda terhadap sistem filter otomatis HRD. Dapatkan skor kelolosan presisi, deteksi kata kunci yang hilang, dan optimasi format STAR dalam hitungan detik."
            : "Scan and stress-test your CV against enterprise ATS filters. Get deterministic match scores, discover missing keywords, and generate STAR-compliant improvements."}
        </p>
      </div>

      {!auditResult ? (
        /* Input Form & Dropzone */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(300px, 1fr) 340px",
            gap: "20px",
          }}
        >
          {/* Main Input Panel */}
          <div
            className="glass-panel"
            style={{
              padding: "24px",
              borderRadius: "18px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            {/* Input Mode Switcher */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                borderBottom: "1px solid var(--border-glass)",
                paddingBottom: "14px",
              }}
            >
              <button
                type="button"
                onClick={() => setInputType("upload")}
                className={
                  inputType === "upload" ? "btn-primary" : "btn-secondary"
                }
                style={{ fontSize: "0.82rem", padding: "7px 16px" }}
              >
                <UploadCloud size={15} />
                <span>
                  {lang === "id"
                    ? "Unggah Berkas CV (PDF / TXT)"
                    : "Upload CV File (PDF / TXT)"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setInputType("text")}
                className={
                  inputType === "text" ? "btn-primary" : "btn-secondary"
                }
                style={{ fontSize: "0.82rem", padding: "7px 16px" }}
              >
                <FileText size={15} />
                <span>
                  {lang === "id" ? "Paste Teks CV" : "Paste Raw CV Text"}
                </span>
              </button>
            </div>

            {inputType === "upload" ? (
              /* Dropzone Upload */
              <div
                style={{
                  border: "2px dashed rgba(14, 165, 233, 0.4)",
                  background: "rgba(15, 23, 42, 0.5)",
                  borderRadius: "16px",
                  padding: "36px 20px",
                  textAlign: "center",
                  cursor: "pointer",
                  position: "relative",
                  transition: "all 0.2s ease",
                }}
              >
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileChange}
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0,
                    cursor: "pointer",
                    width: "100%",
                    height: "100%",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "54px",
                      height: "54px",
                      borderRadius: "16px",
                      background: "rgba(14, 165, 233, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#38BDF8",
                    }}
                  >
                    <UploadCloud size={28} />
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        margin: "0 0 4px 0",
                        color: "#F8FAFC",
                      }}
                    >
                      {cvFile
                        ? cvFile.name
                        : lang === "id"
                          ? "Klik atau Seret Berkas CV ke Sini"
                          : "Click or Drag CV File Here"}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        margin: 0,
                      }}
                    >
                      {cvFile
                        ? `${(cvFile.size / 1024).toFixed(1)} KB • ${lang === "id" ? "Siap diaudit" : "Ready to audit"}`
                        : lang === "id"
                          ? "Mendukung format PDF atau TXT (Maks. 15MB)"
                          : "Supports PDF or TXT format (Max 15MB)"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Raw Textarea */
              <div>
                <label
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  {lang === "id"
                    ? "Salin & Tempel Seluruh Teks CV Anda di Sini:"
                    : "Copy & Paste Your Full CV Text Here:"}
                </label>
                <textarea
                  className="input-field"
                  rows={10}
                  placeholder={
                    lang === "id"
                      ? "Contoh:\nPengalaman Kerja:\n- Frontend Developer di PT Maju Mundur (2022 - 2024)..."
                      : "Paste your work experience, education, skills, and summary here..."
                  }
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.82rem",
                    lineHeight: "1.5",
                  }}
                />
              </div>
            )}

            {/* Target Position & Industry Inputs */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  {lang === "id"
                    ? "Posisi / Role yang Ditargetkan (Opsional):"
                    : "Target Position / Role (Optional):"}
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: React Developer / Admin"
                  value={targetPosition}
                  onChange={(e) => setTargetPosition(e.target.value)}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  {lang === "id" ? "Bidang Industri:" : "Industry Sector:"}
                </label>
                <select
                  className="input-field"
                  value={targetIndustry}
                  onChange={(e) => setTargetIndustry(e.target.value)}
                >
                  <option value="">Pilih industri...</option>
                  <option value="Teknologi & IT">
                    Teknologi & Software / IT
                  </option>
                  <option value="Perbankan & Finance">
                    Perbankan & Finance
                  </option>
                  <option value="Marketing & Kreatif">
                    Marketing & Digital Creative
                  </option>
                  <option value="Administrasi & HRD">
                    Administrasi, Operasional & HRD
                  </option>
                  <option value="Teknik & Manufaktur">
                    Teknik & Manufaktur
                  </option>
                  <option value="Lainnya">Lainnya / Umum</option>
                </select>
              </div>
            </div>

            {errorMessage && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#F87171",
                  fontSize: "0.82rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertTriangle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Audit Trigger Button */}
            <button
              type="button"
              onClick={handleAudit}
              disabled={isAuditing}
              className="btn-primary"
              style={{
                padding: "12px",
                fontSize: "0.92rem",
                fontWeight: 700,
                background: "linear-gradient(135deg, #0284C7, #4F46E5)",
                boxShadow: "0 4px 18px rgba(2, 132, 199, 0.4)",
              }}
            >
              {isAuditing ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  <span>
                    {lang === "id"
                      ? "Membedah Struktur & Menilai Kelayakan ATS..."
                      : "Analyzing CV & Evaluating ATS Compatibility..."}
                  </span>
                </>
              ) : (
                <>
                  <FileCheck size={17} />
                  <span>
                    {lang === "id"
                      ? "Audit Skor Kelolosan ATS Sekarang"
                      : "Audit ATS Compatibility Score Now"}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Right Guidance Sidebar */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div
              className="glass-panel"
              style={{ padding: "20px", borderRadius: "18px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "10px",
                }}
              >
                <Layers size={18} color="#38BDF8" />
                <h3
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    margin: 0,
                    color: "#F8FAFC",
                  }}
                >
                  {lang === "id"
                    ? "5 Kriteria Penilaian ATS:"
                    : "5 ATS Criteria Evaluated:"}
                </h3>
              </div>
              <ul
                style={{
                  paddingLeft: "18px",
                  margin: 0,
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  lineHeight: "1.7",
                }}
              >
                <li>
                  <strong>Format & Parsing:</strong> Kemudahan teks dibaca oleh
                  robot.
                </li>
                <li>
                  <strong>Metode STAR:</strong> Poin pengalaman dengan angka &
                  metrik.
                </li>
                <li>
                  <strong>Kata Kunci:</strong> Relevansi skill teknis &
                  industri.
                </li>
                <li>
                  <strong>Kelengkapan:</strong> Kontak, Ringkasan, Riwayat
                  Kerja.
                </li>
                <li>
                  <strong>Panjang & Tone:</strong> Ringkas, padat & profesional.
                </li>
              </ul>
            </div>

            <div
              className="glass-panel"
              style={{
                padding: "20px",
                borderRadius: "18px",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                background: "rgba(245, 158, 11, 0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                  color: "#FBBF24",
                }}
              >
                <Zap size={17} />
                <h4 style={{ fontSize: "0.88rem", fontWeight: 700, margin: 0 }}>
                  {lang === "id"
                    ? "100% Anti-Halusinasi"
                    : "100% Deterministic & Consistent"}
                </h4>
              </div>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  margin: 0,
                  lineHeight: "1.5",
                }}
              >
                {lang === "id"
                  ? "Audit menggabungkan aturan format dengan Groq (temperature rendah) agar skor lebih konsisten jika CV yang sama diuji ulang."
                  : "The audit mixes format rules with low-temperature Groq so the same CV scores more consistently on repeat."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Audit Results View */
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          {/* Top Score Card Banner */}
          <div
            className="glass-panel"
            style={{
              padding: "28px",
              borderRadius: "20px",
              background:
                "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(7, 9, 14, 0.98))",
              border: `1px solid ${auditResult.scoreColor}55`,
              display: "grid",
              gridTemplateColumns: "180px 1fr auto",
              gap: "24px",
              alignItems: "center",
            }}
          >
            {/* Score Ring */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "140px",
                height: "140px",
                borderRadius: "50%",
                border: `4px solid ${auditResult.scoreColor}`,
                boxShadow: `0 0 25px ${auditResult.scoreColor}33`,
                background: "rgba(0,0,0,0.4)",
                margin: "0 auto",
              }}
            >
              <span
                style={{
                  fontSize: "2.4rem",
                  fontWeight: 800,
                  color: "#F8FAFC",
                  lineHeight: 1,
                }}
              >
                {auditResult.score}
              </span>
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-dim)",
                  fontWeight: 600,
                  marginTop: "2px",
                }}
              >
                SKOR ATS / 100
              </span>
            </div>

            {/* Score Summary */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "6px",
                }}
              >
                <span
                  className="badge"
                  style={{
                    background: `${auditResult.scoreColor}22`,
                    color: auditResult.scoreColor,
                    border: `1px solid ${auditResult.scoreColor}66`,
                    fontWeight: 700,
                    fontSize: "0.8rem",
                  }}
                >
                  {auditResult.scoreLabel}
                </span>
                <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
                  • {auditResult.wordCount}{" "}
                  {lang === "id" ? "Kata Terdeteksi" : "Words Detected"}
                </span>
              </div>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "#F8FAFC",
                  margin: "0 0 6px 0",
                }}
              >
                {auditResult.score >= 85
                  ? "CV Sangat Siap Melamar!"
                  : auditResult.score >= 70
                    ? "CV Cukup Lolos, Perlu Sedikit Polesan"
                    : "CV Berisiko Tertolak di Screening Awal"}
              </h2>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  margin: 0,
                  lineHeight: "1.5",
                }}
              >
                {auditResult.summary}
              </p>
            </div>

            {/* Action Button */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <button
                onClick={handleReset}
                className="btn-secondary"
                style={{
                  padding: "8px 16px",
                  fontSize: "0.82rem",
                  whiteSpace: "nowrap",
                }}
              >
                <RefreshCw size={14} />
                <span>
                  {lang === "id" ? "Audit CV Lain" : "Audit Another CV"}
                </span>
              </button>
            </div>
          </div>

          {/* 5 Pillars Breakdown Meters */}
          <div
            className="glass-panel"
            style={{ padding: "22px", borderRadius: "18px" }}
          >
            <h3
              style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                marginBottom: "16px",
                color: "#F8FAFC",
              }}
            >
              📊{" "}
              {lang === "id"
                ? "Rincian 5 Parameter Kelayakan ATS"
                : "Detailed 5 ATS Pillar Breakdown"}
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "14px",
              }}
            >
              <div
                style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "1px solid var(--border-glass)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.78rem",
                    marginBottom: "6px",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>
                    1. Format & Parsing
                  </span>
                  <span style={{ fontWeight: 700, color: "#38BDF8" }}>
                    {auditResult.breakdown?.sectionScore || 80}%
                  </span>
                </div>
                <div
                  style={{
                    height: "6px",
                    borderRadius: "4px",
                    background: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${auditResult.breakdown?.sectionScore || 80}%`,
                      height: "100%",
                      background: "#38BDF8",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "1px solid var(--border-glass)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.78rem",
                    marginBottom: "6px",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>
                    2. STAR Metrik & Angka
                  </span>
                  <span style={{ fontWeight: 700, color: "#F59E0B" }}>
                    {auditResult.breakdown?.metricScore || 70}%
                  </span>
                </div>
                <div
                  style={{
                    height: "6px",
                    borderRadius: "4px",
                    background: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${auditResult.breakdown?.metricScore || 70}%`,
                      height: "100%",
                      background: "#F59E0B",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "1px solid var(--border-glass)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.78rem",
                    marginBottom: "6px",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>
                    3. Kata Kerja Aksi
                  </span>
                  <span style={{ fontWeight: 700, color: "#10B981" }}>
                    {auditResult.breakdown?.actionVerbScore || 85}%
                  </span>
                </div>
                <div
                  style={{
                    height: "6px",
                    borderRadius: "4px",
                    background: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${auditResult.breakdown?.actionVerbScore || 85}%`,
                      height: "100%",
                      background: "#10B981",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "1px solid var(--border-glass)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.78rem",
                    marginBottom: "6px",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>
                    4. Kelengkapan Kontak
                  </span>
                  <span style={{ fontWeight: 700, color: "#6366F1" }}>
                    {auditResult.breakdown?.contactScore || 90}%
                  </span>
                </div>
                <div
                  style={{
                    height: "6px",
                    borderRadius: "4px",
                    background: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${auditResult.breakdown?.contactScore || 90}%`,
                      height: "100%",
                      background: "#6366F1",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "1px solid var(--border-glass)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.78rem",
                    marginBottom: "6px",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>
                    5. Kepadatan Panjang
                  </span>
                  <span style={{ fontWeight: 700, color: "#EC4899" }}>
                    {auditResult.breakdown?.lengthScore || 80}%
                  </span>
                </div>
                <div
                  style={{
                    height: "6px",
                    borderRadius: "4px",
                    background: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${auditResult.breakdown?.lengthScore || 80}%`,
                      height: "100%",
                      background: "#EC4899",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3 Columns: Red Flags, Missing Keywords & Strengths */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "18px",
            }}
          >
            {/* Red Flags Card */}
            <div
              className="glass-panel"
              style={{
                padding: "20px",
                borderRadius: "18px",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                background: "rgba(239, 68, 68, 0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <ShieldAlert size={18} color="#EF4444" />
                <h4
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    color: "#F87171",
                    margin: 0,
                  }}
                >
                  {lang === "id"
                    ? "Kelemahan Kritis (Red Flags)"
                    : "Critical Weaknesses"}
                </h4>
              </div>
              <ul
                style={{
                  paddingLeft: "18px",
                  margin: 0,
                  fontSize: "0.82rem",
                  color: "#FCA5A5",
                  lineHeight: "1.6",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                {auditResult.redFlags && auditResult.redFlags.length > 0 ? (
                  auditResult.redFlags.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))
                ) : (
                  <li style={{ color: "#34D399" }}>
                    ✓ Tidak ditemukan kelemahan format kritis.
                  </li>
                )}
              </ul>
            </div>

            {/* Missing Keywords Card */}
            <div
              className="glass-panel"
              style={{
                padding: "20px",
                borderRadius: "18px",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                background: "rgba(245, 158, 11, 0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <Target size={18} color="#F59E0B" />
                <h4
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    color: "#FBBF24",
                    margin: 0,
                  }}
                >
                  {lang === "id"
                    ? "Kata Kunci yang Disarankan"
                    : "Recommended Keywords"}
                </h4>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {auditResult.missingKeywords &&
                auditResult.missingKeywords.length > 0 ? (
                  auditResult.missingKeywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="badge badge-cyan"
                      style={{ fontSize: "0.74rem", padding: "3px 8px" }}
                    >
                      + {kw}
                    </span>
                  ))
                ) : (
                  <span
                    style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                  >
                    Kata kunci sudah cukup relevan.
                  </span>
                )}
              </div>
            </div>

            {/* Actionable Improvements Card */}
            <div
              className="glass-panel"
              style={{
                padding: "20px",
                borderRadius: "18px",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                background: "rgba(16, 185, 129, 0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <Award size={18} color="#10B981" />
                <h4
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    color: "#34D399",
                    margin: 0,
                  }}
                >
                  {lang === "id"
                    ? "Langkah Konkret Perbaikan"
                    : "Actionable Improvements"}
                </h4>
              </div>
              <ul
                style={{
                  paddingLeft: "18px",
                  margin: 0,
                  fontSize: "0.82rem",
                  color: "#A7F3D0",
                  lineHeight: "1.6",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                {auditResult.improvements &&
                auditResult.improvements.length > 0 ? (
                  auditResult.improvements.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))
                ) : (
                  <li>Pertahankan struktur saat ini.</li>
                )}
              </ul>
            </div>
          </div>

          {/* AI 1-Click STAR Method & Summary Rewriter Section */}
          <div
            className="glass-panel"
            style={{
              padding: "24px",
              borderRadius: "18px",
              background:
                "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(14, 165, 233, 0.06) 100%)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={20} color="#818CF8" />
              <div>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "#F8FAFC",
                    margin: 0,
                  }}
                >
                  {lang === "id"
                    ? "✨ Hasil Romabakan AI Berstandar STAR (Siap Disalin)"
                    : "✨ AI STAR-Optimized Content Ready to Copy"}
                </h3>
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    margin: "2px 0 0 0",
                  }}
                >
                  {lang === "id"
                    ? "Salin teks di bawah untuk langsung mengganti bagian ringkasan dan poin pengalaman di CV Anda"
                    : "Copy these snippets directly into your resume to instantly boost your ATS score"}
                </p>
              </div>
            </div>

            {auditResult.optimizedSummarySample && (
              <div
                style={{
                  background: "rgba(15, 23, 42, 0.7)",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid var(--border-glass)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#38BDF8",
                    }}
                  >
                    {lang === "id"
                      ? "1. Rekomendasi Ringkasan Profesional (Professional Summary):"
                      : "1. Optimized Professional Summary:"}
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(auditResult.optimizedSummarySample, "summary")
                    }
                    className="btn-secondary"
                    style={{ fontSize: "0.74rem", padding: "4px 10px" }}
                  >
                    {copiedSummary ? (
                      <Check size={12} color="#10B981" />
                    ) : (
                      <Copy size={12} />
                    )}
                    <span>
                      {copiedSummary
                        ? lang === "id"
                          ? "Tersalin!"
                          : "Copied!"
                        : lang === "id"
                          ? "Salin Teks"
                          : "Copy Text"}
                    </span>
                  </button>
                </div>
                <p
                  style={{
                    fontSize: "0.84rem",
                    color: "#E2E8F0",
                    lineHeight: "1.6",
                    margin: 0,
                  }}
                >
                  "{auditResult.optimizedSummarySample}"
                </p>
              </div>
            )}

            {auditResult.starExperienceSample && (
              <div
                style={{
                  background: "rgba(15, 23, 42, 0.7)",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid var(--border-glass)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#34D399",
                    }}
                  >
                    {lang === "id"
                      ? "2. Contoh Poin Pengalaman Format STAR (Action Verb + Metrik Angka):"
                      : "2. Sample STAR Experience Bullet Point:"}
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(auditResult.starExperienceSample, "star")
                    }
                    className="btn-secondary"
                    style={{ fontSize: "0.74rem", padding: "4px 10px" }}
                  >
                    {copiedSTAR ? (
                      <Check size={12} color="#10B981" />
                    ) : (
                      <Copy size={12} />
                    )}
                    <span>
                      {copiedSTAR
                        ? lang === "id"
                          ? "Tersalin!"
                          : "Copied!"
                        : lang === "id"
                          ? "Salin Teks"
                          : "Copy Text"}
                    </span>
                  </button>
                </div>
                <p
                  style={{
                    fontSize: "0.84rem",
                    color: "#E2E8F0",
                    lineHeight: "1.6",
                    margin: 0,
                  }}
                >
                  • {auditResult.starExperienceSample}
                </p>
              </div>
            )}
          </div>

          {/* Quick Link to AI CV Generator */}
          <div
            className="glass-panel"
            style={{
              padding: "20px 24px",
              borderRadius: "18px",
              background:
                "linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(99, 102, 241, 0.12) 100%)",
              border: "1px solid rgba(56, 189, 248, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ maxWidth: "640px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "4px",
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
                  <Sparkles size={12} />{" "}
                  {lang === "id" ? "Fitur Baru" : "New Feature"}
                </span>
                <span
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 800,
                    color: "#F8FAFC",
                  }}
                >
                  {lang === "id"
                    ? "Ingin CV Baru yang 100% Langsung Lolos ATS?"
                    : "Want a Brand New 100% ATS-Compliant Resume?"}
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "var(--text-muted)",
                  margin: 0,
                  lineHeight: "1.5",
                }}
              >
                {lang === "id"
                  ? 'Gunakan fitur "Buat CV AI" untuk menyulap riwayat kerja dan pendidikan Anda menjadi CV berstandar internasional dan ekspor PDF A4 siap kirim dalam 1 klik!'
                  : 'Use "Build AI CV" to auto-refine your work experience into a world-class ATS-friendly resume and export a high-DPI PDF in 1 click!'}
              </p>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab("cv-builder")}
                className="btn-primary"
                style={{
                  padding: "10px 20px",
                  fontSize: "0.86rem",
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
                  gap: "6px",
                }}
              >
                <FilePlus size={16} />
                <span>
                  {lang === "id"
                    ? "✨ Buat CV AI Sekarang"
                    : "✨ Build AI CV Now"}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
