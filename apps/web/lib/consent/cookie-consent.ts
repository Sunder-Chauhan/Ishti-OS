import type { CookiePreferences } from "@spiritual-os/types";

export const COOKIE_PREFERENCES_KEY = "ishti_cookie_preferences_v1";

export const DEFAULT_COOKIE_PREFERENCES: CookiePreferences = {
  essential: true,
  functional: true,
  analytics: false,
  updatedAt: new Date().toISOString(),
  version: "v2026.1",
};

export function getCookiePreferences(): CookiePreferences {
  if (typeof window === "undefined") {
    return DEFAULT_COOKIE_PREFERENCES;
  }

  try {
    const raw = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (!raw) return DEFAULT_COOKIE_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      essential: true, // Always immutable
      functional: typeof parsed.functional === "boolean" ? parsed.functional : true,
      analytics: typeof parsed.analytics === "boolean" ? parsed.analytics : false,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      version: parsed.version || "v2026.1",
    };
  } catch {
    return DEFAULT_COOKIE_PREFERENCES;
  }
}

export function saveCookiePreferences(
  preferences: Partial<Omit<CookiePreferences, "essential">>
): CookiePreferences {
  const updated: CookiePreferences = {
    essential: true,
    functional: preferences.functional ?? true,
    analytics: preferences.analytics ?? false,
    updatedAt: new Date().toISOString(),
    version: "v2026.1",
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(updated));
  }

  return updated;
}

export function hasAnsweredCookieConsent(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(COOKIE_PREFERENCES_KEY) !== null;
}
