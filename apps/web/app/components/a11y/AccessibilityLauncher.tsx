"use client";

import React from "react";
import { Eye, VolumeX, Mic } from "lucide-react";
import { useA11y } from "../../../lib/a11y/a11y-context";
import { useI18n } from "../../../lib/i18n/context";

export function AccessibilityLauncher() {
  const {
    openA11yModal,
    isSpeaking,
    stopSpeaking,
    voiceNavActive,
  } = useA11y();
  const { dict } = useI18n();

  return (
    <aside
      className="a11yFloatingLauncherGroup"
      aria-label="Universal Accessibility Controls"
    >
      {/* Speech Active Quick Stop Button */}
      {isSpeaking && (
        <button
          type="button"
          onClick={stopSpeaking}
          className="a11yFloatingStopBtn"
          aria-label="Stop reading page aloud"
          title="Stop reading page aloud"
        >
          <VolumeX size={18} strokeWidth={2} />
          <span className="a11yFloatingBtnLabel">Stop Audio</span>
        </button>
      )}

      {/* Voice Nav Indicator Pill */}
      {voiceNavActive && (
        <div className="a11yVoicePill" role="status" aria-live="polite">
          <Mic size={14} strokeWidth={2} className="a11yVoicePillPulse" />
          <span>Voice Nav Active</span>
        </div>
      )}

      {/* Persistent Accessibility Centre Launcher */}
      <button
        type="button"
        onClick={openA11yModal}
        className="a11yLauncherBtn"
        aria-label={dict.common.accessibility}
        title={dict.common.accessibility}
      >
        <span className="a11yLauncherIcon" aria-hidden="true">
          <Eye size={20} strokeWidth={2} />
        </span>
        <span className="a11yLauncherText">
          {dict.common.accessibility}
        </span>
      </button>
    </aside>
  );
}
