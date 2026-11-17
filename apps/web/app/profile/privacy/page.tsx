"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Download,
  Trash2,
  Lock,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Copy,
  Scale,
} from "lucide-react";
import { useAuth } from "../../../lib/auth/auth-context";
import { Breadcrumbs } from "../../components/layout/Breadcrumbs";
import { STATUTORY_RETENTION_RULES } from "../../../lib/privacy/retention-matrix";
import { generateSARDataPackage } from "../../../lib/privacy/export-service";
import { executeSevenStageDeletion, type DeletionResult } from "../../../lib/privacy/deletion-orchestrator";
import type { ExportDataPackage } from "@spiritual-os/types";

export default function PrivacyRightsPage() {
  const { user, openAuthModal } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [exportPackage, setExportPackage] = useState<ExportDataPackage | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionResult, setDeletionResult] = useState<DeletionResult | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleExport = async () => {
    if (!user) {
      openAuthModal({ message: "Sign in with your mobile number to export your personal data archive (SAR)." });
      return;
    }
    setIsExporting(true);
    try {
      const data = await generateSARDataPackage({
        userId: user.id,
        fullName: user.full_name || "Revered Devotee",
        phone: user.phone || "+91-98XXXXXXXX",
        email: user.email || "devotee@ishti.in",
      });
      setExportPackage(data);

      // Download file in browser
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ishti-sar-export-${data.metadata.exportId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExecuteDeletion = async () => {
    if (!user) {
      openAuthModal({ message: "Sign in with your mobile number to verify your identity before initiating account erasure." });
      return;
    }
    setIsDeleting(true);
    try {
      const result = await executeSevenStageDeletion(user.id);
      setDeletionResult(result);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedHash(text);
      setTimeout(() => setCopiedHash(null), 2500);
    }
  };

  return (
    <div className="profileShell" style={{ maxWidth: "1000px" }}>
      <Breadcrumbs
        items={[
          { label: "Devotee Profile", href: "/profile" },
          { label: "Privacy Rights & Data Sanctuary", current: true },
        ]}
      />

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <Shield size={18} color="var(--ishti-temple-maroon)" aria-hidden="true" />
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--ishti-temple-maroon)",
            }}
          >
            Statutory Data Subject Rights
          </span>
        </div>
        <h1 className="pillarTitle" style={{ fontSize: "32px", marginBottom: "8px" }}>
          Privacy Rights &amp; Deletion Sanctuary
        </h1>
        <p className="pillarDescription" style={{ fontSize: "15px", maxWidth: "800px", lineHeight: 1.6 }}>
          Under §11 (Right to Access), §12 (Right to Erasure), and §13 (Grievance Redressal) of India&apos;s
          Digital Personal Data Protection Act, 2023, and GDPR Articles 15–20, you possess absolute sovereignty
          over your spiritual, astrological, and personal records.
        </p>
      </div>

      {/* Guest Notice */}
      {!user && (
        <div className="authModalSandboxBanner" style={{ marginBottom: "24px" }}>
          <span className="authSandboxBadge">AUTHENTICATION REQUIRED</span>
          <p className="authSandboxText">
            Subject Access Requests (SAR) and 7-stage account erasure require an authenticated devotee session to verify identity under DPDP §11–12 and GDPR Art. 15–17.{" "}
            <button
              type="button"
              onClick={() => openAuthModal({ message: "Sign in to access your statutory privacy rights." })}
              style={{
                background: "none",
                border: "none",
                color: "var(--ishti-temple-maroon)",
                fontWeight: 700,
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              Sign in with mobile
            </button>
            .
          </p>
        </div>
      )}

      {/* Two Primary Action Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
          marginBottom: "36px",
        }}
      >
        {/* Action 1: Export Personal Data (SAR) */}
        <div className="profileCard" style={{ margin: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div
                style={{
                  padding: "8px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(113, 27, 22, 0.08)",
                  color: "var(--ishti-temple-maroon)",
                }}
              >
                <Download size={20} aria-hidden="true" />
              </div>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>
                Export Sanctuary Data (SAR)
              </h2>
            </div>
            <p style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)", lineHeight: 1.5, marginBottom: "16px" }}>
              Download a complete, machine-readable JSON archive containing your devotee profile, active
              consents, booking summaries, and encrypted astrological chart descriptors.
            </p>
            {exportPackage && (
              <div
                style={{
                  backgroundColor: "#FAF7F2",
                  border: "1px solid var(--border-card)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "11px",
                  marginBottom: "16px",
                  fontFamily: "monospace",
                }}
              >
                <div>Export ID: {exportPackage.metadata.exportId}</div>
                <div>Fingerprint: {exportPackage.metadata.dataFingerprintSha256.slice(0, 16)}...</div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="btnExploreModule"
            style={{
              width: "100%",
              marginTop: "8px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <Download size={15} aria-hidden="true" />
            <span>
              {user
                ? isExporting
                  ? "Generating Package..."
                  : "Download Machine-Readable JSON"
                : "Sign In to Download Data Package"}
            </span>
          </button>
        </div>

        {/* Action 2: 7-Stage Account Erasure */}
        <div
          className="profileCard"
          style={{
            margin: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: "1px solid rgba(185, 28, 28, 0.2)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div
                style={{
                  padding: "8px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(185, 28, 28, 0.08)",
                  color: "#B91C1C",
                }}
              >
                <Trash2 size={20} aria-hidden="true" />
              </div>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>
                7-Stage Account &amp; Spiritual Erasure (Demonstration Sequence)
              </h2>
            </div>
            <p style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)", lineHeight: 1.5, marginBottom: "16px" }}>
              Demonstrates ISHTI&apos;s 7-stage deletion sequence. Permanently purges active astrological Kundli records,
              sacred Sankalpa intentions, and pseudonymizes financial records to satisfy statutory tax retention mandates.
            </p>
          </div>

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => (user ? setShowDeleteConfirm(true) : openAuthModal({ message: "Sign in to initiate account erasure." }))}
              style={{
                width: "100%",
                padding: "10px 16px",
                fontSize: "13px",
                fontWeight: 600,
                borderRadius: "8px",
                border: "1px solid #B91C1C",
                backgroundColor: "#FFFFFF",
                color: "#B91C1C",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 150ms ease",
              }}
            >
              <Trash2 size={15} aria-hidden="true" />
              <span>{user ? "Initiate 7-Stage Erasure" : "Sign In to Request Erasure"}</span>
            </button>
          ) : (
            <div
              style={{
                backgroundColor: "rgba(185, 28, 28, 0.04)",
                border: "1px solid rgba(185, 28, 28, 0.3)",
                borderRadius: "8px",
                padding: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#B91C1C", marginBottom: "6px" }}>
                <AlertTriangle size={15} aria-hidden="true" />
                <span style={{ fontSize: "13px", fontWeight: 700 }}>Confirm Irreversible Erasure?</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--ishti-temple-charcoal)", lineHeight: 1.4, marginBottom: "12px" }}>
                This will permanently shred your astrological Kundli data and prayer notes. A cryptographically signed
                Deletion Certificate will be issued.
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={handleExecuteDeletion}
                  disabled={isDeleting}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#B91C1C",
                    color: "#FFFFFF",
                    cursor: "pointer",
                  }}
                >
                  {isDeleting ? "Shredding Records..." : "Confirm & Execute"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    padding: "8px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "6px",
                    border: "1px solid var(--border-card)",
                    backgroundColor: "#FFFFFF",
                    color: "var(--ishti-temple-charcoal)",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deletion Certificate Output (When Executed) */}
      {deletionResult && (
        <div
          className="profileCard"
          style={{
            backgroundColor: "#FAF7F2",
            border: "1px solid var(--ishti-temple-maroon)",
            marginBottom: "36px",
          }}
          role="region"
          aria-label="Cryptographic deletion certificate"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <FileCheck size={24} color="var(--ishti-temple-maroon)" aria-hidden="true" />
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>
                Cryptographic Deletion Certificate
              </h3>
              <span style={{ fontSize: "11px", color: "var(--ishti-warm-bronze)" }}>
                Certificate ID: <code>{deletionResult.certificate.certificateId}</code>
              </span>
            </div>
          </div>

          <p style={{ fontSize: "13px", color: "var(--ishti-temple-charcoal)", lineHeight: 1.5, marginBottom: "16px" }}>
            All 7 deletion stages have been successfully executed. Personal and devotional records have been
            permanently shredded. To comply with statutory requirements under the{" "}
            <strong>Income-tax Act, 2025 §62 / Rule 46</strong>, financial vouchers have been pseudonymized to{" "}
            <code>ANON-USER-DELETED</code>.
          </p>

          {/* 7 Stages Completed List */}
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px", color: "var(--ishti-temple-maroon)" }}>
              Executed Deletion Sequence:
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {deletionResult.stagesCompleted.map((s, idx) => (
                <div key={s.stage} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px" }}>
                  <CheckCircle2 size={14} color="#15803D" style={{ marginTop: "2px", flexShrink: 0 }} aria-hidden="true" />
                  <span>
                    <strong>Stage {idx + 1} ({s.stage}):</strong> {s.description}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Disaster Recovery Rolling Backup Notice */}
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "6px",
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--border-card)",
              fontSize: "11px",
              color: "var(--ishti-warm-bronze)",
              lineHeight: 1.5,
              marginBottom: "14px",
            }}
          >
            <strong>Disaster Recovery Backup Disclosure:</strong> Active database records and encryption tags have been purged immediately. Encrypted disaster recovery snapshots are rolling backups overwritten automatically within 30 days and are never restored for operational access.
          </div>

          {/* Certificate SHA-256 Hash Box */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--border-card)",
              borderRadius: "8px",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              fontSize: "12px",
              fontFamily: "monospace",
            }}
          >
            <div>
              <span style={{ color: "var(--ishti-warm-bronze)" }}>Certificate Hash (SHA-256): </span>
              <strong>{deletionResult.certificate.certificateHashSha256}</strong>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(deletionResult.certificate.certificateHashSha256)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "none",
                border: "none",
                color: "var(--ishti-temple-maroon)",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "12px",
                flexShrink: 0,
              }}
            >
              {copiedHash === deletionResult.certificate.certificateHashSha256 ? (
                <span style={{ color: "#15803D" }}>Copied!</span>
              ) : (
                <>
                  <Copy size={13} aria-hidden="true" />
                  <span>Copy Proof</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Statutory Retention Schedule Matrix Table */}
      <div className="profileCard" style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <Scale size={20} color="var(--ishti-temple-maroon)" aria-hidden="true" />
          <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>
            Statutory Data Retention &amp; Lock Schedule Matrix
          </h3>
        </div>
        <p style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)", lineHeight: 1.5, marginBottom: "20px" }}>
          In accordance with statutory mandates across jurisdictions, certain records are subject to legal
          preservation requirements that supersede user erasure requests. Below is ISHTI&apos;s authoritative
          retention schedule.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
              textAlign: "left",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-card)", backgroundColor: "#FAF7F2" }}>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>Record Category</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>Statutory Citation</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>Retention Period</th>
                <th style={{ padding: "10px 12px", fontWeight: 600 }}>Statutory Lock</th>
              </tr>
            </thead>
            <tbody>
              {STATUTORY_RETENTION_RULES.map((rule) => (
                <tr key={rule.recordType} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "12px", verticalAlign: "top" }}>
                    <div style={{ fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>{rule.recordType}</div>
                    <div style={{ fontSize: "11px", color: "var(--ishti-warm-bronze)", marginTop: "2px" }}>
                      {rule.exceptionRationale}
                    </div>
                  </td>
                  <td style={{ padding: "12px", verticalAlign: "top", color: "var(--ishti-temple-charcoal)" }}>
                    <code>{rule.statutoryCitation}</code>
                  </td>
                  <td style={{ padding: "12px", verticalAlign: "top", color: "var(--ishti-temple-charcoal)" }}>
                    {rule.retentionYears > 0 ? `${rule.retentionYears} Years` : "0 (Immediate)"}
                  </td>
                  <td style={{ padding: "12px", verticalAlign: "top" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        backgroundColor: rule.isStatutory
                          ? "rgba(185, 28, 28, 0.08)"
                          : "rgba(21, 128, 61, 0.08)",
                        color: rule.isStatutory ? "#B91C1C" : "#15803D",
                      }}
                    >
                      {rule.isStatutory ? "LOCKED (LAW)" : "ERASABLE"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <Link
          href="/profile"
          className="btnExploreModule"
          style={{
            maxWidth: "200px",
            marginTop: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <ArrowLeft size={14} strokeWidth={1.8} aria-hidden="true" />
          <span>Back to Profile</span>
        </Link>
        <div style={{ display: "flex", gap: "16px", fontSize: "12px" }}>
          <Link href="/profile/consent" style={{ color: "var(--ishti-temple-maroon)", textDecoration: "underline" }}>
            Consent Management
          </Link>
          <span style={{ color: "var(--border-card)" }}>&bull;</span>
          <Link href="/legal/data-deletion" style={{ color: "var(--ishti-temple-maroon)", textDecoration: "underline" }}>
            Data Subject Rights &amp; Erasure Guide
          </Link>
          <span style={{ color: "var(--border-card)" }}>&bull;</span>
          <Link href="/legal/grievance" style={{ color: "var(--ishti-temple-maroon)", textDecoration: "underline" }}>
            Statutory Grievance Redressal
          </Link>
        </div>
      </div>
    </div>
  );
}
