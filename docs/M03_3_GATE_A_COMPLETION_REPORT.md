# ISHTI Milestone M03.3: Gate A Hosted Staging Backup Completion Report

**Document Version:** 1.0  
**Repository:** `C:\Users\as\Documents\GitHub\spiritual-OS`  
**Current Branch:** `main`  
**Target Staging Project:** `zrjptpkhtklfgnovdrny` (Region: `ap-south-1`, Mumbai)  
**Quarantined Production Project:** `zxwkfnvmmxoojewhvsdc` (**HARD-QUARANTINED — ZERO REMOTE ACCESS**)  
**Backup Timestamp:** `2026-11-15T18:55:39.433Z`  
**Supabase CLI Version:** `3.1.0`  
**Final Status:** **`GATE A COMPLETE & VERIFIED`**  

---

## 1. Executive Summary

Milestone **M03.3 (Gate A)** has been successfully executed and independently verified. A complete 3-pass logical backup of the hosted Supabase staging database (`zrjptpkhtklfgnovdrny`) was generated via the Supabase Mumbai Session Pooler (`aws-0-ap-south-1.pooler.supabase.com:5432`), cryptographically checksummed with SHA-256, secured with restrictive Windows ACLs, and verified using [`scripts/backup-staging.ts --verify`](file:///c:/Users/as/Documents/GitHub/spiritual-OS/scripts/backup-staging.ts).

```
==============================================================================
ISHTI GATE A BACKUP EXECUTION RECEIPT
==============================================================================
Target Staging Project:  zrjptpkhtklfgnovdrny (Region: ap-south-1, Mumbai)
Connection Mode:         Supabase Session Pooler (IPv4 compatible, Port 5432)
Execution Status:        COMPLETED
Verification Status:     PASSED (100% Checksum & Size Parity)
Windows ACL Security:    VERIFIED (SYSTEM & operator 'as' only)
==============================================================================
Generated Backup Files:
  1. Schema DDL:   supabase/backups/staging_schema_2026-11-15T18-54-57-175Z.sql (61,444 bytes)
     SHA-256:      7470e940fc90bcd94d7756f76ef3fe3434997a7584d60febe5a5631b154bf208
  2. Data Records: supabase/backups/staging_data_2026-11-15T18-54-57-175Z.sql (6,420 bytes)
     SHA-256:      0b5946d9da01ba0f20c125a0b085e35c8e00d1e3870b5d6290c31f83d2128700
  3. Roles Dump:   supabase/backups/staging_roles_2026-11-15T18-54-57-175Z.sql (297 bytes)
     SHA-256:      25873cec56a2cc6514e204f420231777f85c03da818caa7090cdcdfa89776ecd
  4. Manifest:     supabase/backups/staging_backup_2026-11-15T18-54-57-175Z.meta.json (1,518 bytes)
==============================================================================
```

---

## 2. Backup Pass Details & Inventory

### Pass 1: DDL Schema (`staging_schema_2026-11-15T18-54-57-175Z.sql`)
- **CLI Command:** `supabase db dump --remote="..." --schema public,supabase_migrations --keep-comments`
- **File Size:** `61,444 bytes`
- **SHA-256:** `7470e940fc90bcd94d7756f76ef3fe3434997a7584d60febe5a5631b154bf208`
- **Contents:** Full DDL definitions for all 11 public tables, constraints, foreign keys, triggers, enum types, partial unique indexes (`idx_unique_active_slot_booking`), and existing RLS policies.

### Pass 2: Table Data Records (`staging_data_2026-11-15T18-54-57-175Z.sql`)
- **CLI Command:** `supabase db dump --remote="..." --schema public,supabase_migrations --data-only --use-copy`
- **File Size:** `6,420 bytes`
- **SHA-256:** `0b5946d9da01ba0f20c125a0b085e35c8e00d1e3870b5d6290c31f83d2128700`
- **Seed Record Verification:**
  - `scripture_catalog`: Exactly 1 record (`a0000000-0000-0000-0000-000000000001` — Rigveda Samhita).
  - `canonical_verses`: Exactly 1 record (`b0000000-0000-0000-0000-000000000001` — Rigveda 10.191.2).
  - All transactional tables (`profiles`, `expert_profiles`, `booking_requests`, `consultation_slots`, `kundli_profiles`, `early_access_subscribers`, `rate_limit_events`, `role_assignment_audit`, `user_consents`): 0 rows.

### Pass 3: Cluster Roles (`staging_roles_2026-11-15T18-54-57-175Z.sql`)
- **CLI Command:** `supabase db dump --remote="..." --role-only`
- **File Size:** `297 bytes`
- **SHA-256:** `25873cec56a2cc6514e204f420231777f85c03da818caa7090cdcdfa89776ecd`
- **Contents:** Role configuration statements for `anon`, `authenticated`, and `authenticator` (`statement_timeout`).
- **GOVERNANCE PROHIBITION:** In accordance with **GOV-09**, this file is retained strictly for local disaster-recovery reference and **must NEVER be restored into hosted Supabase**.

---

## 3. Cryptographic & Filesystem Verification

Automated independent verification was executed via:
```powershell
npx.cmd tsx scripts/backup-staging.ts --verify
```

### Verification Results
```text
Target: Latest manifest in supabase/backups/

[PASS] All 3 backup files and directory verified (schema, data, roles). Checksums, sizes, and restrictive permissions match manifest 'staging_backup_2026-11-15T18-54-57-175Z.meta.json'.

==============================================================================
RESULT: VERIFICATION PASSED — BACKUP INTEGRITY & SECURITY CONFIRMED
==============================================================================
```

### Filesystem Permissions (Windows ACL)
Inspection via `icacls supabase\backups\*`:
- Directory inheritance: Disabled (`/inheritance:r`).
- Principals with access: `NT AUTHORITY\SYSTEM:(F)` and `DESKTOP-5BUIUJM\as:(F)`.
- Broad access groups (`Users`, `Everyone`, `Authenticated Users`): Verified absent.
- Git Exclusion: `supabase/backups/` confirmed ignored by `.gitignore`.

---

## 4. Operational Governance Safeguards

1. **Zero Git Inclusion:** Backup SQL and JSON files remain local and git-ignored.
2. **Zero Cloud Uploads:** No external or third-party storage uploads were performed.
3. **Role Dump Quarantine:** Hosted restoration of `staging_roles_*.sql` is strictly forbidden.
4. **Historical Backup Preservation:** This completed backup serves as the active recovery point for Gate B. It will remain preserved and unmodified.
5. **Gate B Remains Locked:** Successful Gate A backup completion does not constitute authorization for Gate B schema reconciliation.
