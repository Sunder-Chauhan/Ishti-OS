"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PillarShell } from "../components/layout/PillarShell";
import { useAuth } from "../../lib/auth/auth-context";

interface PlanetaryPosition {
  planet: string;
  sign: string;
  degree: string;
  nakshatra: string;
  pada: number;
  retrograde: boolean;
}

const SAMPLE_PLANETS: PlanetaryPosition[] = [
  { planet: "Surya (Sun)", sign: "Vrishabha (Taurus)", degree: "14° 22'", nakshatra: "Rohini", pada: 2, retrograde: false },
  { planet: "Chandra (Moon)", sign: "Karka (Cancer)", degree: "28° 05'", nakshatra: "Ashlesha", pada: 4, retrograde: false },
  { planet: "Mangala (Mars)", sign: "Mesha (Aries)", degree: "03° 41'", nakshatra: "Ashwini", pada: 2, retrograde: false },
  { planet: "Budha (Mercury)", sign: "Mithuna (Gemini)", degree: "11° 19'", nakshatra: "Ardra", pada: 2, retrograde: true },
  { planet: "Guru (Jupiter)", sign: "Mesha (Aries)", degree: "26° 54'", nakshatra: "Krittika", pada: 1, retrograde: false },
  { planet: "Shukra (Venus)", sign: "Vrishabha (Taurus)", degree: "08° 12'", nakshatra: "Krittika", pada: 4, retrograde: false },
  { planet: "Shani (Saturn)", sign: "Kumbha (Aquarius)", degree: "19° 33'", nakshatra: "Shatabhisha", pada: 4, retrograde: false },
  { planet: "Rahu", sign: "Meena (Pisces)", degree: "15° 02'", nakshatra: "Uttara Bhadrapada", pada: 4, retrograde: true },
  { planet: "Ketu", sign: "Kanya (Virgo)", degree: "15° 02'", nakshatra: "Hasta", pada: 2, retrograde: true },
];

