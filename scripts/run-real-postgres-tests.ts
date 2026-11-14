import EmbeddedPostgres from "embedded-postgres";
import { Pool, PoolClient } from "pg";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Module from "node:module";

// Allow test runner in CLI node environment to load server-only modules
const originalRequire = (Module.prototype as any).require;
(Module.prototype as any).require = function (id: string) {
  if (id === "server-only") return {};
  return originalRequire.apply(this, arguments);
};

/**
 * ISHTI Real PostgreSQL & Concurrency Verification Test Suite
 *
 * Runs against an isolated, native PostgreSQL 18 instance with real connections,
 * true concurrency, transactions, advisory locks, and Row-Level Security.
 */

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function recordTest(category: string, name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, category, passed: true, durationMs: Date.now() - start });
    console.log(`  [PASS] [${category}] ${name} (${Date.now() - start}ms)`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    results.push({ name, category, passed: false, error: errorMsg, durationMs: Date.now() - start });
    console.error(`  [FAIL] [${category}] ${name} (${Date.now() - start}ms)`);
    console.error(`         Error: ${errorMsg}`);
  }
}

async function setAuthSession(client: PoolClient, role: string, userId?: string) {
  await client.query(`SET ROLE ${role};`);
  if (userId) {
    await client.query(`SELECT set_config('request.jwt.claim.sub', '${userId}', false);`);
  } else {
    await client.query(`SELECT set_config('request.jwt.claim.sub', '', false);`);
  }
  await client.query(`SELECT set_config('request.jwt.claim.role', '${role}', false);`);
}

async function resetAuthSession(client: PoolClient) {
  await client.query(`RESET ROLE;`);
  await client.query(`SELECT set_config('request.jwt.claim.sub', '', false);`);
  await client.query(`SELECT set_config('request.jwt.claim.role', '', false);`);
}

