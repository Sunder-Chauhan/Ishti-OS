"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Scale,
  Clock,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  FileText,
  UserCheck,
  Send,
} from "lucide-react";
import { Breadcrumbs } from "../../components/layout/Breadcrumbs";
import {
  createGrievanceTicket,
  getGrievanceByTicketNumber,
  getAllGrievances,
  STATUTORY_OFFICER_PLACEHOLDER,
} from "../../../lib/compliance/grievance-service";
import { appendAuditLogEntry } from "../../../lib/compliance/audit-trail";
import type { GrievanceCategory, GrievanceTicket } from "@spiritual-os/types";

const CATEGORY_OPTIONS: { id: GrievanceCategory; label: string; slaText: string }[] = [
  {
    id: "intermediary_complaint",
    label: "Intermediary Due Diligence Complaint (IT Rules Rule 3(2))",
    slaText: "24-Hour Acknowledgement • 7-Day Resolution",
  },
  {
    id: "content_takedown",
    label: "Unlawful Content Removal Order (IT Rules Rule 3(1)(d))",
    slaText: "Mandatory 36-Hour Takedown Execution",
  },
  {
    id: "data_protection",
    label: "Data Principal Privacy Grievance (DPDP Act 2023 §13)",
    slaText: "Statutory Resolution by Data Protection Officer",
  },
  {
    id: "expert_conduct",
    label: "Pandit / Acharya Conduct & Professionalism Concern",
    slaText: "7-Day Investigation by Expert Review Panel",
  },
  {
    id: "commerce_billing",
    label: "Unresolved Commerce Dispute or Delayed Refund",
    slaText: "48-Hour Priority Commerce Trust Review",
  },
  {
    id: "cybersecurity_incident",
    label: "Coordinated Vulnerability Disclosure (Safe Harbor)",
    slaText: "48-Hour Response SLA • Safe Harbor Policy",
  },
];

