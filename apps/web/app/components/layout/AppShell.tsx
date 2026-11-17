"use client";

import React from "react";
import { AuthProvider } from "../../../lib/auth/auth-context";
import { I18nProvider } from "../../../lib/i18n/context";
import { A11yProvider } from "../../../lib/a11y/a11y-context";
import { DesktopHeader } from "./DesktopHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { Footer } from "../Footer";
import { AuthModal } from "../auth/AuthModal";
import { AccessibilityModal } from "../a11y/AccessibilityModal";
import { AccessibilityLauncher } from "../a11y/AccessibilityLauncher";
import { FirstTimeLanguageBanner } from "../i18n/FirstTimeLanguageBanner";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <I18nProvider>
        <A11yProvider>
          <div className="ishtiAppShellWrapper">
            {/* Modern Web Guidance: Accessible Skip to Content Link */}
            <a href="#main-content" className="srOnly focus:notSrOnly ishtiSkipLink">
              Skip to main content
            </a>

            {/* First-Time Seeker Language Onboarding Preference Banner */}
            <FirstTimeLanguageBanner />

            {/* Global Desktop & Tablet Header */}
            <DesktopHeader />

            {/* Semantic Landmark Main */}
            <main id="main-content" className="ishtiAppMain">
              {children}
            </main>

            {/* Global Vedic Footer */}
            <Footer />

            {/* Fixed Mobile Bottom Navigation */}
            <MobileBottomNav />

            {/* Global Native <dialog> Auth Modal */}
            <AuthModal />

            {/* Persistent Accessibility Settings Modal */}
            <AccessibilityModal />

            {/* Floating Accessible Inclusion Controls Launcher */}
            <AccessibilityLauncher />
          </div>
        </A11yProvider>
      </I18nProvider>
    </AuthProvider>
  );
}
