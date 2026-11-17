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
import { useI18n } from "../../../lib/i18n/context";

interface BottomTab {
  id: string;
  href: string;
  icon: LucideIcon;
}

const TABS: BottomTab[] = [
  { id: "home", href: "/", icon: House },
  { id: "bhakti", href: "/bhakti", icon: BookOpen },
  { id: "panchang", href: "/panchang", icon: CalendarDays },
  { id: "puja", href: "/puja", icon: Flame },
  { id: "astro", href: "/astro", icon: Orbit },
  { id: "profile", href: "/profile", icon: UserRound },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { dict } = useI18n();

  const isTabActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const getTabLabel = (id: string) => {
    switch (id) {
      case "home": return dict.nav.home;
      case "bhakti": return dict.nav.bhakti;
      case "panchang": return dict.nav.panchang;
      case "puja": return dict.nav.puja;
      case "astro": return dict.nav.astro;
      case "profile": return dict.nav.profile;
      default: return id;
    }
  };

  return (
    <nav className="mobileBottomNav" aria-label="Mobile Bottom Navigation">
      <div className="mobileBottomNavContainer">
        {TABS.map((tab) => {
          const active = isTabActive(tab.href);
          const Icon = tab.icon;
          const label = getTabLabel(tab.id);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`mobileBottomTab ${active ? "bottomTabActive" : ""}`}
              aria-current={active ? "page" : undefined}
              aria-label={label}
            >
              <span className="bottomTabIcon" aria-hidden="true">
                <Icon size={20} strokeWidth={1.8} />
              </span>
              <span className="bottomTabLabel">{label}</span>
              {active && <span className="bottomTabActiveDot" aria-hidden="true" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
