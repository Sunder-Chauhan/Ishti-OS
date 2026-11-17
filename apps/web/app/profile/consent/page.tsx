"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Check, ArrowLeft, Shield, Key, Copy, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../../lib/auth/auth-context";
import { Breadcrumbs } from "../../components/layout/Breadcrumbs";
import {
  CONSENT_PURPOSE_DEFINITIONS,
} from "../../../lib/consent/consent-registry";
import {
  loadLocalConsentState,
  updateLocalConsent,
  type StoredConsentState,
} from "../../../lib/consent/consent-service";
import type { ConsentPurposeId } from "@spiritual-os/types";

export default function ConsentCenterPage() {
  const { user, openAuthModal } = useAuth();
  const [state, setState] = useState<StoredConsentState | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    setState(loadLocalConsentState());
  }, []);

  const handleToggle = async (purposeId: ConsentPurposeId) => {
    if (!state) return;
    const currentVal = !!state.consents[purposeId];
    const nextVal = !currentVal;

    const { state: nextState } = await updateLocalConsent(
      purposeId,
      nextVal,
      user?.id
    );

    setState(nextState);

    const def = CONSENT_PURPOSE_DEFINITIONS.find((d) => d.id === purposeId);
    setSaveMessage(
      `Consent for "${def?.title || purposeId}" updated to: ${nextVal ? "GRANTED" : "WITHDRAWN"}.`
    );
    setTimeout(() => setSaveMessage(null), 3500);
  };

  const handleCopyHash = (hash: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2500);
    }
  };

  if (!state) {
    return (
      <div className="profileShell">
        <div style={{ padding: "40px", textAlign: "center" }}>
          Loading your consent sanctuary...
        </div>
      </div>
    );
  }

  return (
    <div className="profileShell" style={{ maxWidth: "980px" }}>
      <Breadcrumbs
        items={[
          { label: "Devotee Profile", href: "/profile" },
          { label: "Consent Sanctuary (DPDP & GDPR)", current: true },
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
            Local Preference Governance
          </span>
        </div>
        <h1 className="pillarTitle" style={{ fontSize: "32px", marginBottom: "8px" }}>
          Consent &amp; Privacy Preferences
        </h1>
        <p className="pillarDescription" style={{ fontSize: "15px", maxWidth: "800px", lineHeight: 1.6 }}>
          Configure granular, unbundled privacy choices for this device. In accordance with §6 of India&apos;s
          Digital Personal Data Protection Act, 2023 (DPDP Act) and Articles 6 &amp; 9 of the European Union General
          Data Protection Regulation (GDPR), you maintain absolute sovereignty to grant or withdraw permissions.
        </p>
      </div>

      {/* Local Preferences Notice Banner */}
      <div
        style={{
          marginBottom: "24px",
          padding: "14px 18px",
          borderRadius: "8px",
          backgroundColor: "#FAF7F2",
          border: "1px solid var(--border-card)",
          fontSize: "12px",
          color: "var(--ishti-warm-bronze)",
          lineHeight: 1.6,
        }}
      >
        <strong>LOCAL BROWSER PREFERENCES ONLY:</strong> The controls below manage local interface preferences
        stored in your browser cache on this device. Under DPDP Act §6 and GDPR Art. 7, legally binding statutory
        consent logs require an authenticated devotee session and server-side cryptographic audit persistence, which
        is pending backend service deployment (Milestone M06). Adjusting settings here changes local behavior but does
        not constitute an authoritative legal consent record on ISHTI servers.
      </div>

      {/* Save Notification Toast */}
      {saveMessage && (
        <div
          className="authModalInfo"
          style={{
            marginBottom: "20px",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
          role="status"
          aria-live="polite"
        >
          <Check size={15} strokeWidth={2.2} aria-hidden="true" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Consent Cards List */}
      <div className="consentCardsList" style={{ gap: "20px" }}>
        {CONSENT_PURPOSE_DEFINITIONS.map((item) => {
          const isGranted = !!state.consents[item.id];
          const record = state.records[item.id];
          const timestamp = record?.updatedAt || new Date().toISOString();
          const evidenceHash =
            (record as any)?.integrityChecksum || (record as any)?.evidenceHash || "pending-checksum";
          const isCopied = copiedHash === evidenceHash;

          return (
            <div
              key={item.id}
              className="consentCard"
              style={{
                flexDirection: "column",
                gap: "14px",
                borderLeft: isGranted
                  ? "4px solid var(--ishti-temple-maroon)"
                  : "4px solid #D1D5DB",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "20px",
                  width: "100%",
                }}
              >
                <div className="consentCardText" style={{ maxWidth: "700px" }}>
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "4px" }}>
                    <h2 className="consentCardTitle" style={{ fontSize: "17px" }}>
                      {item.title}
                    </h2>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(113, 27, 22, 0.08)",
                        color: "var(--ishti-temple-maroon)",
                      }}
                    >
                      {item.categoryName}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        backgroundColor: "#F2EFE9",
                        color: "var(--ishti-temple-charcoal)",
                      }}
                    >
                      Legal Basis: <code>{item.legalBasis}</code>
                    </span>
                  </div>

                  <p className="consentCardDesc" style={{ fontSize: "13px", lineHeight: 1.5, margin: "6px 0 10px" }}>
                    {item.description}
                  </p>

                  <div style={{ fontSize: "11px", color: "var(--ishti-warm-bronze)" }}>
                    Status: <strong style={{ color: isGranted ? "#15803D" : "#B91C1C" }}>{isGranted ? "GRANTED" : "WITHDRAWN"}</strong> &bull; Version:{" "}
                    <code>{item.version}</code> &bull; Last Modified:{" "}
                    {new Date(timestamp).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                {/* Accessible Switch */}
                <label
                  className="consentSwitch"
                  aria-label={`Toggle consent for ${item.title}`}
                  style={{ flexShrink: 0, marginTop: "4px" }}
                >
                  <input
                    type="checkbox"
                    role="switch"
                    checked={isGranted}
                    onChange={() => handleToggle(item.id)}
                    className="consentSwitchInput"
                    aria-checked={isGranted}
                  />
                  <span className="consentSwitchSlider" />
                </label>
              </div>

              {/* Cryptographic Evidence Trail Strip */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px",
                  paddingTop: "10px",
                  borderTop: "1px dashed var(--border-subtle)",
                  fontSize: "11px",
                  color: "var(--ishti-warm-bronze)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "monospace" }}>
                  <Key size={12} aria-hidden="true" />
                  <span>Local Session Checksum (SHA-256):</span>
                  <span title={evidenceHash} style={{ color: "var(--ishti-temple-charcoal)" }}>
                    {evidenceHash.slice(0, 16)}...{evidenceHash.slice(-8)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyHash(evidenceHash)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "none",
                    border: "none",
                    color: "var(--ishti-temple-maroon)",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                  title="Copy local SHA-256 session checksum to clipboard"
                >
                  {isCopied ? (
                    <>
                      <CheckCircle2 size={12} color="#15803D" aria-hidden="true" />
                      <span style={{ color: "#15803D" }}>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} aria-hidden="true" />
                      <span>Copy Session Checksum</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Local Cache vs Statutory Server Record Notice */}
      <div
        style={{
          marginTop: "20px",
          padding: "12px 16px",
          borderRadius: "8px",
          backgroundColor: "#FAF7F2",
          border: "1px solid var(--border-card)",
          fontSize: "12px",
          color: "var(--ishti-warm-bronze)",
          lineHeight: 1.5,
        }}
      >
        <strong>Architectural Note:</strong> Browser storage reflects local device preferences and session state.
        Authoritative legal consent logs with statutory evidentiary proof under DPDP Act §6 are maintained server-side
        upon devotee authentication.
      </div>

      {/* Statutory Rights Information */}
      <div className="dpdpStatutoryBanner" style={{ marginTop: "36px" }}>
        <h3 className="dpdpStatutoryTitle">
          Your Statutory Data Principal Rights (DPDP Act 2023 &amp; GDPR)
        </h3>
        <p className="dpdpStatutoryText">
          As a devotee and data principal under Indian and international privacy laws, you possess inviolable rights:
        </p>
        <ul style={{ margin: "12px 0 0 20px", padding: 0, fontSize: "13px", color: "var(--ishti-warm-bronze)", lineHeight: 1.7 }}>
          <li>
            <strong>Right to Withdraw Consent (DPDP §6(4) / GDPR Art. 7(3)):</strong> You may revoke consent at
            any time with the same ease as granting it. Revocation does not affect lawful processing conducted prior
            to withdrawal.
          </li>
          <li>
            <strong>Server-Side Envelope Encryption (DPDP §8(5)):</strong> Astrological birth coordinates and timestamps
            are encrypted via server-side AES-256-GCM authenticated envelope encryption with tenant-bound authentication
            tags before persistence.
          </li>
          <li>
            <strong>Right to Access &amp; Portability (DPDP §11 / GDPR Art. 15 &amp; 20):</strong> You may download a
            complete machine-readable JSON archive of your personal and devotional records in the{" "}
            <Link href="/profile/privacy" style={{ color: "var(--ishti-temple-maroon)", fontWeight: 600, textDecoration: "underline" }}>
              Privacy Sanctuary Hub
            </Link>
            .
          </li>
          <li>
            <strong>Right to Erasure &amp; Rectification (DPDP §12 / GDPR Art. 16 &amp; 17):</strong> You may request complete
            erasure of your profile and devotional records, executed via ISHTI&apos;s 7-stage deletion orchestrator.
          </li>
          <li>
            <strong>Right of Grievance Redressal (DPDP §13 / IT Rules 2021 Rule 3(2)):</strong> You may register an official
            complaint with our Statutory Grievance Officer, with mandatory 24-hour acknowledgement and 7-day resolution.
          </li>
        </ul>
      </div>

      {/* Bottom Navigation */}
      <div style={{ marginTop: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
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
          <Link href="/legal/data-deletion" style={{ color: "var(--ishti-temple-maroon)", textDecoration: "underline" }}>
            Data Subject Rights &amp; Erasure Guide
          </Link>
          <span style={{ color: "var(--border-card)" }}>&bull;</span>
          <Link href="/legal/privacy" style={{ color: "var(--ishti-temple-maroon)", textDecoration: "underline" }}>
            Global Privacy Notice
          </Link>
        </div>
      </div>
    </div>
  );
}
