import i18n from "@/lib/i18n";

const BANGLA_DIGIT_MAP: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

function getActiveLocale() {
  return i18n.resolvedLanguage === "bn" ? "bn-BD" : "en-US";
}

function resolveLocale(language?: string) {
  if (language === "bn") return "bn-BD";
  if (language === "en") return "en-US";
  return getActiveLocale();
}

export function normalizeLocalizedDigits(value: string) {
  return value.replace(/[০-৯]/g, (digit) => BANGLA_DIGIT_MAP[digit] ?? digit);
}

export function parseLocalizedNumber(value: string) {
  const normalized = normalizeLocalizedDigits(value)
    .replace(/[,$\s]/g, "")
    .replace(/[^\d.-]/g, "");

  if (!normalized) return 0;

  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

export function formatNumber(value: number, language?: string) {
  return new Intl.NumberFormat(resolveLocale(language)).format(value);
}

export function formatCurrency(cents: number, language?: string) {
  return new Intl.NumberFormat(resolveLocale(language), {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatDate(value: string, language?: string) {
  return new Intl.DateTimeFormat(resolveLocale(language), {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function parseCurrencyToCents(value: string) {
  const amount = parseLocalizedNumber(value);
  if (!Number.isFinite(amount) || amount <= 0) return 0;

  return Math.round(amount * 100);
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function memberName(
  members: { id: string; name: string }[],
  memberId: string,
) {
  return members.find((member) => member.id === memberId)?.name ?? "Unknown";
}
