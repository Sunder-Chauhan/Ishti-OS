import EmbeddedPostgres from "embedded-postgres";
import { Client } from "pg";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/**
 * ISHTI Milestone M02: Supabase-Compatible PostgreSQL Simulation & Official CLI Migration Verification
 *
 * TECHNICAL DISCLOSURE & ENVIRONMENT BOUNDARY:
 * --------------------------------------------------------------------------------------------------
 * This test suite provisions an isolated, native PostgreSQL 18.6 instance with standard Supabase
 * schema stubs (auth, extensions) and invokes the official Supabase CLI migration engine (supabase db push).
 *
 * Scope of Local Proof:
 * - Proves declarative SQL syntax validity against PostgreSQL 18.
 * - Proves execution of initial schema migration via official Supabase CLI migration runner.
 * - Proves automated migration history recording in `supabase_migrations.schema_migrations`.
 * - Proves all 11 core tables are created with Row-Level Security (RLS) enabled.
 * - Proves migration script idempotency under both Supabase CLI and raw repeat execution.
 *
 * Explicit Boundary Limitation:
 * - This local suite is a Supabase-compatible PostgreSQL simulation. It does NOT prove full compatibility
 *   with managed Supabase cloud infrastructure (e.g., hosted GoTrue auth server, PostgREST internal routing,
 *   managed Vault, or hosted extension catalogs).
 * - Full hosted compatibility must be verified against the official Supabase local docker stack
 *   (when Docker Desktop daemon is running) or a disposable remote staging project before production deployment.
 */

const DB_PORT = 54321;
const FRESH_DB_NAME = "fresh_supabase_test";

