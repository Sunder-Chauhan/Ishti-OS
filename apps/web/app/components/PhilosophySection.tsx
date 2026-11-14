import React from "react";

export function PhilosophySection() {
  return (
    <section id="philosophy" className="philosophySection" aria-labelledby="philosophyHeading">
      <div className="philosophyHeader">
        <p className="sectionKicker">Our Purpose & Philosophy</p>
        <h2 id="philosophyHeading" className="sectionTitle">
          Rooted in Tradition. Connected to Today.
        </h2>
        <p className="sectionSubtitle">
          Millions of seekers seek authentic connection with their heritage, yet encounter fragmented websites, commercially motivated fear-mongering, and unverified information. ISHTI exists to rebuild that sacred trust.
        </p>
      </div>

      <div className="synthesisContainer">
        {/* Tradition Column */}
        <div className="synthesisCard traditionSide">
          <div className="synthesisHeader">
            <span className="synthesisBadge">Timeless Heritage</span>
            <span className="synthesisDevanagari">सनातन परम्परा</span>
          </div>
          <h3 className="synthesisTitle">Preserving What Is Eternal</h3>
          <p className="synthesisText">
            For millennia, India’s rishis, scholars, and regional sampradayas observed celestial rhythms, refined contemplative arts, and articulated ritual frameworks designed to bring peace, mindfulness, and sacred balance to everyday life.
          </p>
          <ul className="synthesisList">
            <li><strong>Verified Authority:</strong> Respecting Guru-Shishya lineages and authenticated shastric commentaries.</li>
            <li><strong>Spiritual Dignity:</strong> A serene, contemplative environment free from sensationalism or clickbait.</li>
            <li><strong>Inclusive Multi-Lingualism:</strong> Honoring Sanskrit, Hindi, Tamil, Telugu, Bengali, Marathi, and regional scripts.</li>
          </ul>
        </div>

        {/* Bridge Emblem */}
        <div className="synthesisBridge" aria-hidden="true">
          <div className="bridgeLine" />
          <div className="bridgeCircle">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="12" stroke="var(--gold)" strokeWidth="1.5" />
              <path d="M14 6 L14 22 M6 14 L22 14" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="bridgeLine" />
        </div>

        {/* Technology Column */}
        <div className="synthesisCard techSide">
          <div className="synthesisHeader">
            <span className="synthesisBadge">Thoughtful Technology</span>
            <span className="synthesisDevanagari">आधुनिक तन्त्रज्ञान</span>
          </div>
          <h3 className="synthesisTitle">Making Sacred Knowledge Accessible</h3>
          <p className="synthesisText">
            Modern computing should illuminate and simplify, not distort. Our engineering blueprint relies on deterministic astronomical algorithms, curated knowledge graphs, and privacy-preserving infrastructure to serve everyday devotees wherever they reside.
          </p>
          <ul className="synthesisList">
            <li><strong>Mathematical Rigor:</strong> Deterministic planetary algorithms planned and benchmarked against national astronomical standards.</li>
            <li><strong>Audited Retrieval:</strong> Verified knowledge engines that cite source scriptures and canonical chapters.</li>
            <li><strong>Clutter-Free Design:</strong> Calm, accessible interfaces built for thoughtful daily reflection.</li>
          </ul>
        </div>
      </div>

      {/* Core Values Strip */}
      <div className="valuesStrip">
        <div className="valueItem">
          <h4>Authenticity</h4>
          <p>Respect verified sources and established traditions without fabrication.</p>
        </div>
        <div className="valueItem">
          <h4>Peace</h4>
          <p>Create a calm, uncluttered sanctuary in a noisy digital landscape.</p>
        </div>
        <div className="valueItem">
          <h4>Trust</h4>
          <p>Complete transparency about information, ritual methods, and expert pricing.</p>
        </div>
        <div className="valueItem">
          <h4>Inclusivity</h4>
          <p>Honoring varied sampradayas, regions, languages, and personal devotion.</p>
        </div>
      </div>
    </section>
  );
}

