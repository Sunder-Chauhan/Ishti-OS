import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Shield, Calendar, Scale, Globe, FileCheck } from "lucide-react";
import { Breadcrumbs } from "../../components/layout/Breadcrumbs";
import { POLICIES } from "../../../lib/policy/policy-registry";
import { getPolicyBySlug } from "../../../lib/policy/policy-service";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return POLICIES.map((policy) => ({
    slug: policy.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const policy = getPolicyBySlug(slug);
  if (!policy) return { title: "Policy Not Found | ISHTI" };

  return {
    title: `${policy.title} | ISHTI Policy Sanctuary`,
    description: policy.summary,
  };
}

export default async function PolicyDetailPage({ params }: Props) {
  const { slug } = await params;
  const policy = getPolicyBySlug(slug);

  if (!policy) {
    notFound();
  }

  const isUnderReview =
    policy.status === "DRAFT" ||
    policy.status === "INTERNAL_REVIEW" ||
    policy.status === "LEGAL_REVIEW" ||
    policy.status === "OPERATOR_APPROVAL";

  return (
    <div className="profileShell" style={{ maxWidth: "980px" }}>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Trust & Legal Centre", href: "/legal" },
          { label: policy.title, current: true },
        ]}
      />

      {/* Back button */}
      <div style={{ marginBottom: "20px" }}>
        <Link
          href="/legal"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: "var(--ishti-temple-maroon)",
            fontWeight: 600,
            textDecoration: "none",
          }}
          className="hover:underline"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <span>Back to All Policies</span>
        </Link>
      </div>

      {/* Article Header */}
      <header style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
          <span
            style={{
              fontSize: "11px",
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
              fontSize: "11px",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "4px",
              backgroundColor: "rgba(215, 166, 74, 0.2)",
              color: "var(--ishti-temple-charcoal)",
            }}
          >
            Status: {policy.status} &bull; Version: {policy.version}
          </span>
        </div>

        <h1 className="pillarTitle" style={{ fontSize: "34px", marginBottom: "12px" }}>
          {policy.title}
        </h1>

        <p className="pillarDescription" style={{ fontSize: "16px", maxWidth: "800px", lineHeight: 1.6 }}>
          {policy.summary}
        </p>

        {/* Metadata Bar */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "20px",
            fontSize: "12px",
            color: "var(--ishti-warm-bronze)",
            marginTop: "16px",
            paddingTop: "12px",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Calendar size={14} aria-hidden="true" />
            <span>Effective Date: <strong>{policy.effectiveDate}</strong></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <FileCheck size={14} aria-hidden="true" />
            <span>Last Reviewed: <strong>{policy.lastReviewedDate}</strong></span>
          </div>
          {policy.statutoryBasis && policy.statutoryBasis.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Scale size={14} aria-hidden="true" />
              <span>
                Statutory Authorities: <strong>{policy.statutoryBasis.join(", ")}</strong>
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Review Banner */}
      {isUnderReview && (
        <div
          className="authModalSandboxBanner"
          style={{
            marginBottom: "32px",
            borderColor: "rgba(215, 166, 74, 0.5)",
            backgroundColor: "rgba(215, 166, 74, 0.08)",
          }}
          role="status"
          aria-label="Document status announcement"
        >
          <span
            className="authSandboxBadge"
            style={{ backgroundColor: "var(--ishti-sacred-gold)", color: "var(--ishti-temple-charcoal)" }}
          >
            LEGAL DRAFT
          </span>
          <p className="authSandboxText" style={{ color: "var(--ishti-temple-charcoal)" }}>
            This document is a formal architecture draft under review. References to corporate entities,
            registered office locations, or statutory officers are designated with{" "}
            <code>[LEGAL_REVIEW_REQUIRED: ...]</code> placeholders awaiting corporate formation and formal counsel
            appointment.
          </p>
        </div>
      )}

      {/* Content Layout Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gap: "40px",
          alignItems: "start",
        }}
      >
        {/* Main Article Body */}
        <article className="policyArticle" style={{ lineHeight: 1.7, color: "var(--ishti-temple-charcoal)" }}>
          {policy.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              style={{
                marginBottom: "36px",
                scrollMarginTop: "80px",
                paddingBottom: "24px",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  marginBottom: "12px",
                  color: "var(--ishti-temple-charcoal)",
                }}
              >
                {section.title}
              </h2>
              {section.legalBasisRef && (
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--ishti-warm-bronze)",
                    marginBottom: "8px",
                  }}
                >
                  Statutory Reference: <code>{section.legalBasisRef}</code>
                </div>
              )}
              <div
                style={{
                  fontSize: "15px",
                  color: "var(--ishti-temple-charcoal)",
                  whiteSpace: "pre-line",
                }}
              >
                {section.content}
              </div>
            </section>
          ))}

          {/* Regional Schedules (e.g. Terms) */}
          {policy.schedules && policy.schedules.length > 0 && (
            <section id="regional-schedules" style={{ marginTop: "40px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <Globe size={20} color="var(--ishti-temple-maroon)" aria-hidden="true" />
                <h2 style={{ fontSize: "24px", fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>
                  Regional Jurisdiction Schedules
                </h2>
              </div>
              <p style={{ fontSize: "14px", color: "var(--ishti-warm-bronze)", marginBottom: "24px" }}>
                These schedules supplement or modify the Master Policy for users accessing ISHTI from specific
                territories, complying with local mandatory consumer and privacy legislation.
              </p>

              {policy.schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  id={schedule.slug}
                  style={{
                    backgroundColor: "#FAF7F2",
                    border: "1px solid var(--border-card)",
                    borderRadius: "10px",
                    padding: "24px",
                    marginBottom: "24px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        backgroundColor: "var(--ishti-temple-maroon)",
                        color: "#FFFFFF",
                        padding: "2px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      {schedule.jurisdiction}
                    </span>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>
                      {schedule.title}
                    </h3>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)", marginBottom: "16px" }}>
                    {schedule.description}
                  </p>

                  {schedule.sections.map((schedSection) => (
                    <div key={schedSection.id} style={{ marginBottom: "16px" }}>
                      <h4 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "6px" }}>
                        {schedSection.title}
                      </h4>
                      {schedSection.legalBasisRef && (
                        <div style={{ fontSize: "11px", color: "var(--ishti-warm-bronze)", marginBottom: "4px" }}>
                          Reference: <code>{schedSection.legalBasisRef}</code>
                        </div>
                      )}
                      <p style={{ fontSize: "14px", whiteSpace: "pre-line", lineHeight: 1.6 }}>
                        {schedSection.content}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </section>
          )}
        </article>

        {/* Sidebar Table of Contents */}
        <aside
          style={{
            position: "sticky",
            top: "24px",
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--border-card)",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <nav aria-label="Table of contents">
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--ishti-temple-maroon)",
                marginBottom: "12px",
              }}
            >
              Table of Contents
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              {policy.sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    style={{
                      fontSize: "12px",
                      color: "var(--ishti-temple-charcoal)",
                      textDecoration: "none",
                      display: "block",
                      lineHeight: 1.4,
                    }}
                    className="hover:underline"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
              {policy.schedules && policy.schedules.length > 0 && (
                <li>
                  <a
                    href="#regional-schedules"
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--ishti-temple-maroon)",
                      textDecoration: "none",
                      display: "block",
                      marginTop: "6px",
                    }}
                    className="hover:underline"
                  >
                    Regional Schedules ({policy.schedules.length})
                  </a>
                </li>
              )}
            </ul>
          </nav>

          <div
            style={{
              marginTop: "24px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border-subtle)",
              fontSize: "11px",
              color: "var(--ishti-warm-bronze)",
            }}
          >
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              Questions about this policy? Contact our{" "}
              <Link href="/legal/grievance" style={{ color: "var(--ishti-temple-maroon)", fontWeight: 600 }}>
                Grievance Officer
              </Link>{" "}
              or Data Protection Officer.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
