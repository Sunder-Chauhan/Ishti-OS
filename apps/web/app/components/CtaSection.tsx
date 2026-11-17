import React from "react";
import { Emblem } from "./Emblem";
import { EarlyAccessForm } from "./EarlyAccessForm";

export function CtaSection() {
  return (
    <section id="early-access" className="ctaSection" aria-labelledby="ctaHeading">
      <div className="ctaContent">
        <Emblem size={52} variant="gold" className="ctaEmblem" />
        <p className="ctaKicker">Devotee Community &bull; Early Access</p>
        <h2 id="ctaHeading" className="ctaHeading">
          Join the Foundation of ISHTI
        </h2>
        <p className="ctaSubtitle">
          Be among the first to experience a connected spiritual ecosystem that unites authentic Vedic heritage with modern, reliable technology.
        </p>

        {/* Real Early Access Registration Form */}
        <EarlyAccessForm />

        {/* Transparent Devotee Roadmap */}
        <div className="ctaRoadmapBox">
          <div className="roadmapHeader">
            <span className="roadmapDot" />
            <span className="roadmapStatusText">Platform Journey &amp; Milestones</span>
          </div>

          <div className="roadmapItems">
            <div className="roadmapItem completedItem">
              <span className="roadmapBadge">Phase 1 &bull; Established</span>
              <h4>Sacred Brand &amp; Living Design System</h4>
              <p>Classical Vedic aesthetics, universal accessibility foundation, and authenticated shastric citations.</p>
            </div>

            <div className="roadmapItem completedItem">
              <span className="roadmapBadge">Phase 2 &bull; Current</span>
              <h4>Devotee Sanctuary &amp; Privacy Protection</h4>
              <p>Indian DPDP Act 2023 consent sovereignty, confidential astrological vault, and verified mobile sign-in.</p>
            </div>

            <div className="roadmapItem upcomingItem">
              <span className="roadmapBadge">Phase 3 &bull; Upcoming</span>
              <h4>Living Traditions &amp; Scholar Network</h4>
              <p>Vetted Grihya Sutra ritual vidhis, deterministic astronomical panchang, and accredited Acharya consultations.</p>
            </div>
          </div>

          <div className="ctaNoticeBanner">
            <p>
              <strong>Privacy Commitment:</strong> All contact data and sensitive astrological records are governed strictly by Indian Digital Personal Data Protection (DPDP) Act 2023 standards.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
