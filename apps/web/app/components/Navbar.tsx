"use client";

import React, { useState } from "react";
import { Emblem } from "./Emblem";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobile = () => setMobileOpen((prev) => !prev);
  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="siteHeader" role="banner">
      <div className="headerContainer">
        {/* Brand identity */}
        <a href="/" className="brandLink" aria-label="ISHTI - Rooted in Tradition. Connected to Today.">
          <Emblem size={34} variant="gold" />
          <div className="brandText">
            <span className="brandName">ISHTI</span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="desktopNav" aria-label="Primary Navigation">
          <ul className="navLinks">
            <li>
              <a href="#ecosystem" className="navItem">Our Ecosystem</a>
            </li>
            <li>
              <a href="#philosophy" className="navItem">Philosophy</a>
            </li>
            <li>
              <a href="#trust" className="navItem">Trust & Sources</a>
            </li>
            <li>
              <a href="#experience" className="navItem">Daily Practice</a>
            </li>
          </ul>
        </nav>

        {/* Desktop Actions */}
        <div className="headerActions">
          <a href="#early-access" className="signInLink" title="Authentication will be introduced in M02">
            Sign In <span className="plannedTag">Planned</span>
          </a>
          <a href="#ecosystem" className="btnExplore">
            Explore Ecosystem
          </a>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="mobileMenuButton"
            onClick={toggleMobile}
            aria-expanded={mobileOpen}
            aria-controls="mobileNavigation"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            <span className={`hamburgerLine ${mobileOpen ? "openTop" : ""}`} />
            <span className={`hamburgerLine ${mobileOpen ? "openMid" : ""}`} />
            <span className={`hamburgerLine ${mobileOpen ? "openBot" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        id="mobileNavigation"
        className={`mobileDrawer ${mobileOpen ? "drawerOpen" : ""}`}
        aria-hidden={!mobileOpen}
      >
        <div className="mobileDrawerContent">
          <nav aria-label="Mobile Navigation">
            <ul className="mobileNavLinks">
              <li>
                <a href="#ecosystem" onClick={closeMobile} className="mobileNavItem">
                  Our Ecosystem
                  <span className="mobileNavDesc">Six families of spiritual discovery</span>
                </a>
              </li>
              <li>
                <a href="#philosophy" onClick={closeMobile} className="mobileNavItem">
                  Philosophy & Mission
                  <span className="mobileNavDesc">Tradition preserved, technology bounded</span>
                </a>
              </li>
              <li>
                <a href="#trust" onClick={closeMobile} className="mobileNavItem">
                  Trust & Authenticity
                  <span className="mobileNavDesc">Verified texts & transparent pandit network</span>
                </a>
              </li>
              <li>
                <a href="#experience" onClick={closeMobile} className="mobileNavItem">
                  Daily Practice
                  <span className="mobileNavDesc">A day in the life with ISHTI</span>
                </a>
              </li>
            </ul>
          </nav>

          <div className="mobileDrawerFooter">
            <a href="#ecosystem" onClick={closeMobile} className="mobileBtnExplore">
              Explore ISHTI
            </a>
            <a href="#early-access" onClick={closeMobile} className="mobileSignIn">
              Sign In (Planned for M02)
            </a>
            <p className="mobileTagline">Rooted in Tradition. Connected to Today.</p>
          </div>
        </div>
      </div>
      {mobileOpen && <div className="drawerBackdrop" onClick={closeMobile} aria-hidden="true" />}
    </header>
  );
}

