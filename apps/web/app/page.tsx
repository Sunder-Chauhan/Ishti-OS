import React from "react";
import { HeroVisual } from "./components/HeroVisual";
import { EcosystemCards } from "./components/EcosystemCards";
import { PhilosophySection } from "./components/PhilosophySection";
import { TrustSection } from "./components/TrustSection";
import { ExperiencePreview } from "./components/ExperiencePreview";
import { CtaSection } from "./components/CtaSection";

export default function Home() {
  return (
    <div className="pageWrapper">
      <div className="mainShell">
        {/* Hero Section */}
        <section className="heroSection" aria-labelledby="heroHeadline">
          <div className="heroGrid">
            {/* Left Editorial Text Column */}
            <div className="heroTextContent">
              <div className="heroEyebrowGroup">
                <span className="heroKicker">Modern Spiritual Ecosystem</span>
                <span className="heroKickerDevanagari">सनातन • संस्कृति • साधना</span>
              </div>

              <h1 id="heroHeadline" className="heroHeadline">
                Rooted in Tradition. <br />
                <span className="headlineHighlight">Connected to Today.</span>
              </h1>

              <p className="heroLead">
                ISHTI is being built to make authentic Vedic rituals, deterministic astronomical panchang, verified religious knowledge, and qualified spiritual practitioners accessible through serene, respectful technology.
              </p>

              <div className="heroActions">
                <a href="#ecosystem" className="btnPrimary">
                  Explore the Ecosystem
                </a>
                <a href="#philosophy" className="btnSecondary">
                  Our Philosophy
                </a>
              </div>

              {/* Trust Badge Indicators */}
              <div className="heroTrustStrip">
                <div className="trustBadgeItem">
                  <span className="trustDot" />
                  <span>Architecture: Canonical Sources</span>
                </div>
                <div className="trustBadgeItem">
                  <span className="trustDot" />
                  <span>Architecture: Grounded AI Safeguards</span>
                </div>
                <div className="trustBadgeItem">
                  <span className="trustDot" />
                  <span>Architecture: Vetted Acharyas</span>
                </div>
              </div>
            </div>

            {/* Right Sacred Visual */}
            <HeroVisual />
          </div>

          <EcosystemCards />
        </section>

        {/* Philosophy & Mission Section */}
        <PhilosophySection />

        {/* Trust & Religious Integrity Section */}
        <TrustSection />

        {/* Everyday Devotional Experience Preview */}
        <ExperiencePreview />

        {/* Early Access CTA Band */}
        <CtaSection />
      </div>
    </div>
  );
}
