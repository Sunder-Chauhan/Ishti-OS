"use client";

import React, { useState } from "react";
import { PillarShell } from "../components/layout/PillarShell";

interface ScriptureWork {
  id: string;
  title: string;
  devanagari: string;
  category: string;
  tradition: string;
  status: "verified" | "scholarly_review";
  rights: "cleared" | "pending_clearance";
  verseCount: number;
}

const CATALOG_SEED: ScriptureWork[] = [
  {
    id: "rigveda",
    title: "Rigveda Samhita (Shakala Shakha)",
    devanagari: "ऋग्वेद संहिता (शाकल शाखा)",
    category: "Veda (Shruti)",
    tradition: "Vedic Sanatana",
    status: "verified",
    rights: "cleared",
    verseCount: 10552,
  },
  {
    id: "gita",
    title: "Srimad Bhagavad Gita",
    devanagari: "श्रीमद्भगवद्गीता (महाभारत भीष्मपर्व)",
    category: "Itihasa (Smriti)",
    tradition: "Vedanta / Vaishnava",
    status: "verified",
    rights: "cleared",
    verseCount: 700,
  },
  {
    id: "isha-upanishad",
    title: "Isha Upanishad (Shukla Yajurveda)",
    devanagari: "ईशावास्योपनिषद्",
    category: "Upanishad (Shruti)",
    tradition: "Vedanta",
    status: "verified",
    rights: "cleared",
    verseCount: 18,
  },
  {
    id: "rudram",
    title: "Sri Rudram (Namakam & Chamakam)",
    devanagari: "श्री रुद्रम् (नमकम् एवं चमकम्)",
    category: "Veda (Krishna Yajurveda)",
    tradition: "Shaiva / Vedic",
    status: "verified",
    rights: "cleared",
    verseCount: 169,
  },
];

export default function BhaktiPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filtered = CATALOG_SEED.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.devanagari.includes(searchQuery);
    const matchesCat =
      selectedCategory === "all" ||
      item.category.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCat;
  });

  return (
    <PillarShell
      pillarKey="bhakti"
      title="ISHTI Bhakti"
      sanskritTagline="वेदोऽखिलो धर्ममूलम् — The Vedas are the root of all Dharma (Manusmriti 2.6)"
      description="A serene repository of devotional compositions: aartis, stotras, chalisa, and suktas with lyrical transliteration and canonical explanations."
      breadcrumbs={[{ label: "ISHTI Bhakti", current: true }]}
      actionSlot={
        <div style={{ display: "flex", gap: "8px" }}>
          <span className="userRoleBadge" style={{ backgroundColor: "var(--ishti-success-surface)", color: "var(--ishti-success)" }}>
            Public Shastric Access
          </span>
        </div>
      }
    >
      {/* Featured Verified Canonical Verse */}
      <div
        className="profileCard"
        style={{
          backgroundColor: "var(--ishti-ivory-paper-warm)",
          border: "1px solid var(--border-gold)",
          textAlign: "center",
          padding: "36px 24px",
          marginBottom: "36px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "var(--ishti-vedic-saffron)",
            textTransform: "uppercase",
            marginBottom: "12px",
            display: "inline-block",
          }}
        >
          Canonical Shastric Verse of the Day &bull; Rigveda 10.191.2
        </span>
        <blockquote style={{ margin: 0 }}>
          <p
            style={{
              fontFamily: "var(--font-devanagari)",
              fontSize: "22px",
              fontWeight: 600,
              color: "var(--ishti-temple-maroon)",
              lineHeight: 1.8,
              marginBottom: "12px",
            }}
          >
            सङ्गच्छध्वं संवदध्वं सं वो मनांसि जानताम् ।<br />
            देवा भागं यथा पूर्वे सञ्जानाना उपासते ॥
          </p>
          <p
            style={{
              fontStyle: "italic",
              fontSize: "14px",
              color: "var(--ishti-warm-bronze)",
              marginBottom: "12px",
              letterSpacing: "0.02em",
            }}
          >
            saṅgacchadhvaṁ saṁvadadhvaṁ saṁ vo manāṁsi jānatām |<br />
            devā bhāgaṁ yathā pūrve sañjānānā upāsate ||
          </p>
          <p
            style={{
              fontSize: "15px",
              color: "var(--ishti-temple-charcoal)",
              maxWidth: "680px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            “Walk together, speak together, let your minds be of one accord, just as the ancient deities in unison shared their portion of the sacred offering.”
          </p>
        </blockquote>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "28px", alignItems: "center" }}>
        <input
          type="search"
          placeholder="Search verified verses, stotras, or deities (e.g. Rigveda, Gita, Shiva)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="authInput"
          style={{
            flex: 1,
            minWidth: "260px",
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--border-card)",
            borderRadius: "var(--border-radius-md)",
          }}
        />

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["all", "veda", "upanishad", "itihasa"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className="signInButton"
              style={{
                textTransform: "capitalize",
                backgroundColor: selectedCategory === cat ? "var(--ishti-temple-maroon)" : "transparent",
                color: selectedCategory === cat ? "var(--ishti-ivory-paper)" : "var(--ishti-temple-maroon)",
                padding: "8px 14px",
              }}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Curated Catalog Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
        {filtered.map((work) => (
          <div
            key={work.id}
            className="profileCard"
            style={{ marginBottom: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                <span className="userRoleBadge">{work.category}</span>
                <span style={{ fontSize: "11px", color: "var(--ishti-success)", fontWeight: 600 }}>
                  ✓ {work.rights === "cleared" ? "Public Domain" : "In Review"}
                </span>
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--ishti-temple-maroon)", marginBottom: "4px" }}>
                {work.title}
              </h3>
              <p style={{ fontFamily: "var(--font-devanagari)", fontSize: "14px", color: "var(--ishti-vedic-saffron)", fontWeight: 600, marginBottom: "12px" }}>
                {work.devanagari}
              </p>
              <span style={{ fontSize: "12px", color: "var(--ishti-warm-bronze)" }}>
                Tradition: {work.tradition} &bull; {work.verseCount.toLocaleString()} Verses
              </span>
            </div>

            <div style={{ marginTop: "20px", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)" }}>
              <button
                type="button"
                className="btnExploreModule"
                style={{ marginTop: 0 }}
                onClick={() => alert(`Opening ${work.title} reader. All verses are authenticated per ADR-006.`)}
              >
                <span>Read Canonical Text</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </PillarShell>
  );
}
