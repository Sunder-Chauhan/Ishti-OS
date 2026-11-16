"use client";

import React from "react";
import { AuthProvider } from "../../../lib/auth/auth-context";
import { DesktopHeader } from "./DesktopHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { Footer } from "../Footer";
import { AuthModal } from "../auth/AuthModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="ishtiAppShellWrapper">
        {/* Modern Web Guidance: Accessible Skip to Content Link */}
        <a href="#main-content" className="srOnly focus:notSrOnly ishtiSkipLink">
          Skip to main content
        </a>

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
      </div>
    </AuthProvider>
  );
}
