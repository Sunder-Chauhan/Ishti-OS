"use server";

import { createClient } from "../../lib/supabase/server";
import { headers } from "next/headers";
import crypto from "node:crypto";

export interface EarlyAccessResult {
  success: boolean;
  message: string;
  code?: string;
}

// In-memory rate limiting sliding window (IP Hash -> { count, windowStart })
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_REQUESTS_PER_WINDOW = 4;
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry) {
    rateLimitStore.set(identifier, { count: 1, windowStart: now });
    return false;
  }

  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // Reset window
    rateLimitStore.set(identifier, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  entry.count += 1;
  return false;
}

export async function submitEarlyAccess(
  _prevState: EarlyAccessResult | null,
  formData: FormData
): Promise<EarlyAccessResult> {
  // 1. Anti-bot honeypot check
  const honeypot = formData.get("hp_field");
  if (honeypot) {
    // Silently succeed for automated scrapers
    return { success: true, message: "Thank you for registering." };
  }

  // 2. Derive privacy-preserving IP hash for abuse prevention
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headerList.get("x-real-ip")?.trim() || forwardedFor || "127.0.0.1";
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 16) || "ishti-static-salt";
  const ipHash = crypto.createHash("sha256").update(realIp + salt).digest("hex");

  // 3. Check rate limiting
  if (isRateLimited(ipHash)) {
    return {
      success: false,
      code: "RATE_LIMITED",
      message: "Too many submission attempts. Please wait a few minutes before trying again.",
    };
  }

  // 4. Extract and normalize fields
  const emailRaw = formData.get("email")?.toString().trim();
  const phoneRaw = formData.get("phone")?.toString().trim();
  const tradition = formData.get("tradition")?.toString().trim() || undefined;
  const interestedIn = formData.getAll("interests").map((v) => v.toString());

  if (!emailRaw && !phoneRaw) {
    return {
      success: false,
      message: "Please provide either an email address or mobile phone number.",
    };
  }

  let normalizedEmail: string | null = null;
  if (emailRaw) {
    normalizedEmail = emailRaw.toLowerCase().trim();
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(normalizedEmail)) {
      return {
        success: false,
        message: "Please provide a valid email address.",
      };
    }
  }

  let normalizedPhone: string | null = null;
  if (phoneRaw) {
    normalizedPhone = phoneRaw.replace(/[^0-9+]/g, "").trim();
    if (!/^\+?[0-9]{10,15}$/.test(normalizedPhone)) {
      return {
        success: false,
        message: "Please provide a valid mobile number with country code (e.g. +91 9876543210).",
      };
    }
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.from("early_access_subscribers").insert([
      {
        email: normalizedEmail,
        phone: normalizedPhone,
        preferred_tradition: tradition || null,
        interested_in: interestedIn,
        source: "homepage_m02",
        ip_hash: ipHash,
      },
    ]);

    if (error) {
      // Duplicate registration check (Postgres code 23505)
      if (error.code === "23505") {
        return {
          success: true,
          message: "Dhanyavad! This email address is already safely registered for early access invitations.",
        };
      }

      // Differentiate between unmigrated table vs other operational errors
      if (
        error.code === "PGRST205" ||
        error.code === "42P01" ||
        error.message?.includes("does not exist") ||
        error.message?.includes("Could not find the table")
      ) {
        return {
          success: false,
          code: "MIGRATION_PENDING",
          message:
            "Database table 'early_access_subscribers' is pending initial migration. Please run the SQL migration script in your Supabase SQL Editor.",
        };
      }

      return {
        success: false,
        message: error.message || "Failed to record your request. Please try again.",
      };
    }

    return {
      success: true,
      message: "Dhanyavad! Your early access invitation request has been safely registered.",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return {
      success: false,
      message,
    };
  }
}
