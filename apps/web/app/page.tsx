"use client";

import React from "react";
import { HeroVisual } from "./components/HeroVisual";
import { EcosystemCards } from "./components/EcosystemCards";
import { PhilosophySection } from "./components/PhilosophySection";
import { TrustSection } from "./components/TrustSection";
import { ExperiencePreview } from "./components/ExperiencePreview";
import { CtaSection } from "./components/CtaSection";
import { useI18n } from "../lib/i18n/context";

export default function Home() {
  const { dict } = useI18n();
  const h = dict.home;

  return (
    <div className="pageWrapper">
      <div className="mainShell">
        {/* Hero Section */}
        <section className="heroSection" aria-labelledby="heroHeadline">
          <div className="heroGrid">
            {/* Left Editorial Text Column */}
            <div className="heroTextContent">
              <div className="heroEyebrowGroup">
                <span className="heroKicker">{h.kicker}</span>
                <span className="heroKickerDevanagari">सनातन • संस्कृति • साधना</span>
              </div>

              <h1 id="heroHeadline" className="heroHeadline">
                {h.headline} <br />
                <span className="headlineHighlight">{h.headlineHighlight}</span>
              </h1>

              <p className="heroLead">
                {h.lead}
              </p>

              <div className="heroActions">
                <a href="#ecosystem" className="btnPrimary">
                  {h.exploreBtn}
                </a>
                <a href="#philosophy" className="btnSecondary">
                  {h.philosophyBtn}
                </a>
              </div>

              {/* Trust Badge Indicators */}
              <div className="heroTrustStrip">
                <div className="trustBadgeItem">
                  <span className="trustDot" />
                  <span>{h.trustCanon}</span>
                </div>
                <div className="trustBadgeItem">
                  <span className="trustDot" />
                  <span>{h.trustGuidance}</span>
                </div>
                <div className="trustBadgeItem">
                  <span className="trustDot" />
                  <span>{h.trustAcharyas}</span>
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
