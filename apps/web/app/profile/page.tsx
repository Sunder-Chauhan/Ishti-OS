"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "../../lib/auth/auth-context";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";

export default function ProfilePage() {
  const { user, openAuthModal, signOut } = useAuth();

  if (!user) {
    return (
      <div className="profileShell">
        <Breadcrumbs items={[{ label: "Devotee Profile", current: true }]} />

        <div className="profileCard" style={{ textAlign: "center", padding: "64px 32px" }}>
          <div className="profileAvatar" style={{ margin: "0 auto 20px" }}>
            🕉️
          </div>
          <h1 className="profileName" style={{ fontSize: "32px", marginBottom: "12px" }}>
            Devotee Sanctuary Profile
          </h1>
          <p
            className="profileFieldValue"
            style={{ maxWidth: "540px", margin: "0 auto 28px", color: "var(--ishti-warm-bronze)" }}
          >
            Public browsing for scriptures, panchang, and pandit directories is open to all devotees without registration. To save encrypted Kundli charts, book consultations, and manage DPDP consent preferences, please sign in.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => openAuthModal({ message: "Sign in to access your personal sanctuary profile." })}
              className="btnAuthPrimary"
              style={{ maxWidth: "260px" }}
            >
              Sign In with Mobile
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
          <div className="profileAvatar">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
            ) : (
              <span>🕉️</span>
            )}
          </div>
          <div className="profileMeta">
            <h1 className="profileName">{user.full_name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="userRoleBadge">{user.role}</span>
              {user.is_verified ? (
                <span style={{ fontSize: "12px", color: "var(--ishti-success)", fontWeight: 600 }}>
                  ✓ Identity Verified
                </span>
              ) : (
                <span style={{ fontSize: "12px", color: "var(--ishti-warning)", fontWeight: 600 }}>
                  ○ Community Devotee
                </span>
              )}
            </div>
            <span style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)" }}>
              Devotee ID: <code>{user.id}</code>
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
          <div style={{ fontSize: "28px", marginBottom: "12px" }}>🛡️</div>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ishti-temple-charcoal)", marginBottom: "8px" }}>
            DPDP Act 2023 Consent Center
          </h2>
          <p style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)", lineHeight: 1.5, marginBottom: "18px" }}>
            Inspect, toggle, or withdraw purpose-specific consents for encrypted Kundli processing and expert sharing.
          </p>
          <Link href="/profile/consent" className="btnExploreModule" style={{ marginTop: 0 }}>
            <span>Manage Consent Preferences</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Encrypted Kundli */}
        <div className="profileCard" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: "28px", marginBottom: "12px" }}>✨</div>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ishti-temple-charcoal)", marginBottom: "8px" }}>
            Encrypted Kundli Sanctuary
          </h2>
          <p style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)", lineHeight: 1.5, marginBottom: "18px" }}>
            View your birth charts protected under client-side AES-256-GCM envelope encryption.
          </p>
          <Link href="/astro" className="btnExploreModule" style={{ marginTop: 0 }}>
            <span>Open ISHTI Astro</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Ritual Bookings */}
        <div className="profileCard" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: "28px", marginBottom: "12px" }}>🪔</div>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ishti-temple-charcoal)", marginBottom: "8px" }}>
            Vetted Pandits & Consultations
          </h2>
          <p style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)", lineHeight: 1.5, marginBottom: "18px" }}>
            Explore accredited Vedic pandits and manage upcoming ritual consultations.
          </p>
          <Link href="/experts" className="btnExploreModule" style={{ marginTop: 0 }}>
            <span>Find an Acharya</span>
            <span aria-hidden="true">→</span>
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
          Sign Out of ISHTI
        </button>
      </div>
    </div>
  );
}
