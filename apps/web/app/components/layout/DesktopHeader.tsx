"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRound, X } from "lucide-react";
import { IshtiLogo } from "../brand";
import { useAuth } from "../../../lib/auth/auth-context";

interface NavItem {
  name: string;
  href: string;
  description: string;
}

const MODULE_NAV_ITEMS: NavItem[] = [
  { name: "Bhakti", href: "/bhakti", description: "Canonical scriptures & chanting" },
  { name: "Panchang", href: "/panchang", description: "Vedic calendar & muhurtas" },
  { name: "Puja", href: "/puja", description: "Vedic rituals & temple offerings" },
  { name: "Astro", href: "/astro", description: "Encrypted Kundli & planetary insights" },
  { name: "Experts", href: "/experts", description: "Vetted Pandits & Acharyas" },
  { name: "Community", href: "/community", description: "Satsang & devotional seva" },
];

export function DesktopHeader() {
  const pathname = usePathname();
  const { user, openAuthModal, signOut } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const toggleDrawer = () => setMobileDrawerOpen((prev) => !prev);
  const closeDrawer = () => setMobileDrawerOpen(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="siteHeader" role="banner">
      <div className="headerContainer">
        {/* Brand identity - auto-adjustable responsive horizontal lockup */}
        <Link href="/" className="brandLink" aria-label="ISHTI - Rooted in Tradition. Connected to Today.">
          <IshtiLogo
            variant="horizontal"
            priority
            decorative
            className="headerBrandLogo"
          />
        </Link>

        {/* Primary Desktop Navigation Links */}
        <nav className="desktopNav" aria-label="Ecosystem Navigation">
          <ul className="navLinks">
            {MODULE_NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`navItem ${active ? "navItemActive" : ""}`}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Header Actions (Auth / Profile) */}
        <div className="headerActions">
          {user ? (
            <div className="userProfileMenu">
              <Link
                href="/profile"
                className={`userProfileLink ${pathname.startsWith("/profile") ? "profileActive" : ""}`}
                aria-label={`Devotee Profile: ${user.full_name}`}
              >
                <span className="userAvatarBindu" aria-hidden="true">
                  <UserRound size={13} strokeWidth={2} />
                </span>
                <span className="userNameShort">
                  {user.full_name.split(" ")[0]}
                </span>
                <span className="userRoleBadge">{user.role}</span>
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="btnHeaderSignOut"
                title="Sign out of your session"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal()}
              className="signInButton"
              aria-label="Devotee Sign In"
            >
              Sign In
            </button>
          )}

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            className="mobileMenuButton"
            onClick={toggleDrawer}
            aria-expanded={mobileDrawerOpen}
            aria-controls="mobileNavigationDrawer"
            aria-label={mobileDrawerOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            <span className={`hamburgerLine ${mobileDrawerOpen ? "openTop" : ""}`} />
            <span className={`hamburgerLine ${mobileDrawerOpen ? "openMid" : ""}`} />
            <span className={`hamburgerLine ${mobileDrawerOpen ? "openBot" : ""}`} />
          </button>
        </div>
      </div>

      {/* Accessible Mobile Drawer for Tablet & Mobile Viewports */}
      <div
        id="mobileNavigationDrawer"
        className={`mobileDrawer ${mobileDrawerOpen ? "drawerOpen" : ""}`}
        aria-hidden={!mobileDrawerOpen}
      >
        <div className="mobileDrawerContent">
          <div className="mobileDrawerHeader">
            <Link href="/" onClick={closeDrawer} className="mobileBrandLink" aria-label="ISHTI">
              <IshtiLogo
                variant="secondary"
                priority
                decorative
                className="mobileDrawerBrandLogo"
              />
            </Link>
            <button
              type="button"
              onClick={closeDrawer}
              className="mobileDrawerClose"
              aria-label="Close navigation drawer"
            >
              <X size={20} strokeWidth={1.8} />
            </button>
          </div>

          <nav aria-label="Mobile Drawer Navigation">
            <ul className="mobileNavLinks">
              <li>
                <Link
                  href="/"
                  onClick={closeDrawer}
                  className={`mobileNavItem ${pathname === "/" ? "mobileNavItemActive" : ""}`}
                >
                  Ecosystem Home
                  <span className="mobileNavDesc">Rooted in Tradition. Connected to Today.</span>
                </Link>
              </li>
              {MODULE_NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeDrawer}
                    className={`mobileNavItem ${isActive(item.href) ? "mobileNavItemActive" : ""}`}
                    aria-current={isActive(item.href) ? "page" : undefined}
                  >
                    {item.name}
                    <span className="mobileNavDesc">{item.description}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/profile"
                  onClick={closeDrawer}
                  className={`mobileNavItem ${pathname.startsWith("/profile") ? "mobileNavItemActive" : ""}`}
                >
                  Devotee Profile & Privacy
                  <span className="mobileNavDesc">DPDP Act 2023 consent & settings</span>
                </Link>
              </li>
            </ul>
          </nav>

          <div className="mobileDrawerFooter">
            {user ? (
              <div className="mobileAuthStatus">
                <span className="mobileLoggedInText">
                  Signed in as <strong>{user.full_name}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    closeDrawer();
                    signOut();
                  }}
                  className="mobileBtnSignOut"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  closeDrawer();
                  openAuthModal();
                }}
                className="mobileBtnSignIn"
              >
                Sign In with Mobile
              </button>
            )}
            <p className="mobileTagline">Rooted in Tradition. Connected to Today.</p>
          </div>
        </div>
      </div>
      {mobileDrawerOpen && (
        <div className="drawerBackdrop" onClick={closeDrawer} aria-hidden="true" />
      )}
    </header>
  );
}
