# ISHTI M03.1 — Controlled Staging Reconciliation & Migration Baseline Plan

**Milestone:** M03.1  
**Project:** ISHTI (internal codename: `spiritual-OS`)  
**Repository:** `Sunder-Chauhan/Ishti-OS`  
**Branch:** `main`  
**Baseline Git HEAD Commit:** `04661a3549f7c9f0f312c3f0a50ba3720b1717f8`  
**Target Staging Project:** `zrjptpkhtklfgnovdrny` (Region: `ap-south-1` Mumbai)  
**Production Project:** `zxwkfnvmmxoojewhvsdc` (**QUARANTINED — ZERO-MUTATION BOUNDARY**)  
**Milestone Status:** `M03.1 — RECONCILIATION PLAN READY / REMOTE EXECUTION AWAITING EXPLICIT APPROVAL`

---

## 1. Executive Summary & Objective

The objective of Milestone **M03.1** is to establish a verified, controlled, and reproducible staging database baseline. 

An independent read-only inspection previously revealed that staging project `zrjptpkhtklfgnovdrny` was partially initialized via manual execution in the Supabase Dashboard SQL Editor. The database contains 11 public tables, 2 seed rows, but **0 recorded migrations** in `supabase_migrations.schema_migrations`. Furthermore, policy declarations halted mid-execution due to multi-line token splitting syntax errors (`ERROR: 42601`), leaving scholar policies declared with `{public}` instead of the intended `TO authenticated` and downstream policies omitted.

