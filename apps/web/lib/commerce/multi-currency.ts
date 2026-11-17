import type { CurrencyCode, CurrencyConfig } from "@spiritual-os/types";

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    locale: "en-IN",
    defaultTaxPct: 18, // GST
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    locale: "en-US",
    defaultTaxPct: 0, // State-dependent
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    locale: "de-DE",
    defaultTaxPct: 19, // Average EU VAT
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    locale: "en-GB",
    defaultTaxPct: 20, // UK VAT
  },
  AED: {
    code: "AED",
    symbol: "AED",
    name: "UAE Dirham",
    locale: "ar-AE",
    defaultTaxPct: 5, // UAE VAT
  },
  SGD: {
    code: "SGD",
    symbol: "S$",
    name: "Singapore Dollar",
    locale: "en-SG",
    defaultTaxPct: 9, // Singapore GST
  },
};

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const config = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.INR;
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.code,
    minimumFractionDigits: currency === "INR" ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function computeTaxBreakdown(
  totalInclusiveAmount: number,
  currency: CurrencyCode
): { baseAmount: number; taxAmount: number; taxRatePct: number } {
  const config = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.INR;
  const rate = config.defaultTaxPct;
  if (rate === 0) {
    return { baseAmount: totalInclusiveAmount, taxAmount: 0, taxRatePct: 0 };
  }
  const baseAmount = Math.round((totalInclusiveAmount / (1 + rate / 100)) * 100) / 100;
  const taxAmount = Math.round((totalInclusiveAmount - baseAmount) * 100) / 100;
  return { baseAmount, taxAmount, taxRatePct: rate };
}
