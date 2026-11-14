import React from "react";

interface PillarData {
  id: string;
  name: string;
  devanagari: string;
  tagline: string;
  description: string;
  capabilities: string[];
  accentColor: string;
  icon: (color: string) => React.ReactNode;
}

const pillars: PillarData[] = [
  {
    id: "puja",
    name: "YUGON Puja",
    devanagari: "पूजा एवं विधि",
    tagline: "Authentic Ritual Guidance & AI Pandit",
    description:
      "Step-by-step puja vidhi, verified samagri checklists, and scriptural mantras tailored to your sampradaya, festival, and regional tradition.",
    capabilities: [
      "Rigorous mantra transliteration & audio pronunciation",
      "Vetted samagri lists with verified regional substitutes",
      "Interactive AI Pandit bounded strictly to canonical texts",
    ],
    accentColor: "var(--terracotta)",
    icon: (color) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        {/* Kalash & Coconut with sacred leaves */}
        <path d="M 12 18 Q 8 22 10 27 L 22 27 Q 24 22 20 18 Z" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
        <ellipse cx="16" cy="18" rx="4" ry="1.5" stroke={color} strokeWidth="1.5" />
        <circle cx="16" cy="14" r="3" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.2" />
        <path d="M 12 16 Q 8 13 8 10 Q 11 11 13 14" stroke={color} strokeWidth="1.25" fill="none" strokeLinecap="round" />
        <path d="M 20 16 Q 24 13 24 10 Q 21 11 19 14" stroke={color} strokeWidth="1.25" fill="none" strokeLinecap="round" />
        <line x1="8" y1="29" x2="24" y2="29" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "astrology",
    name: "YUGON Astro",
    devanagari: "ज्योतिष शास्त्र",
    tagline: "Kundli, Dasha & Planetary Transits",
    description:
      "Mathematical precision meets classical Jyotish. Clear astrological insight without superstition, fear-based warnings, or commercial hype.",
    capabilities: [
      "Deterministic Vedic ephemeris calculations (Lahiri & Raman Ayanamsha)",
      "Transparent planetary positions, Vimshottari dasha, and divisional charts",
      "Constructive, introspective guidance honoring free will and personal duty",
    ],
    accentColor: "var(--gold)",
    icon: (color) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        {/* Vedic Kundli Square Geometry */}
        <rect x="5" y="5" width="22" height="22" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.08" />
        <line x1="5" y1="5" x2="27" y2="27" stroke={color} strokeWidth="1.25" />
        <line x1="27" y1="5" x2="5" y2="27" stroke={color} strokeWidth="1.25" />
        {/* Inner Diamond */}
        <path d="M 16 5 L 27 16 L 16 27 L 5 16 Z" stroke={color} strokeWidth="1.25" />
        <circle cx="16" cy="16" r="2.5" fill={color} />
      </svg>
    ),
  },
  {
    id: "music",
    name: "YUGON Bhakti",
    devanagari: "भक्ति संगीत",
    tagline: "Sacred Chants & Traditional Ragas",
    description:
      "Immersive devotional listening curated from classical gharanas, temple traditions, Vedic chanting groups, and celebrated devotional artists.",
    capabilities: [
      "Lossless meditative stotras, suktas, and regional bhajans",
      "Time-of-day Raga alignments for morning, twilight, and evening contemplation",
      "Respectful artist royalties and provenance rights management",
    ],
    accentColor: "var(--sage)",
    icon: (color) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        {/* Tanpura / Sacred Resonance soundwaves & strings */}
        <circle cx="16" cy="22" r="6" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
        <line x1="16" y1="16" x2="16" y2="5" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
        <line x1="13" y1="8" x2="19" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="16" cy="22" r="2" fill={color} />
        {/* Harmonic resonance arcs */}
        <path d="M 6 16 C 6 10 10 6 16 6" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 3" />
        <path d="M 26 16 C 26 10 22 6 16 6" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 3" />
      </svg>
    ),
  },
  {
    id: "panchang",
    name: "YUGON Panchang",
    devanagari: "पञ्चाङ्ग एवं मुहूर्त",
    tagline: "Exact Solar, Lunar & Muhurat Coordinates",
    description:
      "Precise astronomical timings computed for your specific latitude and longitude. Tithi, Nakshatra, Yoga, Karana, and auspicious windows.",
    capabilities: [
      "Micro-location solar sunrise, sunset, and twilight calculation",
      "Choghadiya, Rahu Kalam, Yamaganda, and Abhijit Muhurat alerts",
      "Regional calendar alignments (Amavasyant, Purnimant, Solar Tamil/Bengali)",
    ],
    accentColor: "var(--gold)",
    icon: (color) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        {/* Sun & Crescent Moon intersection dial */}
        <circle cx="14" cy="15" r="8" stroke={color} strokeWidth="1.5" />
        <path d="M 17 8 A 8 8 0 0 1 25 18 A 8 8 0 0 0 17 8 Z" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.25" />
        {/* Sun rays */}
        <line x1="14" y1="4" x2="14" y2="2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="6" y1="15" x2="4" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="8" y1="9" x2="6.5" y2="7.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="8" y1="21" x2="6.5" y2="22.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "experts",
    name: "YUGON Experts",
    devanagari: "प्रमाणित आचार्य",
    tagline: "Vetted Pandits, Astrologers & Gurus",
    description:
      "Direct access to qualified spiritual practitioners verified for lineage, scholarly training, transparent pricing, and ethical conduct.",
    capabilities: [
      "Rigorous background verification of Sanskrit qualification and lineage",
      "Transparent fixed-pricing with no hidden fees or fear tactics",
      "Seamless online or in-person ceremony coordination",
    ],
    accentColor: "var(--terracotta)",
    icon: (color) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        {/* Scholarly Seal & Pothi / Manuscript */}
        <rect x="7" y="11" width="18" height="15" rx="1.5" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
        <line x1="10" y1="16" x2="22" y2="16" stroke={color} strokeWidth="1.25" strokeLinecap="round" />
        <line x1="10" y1="20" x2="18" y2="20" stroke={color} strokeWidth="1.25" strokeLinecap="round" />
        {/* Verification Check Seal */}
        <circle cx="23" cy="9" r="5" fill="#F1EBDD" stroke={color} strokeWidth="1.5" />
        <path d="M 21 9 L 22.5 10.5 L 25 7.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "community",
    name: "YUGON Community",
    devanagari: "सत्संग एवं समुदाय",
    tagline: "Satsangs, Festivals & Shared Heritage",
    description:
      "A peaceful digital sanctuary to share sacred observations, temple histories, philosophical questions, and participate in collective chanting.",
    capabilities: [
      "Curated temple festival broadcasts and collaborative seva initiatives",
      "Moderated, respectful community discussion without toxicity or political noise",
      "Cross-generational knowledge preservation for global families",
    ],
    accentColor: "var(--sage)",
    icon: (color) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        {/* Mandapa Gathering Circle of lights */}
        <circle cx="16" cy="16" r="10" stroke={color} strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx="16" cy="16" r="4" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.25" />
        <circle cx="16" cy="6" r="2" fill={color} />
        <circle cx="26" cy="16" r="2" fill={color} />
        <circle cx="16" cy="26" r="2" fill={color} />
        <circle cx="6" cy="16" r="2" fill={color} />
      </svg>
    ),
  },
];

