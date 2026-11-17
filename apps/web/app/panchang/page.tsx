"use client";

import React, { useState } from "react";
import { Check, AlertTriangle } from "lucide-react";
import { PillarShell } from "../components/layout/PillarShell";
import { useI18n } from "../../lib/i18n/context";

export default function PanchangPage() {
  const { dict } = useI18n();
  const p = dict.panchang;
  const [selectedCity, setSelectedCity] = useState("Varanasi, UP");
  const [calendarSystem, setCalendarSystem] = useState<"purnimanta" | "amanta">("purnimanta");

  const todayDateStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <PillarShell
      pillarKey="panchang"
      title={p.title}
      sanskritTagline={p.tagline}
      description={p.description}
      breadcrumbs={[{ label: p.title, current: true }]}
      actionSlot={
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="authInput"
            style={{
              padding: "6px 12px",
              fontSize: "13px",
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--border-card)",
              borderRadius: "var(--border-radius-md)",
            }}
          >
            <option value="Varanasi, UP">Varanasi (25.3176° N, 82.9739° E)</option>
            <option value="New Delhi">New Delhi (28.6139° N, 77.2090° E)</option>
            <option value="Mumbai">Mumbai (19.0760° N, 72.8777° E)</option>
            <option value="Bengaluru">Bengaluru (12.9716° N, 77.5946° E)</option>
            <option value="Chennai">Chennai (13.0827° N, 80.2707° E)</option>
            <option value="Kolkata">Kolkata (22.5726° N, 88.3639° E)</option>
          </select>
        </div>
      }
    >
      {/* Date & Location Banner */}
      <div
        className="profileCard"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          padding: "20px 24px",
          marginBottom: "28px",
        }}
      >
        <div>
          <span style={{ fontSize: "12px", color: "var(--ishti-vedic-saffron)", fontWeight: 700, textTransform: "uppercase" }}>
            Vedic Almanac for {selectedCity}
          </span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "24px", color: "var(--ishti-temple-charcoal)", margin: "4px 0 0" }}>
            {todayDateStr}
          </h2>
          <span style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)" }}>
            Surya Siddhanta &bull; Lahiri Ayanamsha (24° 13&apos; 48&quot;)
          </span>
        </div>

        {/* Calendar System Switch */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setCalendarSystem("purnimanta")}
            className="signInButton"
            style={{
              backgroundColor: calendarSystem === "purnimanta" ? "var(--ishti-temple-maroon)" : "transparent",
              color: calendarSystem === "purnimanta" ? "var(--ishti-ivory-paper)" : "var(--ishti-temple-maroon)",
              fontSize: "12px",
              padding: "6px 12px",
            }}
          >
            Purnimanta (North)
          </button>
          <button
            type="button"
            onClick={() => setCalendarSystem("amanta")}
            className="signInButton"
            style={{
              backgroundColor: calendarSystem === "amanta" ? "var(--ishti-temple-maroon)" : "transparent",
              color: calendarSystem === "amanta" ? "var(--ishti-ivory-paper)" : "var(--ishti-temple-maroon)",
              fontSize: "12px",
              padding: "6px 12px",
            }}
          >
            Amanta (South &amp; West)
          </button>
        </div>
      </div>

      {/* The Five Limbs of Time (Pancha-Anga) Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        {/* 1. Tithi */}
        <div className="profileCard" style={{ marginBottom: 0, padding: "20px" }}>
          <span className="profileFieldLabel">1. Tithi (Lunar Phase)</span>
          <h3 style={{ fontSize: "20px", color: "var(--ishti-temple-maroon)", margin: "8px 0 4px" }}>
            Shukla Ekadashi
          </h3>
          <p style={{ fontSize: "12px", fontFamily: "var(--font-devanagari)", color: "var(--ishti-vedic-saffron)", fontWeight: 600 }}>
            शुक्ल एकादशी (तिथ्यन्त: 19:42)
          </p>
        </div>

        {/* 2. Vaara */}
        <div className="profileCard" style={{ marginBottom: 0, padding: "20px" }}>
          <span className="profileFieldLabel">2. Vaara (Solar Day)</span>
          <h3 style={{ fontSize: "20px", color: "var(--ishti-temple-maroon)", margin: "8px 0 4px" }}>
            Somavara (Monday)
          </h3>
          <p style={{ fontSize: "12px", fontFamily: "var(--font-devanagari)", color: "var(--ishti-vedic-saffron)", fontWeight: 600 }}>
            सोमवार (ग्रहेश: चन्द्र)
          </p>
        </div>

        {/* 3. Nakshatra */}
        <div className="profileCard" style={{ marginBottom: 0, padding: "20px" }}>
          <span className="profileFieldLabel">3. Nakshatra (Lunar Mansion)</span>
          <h3 style={{ fontSize: "20px", color: "var(--ishti-temple-maroon)", margin: "8px 0 4px" }}>
            Rohini
          </h3>
          <p style={{ fontSize: "12px", fontFamily: "var(--font-devanagari)", color: "var(--ishti-vedic-saffron)", fontWeight: 600 }}>
            रोहिणी (नक्षत्रान्त: 22:15)
          </p>
        </div>

        {/* 4. Yoga */}
        <div className="profileCard" style={{ marginBottom: 0, padding: "20px" }}>
          <span className="profileFieldLabel">4. Yoga (Solilunar Arc)</span>
          <h3 style={{ fontSize: "20px", color: "var(--ishti-temple-maroon)", margin: "8px 0 4px" }}>
            Siddha Yoga
          </h3>
          <p style={{ fontSize: "12px", fontFamily: "var(--font-devanagari)", color: "var(--ishti-vedic-saffron)", fontWeight: 600 }}>
            सिद्ध योग (शुभ फलदायक)
          </p>
        </div>

        {/* 5. Karana */}
        <div className="profileCard" style={{ marginBottom: 0, padding: "20px" }}>
          <span className="profileFieldLabel">5. Karana (Half Tithi)</span>
          <h3 style={{ fontSize: "20px", color: "var(--ishti-temple-maroon)", margin: "8px 0 4px" }}>
            Vanija Karana
          </h3>
          <p style={{ fontSize: "12px", fontFamily: "var(--font-devanagari)", color: "var(--ishti-vedic-saffron)", fontWeight: 600 }}>
            वणिज करण
          </p>
        </div>
      </div>

      {/* Muhurta Timings (Auspicious vs Inauspicious) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
        {/* Auspicious Muhurtas */}
        <div className="profileCard">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Check size={18} strokeWidth={2.2} style={{ color: "var(--ishti-success)" }} aria-hidden="true" />
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ishti-temple-charcoal)", margin: 0 }}>
              Shubha Muhurtas (Auspicious)
            </h3>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
            <li style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
              <span style={{ fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>Abhijit Muhurta</span>
              <span style={{ fontFamily: "monospace", color: "var(--ishti-success)", fontWeight: 700 }}>11:44 — 12:36</span>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
              <span style={{ fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>Brahma Muhurta</span>
              <span style={{ fontFamily: "monospace", color: "var(--ishti-success)", fontWeight: 700 }}>04:22 — 05:10</span>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
              <span style={{ fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>Amrita Kalam</span>
              <span style={{ fontFamily: "monospace", color: "var(--ishti-success)", fontWeight: 700 }}>18:05 — 19:35</span>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between", paddingBottom: "4px" }}>
              <span style={{ fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>Godhuli Muhurta</span>
              <span style={{ fontFamily: "monospace", color: "var(--ishti-success)", fontWeight: 700 }}>17:45 — 18:09</span>
            </li>
          </ul>
        </div>

        {/* Inauspicious Muhurtas */}
        <div className="profileCard">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <AlertTriangle size={18} strokeWidth={1.8} style={{ color: "var(--ishti-error)" }} aria-hidden="true" />
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ishti-temple-charcoal)", margin: 0 }}>
              Ashubha Kaal (Inauspicious)
            </h3>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
            <li style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
              <span style={{ fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>Rahu Kalam</span>
              <span style={{ fontFamily: "monospace", color: "var(--ishti-error)", fontWeight: 700 }}>15:02 — 16:24</span>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
              <span style={{ fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>Yamagandam</span>
              <span style={{ fontFamily: "monospace", color: "var(--ishti-error)", fontWeight: 700 }}>09:12 — 10:34</span>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
              <span style={{ fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>Gulika Kalam</span>
              <span style={{ fontFamily: "monospace", color: "var(--ishti-error)", fontWeight: 700 }}>12:00 — 13:22</span>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between", paddingBottom: "4px" }}>
              <span style={{ fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>Varjyam</span>
              <span style={{ fontFamily: "monospace", color: "var(--ishti-error)", fontWeight: 700 }}>08:15 — 09:45</span>
            </li>
          </ul>
        </div>
      </div>
    </PillarShell>
  );
}
