"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type { Locale, TranslationDictionary } from "./types";
import { SUPPORTED_LANGUAGES } from "./types";
import { getDictionary } from "./dictionaries";
import { useAuth } from "../auth/auth-context";

interface I18nContextValue {
  locale: Locale;
  setLocale: (newLocale: Locale) => void;
  dict: TranslationDictionary;
  formatNumber: (val: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (val: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const COOKIE_NAME = "ishti_locale";
const LOCAL_STORAGE_KEY = "ishti_locale_preference";

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";

  // 1. URL Parameter override (e.g. ?lang=hi)
  try {
    const params = new URLSearchParams(window.location.search);
    const langParam = params.get("lang");
    if (langParam && SUPPORTED_LANGUAGES.some((l) => l.code === langParam)) {
      return langParam as Locale;
    }
  } catch {
    // ignore
  }

  // 2. Cookie preference
  try {
    const match = document.cookie.match(new RegExp(`(^|;\\s*)(${COOKIE_NAME})=([^;]*)`));
    if (match && match[3] && SUPPORTED_LANGUAGES.some((l) => l.code === match[3])) {
      return match[3] as Locale;
    }
  } catch {
    // ignore
  }

  // 3. LocalStorage
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
      return stored as Locale;
    }
  } catch {
    // ignore
  }

  // 4. Browser language detection
  try {
    const browserLang = navigator.language.split("-")[0];
    if (SUPPORTED_LANGUAGES.some((l) => l.code === browserLang)) {
      return browserLang as Locale;
    }
  } catch {
    // ignore
  }

  return "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);
  const { user, updateProfile } = useAuth();

  useEffect(() => {
    setMounted(true);
    const resolved = getInitialLocale();
    setLocaleState(resolved);
    document.documentElement.lang = resolved;
  }, []);

  // Sync with authenticated user profile preference if available
  useEffect(() => {
    if (user?.language_preference && SUPPORTED_LANGUAGES.some((l) => l.code === user.language_preference)) {
      setLocaleState(user.language_preference as Locale);
    }
  }, [user?.language_preference]);

  const setLocale = useCallback(
    (newLocale: Locale) => {
      setLocaleState(newLocale);

      if (typeof window !== "undefined") {
        // Save to cookie (1 year)
        document.cookie = `${COOKIE_NAME}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
        // Save to localStorage
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, newLocale);
        } catch {
          // ignore
        }
        // Update document lang
        document.documentElement.lang = newLocale;

        // Persist to user profile if logged in
        if (user && updateProfile) {
          updateProfile({ language_preference: newLocale }).catch(() => {});
        }
      }
    },
    [user, updateProfile]
  );

  const dict = useMemo(() => getDictionary(locale), [locale]);

  const formatNumber = useCallback(
    (val: number, options?: Intl.NumberFormatOptions) => {
      try {
        const localeTag = locale === "hi" ? "hi-IN" : "en-IN";
        return new Intl.NumberFormat(localeTag, options).format(val);
      } catch {
        return val.toLocaleString();
      }
    },
    [locale]
  );

  const formatDate = useCallback(
    (val: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
      try {
        const d = val instanceof Date ? val : new Date(val);
        const localeTag = locale === "hi" ? "hi-IN" : "en-IN";
        return new Intl.DateTimeFormat(localeTag, options).format(d);
      } catch {
        return String(val);
      }
    },
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      dict,
      formatNumber,
      formatDate,
      supportedLanguages: SUPPORTED_LANGUAGES,
    }),
    [locale, setLocale, dict, formatNumber, formatDate]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

export function useTranslation() {
  const { dict, locale } = useI18n();
  return { t: dict, locale };
}
