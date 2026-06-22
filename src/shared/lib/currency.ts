import type { CurrencyCode } from "@/shared/types";

export const DEFAULT_CURRENCY: CurrencyCode = "BDT";

export const CURRENCY_OPTIONS: {
  code: CurrencyCode;
  label: string;
  shortLabel: string;
}[] = [
  { code: "BDT", label: "Bangladeshi Taka", shortLabel: "BDT" },
  { code: "USD", label: "US Dollar", shortLabel: "USD" },
  { code: "EUR", label: "Euro", shortLabel: "EUR" },
  { code: "GBP", label: "British Pound", shortLabel: "GBP" },
  { code: "INR", label: "Indian Rupee", shortLabel: "INR" },
];

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return CURRENCY_OPTIONS.some((currency) => currency.code === value);
}
