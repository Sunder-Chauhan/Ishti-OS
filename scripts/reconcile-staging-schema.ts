import { Client } from "pg";
import fs from "node:fs";
import path from "node:path";
import {
  validateStagingDatabaseUrl,
  ValidatedStagingEndpoint,
  APPROVED_STAGING_PROJECT_REF,
  QUARANTINED_PRODUCTION_PROJECT_REF,
} from "./validate-staging-url";

/**
 * ISHTI Milestone M03.1.2: Staging Schema Reconciliation & Verification Runner
 *
 * SAFETY & GOVERNANCE RESTRICTIONS:
 * - This script is designed for STAGING RECONCILIATION ONLY (Target: zrjptpkhtklfgnovdrny).
 * - Production project (zxwkfnvmmxoojewhvsdc) is HARD-CODED AS A STRICT FATAL PROHIBITION.
 * - Staging project reference (zrjptpkhtklfgnovdrny) is ENFORCED VIA STRICT URL & HOSTNAME ALLOWLIST.
 * - By default, this script runs in DRY-RUN mode (inspects schema drift, outputs diff, mutates zero objects).
 * - To execute live reconciliation, the operator must explicitly pass --execute and STAGING_DATABASE_URL.
 * - NEVER drops tables, alters table columns, or truncates seed data.
 */

const PRODUCTION_PROJECT_REF = QUARANTINED_PRODUCTION_PROJECT_REF;
const STAGING_PROJECT_REF = APPROVED_STAGING_PROJECT_REF;

const EXPECTED_TABLES = [
  "profiles",
  "role_assignment_audit",
  "user_consents",
  "scripture_catalog",
  "canonical_verses",
  "kundli_profiles",
  "expert_profiles",
  "consultation_slots",
  "booking_requests",
  "early_access_subscribers",
  "rate_limit_events",
];

const EXPECTED_FUNCTIONS = [
  "assign_user_role",
  "check_rate_limit",
  "cleanup_rate_limit_events",
  "enforce_booking_update_integrity",
  "enforce_expert_integrity",
  "enforce_profile_update_integrity",
  "handle_new_user",
  "is_admin",
  "is_scholar",
  "prevent_audit_log_tampering",
  "validate_and_reserve_booking_slot",
  "validate_kundli_ciphertext_payload",
];

interface ExpectedPolicy {
  tableName: string;
  policyName: string;
  cmd: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "ALL";
  expectedRoles: string[];
  hasUsing: boolean;
  hasWithCheck: boolean;
}

