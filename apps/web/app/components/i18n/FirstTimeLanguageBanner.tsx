"use client";

import React, { useState, useEffect } from "react";
import { Globe, X, Check } from "lucide-react";
import { useI18n } from "../../../lib/i18n/context";

const BANNER_DISMISSED_KEY = "ishti_lang_banner_dismissed_v1";

export function FirstTimeLanguageBanner() {
  const { locale, setLocale } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
      if (!dismissed) {
        // Show after 1 second of pleasant browsing
        const timer = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(BANNER_DISMISSED_KEY, "true");
    }
  };

  if (!visible) return null;

  return (
    <aside
      className="firstTimeLangBanner"
      role="region"
      aria-label="Language & Accessibility Welcome Preference"
    >
      <div className="firstTimeLangInner">
        <div className="firstTimeLangLeft">
          <div className="firstTimeGlobeIcon" aria-hidden="true">
            <Globe size={18} strokeWidth={1.8} />
          </div>
          <div>
            <p className="firstTimeTitle">
              Welcome to ISHTI &bull; इष्टि में आपका स्वागत है
            </p>
            <p className="firstTimeSubtitle">
              Select your preferred language for scripture reading and daily sadhana:
            </p>
          </div>
        </div>

        <div className="firstTimeLangActions">
          <button
            type="button"
            onClick={() => {
              setLocale("en");
              dismiss();
            }}
            className={`firstTimeLangBtn ${locale === "en" ? "firstTimeLangBtnActive" : ""}`}
          >
            {locale === "en" && <Check size={13} strokeWidth={2.4} />}
            <span>English</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setLocale("hi");
              dismiss();
            }}
            className={`firstTimeLangBtn ${locale === "hi" ? "firstTimeLangBtnActive" : ""}`}
          >
            {locale === "hi" && <Check size={13} strokeWidth={2.4} />}
            <span>हिन्दी (Hindi)</span>
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="firstTimeCloseBtn"
            aria-label="Dismiss language welcome"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </aside>
  );
}