This document details the complete object-by-object database drift analysis, the design and safety architecture of the non-destructive reconciliation script ([scripts/reconcile-staging-schema.ts](file:///C:/Users/as/Documents/GitHub/spiritual-OS/scripts/reconcile-staging-schema.ts)), the exact sequence of operations, and comprehensive rollback procedures.

**STRICT GOVERNANCE BOUNDARY:** In accordance with execution guidelines, **no remote database mutations have been executed**. The reconciliation script has been engineered, validated locally, and placed in the repository in dry-run mode, awaiting explicit user authorization.

---

## 2. Mandatory Environment Boundaries

| Environment | Project Name | Project Reference | Region | Hosting | Status / Boundary Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Staging** | `ishti-staging` | `zrjptpkhtklfgnovdrny` | `ap-south-1` | Supabase Cloud | Dedicated disposable staging project; target of this reconciliation plan. |
| **Production** | `ishti-production` | `zxwkfnvmmxoojewhvsdc` | `ap-south-1` | Supabase Cloud | **STRICTLY QUARANTINED.** Zero connections, migrations, or DDL/DML authorized. |

---

## 3. Complete Object-by-Object Database Drift Analysis

The live staging database state was compared against the canonical baseline migration script ([supabase/migrations/20261114000000_initial_schema.sql](file:///C:/Users/as/Documents/GitHub/spiritual-OS/supabase/migrations/20261114000000_initial_schema.sql), SHA-256: `3399a7317e1933f989d4a9688cac84d6d407006e930614ad90508efa52ea87ed`):

### A. Extensions & System Schemas
| Object | Expected Definition | Live Staging State | Drift Status | Analysis & Remediation |
| :--- | :--- | :--- | :---: | :--- |
| `extensions.uuid-ossp` | Extension enabled | Enabled | **MATCH** | Installed during initial setup |
| `extensions.pgcrypto` | Extension enabled | Enabled | **MATCH** | Installed during initial setup |
| `supabase_migrations` | System schema | Exists | **MATCH** | Schema created by Supabase engine |
| `supabase_migrations.schema_migrations` | Table with migration history | 0 rows | **MISMATCH** | CLI was not used; version `20261114000000` missing |

### B. Public Application Tables (11 Tables)
| Table Name | Expected Columns & Types | Live Columns & Types | Live RLS | Status |
| :--- | :--- | :--- | :---: | :---: |
| `profiles` | 9 columns (`id`, `phone`, `email`, `full_name`, `role`, `is_verified`, `avatar_url`, `created_at`, `updated_at`) | Matches migration | ENABLED | **MATCH** |
| `role_assignment_audit` | 8 columns (`id`, `user_id`, `previous_role`, `new_role`, `assigned_by`, `assigned_by_system`, `reason`, `created_at`) | Matches migration | ENABLED | **MATCH** |
| `user_consents` | 9 columns (`id`, `user_id`, `purpose`, `granted`, `consent_version`, `ip_hash`, `user_agent`, `granted_at`, `revoked_at`) | Matches migration | ENABLED | **MATCH** |
| `scripture_catalog` | 20 columns (`id`, `slug`, `title_iast`, `title_devanagari`, `category`, `description`, `total_verses`, `language`, `tradition_sampradaya`, `source_edition`, `publication_publisher`, `publication_year`, `editor_or_compiler`, `rights_holder`, `license_type`, `permitted_use`, `commercial_rights_status`, `rights_clearance_status`, `status`, `created_at`, `updated_at`) | Matches migration | ENABLED | **MATCH** |
| `canonical_verses` | 20 columns (`id`, `scripture_id`, `canto_kanda_mandal`, `chapter_adhyaya_sukta`, `verse_number`, `devanagari`, `iast`, `word_for_word`, `translations`, `meter_chandas`, `deity_devata`, `seer_rishi`, `source_citation`, `scholarly_peer_reviewer`, `peer_review_date`, `scholarly_verification_notes`, `rights_clearance_status`, `review_status`, `fts`, `created_at`, `updated_at`) | Matches migration | ENABLED | **MATCH** |
| `kundli_profiles` | 13 columns (`id`, `user_id`, `profile_name`, `gender`, `ciphertext_dob`, `ciphertext_tob`, `ciphertext_coordinates`, `encryption_key_version`, `encryption_iv`, `encryption_auth_tag`, `ayanamsha`, `is_primary`, `created_at`, `updated_at`) | Matches migration | ENABLED | **MATCH** |
| `expert_profiles` | 13 columns (`id`, `user_id`, `full_name`, `title`, `specializations`, `languages`, `experience_years`, `hourly_fee_inr`, `is_active`, `verification_status`, `bio`, `created_at`, `updated_at`) | Matches migration | ENABLED | **MATCH** |
| `consultation_slots` | 6 columns (`id`, `expert_id`, `start_time`, `end_time`, `is_booked`, `created_at`) | Matches migration | ENABLED | **MATCH** |
| `booking_requests` | 9 columns (`id`, `expert_id`, `user_id`, `slot_id`, `service_type`, `status`, `amount_inr`, `payment_status`, `created_at`, `updated_at`) | Matches migration | ENABLED | **MATCH** |
| `early_access_subscribers` | 9 columns (`id`, `email`, `phone`, `name`, `traditions`, `language_preference`, `source`, `ip_hash`, `created_at`) | Matches migration | ENABLED | **MATCH** |
| `rate_limit_events` | 4 columns (`id`, `bucket`, `identifier_hash`, `created_at`) | Matches migration | ENABLED | **MATCH** |

### C. Seed Data Audit
| Table | Expected Seed Row | Live Staging Row | Status |
| :--- | :--- | :--- | :---: |
| `scripture_catalog` | `slug = 'bhagavad-gita'`, `title_iast = 'Śrīmad Bhagavad Gītā'`, `category = 'itihasa'`, `rights_holder = 'Pending Legal Clearance'`, `license_type = 'Under Legal Review'`, `commercial_rights_status = 'under_legal_review'`, `rights_clearance_status = 'pending_clearance'`, `status = 'draft'` | Exactly matches expected seed | **MATCH** |
| `canonical_verses` | `chapter_adhyaya_sukta = 2`, `verse_number = 47`, `rights_clearance_status = 'pending_clearance'`, `review_status = 'pending_peer_review'` | Exactly matches expected seed | **MATCH** |
| Other 9 tables | 0 rows | 0 rows | **MATCH** |

### D. RLS Policies & Role Scope Drift
Out of **31 expected RLS policies**, only policies prior to line 915 were created during manual dashboard execution. Furthermore, the two scholar policies were created without explicit role scoping:

| Policy Name | Target Table | Expected Role | Live Role | Status / Consequence |
| :--- | :--- | :---: | :---: | :--- |
| `Public profiles are viewable by everyone` | `profiles` | `public` | `{public}` | **MATCH** |
| `Users can insert their own profile` | `profiles` | `public` | `{public}` | **MATCH** |
| `Users can update own profile` | `profiles` | `public` | `{public}` | **MATCH** |
| `Admins view all profiles non-recursively` | `profiles` | `public` | `{public}` | **MATCH** |
| `Admins can view role assignment audit` | `role_assignment_audit` | `public` | `{public}` | **MATCH** |
| `Users can view their own consents` | `user_consents` | `public` | `{public}` | **MATCH** |
| `Users can insert their own consents` | `user_consents` | `public` | `{public}` | **MATCH** |
| `Users can update their own consents` | `user_consents` | `public` | `{public}` | **MATCH** |
| `Admins can view all consents` | `user_consents` | `public` | `{public}` | **MATCH** |
| `Public read scripture catalog` | `scripture_catalog` | `public` | `{public}` | **MATCH** |
| `Scholars and admins can manage scripture catalog` | `scripture_catalog` | **`authenticated`** | **`{public}`** | **CRITICAL DRIFT:** Missing `TO authenticated`. Evaluates `public.is_scholar()` for anonymous callers, causing `ERROR: 42501` function permission denied crashes |
| `Public read verified verses` | `canonical_verses` | `public` | `{public}` | **MATCH** |
| `Scholars and admins can manage verses` | `canonical_verses` | **`authenticated`** | **`{public}`** | **CRITICAL DRIFT:** Missing `TO authenticated`. Causes `ERROR: 42501` function permission denied crashes on anonymous queries |
| Policies on remaining 6 tables (18 policies) | `kundli_profiles`, `expert_profiles`, `consultation_slots`, `booking_requests`, `early_access_subscribers`, `rate_limit_events` | Defined in migration | **MISSING** | **CRITICAL DRIFT:** Interrupted at line 915 syntax error; tables currently lack explicit SELECT/INSERT/UPDATE/DELETE access policies |

---

## 4. Deep-Dive: Scholar-Management Policy Role Scoping

### The PostgreSQL Function Permission Trap
In PostgreSQL Row-Level Security:
- When a policy omits the `TO <role>` clause, PostgreSQL defaults the policy target to `PUBLIC` (meaning all database roles, including `anon`).
- The scholar-management policy uses the qualifying expression `USING (public.is_scholar())`.
- The function `public.is_scholar()` is declared with:
  ```sql
  REVOKE ALL ON FUNCTION public.is_scholar() FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.is_scholar() TO authenticated, service_role;
  ```
- **The Consequence:** When an unauthenticated (`anon`) client queries `scripture_catalog`, PostgreSQL evaluates all active SELECT policies on the table. If a policy targeting `PUBLIC` calls `public.is_scholar()`, PostgreSQL attempts to execute the function on behalf of the `anon` role. Because `anon` has no execute grant, execution halts immediately with:
  `ERROR: 42501: permission denied for function is_scholar`
- **The Resolution:** Scoping the policy strictly to `TO authenticated`:
  ```sql
  CREATE POLICY "Scholars and admins can manage scripture catalog" ON public.scripture_catalog FOR ALL
    TO authenticated
    USING (public.is_scholar())
    WITH CHECK (public.is_scholar());
  ```
  PostgreSQL evaluates this policy **only** when `auth.role() = 'authenticated'`. For `anon` users, the policy is completely bypassed, and only `"Public read scripture catalog"` is evaluated, returning 0 rows cleanly without crashing.

---

## 5. Safe Reconciliation Design ([scripts/reconcile-staging-schema.ts](file:///C:/Users/as/Documents/GitHub/spiritual-OS/scripts/reconcile-staging-schema.ts))

To eliminate operational ambiguity and avoid blind tool execution, a controlled TypeScript runner was engineered.

### Safety Guarantees & Features:
1. **Quarantine Enforcement:** Fails immediately with a fatal error if `STAGING_DATABASE_URL` contains the production project ref (`zxwkfnvmmxoojewhvsdc`).
2. **Dry-Run by Default:** Without the `--execute` flag, the script performs read-only inspection, reports drift, and exits without making changes.
3. **Atomic Transaction:** When executed, all policy reconciliations and migration registrations occur inside a single `BEGIN ... COMMIT` block. Any error triggers an immediate `ROLLBACK`.
4. **Zero Destructive Actions:** Never drops tables, alters table columns, or deletes existing seed rows.
5. **Postcondition Validation:** Explicitly checks `pg_policies` to verify that all 31 policies are active and that both scholar policies contain only `{"authenticated"}`.
6. **Registration Integrity:** Records version `20261114000000` in `supabase_migrations.schema_migrations` only after postcondition policy verification passes.

---

## 6. Migration Repair vs. Controlled Baseline Migration

| Operation | Mechanism | Safety in Current Staging State | Recommendation |
| :--- | :--- | :---: | :--- |
| **`supabase migration repair --status applied 20261114000000`** | Inserts a row into `supabase_migrations.schema_migrations` without executing DDL. | **UNSAFE / PREMATURE** | Blindly running repair records the migration as applied while leaving 18 policies missing and 2 scholar policies misconfigured with `{public}`. |
| **`supabase db push`** | Inspects `schema_migrations`, detects missing version, and executes the declarative migration script. | **ACCEPTABLE BUT UNVALIDATED** | Idempotent DDL succeeds; however, Supabase CLI does not validate whether specific policies had drifted or whether postconditions were satisfied. |
| **Controlled Reconciliation Script (`scripts/reconcile-staging-schema.ts`)** | Validates preconditions, applies exact missing policies in an atomic transaction, validates postconditions, and registers migration history. | **RECOMMENDED & SAFEST** | Verifies every single object before marking the migration complete. |

---

## 7. Step-by-Step Order of Operations

Upon receiving explicit user authorization, the reconciliation will be executed following this strict 6-step sequence:

```
[Step 1: Backup]
  supabase db dump -f supabase/backups/staging_pre_reconciliation.sql
         │
         ▼
[Step 2: Dry-Run Inspection]
  STAGING_DATABASE_URL="..." npx tsx scripts/reconcile-staging-schema.ts
         │
         ▼
[Step 3: Transactional Execution]
  STAGING_DATABASE_URL="..." npx tsx scripts/reconcile-staging-schema.ts --execute
         │
         ▼
[Step 4: Postcondition Verification]
  Verify 31 policies in pg_policies and confirm scholar policies = {authenticated}
         │
         ▼
[Step 5: Migration Registration Confirmation]
  Verify 1 row in supabase_migrations.schema_migrations (version 20261114000000)
         │
         ▼
[Step 6: CLI Alignment Verification]
  supabase db push --dry-run (Must output: "Remote database is up to date")
```

---

## 8. Rollback Procedure & Disaster Recovery

If any unexpected error occurs during reconciliation:

### Scenario A: In-Flight Failure during Script Execution
- **Behavior:** The script wraps all changes in `BEGIN ... COMMIT`. An error triggers an immediate `ROLLBACK`.
- **Action Required:** None. Database state reverts automatically to the exact pre-reconciliation state.

### Scenario B: Manual Rollback after Execution
If the operator wishes to restore the pre-reconciliation state:
1. Restore from the logical backup created in Step 1:
   ```bash
   psql "$STAGING_DATABASE_URL" -f supabase/backups/staging_pre_reconciliation.sql
   ```
2. Alternatively, remove downstream policies manually:
   ```sql
   DROP POLICY IF EXISTS "Scholars and admins can manage scripture catalog" ON public.scripture_catalog;
   DROP POLICY IF EXISTS "Scholars and admins can manage verses" ON public.canonical_verses;
   DELETE FROM supabase_migrations.schema_migrations WHERE version = '20261114000000';
   ```

---

## 9. Operations Requiring Explicit User Approval

Before any live action is taken, the following operations require explicit approval:
1. Exporting the pre-reconciliation logical dump from Supabase staging.
2. Executing `npx tsx scripts/reconcile-staging-schema.ts --execute` against `zrjptpkhtklfgnovdrny`.
3. Provisioning and setting real staging Supabase API credentials (`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) in local untracked `.env` files.
4. Confirming rotation of the compromised Razorpay sandbox test key pair in the Razorpay Dashboard.

**Current Gate Status:** `M03.1 — RECONCILIATION PLAN READY / REMOTE EXECUTION AWAITING EXPLICIT APPROVAL`
