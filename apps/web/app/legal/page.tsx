"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Shield, BookOpen, Scale, ArrowRight, Search, FileText } from "lucide-react";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { POLICIES } from "../../lib/policy/policy-registry";
import type { PolicyCategory, PolicyDocument } from "@spiritual-os/types";

const CATEGORIES: { id: PolicyCategory | "all"; label: string }[] = [
  { id: "all", label: "All Policies" },
  { id: "legal", label: "Legal & Terms" },
  { id: "privacy", label: "Privacy & Data Sanctuary" },
  { id: "commerce", label: "Commerce & Refunds" },
  { id: "safety", label: "Safety & Decorum" },
  { id: "governance", label: "Governance & Security" },
];

export default function LegalDirectoryPage() {
  const [selectedCategory, setSelectedCategory] = useState<PolicyCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPolicies = useMemo(() => {
    return POLICIES.filter((policy) => {
      const matchesCategory =
        selectedCategory === "all" || policy.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        policy.title.toLowerCase().includes(q) ||
        policy.summary.toLowerCase().includes(q) ||
        policy.slug.toLowerCase().includes(q) ||
        policy.statutoryBasis?.some((b) => b.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="profileShell" style={{ maxWidth: "1080px" }}>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Trust & Legal Centre", current: true },
        ]}
      />

      {/* Hero Header */}
      <div style={{ marginBottom: "32px", textAlign: "left" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <Shield size={20} color="var(--ishti-temple-maroon)" aria-hidden="true" />
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--ishti-temple-maroon)",
            }}
          >
            Trust, Compliance &amp; Governance
          </span>
        </div>
        <h1 className="pillarTitle" style={{ fontSize: "36px", marginBottom: "12px" }}>
          ISHTI Global Policy Centre
        </h1>
        <p className="pillarDescription" style={{ fontSize: "16px", maxWidth: "820px", lineHeight: 1.6 }}>
          Welcome to the ISHTI Legal, Privacy &amp; Trust Sanctuary. Inspired by timeless dharmic values of
          truth (Satya) and mutual trust (Samjnana), we provide transparent, unbundled, and sovereign
          governance across our global spiritual ecosystem.
        </p>
      </div>

      {/* Draft Disclaimer Notice */}
      <div
        className="authModalSandboxBanner"
        style={{
          marginBottom: "28px",
          borderColor: "rgba(215, 166, 74, 0.4)",
          backgroundColor: "rgba(215, 166, 74, 0.08)",
        }}
        role="region"
        aria-label="Legal draft notice"
      >
        <span
          className="authSandboxBadge"
          style={{ backgroundColor: "var(--ishti-sacred-gold)", color: "var(--ishti-temple-charcoal)" }}
        >
          GOVERNANCE NOTICE
        </span>
        <p className="authSandboxText" style={{ color: "var(--ishti-temple-charcoal)" }}>
          The documents below represent ISHTI&apos;s Milestone M05 governance architecture. All policy texts are
          currently in <strong>LEGAL REVIEW</strong> status. They are published for review and audit purposes and do
          not constitute active, legally binding commitments until formally approved by legal counsel and published.
          Corporate identity and statutory officer appointments are designated with review placeholders.
        </p>
      </div>

      {/* Search and Filters Toolbar */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: "16px",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          paddingBottom: "16px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        {/* Category Pills */}
        <div
          role="tablist"
          aria-label="Filter policies by category"
          style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: "6px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderRadius: "20px",
                  cursor: "pointer",
                  transition: "all 150ms ease",
                  border: isActive
                    ? "1px solid var(--ishti-temple-maroon)"
                    : "1px solid var(--border-card)",
                  backgroundColor: isActive
                    ? "var(--ishti-temple-maroon)"
                    : "var(--surface-card)",
                  color: isActive ? "#FFFFFF" : "var(--ishti-temple-charcoal)",
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div style={{ position: "relative", minWidth: "260px" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--ishti-warm-bronze)",
            }}
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search policies or laws..."
            aria-label="Search policies or laws"
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              fontSize: "13px",
              border: "1px solid var(--border-card)",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              color: "var(--ishti-temple-charcoal)",
            }}
          />
        </div>
      </div>

      {/* Policies Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        {filteredPolicies.map((policy) => (
          <article
            key={policy.slug}
            className="consentCard"
            style={{
              flexDirection: "column",
              justifyContent: "space-between",
              height: "100%",
              padding: "24px",
              borderRadius: "12px",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(113, 27, 22, 0.08)",
                    color: "var(--ishti-temple-maroon)",
                  }}
                >
                  {policy.category}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(215, 166, 74, 0.2)",
                    color: "var(--ishti-temple-charcoal)",
                  }}
                >
                  {policy.status} &bull; {policy.version}
                </span>
              </div>

              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "var(--ishti-temple-charcoal)",
                }}
              >
                {policy.title}
              </h2>

              <p
                style={{
                  fontSize: "13px",
                  color: "var(--ishti-warm-bronze)",
                  lineHeight: 1.5,
                  marginBottom: "16px",
                }}
              >
                {policy.summary}
              </p>

              {/* Statutory Basis Tags */}
              {policy.statutoryBasis && policy.statutoryBasis.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                  {policy.statutoryBasis.slice(0, 3).map((law) => (
                    <span
                      key={law}
                      style={{
                        fontSize: "11px",
                        padding: "2px 6px",
                        backgroundColor: "#F2EFE9",
                        borderRadius: "4px",
                        color: "var(--ishti-temple-charcoal)",
                      }}
                    >
                      {law}
                    </span>
                  ))}
                  {policy.statutoryBasis.length > 3 && (
                    <span style={{ fontSize: "11px", color: "var(--ishti-warm-bronze)" }}>
                      +{policy.statutoryBasis.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                borderTop: "1px solid var(--border-subtle)",
                paddingTop: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "11px", color: "var(--ishti-warm-bronze)" }}>
                {policy.schedules?.length ? `${policy.schedules.length} Regional Schedules` : `${policy.sections.length} Sections`}
              </span>
              <Link
                href={`/legal/${policy.slug}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--ishti-temple-maroon)",
                  textDecoration: "none",
                }}
                className="hover:underline"
              >
                <span>Read Policy</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      {/* Statutory Contacts Banner */}
      <div
        className="profileCard"
        style={{
          backgroundColor: "#FAF7F2",
          border: "1px solid rgba(113, 27, 22, 0.15)",
          padding: "28px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <Scale size={28} color="var(--ishti-temple-maroon)" style={{ flexShrink: 0, marginTop: "4px" }} aria-hidden="true" />
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "6px", color: "var(--ishti-temple-charcoal)" }}>
              Statutory Grievance &amp; Data Protection Contacts
            </h3>
            <p style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)", lineHeight: 1.6, marginBottom: "14px" }}>
              In compliance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code)
              Rules, 2021 (as amended February 2026) and the Digital Personal Data Protection Act, 2023, ISHTI operates
              a dedicated Grievance Redressal mechanism with 24-hour acknowledgement and 7-day resolution SLAs.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
              <Link
                href="/legal/grievance"
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--ishti-temple-maroon)",
                  textDecoration: "underline",
                }}
              >
                File an Official Grievance Ticket &rarr;
              </Link>
              <Link
                href="/profile/consent"
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--ishti-temple-maroon)",
                  textDecoration: "underline",
                }}
              >
                Manage DPDP Data Principal Consents &rarr;
              </Link>
              <Link
                href="/legal/data-deletion"
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--ishti-temple-maroon)",
                  textDecoration: "underline",
                }}
              >
                Data Subject Rights &amp; Erasure Guide &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
