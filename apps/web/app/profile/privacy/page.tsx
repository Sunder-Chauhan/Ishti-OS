"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Download,
  Trash2,
  FileText,
  AlertTriangle,
  ArrowLeft,
  Copy,
  Scale,
  Clock,
} from "lucide-react";
import { useAuth } from "../../../lib/auth/auth-context";
import { Breadcrumbs } from "../../components/layout/Breadcrumbs";
import { STATUTORY_RETENTION_RULES } from "../../../lib/privacy/retention-matrix";
import { generateSARDataPackage, type SARPackagePreview } from "../../../lib/privacy/export-service";
import { executeSevenStageDeletion, type DeletionPlanResult } from "../../../lib/privacy/deletion-orchestrator";

export default function PrivacyRightsPage() {
  const { user, openAuthModal } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [exportPackage, setExportPackage] = useState<SARPackagePreview | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionPlan, setDeletionPlan] = useState<DeletionPlanResult | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleExport = async () => {
    if (!user) {
      openAuthModal({ message: "Sign in with your mobile number to preview the SAR export schema." });
      return;
    }
    setIsExporting(true);
    try {
      const data = await generateSARDataPackage({
        userId: user.id,
        fullName: user.full_name,
        phone: user.phone,
        email: user.email,
        languagePreference: user.language_preference,
      });
      setExportPackage(data);

      // Download file in browser as schema preview
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ishti-sar-schema-preview-${data.metadata.previewId}.json`;
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
      openAuthModal({ message: "Sign in with your mobile number to review the erasure specification." });
      return;
    }
    setIsDeleting(true);
    try {
      const result = await executeSevenStageDeletion(user.id);
      setDeletionPlan(result);
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
          { label: "Privacy Rights Architecture", current: true },
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
            Statutory Data Subject Rights Architecture
          </span>
        </div>
        <h1 className="pillarTitle" style={{ fontSize: "32px", marginBottom: "8px" }}>
          Privacy Rights &amp; Erasure Sanctuary (Prototype)
        </h1>
        <p className="pillarDescription" style={{ fontSize: "15px", maxWidth: "800px", lineHeight: 1.6 }}>
          Under §11 (Right to Access), §12 (Right to Erasure), and §13 (Grievance Redressal) of India&apos;s
          Digital Personal Data Protection Act, 2023, and GDPR Articles 15–20, ISHTI is architected for absolute
          data principal sovereignty. The controls below illustrate the technical data contracts and workflow
          specifications pending M06 backend pipeline integration.
        </p>
      </div>

      {/* Guest Notice */}
      {!user && (
        <div className="authModalSandboxBanner" style={{ marginBottom: "24px" }}>
          <span className="authSandboxBadge">AUTHENTICATION REQUIRED</span>
          <p className="authSandboxText">
            Data Subject Access Request previews and erasure specifications require an authenticated devotee session
            to verify identity under DPDP §11–12 and GDPR Art. 15–17.{" "}
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
        {/* Action 1: Export Personal Data (SAR Schema Preview) */}
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
                SAR Data Package (Schema Preview)
              </h2>
            </div>
            <p style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)", lineHeight: 1.5, marginBottom: "16px" }}>
              Preview the machine-readable JSON structure defining devotee profile, active consent records, and
              encrypted astrological metadata. Live personal data extraction requires M06 backend pipeline deployment.
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
                <div>Preview ID: {exportPackage.metadata.previewId}</div>
                <div>Status: {exportPackage.metadata.fulfillmentStatus}</div>
                <div>Fingerprint: {exportPackage.metadata.templateFingerprintSha256.slice(0, 16)}...</div>
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
                  ? "Generating Schema Preview..."
                  : "Preview SAR Data Package Schema"
                : "Sign In to Preview SAR Package"}
            </span>
          </button>
        </div>

        {/* Action 2: 7-Stage Account Erasure Specification */}
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
                7-Stage Erasure Specification (Prototype)
              </h2>
            </div>
            <p style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)", lineHeight: 1.5, marginBottom: "16px" }}>
              Review the architectural execution plan for purging active astrological Kundli records, sacred Sankalpa
              intentions, and pseudonymizing financial records under statutory retention rules.
            </p>
          </div>

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => (user ? setShowDeleteConfirm(true) : openAuthModal({ message: "Sign in to review erasure specification." }))}
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
              <span>{user ? "Review 7-Stage Erasure Plan" : "Sign In to Review Erasure Plan"}</span>
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
                <span style={{ fontSize: "13px", fontWeight: 700 }}>Review Erasure Workflow Plan?</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--ishti-temple-charcoal)", lineHeight: 1.4, marginBottom: "12px" }}>
                This will evaluate the 7-stage deletion sequence. Note: In this prototype milestone, stages will be
                marked NOT_IMPLEMENTED; no database records will be altered until M06 transactional workers are deployed.
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
                  {isDeleting ? "Evaluating..." : "Generate Erasure Plan"}
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

      {/* Deletion Plan Output (When Executed) */}
      {deletionPlan && (
        <div
          className="profileCard"
          style={{
            backgroundColor: "#FAF7F2",
            border: "1px solid var(--ishti-temple-maroon)",
            marginBottom: "36px",
          }}
          role="region"
          aria-label="Erasure workflow plan"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <FileText size={24} color="var(--ishti-temple-maroon)" aria-hidden="true" />
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>
                7-Stage Erasure Specification Plan
              </h3>
              <span style={{ fontSize: "11px", color: "var(--ishti-warm-bronze)" }}>
                Plan ID: <code>{deletionPlan.planId}</code> &bull; Overall Status:{" "}
                <strong style={{ color: "#B91C1C" }}>{deletionPlan.overallStatus}</strong>
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "10px 14px",
              borderRadius: "6px",
              backgroundColor: "rgba(185, 28, 28, 0.08)",
              border: "1px solid rgba(185, 28, 28, 0.2)",
              fontSize: "12px",
              color: "#B91C1C",
              lineHeight: 1.5,
              marginBottom: "16px",
            }}
          >
            <strong>PROTOTYPE GOVERNANCE NOTICE:</strong> {deletionPlan.disclaimer}
          </div>

          {/* 7 Stages Plan List */}
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px", color: "var(--ishti-temple-maroon)" }}>
              Architectural Sequence Stages:
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {deletionPlan.stages.map((s, idx) => (
                <div
                  key={s.stage}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid var(--border-card)",
                    fontSize: "12px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--ishti-temple-charcoal)" }}>
                      Stage {idx + 1}: {s.name} ({s.stage})
                    </div>
                    <div style={{ color: "var(--ishti-warm-bronze)", marginTop: "2px" }}>{s.description}</div>
                    <div style={{ fontSize: "11px", color: "var(--ishti-temple-maroon)", marginTop: "4px" }}>
                      Target: {s.targetRecords.join(", ")}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "4px",
                      backgroundColor: "rgba(185, 28, 28, 0.08)",
                      color: "#B91C1C",
                      flexShrink: 0,
                    }}
                  >
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Plan Fingerprint Box */}
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
              <span style={{ color: "var(--ishti-warm-bronze)" }}>Plan Specification Fingerprint: </span>
              <strong>{deletionPlan.planFingerprintSha256}</strong>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(deletionPlan.planFingerprintSha256)}
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
              {copiedHash === deletionPlan.planFingerprintSha256 ? (
                <span style={{ color: "#15803D" }}>Copied!</span>
              ) : (
                <>
                  <Copy size={13} aria-hidden="true" />
                  <span>Copy Fingerprint</span>
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
          preservation requirements that supersede user erasure requests. Below is ISHTI&apos;s retention schedule
          specification pending legal counsel sign-off.
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
                    {rule.retentionYears > 0 ? `${rule.retentionYears} Years` : "0 (Immediate upon request)"}
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
            Consent Preferences
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
