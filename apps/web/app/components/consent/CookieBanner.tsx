"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Check, X, Settings2 } from "lucide-react";
import {
  getCookiePreferences,
  saveCookiePreferences,
  hasAnsweredCookieConsent,
} from "../../../lib/consent/cookie-consent";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [functional, setFunctional] = useState(true);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    if (!hasAnsweredCookieConsent()) {
      setIsVisible(true);
      const initial = getCookiePreferences();
      setFunctional(initial.functional);
      setAnalytics(initial.analytics);
    }
  }, []);

  if (!isVisible) return null;

  const handleAcceptAll = () => {
    saveCookiePreferences({ functional: true, analytics: true });
    setIsVisible(false);
  };

  const handleAcceptEssentialOnly = () => {
    saveCookiePreferences({ functional: false, analytics: false });
    setIsVisible(false);
  };

  const handleSaveCustom = () => {
    saveCookiePreferences({ functional, analytics });
    setIsVisible(false);
  };

  return (
    <aside
      role="region"
      aria-label="Cookie and telemetry preferences"
      style={{
        position: "fixed",
        bottom: "20px",
        left: "20px",
        right: "20px",
        maxWidth: "680px",
        margin: "0 auto",
        zIndex: 9999,
        backgroundColor: "#FFFFFF",
        border: "1px solid var(--border-card)",
        borderRadius: "14px",
        boxShadow: "0 10px 30px rgba(40, 42, 54, 0.15)",
        padding: "20px 24px",
        fontFamily: "var(--font-sans), sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
        <div
          style={{
            padding: "8px",
            borderRadius: "50%",
            backgroundColor: "rgba(113, 27, 22, 0.08)",
            color: "var(--ishti-temple-maroon)",
            flexShrink: 0,
            marginTop: "2px",
          }}
        >
          <Shield size={20} aria-hidden="true" />
        </div>

        <div style={{ flex: 1 }}>
          <h2
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "var(--ishti-temple-charcoal)",
              marginBottom: "6px",
            }}
          >
            Your Sacred Privacy &amp; Data Sanctuary
          </h2>
          <p
            style={{
              fontSize: "13px",
              color: "var(--ishti-warm-bronze)",
              lineHeight: 1.5,
              marginBottom: "14px",
            }}
          >
            ISHTI uses strictly essential storage for security and session integrity. We never deploy
            third-party advertising cookies or cross-site tracking pixels. With your permission, we also
            store your accessibility preferences and privacy-preserving, zero-PII reader diagnostics. Read our{" "}
            <Link
              href="/legal/cookies"
              style={{ color: "var(--ishti-temple-maroon)", textDecoration: "underline" }}
            >
              Cookie Policy
            </Link>
            .
          </p>

          {/* Granular Customization Panel */}
          {showCustomize && (
            <div
              style={{
                backgroundColor: "#FAF7F2",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                padding: "14px",
                marginBottom: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {/* Essential Cookies */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>
                    Strictly Essential Storage
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--ishti-warm-bronze)" }}>
                    Required for session authentication, CSRF, and security. Cannot be disabled.
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(113, 27, 22, 0.1)",
                    color: "var(--ishti-temple-maroon)",
                  }}
                >
                  REQUIRED
                </span>
              </div>

              {/* Functional Cookies */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>
                    Accessibility &amp; Language Preferences
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--ishti-warm-bronze)" }}>
                    Remembers text scaling, high-contrast mode, and chosen language.
                  </div>
                </div>
                <label className="consentSwitch" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={functional}
                    onChange={(e) => setFunctional(e.target.checked)}
                    className="consentSwitchInput"
                    aria-label="Toggle functional cookies"
                  />
                  <span className="consentSwitchSlider" />
                </label>
              </div>

              {/* Analytics */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>
                    Aggregated Zero-PII Reader Telemetry
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--ishti-warm-bronze)" }}>
                    Measures scripture render speeds and error rates without logging personal data.
                  </div>
                </div>
                <label className="consentSwitch" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="consentSwitchInput"
                    aria-label="Toggle telemetry cookies"
                  />
                  <span className="consentSwitchSlider" />
                </label>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
            {showCustomize ? (
              <button
                type="button"
                onClick={handleSaveCustom}
                className="btnExploreModule"
                style={{
                  padding: "8px 16px",
                  fontSize: "13px",
                  marginTop: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Check size={14} aria-hidden="true" />
                <span>Save Preferences</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="btnExploreModule"
                  style={{
                    padding: "8px 16px",
                    fontSize: "13px",
                    marginTop: 0,
                  }}
                >
                  Accept All
                </button>
                <button
                  type="button"
                  onClick={handleAcceptEssentialOnly}
                  style={{
                    padding: "8px 14px",
                    fontSize: "13px",
                    fontWeight: 600,
                    borderRadius: "8px",
                    border: "1px solid var(--border-card)",
                    backgroundColor: "#FFFFFF",
                    color: "var(--ishti-temple-charcoal)",
                    cursor: "pointer",
                  }}
                >
                  Essential Only
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomize(!showCustomize)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "8px 10px",
                    fontSize: "12px",
                    color: "var(--ishti-warm-bronze)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  <Settings2 size={13} aria-hidden="true" />
                  <span>Customize</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
