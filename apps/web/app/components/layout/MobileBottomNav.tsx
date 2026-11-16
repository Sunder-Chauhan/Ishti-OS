"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../../lib/auth/auth-context";

interface BottomTab {
  name: string;
  href: string;
  icon: string;
  ariaLabel: string;
}

const TABS: BottomTab[] = [
  { name: "Home", href: "/", icon: "🏛️", ariaLabel: "Home Ecosystem" },
  { name: "Bhakti", href: "/bhakti", icon: "📜", ariaLabel: "Canonical Scriptures" },
  { name: "Panchang", href: "/panchang", icon: "📅", ariaLabel: "Vedic Panchang" },
  { name: "Astro", href: "/astro", icon: "✨", ariaLabel: "Encrypted Kundli" },
  { name: "Profile", href: "/profile", icon: "👤", ariaLabel: "Devotee Profile" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, openAuthModal } = useAuth();

  const isTabActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="mobileBottomNav" aria-label="Mobile Bottom Navigation">
      <div className="mobileBottomNavContainer">
        {TABS.map((tab) => {
          const active = isTabActive(tab.href);
          const isProfileTab = tab.href === "/profile";

          // If user clicks profile tab while logged out, we can open auth modal or let them view guest profile state
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`mobileBottomTab ${active ? "bottomTabActive" : ""}`}
              aria-current={active ? "page" : undefined}
              aria-label={tab.ariaLabel}
              onClick={(e) => {
                if (isProfileTab && !user) {
                  // Let user navigate to /profile where guest explanation is shown,
                  // or open auth modal on secondary click
                }
              }}
            >
              <span className="bottomTabIcon" aria-hidden="true">
                {tab.icon}
              </span>
              <span className="bottomTabLabel">{tab.name}</span>
              {active && <span className="bottomTabActiveDot" aria-hidden="true" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
