import React, { useState, useRef } from "react";
import {
  FileText,
  Sparkles,
  Download,
  Copy,
  Check,
  Plus,
  Trash2,
  Briefcase,
  GraduationCap,
  Users,
  Award,
  Wrench,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  ExternalLink,
  RefreshCw,
  Eye,
  Printer,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Layers,
  ShieldCheck,
  Heart,
  Crown,
} from "lucide-react";
import confetti from "canvas-confetti";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useLanguage } from "../context/LanguageContext";

export default function CVGenerator({
  currentUser,
  onProfileUpdated,
  onOpenUpgradePro,
  onOpenAuth,
}) {
  const { lang, t } = useLanguage();
  const cvSheetRef = useRef(null);

  const isProOrVip =
    currentUser?.plan === "pro" ||
    currentUser?.plan === "vip" ||
    currentUser?.role === "admin";
  const cvUsage = currentUser?.cv_builder_usage || 0;
  const isExhausted = !isProOrVip && cvUsage >= 1;

  // Form State
  const [targetRole, setTargetRole] = useState("");
  const [personalInfo, setPersonalInfo] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    linkedin: "",
    portfolio: "",
  });

  const [rawSummary, setRawSummary] = useState("");

  const [workExperiences, setWorkExperiences] = useState([
    {
      id: 1,
      company: "",
      role: "",
      period: "",
      location: "",
      raw_duties: "",
    },
  ]);

  const [organizations, setOrganizations] = useState([]);

  const [educations, setEducations] = useState([
    {
      id: 1,
      institution: "",
      degree: "",
      period: "",
      gpa: "",
      highlights: "",
    },
  ]);

  const [skillsText, setSkillsText] = useState("");

  const [projectsCertificates, setProjectsCertificates] = useState([]);

  // AI Generated / Refined State
  const [refinedCV, setRefinedCV] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [layoutMode, setLayoutMode] = useState("ats"); // 'ats' | 'modern'

  // Add Dynamic Items Handlers
  const addExperience = () => {
    setWorkExperiences([
      ...workExperiences,
      {
        id: Date.now(),
        company: "",
        role: "",
        period: "",
        location: "",
        raw_duties: "",
      },
    ]);
  };

  const removeExperience = (id) => {
    setWorkExperiences(workExperiences.filter((x) => x.id !== id));
  };

  const addOrganization = () => {
    setOrganizations([
      ...organizations,
      {
        id: Date.now(),
        name: "",
        role: "",
        period: "",
        raw_duties: "",
      },
    ]);
  };

  const removeOrganization = (id) => {
    setOrganizations(organizations.filter((x) => x.id !== id));
  };

  const addEducation = () => {
    setEducations([
      ...educations,
      {
        id: Date.now(),
        institution: "",
        degree: "",
        period: "",
        gpa: "",
        highlights: "",
      },
    ]);
  };

  const removeEducation = (id) => {
    setEducations(educations.filter((x) => x.id !== id));
  };

  const addProject = () => {
    setProjectsCertificates([
      ...projectsCertificates,
      {
        id: Date.now(),
        title: "",
        issuer: "",
        year: "",
        description: "",
      },
    ]);
  };

  const removeProject = (id) => {
    setProjectsCertificates(projectsCertificates.filter((x) => x.id !== id));
  };

  // 1-Click AI Transformation Handler
  const handleGenerateCV = async () => {
    if (!targetRole.trim()) {
      alert("Silakan isi Posisi Target yang Anda tuju terlebih dahulu.");
      return;
    }

    setIsGenerating(true);
    try {
      const token = localStorage.getItem("lamarkerja_token");
      const res = await fetch("/api/cv/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          target_role: targetRole,
          personal_info: personalInfo,
          raw_summary: rawSummary,
          work_experiences: workExperiences,
          organizations: organizations,
          educations: educations,
          skills: skillsText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          projects_certifications: projectsCertificates,
        }),
      });

      const data = await res.json();
      if (!data.success || !data.cv) {
        if (data.require_upgrade || res.status === 403) {
          if (onOpenUpgradePro) onOpenUpgradePro();
        }
        throw new Error(data.error || "Gagal menghasilkan CV dengan AI");
      }

      setRefinedCV(data.cv);
      if (onProfileUpdated) onProfileUpdated();

      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch {}
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // 1-Click Export to Clean High-DPI PDF (Standard A4)
  const handleDownloadPDF = async () => {
    if (!cvSheetRef.current) return;
    setIsDownloading(true);

    try {
      const element = cvSheetRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution crisp rendering
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; // A4 mm width
      const pageHeight = 297; // A4 mm height
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `CV_${(personalInfo.name || "LamarKerja").replace(/\s+/g, "_")}_${targetRole.replace(/\s+/g, "_")}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF Generation Error:", err);
      alert("Gagal mengunduh PDF: " + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  // Save to User Profile Cloud
  const handleSaveToProfile = async () => {
    if (!refinedCV) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const token = localStorage.getItem("lamarkerja_token");
      const res = await fetch("/api/cv/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          cvData: refinedCV,
          targetRole: targetRole,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        if (onProfileUpdated) onProfileUpdated();
        setTimeout(() => setSaveSuccess(false), 3500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Copy Full Plain Text for Job Portals
  const handleCopyText = () => {
    if (!refinedCV) return;
    let fullText = `${personalInfo.name}\n${targetRole}\n${personalInfo.email} | ${personalInfo.phone} | ${personalInfo.city}\n${personalInfo.linkedin} | ${personalInfo.portfolio}\n\n`;
    fullText += `RINGKASAN PROFESIONAL\n${refinedCV.refined_summary}\n\n`;

    fullText += `PENGALAMAN KERJA\n`;
    refinedCV.refined_work_experiences?.forEach((exp) => {
      fullText += `${exp.role} - ${exp.company} (${exp.period})\n`;
      exp.bullet_points?.forEach((b) => {
        fullText += `• ${b}\n`;
      });
      fullText += `\n`;
    });

    fullText += `PENDIDIKAN\n`;
    refinedCV.refined_educations?.forEach((edu) => {
      fullText += `${edu.degree} - ${edu.institution} (${edu.period}) | IPK: ${edu.gpa}\n`;
    });

    if (refinedCV.refined_organizations?.length) {
      fullText += `\nPENGALAMAN ORGANISASI\n`;
      refinedCV.refined_organizations.forEach((org) => {
        fullText += `${org.role} - ${org.name} (${org.period})\n`;
        org.bullet_points?.forEach((b) => {
          fullText += `• ${b}\n`;
        });
      });
    }

    fullText += `\nKEAHLIAN\n`;
    fullText += `Hard Skills: ${refinedCV.refined_skills?.hard_skills?.join(", ")}\n`;
    fullText += `Soft Skills: ${refinedCV.refined_skills?.soft_skills?.join(", ")}\n`;

    navigator.clipboard.writeText(fullText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "28px",
        maxWidth: "1440px",
        margin: "0 auto",
      }}
    >
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: "28px 32px",
          background:
            "linear-gradient(135deg, rgba(14, 165, 233, 0.16) 0%, rgba(99, 102, 241, 0.12) 100%)",
          border: "1px solid rgba(56, 189, 248, 0.3)",
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
              flexWrap: "wrap",
            }}
          >
            <span
              className="badge badge-cyan"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Sparkles size={13} />{" "}
              {lang === "id"
                ? "1-Klik AI Generator & Polisher"
                : "1-Click AI Resume Generator"}
            </span>
            <span className="badge badge-emerald">
              100% Lolos Uji ATS & Media
            </span>
            {isProOrVip ? (
              <span
                className="badge badge-amber"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Crown size={12} /> PRO / VIP Unlimited Access
              </span>
            ) : (
              <span
                className={`badge ${isExhausted ? "badge-rose" : "badge-emerald"}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {isExhausted
                  ? "⚠️ 1x Uji Coba Gratis Habis"
                  : "⭐ 1x Uji Coba Gratis"}
              </span>
            )}
          </div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              margin: "0 0 6px 0",
              letterSpacing: "-0.02em",
            }}
          >
            {lang === "id" ? "Penyusun CV Otomatis " : "Automated CV Builder "}
            <span className="gradient-text">ATS & Media Standar Global</span>
          </h1>
          <p
            style={{
              fontSize: "0.88rem",
              color: "var(--text-muted)",
              lineHeight: "1.5",
              margin: 0,
            }}
          >
            {lang === "id"
              ? "Cukup ketik poin-poin sederhana pekerjaan dan pendidikan Anda. AI akan menyulapnya menjadi kalimat pencapaian STAR berdampak tinggi (+metrik %) dalam tata letak A4 yang teruji 100% siap tembus interview!"
              : "Enter basic bullet points. AI automatically polishes them into high-converting STAR achievements and exports a pixel-perfect A4 PDF."}
          </p>
        </div>

        <button
          onClick={handleGenerateCV}
          disabled={isGenerating}
          className="btn-primary"
          style={{
            padding: "14px 24px",
            fontSize: "0.95rem",
            fontWeight: 800,
            background: isExhausted
              ? "linear-gradient(135deg, #F59E0B, #EA580C)"
              : "linear-gradient(135deg, #0EA5E9, #6366F1)",
            boxShadow: isExhausted
              ? "0 0 25px rgba(245, 158, 11, 0.5)"
              : "0 0 25px rgba(14, 165, 233, 0.5)",
            gap: "8px",
          }}
        >
          {isExhausted ? (
            <Crown size={18} />
          ) : (
            <Sparkles
              size={18}
              className={isGenerating ? "animate-spin" : ""}
            />
          )}
          <span>
            {isGenerating
              ? lang === "id"
                ? "AI Sedang Memoles CV..."
                : "AI is Polishing..."
              : isExhausted
                ? "👑 Upgrade PRO untuk Buat CV Lagi"
                : lang === "id"
                  ? "Poles & Susun CV Otomatis"
                  : "Generate & Polish CV"}
          </span>
        </button>
      </div>

      {/* Main Split-Screen Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))",
          gap: "24px",
          alignItems: "flex-start",
        }}
      >
        {/* LEFT PANEL: SIMPLE USER INPUT FORMS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            className="glass-panel"
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid var(--border-glass)",
                paddingBottom: "12px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <User size={18} color="#38BDF8" />
                <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>
                  1. Data Pribadi & Kontak
                </h3>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.76rem",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Nama Lengkap:
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={personalInfo.name}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, name: e.target.value })
                  }
                  placeholder="Contoh: Nama Lengkap Anda"
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "0.76rem",
                    color: "#38BDF8",
                    fontWeight: 700,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Posisi Target (Wajib): *
                </label>
                <input
                  type="text"
                  className="input-field"
                  style={{ borderColor: "rgba(56, 189, 248, 0.4)" }}
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="Contoh: Frontend Developer / Staff HRD"
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "0.76rem",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Alamat Email:
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={personalInfo.email}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, email: e.target.value })
                  }
                  placeholder="Contoh: nama@email.com"
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "0.76rem",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  No. WhatsApp / HP:
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={personalInfo.phone}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, phone: e.target.value })
                  }
                  placeholder="0812-xxxx-xxxx"
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "0.76rem",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Domisili / Kota:
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={personalInfo.city}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, city: e.target.value })
                  }
                  placeholder="Jakarta Selatan, DKI Jakarta"
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "0.76rem",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  LinkedIn / Portfolio:
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={personalInfo.linkedin}
                  onChange={(e) =>
                    setPersonalInfo({
                      ...personalInfo,
                      linkedin: e.target.value,
                    })
                  }
                  placeholder="linkedin.com/in/username"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Summary Mentah */}
          <div
            className="glass-panel"
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                borderBottom: "1px solid var(--border-glass)",
                paddingBottom: "12px",
              }}
            >
              <FileText size={18} color="#34D399" />
              <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>
                2. Ringkasan Profil (Poin Singkat)
              </h3>
            </div>
            <textarea
              className="input-field"
              rows={3}
              value={rawSummary}
              onChange={(e) => setRawSummary(e.target.value)}
              placeholder="Tuliskan 1-2 kalimat gambaran singkat tentang Anda. AI akan merangkainya menjadi ringkasan eksekutif profesional..."
              style={{ fontSize: "0.84rem", lineHeight: "1.5" }}
            />
          </div>

          {/* Section 3: Pengalaman Kerja */}
          <div
            className="glass-panel"
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid var(--border-glass)",
                paddingBottom: "12px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Briefcase size={18} color="#818CF8" />
                <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>
                  3. Pengalaman Kerja
                </h3>
              </div>
              <button
                type="button"
                onClick={addExperience}
                className="btn-secondary"
                style={{ fontSize: "0.75rem", padding: "4px 10px", gap: "4px" }}
              >
                <Plus size={13} /> Tambah Posisi
              </button>
            </div>

            {workExperiences.map((exp, idx) => (
              <div
                key={exp.id}
                style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid var(--border-glass)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#38BDF8",
                    }}
                  >
                    Pengalaman #{idx + 1}
                  </span>
                  {workExperiences.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExperience(exp.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#EF4444",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Nama Perusahaan (misal: PT Maju Bersama)"
                    value={exp.company}
                    onChange={(e) => {
                      const updated = [...workExperiences];
                      updated[idx].company = e.target.value;
                      setWorkExperiences(updated);
                    }}
                  />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Jabatan (misal: Staff Operasional)"
                    value={exp.role}
                    onChange={(e) => {
                      const updated = [...workExperiences];
                      updated[idx].role = e.target.value;
                      setWorkExperiences(updated);
                    }}
                  />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Periode (misal: Jan 2022 - Des 2024)"
                    value={exp.period}
                    onChange={(e) => {
                      const updated = [...workExperiences];
                      updated[idx].period = e.target.value;
                      setWorkExperiences(updated);
                    }}
                  />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Lokasi (misal: Jakarta)"
                    value={exp.location}
                    onChange={(e) => {
                      const updated = [...workExperiences];
                      updated[idx].location = e.target.value;
                      setWorkExperiences(updated);
                    }}
                  />
                </div>

                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="Tuliskan tugas/pekerjaan Anda secara santai. AI akan mengubahnya menjadi poin STAR (+metrik %)..."
                  value={exp.raw_duties}
                  onChange={(e) => {
                    const updated = [...workExperiences];
                    updated[idx].raw_duties = e.target.value;
                    setWorkExperiences(updated);
                  }}
                  style={{ fontSize: "0.8rem" }}
                />
              </div>
            ))}
          </div>

          {/* Section 4: Riwayat Organisasi */}
          <div
            className="glass-panel"
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid var(--border-glass)",
                paddingBottom: "12px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Users size={18} color="#F59E0B" />
                <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>
                  4. Pengalaman Organisasi & Kepemimpinan
                </h3>
              </div>
              <button
                type="button"
                onClick={addOrganization}
                className="btn-secondary"
                style={{ fontSize: "0.75rem", padding: "4px 10px", gap: "4px" }}
              >
                <Plus size={13} /> Tambah Organisasi
              </button>
            </div>

            {organizations.map((org, idx) => (
              <div
                key={org.id}
                style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid var(--border-glass)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#F59E0B",
                    }}
                  >
                    Organisasi #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeOrganization(org.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#EF4444",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Nama Organisasi / Komunitas"
                    value={org.name}
                    onChange={(e) => {
                      const updated = [...organizations];
                      updated[idx].name = e.target.value;
                      setOrganizations(updated);
                    }}
                  />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Peran / Jabatan (misal: Koordinator Acara)"
                    value={org.role}
                    onChange={(e) => {
                      const updated = [...organizations];
                      updated[idx].role = e.target.value;
                      setOrganizations(updated);
                    }}
                  />
                </div>

                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="Kegiatan atau inisiatif yang pernah Anda jalankan..."
                  value={org.raw_duties}
                  onChange={(e) => {
                    const updated = [...organizations];
                    updated[idx].raw_duties = e.target.value;
                    setOrganizations(updated);
                  }}
                  style={{ fontSize: "0.8rem" }}
                />
              </div>
            ))}
          </div>

          {/* Section 5: Pendidikan */}
          <div
            className="glass-panel"
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid var(--border-glass)",
                paddingBottom: "12px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <GraduationCap size={18} color="#10B981" />
                <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>
                  5. Pendidikan
                </h3>
              </div>
              <button
                type="button"
                onClick={addEducation}
                className="btn-secondary"
                style={{ fontSize: "0.75rem", padding: "4px 10px", gap: "4px" }}
              >
                <Plus size={13} /> Tambah Pendidikan
              </button>
            </div>

            {educations.map((edu, idx) => (
              <div
                key={edu.id}
                style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid var(--border-glass)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#10B981",
                    }}
                  >
                    Pendidikan #{idx + 1}
                  </span>
                  {educations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEducation(edu.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#EF4444",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Nama Kampus / Sekolah"
                    value={edu.institution}
                    onChange={(e) => {
                      const updated = [...educations];
                      updated[idx].institution = e.target.value;
                      setEducations(updated);
                    }}
                  />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Gelar & Jurusan (misal: S1 Sistem Informasi)"
                    value={edu.degree}
                    onChange={(e) => {
                      const updated = [...educations];
                      updated[idx].degree = e.target.value;
                      setEducations(updated);
                    }}
                  />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Tahun Masuk - Lulus (misal: 2019 - 2023)"
                    value={edu.period}
                    onChange={(e) => {
                      const updated = [...educations];
                      updated[idx].period = e.target.value;
                      setEducations(updated);
                    }}
                  />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="IPK / Nilai (misal: 3.75 / 4.00)"
                    value={edu.gpa}
                    onChange={(e) => {
                      const updated = [...educations];
                      updated[idx].gpa = e.target.value;
                      setEducations(updated);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Section 6: Keahlian (Skills) */}
          <div
            className="glass-panel"
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                borderBottom: "1px solid var(--border-glass)",
                paddingBottom: "12px",
              }}
            >
              <Wrench size={18} color="#38BDF8" />
              <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>
                6. Keahlian (Pisahkan dengan koma)
              </h3>
            </div>
            <textarea
              className="input-field"
              rows={2}
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="Contoh: Microsoft Excel, Canva, React, Public Speaking, Data Analysis, Photoshop..."
              style={{ fontSize: "0.82rem" }}
            />
          </div>

          {/* Section 7: Sertifikasi & Proyek */}
          <div
            className="glass-panel"
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid var(--border-glass)",
                paddingBottom: "12px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Award size={18} color="#FBBF24" />
                <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>
                  7. Sertifikasi / Proyek Tambahan
                </h3>
              </div>
              <button
                type="button"
                onClick={addProject}
                className="btn-secondary"
                style={{ fontSize: "0.75rem", padding: "4px 10px", gap: "4px" }}
              >
                <Plus size={13} /> Tambah Sertifikat/Proyek
              </button>
            </div>

            {projectsCertificates.map((proj, idx) => (
              <div
                key={proj.id}
                style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid var(--border-glass)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#FBBF24",
                    }}
                  >
                    Sertifikat/Proyek #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeProject(proj.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#EF4444",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Nama Sertifikat / Proyek"
                    value={proj.title}
                    onChange={(e) => {
                      const updated = [...projectsCertificates];
                      updated[idx].title = e.target.value;
                      setProjectsCertificates(updated);
                    }}
                  />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Penyelenggara"
                    value={proj.issuer}
                    onChange={(e) => {
                      const updated = [...projectsCertificates];
                      updated[idx].issuer = e.target.value;
                      setProjectsCertificates(updated);
                    }}
                  />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Tahun (2024)"
                    value={proj.year}
                    onChange={(e) => {
                      const updated = [...projectsCertificates];
                      updated[idx].year = e.target.value;
                      setProjectsCertificates(updated);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Action Trigger */}
          <button
            type="button"
            onClick={handleGenerateCV}
            disabled={isGenerating}
            className="btn-primary"
            style={{
              padding: "16px",
              fontSize: "1.05rem",
              fontWeight: 800,
              justifyContent: "center",
              background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
              boxShadow: "0 0 30px rgba(14, 165, 233, 0.45)",
              gap: "10px",
            }}
          >
            <Sparkles
              size={20}
              className={isGenerating ? "animate-spin" : ""}
            />
            <span>
              {isGenerating
                ? "AI Sedang Memoles & Menyusun CV..."
                : "Poles & Bangun CV Otomatis Sekarang"}
            </span>
          </button>
        </div>

        {/* RIGHT PANEL: LIVE A4 PREVIEW & PDF EXPORT */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            position: "sticky",
            top: "80px",
          }}
        >
          {/* Top Control Bar */}
          <div
            className="glass-panel"
            style={{
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            {/* Template Selector */}
            <div
              style={{
                display: "flex",
                gap: "6px",
                background: "rgba(15, 23, 42, 0.8)",
                padding: "4px",
                borderRadius: "10px",
                border: "1px solid var(--border-glass)",
              }}
            >
              <button
                type="button"
                onClick={() => setLayoutMode("ats")}
                className={
                  layoutMode === "ats" ? "btn-primary" : "btn-secondary"
                }
                style={{ fontSize: "0.76rem", padding: "6px 12px", gap: "4px" }}
              >
                <FileText size={13} />
                <span>Format ATS Klasik</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode("modern")}
                className={
                  layoutMode === "modern" ? "btn-primary" : "btn-secondary"
                }
                style={{ fontSize: "0.76rem", padding: "6px 12px", gap: "4px" }}
              >
                <Layers size={13} />
                <span>Format Modern Media</span>
              </button>
            </div>

            {/* Actions: Download PDF & Save */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                onClick={handleCopyText}
                disabled={!refinedCV}
                className="btn-secondary"
                style={{ fontSize: "0.76rem", padding: "7px 12px", gap: "5px" }}
                title="Salin teks CV siap paste ke formulir web"
              >
                {copiedText ? (
                  <Check size={14} color="#10B981" />
                ) : (
                  <Copy size={14} />
                )}
                <span>{copiedText ? "Tersalin!" : "Salin Teks"}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToProfile}
                disabled={!refinedCV || isSaving}
                className="btn-secondary"
                style={{
                  fontSize: "0.76rem",
                  padding: "7px 12px",
                  gap: "5px",
                  borderColor: saveSuccess ? "#10B981" : undefined,
                }}
              >
                {saveSuccess ? (
                  <Check size={14} color="#10B981" />
                ) : (
                  <ShieldCheck size={14} />
                )}
                <span>{saveSuccess ? "Tersimpan!" : "Simpan ke Profil"}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={!refinedCV || isDownloading}
                className="btn-primary"
                style={{
                  fontSize: "0.82rem",
                  padding: "7px 14px",
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #10B981, #059669)",
                  gap: "6px",
                }}
              >
                <Download
                  size={15}
                  className={isDownloading ? "animate-spin" : ""}
                />
                <span>{isDownloading ? "Mengunduh..." : "Unduh PDF A4"}</span>
              </button>
            </div>
          </div>

          {/* Real A4 Paper Canvas */}
          <div
            style={{
              background: "rgba(0, 0, 0, 0.4)",
              padding: "16px",
              borderRadius: "16px",
              border: "1px solid var(--border-glass)",
              overflowX: "auto",
              display: "flex",
              justifyContent: "center",
              boxShadow: "0 25px 60px -15px rgba(0,0,0,0.8)",
            }}
          >
            <div
              ref={cvSheetRef}
              id="cv-preview-sheet"
              style={{
                width: "100%",
                maxWidth: "794px", // Standard 96 DPI A4 width
                minHeight: "1123px", // Standard 96 DPI A4 height
                background: "#ffffff",
                color: "#111827",
                padding: "40px 48px",
                boxSizing: "border-box",
                fontFamily:
                  layoutMode === "ats"
                    ? "Times New Roman, Times, serif"
                    : "Inter, Arial, sans-serif",
                lineHeight: 1.4,
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {!refinedCV ? (
                /* Empty Placeholder State */
                <div
                  style={{
                    height: "800px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6B7280",
                    textAlign: "center",
                    gap: "14px",
                  }}
                >
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background: "#F3F4F6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Sparkles size={28} color="#0284C7" />
                  </div>
                  <div style={{ maxWidth: "380px" }}>
                    <h3
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        color: "#1F2937",
                        margin: "0 0 6px 0",
                      }}
                    >
                      Pratinjau CV Siap Tampil di Sini
                    </h3>
                    <p
                      style={{
                        fontSize: "0.84rem",
                        margin: 0,
                        lineHeight: "1.5",
                      }}
                    >
                      Isi data mentah di form sebelah kiri, lalu klik tombol{" "}
                      <b>"Poles & Bangun CV Otomatis"</b> untuk menyusun dokumen
                      final.
                    </p>
                  </div>
                </div>
              ) : (
                /* ACTUAL POLISHED CV OUTPUT */
                <>
                  {/* HEADER */}
                  <div
                    style={{
                      textAlign: layoutMode === "ats" ? "center" : "left",
                      borderBottom:
                        layoutMode === "modern"
                          ? "3px solid #0284C7"
                          : "1px solid #111827",
                      paddingBottom: "12px",
                    }}
                  >
                    <h1
                      style={{
                        fontSize: layoutMode === "ats" ? "1.85rem" : "2rem",
                        fontWeight: 800,
                        color: layoutMode === "modern" ? "#0F172A" : "#000000",
                        margin: "0 0 4px 0",
                        letterSpacing: "-0.02em",
                        textTransform: "uppercase",
                      }}
                    >
                      {personalInfo.name || "Nama Pelamar"}
                    </h1>

                    <div
                      style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "#0284C7",
                        marginBottom: "6px",
                      }}
                    >
                      {targetRole}
                    </div>

                    <div
                      style={{
                        fontSize: "0.82rem",
                        color: "#374151",
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          layoutMode === "ats" ? "center" : "flex-start",
                        flexWrap: "wrap",
                        gap: "8px",
                      }}
                    >
                      {personalInfo.email && <span>{personalInfo.email}</span>}
                      {personalInfo.phone && (
                        <span>• {personalInfo.phone}</span>
                      )}
                      {personalInfo.city && <span>• {personalInfo.city}</span>}
                      {personalInfo.linkedin && (
                        <span>• {personalInfo.linkedin}</span>
                      )}
                      {personalInfo.portfolio && (
                        <span>• {personalInfo.portfolio}</span>
                      )}
                    </div>
                  </div>

                  {/* 1. PROFESSIONAL SUMMARY */}
                  {refinedCV.refined_summary && (
                    <div>
                      <h2
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          color:
                            layoutMode === "modern" ? "#0284C7" : "#000000",
                          borderBottom: "1px solid #D1D5DB",
                          paddingBottom: "3px",
                          marginBottom: "6px",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {layoutMode === "ats"
                          ? "RINGKASAN PROFESIONAL"
                          : "Professional Summary"}
                      </h2>
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "#1F2937",
                          margin: 0,
                          textAlign: "justify",
                          lineHeight: "1.45",
                        }}
                      >
                        {refinedCV.refined_summary}
                      </p>
                    </div>
                  )}

                  {/* 2. WORK EXPERIENCES */}
                  {refinedCV.refined_work_experiences &&
                    refinedCV.refined_work_experiences.length > 0 && (
                      <div>
                        <h2
                          style={{
                            fontSize: "0.95rem",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            color:
                              layoutMode === "modern" ? "#0284C7" : "#000000",
                            borderBottom: "1px solid #D1D5DB",
                            paddingBottom: "3px",
                            marginBottom: "8px",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {layoutMode === "ats"
                            ? "PENGALAMAN KERJA"
                            : "Work Experience"}
                        </h2>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                          }}
                        >
                          {refinedCV.refined_work_experiences.map(
                            (exp, idx) => (
                              <div key={idx}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "baseline",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: 800,
                                      fontSize: "0.88rem",
                                      color: "#111827",
                                    }}
                                  >
                                    {exp.role} —{" "}
                                    <span
                                      style={{
                                        fontStyle: "italic",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {exp.company}
                                    </span>
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "0.8rem",
                                      fontWeight: 600,
                                      color: "#4B5563",
                                    }}
                                  >
                                    {exp.period}{" "}
                                    {exp.location ? `| ${exp.location}` : ""}
                                  </span>
                                </div>

                                <ul
                                  style={{
                                    margin: "4px 0 0 0",
                                    paddingLeft: "18px",
                                    fontSize: "0.84rem",
                                    color: "#1F2937",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "3px",
                                  }}
                                >
                                  {exp.bullet_points?.map((pt, pIdx) => (
                                    <li
                                      key={pIdx}
                                      style={{
                                        textAlign: "justify",
                                        lineHeight: "1.4",
                                      }}
                                    >
                                      {pt}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {/* 3. ORGANIZATIONS */}
                  {refinedCV.refined_organizations &&
                    refinedCV.refined_organizations.length > 0 && (
                      <div>
                        <h2
                          style={{
                            fontSize: "0.95rem",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            color:
                              layoutMode === "modern" ? "#0284C7" : "#000000",
                            borderBottom: "1px solid #D1D5DB",
                            paddingBottom: "3px",
                            marginBottom: "8px",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {layoutMode === "ats"
                            ? "PENGALAMAN ORGANISASI & KEPEMIMPINAN"
                            : "Leadership & Organization"}
                        </h2>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                          }}
                        >
                          {refinedCV.refined_organizations.map((org, idx) => (
                            <div key={idx}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "baseline",
                                  flexWrap: "wrap",
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 800,
                                    fontSize: "0.88rem",
                                    color: "#111827",
                                  }}
                                >
                                  {org.role} —{" "}
                                  <span
                                    style={{
                                      fontStyle: "italic",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {org.name}
                                  </span>
                                </span>
                                <span
                                  style={{
                                    fontSize: "0.8rem",
                                    fontWeight: 600,
                                    color: "#4B5563",
                                  }}
                                >
                                  {org.period}
                                </span>
                              </div>

                              <ul
                                style={{
                                  margin: "4px 0 0 0",
                                  paddingLeft: "18px",
                                  fontSize: "0.84rem",
                                  color: "#1F2937",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "3px",
                                }}
                              >
                                {org.bullet_points?.map((pt, pIdx) => (
                                  <li
                                    key={pIdx}
                                    style={{
                                      textAlign: "justify",
                                      lineHeight: "1.4",
                                    }}
                                  >
                                    {pt}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* 4. EDUCATION */}
                  {refinedCV.refined_educations &&
                    refinedCV.refined_educations.length > 0 && (
                      <div>
                        <h2
                          style={{
                            fontSize: "0.95rem",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            color:
                              layoutMode === "modern" ? "#0284C7" : "#000000",
                            borderBottom: "1px solid #D1D5DB",
                            paddingBottom: "3px",
                            marginBottom: "8px",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {layoutMode === "ats" ? "PENDIDIKAN" : "Education"}
                        </h2>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          {refinedCV.refined_educations.map((edu, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "baseline",
                                flexWrap: "wrap",
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    fontWeight: 800,
                                    fontSize: "0.88rem",
                                    color: "#111827",
                                  }}
                                >
                                  {edu.institution}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.82rem",
                                    color: "#374151",
                                  }}
                                >
                                  {edu.degree}{" "}
                                  {edu.gpa ? `• IPK: ${edu.gpa}` : ""}
                                </div>
                              </div>
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  color: "#4B5563",
                                }}
                              >
                                {edu.period}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* 5. SKILLS & COMPETENCIES */}
                  {refinedCV.refined_skills && (
                    <div>
                      <h2
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          color:
                            layoutMode === "modern" ? "#0284C7" : "#000000",
                          borderBottom: "1px solid #D1D5DB",
                          paddingBottom: "3px",
                          marginBottom: "6px",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {layoutMode === "ats"
                          ? "KEAHLIAN & KOMPETENSI"
                          : "Skills & Competencies"}
                      </h2>

                      <div
                        style={{
                          fontSize: "0.84rem",
                          color: "#1F2937",
                          lineHeight: "1.5",
                        }}
                      >
                        {refinedCV.refined_skills.hard_skills && (
                          <div style={{ marginBottom: "3px" }}>
                            <strong style={{ color: "#111827" }}>
                              Hard Skills:{" "}
                            </strong>
                            <span>
                              {refinedCV.refined_skills.hard_skills.join(", ")}
                            </span>
                          </div>
                        )}
                        {refinedCV.refined_skills.soft_skills && (
                          <div>
                            <strong style={{ color: "#111827" }}>
                              Soft Skills:{" "}
                            </strong>
                            <span>
                              {refinedCV.refined_skills.soft_skills.join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 6. PROJECTS & CERTIFICATIONS */}
                  {refinedCV.refined_projects_certifications &&
                    refinedCV.refined_projects_certifications.length > 0 && (
                      <div>
                        <h2
                          style={{
                            fontSize: "0.95rem",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            color:
                              layoutMode === "modern" ? "#0284C7" : "#000000",
                            borderBottom: "1px solid #D1D5DB",
                            paddingBottom: "3px",
                            marginBottom: "6px",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {layoutMode === "ats"
                            ? "SERTIFIKASI & PENGHARGAAN"
                            : "Certifications & Honors"}
                        </h2>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            fontSize: "0.84rem",
                          }}
                        >
                          {refinedCV.refined_projects_certifications.map(
                            (proj, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "baseline",
                                }}
                              >
                                <span>
                                  <strong>{proj.title}</strong> — {proj.issuer}{" "}
                                  {proj.description
                                    ? `(${proj.description})`
                                    : ""}
                                </span>
                                <span
                                  style={{
                                    fontSize: "0.78rem",
                                    color: "#4B5563",
                                    fontWeight: 600,
                                  }}
                                >
                                  {proj.year}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
