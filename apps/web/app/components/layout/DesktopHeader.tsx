"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRound, X, Globe, Eye } from "lucide-react";
import { IshtiLogo } from "../brand";
import { useAuth } from "../../../lib/auth/auth-context";
import { useI18n } from "../../../lib/i18n/context";
import { useA11y } from "../../../lib/a11y/a11y-context";
import { LanguageModal } from "../i18n/LanguageModal";

interface NavItem {
  id: string;
  href: string;
  descriptionKey: string;
}

const MODULE_NAV_ITEMS: NavItem[] = [
  { id: "bhakti", href: "/bhakti", descriptionKey: "Canonical scriptures & chanting" },
  { id: "panchang", href: "/panchang", descriptionKey: "Vedic calendar & muhurtas" },
  { id: "puja", href: "/puja", descriptionKey: "Vedic rituals & temple offerings" },
  { id: "astro", href: "/astro", descriptionKey: "Encrypted Kundli & planetary insights" },
  { id: "experts", href: "/experts", descriptionKey: "Vetted Pandits & Acharyas" },
  { id: "community", href: "/community", descriptionKey: "Satsang & devotional seva" },
];

export function DesktopHeader() {
  const pathname = usePathname();
  const { user, openAuthModal, signOut } = useAuth();
  const { locale, supportedLanguages, dict } = useI18n();
  const { openA11yModal } = useA11y();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  const toggleDrawer = () => setMobileDrawerOpen((prev) => !prev);
  const closeDrawer = () => setMobileDrawerOpen(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const currentLangInfo = supportedLanguages.find((l) => l.code === locale);
  const navDict = dict.nav;

  const getNavLabel = (id: string) => {
    switch (id) {
      case "bhakti": return navDict.bhakti;
      case "panchang": return navDict.panchang;
      case "puja": return navDict.puja;
      case "astro": return navDict.astro;
      case "experts": return navDict.experts;
      case "community": return navDict.community;
      default: return id;
    }
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
              const label = getNavLabel(item.id);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`navItem ${active ? "navItemActive" : ""}`}
                    aria-current={active ? "page" : undefined}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Header Actions (Language, A11y, Auth / Profile) */}
        <div className="headerActions">
          {/* Language Selector Button */}
          <button
            type="button"
            onClick={() => setIsLangModalOpen(true)}
            className="headerLangButton"
            aria-label={dict.common.selectLanguage}
            title={dict.common.selectLanguage}
          >
            <Globe size={16} strokeWidth={1.8} aria-hidden="true" />
            <span className="headerLangLabel">
              {currentLangInfo?.nativeName || "English"}
            </span>
          </button>

          {/* Accessibility Centre Launcher Button */}
          <button
            type="button"
            onClick={openA11yModal}
            className="headerA11yButton"
            aria-label={dict.common.accessibility}
            title={dict.common.accessibility}
          >
            <Eye size={17} strokeWidth={1.8} aria-hidden="true" />
            <span className="desktopA11yLabel">{dict.common.accessibility}</span>
          </button>

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
                {dict.common.signOut}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal()}
              className="signInButton"
              aria-label={dict.common.signIn}
            >
              {dict.common.signIn}
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
                  {dict.nav.home}
                  <span className="mobileNavDesc">{dict.common.brandTagline}</span>
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
                    {getNavLabel(item.id)}
                    <span className="mobileNavDesc">{item.descriptionKey}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/profile"
                  onClick={closeDrawer}
                  className={`mobileNavItem ${pathname.startsWith("/profile") ? "mobileNavItemActive" : ""}`}
                >
                  {dict.nav.profile}
                  <span className="mobileNavDesc">DPDP Act 2023 consent &amp; settings</span>
                </Link>
              </li>
            </ul>

            {/* Quick Inclusion Controls in Drawer */}
            <div className="mobileDrawerInclusionStrip">
              <button
                type="button"
                onClick={() => {
                  closeDrawer();
                  setIsLangModalOpen(true);
                }}
                className="mobileDrawerActionBtn"
              >
                <Globe size={18} strokeWidth={1.8} aria-hidden="true" />
                <span>{dict.common.selectLanguage}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  closeDrawer();
                  openA11yModal();
                }}
                className="mobileDrawerActionBtn"
              >
                <Eye size={18} strokeWidth={1.8} aria-hidden="true" />
                <span>{dict.common.accessibility}</span>
              </button>
            </div>
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
                  {dict.common.signOut}
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
                {dict.common.signIn}
              </button>
            )}
            <p className="mobileTagline">{dict.common.brandTagline}</p>
          </div>
        </div>
      </div>
      {mobileDrawerOpen && (
        <div className="drawerBackdrop" onClick={closeDrawer} aria-hidden="true" />
      )}

      {/* Accessible Language Selector Dialog */}
      <LanguageModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />
    </header>
  );
}
