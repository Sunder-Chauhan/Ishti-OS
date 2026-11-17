"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Scale,
  Receipt,
  AlertCircle,
} from "lucide-react";
import { Breadcrumbs } from "../../components/layout/Breadcrumbs";
import { formatCurrency, SUPPORTED_CURRENCIES } from "../../../lib/commerce/multi-currency";
import { calculateRefundEligibility } from "../../../lib/commerce/cancellation-calculator";
import { submitRefundRequest, getStoredRefundRequests } from "../../../lib/commerce/refund-service";
import type { CurrencyCode, ServiceClassification, RefundRequestRecord } from "@spiritual-os/types";

export default function RefundsSimulatorPage() {
  const [serviceType, setServiceType] = useState<ServiceClassification>("live_consultation");
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [amount, setAmount] = useState<number>(2100);
  const [hoursUntilStart, setHoursUntilStart] = useState<number>(36);
  const [isDownloaded, setIsDownloaded] = useState<boolean>(true);
  const [disputeNotes, setDisputeNotes] = useState<string>("");

  const [submittedTicket, setSubmittedTicket] = useState<RefundRequestRecord | null>(null);

  const calculation = useMemo(() => {
    return calculateRefundEligibility({
      originalAmount: amount,
      currency,
      serviceType,
      hoursUntilStart,
      isDigitalAssetDownloaded: isDownloaded,
    });
  }, [amount, currency, serviceType, hoursUntilStart, isDownloaded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const record = submitRefundRequest({
      bookingReference: `BK-${Date.now().toString().slice(-6)}`,
      userId: "devotee-sanctuary-user",
      serviceType,
      originalAmount: amount,
      currency,
      hoursUntilStart,
      isDigitalAssetDownloaded: isDownloaded,
      disputeNotes: disputeNotes.trim() || undefined,
    });
    setSubmittedTicket(record);
  };

  return (
    <div className="profileShell" style={{ maxWidth: "1000px" }}>
      <Breadcrumbs
        items={[
          { label: "Devotee Profile", href: "/profile" },
          { label: "Commerce Trust & Refund Simulator", current: true },
        ]}
      />

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <CreditCard size={18} color="var(--ishti-temple-maroon)" aria-hidden="true" />
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--ishti-temple-maroon)",
            }}
          >
            Commerce Trust &amp; Fair Cancellation (Proposed Policy)
          </span>
        </div>
        <h1 className="pillarTitle" style={{ fontSize: "32px", marginBottom: "8px" }}>
          Commerce Trust &amp; Cancellation Simulator
        </h1>
        <p className="pillarDescription" style={{ fontSize: "15px", maxWidth: "800px", lineHeight: 1.6 }}>
          Under the Consumer Protection (E-Commerce) Rules, 2020 and international fair trade practices, ISHTI
          provides absolute transparency for booking cancellations and refunds. This simulator illustrates our
          proposed commercial cancellation tiers (0% gateway fee deduction by default pending final commercial
          operator approval and payment aggregator agreements).
        </p>
      </div>

      {/* Two Column Layout: Controls and Live Calculation */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "28px",
          marginBottom: "36px",
        }}
      >
        {/* Form Controls Column */}
        <div className="profileCard" style={{ margin: 0 }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", color: "var(--ishti-temple-charcoal)" }}>
            Service &amp; Booking Parameters
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Service Type Selection */}
            <div>
              <label
                htmlFor="serviceTypeSelect"
                style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}
              >
                Service Category
              </label>
              <select
                id="serviceTypeSelect"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceClassification)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-card)",
                  fontSize: "13px",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <option value="live_consultation">Live Jyotish Consultation (1-on-1)</option>
                <option value="online_puja">Online Sacred Puja Ceremony</option>
                <option value="digital_audio_scripture">Digital Audio / Scripture E-Book</option>
                <option value="pandit_no_show">Expert Absence / Pandit No-Show (Guarantee)</option>
              </select>
            </div>

            {/* Currency & Amount */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "12px" }}>
              <div>
                <label
                  htmlFor="currencySelect"
                  style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}
                >
                  Currency
                </label>
                <select
                  id="currencySelect"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-card)",
                    fontSize: "13px",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  {Object.keys(SUPPORTED_CURRENCIES).map((c) => (
                    <option key={c} value={c}>
                      {c} ({SUPPORTED_CURRENCIES[c as CurrencyCode].symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="amountInput"
                  style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}
                >
                  Booking Amount
                </label>
                <input
                  id="amountInput"
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
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

            {/* Contextual Options depending on serviceType */}
            {serviceType === "live_consultation" || serviceType === "online_puja" ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <label htmlFor="hoursSlider" style={{ fontSize: "12px", fontWeight: 600 }}>
                    Hours Remaining Before Start:
                  </label>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--ishti-temple-maroon)" }}>
                    {hoursUntilStart} Hours
                  </span>
                </div>
                <input
                  id="hoursSlider"
                  type="range"
                  min="0"
                  max="72"
                  step="1"
                  value={hoursUntilStart}
                  onChange={(e) => setHoursUntilStart(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--ishti-temple-maroon)" }}
                  aria-label="Hours remaining before scheduled start"
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--ishti-warm-bronze)" }}>
                  <span>0h (Imminent)</span>
                  <span>4h (T2 Cutoff)</span>
                  <span>24h (T1 Cutoff)</span>
                  <span>72h</span>
                </div>
              </div>
            ) : serviceType === "digital_audio_scripture" ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0" }}>
                <input
                  type="checkbox"
                  id="digitalCheck"
                  checked={isDownloaded}
                  onChange={(e) => setIsDownloaded(e.target.checked)}
                  style={{ width: "16px", height: "16px" }}
                />
                <label htmlFor="digitalCheck" style={{ fontSize: "13px", color: "var(--ishti-temple-charcoal)" }}>
                  Digital content already streamed or downloaded
                </label>
              </div>
            ) : null}

            {/* Optional Notes */}
            <div>
              <label
                htmlFor="disputeNotesInput"
                style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}
              >
                Cancellation Reason / Notes (Optional)
              </label>
              <textarea
                id="disputeNotesInput"
                rows={2}
                value={disputeNotes}
                onChange={(e) => setDisputeNotes(e.target.value)}
                placeholder="Reason for requesting cancellation or refund..."
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-card)",
                  fontSize: "12px",
                  backgroundColor: "#FFFFFF",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={!calculation.canCancel}
              className="btnExploreModule"
              style={{
                marginTop: "8px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                opacity: calculation.canCancel ? 1 : 0.6,
                cursor: calculation.canCancel ? "pointer" : "not-allowed",
              }}
            >
              <RotateCcw size={15} aria-hidden="true" />
              <span>Submit Refund Request</span>
            </button>
          </form>
        </div>

        {/* Live Calculation Display Column */}
        <div
          className="profileCard"
          style={{
            margin: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#FAF7F2",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--ishti-temple-maroon)",
                }}
              >
                Live Refund Assessment
              </span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: "20px",
                  backgroundColor: calculation.canCancel ? "rgba(21, 128, 61, 0.1)" : "rgba(185, 28, 28, 0.1)",
                  color: calculation.canCancel ? "#15803D" : "#B91C1C",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {calculation.canCancel ? (
                  <>
                    <CheckCircle2 size={13} aria-hidden="true" />
                    <span>ELIGIBLE ({calculation.refundPercentage}%)</span>
                  </>
                ) : (
                  <>
                    <XCircle size={13} aria-hidden="true" />
                    <span>NON-REFUNDABLE</span>
                  </>
                )}
              </span>
            </div>

            {/* Financial Numbers Grid */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid var(--border-card)",
                borderRadius: "10px",
                padding: "16px",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
                <span style={{ color: "var(--ishti-warm-bronze)" }}>Original Booking Fee:</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(calculation.originalAmount, currency)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
                <span style={{ color: "var(--ishti-warm-bronze)" }}>Refund Percentage:</span>
                <span style={{ fontWeight: 600 }}>{calculation.refundPercentage}%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
                <span style={{ color: "var(--ishti-warm-bronze)" }}>Gateway Deduction (Proposed 0%):</span>
                <span style={{ color: calculation.gatewayFeeDeducted > 0 ? "#B91C1C" : "var(--ishti-temple-charcoal)" }}>
                  - {formatCurrency(calculation.gatewayFeeDeducted, currency)}
                </span>
              </div>
              <div
                style={{
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "10px",
                  marginTop: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--ishti-temple-charcoal)" }}>
                  Net Refund to Credited:
                </span>
                <span style={{ fontSize: "20px", fontWeight: 700, color: "var(--ishti-temple-maroon)" }}>
                  {formatCurrency(calculation.netRefundAmount, currency)}
                </span>
              </div>
            </div>

            {/* Assessment Narrative */}
            <div style={{ fontSize: "12px", color: "var(--ishti-warm-bronze)", lineHeight: 1.5, marginBottom: "14px" }}>
              <p style={{ margin: "0 0 6px" }}>
                <strong>Tier:</strong> {calculation.tierDescription}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Rationale:</strong> {calculation.reasonMessage}
              </p>
            </div>
          </div>

          {/* Settlement Timeline */}
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              backgroundColor: "rgba(113, 27, 22, 0.06)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "11px",
              color: "var(--ishti-temple-charcoal)",
            }}
          >
            <Clock size={15} color="var(--ishti-temple-maroon)" aria-hidden="true" />
            <span>
              <strong>Estimated Settlement:</strong>{" "}
              {currency === "INR" ? "3 to 5 business days (UPI / Bank)" : "7 to 10 business days (International)"}
            </span>
          </div>
        </div>
      </div>

      {/* Submitted Ticket Confirmation Receipt */}
      {submittedTicket && (
        <div
          className="profileCard"
          style={{
            backgroundColor: "#FAF7F2",
            border: "1px solid var(--ishti-sacred-gold)",
            marginBottom: "32px",
          }}
          role="status"
          aria-live="polite"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <Receipt size={22} color="var(--ishti-temple-maroon)" aria-hidden="true" />
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ishti-temple-charcoal)" }}>
              Refund Request Submitted Successfully
            </h3>
          </div>
          <p style={{ fontSize: "13px", color: "var(--ishti-warm-bronze)", lineHeight: 1.5, marginBottom: "14px" }}>
            Your refund request has been logged in ISHTI&apos;s Commerce Trust queue. In accordance with statutory
            timelines, credit will reflect in your account within the stated processing window.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
              fontSize: "12px",
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--border-card)",
              borderRadius: "8px",
              padding: "12px 16px",
            }}
          >
            <div>
              <span style={{ color: "var(--ishti-warm-bronze)" }}>Request Ticket:</span>{" "}
              <strong>{submittedTicket.id}</strong>
            </div>
            <div>
              <span style={{ color: "var(--ishti-warm-bronze)" }}>Booking Reference:</span>{" "}
              <strong>{submittedTicket.bookingReference}</strong>
            </div>
            <div>
              <span style={{ color: "var(--ishti-warm-bronze)" }}>Refund Net:</span>{" "}
              <strong style={{ color: "var(--ishti-temple-maroon)" }}>
                {formatCurrency(submittedTicket.calculation.netRefundAmount, submittedTicket.currency)}
              </strong>
            </div>
            <div>
              <span style={{ color: "var(--ishti-warm-bronze)" }}>Status:</span>{" "}
              <strong style={{ color: "#15803D" }}>{submittedTicket.status}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <Link
          href="/profile"
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
          <span>Back to Profile</span>
        </Link>
        <div style={{ display: "flex", gap: "16px", fontSize: "12px" }}>
          <Link href="/legal/refunds" style={{ color: "var(--ishti-temple-maroon)", textDecoration: "underline" }}>
            Cancellation &amp; Refund Policy
          </Link>
          <span style={{ color: "var(--border-card)" }}>&bull;</span>
          <Link href="/legal/payments" style={{ color: "var(--ishti-temple-maroon)", textDecoration: "underline" }}>
            Commercial Payment Terms
          </Link>
          <span style={{ color: "var(--border-card)" }}>&bull;</span>
          <Link href="/legal/grievance" style={{ color: "var(--ishti-temple-maroon)", textDecoration: "underline" }}>
            Billing Dispute Redressal
          </Link>
        </div>
      </div>
    </div>
  );
}
