"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import { PillarShell } from "../components/layout/PillarShell";
import { useAuth } from "../../lib/auth/auth-context";
import { useI18n } from "../../lib/i18n/context";

interface ExpertProfile {
  id: string;
  name: string;
  title: string;
  pathshala: string;
  tradition: string;
  experienceYears: number;
  languages: string[];
  specializations: string[];
  honorarium: string;
  verified: boolean;
}

const EXPERT_DIRECTORY: ExpertProfile[] = [
  {
    id: "pandit-sharma",
    name: "Pandit Ramachandra Sharma",
    title: "Veda Shastri & Vedanga Jyotishi",
    pathshala: "Sampurnanand Sanskrit Vishwavidyalaya, Varanasi",
    tradition: "Shukla Yajurveda Madhyandina Shakha",
    experienceYears: 22,
    languages: ["Sanskrit", "Hindi", "English"],
    specializations: ["Rudrabhishekam", "Griha Pravesh", "Kundli Parashara"],
    honorarium: "₹1,100 / 45-min consultation",
    verified: true,
  },
  {
    id: "acharya-venkatesh",
    name: "Acharya Venkatesha Dikshitar",
    title: "Agama & Rigveda Kramapatha Vidwan",
    pathshala: "Sringeri Sharada Peetham Pathshala",
    tradition: "Rigveda Shakala Shakha / Smartha",
    experienceYears: 18,
    languages: ["Sanskrit", "Tamil", "Telugu", "Hindi"],
    specializations: ["Maha Ganapati Havan", "Navagraha Shanti", "Vivaha Vidhi"],
    honorarium: "₹1,500 / 60-min consultation",
    verified: true,
  },
  {
    id: "vidushi-gayatri",
    name: "Dr. Gayatri Devi Shastri",
    title: "Darshana Acharya & Samkhya-Yoga Scholar",
    pathshala: "Rashtriya Sanskrit Sansthan, New Delhi",
    tradition: "Advaita Vedanta & Classical Yoga",
    experienceYears: 15,
    languages: ["Sanskrit", "Hindi", "English"],
    specializations: ["Upanishad Vichara", "Sandhyavandanam Coaching", "Satsang Guidance"],
    honorarium: "₹1,200 / 45-min consultation",
    verified: true,
  },
];

export default function ExpertsPage() {
  const { user, openAuthModal } = useAuth();
  const { dict } = useI18n();
  const ex = dict.experts;
  const [selectedSpecialization, setSelectedSpecialization] = useState("all");

  const handleBook = (expert: ExpertProfile) => {
    if (!user) {
      openAuthModal({
        message: `Sign in to schedule a vetted consultation with ${expert.name}.`,
      });
    } else {
      alert(`Booking request for ${expert.name} initialized under ISHTI Ethical Honorarium protocol.`);
    }
  };

  return (
    <PillarShell
      pillarKey="experts"
      title={ex.title}
      sanskritTagline={ex.tagline}
      description={ex.description}
      breadcrumbs={[{ label: ex.title, current: true }]}
      actionSlot={
        <span className="userRoleBadge" style={{ backgroundColor: "var(--ishti-success-surface)", color: "var(--ishti-success)" }}>
          Strict Lineage Verification
        </span>
      }
    >
      {/* Ethical Code of Conduct Banner */}
      <div
        className="profileCard"
        style={{
          backgroundColor: "var(--ishti-ivory-paper-warm)",
          border: "1px solid var(--border-gold)",
          padding: "20px 24px",
          marginBottom: "28px",
        }}
      >
        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--ishti-vedic-saffron)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          The ISHTI Acharya Accreditation Covenant
        </span>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--ishti-temple-maroon)", margin: "4px 0 8px" }}>
          Transparent Honorariums. Zero Fear-Mongering.
        </h2>
        <p style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)", lineHeight: 1.6, margin: 0 }}>
          Every Pandit and Acharya in the ISHTI directory is independently vetted by traditional scholars. All consultations operate with published honorariums. Up-selling gemstones, claiming hereditary curses, or commercial pressure is strictly prohibited.
        </p>
      </div>

      {/* Directory Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        {EXPERT_DIRECTORY.map((expert) => (
          <div
            key={expert.id}
            className="profileCard"
            style={{ marginBottom: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ishti-temple-charcoal)", margin: 0 }}>
                    {expert.name}
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--ishti-vedic-saffron)", fontWeight: 600, margin: "2px 0 0" }}>
                    {expert.title}
                  </p>
                </div>
                <span
                  className="userRoleBadge"
                  style={{
                    backgroundColor: "var(--ishti-success-surface)",
                    color: "var(--ishti-success)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Check size={12} strokeWidth={2.2} />
                  <span>Vetted</span>
                </span>
              </div>

              <div style={{ fontSize: "12px", color: "var(--ishti-warm-bronze)", display: "flex", flexDirection: "column", gap: "4px", marginBottom: "16px" }}>
                <div>
                  <strong>Pathshala:</strong> {expert.pathshala}
                </div>
                <div>
                  <strong>Tradition:</strong> {expert.tradition}
                </div>
                <div>
                  <strong>Experience:</strong> {expert.experienceYears} Years &bull;{" "}
                  <strong>Languages:</strong> {expert.languages.join(", ")}
                </div>
              </div>

              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--ishti-temple-charcoal)", letterSpacing: "0.05em" }}>
                  Specializations
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                  {expert.specializations.map((spec, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: "11px",
                        backgroundColor: "var(--surface-card)",
                        padding: "3px 8px",
                        borderRadius: "var(--border-radius-sm)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--ishti-temple-charcoal)",
                      }}
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--ishti-warm-bronze)", display: "block" }}>Honorarium</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--ishti-temple-maroon)" }}>
                  {expert.honorarium}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleBook(expert)}
                className="btnAuthPrimary"
                style={{ width: "auto", padding: "8px 16px", fontSize: "13px" }}
              >
                Book Session
              </button>
            </div>
          </div>
        ))}
      </div>
    </PillarShell>
  );
}
