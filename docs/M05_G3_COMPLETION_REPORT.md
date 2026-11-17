# ISHTI M05 — Gate G3 Completion Report
## Privacy Rights, Retention & Deletion

**Date:** 2026-11-17  
**Milestone:** M05 — Global Legal, Privacy & Trust Foundation  
**Gate:** G3 — Privacy Rights, Retention & Deletion  
**Status:** COMPLETED & VERIFIED  

---

### 1. Executive Summary

Gate G3 implements ISHTI's end-to-end Data Subject Rights, Statutory Retention, and Account Erasure architecture. Grounded in §11 (Right to Access), §12 (Right to Correction & Erasure), and §13 (Grievance Redressal) of India's Digital Personal Data Protection Act, 2023, along with GDPR Articles 15–20 and California Consumer Privacy Act / CPRA §1798.100–105, G3 provides devotees with self-service tools to inspect, export, and erase their personal and devotional data.

Crucially, G3 operationalizes the statutory retention matrix reconciled in G0.1:
- Statutory financial accounting and tax records are preserved for **7 years under the Income-tax Act, 2025 (§62 / Rule 46)** and for **8 financial years under the Companies Act, 2013 (§128)**.
- When an account erasure request is executed, personal identity is detached and pseudonymized to `'ANON-USER-DELETED'` across historical invoices, satisfying statutory tax ledgers without retaining personal data.
- Personal devotional records (Sankalpa intentions, prayer notes) and encrypted astrological records (Kundli birth coordinates) are permanently and irreversibly shredded.
- A cryptographically signed Deletion Certificate containing a SHA-256 receipt hash is generated and delivered to the devotee.

---

### 2. Architecture & Deliverables

#### 2.1 Types (`packages/types/src/privacy.ts`)
Added and exported in `@spiritual-os/types`:
- `PrivacyRequestType`: `'export' | 'delete' | 'rectify' | 'restrict'`
- `PrivacyRequestStatus`: `'SUBMITTED' | 'IDENTITY_VERIFIED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED'`
- `DeletionStage`:
  1. `VERIFICATION`
  2. `ANTI_CASCADE_UNLINKING`
  3. `ASTRO_KEY_SHREDDING`
  4. `SPIRITUAL_CONTENT_SCRUBBING`
  5. `FINANCIAL_PSEUDONYMIZATION`
  6. `CACHE_PURGE`
  7. `PROOF_RECEIPT`
- `RetentionRule`: Schema tracking record type, legal entity, statutory citation, retention years, trigger, and exception rationale.
- `ExportDataPackage`: SAR bundle metadata, profile, consents, kundli encryption notice, and booking summary.
- `DeletionCertificate`: Immutable receipt with stages completed, shredded tables, pseudonymized identity, and SHA-256 certificate hash.

#### 2.2 Statutory Retention Matrix (`apps/web/lib/privacy/retention-matrix.ts`)
Authoritative matrix encoding statutory requirements:
- Invoices & GST vouchers: 7 years under Income-tax Act, 2025 §62 / Rule 46 & CGST Act 2017 §36 (Statutory Lock: YES).
- Company financial books: 8 financial years under Companies Act, 2013 §128(5) (Statutory Lock: YES).
- Account registration trail: 180 days under IT Rules 2021 Rule 3(1)(h) (Statutory Lock: YES).
- Astrological birth data: 0 years; immediate shredding upon deletion (Statutory Lock: NO).
- Spiritual intentions & prayer notes: 0 years; immediate scrubbing upon deletion (Statutory Lock: NO).
- Rate-limiting IP hashes & session tokens: 90 days rolling expiration (Statutory Lock: NO).

#### 2.3 SAR Export Service (`apps/web/lib/privacy/export-service.ts`)
- `generateSARDataPackage(options)`: Compiles user profile, active consents, cryptographic audit records, and encrypted Kundli descriptors.
- Computes deterministic SHA-256 fingerprint for data integrity verification.
- Packages data into downloadable JSON format.

#### 2.4 Seven-Stage Deletion Orchestrator (`apps/web/lib/privacy/deletion-orchestrator.ts`)
- Executes the 7-stage deletion sequence:
  1. Verification of devotee declaration.
  2. Anti-cascade unlinking to preserve scripture commentary threads without personal identity.
  3. Cryptographic shredding of encrypted astrological birth records.
  4. Spiritual content scrubbing of private Sankalpa notes and prayer requests.
  5. Financial record pseudonymization: reassigns invoice records to `'ANON-USER-DELETED'`.
  6. Distributed session and cache purge.
  7. Cryptographic proof receipt issuance with SHA-256 certificate hash.

#### 2.5 Devotee Privacy Sanctuary UI (`apps/web/app/profile/privacy/page.tsx`)
- One-click machine-readable JSON SAR Export download.
- Interactive 7-stage deletion orchestrator with double-confirmation safeguards.
- Cryptographic Deletion Certificate rendering with copyable SHA-256 proof hash.
- Authoritative Statutory Retention Matrix table with clear `LOCKED (LAW)` vs `ERASABLE` status pills.
- Connected to devotee profile navigation in `apps/web/app/profile/page.tsx`.

---

### 3. Verification & Compilation Results

1. **TypeScript Typecheck (`npm run typecheck`):**
   - Clean pass across all workspaces (`@spiritual-os/types`, `@spiritual-os/web`, `@spiritual-os/mobile`). Exit code 0.
2. **Next.js 15 Static Build (`npm run build:web`):**
   - Generated 27 static pages (including `/profile/privacy`). Exit code 0.
3. **Execution Boundaries Respected:**
   - Zero live database connections to staging or production Supabase.
   - Deletion and export workflows execute purely in local client/browser simulation.
   - Zero Git commits or pushes.

---

### 4. Gate Sign-Off

Gate G3 is formally complete. Proceeding sequentially to Gate G4: Commerce Trust, Billing & Refund Governance.