export function EcosystemCards() {
  return (
    <div className="ecosystemGrid">
      {pillars.map((pillar, index) => (
        <article
          key={pillar.id}
          className="ecosystemCard"
          style={{ "--cardAccent": pillar.accentColor } as React.CSSProperties}
        >
          {/* Top card metadata */}
          <div className="cardHeader">
            <span className="cardIndex">0{index + 1}</span>
            <div className="cardIconWrap">{pillar.icon(pillar.accentColor)}</div>
          </div>

          {/* Titles */}
          <div className="cardTitleGroup">
            <h3 className="cardName">{pillar.name}</h3>
            <span className="cardDevanagari">{pillar.devanagari}</span>
          </div>

          <p className="cardTagline">{pillar.tagline}</p>
          <p className="cardDescription">{pillar.description}</p>

          {/* Feature highlights */}
          <div className="capabilitiesWrap">
            <span className="capabilitiesHeading">Planned Capabilities</span>
            <ul className="cardCapabilities">
              {pillar.capabilities.map((cap, i) => (
                <li key={i} className="capabilityItem">
                  <span className="capabilityBullet" style={{ backgroundColor: pillar.accentColor }} />
                  <span>{cap}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Planned status badge */}
          <div className="cardFooter">
            <span className="plannedBadge" title="Planned feature for upcoming release">
              <span className="plannedDot" />
              Planned &bull; In Development
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

