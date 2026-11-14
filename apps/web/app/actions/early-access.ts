"use server";

import { createClient } from "../../lib/supabase/server";

export interface EarlyAccessResult {
  success: boolean;
  message: string;
  code?: string;
}

export async function submitEarlyAccess(
  _prevState: EarlyAccessResult | null,
  formData: FormData
): Promise<EarlyAccessResult> {
  // Anti-bot honeypot check
  const honeypot = formData.get("hp_field");
  if (honeypot) {
    return { success: true, message: "Thank you for registering." };
  }

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

  // Validate email format
  if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
    return {
      success: false,
      message: "Please provide a valid email address.",
    };
  }

  // Validate phone format (allowing standard formats e.g. +91 9876543210)
  if (phoneRaw && !/^[+0-9\s-]{10,16}$/.test(phoneRaw)) {
    return {
      success: false,
      message: "Please provide a valid mobile number with country code.",
    };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.from("early_access_subscribers").insert([
      {
        email: emailRaw || null,
        phone: phoneRaw || null,
        preferred_tradition: tradition || null,
        interested_in: interestedIn,
        source: "homepage_m02",
      },
    ]);

    if (error) {
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
