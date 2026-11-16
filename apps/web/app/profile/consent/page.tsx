"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Check, ArrowLeft } from "lucide-react";
import { useAuth } from "../../../lib/auth/auth-context";
import { Breadcrumbs } from "../../components/layout/Breadcrumbs";
import type { ConsentPurpose } from "@spiritual-os/types";

interface ConsentItem {
  purpose: ConsentPurpose;
  title: string;
  description: string;
  category: "Essential Sanctuary" | "Consultation" | "Communications" | "Service Quality";
  mandatory?: boolean;
}

const CONSENT_DEFINITIONS: ConsentItem[] = [
  {
    purpose: "kundli_astrology",
    title: "Astrological Chart Processing (Encrypted Kundli)",
    category: "Essential Sanctuary",
    description:
      "Authorizes ISHTI to process your date, exact time, and geographic coordinates of birth exclusively for calculating planetary ephemeris, divisional charts, and dasha periods. All birth details are protected under client-side AES-256-GCM envelope encryption with tenant-bound authentication tags.",
  },
  {
    purpose: "expert_consultation",
    title: "Pandit & Acharya Consultation Sharing",
    category: "Consultation",
    description:
      "Permits sharing your astrological birth chart and ritual intentions with accredited Pandits and Acharyas officiating your booked consultations. Access expires automatically after the session conclusion.",
  },
  {
    purpose: "marketing_updates",
    title: "Tithi, Muhurat & Festival Communications",
    category: "Communications",
    description:
      "Authorizes ISHTI to send serene, non-intrusive calendar reminders for upcoming Vedic festivals, ekadashi observances, and auspicious muhurta timings matching your geographical location.",
  },
  {
    purpose: "analytics",
    title: "Privacy-Preserving Telemetry & Reader Diagnostics",
    category: "Service Quality",
    description:
      "Enables aggregated, zero-PII performance metrics to optimize canonical scripture reader rendering speeds and astronomical ephemeris calculation latency.",
  },
];

const LOCAL_CONSENT_KEY = "ishti_dpdp_consents_v1";

