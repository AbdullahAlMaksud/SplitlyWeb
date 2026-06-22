"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CurrencyAmount } from "@/components/ui/currency-amount";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/shared/lib/formatters";

export function BalanceSummaryCard({
  owedCents,
  oweCents,
  groupsWithBalance,
  individualsOwe,
}: {
  owedCents: number;
  oweCents: number;
  groupsWithBalance: number;
  individualsOwe: number;
}) {
  const { t } = useTranslation();

  return (
    <Card className="section-glide overflow-hidden motion-safe:[animation-delay:90ms]">
      <CardContent className="grid gap-8 p-6 md:grid-cols-2 md:p-10">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm font-semibold text-primary">
            <ArrowDownLeft className="size-5" />
            {t("summary.owed")}
          </div>
          <div className="font-mono text-4xl font-semibold tracking-normal md:text-6xl">
            <CurrencyAmount cents={owedCents} />
          </div>
          <p className="text-base text-muted-foreground">
            {t("summary.activeGroups", {
              count: groupsWithBalance,
              countLabel: formatNumber(groupsWithBalance),
            })}
          </p>
        </div>
        <div className="space-y-3 border-t border-white/15 pt-8 md:border-l md:border-t-0 md:pl-10 md:pt-0">
          <div className="flex items-center gap-3 text-sm font-semibold text-red-300">
            <ArrowUpRight className="size-5" />
            {t("summary.owe")}
          </div>
          <div className="font-mono text-4xl font-semibold tracking-normal md:text-6xl">
            <CurrencyAmount cents={oweCents} />
          </div>
          <p className="text-base text-muted-foreground">
            {t("summary.individuals", {
              count: individualsOwe,
              countLabel: formatNumber(individualsOwe),
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
