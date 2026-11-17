"use client";

import React from "react";
import Link from "next/link";
import {
  UserRound,
  Check,
  ShieldCheck,
  Orbit,
  UsersRound,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../lib/auth/auth-context";
import { formatDevoteePublicReference } from "../../lib/environment/presentation-layer";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { useI18n } from "../../lib/i18n/context";

export default function ProfilePage() {
  const { user, openAuthModal, signOut } = useAuth();
  const { dict } = useI18n();
  const pr = dict.profile;

  if (!user) {
    return (
      <div className="profileShell">
        <Breadcrumbs items={[{ label: "Devotee Profile", current: true }]} />

        <div className="profileCard" style={{ textAlign: "center", padding: "64px 32px" }}>
          <div
            className="profileAvatar"
            style={{
              margin: "0 auto 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ishti-temple-maroon)",
            }}
          >
            <UserRound size={36} strokeWidth={1.8} />
          </div>
          <h1 className="profileName" style={{ fontSize: "32px", marginBottom: "12px" }}>
            {pr.title}
          </h1>
          <p
            className="profileFieldValue"
            style={{ maxWidth: "540px", margin: "0 auto 28px", color: "var(--ishti-warm-bronze)" }}
          >
            {pr.guestNotice}
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => openAuthModal({ message: pr.signInPrompt })}
              className="btnAuthPrimary"
              style={{ maxWidth: "260px" }}
            >
              {pr.signInPrompt}
            </button>
            <Link
              href="/bhakti"
              className="signInButton"
              style={{ padding: "12px 20px" }}
            >
              Continue Guest Browsing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profileShell">
      <Breadcrumbs items={[{ label: "Devotee Profile", current: true }]} />

      {/* Main Profile Card */}
      <div className="profileCard">
        <div className="profileHeaderRow">
          <div
            className="profileAvatar"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ishti-temple-maroon)",
            }}
          >
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
            ) : (
              <UserRound size={36} strokeWidth={1.8} />
            )}
          </div>
          <div className="profileMeta">
            <h1 className="profileName">{user.full_name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="userRoleBadge">{user.role}</span>
              {user.is_verified ? (
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--ishti-success)",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Check size={13} strokeWidth={2.2} />
                  <span>Identity Verified</span>
                </span>
              ) : (
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--ishti-warning)",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--ishti-warning)" }} />
                  <span>Community Devotee</span>
                </span>
              )}
            </div>
            <span style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)" }}>
              Membership Reference: <code>{formatDevoteePublicReference(user.id)}</code>
            </span>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="profileGrid">
          <div className="profileField">
            <span className="profileFieldLabel">Mobile Phone</span>
            <span className="profileFieldValue">{user.phone || "Not specified"}</span>
          </div>
          <div className="profileField">
            <span className="profileFieldLabel">Language Preference</span>
            <span className="profileFieldValue">
              {user.language_preference === "en" ? "English" : user.language_preference}
            </span>
          </div>
          <div className="profileField">
            <span className="profileFieldLabel">Sampradaya Tradition</span>
            <span className="profileFieldValue">
              {user.sampradaya_tradition || "Sanatana Dharma (General)"}
            </span>
          </div>
          <div className="profileField">
            <span className="profileFieldLabel">Account Created</span>
            <span className="profileFieldValue">
              {new Date(user.created_at).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "32px" }}>
        {/* DPDP Consent Center */}
        <div className="profileCard" style={{ marginBottom: 0 }}>
          <div style={{ marginBottom: "14px", color: "var(--ishti-temple-maroon)" }}>
            <ShieldCheck size={28} strokeWidth={1.8} />
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ishti-temple-charcoal)", marginBottom: "8px" }}>
            DPDP Act 2023 Consent Center
          </h2>
          <p style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)", lineHeight: 1.5, marginBottom: "18px" }}>
            Inspect, toggle, or withdraw purpose-specific consents for encrypted Kundli processing and expert sharing.
          </p>
          <Link href="/profile/consent" className="btnExploreModule" style={{ marginTop: 0 }}>
            <span>Manage Consent Preferences</span>
            <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </div>

        {/* Encrypted Kundli */}
        <div className="profileCard" style={{ marginBottom: 0 }}>
          <div style={{ marginBottom: "14px", color: "var(--ishti-temple-maroon)" }}>
            <Orbit size={28} strokeWidth={1.8} />
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ishti-temple-charcoal)", marginBottom: "8px" }}>
            Encrypted Kundli Sanctuary
          </h2>
          <p style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)", lineHeight: 1.5, marginBottom: "18px" }}>
            View your personal astrological birth charts protected under devotee privacy safeguards.
          </p>
          <Link href="/astro" className="btnExploreModule" style={{ marginTop: 0 }}>
            <span>Open ISHTI Astro</span>
            <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </div>

        {/* Ritual Bookings */}
        <div className="profileCard" style={{ marginBottom: 0 }}>
          <div style={{ marginBottom: "14px", color: "var(--ishti-temple-maroon)" }}>
            <UsersRound size={28} strokeWidth={1.8} />
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ishti-temple-charcoal)", marginBottom: "8px" }}>
            Vetted Pandits &amp; Consultations
          </h2>
          <p style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)", lineHeight: 1.5, marginBottom: "18px" }}>
            Explore accredited Vedic pandits and manage upcoming ritual consultations.
          </p>
          <Link href="/experts" className="btnExploreModule" style={{ marginTop: 0 }}>
            <span>Find an Acharya</span>
            <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </div>

        {/* Privacy Rights & Data Erasure */}
        <div className="profileCard" style={{ marginBottom: 0 }}>
          <div style={{ marginBottom: "14px", color: "var(--ishti-temple-maroon)" }}>
            <ShieldCheck size={28} strokeWidth={1.8} />
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ishti-temple-charcoal)", marginBottom: "8px" }}>
            Privacy Rights &amp; Data Sanctuary
          </h2>
          <p style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)", lineHeight: 1.5, marginBottom: "18px" }}>
            Export a full JSON archive (SAR) or execute 7-stage account erasure under DPDP §11–§12 and GDPR Art. 17.
          </p>
          <Link href="/profile/privacy" className="btnExploreModule" style={{ marginTop: 0 }}>
            <span>Privacy &amp; Deletion Hub</span>
            <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </div>

        {/* Commerce Trust & Refunds */}
        <div className="profileCard" style={{ marginBottom: 0 }}>
          <div style={{ marginBottom: "14px", color: "var(--ishti-temple-maroon)" }}>
            <ShieldCheck size={28} strokeWidth={1.8} />
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ishti-temple-charcoal)", marginBottom: "8px" }}>
            Refunds &amp; Cancellations
          </h2>
          <p style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)", lineHeight: 1.5, marginBottom: "18px" }}>
            Calculate booking refund eligibility, view cutoff tiers, and submit cancellation requests.
          </p>
          <Link href="/profile/refunds" className="btnExploreModule" style={{ marginTop: 0 }}>
            <span>Refund &amp; Cancellation Hub</span>
            <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </div>

        {/* Technical Governance & Compliance Audit */}
        <div className="profileCard" style={{ marginBottom: 0 }}>
          <div style={{ marginBottom: "14px", color: "var(--ishti-temple-maroon)" }}>
            <ShieldCheck size={28} strokeWidth={1.8} />
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ishti-temple-charcoal)", marginBottom: "8px" }}>
            Compliance &amp; Security Ledger
          </h2>
          <p style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)", lineHeight: 1.5, marginBottom: "18px" }}>
            Inspect technical safeguards, CERT-In incident reporting SLAs, and immutable audit ledgers.
          </p>
          <Link href="/profile/compliance" className="btnExploreModule" style={{ marginTop: 0 }}>
            <span>Operations &amp; Audit Centre</span>
            <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Sign Out Action */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={() => signOut()}
          className="signInButton"
          style={{ borderColor: "var(--ishti-error)", color: "var(--ishti-error)" }}
        >
          {pr.signOut}
        </button>
      </div>
    </div>
  );
}
