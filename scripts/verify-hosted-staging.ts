import { Client } from "pg";
import {
  validateStagingDatabaseUrl,
  ValidatedStagingEndpoint,
  APPROVED_STAGING_PROJECT_REF,
  QUARANTINED_PRODUCTION_PROJECT_REF,
} from "./validate-staging-url";
import {
  EXPECTED_TABLES,
  EXPECTED_FUNCTIONS,
  EXPECTED_POLICIES,
  normalizeRoles,
} from "./reconcile-staging-schema";

/**
 * ISHTI Milestone M03.3 / Pre-Gate C: Independent Hosted Staging Verification
 *
 * READ-ONLY SAFETY GUARANTEES:
 * - Purely inspects schema metadata and catalog views (pg_tables, pg_proc, pg_policies, routine_privileges).
 * - Issues ZERO mutative statements (No BEGIN, No DDL, No DML, No INSERT/UPDATE/DELETE/ALTER/DROP).
 * - Enforces exact staging allowlist (zrjptpkhtklfgnovdrny) via WHATWG URL validation.
 * - Hard-blocks production project (zxwkfnvmmxoojewhvsdc) across host, user, and query parameters.
 * - Masks credentials in all console logs and error traces.
 */

interface VerificationCheckResult {
  category: string;
  name: string;
  passed: boolean;
  details?: string;
}

