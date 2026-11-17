"use client";

import React, { useRef, useEffect } from "react";
import {
  X,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  Eye,
  Type,
  Sun,
  Moon,
  Contrast,
  Check,
} from "lucide-react";
import { useA11y } from "../../../lib/a11y/a11y-context";
import { useI18n } from "../../../lib/i18n/context";
import { ACCESSIBILITY_PROFILES } from "../../../lib/a11y/types";
import type { TextSize, ContrastMode, LineHeight, AccessibilityProfileId } from "../../../lib/a11y/types";

export function AccessibilityModal() {
  const {
    prefs,
    setTextSize,
    setLineHeight,
    setContrast,
    toggleDyslexiaFont,
    toggleReducedMotion,
    toggleHighlightLinks,
    toggleBigCursor,
    applyProfile,
    resetPreferences,
    isA11yModalOpen,
    closeA11yModal,
    isSpeaking,
    readCurrentPage,
    stopSpeaking,
    speechSupported,
    voiceNavActive,
    voiceNavSupported,
    voiceNavStatus,
    startVoiceNav,
    stopVoiceNav,
    lastVoiceCommand,
  } = useA11y();

  const { dict, locale } = useI18n();
  const t = dict.a11y;
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // Manage native <dialog> open/close lifecycle
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isA11yModalOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isA11yModalOpen]);

  // Click outside to dismiss
  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    const isInDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;

    if (!isInDialog) {
      closeA11yModal();
    }
  };

  const textSizes: TextSize[] = [100, 115, 125, 140, 150, 175, 200];

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        closeA11yModal();
      }}
      onClick={handleDialogClick}
      className="a11yDialog"
      aria-labelledby="a11yTitle"
      aria-modal="true"
    >
      <div className="a11yPanelInner">
        {/* Header */}
        <div className="a11yPanelHeader">
          <div>
            <div className="a11yHeaderKicker">
              <Sparkles size={14} strokeWidth={1.8} />
              <span>ISHTI Universal Inclusion</span>
            </div>
            <h2 id="a11yTitle" className="a11yTitle">
              {t.title}
            </h2>
            <p className="a11ySubtitle">{t.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={closeA11yModal}
            className="a11yCloseBtn"
            aria-label={dict.common.close}
          >
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>

        {/* Quick Profiles */}
        <section className="a11ySection" aria-labelledby="a11yProfilesHeading">
          <h3 id="a11yProfilesHeading" className="a11ySectionTitle">
            {t.profilesTitle}
          </h3>
          <div className="a11yProfilesGrid">
            {ACCESSIBILITY_PROFILES.map((profile) => {
              const isActive = prefs.activeProfile === profile.id;
              const name = locale === "hi" ? profile.name.hi : profile.name.en;
              const desc = locale === "hi" ? profile.description.hi : profile.description.en;

              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => applyProfile(profile.id as AccessibilityProfileId)}
                  className={`a11yProfileCard ${isActive ? "a11yProfileCardActive" : ""}`}
                  aria-pressed={isActive}
                >
                  <div className="a11yProfileCardHeader">
                    <span className="a11yProfileName">{name}</span>
                    {isActive && <Check size={16} strokeWidth={2.4} className="a11yActiveCheck" />}
                  </div>
                  <p className="a11yProfileDesc">{desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Individual Display Controls */}
        <section className="a11ySection" aria-labelledby="a11yDisplayHeading">
          <h3 id="a11yDisplayHeading" className="a11ySectionTitle">
            Display &amp; Readability Controls
          </h3>

          {/* Text Size */}
          <div className="a11yControlRow">
            <div className="a11yControlLabel">
              <Type size={16} strokeWidth={1.8} />
              <span>{t.textSize}</span>
              <span className="a11yValueBadge">{prefs.textSize}%</span>
            </div>
            <div className="a11yButtonGroup">
              {textSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setTextSize(size)}
                  className={`a11yBtnOption ${prefs.textSize === size ? "a11yBtnOptionActive" : ""}`}
                  aria-pressed={prefs.textSize === size}
                >
                  {size}%
                </button>
              ))}
            </div>
          </div>

          {/* Line Height */}
          <div className="a11yControlRow">
            <div className="a11yControlLabel">
              <span>{t.lineHeight}</span>
            </div>
            <div className="a11yButtonGroup">
              {(["normal", "relaxed", "loose"] as LineHeight[]).map((lh) => (
                <button
                  key={lh}
                  type="button"
                  onClick={() => setLineHeight(lh)}
                  className={`a11yBtnOption ${prefs.lineHeight === lh ? "a11yBtnOptionActive" : ""}`}
                  aria-pressed={prefs.lineHeight === lh}
                >
                  {lh === "normal" ? "Standard" : lh === "relaxed" ? "Relaxed (1.8)" : "Loose (2.1)"}
                </button>
              ))}
            </div>
          </div>

          {/* Contrast Mode */}
          <div className="a11yControlRow">
            <div className="a11yControlLabel">
              <Contrast size={16} strokeWidth={1.8} />
              <span>{t.contrast}</span>
            </div>
            <div className="a11yButtonGroup">
              <button
                type="button"
                onClick={() => setContrast("normal")}
                className={`a11yBtnOption ${prefs.contrast === "normal" ? "a11yBtnOptionActive" : ""}`}
                aria-pressed={prefs.contrast === "normal"}
              >
                <Sun size={14} strokeWidth={1.8} />
                <span>{t.normalContrast}</span>
              </button>
              <button
                type="button"
                onClick={() => setContrast("high_contrast")}
                className={`a11yBtnOption ${prefs.contrast === "high_contrast" ? "a11yBtnOptionActive" : ""}`}
                aria-pressed={prefs.contrast === "high_contrast"}
              >
                <Contrast size={14} strokeWidth={1.8} />
                <span>{t.highContrast}</span>
              </button>
              <button
                type="button"
                onClick={() => setContrast("dark")}
                className={`a11yBtnOption ${prefs.contrast === "dark" ? "a11yBtnOptionActive" : ""}`}
                aria-pressed={prefs.contrast === "dark"}
              >
                <Moon size={14} strokeWidth={1.8} />
                <span>{t.darkTheme}</span>
              </button>
            </div>
          </div>

          {/* Toggles Grid */}
          <div className="a11yTogglesGrid">
            <label className="a11yToggleItem">
              <input
                type="checkbox"
                checked={prefs.dyslexiaFont}
                onChange={toggleDyslexiaFont}
                className="a11yCheckbox"
              />
              <span className="a11yToggleLabel">{t.dyslexiaFont}</span>
            </label>

            <label className="a11yToggleItem">
              <input
                type="checkbox"
                checked={prefs.reducedMotion}
                onChange={toggleReducedMotion}
                className="a11yCheckbox"
              />
              <span className="a11yToggleLabel">{t.reducedMotion}</span>
            </label>

            <label className="a11yToggleItem">
              <input
                type="checkbox"
                checked={prefs.highlightLinks}
                onChange={toggleHighlightLinks}
                className="a11yCheckbox"
              />
              <span className="a11yToggleLabel">{t.highlightLinks}</span>
            </label>

            <label className="a11yToggleItem">
              <input
                type="checkbox"
                checked={prefs.bigCursor}
                onChange={toggleBigCursor}
                className="a11yCheckbox"
              />
              <span className="a11yToggleLabel">Large Reading Cursor</span>
            </label>
          </div>
        </section>

        {/* Assistive Audio & Voice Controls */}
        <section className="a11ySection" aria-labelledby="a11yAssistiveHeading">
          <h3 id="a11yAssistiveHeading" className="a11ySectionTitle">
            Assistive Speech &amp; Voice Commands
          </h3>
          <div className="a11yAssistiveGrid">
            {/* Read Aloud */}
            <div className="a11yAssistiveCard">
              <div className="a11yAssistiveCardHeader">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Volume2 size={18} strokeWidth={1.8} color="var(--ishti-temple-maroon)" />
                  <span style={{ fontWeight: 600 }}>{t.readAloud}</span>
                </div>
                {speechSupported ? (
                  <span className="a11yStatusPill">Supported</span>
                ) : (
                  <span className="a11yStatusPillDisabled">Browser Unsupported</span>
                )}
              </div>
              <p className="a11yAssistiveDesc">
                Listen to the current page read aloud at a gentle, comfortable pace in your chosen language.
              </p>
              <div style={{ marginTop: "12px", display: "flex", gap: "10px" }}>
                {!isSpeaking ? (
                  <button
                    type="button"
                    onClick={readCurrentPage}
                    disabled={!speechSupported}
                    className="a11yActionBtn"
                  >
                    <Volume2 size={15} strokeWidth={1.8} />
                    <span>Start Reading Page</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopSpeaking}
                    className="a11yActionBtnDestructive"
                  >
                    <VolumeX size={15} strokeWidth={1.8} />
                    <span>Stop Reading</span>
                  </button>
                )}
              </div>
            </div>

            {/* Voice Navigation */}
            <div className="a11yAssistiveCard">
              <div className="a11yAssistiveCardHeader">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Mic size={18} strokeWidth={1.8} color="var(--ishti-temple-maroon)" />
                  <span style={{ fontWeight: 600 }}>{t.voiceNav}</span>
                </div>
                {voiceNavSupported ? (
                  <span className={voiceNavActive ? "a11yStatusPillActive" : "a11yStatusPill"}>
                    {voiceNavStatus === "listening" ? "Listening..." : "Inactive"}
                  </span>
                ) : (
                  <span className="a11yStatusPillDisabled">Requires Chrome/Edge</span>
                )}
              </div>
              <p className="a11yAssistiveDesc">
                Navigate modules with spoken commands: <em>&quot;Bhakti&quot;</em>, <em>&quot;Panchang&quot;</em>, <em>&quot;Large text&quot;</em>, <em>&quot;Home&quot;</em>.
              </p>
              <div
                className="a11yPrivacyNotice"
                role="note"
                style={{
                  marginTop: "8px",
                  padding: "8px 10px",
                  background: "rgba(113, 27, 22, 0.05)",
                  borderLeft: "3px solid var(--ishti-temple-maroon)",
                  borderRadius: "4px",
                  fontSize: "12px",
                  lineHeight: "1.45",
                  color: "var(--charcoal, #20251F)",
                }}
              >
                <strong>Privacy Disclosure:</strong> Voice navigation is strictly opt-in. ISHTI does not record, store, or transmit your audio to application servers. Spoken speech is processed through your browser&apos;s speech recognition engine (which in Google Chrome and Microsoft Edge may transmit audio snippets to browser vendor servers for transcription).
              </div>
              {lastVoiceCommand && (
                <div className="a11yLastCommand">
                  Heard: <strong>&ldquo;{lastVoiceCommand}&rdquo;</strong>
                </div>
              )}
              <div style={{ marginTop: "12px", display: "flex", gap: "10px" }}>
                {!voiceNavActive ? (
                  <button
                    type="button"
                    onClick={startVoiceNav}
                    disabled={!voiceNavSupported}
                    className="a11yActionBtn"
                  >
                    <Mic size={15} strokeWidth={1.8} />
                    <span>Enable Voice Commands</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopVoiceNav}
                    className="a11yActionBtnDestructive"
                  >
                    <MicOff size={15} strokeWidth={1.8} />
                    <span>Disable Voice Navigation</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Footer Actions */}
        <div className="a11yPanelFooter">
          <button
            type="button"
            onClick={resetPreferences}
            className="a11yResetBtn"
          >
            <RotateCcw size={14} strokeWidth={1.8} />
            <span>{t.resetDefaults}</span>
          </button>
          <button
            type="button"
            onClick={closeA11yModal}
            className="signInButton"
            style={{ padding: "10px 22px" }}
          >
            {dict.common.close}
          </button>
        </div>
      </div>
    </dialog>
  );
}
