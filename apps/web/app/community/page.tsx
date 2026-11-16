"use client";

import React from "react";
import { PillarShell } from "../components/layout/PillarShell";
import { useAuth } from "../../lib/auth/auth-context";

interface SatsangCircle {
  id: string;
  name: string;
  devanagari: string;
  topic: string;
  cadence: string;
  membersCount: number;
  moderator: string;
}

const CIRCLES: SatsangCircle[] = [
  {
    id: "gita-vichara",
    name: "Bhagavad Gita Adhyayana Mandali",
    devanagari: "श्रीमद्भगवद्गीता अध्ययन मण्डली",
    topic: "Chapter-by-chapter study through Shankara & Ramanuja bhashyas",
    cadence: "Weekly (Every Sunday 08:00 IST)",
    membersCount: 420,
    moderator: "Dr. Gayatri Devi Shastri",
  },
  {
    id: "vedic-chanting",
    name: "Vedic Chanting & Swara Practice",
    devanagari: "वेद मन्त्रोच्चारण एवं स्वर अभ्यास",
    topic: "Udatta, Anudatta, and Svarita accents in Rigveda & Suktas",
    cadence: "Bi-weekly (Tuesday & Thursday dusk)",
    membersCount: 290,
    moderator: "Acharya Venkatesha Dikshitar",
  },
  {
    id: "annadanam-seva",
    name: "Sanatana Seva & Annadanam Circle",
    devanagari: "सनातन सेवा एवं अन्नदानम्",
    topic: "Organizing sacred food distribution and temple restoration seva",
    cadence: "Monthly (On Ekadashi & Purnima)",
    membersCount: 650,
    moderator: "ISHTI Seva Samiti",
  },
];

export default function CommunityPage() {
  const { user, openAuthModal } = useAuth();

  const handleJoin = (circleName: string) => {
    if (!user) {
      openAuthModal({
        message: `Sign in to join the ${circleName} fellowship.`,
      });
    } else {
      alert(`Welcome to ${circleName}! Your participation request has been registered.`);
    }
  };

  return (
    <PillarShell
      pillarKey="community"
      title="ISHTI Community"
      sanskritTagline="सङ्गच्छध्वं संवदध्वं सं वो मनांसि जानताम् — Walk together, speak together, let your minds be of one accord (Rigveda 10.191.2)"
      description="A dignified space for spiritual fellowship. Connect with local temple events, seva opportunities, and philosophical study circles."
      breadcrumbs={[{ label: "ISHTI Community", current: true }]}
      actionSlot={
        <span className="userRoleBadge" style={{ backgroundColor: "var(--ishti-success-surface)", color: "var(--ishti-success)" }}>
          Moderated Fellowship
        </span>
      }
    >
      {/* Community Satsang Circles Grid */}
      <div style={{ marginBottom: "36px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--ishti-temple-charcoal)", marginBottom: "16px" }}>
          Active Satsang Circles &amp; Study Groups
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
          {CIRCLES.map((circle) => (
            <div
              key={circle.id}
              className="profileCard"
              style={{ marginBottom: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
            >
              <div>
                <span className="userRoleBadge" style={{ marginBottom: "8px", display: "inline-block" }}>
                  {circle.cadence}
                </span>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ishti-temple-maroon)", margin: "4px 0" }}>
                  {circle.name}
                </h3>
                <p style={{ fontFamily: "var(--font-devanagari)", fontSize: "13px", color: "var(--ishti-vedic-saffron)", fontWeight: 600, marginBottom: "8px" }}>
                  {circle.devanagari}
                </p>
                <p style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)", lineHeight: 1.5, marginBottom: "12px" }}>
                  {circle.topic}
                </p>
                <div style={{ fontSize: "12px", color: "var(--ishti-temple-charcoal)" }}>
                  <strong>Moderator:</strong> {circle.moderator} &bull; {circle.membersCount} Devotees
                </div>
              </div>

              <div style={{ marginTop: "20px", paddingTop: "14px", borderTop: "1px solid var(--border-subtle)" }}>
                <button
                  type="button"
                  onClick={() => handleJoin(circle.name)}
                  className="btnExploreModule"
                  style={{ marginTop: 0 }}
                >
                  <span>Participate in Circle</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code of Conduct Card */}
      <div className="dpdpStatutoryBanner">
        <h3 className="dpdpStatutoryTitle">
          ISHTI Community Dignity Charter (सद्भाव संहिता)
        </h3>
        <p className="dpdpStatutoryText">
          ISHTI Community is a sacred digital space dedicated to spiritual growth and sincere enquiry. All discussions are governed by the ancient tradition of <em>Vada</em> (honest philosophical dialogue for truth), rejecting sectarian prejudice, commercial solicitation, and hostile debate.
        </p>
      </div>
    </PillarShell>
  );
}
