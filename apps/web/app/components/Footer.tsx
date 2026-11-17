"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Globe, Eye } from "lucide-react";
import { IshtiLogo } from "./brand";
import { useI18n } from "../../lib/i18n/context";
import { useA11y } from "../../lib/a11y/a11y-context";
import { LanguageModal } from "./i18n/LanguageModal";

export function Footer() {
  const { dict, locale, supportedLanguages } = useI18n();
  const { openA11yModal } = useA11y();
  const [isLangOpen, setIsLangOpen] = useState(false);

  const currentLang = supportedLanguages.find((l) => l.code === locale);

  return (
    <footer className="siteFooter" role="contentinfo">
      <div className="footerInner">
        {/* Brand identity column */}
        <div className="footerBrandColumn">
          <div className="footerBrand">
            <IshtiLogo
              variant="primary"
              decorative
              className="footerBrandLogo"
            />
          </div>
          <p className="footerTagline">{dict.common.brandTagline}</p>
          <p className="footerDescription">
            {locale === "hi"
              ? "भारत की पावन सनातन परम्पराओं से प्रेरित एक आधुनिक आध्यात्मिक व्यवस्था, जो तकनीक के माध्यम से प्रामाणिक ज्ञान, साधना और सत्संग को सर्वसुलभ बनाती है।"
              : "A modern spiritual ecosystem inspired by India’s timeless traditions, built to make authentic spiritual knowledge, practices and communities accessible through technology."}
          </p>
          <div className="footerScriptureQuote">
            <p className="sanskritLine">सङ्गच्छध्वं संवदध्वं सं वो मनांसि जानताम् ।</p>
            <p className="sanskritMeaning">“Walk together, speak together, let your minds be of one accord.” — Rigveda 10.191.2 (Samjnana Sukta)</p>
          </div>
        </div>

        {/* Link navigation columns */}
        <div className="footerLinksGrid">
          <div className="footerColumn">
            <h4 className="footerColumnTitle">
              {locale === "hi" ? "आध्यात्मिक प्रकल्प" : "Our Ecosystem"}
            </h4>
            <ul className="footerLinksList">
              <li><Link href="/puja">ISHTI Puja ({dict.nav.puja})</Link></li>
              <li><Link href="/astro">ISHTI Astro ({dict.nav.astro})</Link></li>
              <li><Link href="/bhakti">ISHTI Bhakti ({dict.nav.bhakti})</Link></li>
              <li><Link href="/panchang">ISHTI Panchang ({dict.nav.panchang})</Link></li>
              <li><Link href="/experts">ISHTI Experts ({dict.nav.experts})</Link></li>
              <li><Link href="/community">ISHTI Community ({dict.nav.community})</Link></li>
            </ul>
          </div>

          <div className="footerColumn">
            <h4 className="footerColumnTitle">
              {locale === "hi" ? "विश्वास एवं मर्यादा" : "Trust & Governance"}
            </h4>
            <ul className="footerLinksList">
              <li><Link href="/legal">Global Policy Centre</Link></li>
              <li><Link href="/legal/terms">Terms of Service</Link></li>
              <li><Link href="/legal/privacy">Privacy &amp; Data Sanctuary</Link></li>
              <li><Link href="/legal/refunds">Refund &amp; Cancellation</Link></li>
              <li><Link href="/profile/consent">Consent Management</Link></li>
              <li><Link href="/legal/grievance">Grievance Redressal</Link></li>
            </ul>
          </div>

          <div className="footerColumn">
            <h4 className="footerColumnTitle">
              {locale === "hi" ? "समावेशी सुगमता" : "Universal Inclusion"}
            </h4>
            <ul className="footerLinksList">
              <li>
                <button
                  type="button"
                  onClick={openA11yModal}
                  className="footerActionLink"
                >
                  <Eye size={14} strokeWidth={1.8} aria-hidden="true" />
                  <span>{dict.common.accessibility}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setIsLangOpen(true)}
                  className="footerActionLink"
                >
                  <Globe size={14} strokeWidth={1.8} aria-hidden="true" />
                  <span>
                    {dict.common.selectLanguage} ({currentLang?.nativeName})
                  </span>
                </button>
              </li>
              <li><a href="/#trust">Senior-Friendly Design</a></li>
              <li><a href="/#trust">High-Contrast &amp; Text Scaling</a></li>
            </ul>
          </div>

          <div className="footerColumn">
            <h4 className="footerColumnTitle">
              {locale === "hi" ? "दर्शन एवं सम्पर्क" : "Philosophy & Vision"}
            </h4>
            <ul className="footerLinksList">
              <li><a href="/#philosophy">{dict.home.philosophyTitle}</a></li>
              <li><a href="/#experience">Daily Sadhana Practice</a></li>
              <li><a href="/#early-access">Request Early Access</a></li>
              <li><Link href="/profile/consent">Privacy &amp; Data Sanctuary</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footerBottom">
        <p className="copyrightText">
          &copy; {new Date().getFullYear()} ISHTI. {dict.common.brandTagline}
        </p>
        <div className="footerBottomMeta">
          <Link href="/brand" className="hover:underline">Brand System v1.1</Link>
          <span className="metaDivider">&bull;</span>
          <Link href="/legal" className="hover:underline">Legal &amp; Policy Centre</Link>
          <span className="metaDivider">&bull;</span>
          <Link href="/profile/consent" className="hover:underline">DPDP Privacy Rights</Link>
          <span className="metaDivider">&bull;</span>
          <span>WCAG 2.2 Accessible System</span>
        </div>
      </div>

      <LanguageModal isOpen={isLangOpen} onClose={() => setIsLangOpen(false)} />
    </footer>
  );
}
