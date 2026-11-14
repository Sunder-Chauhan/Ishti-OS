import React from "react";
import { Emblem } from "./Emblem";

export function CtaSection() {
  return (
    <section id="early-access" className="ctaSection" aria-labelledby="ctaHeading">
      <div className="ctaContent">
        <Emblem size={52} variant="gold" className="ctaEmblem" />
        <p className="ctaKicker">Milestone M01 Blueprint & Roadmap</p>
        <h2 id="ctaHeading" className="ctaHeading">
          The Foundation of YUGON
        </h2>
        <p className="ctaSubtitle">
          We are currently stabilizing our local-first monorepo, accessible design tokens, and canonical source standards. Public account registration and early access invitations will open in Milestone M02 following secure backend integration.
        </p>

        {/* Transparent Roadmap & Security Notice */}
        <div className="ctaRoadmapBox">
          <div className="roadmapHeader">
            <span className="roadmapDot" />
            <span className="roadmapStatusText">Platform Roadmap Status</span>
          </div>

          <div className="roadmapItems">
            <div className="roadmapItem completedItem">
              <span className="roadmapBadge">M01 &bull; Complete</span>
              <h4>Brand & Design Foundation</h4>
              <p>Visual tokens, WCAG 2.2 accessibility, responsive monorepo scaffold, and brand guidelines.</p>
            </div>

            <div className="roadmapItem upcomingItem">
              <span className="roadmapBadge">M02 &bull; Forthcoming</span>
              <h4>Secure Backend & Early Access</h4>
              <p>Encrypted user sanctuary, Supabase authentication, and early invitation registration.</p>
            </div>

            <div className="roadmapItem upcomingItem">
              <span className="roadmapBadge">M03 &bull; Planned</span>
              <h4>Canonical Content Ingestion</h4>
              <p>Vetted Grihya Sutra ritual vidhis, micro-location panchang engine, and vetted acharya network.</p>
            </div>
          </div>

          <div className="ctaNoticeBanner">
            <p>
              <strong>Notice on Submissions:</strong> To safeguard your privacy, unencrypted email collection is intentionally disabled until our secure database and consent controls are deployed.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
