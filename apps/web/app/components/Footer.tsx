import React from "react";
import { Emblem } from "./Emblem";

export function Footer() {
  return (
    <footer className="siteFooter" role="contentinfo">
      <div className="footerInner">
        {/* Brand identity column */}
        <div className="footerBrandColumn">
          <div className="footerBrand">
            <Emblem size={38} variant="gold" />
            <div className="footerBrandText">
              <span className="footerBrandName">ISHTI</span>
            </div>
          </div>
          <p className="footerTagline">Rooted in Tradition. Connected to Today.</p>
          <p className="footerDescription">
            A modern spiritual ecosystem inspired by India’s timeless traditions, built to make authentic spiritual knowledge, practices and communities accessible through technology.
          </p>
          <div className="footerScriptureQuote">
            <p className="sanskritLine">सङ्गच्छध्वं संवदध्वं सं वो मनांसि जानताम् ।</p>
            <p className="sanskritMeaning">“Walk together, speak together, let your minds be of one accord.” — Rigveda 10.191.2 (Samjnana Sukta)</p>
          </div>
        </div>

        {/* Link navigation columns */}
        <div className="footerLinksGrid">
          <div className="footerColumn">
            <h4 className="footerColumnTitle">Our Ecosystem</h4>
            <ul className="footerLinksList">
              <li><a href="#ecosystem">ISHTI Puja</a></li>
              <li><a href="#ecosystem">ISHTI Astro</a></li>
              <li><a href="#ecosystem">ISHTI Bhakti</a></li>
              <li><a href="#ecosystem">ISHTI Panchang</a></li>
              <li><a href="#ecosystem">ISHTI Experts</a></li>
              <li><a href="#ecosystem">ISHTI Community</a></li>
            </ul>
          </div>

          <div className="footerColumn">
            <h4 className="footerColumnTitle">Trust & Governance</h4>
            <ul className="footerLinksList">
              <li><a href="#trust">Verified Shastric Sources</a></li>
              <li><a href="#trust">Preserving Living Traditions</a></li>
              <li><a href="#trust">Bounded AI Principles</a></li>
              <li><a href="#trust">Scholar Verification Standards</a></li>
              <li><a href="#trust">Content Provenance & Rights</a></li>
            </ul>
          </div>

          <div className="footerColumn">
            <h4 className="footerColumnTitle">Philosophy</h4>
            <ul className="footerLinksList">
              <li><a href="#philosophy">Our Purpose & Vision</a></li>
              <li><a href="#philosophy">Tradition & Technology</a></li>
              <li><a href="#experience">A Day with ISHTI</a></li>
              <li><a href="#early-access">Request Early Access</a></li>
            </ul>
          </div>

          <div className="footerColumn">
            <h4 className="footerColumnTitle">Transparency</h4>
            <ul className="footerLinksList">
              <li><a href="#early-access">Privacy & Sanctuary</a></li>
              <li><a href="#trust">No Commercial Fear Claims</a></li>
              <li><a href="#trust">Transparent Expert Honorariums</a></li>
              <li><a href="#early-access">Accessibility Commitment</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footerBottom">
        <p className="copyrightText">
          &copy; {new Date().getFullYear()} ISHTI. Rooted in Tradition. Connected to Today. All rights reserved.
        </p>
        <div className="footerBottomMeta">
          <span>Brand Guidelines v1.0</span>
          <span className="metaDivider">&bull;</span>
          <span>WCAG 2.2 Accessible System</span>
        </div>
      </div>
    </footer>
  );
}
