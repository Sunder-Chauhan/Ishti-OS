import React from "react";
import { Emblem } from "./Emblem";
import { EarlyAccessForm } from "./EarlyAccessForm";

export function CtaSection() {
  return (
    <section id="early-access" className="ctaSection" aria-labelledby="ctaHeading">
      <div className="ctaContent">
        <Emblem size={52} variant="gold" className="ctaEmblem" />
        <p className="ctaKicker">Milestone M02 &bull; Early Access</p>
        <h2 id="ctaHeading" className="ctaHeading">
          Join the Foundation of YUGON
        </h2>
        <p className="ctaSubtitle">
          Be among the first to experience a connected spiritual ecosystem that unites authentic Vedic heritage with modern, reliable technology.
        </p>

        {/* Real Early Access Registration Form */}
        <EarlyAccessForm />

        {/* Transparent Roadmap Status */}
        <div className="ctaRoadmapBox">
          <div className="roadmapHeader">
            <span className="roadmapDot" />
            <span className="roadmapStatusText">Platform Roadmap Status</span>
          </div>

          <div className="roadmapItems">
            <div className="roadmapItem completedItem">
              <span className="roadmapBadge">M01 &bull; Complete</span>
              <h4>Brand & Design Foundation</h4>
              <p>Visual tokens, WCAG 2.2 accessibility, responsive monorepo scaffold, and verified Vedic citations.</p>
            </div>

            <div className="roadmapItem completedItem">
              <span className="roadmapBadge">M02 &bull; In Progress</span>
              <h4>Secure Backend & Early Access</h4>
              <p>Supabase authentication setup, DPDP Act 2023 compliance contracts, encrypted PII models, and early access registration.</p>
            </div>

            <div className="roadmapItem upcomingItem">
              <span className="roadmapBadge">M03 &bull; Planned</span>
              <h4>Canonical Content Ingestion</h4>
              <p>Vetted Grihya Sutra ritual vidhis, micro-location panchang engine, and vetted acharya network.</p>
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
