# ISHTI M05 — Gate G4 Completion Report
## Commerce Trust, Billing & Refund Governance

**Date:** 2026-11-17  
**Milestone:** M05 — Global Legal, Privacy & Trust Foundation  
**Gate:** G4 — Commerce Trust, Billing & Refund Governance  
**Status:** COMPLETED & VERIFIED  

---

### 1. Executive Summary

Gate G4 implements ISHTI's Commerce Trust, Multi-Currency Billing, and Refund Governance architecture. Grounded in the Consumer Protection (E-Commerce) Rules, 2020 (India), the EU Consumer Rights Directive 2011/83/EU, the Payment and Settlement Systems Act, 2007, and international consumer protection standards, G4 operationalizes transparent pricing, cancellation tiers, dispute handling, and automated refund eligibility calculations.

Key capabilities delivered in Gate G4 include:
- Multi-currency support across 6 major currencies (INR, USD, EUR, GBP, AED, SGD) with localized currency formatting and GST/VAT tax breakdown calculations.
- Configurable cancellation tiers for live Jyotish consultations and online puja ceremonies ($T > 24\text{h}$ for 100% minus gateway fee, $4\text{h} \le T \le 24\text{h}$ for 50%, $T < 4\text{h}$ non-refundable).
- Strict compliance with EU Directive 2011/83/EU Article 16(m) for digital goods (14-day statutory right of withdrawal is waived upon express consent when digital performance commences).
- An Expert Reliability Guarantee: 100% full refund with 0% payment gateway deduction in the event of Pandit no-show or platform-initiated cancellation.
- An interactive self-service Refund & Cancellation Simulator at `/profile/refunds`.

---

### 2. Architecture & Deliverables

#### 2.1 Types (`packages/types/src/commerce.ts`)
Added and exported in `@spiritual-os/types`:
- `CurrencyCode`: `'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SGD'`
- `ServiceClassification`: `'live_consultation' | 'online_puja' | 'digital_audio_scripture' | 'pandit_no_show'`
- `RefundRequestStatus`: `'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PROCESSED' | 'FAILED'`
- `CancellationTier`: Min/max hours thresholds, refund percentages, gateway fee deduction rules.
- `RefundCalculation`: Full computation record containing gross refund, gateway fees, net refund, and statutory rationale.
- `RefundRequestRecord`: Persistent ticket model for tracked refund requests.

#### 2.2 Multi-Currency & Invoicing Engine (`apps/web/lib/commerce/multi-currency.ts`)
- Multi-currency definitions for all 6 supported currencies with ISO symbols and locale formatters.
- `computeTaxBreakdown(totalInclusiveAmount, currency)`: Calculates tax inclusive base amounts (GST 18% in India, EU/UK VAT, zero-rated exports).
- `formatCurrency(amount, currency)`: Formats numbers into devotee-facing localized currency strings.

#### 2.3 Fair Cancellation Calculator (`apps/web/lib/commerce/cancellation-calculator.ts`)
- `calculateRefundEligibility(options)`:
  - *Pandit No-Show:* 100% gross and net refund (ISHTI absorbs all transaction fees).
  - *Digital Content:* Non-refundable once downloaded/streamed per EU Directive 2011/83/EU Article 16(m).
  - *Consultations:* Applies $T_1$ (24h) and $T_2$ (4h) cutoff tiers with standard 2.5% payment gateway fee deduction on refunded sums.

#### 2.4 Refund Request Service (`apps/web/lib/commerce/refund-service.ts`)
- `submitRefundRequest(options)`: Generates tracked refund tickets and persists them to devotee local session history.
- `getEstimatedSettlementTimeline(currency)`:
  - Domestic India (UPI / Net Banking / Cards): 3 to 5 business days.
  - International Multi-Currency Network: 7 to 10 business days.

#### 2.5 Refund Simulator & Management UI (`apps/web/app/profile/refunds/page.tsx`)
- Interactive real-time calculator with service classification selector, currency chooser, and time slider.
- Real-time visual breakdown of gross refund, gateway deductions, and net credited amount.
- Direct refund ticket submission with generated reference ID and confirmation receipt.
- Linked in Devotee Profile (`/profile`) and footer navigation.

---

### 3. Verification & Compilation Results

1. **TypeScript Typecheck (`npm run typecheck`):**
   - Clean pass across all workspaces (`@spiritual-os/types`, `@spiritual-os/web`, `@spiritual-os/mobile`). Exit code 0.
2. **Next.js 15 Static Build (`npm run build:web`):**
   - Generated 28 static pages (including `/profile/refunds`). Exit code 0.
3. **Execution Boundaries Respected:**
   - Zero live payment gateway transactions or real monetary charges executed.
   - Zero database mutations against staging or production Supabase.
   - Zero Git commits or pushes.

---

### 4. Gate Sign-Off

Gate G4 is formally complete. Proceeding sequentially to Gate G5: Compliance Operations & Security Governance.