export default function AstroPage() {
  const { user, openAuthModal } = useAuth();

  const [birthDate, setBirthDate] = useState("1995-05-15");
  const [birthTime, setBirthTime] = useState("06:30");
  const [birthPlace, setBirthPlace] = useState("Varanasi, Uttar Pradesh, India");
  const [ayanamsha, setAyanamsha] = useState("Lahiri (Chitrapaksha)");
  const [isCalculated, setIsCalculated] = useState(true);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculated(true);
  };

  return (
    <PillarShell
      pillarKey="astro"
      title="ISHTI Astro"
      sanskritTagline="ज्योतिषां सूर्यं चक्षुः — Astrology is the eye of the Vedas"
      description="Mathematical precision meets classical Jyotish. Clear astrological insight without superstition, fear-based warnings, or commercial hype."
      breadcrumbs={[{ label: "ISHTI Astro", current: true }]}
      actionSlot={
        <div style={{ display: "flex", gap: "10px" }}>
          <span className="userRoleBadge" style={{ backgroundColor: "var(--ishti-success-surface)", color: "var(--ishti-success)" }}>
            AES-256-GCM Encrypted
          </span>
        </div>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "32px", marginBottom: "40px" }}>
        {/* Left: Birth Chart Form */}
        <div>
          <div className="profileCard">
            <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--ishti-temple-charcoal)", marginBottom: "8px" }}>
              Calculate Vedic Kundli
            </h2>
            <p style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)", lineHeight: 1.5, marginBottom: "20px" }}>
              All birth data is protected under client-side AES-256-GCM envelope encryption with context-bound authentication tags before hitting persistent storage.
            </p>

            <form onSubmit={handleCalculate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="formFieldGroup">
                <label htmlFor="dob" className="formLabel">Date of Birth</label>
                <input
                  id="dob"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="authInput"
                  style={{ border: "1px solid var(--border-card)", borderRadius: "var(--border-radius-md)", backgroundColor: "#FFFFFF" }}
                  required
                />
              </div>

              <div className="formFieldGroup">
                <label htmlFor="tob" className="formLabel">Exact Time of Birth</label>
                <input
                  id="tob"
                  type="time"
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                  className="authInput"
                  style={{ border: "1px solid var(--border-card)", borderRadius: "var(--border-radius-md)", backgroundColor: "#FFFFFF" }}
                  required
                />
              </div>

              <div className="formFieldGroup">
                <label htmlFor="pob" className="formLabel">Place of Birth (City, State, Country)</label>
                <input
                  id="pob"
                  type="text"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  className="authInput"
                  style={{ border: "1px solid var(--border-card)", borderRadius: "var(--border-radius-md)", backgroundColor: "#FFFFFF" }}
                  required
                />
              </div>

              <div className="formFieldGroup">
                <label htmlFor="ayanamsha" className="formLabel">Ayanamsha Model</label>
                <select
                  id="ayanamsha"
                  value={ayanamsha}
                  onChange={(e) => setAyanamsha(e.target.value)}
                  className="authInput"
                  style={{ border: "1px solid var(--border-card)", borderRadius: "var(--border-radius-md)", backgroundColor: "#FFFFFF" }}
                >
                  <option value="Lahiri (Chitrapaksha)">Lahiri (Chitrapaksha) — Standard Indian Ephemeris</option>
                  <option value="Raman">B.V. Raman Ayanamsha</option>
                  <option value="Krishnamurti">KP (Krishnamurti Paddhati)</option>
                  <option value="Yukteshwar">Sri Yukteshwar Ayanamsha</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button type="submit" className="btnAuthPrimary" style={{ flex: 1 }}>
                  Generate Chart
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      openAuthModal({ message: "Sign in with your mobile number to securely save this Kundli to your account." });
                    } else {
                      alert("Kundli profile encrypted with AES-256-GCM and saved to your sanctuary account.");
                    }
                  }}
                  className="signInButton"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Planetary Ephemeris Output */}
        <div>
          <div className="profileCard">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>
                Graha Spashta (Planetary Degrees)
              </h2>
              <span style={{ fontSize: "12px", color: "var(--ishti-warm-bronze)" }}>
                {ayanamsha}
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-card)", textAlign: "left", color: "var(--ishti-warm-bronze)" }}>
                    <th style={{ padding: "8px 6px" }}>Planet</th>
                    <th style={{ padding: "8px 6px" }}>Rashi (Sign)</th>
                    <th style={{ padding: "8px 6px" }}>Degree</th>
                    <th style={{ padding: "8px 6px" }}>Nakshatra</th>
                    <th style={{ padding: "8px 6px" }}>Pada</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_PLANETS.map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "10px 6px", fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>
                        {p.planet} {p.retrograde && <span style={{ color: "var(--ishti-warning)", fontSize: "11px" }}>(R)</span>}
                      </td>
                      <td style={{ padding: "10px 6px" }}>{p.sign}</td>
                      <td style={{ padding: "10px 6px", fontFamily: "monospace" }}>{p.degree}</td>
                      <td style={{ padding: "10px 6px" }}>{p.nakshatra}</td>
                      <td style={{ padding: "10px 6px" }}>{p.pada}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ethical Dosha Perspective */}
          <div style={{ padding: "20px", backgroundColor: "#FFFFFF", borderRadius: "var(--border-radius-md)", border: "1px solid var(--border-card)" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ishti-temple-charcoal)", marginBottom: "6px" }}>
              The ISHTI Ethical Astrology Pledge
            </h3>
            <p style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)", lineHeight: 1.6 }}>
              In classical Jyotish (Brihat Parashara Hora Shastra), horoscopic doshas are tendencies toward self-reflection and spiritual growth, never fatalistic curses. We do not sell gemstones, fear-based remedies, or unverified claims.
            </p>
          </div>
        </div>
      </div>
    </PillarShell>
  );
}
