import React from "react";

interface Step {
  time: string;
  family: string;
  title: string;
  description: string;
  detailBadge: string;
}

const steps: Step[] = [
  {
    time: "06:00 AM",
    family: "YUGON Panchang & Bhakti",
    title: "Dawn Sandhya & Solar Alignment",
    description:
      "Envisioned micro-calculated sunrise coordinates for your location. View the day's Tithi, Nakshatra, and commence contemplative meditation with a morning raga stotra stream.",
    detailBadge: "Planned: Ephemeris & Audio Stotra",
  },
  {
    time: "11:30 AM",
    family: "YUGON Puja & AI Pandit",
    title: "Guided Family Ritual Preparation",
    description:
      "Envisioned preparation for family pujas: an itemized samagri checklist with verified regional substitutes, step-by-step ritual sequence, and verified Sanskrit sankalpa recitation.",
    detailBadge: "Planned: Canonical Vidhi & Samagri",
  },
  {
    time: "03:15 PM",
    family: "YUGON Experts & Astro",
    title: "Transparent Scholar Consultation",
    description:
      "Envisioned milestone consultations: connecting with vetted Vedic astrologers or Sanskrit Acharyas with fixed honorariums, zero fear-based claims, and privacy guarantees.",
    detailBadge: "Planned: Vetted Acharyas & Lineage Review",
  },
  {
    time: "07:30 PM",
    family: "YUGON Community",
    title: "Evening Aarti & Sacred Satsang",
    description:
      "Envisioned collective fellowship: peaceful temple evening sandhya broadcasts and moderated cross-generational philosophical discussions.",
    detailBadge: "Planned: Community Fellowships",
  },
];

export function ExperiencePreview() {
  return (
    <section id="experience" className="experienceSection" aria-labelledby="experienceHeading">
      <div className="experienceHeader">
        <p className="sectionKicker">Future Experience Preview &bull; Platform Journey</p>
        <h2 id="experienceHeading" className="sectionTitle">
          Envisioned Rhythm in Everyday Living
        </h2>
        <p className="sectionSubtitle">
          Designed not for endless scrolling, but for purposeful, reverent moments throughout the day. Below is an architectural preview of how the planned YUGON ecosystem will accompany a seeker's daily routine once fully deployed.
        </p>
      </div>

      <div className="timelineContainer">
        {steps.map((step, idx) => (
          <div key={idx} className="timelineStep">
            <div className="timelineMarker">
              <span className="markerDot" />
              <span className="markerTime">{step.time}</span>
            </div>
            <div className="stepCard">
              <div className="stepFamily">{step.family}</div>
              <h3 className="stepTitle">{step.title}</h3>
              <p className="stepDescription">{step.description}</p>
              <div className="stepBadgeWrap">
                <span className="stepBadge">{step.detailBadge}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
