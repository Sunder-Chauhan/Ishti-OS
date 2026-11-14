import React from "react";

interface TrustPillar {
  title: string;
  devanagari: string;
  summary: string;
  detail: string;
}

const trustPillars: TrustPillar[] = [
  {
    title: "Canonical Source Grounding",
    devanagari: "मूल ग्रन्थ प्रमाण",
    summary: "Every mantra, ritual step, and samagri item mapped to verified classical texts.",
    detail:
      "As our content pipeline is established, procedural guidance will be drawn directly from classical Grihya Sutras, Puranas, Agamas, and authorized regional manuals with transparent attribution, rather than unvetted internet summaries.",
  },
  {
    title: "Preservation of Living Sampradayas",
    devanagari: "सम्प्रदाय एवं विविधता",
    summary: "Respecting the nuanced distinctions of India's diverse regional traditions.",
    detail:
      "A Satyanarayan Puja in Bengal, Gujarat, or Tamil Nadu follows distinct traditions. ISHTI’s platform architecture is designed to honor regional sampradaya variations rather than imposing an artificial, homogenized single standard.",
  },
  {
    title: "Approved-Source Grounding & Uncertainty Disclosure",
    devanagari: "मर्यादित तन्त्रज्ञान",
    summary: "AI as a bounded retrieval guide, never an authoritative religious oracle.",
    detail:
      "Rather than making impossible guarantees of zero error, our AI architecture enforces strict approved-source grounding. When an answer is ambiguous or absent from canonical literature, ISHTI is programmed to transparently declare uncertainty rather than inventing ritual instructions.",
  },
  {
    title: "Human Expert Escalation",
    devanagari: "विद्वत परम्परा",
    summary: "Seamless transition from digital study to verified living scholars.",
    detail:
      "Sacred life sacraments (Sanskars) require the direct presence and sankalpa of an experienced human Pandit. Our planned expert directory will connect seekers with vetted traditional acharyas once the verification network is operational.",
  },
];

export function TrustSection() {
  return (
    <section id="trust" className="trustSection" aria-labelledby="trustHeading">
      <div className="trustHeader">
        <p className="sectionKicker">Governance & Knowledge Integrity</p>
        <h2 id="trustHeading" className="sectionTitle">
          Our Commitment to Sacred Knowledge Accuracy
        </h2>
        <p className="sectionSubtitle">
          In an era where algorithmic distortion spreads unvetted religious claims, ISHTI’s platform blueprint is governed by strict source attribution, explicit uncertainty disclosure, and respectful technology.
        </p>
      </div>

      <div className="trustPillarsGrid">
        {trustPillars.map((pillar, index) => (
          <div key={index} className="trustCard">
            <div className="trustCardHeader">
              <span className="trustIndex">0{index + 1}</span>
              <span className="trustCardDevanagari">{pillar.devanagari}</span>
            </div>
            <h3 className="trustCardTitle">{pillar.title}</h3>
            <p className="trustCardSummary">{pillar.summary}</p>
            <p className="trustCardDetail">{pillar.detail}</p>
          </div>
        ))}
      </div>

      <div className="trustQuoteBlock">
        <div className="quoteEmblem">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" aria-hidden="true">
            <circle cx="12" cy="12" r="9" strokeOpacity="0.4" />
            <path d="M12 7 L12 17 M7 12 L17 12" strokeLinecap="round" />
          </svg>
        </div>
        <blockquote>
          “Tradition deserves preservation. Technology should make it more accessible, never distort it.”
        </blockquote>
        <cite>— The ISHTI Brand Charter, Principle 1</cite>
      </div>
    </section>
  );
}
