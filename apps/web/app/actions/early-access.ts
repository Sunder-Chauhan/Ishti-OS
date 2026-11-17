"use server";

import { createClient } from "../../lib/supabase/server";
import { headers } from "next/headers";
import { checkRateLimit, hashIdentifier, extractClientIp } from "../../lib/security/rate-limiter";
import { toHumanReadableError } from "../../lib/errors/human-readable-errors";

export interface EarlyAccessResult {
  success: boolean;
  message: string;
  code?: string;
}

export async function submitEarlyAccess(
  _prevState: EarlyAccessResult | null,
  formData: FormData
): Promise<EarlyAccessResult> {
  // 1. Anti-bot honeypot check (secondary measure)
  const honeypot = formData.get("hp_field");
  if (honeypot) {
    // Silently return success to waste bot scraper resources
    return { success: true, message: "Thank you for registering." };
  }

  // 2. Distributed rate limiting check (primary defense)
  const headerList = await headers();
  const rateLimitResult = await checkRateLimit(headerList, "early_access");

  if (!rateLimitResult.allowed) {
    if (rateLimitResult.reason === "UNTRUSTED_PROXY_PROVENANCE") {
      return {
        success: false,
        code: "UNTRUSTED_PROVENANCE",
        message: "Registration could not be verified due to untrusted network provenance. Please try again.",
      };
    }
    return {
      success: false,
      code: "RATE_LIMITED",
      message: "Too many registration attempts. Please wait a few minutes before trying again.",
    };
  }

  // 3. Extract and normalize fields
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

  const clientIp = extractClientIp(headerList);
  const ipHash = clientIp ? hashIdentifier(clientIp) : null;

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
      // Duplicate registration check (PostgreSQL code 23505)
      if (error.code === "23505") {
        return {
          success: true,
          message: "Dhanyavad! This contact is already safely registered for early access invitations.",
        };
      }

      // Handle unmigrated database table without exposing SQL internals to public
      if (
        error.code === "PGRST205" ||
        error.code === "42P01" ||
        error.message?.includes("does not exist") ||
        error.message?.includes("Could not find the table")
      ) {
        console.error("[INTERNAL_DB_AUDIT] Table early_access_subscribers pending migration:", error);
        return {
          success: false,
          code: "MAINTENANCE_UPDATE",
          message: "Early access registration is temporarily undergoing scheduled maintenance. Please check back shortly.",
        };
      }

      return {
        success: false,
        message: toHumanReadableError(error, "We were unable to record your request. Please try again shortly."),
      };
    }

    return {
      success: true,
      message: "Dhanyavad! Your early access invitation request has been safely registered.",
    };
  } catch (err: unknown) {
    console.error("[INTERNAL_EARLY_ACCESS_ERROR]", err);
    return {
      success: false,
      message: toHumanReadableError(err, "We were unable to complete your registration. Please try again."),
    };
  }
}
