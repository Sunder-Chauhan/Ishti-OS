import type { Locale, TranslationDictionary } from "../types";
import { en } from "./en";
import { hi } from "./hi";

// Deep fallback helper to ensure missing keys gracefully fall back to English
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepFallbackMerge<T extends Record<string, any>>(base: T, override?: Partial<T>): T {
  if (!override) return base;
  const result = { ...base };
  for (const key in override) {
    if (Object.prototype.hasOwnProperty.call(override, key)) {
      const baseVal = base[key];
      const overVal = override[key];
      if (
        baseVal &&
        overVal &&
        typeof baseVal === "object" &&
        typeof overVal === "object" &&
        !Array.isArray(baseVal)
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result as any)[key] = deepFallbackMerge(baseVal, overVal);
      } else if (overVal !== undefined && overVal !== "") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result as any)[key] = overVal;
      }
    }
  }
  return result;
}

export const dictionaries: Record<Locale, TranslationDictionary> = {
  en,
  hi: deepFallbackMerge(en, hi),
  bn: en, // Scaffolded: falls back safely to English
  mr: en, // Scaffolded: falls back safely to English
  gu: en, // Scaffolded: falls back safely to English
  ta: en, // Scaffolded: falls back safely to English
  te: en, // Scaffolded: falls back safely to English
  kn: en, // Scaffolded: falls back safely to English
  ml: en, // Scaffolded: falls back safely to English
  pa: en, // Scaffolded: falls back safely to English
};

export function getDictionary(locale: Locale): TranslationDictionary {
  const dict = dictionaries[locale];
  return dict ? deepFallbackMerge(en, dict) : en;
}