export default function GrievancePortalPage() {
  const [category, setCategory] = useState<GrievanceCategory>("intermediary_complaint");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const [activeTicket, setActiveTicket] = useState<GrievanceTicket | null>(null);
  const [searchTicketQuery, setSearchTicketQuery] = useState("");
  const [searchEmailQuery, setSearchEmailQuery] = useState("");
  const [lookupResult, setLookupResult] = useState<GrievanceTicket | null | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !description.trim()) return;

    const ticket = createGrievanceTicket({
      category,
      complainantName: name.trim(),
      complainantEmail: email.trim(),
      subject: subject.trim(),
      description: description.trim(),
    });

    await appendAuditLogEntry("GRIEVANCE_SUBMITTED", name.trim(), {
      ticketNumber: ticket.ticketNumber,
      category: ticket.category,
      deadline: ticket.resolutionDeadline,
    });

    setActiveTicket(ticket);
    setName("");
    setEmail("");
    setSubject("");
    setDescription("");
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTicketQuery.trim() || !searchEmailQuery.trim()) return;
    const found = getGrievanceByTicketNumber(searchTicketQuery.trim());
    if (found && found.complainantEmail.trim().toLowerCase() === searchEmailQuery.trim().toLowerCase()) {
      setLookupResult(found);
    } else {
      setLookupResult(null);
    }
  };

  return (
    <div className="profileShell" style={{ maxWidth: "1040px" }}>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Trust & Legal Centre", href: "/legal" },
          { label: "Statutory Grievance Redressal", current: true },
        ]}
      />

      {/* Prototype Preview Notice Banner */}
      <div
        style={{
          padding: "16px 20px",
          borderRadius: "8px",
          backgroundColor: "#FFFBEB",
          border: "1px solid #F59E0B",
          marginBottom: "28px",
          display: "flex",
          gap: "12px",
          alignItems: "flex-start",
        }}
      >
        <AlertCircle size={20} color="#B45309" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div style={{ fontSize: "13px", lineHeight: 1.5, color: "#92400E" }}>
          <strong>STATUTORY GRIEVANCE REDRESSAL PORTAL (PROTOTYPE PREVIEW):</strong> This interface
          demonstrates ISHTI&apos;s compliance workflow under Rule 3(2) of the Information Technology
          (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 (as amended February 2026) and §13 of
          the Digital Personal Data Protection Act, 2023. The backend ticket processing service is currently
          pending deployment (Milestone M06). Submissions made here are local browser demonstrations only and do
          not constitute formal legal service on a statutory officer.
        </div>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <Scale size={20} color="var(--ishti-temple-maroon)" aria-hidden="true" />
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--ishti-temple-maroon)",
            }}
          >
            Statutory Compliance &amp; Consumer Redressal
          </span>
        </div>
        <h1 className="pillarTitle" style={{ fontSize: "36px", marginBottom: "12px" }}>
          Statutory Grievance Redressal Portal
        </h1>
        <p className="pillarDescription" style={{ fontSize: "16px", maxWidth: "840px", lineHeight: 1.6 }}>
          In strict compliance with Rule 3(2) and Rule 3A of the Information Technology (Intermediary
          Guidelines and Digital Media Ethics Code) Rules, 2021 (as amended February 2026) and §13 of the
          Digital Personal Data Protection Act, 2023, ISHTI provides a dedicated, time-bound grievance
          resolution mechanism.
        </p>
      </div>

      {/* Statutory SLAs Highlight Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <div
          className="consentCard"
          style={{
            flexDirection: "column",
            gap: "6px",
            backgroundColor: "#FAF7F2",
            borderLeft: "4px solid var(--ishti-temple-maroon)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={16} color="var(--ishti-temple-maroon)" aria-hidden="true" />
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ishti-temple-charcoal)" }}>
              24-Hour Acknowledgement
            </h2>
          </div>
          <p style={{ fontSize: "12px", color: "var(--ishti-warm-bronze)", margin: 0, lineHeight: 1.4 }}>
            Mandatory under amended IT Rules (Feb 2026). Every complaint generates a verified tracking ticket within
            24 hours of receipt.
          </p>
        </div>

        <div
          className="consentCard"
          style={{
            flexDirection: "column",
            gap: "6px",
            backgroundColor: "#FAF7F2",
            borderLeft: "4px solid var(--ishti-temple-maroon)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={16} color="var(--ishti-temple-maroon)" aria-hidden="true" />
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ishti-temple-charcoal)" }}>
              7-Day Resolution Mandate
            </h2>
          </div>
          <p style={{ fontSize: "12px", color: "var(--ishti-warm-bronze)", margin: 0, lineHeight: 1.4 }}>
            All grievances are thoroughly investigated and resolved within seven (7) days of filing under Rule 3(2).
          </p>
        </div>

        <div
          className="consentCard"
          style={{
            flexDirection: "column",
            gap: "6px",
            backgroundColor: "#FAF7F2",
            borderLeft: "4px solid var(--ishti-sacred-gold)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Scale size={16} color="var(--ishti-temple-charcoal)" aria-hidden="true" />
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ishti-temple-charcoal)" }}>
              GAC Appellate Recourse
            </h2>
          </div>
          <p style={{ fontSize: "12px", color: "var(--ishti-warm-bronze)", margin: 0, lineHeight: 1.4 }}>
            Devotees dissatisfied with resolution may appeal within 30 days to the central Grievance Appellate
            Committee (gac.gov.in).
          </p>
        </div>
      </div>

      {/* Main Two-Column Layout: Filing Form and Designated Officer Details */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: "32px",
          alignItems: "start",
          marginBottom: "40px",
        }}
      >
        {/* Left Column: Interactive Filing Form */}
        <div className="profileCard" style={{ margin: 0 }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", color: "var(--ishti-temple-charcoal)" }}>
            File an Official Statutory Grievance
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Category */}
            <div>
              <label
                htmlFor="grievanceCategorySelect"
                style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}
              >
                Grievance Category &amp; Statutory SLA
              </label>
              <select
                id="grievanceCategorySelect"
                value={category}
                onChange={(e) => setCategory(e.target.value as GrievanceCategory)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-card)",
                  fontSize: "13px",
                  backgroundColor: "#FFFFFF",
                }}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: "11px", color: "var(--ishti-temple-maroon)", fontWeight: 600, marginTop: "4px" }}>
                Applicable SLA: {CATEGORY_OPTIONS.find((c) => c.id === category)?.slaText}
              </div>
            </div>

            {/* Complainant Name & Email */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label
                  htmlFor="complainantNameInput"
                  style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}
                >
                  Your Full Name
                </label>
                <input
                  id="complainantNameInput"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Devotee or Legal Counsel"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-card)",
                    fontSize: "13px",
                    backgroundColor: "#FFFFFF",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="complainantEmailInput"
                  style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}
                >
                  Email Address for Notices
                </label>
                <input
                  id="complainantEmailInput"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="devotee@example.com"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-card)",
                    fontSize: "13px",
                    backgroundColor: "#FFFFFF",
                  }}
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label
                htmlFor="subjectInput"
                style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}
              >
                Subject / Summary of Grievance
              </label>
              <input
                id="subjectInput"
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of the issue..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-card)",
                  fontSize: "13px",
                  backgroundColor: "#FFFFFF",
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="descriptionTextarea"
                style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}
              >
                Detailed Facts &amp; Specific Relief Sought
              </label>
              <textarea
                id="descriptionTextarea"
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide specific URLs, booking IDs, timestamps, or factual details..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-card)",
                  fontSize: "13px",
                  backgroundColor: "#FFFFFF",
                  lineHeight: 1.5,
                }}
              />
            </div>

            <button
              type="submit"
              className="btnExploreModule"
              style={{
                marginTop: "8px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <Send size={15} aria-hidden="true" />
              <span>Submit Statutory Complaint</span>
            </button>
          </form>

          {/* Acknowledgement Output Receipt */}
          {activeTicket && (
            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                borderRadius: "8px",
                backgroundColor: "#FAF7F2",
                border: "1px solid var(--ishti-temple-maroon)",
              }}
              role="status"
              aria-live="polite"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <CheckCircle2 size={18} color="#15803D" aria-hidden="true" />
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ishti-temple-charcoal)" }}>
                  Prototype Ticket Staged (Demonstration Only: {activeTicket.ticketNumber})
                </h3>
              </div>
              <p style={{ fontSize: "12px", color: "var(--ishti-warm-bronze)", lineHeight: 1.5, margin: "0 0 10px" }}>
                This ticket has been generated in your local browser session for workflow demonstration purposes.
                No transmission to a statutory officer or backend database has occurred. Official grievance redressal
                will activate upon Milestone M06 backend deployment.
              </p>
              <div style={{ fontSize: "11px", color: "var(--ishti-temple-charcoal)" }}>
                <div>
                  <strong>Simulated Resolution SLA:</strong> 7 days under Rule 3(2) (target:{" "}
                  {new Date(activeTicket.resolutionDeadline).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  ).
                </div>
                <div style={{ marginTop: "4px" }}>
                  <strong>Officer Placeholder:</strong> {activeTicket.officerDesignation}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Officer Details & Ticket Lookup */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Statutory Officer Card */}
          <div className="profileCard" style={{ margin: 0, backgroundColor: "#FAF7F2" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <UserCheck size={22} color="var(--ishti-temple-maroon)" aria-hidden="true" />
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>
                Designated Statutory Officers
              </h2>
            </div>
            <p style={{ fontSize: "12px", color: "var(--ishti-warm-bronze)", lineHeight: 1.5, marginBottom: "14px" }}>
              Designated in compliance with Section 79 of the IT Act, 2000, IT Rules 2021 Rule 3, and §13 of the
              DPDP Act, 2023:
            </p>

            <div style={{ fontSize: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div>
                <span style={{ color: "var(--ishti-warm-bronze)" }}>Grievance Officer:</span>
                <div style={{ fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>
                  [LEGAL_REVIEW_REQUIRED: Appointed Officer Name]
                </div>
              </div>
              <div>
                <span style={{ color: "var(--ishti-warm-bronze)" }}>Entity:</span>
                <div style={{ fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>
                  [LEGAL_REVIEW_REQUIRED: ISHTI Corporate Entity Name]
                </div>
              </div>
              <div>
                <span style={{ color: "var(--ishti-warm-bronze)" }}>Official Address:</span>
                <div style={{ color: "var(--ishti-temple-charcoal)" }}>
                  [LEGAL_REVIEW_REQUIRED: Registered Postal Address, India]
                </div>
              </div>
              <div>
                <span style={{ color: "var(--ishti-warm-bronze)" }}>Direct Email:</span>
                <div>
                  <a
                    href="mailto:grievance@ishti.internal"
                    style={{ color: "var(--ishti-temple-maroon)", fontWeight: 600, textDecoration: "underline" }}
                  >
                    grievance@ishti.internal
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Status Lookup Box */}
          <div className="profileCard" style={{ margin: 0 }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px", color: "var(--ishti-temple-charcoal)" }}>
              Track Existing Grievance Ticket (Prototype)
            </h2>
            <p style={{ fontSize: "12px", color: "var(--ishti-warm-bronze)", marginBottom: "12px" }}>
              Ticket Tracking Prototype: Queries local demonstration tickets staged in your current browser session only.
            </p>

            <form onSubmit={handleLookup} style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
              <input
                type="text"
                required
                value={searchTicketQuery}
                onChange={(e) => setSearchTicketQuery(e.target.value)}
                placeholder="Ticket Number (e.g. ISHTI-GRV-2026-XXXX)"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-card)",
                  backgroundColor: "#FFFFFF",
                }}
              />
              <input
                type="email"
                required
                value={searchEmailQuery}
                onChange={(e) => setSearchEmailQuery(e.target.value)}
                placeholder="Complainant Email (for verification)"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-card)",
                  backgroundColor: "#FFFFFF",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "8px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  backgroundColor: "var(--ishti-temple-maroon)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Verify &amp; Track Status
              </button>
            </form>

            {lookupResult !== undefined && (
              <div style={{ marginTop: "12px" }}>
                {lookupResult ? (
                  <div
                    style={{
                      padding: "12px",
                      borderRadius: "6px",
                      backgroundColor: "#FAF7F2",
                      border: "1px solid var(--border-card)",
                      fontSize: "12px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontWeight: 700 }}>{lookupResult.ticketNumber}</span>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          backgroundColor:
                            lookupResult.status === "RESOLVED"
                              ? "rgba(21, 128, 61, 0.1)"
                              : "rgba(215, 166, 74, 0.2)",
                          color:
                            lookupResult.status === "RESOLVED" ? "#15803D" : "var(--ishti-temple-charcoal)",
                        }}
                      >
                        {lookupResult.status}
                      </span>
                    </div>
                    <div style={{ color: "var(--ishti-warm-bronze)", marginBottom: "4px" }}>
                      Subject: {lookupResult.subject}
                    </div>
                    {lookupResult.resolutionSummary && (
                      <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px solid var(--border-subtle)" }}>
                        <strong>Resolution:</strong> {lookupResult.resolutionSummary}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: "var(--ishti-error)", padding: "8px 0" }}>
                    No grievance found matching this ticket number and complainant email combination.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <Link
          href="/legal"
          className="btnExploreModule"
          style={{
            maxWidth: "200px",
            marginTop: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <ArrowLeft size={14} strokeWidth={1.8} aria-hidden="true" />
          <span>Back to Policy Centre</span>
        </Link>
        <div style={{ display: "flex", gap: "16px", fontSize: "12px" }}>
          <Link href="/profile/consent" style={{ color: "var(--ishti-temple-maroon)", textDecoration: "underline" }}>
            Consent Sanctuary
          </Link>
          <span style={{ color: "var(--border-card)" }}>&bull;</span>
          <Link href="/profile/privacy" style={{ color: "var(--ishti-temple-maroon)", textDecoration: "underline" }}>
            Data Subject Rights &amp; Deletion
          </Link>
          <span style={{ color: "var(--border-card)" }}>&bull;</span>
          <a
            href="https://gac.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--ishti-temple-maroon)", textDecoration: "underline" }}
          >
            Grievance Appellate Committee (gac.gov.in) &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
