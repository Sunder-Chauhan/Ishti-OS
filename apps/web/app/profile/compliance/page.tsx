"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Lock,
  Database,
  Clock,
  ArrowLeft,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { Breadcrumbs } from "../../components/layout/Breadcrumbs";
import type { AuditLogEntry, SecurityIncidentTriage, IncidentSeverity } from "@spiritual-os/types";

export default function ComplianceOperationsPage() {
  const [serverAuthorized, setServerAuthorized] = useState<boolean | null>(null);
  const [serverAuthError, setServerAuthError] = useState<string>("");
  const [ledger, setLedger] = useState<AuditLogEntry[]>([]);
  const [isIntegrityValid, setIsIntegrityValid] = useState(true);

  // Triage simulator state
  const [severity, setSeverity] = useState<IncidentSeverity>("HIGH");
  const [personalDataExposed, setPersonalDataExposed] = useState(true);
  const [systemic, setSystemic] = useState(false);
  const [triageOutput, setTriageOutput] = useState<SecurityIncidentTriage | null>(null);
  const [isTriaging, setIsTriaging] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchComplianceData() {
      try {
        const res = await fetch("/api/compliance/audit");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setLedger(data.ledger || []);
            setIsIntegrityValid(Boolean(data.isValid));
            setServerAuthorized(true);
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          if (isMounted) {
            setServerAuthorized(false);
            setServerAuthError(
              errData.error ||
                (res.status === 401
                  ? "UNAUTHENTICATED: Administrative server session required."
                  : res.status === 403
                  ? "FORBIDDEN: Verified platform_admin role required in database."
                  : "BACKEND_AUTH_UNAVAILABLE: Server-side cryptographic session verification requires active Supabase Auth infrastructure (M06 dependency). Administrative access is disabled.")
            );
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setServerAuthorized(false);
          setServerAuthError("Network failure contacting server compliance endpoint.");
        }
      }
    }

    fetchComplianceData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSimulateTriage = async () => {
    setIsTriaging(true);
    try {
      const res = await fetch("/api/compliance/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentType: "UNAUTHORIZED_ACCESS_ATTEMPT",
          affectedSystems: ["auth_cluster", "kundli_encryption_vault"],
          severity,
          isPersonalDataExposed: personalDataExposed,
          isRansomwareOrSystemic: systemic,
          summary: "Simulated security triage assessment for operational readiness evaluation.",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTriageOutput(data.triage);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Triage request rejected by server: ${errData.error || res.statusText}`);
      }
    } catch {
      alert("Network failure contacting server triage endpoint.");
    } finally {
      setIsTriaging(false);
    }
  };

  if (serverAuthorized === null) {
    return (
      <div className="profileShell">
        <div style={{ padding: "40px", textAlign: "center", color: "var(--ishti-warm-bronze)" }}>
          Contacting server compliance endpoint and verifying administrative session...
        </div>
      </div>
    );
  }

  if (!serverAuthorized) {
    return (
      <div className="profileShell" style={{ maxWidth: "800px" }}>
        <Breadcrumbs
          items={[
            { label: "Devotee Profile", href: "/profile" },
            { label: "Compliance Operations", current: true },
          ]}
        />
        <div
          className="profileCard"
          style={{
            marginTop: "24px",
            border: "1px solid var(--border-card)",
            padding: "36px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              backgroundColor: "rgba(185, 28, 28, 0.1)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#B91C1C",
              marginBottom: "16px",
            }}
          >
            <ShieldAlert size={28} aria-hidden="true" />
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--ishti-temple-charcoal)", marginBottom: "8px" }}>
            Restricted Administrative Console
          </h1>
          <p style={{ fontSize: "14px", color: "var(--ishti-warm-bronze)", lineHeight: 1.6, maxWidth: "560px", margin: "0 auto 24px" }}>
            {serverAuthError ||
              "In accordance with Section 8 of the DPDP Act, 2023 and ISO/IEC 27001 Access Control (A.9) standards, the Compliance Operations & Audit Console is strictly restricted to designated Platform Administrators (role: 'platform_admin'). Access rejected by server authorization guard."}
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
            <Link
              href="/profile"
              className="btnExploreModule"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginTop: 0,
              }}
            >
              <ArrowLeft size={14} aria-hidden="true" />
              <span>Return to Devotee Profile</span>
            </Link>
            <Link
              href="/profile/consent"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid var(--border-card)",
                backgroundColor: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--ishti-temple-charcoal)",
              }}
            >
              <span>Consent Sanctuary</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profileShell" style={{ maxWidth: "1040px" }}>
      <Breadcrumbs
        items={[
          { label: "Devotee Profile", href: "/profile" },
          { label: "Compliance Operations & Security Governance", current: true },
        ]}
      />

      {/* Administrative Operations Disabled Notice */}
      <div
        style={{
          marginTop: "16px",
          marginBottom: "24px",
          padding: "12px 16px",
          borderRadius: "8px",
          backgroundColor: "#FAF7F2",
          border: "1px solid var(--border-card)",
          fontSize: "12px",
          color: "var(--ishti-warm-bronze)",
          lineHeight: 1.5,
        }}
      >
        <strong>Administrative Operations Restricted:</strong> Authoritative audit logging and live CERT-In incident
        reporting require server-side database infrastructure and KMS signing (M06). Client-side administrative write
        operations are disabled to maintain governance integrity. The view below is a read-only architecture demonstration.
      </div>

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
            Technical Governance &amp; Security Posture
          </span>
        </div>
        <h1 className="pillarTitle" style={{ fontSize: "32px", marginBottom: "8px" }}>
          Compliance Operations &amp; Audit Sanctuary
        </h1>
        <p className="pillarDescription" style={{ fontSize: "15px", maxWidth: "800px", lineHeight: 1.6 }}>
          Operational control centre monitoring ISHTI&apos;s technical safeguards, CERT-In statutory incident
          reporting timelines, DPDP §8(6) personal data breach readiness, and append-only cryptographic evidence
          audit ledgers.
        </p>
      </div>

      {/* Four Security Posture Highlights */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <div className="consentCard" style={{ flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--ishti-temple-maroon)" }}>
            <Lock size={16} aria-hidden="true" />
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>Envelope Cryptography</span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--ishti-warm-bronze)" }}>
            Server-side AES-256-GCM with tenant-bound authentication tags (AAD) for all astrological birth data.
          </div>
        </div>

        <div className="consentCard" style={{ flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--ishti-temple-maroon)" }}>
            <Database size={16} aria-hidden="true" />
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>Kernel Database RLS</span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--ishti-warm-bronze)" }}>
            PostgreSQL Row-Level Security with non-recursive security definer functions for zero-leakage multi-tenancy.
          </div>
        </div>

        <div className="consentCard" style={{ flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--ishti-temple-maroon)" }}>
            <Clock size={16} aria-hidden="true" />
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>CERT-In 6-Hour SLA</span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--ishti-warm-bronze)" }}>
            Mandatory 6-hour cybersecurity reporting readiness under April 2022 CERT-In directions (applicable to qualifying cybersecurity incidents).
          </div>
        </div>

        <div className="consentCard" style={{ flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--ishti-temple-maroon)" }}>
            <FileCheck size={16} aria-hidden="true" />
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>IT Rules 2026 SLAs</span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--ishti-warm-bronze)" }}>
            24-hour statutory acknowledgement and 7-day resolution SLAs with Grievance Appellate Committee recourse.
          </div>
        </div>
      </div>

      {/* Incident Triage Readiness Reference */}
      <div className="profileCard" style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <AlertTriangle size={20} color="var(--ishti-temple-maroon)" aria-hidden="true" />
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>
            Statutory Incident Notification Assessment (Reference Model)
          </h2>
        </div>
        <p style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)", lineHeight: 1.5, marginBottom: "16px" }}>
          Evaluates statutory notification thresholds under CERT-In (Cyber Emergency Response Team - India)
          directions and Section 8(6) of the Digital Personal Data Protection Act, 2023.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            alignItems: "start",
            backgroundColor: "#FAF7F2",
            border: "1px solid var(--border-card)",
            borderRadius: "10px",
            padding: "16px",
          }}
        >
          {/* Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label
                htmlFor="severitySelect"
                style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}
              >
                Incident Severity Classification:
              </label>
              <select
                id="severitySelect"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-card)",
                  fontSize: "12px",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <option value="LOW">LOW — Minor Probe / Routine Scan</option>
                <option value="MEDIUM">MEDIUM — Isolated Credential Stuffing Attempt</option>
                <option value="HIGH">HIGH — Critical Vault Probe / Database Degradation</option>
                <option value="CRITICAL">CRITICAL — Confirmed Unauthorized Database Penetration</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                id="personalDataCheckbox"
                checked={personalDataExposed}
                onChange={(e) => setPersonalDataExposed(e.target.checked)}
                style={{ width: "16px", height: "16px" }}
              />
              <label htmlFor="personalDataCheckbox" style={{ fontSize: "12px" }}>
                Personal or spiritual data impacted (Triggers DPDP §8(6))
              </label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                id="systemicCheckbox"
                checked={systemic}
                onChange={(e) => setSystemic(e.target.checked)}
                style={{ width: "16px", height: "16px" }}
              />
              <label htmlFor="systemicCheckbox" style={{ fontSize: "12px" }}>
                Ransomware or systemic attack on platform infrastructure
              </label>
            </div>

            <button
              type="button"
              onClick={handleSimulateTriage}
              className="btnExploreModule"
              style={{
                marginTop: "4px",
                padding: "8px 14px",
                fontSize: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <RefreshCw size={13} aria-hidden="true" />
              <span>Compute Statutory Notification Deadlines</span>
            </button>
          </div>

          {/* Assessment Output */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--border-card)",
              borderRadius: "8px",
              padding: "14px",
              fontSize: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--ishti-temple-maroon)" }}>
              Regulatory Threshold Output:
            </div>
            {triageOutput ? (
              <>
                <div>
                  <strong>CERT-In 6-Hour Reporting Required:</strong>{" "}
                  <span style={{ color: triageOutput.certInNotificationRequired ? "#B91C1C" : "#15803D", fontWeight: 700 }}>
                    {triageOutput.certInNotificationRequired ? "YES (MANDATORY 6-HOUR WINDOW)" : "NO (Standard Operational Triage)"}
                  </span>
                </div>
                <div>
                  <strong>DPDP Act §8(6) Board Intimation:</strong>{" "}
                  <span style={{ color: triageOutput.dpdpBreachNoticeRequired ? "#B91C1C" : "#15803D", fontWeight: 700 }}>
                    {triageOutput.dpdpBreachNoticeRequired ? "YES (MANDATORY DATA PRINCIPAL & BOARD NOTICE)" : "NO"}
                  </span>
                </div>
                <div>
                  <strong>Statutory Containment Deadline:</strong>{" "}
                  <code>{new Date(triageOutput.containmentDeadline).toLocaleTimeString()}</code>
                </div>
              </>
            ) : (
              <div style={{ color: "var(--ishti-warm-bronze)" }}>
                Click &quot;Compute Statutory Notification Deadlines&quot; to evaluate reporting requirements.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Evidence Audit Ledger Demonstration */}
      <div className="profileCard" style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>
              Cryptographic Hash Chain Demonstration (Client-Side)
            </h2>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  backgroundColor: isIntegrityValid ? "rgba(21, 128, 61, 0.1)" : "rgba(185, 28, 28, 0.1)",
                  color: isIntegrityValid ? "#15803D" : "#B91C1C",
                }}
              >
                {isIntegrityValid ? "HASH CHAIN VALIDATED" : "INTEGRITY TAMPERING DETECTED"}
              </span>
              <span style={{ fontSize: "11px", color: "var(--ishti-warm-bronze)" }}>
                &bull; Verified Blocks: {ledger.length}
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              backgroundColor: "rgba(113, 27, 22, 0.06)",
              fontSize: "11px",
              color: "var(--ishti-warm-bronze)",
            }}
          >
            Append Operations: Requires M06 Server Audit Service
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-card)", backgroundColor: "#FAF7F2" }}>
                <th style={{ padding: "8px 10px", fontWeight: 600 }}>Block #</th>
                <th style={{ padding: "8px 10px", fontWeight: 600 }}>Timestamp</th>
                <th style={{ padding: "8px 10px", fontWeight: 600 }}>Event Type</th>
                <th style={{ padding: "8px 10px", fontWeight: 600 }}>Actor</th>
                <th style={{ padding: "8px 10px", fontWeight: 600 }}>Previous Hash</th>
                <th style={{ padding: "8px 10px", fontWeight: 600 }}>Block Hash (SHA-256)</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((entry) => (
                <tr key={entry.index} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "10px", fontFamily: "monospace", fontWeight: 700 }}>
                    #{entry.index}
                  </td>
                  <td style={{ padding: "10px", color: "var(--ishti-warm-bronze)" }}>
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: "10px", fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>
                    {entry.eventType}
                  </td>
                  <td style={{ padding: "10px", color: "var(--ishti-warm-bronze)" }}>
                    {entry.actor}
                  </td>
                  <td style={{ padding: "10px", fontFamily: "monospace", fontSize: "11px" }}>
                    {entry.previousHash.slice(0, 8)}...{entry.previousHash.slice(-6)}
                  </td>
                  <td style={{ padding: "10px", fontFamily: "monospace", fontSize: "11px", color: "var(--ishti-temple-maroon)" }}>
                    {entry.entryHash.slice(0, 10)}...{entry.entryHash.slice(-8)}
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
          <Link href="/legal/security" style={{ color: "var(--ishti-temple-maroon)", textDecoration: "underline" }}>
            Security Architecture &amp; CVD Safe Harbor
          </Link>
          <span style={{ color: "var(--border-card)" }}>&bull;</span>
          <Link href="/legal/grievance" style={{ color: "var(--ishti-temple-maroon)", textDecoration: "underline" }}>
            Statutory Grievance Portal
          </Link>
          <span style={{ color: "var(--border-card)" }}>&bull;</span>
          <Link href="/profile/privacy" style={{ color: "var(--ishti-temple-maroon)", textDecoration: "underline" }}>
            Privacy Sanctuary Hub
          </Link>
        </div>
      </div>
    </div>
  );
}
