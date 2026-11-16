"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  BookOpen,
  CalendarDays,
  Flame,
  Orbit,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../../../lib/auth/auth-context";

interface BottomTab {
  name: string;
  href: string;
  icon: LucideIcon;
  ariaLabel: string;
}

const TABS: BottomTab[] = [
  { name: "Home", href: "/", icon: House, ariaLabel: "Home Ecosystem" },
  { name: "Bhakti", href: "/bhakti", icon: BookOpen, ariaLabel: "Canonical Scriptures" },
  { name: "Panchang", href: "/panchang", icon: CalendarDays, ariaLabel: "Vedic Panchang" },
  { name: "Puja", href: "/puja", icon: Flame, ariaLabel: "Vedic Rituals & Pujas" },
  { name: "Astro", href: "/astro", icon: Orbit, ariaLabel: "Encrypted Kundli" },
  { name: "Profile", href: "/profile", icon: UserRound, ariaLabel: "Devotee Profile" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isTabActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="mobileBottomNav" aria-label="Mobile Bottom Navigation">
      <div className="mobileBottomNavContainer">
        {TABS.map((tab) => {
          const active = isTabActive(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`mobileBottomTab ${active ? "bottomTabActive" : ""}`}
              aria-current={active ? "page" : undefined}
              aria-label={tab.ariaLabel}
            >
              <span className="bottomTabIcon" aria-hidden="true">
                <Icon size={20} strokeWidth={1.8} />
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
