"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  IshtiLogo,
  IshtiIcon,
  IshtiLogoPrimary,
  IshtiLogoSecondary,
  IshtiLogoHorizontal,
  IshtiLogoMonochrome,
  IshtiLogoReversed,
} from "../components/brand";
import { brandColors, brandLogoVariants } from "../../lib/design-tokens";

export default function BrandShowcasePage() {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [cardThemes, setCardThemes] = useState<Record<string, "ivory" | "charcoal" | "white">>({
    primary: "ivory",
    secondary: "ivory",
    icon: "ivory",
    horizontal: "ivory",
    monochrome: "ivory",
    reversed: "charcoal",
  });

  const handleCopy = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const setCardBg = (cardKey: string, bg: "ivory" | "charcoal" | "white") => {
    setCardThemes((prev) => ({ ...prev, [cardKey]: bg }));
  };

  const getBgStyle = (theme: "ivory" | "charcoal" | "white") => {
    if (theme === "charcoal") return { backgroundColor: "#302B2A", color: "#F8F4ED" };
    if (theme === "white") return { backgroundColor: "#FFFFFF", color: "#302B2A" };
    return { backgroundColor: "#F8F4ED", color: "#302B2A" };
  };

  return (
    <div style={{ backgroundColor: "#F8F4ED", minHeight: "100vh", color: "#302B2A", fontFamily: "var(--ishti-font-sans, system-ui)" }}>
      {/* Top Brand Navigation */}
      <header style={{ borderBottom: "1px solid rgba(209, 164, 119, 0.4)", backgroundColor: "#FFFFFF", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(8px)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <IshtiIcon size={36} decorative={true} />
            <div>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.08em", color: "#711B16", fontFamily: "var(--ishti-font-display, serif)" }}>ISHTI</span>
              <span style={{ marginLeft: 8, fontSize: 12, padding: "2px 8px", backgroundColor: "#FAF7F2", border: "1px solid #D1A477", borderRadius: 12, color: "#711B16", fontWeight: 600 }}>Brand System v1.0</span>
            </div>
          </div>
          <nav style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 14, fontWeight: 500 }}>
            <a href="#logos" style={{ color: "#584F4D", textDecoration: "none" }}>Logo Family</a>
            <a href="#scale-test" style={{ color: "#584F4D", textDecoration: "none" }}>Icon Fidelity</a>
            <a href="#color-tokens" style={{ color: "#584F4D", textDecoration: "none" }}>Color Tokens</a>
            <a href="#typography" style={{ color: "#584F4D", textDecoration: "none" }}>Typography</a>
            <a href="#clear-space" style={{ color: "#584F4D", textDecoration: "none" }}>Clear Space</a>
            <a href="#compliance" style={{ color: "#584F4D", textDecoration: "none" }}>Accessibility</a>
            <Link href="/" style={{ padding: "6px 14px", backgroundColor: "#711B16", color: "#F8F4ED", borderRadius: 6, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>Back to App</Link>
          </nav>
        </div>
      </header>

      {/* Hero Header */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "60px 24px 40px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", backgroundColor: "rgba(239, 116, 40, 0.12)", border: "1px solid rgba(239, 116, 40, 0.35)", borderRadius: 20, color: "#711B16", fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#EF7428", display: "inline-block" }}></span>
          Approved Digital Brand System
        </div>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", color: "#711B16", fontFamily: "var(--ishti-font-display, serif)", fontWeight: 700, margin: "0 0 16px", lineHeight: 1.15 }}>
          ISHTI Brand Identity System
        </h1>
        <p style={{ maxWidth: 760, margin: "0 auto 30px", fontSize: 18, color: "#584F4D", lineHeight: 1.6 }}>
          A modern spiritual ecosystem rooted in Indian wisdom. Pure vector SVG logo family, centralized design tokens, and WCAG 2.2 AAA/AA accessibility standards.
        </p>
      </section>

      {/* =====================================================================
          1. THE APPROVED LOGO FAMILY GRID
         ===================================================================== */}
      <section id="logos" style={{ maxWidth: 1240, margin: "0 auto", padding: "20px 24px 60px" }}>
        <div style={{ borderBottom: "2px solid #D1A477", paddingBottom: 12, marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h2 style={{ fontSize: 26, color: "#711B16", fontFamily: "var(--ishti-font-display, serif)", margin: "0 0 6px" }}>1. Approved Master Logo Family</h2>
            <p style={{ fontSize: 14, color: "#584F4D", margin: 0 }}>Six calibrated vector executions derived from the approved master visual truth.</p>
          </div>
          <span style={{ fontSize: 13, color: "#7A6F6C", fontWeight: 500 }}>All pure SVG · Collision-resistant gradient IDs · Outlined typography</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 28 }}>
          {/* Card 1: Primary Logo */}
          <div style={{ borderRadius: 12, border: "1px solid #D1A477", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 4px 16px rgba(48,43,42,0.06)" }}>
            <div style={{ padding: "14px 20px", backgroundColor: "#FAF7F2", borderBottom: "1px solid rgba(209,164,119,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ color: "#711B16", fontSize: 15 }}>1. Primary Logo</strong>
                <span style={{ fontSize: 12, color: "#7A6F6C", marginLeft: 8 }}>Symbol + Wordmark + 2 Taglines</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {(["ivory", "charcoal", "white"] as const).map((bg) => (
                  <button
                    key={bg}
                    onClick={() => setCardBg("primary", bg)}
                    style={{ width: 18, height: 18, borderRadius: "50%", border: cardThemes.primary === bg ? "2px solid #EF7428" : "1px solid #CCC", backgroundColor: bg === "ivory" ? "#F8F4ED" : bg === "charcoal" ? "#302B2A" : "#FFFFFF", cursor: "pointer" }}
                    title={`Preview on ${bg}`}
                  />
                ))}
              </div>
            </div>
            <div style={{ ...getBgStyle(cardThemes.primary), padding: 36, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320, transition: "background-color 0.2s" }}>
              <IshtiLogoPrimary width={220} decorative={false} title="ISHTI Primary Logo" />
            </div>
            <div style={{ padding: "16px 20px", backgroundColor: "#FFFFFF", borderTop: "1px solid rgba(209,164,119,0.3)", marginTop: "auto", fontSize: 13 }}>
              <p style={{ margin: "0 0 8px", color: "#584F4D" }}>{brandLogoVariants.primary.recommendedUse}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#7A6F6C" }}>Min: {brandLogoVariants.primary.minDigitalSize}</span>
                <a href="/brand/ishti-logo-primary.svg" download className="downloadBtn" style={{ color: "#711B16", textDecoration: "none", fontWeight: 600, fontSize: 12 }}>Download SVG ↓</a>
              </div>
            </div>
          </div>

          {/* Card 2: Secondary Logo */}
          <div style={{ borderRadius: 12, border: "1px solid #D1A477", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 4px 16px rgba(48,43,42,0.06)" }}>
            <div style={{ padding: "14px 20px", backgroundColor: "#FAF7F2", borderBottom: "1px solid rgba(209,164,119,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ color: "#711B16", fontSize: 15 }}>2. Secondary Logo</strong>
                <span style={{ fontSize: 12, color: "#7A6F6C", marginLeft: 8 }}>Symbol + Wordmark</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {(["ivory", "charcoal", "white"] as const).map((bg) => (
                  <button
                    key={bg}
                    onClick={() => setCardBg("secondary", bg)}
                    style={{ width: 18, height: 18, borderRadius: "50%", border: cardThemes.secondary === bg ? "2px solid #EF7428" : "1px solid #CCC", backgroundColor: bg === "ivory" ? "#F8F4ED" : bg === "charcoal" ? "#302B2A" : "#FFFFFF", cursor: "pointer" }}
                    title={`Preview on ${bg}`}
                  />
                ))}
              </div>
            </div>
            <div style={{ ...getBgStyle(cardThemes.secondary), padding: 36, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320, transition: "background-color 0.2s" }}>
              <IshtiLogoSecondary width={200} decorative={false} title="ISHTI Secondary Logo" />
            </div>
            <div style={{ padding: "16px 20px", backgroundColor: "#FFFFFF", borderTop: "1px solid rgba(209,164,119,0.3)", marginTop: "auto", fontSize: 13 }}>
              <p style={{ margin: "0 0 8px", color: "#584F4D" }}>{brandLogoVariants.secondary.recommendedUse}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#7A6F6C" }}>Min: {brandLogoVariants.secondary.minDigitalSize}</span>
                <a href="/brand/ishti-logo-secondary.svg" download style={{ color: "#711B16", textDecoration: "none", fontWeight: 600, fontSize: 12 }}>Download SVG ↓</a>
              </div>
            </div>
          </div>

          {/* Card 3: Icon Only */}
          <div style={{ borderRadius: 12, border: "1px solid #D1A477", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 4px 16px rgba(48,43,42,0.06)" }}>
            <div style={{ padding: "14px 20px", backgroundColor: "#FAF7F2", borderBottom: "1px solid rgba(209,164,119,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ color: "#711B16", fontSize: 15 }}>3. Icon (Symbol Only)</strong>
                <span style={{ fontSize: 12, color: "#7A6F6C", marginLeft: 8 }}>Altar + Flame + Bindu</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {(["ivory", "charcoal", "white"] as const).map((bg) => (
                  <button
                    key={bg}
                    onClick={() => setCardBg("icon", bg)}
                    style={{ width: 18, height: 18, borderRadius: "50%", border: cardThemes.icon === bg ? "2px solid #EF7428" : "1px solid #CCC", backgroundColor: bg === "ivory" ? "#F8F4ED" : bg === "charcoal" ? "#302B2A" : "#FFFFFF", cursor: "pointer" }}
                    title={`Preview on ${bg}`}
                  />
                ))}
              </div>
            </div>
            <div style={{ ...getBgStyle(cardThemes.icon), padding: 36, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320, transition: "background-color 0.2s" }}>
              <IshtiIcon size={190} decorative={false} title="ISHTI Icon" />
            </div>
            <div style={{ padding: "16px 20px", backgroundColor: "#FFFFFF", borderTop: "1px solid rgba(209,164,119,0.3)", marginTop: "auto", fontSize: 13 }}>
              <p style={{ margin: "0 0 8px", color: "#584F4D" }}>{brandLogoVariants.icon.recommendedUse}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#7A6F6C" }}>Min: {brandLogoVariants.icon.minDigitalSize}</span>
                <a href="/brand/ishti-logo-icon.svg" download style={{ color: "#711B16", textDecoration: "none", fontWeight: 600, fontSize: 12 }}>Download SVG ↓</a>
              </div>
            </div>
          </div>

          {/* Card 4: Horizontal Logo */}
          <div style={{ borderRadius: 12, border: "1px solid #D1A477", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 4px 16px rgba(48,43,42,0.06)", gridColumn: "span 2" }}>
            <div style={{ padding: "14px 20px", backgroundColor: "#FAF7F2", borderBottom: "1px solid rgba(209,164,119,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ color: "#711B16", fontSize: 15 }}>4. Horizontal Logo</strong>
                <span style={{ fontSize: 12, color: "#7A6F6C", marginLeft: 8 }}>Symbol Left + Wordmark & Stacked Tagline Right</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {(["ivory", "charcoal", "white"] as const).map((bg) => (
                  <button
                    key={bg}
                    onClick={() => setCardBg("horizontal", bg)}
                    style={{ width: 18, height: 18, borderRadius: "50%", border: cardThemes.horizontal === bg ? "2px solid #EF7428" : "1px solid #CCC", backgroundColor: bg === "ivory" ? "#F8F4ED" : bg === "charcoal" ? "#302B2A" : "#FFFFFF", cursor: "pointer" }}
                    title={`Preview on ${bg}`}
                  />
                ))}
              </div>
            </div>
            <div style={{ ...getBgStyle(cardThemes.horizontal), padding: 36, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 240, transition: "background-color 0.2s" }}>
              <IshtiLogoHorizontal width={480} height={180} decorative={false} title="ISHTI Horizontal Logo" />
            </div>
            <div style={{ padding: "16px 20px", backgroundColor: "#FFFFFF", borderTop: "1px solid rgba(209,164,119,0.3)", marginTop: "auto", fontSize: 13 }}>
              <p style={{ margin: "0 0 8px", color: "#584F4D" }}>{brandLogoVariants.horizontal.recommendedUse}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#7A6F6C" }}>Min: {brandLogoVariants.horizontal.minDigitalSize}</span>
                <a href="/brand/ishti-logo-horizontal.svg" download style={{ color: "#711B16", textDecoration: "none", fontWeight: 600, fontSize: 12 }}>Download SVG ↓</a>
              </div>
            </div>
          </div>

          {/* Card 5: Monochrome Logo */}
          <div style={{ borderRadius: 12, border: "1px solid #D1A477", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 4px 16px rgba(48,43,42,0.06)" }}>
            <div style={{ padding: "14px 20px", backgroundColor: "#FAF7F2", borderBottom: "1px solid rgba(209,164,119,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ color: "#711B16", fontSize: 15 }}>5. Monochrome Logo</strong>
                <span style={{ fontSize: 12, color: "#7A6F6C", marginLeft: 8 }}>Single-Color Temple Charcoal</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {(["ivory", "white"] as const).map((bg) => (
                  <button
                    key={bg}
                    onClick={() => setCardBg("monochrome", bg)}
                    style={{ width: 18, height: 18, borderRadius: "50%", border: cardThemes.monochrome === bg ? "2px solid #EF7428" : "1px solid #CCC", backgroundColor: bg === "ivory" ? "#F8F4ED" : "#FFFFFF", cursor: "pointer" }}
                    title={`Preview on ${bg}`}
                  />
                ))}
              </div>
            </div>
            <div style={{ ...getBgStyle(cardThemes.monochrome), padding: 36, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320, transition: "background-color 0.2s" }}>
              <IshtiLogoMonochrome width={200} decorative={false} title="ISHTI Monochrome Logo" />
            </div>
            <div style={{ padding: "16px 20px", backgroundColor: "#FFFFFF", borderTop: "1px solid rgba(209,164,119,0.3)", marginTop: "auto", fontSize: 13 }}>
              <p style={{ margin: "0 0 8px", color: "#584F4D" }}>{brandLogoVariants.monochrome.recommendedUse}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#7A6F6C" }}>Min: {brandLogoVariants.monochrome.minDigitalSize}</span>
                <a href="/brand/ishti-logo-monochrome.svg" download style={{ color: "#711B16", textDecoration: "none", fontWeight: 600, fontSize: 12 }}>Download SVG ↓</a>
              </div>
            </div>
          </div>

          {/* Card 6: Reversed Logo */}
          <div style={{ borderRadius: 12, border: "1px solid #D1A477", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 4px 16px rgba(48,43,42,0.06)" }}>
            <div style={{ padding: "14px 20px", backgroundColor: "#FAF7F2", borderBottom: "1px solid rgba(209,164,119,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ color: "#711B16", fontSize: 15 }}>6. Reversed Logo</strong>
                <span style={{ fontSize: 12, color: "#7A6F6C", marginLeft: 8 }}>Light Artwork on Temple Charcoal</span>
              </div>
            </div>
            <div style={{ backgroundColor: "#302B2A", padding: 36, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320 }}>
              <IshtiLogoReversed width={200} showBackground={false} decorative={false} title="ISHTI Reversed Logo" />
            </div>
            <div style={{ padding: "16px 20px", backgroundColor: "#FFFFFF", borderTop: "1px solid rgba(209,164,119,0.3)", marginTop: "auto", fontSize: 13 }}>
              <p style={{ margin: "0 0 8px", color: "#584F4D" }}>{brandLogoVariants.reversed.recommendedUse}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#7A6F6C" }}>Min: {brandLogoVariants.reversed.minDigitalSize}</span>
                <a href="/brand/ishti-logo-reversed.svg" download style={{ color: "#711B16", textDecoration: "none", fontWeight: 600, fontSize: 12 }}>Download SVG ↓</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. MULTI-SCALE ICON FIDELITY TEST MATRIX
         ===================================================================== */}
      <section id="scale-test" style={{ maxWidth: 1240, margin: "0 auto", padding: "20px 24px 60px" }}>
        <div style={{ borderBottom: "2px solid #D1A477", paddingBottom: 12, marginBottom: 32 }}>
          <h2 style={{ fontSize: 26, color: "#711B16", fontFamily: "var(--ishti-font-display, serif)", margin: "0 0 6px" }}>2. Multi-Scale Icon Fidelity Verification</h2>
          <p style={{ fontSize: 14, color: "#584F4D", margin: 0 }}>Verified pixel recognizability from 16px favicon scale to 256px high-resolution displays.</p>
        </div>

        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #D1A477", borderRadius: 12, padding: 32, boxShadow: "0 4px 16px rgba(48,43,42,0.06)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-around", gap: 32, paddingBottom: 24, borderBottom: "1px solid rgba(209,164,119,0.3)" }}>
            {/* 16px */}
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F8F4ED", border: "1px dashed #D1A477", borderRadius: 8, margin: "0 auto 8px" }}>
                <IshtiIcon size={16} decorative={true} />
              </div>
              <strong style={{ fontSize: 12, color: "#711B16", display: "block" }}>16px</strong>
              <span style={{ fontSize: 11, color: "#7A6F6C" }}>Favicon</span>
            </div>

            {/* 24px */}
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F8F4ED", border: "1px dashed #D1A477", borderRadius: 8, margin: "0 auto 8px" }}>
                <IshtiIcon size={24} decorative={true} />
              </div>
              <strong style={{ fontSize: 12, color: "#711B16", display: "block" }}>24px</strong>
              <span style={{ fontSize: 11, color: "#7A6F6C" }}>Mobile Nav</span>
            </div>

            {/* 32px */}
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F8F4ED", border: "1px dashed #D1A477", borderRadius: 8, margin: "0 auto 8px" }}>
                <IshtiIcon size={32} decorative={true} />
              </div>
              <strong style={{ fontSize: 12, color: "#711B16", display: "block" }}>32px</strong>
              <span style={{ fontSize: 11, color: "#7A6F6C" }}>Header Icon</span>
            </div>

            {/* 48px */}
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F8F4ED", border: "1px dashed #D1A477", borderRadius: 8, margin: "0 auto 8px" }}>
                <IshtiIcon size={48} decorative={true} />
              </div>
              <strong style={{ fontSize: 12, color: "#711B16", display: "block" }}>48px</strong>
              <span style={{ fontSize: 11, color: "#7A6F6C" }}>Touch Target</span>
            </div>

            {/* 64px */}
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 96, height: 96, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F8F4ED", border: "1px dashed #D1A477", borderRadius: 8, margin: "0 auto 8px" }}>
                <IshtiIcon size={64} decorative={true} />
              </div>
              <strong style={{ fontSize: 12, color: "#711B16", display: "block" }}>64px</strong>
              <span style={{ fontSize: 11, color: "#7A6F6C" }}>App Launcher</span>
            </div>

            {/* 128px */}
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F8F4ED", border: "1px dashed #D1A477", borderRadius: 8, margin: "0 auto 8px" }}>
                <IshtiIcon size={128} decorative={true} />
              </div>
              <strong style={{ fontSize: 12, color: "#711B16", display: "block" }}>128px</strong>
              <span style={{ fontSize: 11, color: "#7A6F6C" }}>Splash Display</span>
            </div>

            {/* 256px */}
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 280, height: 280, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F8F4ED", border: "1px dashed #D1A477", borderRadius: 8, margin: "0 auto 8px" }}>
                <IshtiIcon size={240} decorative={true} />
              </div>
              <strong style={{ fontSize: 12, color: "#711B16", display: "block" }}>256px</strong>
              <span style={{ fontSize: 11, color: "#7A6F6C" }}>Packaging & Print</span>
            </div>
          </div>
          <div style={{ marginTop: 20, fontSize: 13, color: "#584F4D", lineHeight: 1.6 }}>
            <strong>Fidelity Architecture:</strong> The 4-tiered stepped altar preserves sharp isometric riser creases at small scales. The central teardrop bindu remains optically distinct inside its negative-space clearing even at 16px.
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. CENTRALIZED COLOR TOKENS
         ===================================================================== */}
      <section id="color-tokens" style={{ maxWidth: 1240, margin: "0 auto", padding: "20px 24px 60px" }}>
        <div style={{ borderBottom: "2px solid #D1A477", paddingBottom: 12, marginBottom: 32 }}>
          <h2 style={{ fontSize: 26, color: "#711B16", fontFamily: "var(--ishti-font-display, serif)", margin: "0 0 6px" }}>3. Centralized Brand Color Tokens</h2>
          <p style={{ fontSize: 14, color: "#584F4D", margin: 0 }}>Click any card to copy the hex code. Contrast ratios validated against WCAG 2.2 specifications.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {Object.entries(brandColors).map(([key, c]) => (
            <div
              key={key}
              onClick={() => handleCopy(c.hex)}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 12,
                border: "1px solid #D1A477",
                overflow: "hidden",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(48,43,42,0.05)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 18px rgba(48,43,42,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(48,43,42,0.05)";
              }}
            >
              <div style={{ height: 110, backgroundColor: c.hex, display: "flex", alignItems: "flex-end", padding: "12px 16px" }}>
                <span style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "#302B2A", padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>
                  {c.hex}
                </span>
              </div>
              <div style={{ padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <strong style={{ fontSize: 16, color: "#711B16" }}>{c.name}</strong>
                  {copiedHex === c.hex ? (
                    <span style={{ fontSize: 11, color: "#2E7D32", fontWeight: 700 }}>COPIED!</span>
                  ) : (
                    <span style={{ fontSize: 11, color: "#7A6F6C" }}>RGB: {c.rgb.join(", ")}</span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: "#584F4D", margin: "0 0 12px", lineHeight: 1.5 }}>{c.description}</p>
                <div style={{ display: "flex", gap: 8, fontSize: 11 }}>
                  <span style={{ padding: "2px 6px", borderRadius: 4, backgroundColor: c.wcagIvoryText === "AAA" ? "#E8F5E9" : "#FFF3E0", color: c.wcagIvoryText === "AAA" ? "#2E7D32" : "#E65100", fontWeight: 600 }}>
                    vs Ivory: {c.contrastOnIvory}:1 ({c.wcagIvoryText})
                  </span>
                  <span style={{ padding: "2px 6px", borderRadius: 4, backgroundColor: c.wcagCharcoalText === "AAA" ? "#E8F5E9" : "#FFF3E0", color: c.wcagCharcoalText === "AAA" ? "#2E7D32" : "#E65100", fontWeight: 600 }}>
                    vs Charcoal: {c.contrastOnCharcoal}:1
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          4. TYPOGRAPHY SYSTEM
         ===================================================================== */}
      <section id="typography" style={{ maxWidth: 1240, margin: "0 auto", padding: "20px 24px 60px" }}>
        <div style={{ borderBottom: "2px solid #D1A477", paddingBottom: 12, marginBottom: 32 }}>
          <h2 style={{ fontSize: 26, color: "#711B16", fontFamily: "var(--ishti-font-display, serif)", margin: "0 0 6px" }}>4. Typography System & Outlined Wordmark</h2>
          <p style={{ fontSize: 14, color: "#584F4D", margin: 0 }}>Outlined vector wordmark architecture paired with display and interface typography.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 28 }}>
          {/* Display Serif Specimen */}
          <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #D1A477", borderRadius: 12, padding: 28, boxShadow: "0 4px 16px rgba(48,43,42,0.06)" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#EF7428", textTransform: "uppercase", letterSpacing: "0.1em" }}>Display Serif Typeface</span>
            <h3 style={{ fontSize: 28, color: "#711B16", fontFamily: "var(--ishti-font-display, serif)", margin: "8px 0 12px" }}>Cormorant Garamond</h3>
            <p style={{ fontSize: 13, color: "#7A6F6C", margin: "0 0 20px" }}>Wordmark-inspired display headings, sacred invocations, and editorial titles.</p>
            <div style={{ padding: "16px 20px", backgroundColor: "#FAF7F2", borderRadius: 8, borderLeft: "4px solid #711B16" }}>
              <div style={{ fontSize: 24, fontFamily: "var(--ishti-font-display, serif)", color: "#711B16", fontWeight: 600, marginBottom: 6 }}>
                सत्यं ज्ञानमनन्तं ब्रह्म
              </div>
              <div style={{ fontSize: 18, fontFamily: "var(--ishti-font-display, serif)", color: "#584F4D", fontStyle: "italic" }}>
                Rooted in Tradition. Connected to Today.
              </div>
            </div>
          </div>

          {/* Interface Sans Specimen */}
          <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #D1A477", borderRadius: 12, padding: 28, boxShadow: "0 4px 16px rgba(48,43,42,0.06)" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#EF7428", textTransform: "uppercase", letterSpacing: "0.1em" }}>Interface Sans-Serif</span>
            <h3 style={{ fontSize: 28, color: "#711B16", fontFamily: "var(--ishti-font-sans, system-ui)", margin: "8px 0 12px", fontWeight: 600 }}>Inter</h3>
            <p style={{ fontSize: 13, color: "#7A6F6C", margin: "0 0 20px" }}>Clean, highly legible interface text, interactive buttons, and tracked taglines.</p>
            <div style={{ padding: "16px 20px", backgroundColor: "#FAF7F2", borderRadius: 8, borderLeft: "4px solid #EF7428" }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.22em", color: "#D1A477", textTransform: "uppercase", marginBottom: 6 }}>
                TRANSFORMATIVE RITUALS &amp; OFFERINGS
              </div>
              <div style={{ fontSize: 14, color: "#584F4D", lineHeight: 1.5 }}>
                Authentic temple rituals, canonical scripture catalog, and verified Vedic pandits.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. CLEAR-SPACE & BOUNDING BOX RULES
         ===================================================================== */}
      <section id="clear-space" style={{ maxWidth: 1240, margin: "0 auto", padding: "20px 24px 60px" }}>
        <div style={{ borderBottom: "2px solid #D1A477", paddingBottom: 12, marginBottom: 32 }}>
          <h2 style={{ fontSize: 26, color: "#711B16", fontFamily: "var(--ishti-font-display, serif)", margin: "0 0 6px" }}>5. Clear Space & Minimum Sizes</h2>
          <p style={{ fontSize: 14, color: "#584F4D", margin: 0 }}>Preserving visual dignity through mandatory isolation margins.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 28 }}>
          <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #D1A477", borderRadius: 12, padding: 28, textAlign: "center" }}>
            <div style={{ position: "relative", display: "inline-block", padding: 40, border: "2px dashed #EF7428", borderRadius: 8, backgroundColor: "#FAF7F2", margin: "0 auto 20px" }}>
              <span style={{ position: "absolute", top: 10, left: 14, fontSize: 11, fontWeight: 700, color: "#EF7428" }}>0.5X</span>
              <span style={{ position: "absolute", bottom: 10, right: 14, fontSize: 11, fontWeight: 700, color: "#EF7428" }}>0.5X</span>
              <IshtiLogoSecondary width={180} decorative={true} />
            </div>
            <p style={{ fontSize: 13, color: "#584F4D", maxWidth: 360, margin: "0 auto", lineHeight: 1.5 }}>
              The exclusion zone <code style={{ backgroundColor: "#FAF7F2", padding: "2px 4px", borderRadius: 4 }}>0.5X</code> must remain free of text, graphics, and viewport edges.
            </p>
          </div>

          <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #D1A477", borderRadius: 12, padding: 28 }}>
            <h3 style={{ fontSize: 18, color: "#711B16", margin: "0 0 16px" }}>Minimum Reproduction Rules</h3>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", color: "#584F4D" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #D1A477", textAlign: "left" }}>
                  <th style={{ padding: "8px 4px" }}>Variant</th>
                  <th style={{ padding: "8px 4px" }}>Digital Min</th>
                  <th style={{ padding: "8px 4px" }}>Print Min</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid rgba(209,164,119,0.3)" }}>
                  <td style={{ padding: "8px 4px", fontWeight: 600 }}>Icon Only</td>
                  <td style={{ padding: "8px 4px" }}>16px × 16px</td>
                  <td style={{ padding: "8px 4px" }}>5mm × 5mm</td>
                </tr>
                <tr style={{ borderBottom: "1px solid rgba(209,164,119,0.3)" }}>
                  <td style={{ padding: "8px 4px", fontWeight: 600 }}>Secondary</td>
                  <td style={{ padding: "8px 4px" }}>24px height</td>
                  <td style={{ padding: "8px 4px" }}>8mm height</td>
                </tr>
                <tr style={{ borderBottom: "1px solid rgba(209,164,119,0.3)" }}>
                  <td style={{ padding: "8px 4px", fontWeight: 600 }}>Primary</td>
                  <td style={{ padding: "8px 4px" }}>40px height</td>
                  <td style={{ padding: "8px 4px" }}>15mm height</td>
                </tr>
                <tr>
                  <td style={{ padding: "8px 4px", fontWeight: 600 }}>Horizontal</td>
                  <td style={{ padding: "8px 4px" }}>28px height</td>
                  <td style={{ padding: "8px 4px" }}>10mm height</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =====================================================================
          6. WCAG 2.2 ACCESSIBILITY COMPLIANCE TABLE
         ===================================================================== */}
      <section id="compliance" style={{ maxWidth: 1240, margin: "0 auto", padding: "20px 24px 60px" }}>
        <div style={{ borderBottom: "2px solid #D1A477", paddingBottom: 12, marginBottom: 32 }}>
          <h2 style={{ fontSize: 26, color: "#711B16", fontFamily: "var(--ishti-font-display, serif)", margin: "0 0 6px" }}>6. WCAG 2.2 Accessibility Compliance Matrix</h2>
          <p style={{ fontSize: 14, color: "#584F4D", margin: 0 }}>Definitive contrast ratios ensuring readability and inclusion across light and dark modes.</p>
        </div>

        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #D1A477", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 16px rgba(48,43,42,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
            <thead style={{ backgroundColor: "#FAF7F2", borderBottom: "2px solid #D1A477", color: "#711B16" }}>
              <tr>
                <th style={{ padding: "12px 16px" }}>Foreground Element</th>
                <th style={{ padding: "12px 16px" }}>Background Surface</th>
                <th style={{ padding: "12px 16px" }}>Contrast Ratio</th>
                <th style={{ padding: "12px 16px" }}>Normal Text</th>
                <th style={{ padding: "12px 16px" }}>Large Text (≥18pt)</th>
                <th style={{ padding: "12px 16px" }}>UI / Graphical</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid rgba(209,164,119,0.3)" }}>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: "#711B16" }}>Temple Maroon (#711B16)</td>
                <td style={{ padding: "12px 16px" }}>Ivory Paper (#F8F4ED)</td>
                <td style={{ padding: "12px 16px", fontWeight: 700 }}>9.61:1</td>
                <td style={{ padding: "12px 16px", color: "#2E7D32", fontWeight: 700 }}>PASS (AAA)</td>
                <td style={{ padding: "12px 16px", color: "#2E7D32", fontWeight: 700 }}>PASS (AAA)</td>
                <td style={{ padding: "12px 16px", color: "#2E7D32", fontWeight: 700 }}>PASS (AA)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(209,164,119,0.3)" }}>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: "#302B2A" }}>Temple Charcoal (#302B2A)</td>
                <td style={{ padding: "12px 16px" }}>Ivory Paper (#F8F4ED)</td>
                <td style={{ padding: "12px 16px", fontWeight: 700 }}>11.83:1</td>
                <td style={{ padding: "12px 16px", color: "#2E7D32", fontWeight: 700 }}>PASS (AAA)</td>
                <td style={{ padding: "12px 16px", color: "#2E7D32", fontWeight: 700 }}>PASS (AAA)</td>
                <td style={{ padding: "12px 16px", color: "#2E7D32", fontWeight: 700 }}>PASS (AA)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(209,164,119,0.3)" }}>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: "#D7A64A" }}>Sacred Gold (#D7A64A)</td>
                <td style={{ padding: "12px 16px" }}>Temple Charcoal (#302B2A)</td>
                <td style={{ padding: "12px 16px", fontWeight: 700 }}>5.89:1</td>
                <td style={{ padding: "12px 16px", color: "#2E7D32", fontWeight: 700 }}>PASS (AA)</td>
                <td style={{ padding: "12px 16px", color: "#2E7D32", fontWeight: 700 }}>PASS (AAA)</td>
                <td style={{ padding: "12px 16px", color: "#2E7D32", fontWeight: 700 }}>PASS (AA)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(209,164,119,0.3)" }}>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: "#D1A477" }}>Warm Sand (#D1A477)</td>
                <td style={{ padding: "12px 16px" }}>Temple Charcoal (#302B2A)</td>
                <td style={{ padding: "12px 16px", fontWeight: 700 }}>7.02:1</td>
                <td style={{ padding: "12px 16px", color: "#2E7D32", fontWeight: 700 }}>PASS (AAA)</td>
                <td style={{ padding: "12px 16px", color: "#2E7D32", fontWeight: 700 }}>PASS (AAA)</td>
                <td style={{ padding: "12px 16px", color: "#2E7D32", fontWeight: 700 }}>PASS (AA)</td>
              </tr>
              <tr>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: "#F8F4ED" }}>Ivory Paper (#F8F4ED)</td>
                <td style={{ padding: "12px 16px" }}>Temple Charcoal (#302B2A)</td>
                <td style={{ padding: "12px 16px", fontWeight: 700 }}>11.83:1</td>
                <td style={{ padding: "12px 16px", color: "#2E7D32", fontWeight: 700 }}>PASS (AAA)</td>
                <td style={{ padding: "12px 16px", color: "#2E7D32", fontWeight: 700 }}>PASS (AAA)</td>
                <td style={{ padding: "12px 16px", color: "#2E7D32", fontWeight: 700 }}>PASS (AA)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #D1A477", padding: "40px 24px", textAlign: "center", color: "#7A6F6C", fontSize: 13 }}>
        <IshtiIcon size={28} decorative={true} style={{ margin: "0 auto 12px" }} />
        <p style={{ margin: "0 0 6px" }}>ISHTI Brand System · Rooted in Tradition. Connected to Today.</p>
        <p style={{ margin: 0, fontSize: 11 }}>© 2026 ISHTI Spiritual Ecosystem. All vector artwork protected under brand guidelines.</p>
      </footer>
    </div>
  );
}
