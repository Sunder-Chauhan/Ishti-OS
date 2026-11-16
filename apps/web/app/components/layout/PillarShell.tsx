import React from "react";
import {
  Flame,
  Orbit,
  CalendarDays,
  BookOpen,
  UsersRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Breadcrumbs, type BreadcrumbItem } from "./Breadcrumbs";

export type PillarKey =
  | "puja"
  | "astro"
  | "bhakti"
  | "panchang"
  | "experts"
  | "community";

interface PillarShellProps {
  pillarKey: PillarKey;
  title: string;
  sanskritTagline?: string;
  description: string;
  breadcrumbs: BreadcrumbItem[];
  guestNotice?: string;
  actionSlot?: React.ReactNode;
  children: React.ReactNode;
}

const PILLAR_ICONS: Record<PillarKey, LucideIcon> = {
  bhakti: BookOpen,
  panchang: CalendarDays,
  puja: Flame,
  astro: Orbit,
  experts: UsersRound,
  community: Users,
};

export function PillarShell({
  pillarKey,
  title,
  sanskritTagline,
  description,
  breadcrumbs,
  guestNotice = "Public Browsing Available — No Sign-In Required",
  actionSlot,
  children,
}: PillarShellProps) {
  const IconComponent = PILLAR_ICONS[pillarKey] || Flame;

  return (
    <div className={`pillarShell pillar-${pillarKey}`}>
      <div className="pillarContainer">
        {/* Breadcrumb Navigation */}
        <div className="pillarBreadcrumbsWrapper">
          <Breadcrumbs items={breadcrumbs} />
        </div>

        {/* Pillar Header */}
        <header className="pillarHeader">
          <div className="pillarHeaderMain">
            <div className="pillarIconBadge" aria-hidden="true">
              <IconComponent size={26} strokeWidth={1.8} className="pillarHeroIcon" />
            </div>
            <div className="pillarTitles">
              {sanskritTagline && (
                <p className="pillarSanskritTagline">{sanskritTagline}</p>
              )}
              <h1 className="pillarTitle">{title}</h1>
              <p className="pillarDescription">{description}</p>
            </div>
          </div>

          <div className="pillarHeaderAside">
            {guestNotice && (
              <div className="pillarGuestBadge" role="status">
                <span className="guestBadgeDot" aria-hidden="true" />
                <span className="guestBadgeText">{guestNotice}</span>
              </div>
            )}
            {actionSlot && <div className="pillarActionSlot">{actionSlot}</div>}
          </div>
        </header>

        {/* Pillar Content Body */}
        <section className="pillarContent">{children}</section>
      </div>
    </div>
  );
}