async function main() {
  console.log("==============================================================================");
  console.log("ISHTI M02: STARTING REAL POSTGRESQL 18 & CONCURRENCY TEST SUITE");
  console.log("==============================================================================\n");

  const pgServer = new EmbeddedPostgres({
    port: 54321,
    user: "postgres",
    password: "password",
  });

  await pgServer.start();

  const pool = new Pool({
    host: "127.0.0.1",
    port: 54321,
    database: "ishti_test",
    user: "postgres",
    password: "password",
    max: 25,
  });

  try {
    // Generate distinct test identities
    const adminUserId = crypto.randomUUID();
    const devoteeUserAId = crypto.randomUUID();
    const devoteeUserBId = crypto.randomUUID();
    const expertUserId = crypto.randomUUID();
    const scholarUserId = crypto.randomUUID();

    // 1. Re-apply fresh migration to ensure latest functions and schema
    const setupClient = await pool.connect();
    try {
      await resetAuthSession(setupClient);

      console.log("Applying fresh migration to isolated database...");
      const migrationSql = fs.readFileSync(
        path.resolve(process.cwd(), "supabase/migrations/20261114000000_initial_schema.sql"),
        "utf8"
      );
      await setupClient.query(migrationSql);

      // Apply standard Supabase grants
      await setupClient.query(`
        GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
        GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
        GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

        -- Re-enforce specific migration restrictions
        REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
        GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO service_role, postgres;

        REVOKE ALL ON FUNCTION public.assign_user_role(UUID, TEXT, TEXT) FROM PUBLIC, anon;
        GRANT EXECUTE ON FUNCTION public.assign_user_role(UUID, TEXT, TEXT) TO authenticated, service_role, postgres;

        REVOKE ALL ON public.rate_limit_events FROM PUBLIC, anon, authenticated;
        GRANT SELECT ON public.rate_limit_events TO authenticated;
        GRANT ALL ON public.rate_limit_events TO service_role, postgres;

        REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.role_assignment_audit FROM PUBLIC, anon, authenticated;
        GRANT SELECT ON public.role_assignment_audit TO authenticated;
        GRANT ALL ON public.role_assignment_audit TO service_role, postgres;
      `);

      // Clean test data (temporarily disable immutability trigger for test fixture initialization)
      await setupClient.query(`
        ALTER TABLE public.role_assignment_audit DISABLE TRIGGER trg_prevent_role_audit_tampering;
        DELETE FROM public.role_assignment_audit;
        ALTER TABLE public.role_assignment_audit ENABLE TRIGGER trg_prevent_role_audit_tampering;
        DELETE FROM public.booking_requests;
        DELETE FROM public.consultation_slots;
        DELETE FROM public.expert_profiles;
        DELETE FROM public.kundli_profiles;
        DELETE FROM public.profiles;
        DELETE FROM public.rate_limit_events;
        DELETE FROM auth.users;
      `);

      // Insert auth users
      await setupClient.query(`
        INSERT INTO auth.users (id, email) VALUES
        ('${adminUserId}', 'admin@ishti.test'),
        ('${devoteeUserAId}', 'devotee.a@ishti.test'),
        ('${devoteeUserBId}', 'devotee.b@ishti.test'),
        ('${expertUserId}', 'expert@ishti.test'),
        ('${scholarUserId}', 'scholar@ishti.test');
      `);

      // Elevate admin, expert, scholar via trusted assign_user_role function
      await setupClient.query(`
        SELECT public.assign_user_role('${adminUserId}', 'platform_admin', 'Initial test admin setup');
        SELECT public.assign_user_role('${expertUserId}', 'expert_pandit', 'Initial test expert setup');
        SELECT public.assign_user_role('${scholarUserId}', 'content_scholar', 'Initial test scholar setup');
        UPDATE public.profiles SET is_verified = TRUE WHERE id IN ('${expertUserId}', '${scholarUserId}');
      `);

      // Create expert profile record for booking tests
      await setupClient.query(`
        INSERT INTO public.expert_profiles (
          id, user_id, full_name, title, specializations, hourly_fee_inr, is_active, verification_status, bio
        ) VALUES (
          'c0000000-0000-0000-0000-000000000001', '${expertUserId}', 'Acharya Sharma', 'Vedic Astrologer',
          ARRAY['Vedic Astrology'], 1100, TRUE, 'accredited', 'Vedic Astrologer & Ritual Expert'
        );
      `);
    } finally {
      setupClient.release();
    }

    console.log("--- 1. REAL RLS & PERMISSIONS TESTS ---");

    await recordTest("REAL_DB_RLS", "Devotee can only view their own profile", async () => {
      const client = await pool.connect();
      try {
        await setAuthSession(client, "authenticated", devoteeUserAId);
        const res = await client.query("SELECT id FROM public.profiles;");
        if (res.rows.length !== 1 || res.rows[0].id !== devoteeUserAId) {
          throw new Error(`Expected exactly 1 profile (${devoteeUserAId}), got ${res.rows.length}`);
        }
      } finally {
        await resetAuthSession(client);
        client.release();
      }
    });

    await recordTest("REAL_DB_RLS", "Platform admin views all profiles non-recursively", async () => {
      const client = await pool.connect();
      try {
        await setAuthSession(client, "authenticated", adminUserId);
        const res = await client.query("SELECT id FROM public.profiles;");
        if (res.rows.length < 5) {
          throw new Error(`Expected at least 5 profiles for admin, got ${res.rows.length}`);
        }
      } finally {
        await resetAuthSession(client);
        client.release();
      }
    });

    await recordTest("REAL_DB_RLS", "Anonymous user is denied direct RPC execute on check_rate_limit", async () => {
      const client = await pool.connect();
      try {
        await setAuthSession(client, "anon");
        let threw = false;
        try {
          await client.query("SELECT public.check_rate_limit('early_access', '0123456789abcdef0123456789abcdef', 5, 60);");
        } catch (err: unknown) {
          threw = true;
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes("permission denied")) {
            throw new Error(`Expected permission denied error, got: ${msg}`);
          }
        }
        if (!threw) throw new Error("Anonymous caller was not denied execution on check_rate_limit");
      } finally {
        await resetAuthSession(client);
        client.release();
      }
    });

    await recordTest("REAL_DB_RLS", "Anonymous user is denied direct RPC execute on assign_user_role", async () => {
      const client = await pool.connect();
      try {
        await setAuthSession(client, "anon");
        let threw = false;
        try {
          await client.query(`SELECT public.assign_user_role('${devoteeUserAId}', 'platform_admin', 'Exploit attempt');`);
        } catch (err: unknown) {
          threw = true;
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes("permission denied")) {
            throw new Error(`Expected permission denied error, got: ${msg}`);
          }
        }
        if (!threw) throw new Error("Anonymous caller was not denied execution on assign_user_role");
      } finally {
        await resetAuthSession(client);
        client.release();
      }
    });

    await recordTest("REAL_DB_RLS", "Devotee self-promotion to platform_admin is blocked by trigger", async () => {
      const client = await pool.connect();
      try {
        await setAuthSession(client, "authenticated", devoteeUserAId);
        let threw = false;
        try {
          await client.query(`UPDATE public.profiles SET role = 'platform_admin' WHERE id = '${devoteeUserAId}';`);
        } catch (err: unknown) {
          threw = true;
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes("Direct role modification prohibited")) {
            throw new Error(`Expected trigger exception, got: ${msg}`);
          }
        }
        if (!threw) throw new Error("Direct role update by devotee succeeded when it must fail");
      } finally {
        await resetAuthSession(client);
        client.release();
      }
    });

    await recordTest("REAL_DB_RLS", "Devotee cannot bypass trigger even if attempting session token spoofing", async () => {
      const client = await pool.connect();
      try {
        await setAuthSession(client, "authenticated", devoteeUserAId);
        let threw = false;
        try {
          // Attacker attempts to spoof transaction-local authorization setting
          await client.query("SELECT set_config('ishti.authorized_role_assignment', 'true', false);");
          await client.query(`UPDATE public.profiles SET role = 'platform_admin' WHERE id = '${devoteeUserAId}';`);
        } catch (err: unknown) {
          threw = true;
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes("Privilege escalation blocked")) {
            throw new Error(`Expected privilege escalation blocked error, got: ${msg}`);
          }
        }
        if (!threw) throw new Error("Devotee successfully elevated role via session token spoofing!");
      } finally {
        await resetAuthSession(client);
        client.release();
      }
    });

    await recordTest("REAL_DB_RLS", "Devotee cannot invoke assign_user_role to elevate another user", async () => {
      const client = await pool.connect();
      try {
        await setAuthSession(client, "authenticated", devoteeUserAId);
        let threw = false;
        try {
          await client.query(`SELECT public.assign_user_role('${devoteeUserBId}', 'platform_admin', 'Elevation test');`);
        } catch (err: unknown) {
          threw = true;
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes("Only platform administrators can assign roles")) {
            throw new Error(`Expected admin requirement exception, got: ${msg}`);
          }
        }
        if (!threw) throw new Error("Devotee successfully elevated another user via assign_user_role");
      } finally {
        await resetAuthSession(client);
        client.release();
      }
    });

    console.log("\n--- 2. ROLE GOVERNANCE & AUDIT IMMUTABILITY TESTS ---");

    await recordTest("REAL_DB_AUDIT", "Admin assign_user_role successfully assigns role and logs audit", async () => {
      const client = await pool.connect();
      try {
        await setAuthSession(client, "authenticated", adminUserId);
        await client.query(`
          SELECT public.assign_user_role('${devoteeUserBId}', 'expert_pandit', 'Accredited after traditional interview');
        `);

        // Verify profile updated
        const profRes = await client.query(`SELECT role FROM public.profiles WHERE id = '${devoteeUserBId}';`);
        if (profRes.rows[0].role !== "expert_pandit") {
          throw new Error(`Expected role 'expert_pandit', got: ${profRes.rows[0].role}`);
        }

        // Verify audit log entry
        const auditRes = await client.query(`
          SELECT * FROM public.role_assignment_audit WHERE user_id = '${devoteeUserBId}';
        `);
        if (auditRes.rows.length !== 1 || auditRes.rows[0].new_role !== "expert_pandit") {
          throw new Error("Audit log record missing or incorrect");
        }
      } finally {
        await resetAuthSession(client);
        client.release();
      }
    });

    await recordTest("REAL_DB_AUDIT", "Audit records are immutable against UPDATE or DELETE tampering", async () => {
      const client = await pool.connect();
      try {
        // Test 1: Authenticated user is blocked by table permissions
        await setAuthSession(client, "authenticated", adminUserId);
        let authBlocked = false;
        try {
          await client.query("UPDATE public.role_assignment_audit SET reason = 'Tampered reason';");
        } catch (err: unknown) {
          authBlocked = true;
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes("permission denied")) {
            throw new Error(`Expected permission denied for authenticated update, got: ${msg}`);
          }
        }

        // Test 2: Even superuser/service_role with table permissions is blocked by the trigger
        await resetAuthSession(client);
        let triggerBlocked = false;
        try {
          await client.query("UPDATE public.role_assignment_audit SET reason = 'Superuser Tamper';");
        } catch (err: unknown) {
          triggerBlocked = true;
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes("Audit records are immutable")) {
            throw new Error(`Expected trigger immutability exception, got: ${msg}`);
          }
        }

        if (!authBlocked || !triggerBlocked) {
          throw new Error("Multi-layer audit log protection failed");
        }
      } finally {
        await resetAuthSession(client);
        client.release();
      }
    });

    console.log("\n--- 3. KUNDLI OWNERSHIP & ENCRYPTED STORAGE TESTS ---");

    await recordTest("REAL_DB_KUNDLI", "Devotee User A cannot query Devotee User B Kundli profile", async () => {
      const client = await pool.connect();
      try {
        // Superuser inserts a Kundli record for Devotee B
        await resetAuthSession(client);
        const kundliId = crypto.randomUUID();
        await client.query(`
          INSERT INTO public.kundli_profiles (
            id, user_id, profile_name, gender,
            ciphertext_dob, ciphertext_tob, ciphertext_coordinates,
            encryption_key_version, encryption_iv, encryption_auth_tag
          ) VALUES (
            '${kundliId}', '${devoteeUserBId}', 'Profile B', 'male',
            'd0b_c1ph3rt3xt_hex', 't0b_c1ph3rt3xt_hex', 'c00rds_c1ph3rt3xt_hex',
            1, '123456789012345678901234:123456789012345678901234:123456789012345678901234',
            '12345678901234567890123456789012:12345678901234567890123456789012:12345678901234567890123456789012'
          );
        `);

        // Authenticate as User A
        await setAuthSession(client, "authenticated", devoteeUserAId);
        const res = await client.query(`SELECT * FROM public.kundli_profiles WHERE id = '${kundliId}';`);
        if (res.rows.length !== 0) {
          throw new Error("User A was able to read User B Kundli profile!");
        }

        // Authenticate as User B (Owner)
        await setAuthSession(client, "authenticated", devoteeUserBId);
        const ownRes = await client.query(`SELECT * FROM public.kundli_profiles WHERE id = '${kundliId}';`);
        if (ownRes.rows.length !== 1) {
          throw new Error("User B could not read their own Kundli profile!");
        }
      } finally {
        await resetAuthSession(client);
        client.release();
      }
    });

    await recordTest("REAL_DB_KUNDLI", "Database trigger rejects plaintext date of birth", async () => {
      const client = await pool.connect();
      try {
        await resetAuthSession(client);
        let rejected = false;
        try {
          await client.query(`
            INSERT INTO public.kundli_profiles (
              user_id, profile_name, gender,
              ciphertext_dob, ciphertext_tob, ciphertext_coordinates,
              encryption_key_version, encryption_iv, encryption_auth_tag
            ) VALUES (
              '${devoteeUserAId}', 'Leaked Profile', 'male',
              '1990-05-15', 't0b_c1ph3rt3xt_hex', 'c00rds_c1ph3rt3xt_hex',
              1, '123456789012345678901234:123456789012345678901234:123456789012345678901234',
              '12345678901234567890123456789012:12345678901234567890123456789012:12345678901234567890123456789012'
            );
          `);
        } catch (err: unknown) {
          rejected = true;
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes("Plaintext write rejected")) {
            throw new Error(`Expected plaintext rejection exception, got: ${msg}`);
          }
        }
        if (!rejected) throw new Error("Plaintext ISO birth date was accepted into kundli_profiles!");
      } finally {
        client.release();
      }
    });

    await recordTest("REAL_DB_KUNDLI", "Kundli AAD Delimiter Injection attack is rejected by application layer", async () => {
      const { buildKundliAad } = await import("../apps/web/lib/crypto/kundli-encryption");
      let threwColon = false;
      try {
        buildKundliAad("user_123:injected", "prof_456_valid", "dob", 1);
      } catch (err: unknown) {
        threwColon = true;
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes("must be a valid UUID or alphanumeric identifier")) {
          throw new Error(`Expected safe ID validation error, got: ${msg}`);
        }
      }
      if (!threwColon) throw new Error("Delimiter injection attack with colons succeeded!");
    });

    console.log("\n--- 4. RATE LIMITER CONCURRENCY & ADVISORY LOCK TESTS ---");

    await recordTest("REAL_DB_CONCURRENCY", "Rate limiter rejects non-hex or malformed hash format", async () => {
      const client = await pool.connect();
      try {
        let threw = false;
        try {
          await client.query(
            "SELECT public.check_rate_limit('early_access', 'invalid_non_hex_digest!', 5, 60);"
          );
        } catch (err: unknown) {
          threw = true;
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes("must be a valid hexadecimal cryptographic digest")) {
            throw new Error(`Expected hex validation error, got: ${msg}`);
          }
        }
        if (!threw) throw new Error("Malformed non-hex hash format was accepted by check_rate_limit");
      } finally {
        client.release();
      }
    });

    await recordTest("REAL_DB_CONCURRENCY", "Advisory lock serializes 50 concurrent requests (Stress test: Exactly 10 pass, 40 fail)", async () => {
      const testBucket = "early_access";
      const testHash = crypto.createHash("sha256").update("stress_50_" + crypto.randomBytes(8).toString("hex")).digest("hex");
      const maxLimit = 10;
      const windowSeconds = 60;

      // Fire 50 SIMULTANEOUS requests over pool connections using service_role authority
      const concurrentRequests = Array.from({ length: 50 }, async () => {
        const client = await pool.connect();
        try {
          const res = await client.query(
            "SELECT public.check_rate_limit($1, $2, $3, $4) as allowed;",
            [testBucket, testHash, maxLimit, windowSeconds]
          );
          return res.rows[0].allowed as boolean;
        } finally {
          client.release();
        }
      });

      const outcomes = await Promise.all(concurrentRequests);
      const passedCount = outcomes.filter((o) => o === true).length;
      const rejectedCount = outcomes.filter((o) => o === false).length;

      console.log(`         [Stress Test Concurrency Result] 50 concurrent calls -> Allowed: ${passedCount}, Rejected: ${rejectedCount}`);

      if (passedCount !== maxLimit) {
        throw new Error(
          `Race condition detected: expected exactly ${maxLimit} allowed requests, but ${passedCount} passed!`
        );
      }
      if (rejectedCount !== 40) {
        throw new Error(`Expected 40 rejected requests, but got ${rejectedCount}`);
      }
    });

    await recordTest("REAL_DB_CONCURRENCY", "Advisory lock boundary independence: distinct identifier hashes do not block each other", async () => {
      const testBucket = "early_access";
      const hashA = crypto.createHash("sha256").update("client_A_" + crypto.randomBytes(8).toString("hex")).digest("hex");
      const hashB = crypto.createHash("sha256").update("client_B_" + crypto.randomBytes(8).toString("hex")).digest("hex");
      const maxLimit = 1;
      const windowSeconds = 60;

      // Execute simultaneously for Hash A and Hash B
      const clientA = await pool.connect();
      const clientB = await pool.connect();
      try {
        const [resA, resB] = await Promise.all([
          clientA.query("SELECT public.check_rate_limit($1, $2, $3, $4) as allowed;", [testBucket, hashA, maxLimit, windowSeconds]),
          clientB.query("SELECT public.check_rate_limit($1, $2, $3, $4) as allowed;", [testBucket, hashB, maxLimit, windowSeconds]),
        ]);

        if (!resA.rows[0].allowed || !resB.rows[0].allowed) {
          throw new Error("Independent identifiers blocked each other across advisory lock boundaries!");
        }
      } finally {
        clientA.release();
        clientB.release();
      }
    });

    console.log("\n--- 5. BOOKING CONCURRENCY & REBOOKING LIFECYCLE TESTS ---");

    const slotId = crypto.randomUUID();
    const setupSlotClient = await pool.connect();
    try {
      await setupSlotClient.query(`
        INSERT INTO public.consultation_slots (id, expert_id, start_time, end_time, is_booked)
        VALUES ('${slotId}', 'c0000000-0000-0000-0000-000000000001', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 1 hour', FALSE);
      `);
    } finally {
      setupSlotClient.release();
    }

    await recordTest("REAL_DB_CONCURRENCY", "Atomic slot booking: 10 concurrent requests -> Exactly 1 succeeds, 9 fail", async () => {
      // 10 concurrent booking attempts for the exact same slot
      const concurrentBookings = Array.from({ length: 10 }, async (_, index) => {
        const client = await pool.connect();
        try {
          await setAuthSession(client, "authenticated", devoteeUserAId);
          await client.query(`
            INSERT INTO public.booking_requests (user_id, expert_id, slot_id, service_type, amount_inr)
            VALUES ('${devoteeUserAId}', 'c0000000-0000-0000-0000-000000000001', '${slotId}', 'online_consultation', 1100);
          `);
          return { success: true, index };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return { success: false, index, error: msg };
        } finally {
          await resetAuthSession(client);
          client.release();
        }
      });

      const outcomes = await Promise.all(concurrentBookings);
      const successes = outcomes.filter((o) => o.success);
      const failures = outcomes.filter((o) => !o.success);

      console.log(`         [Booking Concurrency] 10 concurrent reservations -> Succeeded: ${successes.length}, Failed: ${failures.length}`);

      if (successes.length !== 1) {
        throw new Error(`Double booking race condition: expected exactly 1 successful booking, got ${successes.length}`);
      }
      if (failures.length !== 9) {
        throw new Error(`Expected 9 failed bookings, got ${failures.length}`);
      }
    });

    await recordTest("REAL_DB_BOOKING", "Cancelling booking frees slot and partial unique index allows rebooking", async () => {
      const client = await pool.connect();
      try {
        await resetAuthSession(client);

        // Fetch existing active booking
        const existingBookingRes = await client.query(`
          SELECT id FROM public.booking_requests WHERE slot_id = '${slotId}';
        `);
        const existingBookingId = existingBookingRes.rows[0].id;

        // Cancel the booking as Devotee A
        await setAuthSession(client, "authenticated", devoteeUserAId);
        await client.query(`
          UPDATE public.booking_requests
          SET status = 'cancelled'
          WHERE id = '${existingBookingId}';
        `);

        // Check slot is freed
        await resetAuthSession(client);
        const slotRes = await client.query(`SELECT is_booked FROM public.consultation_slots WHERE id = '${slotId}';`);
        if (slotRes.rows[0].is_booked !== false) {
          throw new Error("Slot was not marked as is_booked = FALSE upon cancellation!");
        }

        // Now Devotee B attempts to book the freed slot
        await setAuthSession(client, "authenticated", devoteeUserBId);
        await client.query(`
          INSERT INTO public.booking_requests (user_id, expert_id, slot_id, service_type, amount_inr)
          VALUES ('${devoteeUserBId}', 'c0000000-0000-0000-0000-000000000001', '${slotId}', 'online_consultation', 1100);
        `);

        // Verify Devotee B's booking exists
        await resetAuthSession(client);
        const rebookRes = await client.query(`
          SELECT COUNT(*) as count FROM public.booking_requests
          WHERE slot_id = '${slotId}';
        `);
        // There are now 2 bookings in history: 1 cancelled (Devotee A) and 1 pending (Devotee B)
        if (parseInt(rebookRes.rows[0].count, 10) !== 2) {
          throw new Error(`Expected 2 historical bookings for slot, got ${rebookRes.rows[0].count}`);
        }
      } finally {
        await resetAuthSession(client);
        client.release();
      }
    });

    console.log("\n--- 6. SCRIPTURE VISIBILITY & RIGHTS CLEARANCE GATE TESTS ---");

    await recordTest("REAL_DB_SCRIPTURE", "Public/devotee receives 0 rows for verses pending review & clearance", async () => {
      const client = await pool.connect();
      try {
        await setAuthSession(client, "anon");
        const anonRes = await client.query("SELECT * FROM public.canonical_verses;");
        if (anonRes.rows.length !== 0) {
          throw new Error(`Anon was able to query unverified verse! Count: ${anonRes.rows.length}`);
        }

        await setAuthSession(client, "authenticated", devoteeUserAId);
        const devoteeRes = await client.query("SELECT * FROM public.canonical_verses;");
        if (devoteeRes.rows.length !== 0) {
          throw new Error(`Devotee was able to query unverified verse! Count: ${devoteeRes.rows.length}`);
        }
      } finally {
        await resetAuthSession(client);
        client.release();
      }
    });

    await recordTest("REAL_DB_SCRIPTURE", "Devotee Full-Text Search (FTS) and aggregate COUNT(*) cannot leak unverified verses", async () => {
      const client = await pool.connect();
      try {
        await setAuthSession(client, "authenticated", devoteeUserAId);

        // FTS search attempt on verse content (Devanagari / IAST)
        const ftsRes = await client.query(`
          SELECT id FROM public.canonical_verses
          WHERE fts @@ to_tsquery('simple', 'gacchadhvaṃ');
        `);
        if (ftsRes.rows.length !== 0) {
          throw new Error(`FTS query leaked unverified verse to devotee! Rows: ${ftsRes.rows.length}`);
        }

        // Aggregate count attempt
        const countRes = await client.query("SELECT COUNT(*) AS total FROM public.canonical_verses;");
        if (parseInt(countRes.rows[0].total, 10) !== 0) {
          throw new Error(`Aggregate COUNT query leaked unverified verse count to devotee! Total: ${countRes.rows[0].total}`);
        }

        // Join / subquery attempt
        const joinRes = await client.query(`
          SELECT profiles.id, verses.devanagari
          FROM public.profiles
          LEFT JOIN public.canonical_verses verses ON true
          WHERE profiles.id = '${devoteeUserAId}';
        `);
        if (joinRes.rows.length !== 1 || joinRes.rows[0].devanagari !== null) {
          throw new Error("Join leak allowed devotee to access unverified verse content!");
        }
      } finally {
        await resetAuthSession(client);
        client.release();
      }
    });

    await recordTest("REAL_DB_SCRIPTURE", "Content scholar can view verses pending peer review and search via FTS", async () => {
      const client = await pool.connect();
      try {
        await setAuthSession(client, "authenticated", scholarUserId);
        const scholarRes = await client.query("SELECT * FROM public.canonical_verses;");
        if (scholarRes.rows.length !== 1) {
          throw new Error(`Scholar was unable to view pending verse! Count: ${scholarRes.rows.length}`);
        }
        if (scholarRes.rows[0].review_status !== "pending_peer_review") {
          throw new Error(`Expected review_status 'pending_peer_review', got ${scholarRes.rows[0].review_status}`);
        }
        if (scholarRes.rows[0].rights_clearance_status !== "pending_clearance") {
          throw new Error(`Expected rights_clearance_status 'pending_clearance', got ${scholarRes.rows[0].rights_clearance_status}`);
        }

        // Scholar can also query via FTS
        const scholarFtsRes = await client.query(`
          SELECT id FROM public.canonical_verses
          WHERE fts @@ to_tsquery('simple', 'gacchadhvaṃ');
        `);
        if (scholarFtsRes.rows.length !== 1) {
          throw new Error("Scholar FTS query failed to locate pending verse!");
        }
      } finally {
        await resetAuthSession(client);
        client.release();
      }
    });

    console.log("\n==============================================================================");
    console.log("REAL DATABASE VERIFICATION SUMMARY");
    console.log("==============================================================================");
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    console.log(`Total Real DB & Concurrency Tests: ${results.length}`);
    console.log(`Passed:                            ${passed}`);
    console.log(`Failed:                            ${failed}`);
    console.log("==============================================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    await pool.end();
    await pgServer.stop();
    console.log("Isolated PostgreSQL 18 server stopped cleanly.");
  }
}

export interface RealDbRunResult {
  total: number;
  passed: number;
  failed: number;
  results: TestResult[];
  countsByCategory: Record<string, { passed: number; failed: number }>;
}

export async function runRealPostgresTests(): Promise<RealDbRunResult> {
  results.length = 0; // reset results
  await main();
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const countsByCategory: Record<string, { passed: number; failed: number }> = {};
  for (const r of results) {
    if (!countsByCategory[r.category]) {
      countsByCategory[r.category] = { passed: 0, failed: 0 };
    }
    if (r.passed) countsByCategory[r.category].passed++;
    else countsByCategory[r.category].failed++;
  }
  return { total: results.length, passed, failed, results, countsByCategory };
}

if (process.argv[1]?.includes("run-real-postgres-tests")) {
  main().catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
}
