"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { PillarShell } from "../components/layout/PillarShell";
import { useAuth } from "../../lib/auth/auth-context";
import { useI18n } from "../../lib/i18n/context";

interface PujaGuide {
  id: string;
  name: string;
  devanagari: string;
  tradition: string;
  duration: string;
  description: string;
  samagriCount: number;
}

const FEATURED_PUJAS: PujaGuide[] = [
  {
    id: "sandhyavandanam",
    name: "Nitya Sandhyavandanam",
    devanagari: "नित्य सन्ध्यावन्दनम्",
    tradition: "Universal Vedic (Rig, Sama, Yajur)",
    duration: "20 mins",
    description: "Daily dawn, noon, and dusk sacred meditation honoring the Sun as the supreme light of consciousness.",
    samagriCount: 5,
  },
  {
    id: "shiva-abhishekam",
    name: "Shiva Rudrabhishekam",
    devanagari: "शिव रुद्राभिषेकम्",
    tradition: "Shaiva & Vedic Tradition",
    duration: "45 mins",
    description: "Ceremonial bathing of the Shiva Lingam accompanied by Sri Rudram chanting from the Krishna Yajurveda.",
    samagriCount: 11,
  },
  {
    id: "satyanarayan",
    name: "Sri Satyanarayan Vrat Puja",
    devanagari: "श्री सत्यनारायण व्रत पूजा",
    tradition: "Vaishnava Tradition (Reva Khanda)",
    duration: "90 mins",
    description: "Thanksgiving householder ritual performed on Purnima or family milestones to cultivate divine truth.",
    samagriCount: 16,
  },
  {
    id: "navagraha-shanti",
    name: "Navagraha Shanti Havan",
    devanagari: "नवग्रह शान्ति हवन",
    tradition: "Vedic Ritual Tradition",
    duration: "60 mins",
    description: "Harmonizing planetary influences through fire offerings to the nine celestial luminaries.",
    samagriCount: 18,
  },
];

export default function PujaPage() {
  const { openAuthModal } = useAuth();
  const { dict } = useI18n();
  const pu = dict.puja;
  const [selectedPuja, setSelectedPuja] = useState<PujaGuide>(FEATURED_PUJAS[0]);

  return (
    <PillarShell
      pillarKey="puja"
      title={pu.title}
      sanskritTagline={pu.tagline}
      description={pu.description}
      breadcrumbs={[{ label: pu.title, current: true }]}
      actionSlot={
        <Link href="/experts" className="signInButton" style={{ padding: "8px 16px" }}>
          {pu.bookAcharya}
        </Link>
      }
    >
      {/* Interactive Ritual Selection & Detail View */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "28px" }}>
        {/* Left: Featured Puja Catalog */}
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--ishti-temple-charcoal)", marginBottom: "16px" }}>
            {pu.canonicalGuides}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {FEATURED_PUJAS.map((puja) => {
              const isSelected = selectedPuja.id === puja.id;
              return (
                <div
                  key={puja.id}
                  onClick={() => setSelectedPuja(puja)}
                  style={{
                    backgroundColor: isSelected ? "var(--ishti-ivory-paper-warm)" : "#FFFFFF",
                    border: `1px solid ${isSelected ? "var(--ishti-vedic-saffron)" : "var(--border-card)"}`,
                    borderRadius: "var(--border-radius-md)",
                    padding: "16px 20px",
                    cursor: "pointer",
                    transition: "all 160ms ease",
                    boxShadow: isSelected ? "var(--shadow-sm)" : "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <h3 style={{ fontSize: "17px", fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>
                      {puja.name}
                    </h3>
                    <span style={{ fontSize: "12px", color: "var(--ishti-warm-bronze)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={13} strokeWidth={1.8} />
                      <span>{puja.duration}</span>
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", fontFamily: "var(--font-devanagari)", color: "var(--ishti-vedic-saffron)", fontWeight: 600, marginBottom: "6px" }}>
                    {puja.devanagari}
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)", lineHeight: 1.5 }}>
                    {puja.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Puja Overview & Samagri Checklist Shell */}
        <div>
          <div className="profileCard" style={{ marginBottom: "20px" }}>
            <span className="userRoleBadge" style={{ marginBottom: "8px", display: "inline-block" }}>
              {selectedPuja.tradition}
            </span>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "24px", color: "var(--ishti-temple-maroon)", marginBottom: "8px" }}>
              {selectedPuja.name}
            </h3>
            <p style={{ fontSize: "14px", color: "var(--ishti-warm-bronze)", lineHeight: 1.6, marginBottom: "20px" }}>
              {selectedPuja.description}
            </p>

            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "16px", marginBottom: "16px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ishti-temple-charcoal)", marginBottom: "10px" }}>
                Samagri & Prerequisites ({selectedPuja.samagriCount} Items)
              </h4>
              <ul style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)", lineHeight: 1.8, paddingLeft: "18px", margin: 0 }}>
                <li>Ganga Jal / Pure water vessel (Kamandalu or Panchapatra)</li>
                <li>Pure cow ghee and hand-rolled cotton wicks (Dipa)</li>
                <li>Akshata (Unbroken raw rice grains smeared with turmeric)</li>
                <li>Chandan (Sandalwood paste) and Roli / Kumkum</li>
                <li>Fresh seasonal flowers and Bilva / Tulsi leaves</li>
              </ul>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => openAuthModal({ message: "Sign in to save this puja to your personal ritual schedule." })}
                className="btnAuthPrimary"
                style={{ flex: 1, minWidth: "180px", padding: "10px 16px" }}
              >
                Start Ritual Guide
              </button>
              <Link
                href="/experts"
                className="signInButton"
                style={{ padding: "10px 16px" }}
              >
                Request Pandit Consultation
              </Link>
            </div>
          </div>

          {/* Shastric Authenticity Notice */}
          <div style={{ padding: "16px", backgroundColor: "var(--ishti-ivory-paper-warm)", borderRadius: "var(--border-radius-md)", border: "1px solid var(--border-card)" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ishti-temple-maroon)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Shastric Integrity Guarantee
            </span>
            <p style={{ fontSize: "12px", color: "var(--ishti-warm-bronze)", lineHeight: 1.5, marginTop: "4px" }}>
              All ISHTI puja vidhis are cross-referenced with accredited Grihya Sutras, Agama texts, and verified by vetted traditional Pandits. Zero artificial fear claims.
            </p>
          </div>
        </div>
      </div>
    </PillarShell>
  );
}