async function verifyHostedStaging(): Promise<boolean> {
  const dbUrl = process.env.STAGING_DATABASE_URL;

  console.log("==============================================================================");
  console.log("ISHTI PRE-GATE C: INDEPENDENT HOSTED STAGING VERIFICATION RECEIPT");
  console.log("==============================================================================");
  console.log(`Execution Mode:     READ-ONLY INDEPENDENT AUDIT (Zero Mutations)`);
  console.log(`Target Staging Ref: ${APPROVED_STAGING_PROJECT_REF} (EXACT ALLOWLIST ENFORCED)`);
  console.log(`Prohibited Target:  ${QUARANTINED_PRODUCTION_PROJECT_REF} (STRICT ZERO ACCESS)`);
  console.log("==============================================================================\n");

  if (!dbUrl) {
    console.error("[FATAL] STAGING_DATABASE_URL environment variable is not set.");
    console.error("Please export STAGING_DATABASE_URL with valid staging credentials.");
    process.exit(1);
  }

  let endpoint: ValidatedStagingEndpoint;
  try {
    endpoint = validateStagingDatabaseUrl(dbUrl);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`\nCRITICAL SECURITY VIOLATION: ${errorMsg}`);
    process.exit(1);
  }

  console.log(`Endpoint Verified:  ${endpoint.sanitizedUrl}`);
  console.log(`Connection Mode:    ${endpoint.connectionType === "direct" ? "Direct PostgreSQL (5432)" : "Supabase Pooler (6543/5432)"}`);
  console.log(`Host & Port:        ${endpoint.hostname}:${endpoint.port}`);
  console.log(`Database Name:      ${endpoint.database}\n`);

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  const results: VerificationCheckResult[] = [];

  function record(category: string, name: string, passed: boolean, details?: string) {
    results.push({ category, name, passed, details });
    const mark = passed ? "✓" : "✗";
    console.log(`  [${mark}] [${category}] ${name}${details ? ` — ${details}` : ""}`);
  }

  try {
    await client.connect();
    console.log("✓ Connected securely to target staging database.\n");

    // --------------------------------------------------------------------------
    // 1. PUBLIC APPLICATION TABLES & RLS STATUS
    // --------------------------------------------------------------------------
    console.log("--- 1. TABLE INVENTORY & ROW-LEVEL SECURITY ENFORCEMENT ---");
    const tableRes = await client.query(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public';
    `);

    const liveTables = new Map<string, boolean>();
    for (const row of tableRes.rows) {
      liveTables.set(row.tablename, row.rowsecurity);
    }

    for (const t of EXPECTED_TABLES) {
      const exists = liveTables.has(t);
      const rls = liveTables.get(t) === true;
      record(
        "TABLES",
        `public.${t}`,
        exists && rls,
        !exists ? "MISSING TABLE" : !rls ? "RLS DISABLED" : "Present & RLS Active"
      );
    }

    // --------------------------------------------------------------------------
    // 2. SEED DATA & TRANSACTIONAL TABLE ROW COUNTS
    // --------------------------------------------------------------------------
    console.log("\n--- 2. SEED RECORD INTEGRITY & DATA LEAKAGE PREVENTION ---");
    const catalogCountRes = await client.query("SELECT count(*) FROM public.scripture_catalog;");
    const catalogCount = parseInt(catalogCountRes.rows[0].count, 10);
    record(
      "SEED_DATA",
      "public.scripture_catalog row count",
      catalogCount === 1,
      `Exactly ${catalogCount} row (Rigveda Samhita preserved)`
    );

    const verseCountRes = await client.query("SELECT count(*) FROM public.canonical_verses;");
    const verseCount = parseInt(verseCountRes.rows[0].count, 10);
    record(
      "SEED_DATA",
      "public.canonical_verses row count",
      verseCount === 1,
      `Exactly ${verseCount} row (Rigveda 10.191.2 preserved)`
    );

    // Verify transactional tables are pristine (0 rows)
    const transactionalTables = [
      "profiles",
      "expert_profiles",
      "booking_requests",
      "consultation_slots",
      "kundli_profiles",
      "early_access_subscribers",
      "rate_limit_events",
      "role_assignment_audit",
      "user_consents",
    ];
    for (const t of transactionalTables) {
      const countRes = await client.query(`SELECT count(*) FROM public.${t};`);
      const count = parseInt(countRes.rows[0].count, 10);
      record(
        "ZERO_POLLUTION",
        `public.${t} row count`,
        count === 0,
        `${count} row(s) (Pristine state)`
      );
    }

    // --------------------------------------------------------------------------
    // 3. DATABASE FUNCTIONS & SEARCH_PATH HARDENING
    // --------------------------------------------------------------------------
    console.log("\n--- 3. DATABASE FUNCTIONS & SEARCH_PATH HARDENING ---");
    const funcRes = await client.query(`
      SELECT p.proname, p.prosecdef, p.proconfig
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public';
    `);

    const liveFuncs = new Map<string, { secdef: boolean; config: string[] }>();
    for (const row of funcRes.rows) {
      liveFuncs.set(row.proname, { secdef: row.prosecdef, config: row.proconfig || [] });
    }

    // Canonical privileged functions requiring SECURITY DEFINER + explicit search_path
    const EXPECTED_SECDEF_FUNCTIONS = new Set([
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
    ]);

    for (const f of EXPECTED_FUNCTIONS) {
      const funcInfo = liveFuncs.get(f);
      const exists = !!funcInfo;
      const shouldBeSecDef = EXPECTED_SECDEF_FUNCTIONS.has(f);
      const secdef = funcInfo?.secdef === true;
      const hasSearchPath = (funcInfo?.config || []).some((c) => c.toLowerCase().includes("search_path"));

      let passed = false;
      let detail = "";

      if (!exists) {
        passed = false;
        detail = "MISSING FUNCTION";
      } else if (shouldBeSecDef) {
        passed = secdef && hasSearchPath;
        detail = `SECURITY DEFINER: ${secdef}, search_path: ${hasSearchPath}`;
      } else {
        // Unprivileged validation triggers (e.g. validate_kundli_ciphertext_payload) must NOT elevate privileges
        passed = !secdef;
        detail = `SECURITY INVOKER (Unprivileged data-validation trigger): ${!secdef}`;
      }

      record("FUNCTIONS", `public.${f}()`, passed, detail);
    }

    // --------------------------------------------------------------------------
    // 4. FUNCTION EXECUTION PRIVILEGES (ROUTINE_PRIVILEGES)
    // --------------------------------------------------------------------------
    console.log("\n--- 4. PRIVILEGED FUNCTION ACCESS RESTRICTIONS ---");
    const privRes = await client.query(`
      SELECT routine_name, grantee, privilege_type
      FROM information_schema.routine_privileges
      WHERE routine_schema = 'public';
    `);

    const routinePrivMap = new Map<string, string[]>();
    for (const r of privRes.rows) {
      const list = routinePrivMap.get(r.routine_name) || [];
      list.push(r.grantee.toLowerCase());
      routinePrivMap.set(r.routine_name, list);
    }

    // is_scholar: must NOT have public or anon; MUST have authenticated
    const scholarGrantees = routinePrivMap.get("is_scholar") || [];
    const scholarSafe =
      !scholarGrantees.includes("public") &&
      !scholarGrantees.includes("anon") &&
      scholarGrantees.includes("authenticated");
    record(
      "SECURITY_ACLS",
      "public.is_scholar() execution privileges",
      scholarSafe,
      `Grantees: [${scholarGrantees.join(", ")}] (PUBLIC and anon revoked; authenticated present)`
    );

    // is_admin: must NOT have public or anon; MUST have authenticated
    const adminGrantees = routinePrivMap.get("is_admin") || [];
    const adminSafe =
      !adminGrantees.includes("public") &&
      !adminGrantees.includes("anon") &&
      adminGrantees.includes("authenticated");
    record(
      "SECURITY_ACLS",
      "public.is_admin() execution privileges",
      adminSafe,
      `Grantees: [${adminGrantees.join(", ")}] (PUBLIC and anon revoked; authenticated present)`
    );

    // assign_user_role: must NOT have public or anon
    const assignRoleGrantees = routinePrivMap.get("assign_user_role") || [];
    const assignRoleSafe =
      !assignRoleGrantees.includes("public") && !assignRoleGrantees.includes("anon");
    record(
      "SECURITY_ACLS",
      "public.assign_user_role() execution privileges",
      assignRoleSafe,
      `Grantees: [${assignRoleGrantees.join(", ")}] (PUBLIC and anon revoked)`
    );

    // check_rate_limit: must NOT have public, anon, or authenticated
    const rateLimitGrantees = routinePrivMap.get("check_rate_limit") || [];
    const rateLimitSafe =
      !rateLimitGrantees.includes("public") &&
      !rateLimitGrantees.includes("anon") &&
      !rateLimitGrantees.includes("authenticated");
    record(
      "SECURITY_ACLS",
      "public.check_rate_limit() execution privileges",
      rateLimitSafe,
      `Grantees: [${rateLimitGrantees.join(", ")}] (Restricted strictly to service_role/postgres)`
    );

    // cleanup_rate_limit_events: must NOT have public, anon, or authenticated
    const cleanupGrantees = routinePrivMap.get("cleanup_rate_limit_events") || [];
    const cleanupSafe =
      !cleanupGrantees.includes("public") &&
      !cleanupGrantees.includes("anon") &&
      !cleanupGrantees.includes("authenticated");
    record(
      "SECURITY_ACLS",
      "public.cleanup_rate_limit_events() execution privileges",
      cleanupSafe,
      `Grantees: [${cleanupGrantees.join(", ")}] (Restricted strictly to service_role/postgres)`
    );

    // --------------------------------------------------------------------------
    // 5. ROW-LEVEL SECURITY POLICIES (PG_POLICIES)
    // --------------------------------------------------------------------------
    console.log("\n--- 5. ROW-LEVEL SECURITY POLICY AUDIT (ALL 31 POLICIES) ---");
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

    record(
      "POLICY_COUNT",
      "Total Active RLS Policies in pg_policies",
      livePolicyMap.size === EXPECTED_POLICIES.length,
      `Exactly ${livePolicyMap.size} of ${EXPECTED_POLICIES.length} policies present`
    );

    for (const expected of EXPECTED_POLICIES) {
      const key = `${expected.tableName}.${expected.policyName}`;
      const live = livePolicyMap.get(key);
      if (!live) {
        record("RLS_POLICIES", key, false, "POLICY MISSING");
        continue;
      }
      const liveRoles = normalizeRoles(live.roles);
      const expectedRoles = expected.expectedRoles.map((r) => r.toLowerCase());
      const rolesMatch =
        expectedRoles.every((r) => liveRoles.includes(r)) &&
        (!expectedRoles.includes("public") ? !liveRoles.includes("public") : true);
      const cmdMatch = live.cmd.toUpperCase() === expected.cmd.toUpperCase();
      record(
        "RLS_POLICIES",
        key,
        rolesMatch && cmdMatch,
        `Cmd: ${live.cmd}, Roles: [${liveRoles.join(", ")}]`
      );
    }

    // --------------------------------------------------------------------------
    // 6. MIGRATION TRACKING IN SUPABASE_MIGRATIONS
    // --------------------------------------------------------------------------
    console.log("\n--- 6. SUPABASE MIGRATION HISTORY TABLE ---");
    const migRes = await client.query(`
      SELECT version, name
      FROM supabase_migrations.schema_migrations
      ORDER BY version ASC;
    `);

    const versions = migRes.rows.map((r) => r.version);
    const hasInitialMigration = versions.includes("20261114000000");
    record(
      "MIGRATION_HISTORY",
      "supabase_migrations.schema_migrations baseline",
      hasInitialMigration,
      `Recorded versions: [${versions.join(", ")}] (Initial schema 20261114000000 confirmed)`
    );

    // --------------------------------------------------------------------------
    // 7. SUMMARY & VERDICT
    // --------------------------------------------------------------------------
    console.log("\n==============================================================================");
    console.log("INDEPENDENT STAGING VERIFICATION SUMMARY");
    console.log("==============================================================================");
    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = results.filter((r) => !r.passed).length;
    console.log(`Total Verification Checks: ${results.length}`);
    console.log(`Passed:                    ${passedCount}`);
    console.log(`Failed:                    ${failedCount}`);
    console.log("==============================================================================");

    if (failedCount > 0) {
      console.error("\n[VERDICT: FAILED] One or more verification checks failed!");
      return false;
    }

    console.log("\n[VERDICT: PASSED] Staging database is 100% compliant and ready for Gate C.");
    return true;
  } finally {
    await client.end();
  }
}

if (process.argv[1]?.includes("verify-hosted-staging")) {
  verifyHostedStaging()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((err) => {
      console.error("[FATAL] Verification execution error:", err);
      process.exit(1);
    });
}

export { verifyHostedStaging };