export default function ConsentCenterPage() {
  const { user, openAuthModal } = useAuth();

  const [consents, setConsents] = useState<Record<ConsentPurpose, boolean>>({
    kundli_astrology: true,
    expert_consultation: true,
    marketing_updates: false,
    analytics: false,
  });

  const [lastUpdated, setLastUpdated] = useState<Record<ConsentPurpose, string>>({
    kundli_astrology: "2026-11-16T00:00:00Z",
    expert_consultation: "2026-11-16T00:00:00Z",
    marketing_updates: "2026-11-16T00:00:00Z",
    analytics: "2026-11-16T00:00:00Z",
  });

  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(LOCAL_CONSENT_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.consents) setConsents(parsed.consents);
          if (parsed.lastUpdated) setLastUpdated(parsed.lastUpdated);
        } catch {
          // Fallback to default
        }
      }
    }
  }, []);

  const handleToggle = (purpose: ConsentPurpose) => {
    const nextVal = !consents[purpose];
    const newConsents = { ...consents, [purpose]: nextVal };
    const newTimestamps = { ...lastUpdated, [purpose]: new Date().toISOString() };

    setConsents(newConsents);
    setLastUpdated(newTimestamps);

    if (typeof window !== "undefined") {
      localStorage.setItem(
        LOCAL_CONSENT_KEY,
        JSON.stringify({ consents: newConsents, lastUpdated: newTimestamps })
      );
    }

    setSaveMessage(
      `Consent for "${purpose.replace(/_/g, " ")}" updated to: ${nextVal ? "GRANTED" : "WITHDRAWN"}.`
    );
    setTimeout(() => setSaveMessage(null), 3000);
  };

  return (
    <div className="profileShell">
      <Breadcrumbs
        items={[
          { label: "Devotee Profile", href: "/profile" },
          { label: "DPDP Consent Center", current: true },
        ]}
      />

      <div style={{ marginBottom: "28px" }}>
        <h1 className="pillarTitle" style={{ fontSize: "32px", marginBottom: "8px" }}>
          DPDP Act 2023 Consent Center
        </h1>
        <p className="pillarDescription" style={{ fontSize: "15px", maxWidth: "780px" }}>
          In accordance with §6 of the Digital Personal Data Protection Act, 2023 (DPDP Act), ISHTI empowers devotees with granular, unbundled, and purpose-specific consent governance. You maintain absolute sovereignty to grant or withdraw consent at any time without penalty.
        </p>
      </div>

      {/* Guest Notice if not signed in */}
      {!user && (
        <div className="authModalSandboxBanner" style={{ marginBottom: "24px" }}>
          <span className="authSandboxBadge">GUEST NOTICE</span>
          <p className="authSandboxText">
            You are currently browsing as a guest. Consents adjusted below are saved in your local session. To bind your immutable consent log to your persistent devotee identity,{" "}
            <button
              type="button"
              onClick={() => openAuthModal({ message: "Sign in to synchronize your DPDP consent log." })}
              style={{ background: "none", border: "none", color: "var(--ishti-temple-maroon)", fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}
            >
              sign in with mobile
            </button>
            .
          </p>
        </div>
      )}

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
        >
          <Check size={15} strokeWidth={2.2} />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Consent Cards List */}
      <div className="consentCardsList">
        {CONSENT_DEFINITIONS.map((item) => {
          const isGranted = consents[item.purpose];
          const timestamp = lastUpdated[item.purpose];

          return (
            <div key={item.purpose} className="consentCard">
              <div className="consentCardText">
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <h2 className="consentCardTitle">{item.title}</h2>
                  <span className="consentPurposeTag">{item.purpose}</span>
                </div>
                <p className="consentCardDesc">{item.description}</p>
                <div style={{ fontSize: "11px", color: "var(--ishti-warm-bronze)", marginTop: "4px" }}>
                  Status: <strong>{isGranted ? "Granted" : "Withdrawn"}</strong> &bull; Version:{" "}
                  <code>v2026.1</code> &bull; Last Modified:{" "}
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
              <label className="consentSwitch" aria-label={`Toggle consent for ${item.title}`}>
                <input
                  type="checkbox"
                  role="switch"
                  checked={isGranted}
                  onChange={() => handleToggle(item.purpose)}
                  className="consentSwitchInput"
                  aria-checked={isGranted}
                />
                <span className="consentSwitchSlider" />
              </label>
            </div>
          );
        })}
      </div>

      {/* DPDP Act 2023 Statutory Rights Banner */}
      <div className="dpdpStatutoryBanner">
        <h3 className="dpdpStatutoryTitle">
          Your Statutory Rights under the Digital Personal Data Protection Act, 2023
        </h3>
        <p className="dpdpStatutoryText">
          As a Data Principal under Indian law, you are entitled to unambiguous statutory protections:
        </p>
        <ul style={{ margin: "12px 0 0 20px", padding: 0, fontSize: "13px", color: "var(--ishti-warm-bronze)", lineHeight: 1.7 }}>
          <li>
            <strong>Right to Withdraw Consent (§6(4)):</strong> You may withdraw consent at any time with the same ease as granting it. Withdrawing consent does not affect processing conducted prior to revocation.
          </li>
          <li>
            <strong>Right to Access Information (§11):</strong> You may request a summary of your personal data processed, identities of all data fiduciaries shared with, and relevant details.
          </li>
          <li>
            <strong>Right to Correction & Erasure (§12):</strong> You may correct inaccurate or misleading personal data or request total erasure of personal data that is no longer necessary.
          </li>
          <li>
            <strong>Right of Grievance Redressal (§13):</strong> You may submit complaints to ISHTI&apos;s designated Data Protection Officer with responses mandated within statutory timeframes.
          </li>
        </ul>
      </div>

      {/* Bottom Actions */}
      <div style={{ marginTop: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
          <ArrowLeft size={14} strokeWidth={1.8} />
          <span>Back to Profile</span>
        </Link>
        <span style={{ fontSize: "12px", color: "var(--ishti-warm-bronze)" }}>
          Legal Notice: DPDP Compliance Governance v1.0
        </span>
      </div>
    </div>
  );
}