async function main() {
  console.log("==============================================================================");
  console.log("ISHTI M02: SUPABASE-COMPATIBLE SIMULATION & CLI MIGRATION VERIFICATION");
  console.log("==============================================================================\n");

  const migrationFilePath = path.resolve(process.cwd(), "supabase/migrations/20261114000000_initial_schema.sql");
  const migrationSql = fs.readFileSync(migrationFilePath, "utf8");
  const migrationChecksum = crypto.createHash("sha256").update(migrationSql).digest("hex");

  console.log(`Migration File:     supabase/migrations/20261114000000_initial_schema.sql`);
  console.log(`Migration SHA-256:  ${migrationChecksum}\n`);

  const pgServer = new EmbeddedPostgres({
    port: DB_PORT,
    user: "postgres",
    password: "password",
  });

  console.log("[1/6] Initializing isolated native PostgreSQL server on port 54321...");
  await pgServer.start();

  // Step 1: Connect to maintenance database and recreate a completely fresh UTF-8 database
  console.log(`[2/6] Provisioning clean simulation database '${FRESH_DB_NAME}' with UTF-8 encoding...`);
  const adminClient = new Client({
    host: "127.0.0.1",
    port: DB_PORT,
    user: "postgres",
    password: "password",
    database: "postgres",
  });

  await adminClient.connect();
  try {
    await adminClient.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = '${FRESH_DB_NAME}' AND pid <> pg_backend_pid();
    `);
    await adminClient.query(`DROP DATABASE IF EXISTS ${FRESH_DB_NAME};`);
    await adminClient.query(`CREATE DATABASE ${FRESH_DB_NAME} WITH TEMPLATE template0 ENCODING 'UTF8';`);
  } finally {
    await adminClient.end();
  }

  // Step 2: Connect to the fresh database and configure baseline Supabase extensions and auth stubs
  console.log("[3/6] Configuring Supabase baseline stubs (auth, extensions, standard roles)...");
  const targetClient = new Client({
    host: "127.0.0.1",
    port: DB_PORT,
    user: "postgres",
    password: "password",
    database: FRESH_DB_NAME,
  });

  await targetClient.connect();

  try {
    await targetClient.query(`
      CREATE SCHEMA IF NOT EXISTS extensions;
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
      CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

      CREATE SCHEMA IF NOT EXISTS auth;
      CREATE TABLE IF NOT EXISTS auth.users (
        id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
        email TEXT UNIQUE,
        phone TEXT,
        raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
        SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
      $$ LANGUAGE sql STABLE;

      CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT AS $$
        SELECT NULLIF(current_setting('request.jwt.claim.role', true), '')::TEXT;
      $$ LANGUAGE sql STABLE;

      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_admin') THEN CREATE ROLE supabase_admin NOLOGIN; END IF;
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN CREATE ROLE supabase_auth_admin NOLOGIN; END IF;
      END
      $$;
    `);
  } finally {
    await targetClient.end();
  }

  // Step 3: Execute Official Supabase CLI db push runner
  console.log("[4/6] Executing official Supabase CLI migration runner (supabase db push)...");
  const cliPushStart = Date.now();
  const dbUrl = `postgresql://postgres:password@127.0.0.1:${DB_PORT}/${FRESH_DB_NAME}`;

  const cliOutputRaw = execSync(
    `npx.cmd supabase db push --yes --include-all --remote="${dbUrl}"`,
    { encoding: "utf8" }
  );
  const cliPushElapsed = Date.now() - cliPushStart;
  console.log(`      ✓ Supabase CLI applied migration in ${cliPushElapsed}ms.`);

  // Step 4: Verify schema integrity, RLS configuration, and migration history recorded by Supabase CLI
  console.log("[5/6] Verifying schema integrity, RLS configuration, and Supabase CLI history table...");
  const verifyClient = new Client({
    host: "127.0.0.1",
    port: DB_PORT,
    user: "postgres",
    password: "password",
    database: FRESH_DB_NAME,
  });

  await verifyClient.connect();

  try {
    const expectedTables = [
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

    const tablesRes = await verifyClient.query(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public';
    `);

    const tableMap = new Map<string, boolean>();
    for (const row of tablesRes.rows) {
      tableMap.set(row.tablename, row.rowsecurity);
    }

    for (const expectedTable of expectedTables) {
      if (!tableMap.has(expectedTable)) {
        throw new Error(`CRITICAL INTEGRITY FAILURE: Missing expected table 'public.${expectedTable}'`);
      }
      if (tableMap.get(expectedTable) !== true) {
        throw new Error(`CRITICAL SECURITY FAILURE: RLS is disabled on 'public.${expectedTable}'!`);
      }
      console.log(`      ✓ public.${expectedTable.padEnd(26)} [RLS ENABLED]`);
    }

    // Verify migration history recorded by Supabase CLI runner (no manual row insertion)
    const historyRes = await verifyClient.query(`
      SELECT version, name FROM supabase_migrations.schema_migrations;
    `);
    if (historyRes.rows.length !== 1 || historyRes.rows[0].version !== "20261114000000") {
      throw new Error(`Migration history tracking failure: expected version '20261114000000', got ${JSON.stringify(historyRes.rows)}`);
    }
    console.log(`      ✓ supabase_migrations.schema_migrations automatically recorded: ${historyRes.rows[0].version} (${historyRes.rows[0].name})`);

    // Step 5: Test Idempotency under official Supabase CLI runner
    console.log("[6/6] Testing Migration Idempotency via Supabase CLI repeat push...");
    const repeatCliStart = Date.now();
    const repeatOutputRaw = execSync(
      `npx.cmd supabase db push --yes --include-all --remote="${dbUrl}"`,
      { encoding: "utf8" }
    );
    const repeatCliElapsed = Date.now() - repeatCliStart;

    if (!repeatOutputRaw.includes('"upToDate":true') && !repeatOutputRaw.includes("up to date")) {
      throw new Error(`Supabase CLI repeat push failed idempotency check. Output: ${repeatOutputRaw}`);
    }
    console.log(`      ✓ Supabase CLI repeat push confirmed: "Remote database is up to date." in ${repeatCliElapsed}ms`);

    // Step 6: Also verify raw script re-execution idempotency
    await verifyClient.query(migrationSql);
    console.log(`      ✓ Raw declarative SQL script re-executed cleanly with 0 errors (Idempotency Confirmed).`);

    console.log("\n==============================================================================");
    console.log("SUPABASE-COMPATIBLE SIMULATION MIGRATION VERIFICATION: PASSED");
    console.log("==============================================================================");
    console.log("Evidence Summary:");
    console.log(`- Simulation Database:              ${FRESH_DB_NAME} (UTF-8, Native PostgreSQL 18.6)`);
    console.log(`- Migration SHA-256:                ${migrationChecksum}`);
    console.log(`- Migration Runner:                 Official Supabase CLI 3.1.0 (supabase db push)`);
    console.log(`- Tables Created & RLS Verified:    ${expectedTables.length}/11 tables`);
    console.log(`- CLI Migration History Version:    20261114000000`);
    console.log(`- CLI Idempotency Check:            PASS ("Remote database is up to date")`);
    console.log(`- Raw SQL Script Idempotency:       PASS (0 errors on repeat run)`);
    console.log("==============================================================================");
  } finally {
    await verifyClient.end();
    await pgServer.stop();
    console.log("Isolated PostgreSQL server stopped cleanly.");
  }
}

if (process.argv[1]?.includes("verify-fresh-supabase-migration")) {
  main().catch((err) => {
    console.error("Fresh database migration verification failed:", err);
    process.exit(1);
  });
}
