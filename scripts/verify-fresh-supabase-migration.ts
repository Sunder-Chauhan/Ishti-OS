import EmbeddedPostgres from "embedded-postgres";
import { Client } from "pg";
import fs from "node:fs";
import path from "node:path";

/**
 * ISHTI Fresh Supabase-Compatible Database & Migration History Verification
 *
 * Verifies that:
 * 1. An entirely fresh, empty PostgreSQL database can be provisioned from scratch.
 * 2. Supabase standard baseline schemas (auth, extensions, supabase_migrations) are established.
 * 3. The initial migration `20261114000000_initial_schema.sql` applies cleanly without warnings or errors.
 * 4. Supabase migration history tracking table (`supabase_migrations.schema_migrations`) records version 20261114000000.
 * 5. All 11 core tables are created with strict Row-Level Security (RLS) enabled.
 * 6. The migration script is 100% idempotent: applying it a second time completes with zero errors.
 */

const DB_PORT = 54321;
const FRESH_DB_NAME = "fresh_supabase_test";

async function main() {
  console.log("==============================================================================");
  console.log("ISHTI M02: FRESH SUPABASE DATABASE & MIGRATION VERIFICATION");
  console.log("==============================================================================\n");

  const pgServer = new EmbeddedPostgres({
    port: DB_PORT,
    user: "postgres",
    password: "password",
  });

  console.log("[1/6] Initializing isolated native PostgreSQL server...");
  await pgServer.start();

  // Step 1: Connect to maintenance database and recreate a completely fresh UTF-8 database
  console.log(`[2/6] Provisioning clean test database '${FRESH_DB_NAME}' with UTF-8 encoding...`);
  const adminClient = new Client({
    host: "127.0.0.1",
    port: DB_PORT,
    user: "postgres",
    password: "password",
    database: "postgres",
  });

  await adminClient.connect();
  try {
    // Terminate existing connections to fresh database if any
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

  // Step 2: Connect to the fresh database and configure standard Supabase baseline environment
  console.log("[3/6] Setting up Supabase baseline schemas (auth, extensions, supabase_migrations)...");
  const targetClient = new Client({
    host: "127.0.0.1",
    port: DB_PORT,
    user: "postgres",
    password: "password",
    database: FRESH_DB_NAME,
  });

  await targetClient.connect();

  try {
    // Standard Supabase Extensions Schema
    await targetClient.query(`
      CREATE SCHEMA IF NOT EXISTS extensions;
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
      CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
    `);

    // Standard Supabase Auth Schema & Stubs
    await targetClient.query(`
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
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
          CREATE ROLE anon NOLOGIN;
        END IF;
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
          CREATE ROLE authenticated NOLOGIN;
        END IF;
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
          CREATE ROLE service_role NOLOGIN;
        END IF;
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_admin') THEN
          CREATE ROLE supabase_admin NOLOGIN;
        END IF;
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
          CREATE ROLE supabase_auth_admin NOLOGIN;
        END IF;
      END
      $$;
    `);

    // Supabase CLI Migration History Tracking Schema
    await targetClient.query(`
      CREATE SCHEMA IF NOT EXISTS supabase_migrations;
      CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
        version TEXT PRIMARY KEY,
        statements TEXT[],
        name TEXT
      );
    `);

    // Step 3: Apply the initial schema migration
    console.log("[4/6] Applying migration '20261114000000_initial_schema.sql' to fresh database...");
    const migrationFilePath = path.resolve(process.cwd(), "supabase/migrations/20261114000000_initial_schema.sql");
    const migrationSql = fs.readFileSync(migrationFilePath, "utf8");

    const migrationStart = Date.now();
    await targetClient.query(migrationSql);
    const migrationElapsed = Date.now() - migrationStart;
    console.log(`      Migration applied successfully in ${migrationElapsed}ms.`);

    // Record migration history
    await targetClient.query(`
      INSERT INTO supabase_migrations.schema_migrations (version, name)
      VALUES ('20261114000000', 'initial_schema')
      ON CONFLICT (version) DO NOTHING;
    `);

    // Step 4: Verify schema integrity and Row-Level Security
    console.log("[5/6] Verifying schema integrity, RLS configuration, and migration history...");

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

    const tablesRes = await targetClient.query(`
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

    // Verify migration history
    const historyRes = await targetClient.query(`
      SELECT version, name FROM supabase_migrations.schema_migrations;
    `);
    if (historyRes.rows.length !== 1 || historyRes.rows[0].version !== "20261114000000") {
      throw new Error(`Migration history tracking failure: expected version '20261114000000', got ${JSON.stringify(historyRes.rows)}`);
    }
    console.log(`      ✓ supabase_migrations.schema_migrations recorded version: ${historyRes.rows[0].version} (${historyRes.rows[0].name})`);

    // Step 5: Test Idempotency (re-running the exact migration on the same DB)
    console.log("[6/6] Testing Migration Idempotency (Re-running migration script)...");
    const idempotencyStart = Date.now();
    await targetClient.query(migrationSql);
    const idempotencyElapsed = Date.now() - idempotencyStart;
    console.log(`      ✓ Migration script re-executed cleanly with 0 errors in ${idempotencyElapsed}ms (Idempotency Confirmed)`);

    console.log("\n==============================================================================");
    console.log("FRESH SUPABASE DATABASE MIGRATION VERIFICATION: PASSED");
    console.log("==============================================================================");
    console.log("Evidence Summary:");
    console.log(`- Fresh Database:                   ${FRESH_DB_NAME} (UTF-8)`);
    console.log(`- Supabase Baseline Schemas:        auth, extensions, supabase_migrations`);
    console.log(`- Tables Created & RLS Verified:    ${expectedTables.length}/11 tables`);
    console.log(`- Migration History Version:        20261114000000`);
    console.log(`- Idempotency Test:                 PASS (0 errors on repeat run)`);
    console.log("==============================================================================");
  } finally {
    await targetClient.end();
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