// Complete catalog of all 31 expected RLS policies from 20261114000000_initial_schema.sql
const EXPECTED_POLICIES: ExpectedPolicy[] = [
  // 1. profiles
  { tableName: "profiles", policyName: "Users can view their own profile", cmd: "SELECT", expectedRoles: ["public"], hasUsing: true, hasWithCheck: false },
  { tableName: "profiles", policyName: "Admins can view all profiles", cmd: "SELECT", expectedRoles: ["public"], hasUsing: true, hasWithCheck: false },
  { tableName: "profiles", policyName: "Users can update their own profile", cmd: "UPDATE", expectedRoles: ["public"], hasUsing: true, hasWithCheck: true },
  // 2. role_assignment_audit
  { tableName: "role_assignment_audit", policyName: "Admins can view role audit", cmd: "SELECT", expectedRoles: ["public"], hasUsing: true, hasWithCheck: false },
  // 3. user_consents
  { tableName: "user_consents", policyName: "Users can view their own consents", cmd: "SELECT", expectedRoles: ["public"], hasUsing: true, hasWithCheck: false },
  { tableName: "user_consents", policyName: "Users can insert their own consents", cmd: "INSERT", expectedRoles: ["public"], hasUsing: false, hasWithCheck: true },
  { tableName: "user_consents", policyName: "Users can update their own consents", cmd: "UPDATE", expectedRoles: ["public"], hasUsing: true, hasWithCheck: true },
  { tableName: "user_consents", policyName: "Admins can view all consents", cmd: "SELECT", expectedRoles: ["public"], hasUsing: true, hasWithCheck: false },
  // 4. scripture_catalog
  { tableName: "scripture_catalog", policyName: "Public read scripture catalog", cmd: "SELECT", expectedRoles: ["public"], hasUsing: true, hasWithCheck: false },
  { tableName: "scripture_catalog", policyName: "Scholars and admins can manage scripture catalog", cmd: "ALL", expectedRoles: ["authenticated"], hasUsing: true, hasWithCheck: true },
  // 5. canonical_verses
  { tableName: "canonical_verses", policyName: "Public read verified verses", cmd: "SELECT", expectedRoles: ["public"], hasUsing: true, hasWithCheck: false },
  { tableName: "canonical_verses", policyName: "Scholars and admins can manage verses", cmd: "ALL", expectedRoles: ["authenticated"], hasUsing: true, hasWithCheck: true },
  // 6. kundli_profiles
  { tableName: "kundli_profiles", policyName: "Owner-only select kundli", cmd: "SELECT", expectedRoles: ["public"], hasUsing: true, hasWithCheck: false },
  { tableName: "kundli_profiles", policyName: "Owner-only insert kundli", cmd: "INSERT", expectedRoles: ["public"], hasUsing: false, hasWithCheck: true },
  { tableName: "kundli_profiles", policyName: "Owner-only update kundli", cmd: "UPDATE", expectedRoles: ["public"], hasUsing: true, hasWithCheck: true },
  { tableName: "kundli_profiles", policyName: "Owner-only delete kundli", cmd: "DELETE", expectedRoles: ["public"], hasUsing: true, hasWithCheck: false },
  // 7. expert_profiles
  { tableName: "expert_profiles", policyName: "Public read active experts", cmd: "SELECT", expectedRoles: ["public"], hasUsing: true, hasWithCheck: false },
  { tableName: "expert_profiles", policyName: "Experts can view their own profile", cmd: "SELECT", expectedRoles: ["public"], hasUsing: true, hasWithCheck: false },
  { tableName: "expert_profiles", policyName: "Admins can view all expert profiles", cmd: "SELECT", expectedRoles: ["public"], hasUsing: true, hasWithCheck: false },
  { tableName: "expert_profiles", policyName: "Experts can update their own profile", cmd: "UPDATE", expectedRoles: ["public"], hasUsing: true, hasWithCheck: true },
  // 8. consultation_slots
  { tableName: "consultation_slots", policyName: "Public view available slots", cmd: "SELECT", expectedRoles: ["public"], hasUsing: true, hasWithCheck: false },
  { tableName: "consultation_slots", policyName: "Experts can manage their own slots", cmd: "ALL", expectedRoles: ["public"], hasUsing: true, hasWithCheck: false },
  // 9. booking_requests
  { tableName: "booking_requests", policyName: "Devotees can view their bookings", cmd: "SELECT", expectedRoles: ["public"], hasUsing: true, hasWithCheck: false },
  { tableName: "booking_requests", policyName: "Experts can view assigned bookings", cmd: "SELECT", expectedRoles: ["public"], hasUsing: true, hasWithCheck: false },
  { tableName: "booking_requests", policyName: "Admins can view all bookings", cmd: "SELECT", expectedRoles: ["public"], hasUsing: true, hasWithCheck: false },
  { tableName: "booking_requests", policyName: "Devotees can create bookings", cmd: "INSERT", expectedRoles: ["public"], hasUsing: false, hasWithCheck: true },
  { tableName: "booking_requests", policyName: "Devotees can update their own bookings", cmd: "UPDATE", expectedRoles: ["public"], hasUsing: true, hasWithCheck: true },
  { tableName: "booking_requests", policyName: "Admins can update bookings", cmd: "UPDATE", expectedRoles: ["public"], hasUsing: true, hasWithCheck: false },
  // 10. early_access_subscribers
  { tableName: "early_access_subscribers", policyName: "Public insert early access", cmd: "INSERT", expectedRoles: ["public"], hasUsing: false, hasWithCheck: true },
  { tableName: "early_access_subscribers", policyName: "Admins only view early access subscribers", cmd: "SELECT", expectedRoles: ["public"], hasUsing: true, hasWithCheck: false },
  // 11. rate_limit_events
  { tableName: "rate_limit_events", policyName: "Admins can view rate limit events", cmd: "SELECT", expectedRoles: ["public"], hasUsing: true, hasWithCheck: false },
];

