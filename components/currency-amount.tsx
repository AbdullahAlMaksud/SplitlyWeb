"use client";

import { useTranslation } from "react-i18next";

import { TakaSymbol } from "@/components/currency-symbol";
import { DEFAULT_CURRENCY } from "@/lib/currency";
import {
  formatCurrency,
  formatCurrencyValue,
  resolveCurrency,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useSplitlyStore } from "@/store/splitly-store";

export function CurrencyAmount({
  cents,
  className,
}: {
  cents: number;
  className?: string;
}) {
  const { i18n } = useTranslation();
  const currency = useSplitlyStore(
    (state) => state.currentUser.currency ?? DEFAULT_CURRENCY,
  );
  const resolvedCurrency = resolveCurrency(currency);
  const roundedCents =
    resolvedCurrency === "BDT" ? Math.round(cents / 100) * 100 : cents;
  const isNegative = roundedCents < 0;

  if (resolvedCurrency !== "BDT") {
    return (
      <span className={className}>
        {formatCurrency(roundedCents, i18n.resolvedLanguage, resolvedCurrency)}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-baseline gap-1", className)}>
      {isNegative ? <span>-</span> : null}
      <TakaSymbol className="translate-y-[0.08em]" />
      <span>{formatCurrencyValue(roundedCents, i18n.resolvedLanguage, 0)}</span>
    </span>
  );
}
