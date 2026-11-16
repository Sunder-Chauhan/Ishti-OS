import React from "react";
import Link from "next/link";
import { IshtiLogoIcon } from "./brand";

export function Footer() {
  return (
    <footer className="siteFooter" role="contentinfo">
      <div className="footerInner">
        {/* Brand identity column */}
        <div className="footerBrandColumn">
          <div className="footerBrand">
            <IshtiLogoIcon size={38} decorative />
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
              <li><Link href="/puja">ISHTI Puja</Link></li>
              <li><Link href="/astro">ISHTI Astro</Link></li>
              <li><Link href="/bhakti">ISHTI Bhakti</Link></li>
              <li><Link href="/panchang">ISHTI Panchang</Link></li>
              <li><Link href="/experts">ISHTI Experts</Link></li>
              <li><Link href="/community">ISHTI Community</Link></li>
            </ul>
          </div>

          <div className="footerColumn">
            <h4 className="footerColumnTitle">Trust & Governance</h4>
            <ul className="footerLinksList">
              <li><Link href="/bhakti">Verified Shastric Sources</Link></li>
              <li><Link href="/experts">Living Traditions & Pandits</Link></li>
              <li><Link href="/profile/consent">DPDP Act 2023 Consent</Link></li>
              <li><Link href="/profile">Devotee Profile Sanctuary</Link></li>
              <li><Link href="/brand">Brand Identity Guidelines</Link></li>
            </ul>
          </div>

          <div className="footerColumn">
            <h4 className="footerColumnTitle">Philosophy</h4>
            <ul className="footerLinksList">
              <li><a href="/#philosophy">Our Purpose & Vision</a></li>
              <li><a href="/#philosophy">Tradition & Technology</a></li>
              <li><a href="/#experience">Daily Sadhana Practice</a></li>
              <li><a href="/#early-access">Request Early Access</a></li>
            </ul>
          </div>

          <div className="footerColumn">
            <h4 className="footerColumnTitle">Transparency</h4>
            <ul className="footerLinksList">
              <li><Link href="/profile/consent">DPDP Act 2023 Sanctuary</Link></li>
              <li><a href="/#trust">No Commercial Fear Claims</a></li>
              <li><a href="/#trust">Transparent Expert Honorariums</a></li>
              <li><a href="/#trust">Accessibility Commitment</a></li>
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
          <Link href="/brand" className="hover:underline">Brand System v1.1</Link>
          <span className="metaDivider">&bull;</span>
          <Link href="/profile/consent" className="hover:underline">DPDP Privacy Rights</Link>
          <span className="metaDivider">&bull;</span>
          <span>WCAG 2.2 Accessible System</span>
        </div>
      </div>
    </footer>
  );
}