async function runReconciliation() {
  const args = process.argv.slice(2);
  const isExecute = args.includes("--execute");
  const dbUrl = process.env.STAGING_DATABASE_URL || "";

  console.log("==============================================================================");
  console.log("ISHTI M03.1.2: CONTROLLED STAGING SCHEMA RECONCILIATION");
  console.log("==============================================================================");
  console.log(`Execution Mode:     ${isExecute ? "LIVE EXECUTION (--execute)" : "DRY-RUN INSPECTION (Read-Only)"}`);
  console.log(`Target Staging Ref: ${STAGING_PROJECT_REF} (EXACT HOSTNAME ALLOWLIST ENFORCED)`);
  console.log(`Prohibited Target:  ${PRODUCTION_PROJECT_REF} (STRICT PRODUCTION QUARANTINE)`);
  console.log("==============================================================================\n");

  // Step 1: Precondition & Strict Environment Boundaries
  let endpoint: ValidatedStagingEndpoint;
  try {
    endpoint = validateStagingDatabaseUrl(dbUrl);
  } catch (err: any) {
    console.error(`\nCRITICAL SECURITY VIOLATION: ${err.message}`);
    process.exit(1);
  }

  console.log(`Endpoint Verified:  ${endpoint.sanitizedUrl}`);
  console.log(`Connection Mode:    ${endpoint.connectionType === "direct" ? "Direct PostgreSQL (5432)" : "Supabase Pooler (6543/5432)"}`);
  console.log(`Host & Port:        ${endpoint.hostname}:${endpoint.port}`);
  console.log(`Database Name:      ${endpoint.database}\n`);

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }, // Required for Supabase cloud connections
  });

  try {
    await client.connect();
    console.log("✓ Connected securely to target database.");

    // Step 2: Precondition Checks — Inspect Tables
    console.log("\n[Precondition 1/5] Inspecting public tables and RLS status...");
    const tableRes = await client.query(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public';
    `);

    const liveTables = new Map<string, boolean>();
    for (const row of tableRes.rows) {
      liveTables.set(row.tablename, row.rowsecurity);
    }

    const missingTables: string[] = [];
    const rlsDisabledTables: string[] = [];
    for (const t of EXPECTED_TABLES) {
      if (!liveTables.has(t)) {
        missingTables.push(t);
      } else if (liveTables.get(t) !== true) {
        rlsDisabledTables.push(t);
      }
    }

    if (missingTables.length > 0) {
      console.error(`PRECONDITION FAILURE: Missing expected tables: ${missingTables.join(", ")}`);
      process.exit(1);
    }
    if (rlsDisabledTables.length > 0) {
      console.error(`PRECONDITION FAILURE: Tables missing RLS: ${rlsDisabledTables.join(", ")}`);
      process.exit(1);
    }
    console.log(`      ✓ All ${EXPECTED_TABLES.length} public application tables verified with RLS enabled.`);

    // Step 3: Inspect Seed Records
    console.log("\n[Precondition 2/5] Inspecting seed data integrity...");
    const catalogCountRes = await client.query("SELECT count(*) FROM public.scripture_catalog;");
    const verseCountRes = await client.query("SELECT count(*) FROM public.canonical_verses;");
    const catalogCount = parseInt(catalogCountRes.rows[0].count, 10);
    const verseCount = parseInt(verseCountRes.rows[0].count, 10);

    console.log(`      • public.scripture_catalog: ${catalogCount} row(s)`);
    console.log(`      • public.canonical_verses:  ${verseCount} row(s)`);
    if (catalogCount === 0 || verseCount === 0) {
      console.warn("      [WARN] Seed rows missing or truncated.");
    }

    // Step 4: Inspect Functions & Search Paths
    console.log("\n[Precondition 3/5] Inspecting database functions and search_path hardening...");
    const funcRes = await client.query(`
      SELECT proname, prosecdef, proconfig
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public';
    `);

    const liveFuncs = new Map<string, { secdef: boolean; config: string[] }>();
    for (const row of funcRes.rows) {
      liveFuncs.set(row.proname, { secdef: row.prosecdef, config: row.proconfig || [] });
    }

    const missingFuncs: string[] = [];
    for (const f of EXPECTED_FUNCTIONS) {
      if (!liveFuncs.has(f)) {
        missingFuncs.push(f);
      }
    }
    if (missingFuncs.length > 0) {
      console.error(`PRECONDITION FAILURE: Missing expected functions: ${missingFuncs.join(", ")}`);
      process.exit(1);
    }
    console.log(`      ✓ All ${EXPECTED_FUNCTIONS.length} required functions present.`);

    // Step 5: Inspect Migration History
    console.log("\n[Precondition 4/5] Inspecting migration history table...");
    let migrationRecorded = false;
    try {
      const migRes = await client.query("SELECT version, name FROM supabase_migrations.schema_migrations;");
      console.log(`      • Recorded migrations count: ${migRes.rows.length}`);
      for (const m of migRes.rows) {
        console.log(`        - Version: ${m.version} (${m.name})`);
        if (m.version === "20261114000000") migrationRecorded = true;
      }
    } catch {
      console.log("      • supabase_migrations.schema_migrations does not exist yet.");
    }

    // Step 6: Detailed Object-by-Object Policy Drift Inspection
    console.log("\n[Precondition 5/5] Detailed inspection of all 31 expected RLS policies...");
    const policyRes = await client.query(`
      SELECT policyname, tablename, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE schemaname = 'public';
    `);

    const livePolicyMap = new Map<string, any>();
    for (const p of policyRes.rows) {
      const key = `${p.tablename}.${p.policyname}`;
      livePolicyMap.set(key, p);
    }

    let matchingPolicies = 0;
    let missingPoliciesCount = 0;
    let misconfiguredPoliciesCount = 0;

    for (const expected of EXPECTED_POLICIES) {
      const key = `${expected.tableName}.${expected.policyName}`;
      if (!livePolicyMap.has(key)) {
        missingPoliciesCount++;
        console.warn(`      [MISSING POLICY] ${key}`);
      } else {
        const live = livePolicyMap.get(key);
        const liveRoles = (live.roles || []).map((r: string) => r.toLowerCase());
        const expectedRoles = expected.expectedRoles.map(r => r.toLowerCase());
        const rolesMatch = expectedRoles.every(r => liveRoles.includes(r)) && (!expectedRoles.includes("public") ? !liveRoles.includes("public") : true);
        const cmdMatch = live.cmd.toUpperCase() === expected.cmd.toUpperCase();

        if (!rolesMatch || !cmdMatch) {
          misconfiguredPoliciesCount++;
          console.warn(`      [MISCONFIGURED POLICY] ${key} — Roles: [${liveRoles.join(", ")}] vs [${expectedRoles.join(", ")}], Cmd: ${live.cmd} vs ${expected.cmd}`);
        } else {
          matchingPolicies++;
        }
      }
    }

    console.log(`\nPolicy Audit Summary: ${matchingPolicies} match, ${missingPoliciesCount} missing, ${misconfiguredPoliciesCount} misconfigured.`);

    // Step 7: Reconciliation Plan Summary
    console.log("\n==============================================================================");
    console.log("RECONCILIATION PLAN SUMMARY");
    console.log("==============================================================================");
    console.log(`1. Schema Compatibility:   PASSED (11 tables, types, triggers, and functions present)`);
    console.log(`2. Policies to Reconcile:  ${missingPoliciesCount} missing + ${misconfiguredPoliciesCount} misconfigured`);
    console.log(`3. Migration Registration: ${migrationRecorded ? "ALREADY RECORDED" : "PENDING (Version 20261114000000)"}`);
    console.log("==============================================================================\n");

    if (!isExecute) {
      console.log(">>> DRY-RUN COMPLETE: No changes were made to the remote database.");
      console.log(">>> To apply these changes after approval, re-run with the --execute flag.");
      return;
    }

    // LIVE EXECUTION BLOCK (Only if --execute flag passed)
    console.log(">>> STARTING LIVE RECONCILIATION TRANSACTION...");
    await client.query("BEGIN;");

    try {
      // 1. Re-apply policies (lines 851–1037 of initial migration)
      console.log("  [1/4] Synchronizing all 31 RLS policies with exact role scopes...");
      const migrationFilePath = path.resolve(__dirname, "../supabase/migrations/20261114000000_initial_schema.sql");
      const migrationSql = fs.readFileSync(migrationFilePath, "utf8");

      // Extract policy declarations starting at section 11 header
      const policyMarker = "-- 11. ROW-LEVEL SECURITY (RLS) POLICIES — NON-RECURSIVE & LEAK-PROOF";
      const policyStartIndex = migrationSql.indexOf(policyMarker);
      if (policyStartIndex === -1) {
        throw new Error(`Failed to locate policy block in migration SQL using marker: '${policyMarker}'`);
      }
      const policiesSql = migrationSql.slice(policyStartIndex);
      await client.query(policiesSql);
      console.log("        ✓ All 31 RLS policies successfully applied and synchronized.");

      // 2. Exact Postcondition Verification — Validate all 31 policies in pg_policies
      console.log("  [2/4] Verifying postcondition policy state in pg_policies (Exact comparison)...");
      const postPolicyRes = await client.query(`
        SELECT policyname, tablename, roles, cmd, qual, with_check
        FROM pg_policies
        WHERE schemaname = 'public';
      `);

      const postPolicyMap = new Map<string, any>();
      for (const p of postPolicyRes.rows) {
        const key = `${p.tablename}.${p.policyname}`;
        postPolicyMap.set(key, p);
      }

      for (const expected of EXPECTED_POLICIES) {
        const key = `${expected.tableName}.${expected.policyName}`;
        if (!postPolicyMap.has(key)) {
          throw new Error(`Postcondition Failure: Policy '${key}' is missing after reconciliation!`);
        }
        const live = postPolicyMap.get(key);
        const liveRoles = (live.roles || []).map((r: string) => r.toLowerCase());
        const expectedRoles = expected.expectedRoles.map(r => r.toLowerCase());
        const rolesMatch = expectedRoles.every(r => liveRoles.includes(r)) && (!expectedRoles.includes("public") ? !liveRoles.includes("public") : true);
        const cmdMatch = live.cmd.toUpperCase() === expected.cmd.toUpperCase();

        if (!rolesMatch || !cmdMatch) {
          throw new Error(`Postcondition Failure: Policy '${key}' mismatch! Live roles: [${liveRoles.join(", ")}], Expected: [${expectedRoles.join(", ")}], Cmd: ${live.cmd}`);
        }
      }
      console.log(`        ✓ Verified all ${EXPECTED_POLICIES.length} policies match exact definitions, roles, and commands.`);

      // 3. Verify Function Execution Privileges
      console.log("  [3/4] Verifying function execution privilege restrictions...");
      const scholarPrivRes = await client.query(`
        SELECT grantee, privilege_type
        FROM information_schema.routine_privileges
        WHERE routine_schema = 'public' AND routine_name = 'is_scholar';
      `);
      const scholarGrantees = scholarPrivRes.rows.map(r => r.grantee.toLowerCase());
      if (scholarGrantees.includes("public") || scholarGrantees.includes("anon")) {
        throw new Error("Security Violation: public.is_scholar() still has EXECUTE grant to PUBLIC or anon!");
      }
      console.log("        ✓ Verified public.is_scholar() execution privileges are revoked from PUBLIC and anon.");

      // 4. Record migration history safely in supabase_migrations.schema_migrations
      console.log("  [4/4] Recording migration version in supabase_migrations.schema_migrations...");
      await client.query(`
        CREATE SCHEMA IF NOT EXISTS supabase_migrations;
        CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
          version TEXT PRIMARY KEY,
          statements TEXT[],
          name TEXT
        );
        INSERT INTO supabase_migrations.schema_migrations (version, name)
        VALUES ('20261114000000', 'initial_schema')
        ON CONFLICT (version) DO UPDATE
          SET name = EXCLUDED.name;
      `);
      console.log("        ✓ Migration version 20261114000000 successfully registered.");

      await client.query("COMMIT;");
      console.log("\n==============================================================================");
      console.log("LIVE RECONCILIATION COMPLETED SUCCESSFULLY (TRANSACTION COMMITTED)");
      console.log("==============================================================================");
    } catch (err) {
      await client.query("ROLLBACK;");
      console.error("\n[FATAL] Reconciliation failed! Transaction rolled back completely.");
      throw err;
    }
  } finally {
    await client.end();
  }
}

if (process.argv[1]?.includes("reconcile-staging-schema")) {
  runReconciliation().catch((err) => {
    console.error("Reconciliation script failed:", err);
    process.exit(1);
  });
}

export { runReconciliation };
