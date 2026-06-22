"use client";

import { Check, Copy, Download, MoveRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { CurrencyAmount } from "@/components/ui/currency-amount";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { downloadSettlementStatementImage } from "@/shared/lib/export/statement-image";
import { DEFAULT_CURRENCY } from "@/shared/lib/currency";
import { formatCurrency, memberName } from "@/shared/lib/formatters";
import type { Balance, CurrencyCode, Expense, Group, SettlementTransaction } from "@/shared/types";
import { useSplitlyStore } from "@/store/splitly-store";

export function settlementText(
  group: Group,
  settlements: SettlementTransaction[],
  t: TFunction,
  currency: CurrencyCode = DEFAULT_CURRENCY,
) {
  if (settlements.length === 0) return t("settlement.noneNeeded");

  return settlements
    .map((settlement) =>
      t("settlement.pays", {
        from: memberName(group.members, settlement.fromId),
        to: memberName(group.members, settlement.toId),
        amount: formatCurrency(settlement.amountCents, undefined, currency),
      }),
    )
    .join("\n");
}

export function SettlementList({
  group,
  expenses = [],
  balances = [],
  settlements,
  copyable = false,
}: {
  group: Group;
  expenses?: Expense[];
  balances?: Balance[];
  settlements: SettlementTransaction[];
  copyable?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const currency = useSplitlyStore(
    (state) => state.currentUser.currency ?? DEFAULT_CURRENCY,
  );
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState<string | null>(null);
  const text = useMemo(
    () => settlementText(group, settlements, t, currency),
    [currency, group, settlements, t],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>{t("settlement.title")}</CardTitle>
        {copyable ? (
          <Button
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1400);
            }}
          >
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            {copied ? t("actions.copied") : t("actions.copy")}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {settlements.length === 0 ? (
          <div className="rounded-md border border-dashed border-white/20 bg-white/10 p-8 text-center text-sm text-muted-foreground backdrop-blur-xl">
            {t("settlement.everyoneSettled")}
          </div>
        ) : (
          settlements.map((settlement, index) => {
            const key = `${settlement.fromId}-${settlement.toId}-${index}`;
            const fromName = memberName(group.members, settlement.fromId);
            const toName = memberName(group.members, settlement.toId);
            const imageLabel = t("settlement.imageAria", {
              from: fromName,
              to: toName,
            });

            return (
              <div
                key={key}
                className="grid items-center gap-3 rounded-md border border-white/15 bg-white/10 p-4 backdrop-blur-xl sm:grid-cols-[1fr_auto_1fr_auto_auto]"
              >
                <span className="font-medium">{fromName}</span>
                <MoveRight className="size-4 text-muted-foreground" />
                <span className="font-medium">{toName}</span>
                <span className="font-mono text-lg font-semibold text-primary">
                  <CurrencyAmount cents={settlement.amountCents} />
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={imageLabel}
                  title={imageLabel}
                  className="justify-self-start sm:justify-self-end"
                  onClick={async () => {
                    await downloadSettlementStatementImage({
                      group,
                      expenses,
                      balances,
                      settlement,
                      language: i18n.resolvedLanguage,
                      currency,
                      createdAt: new Date(),
                    });
                    setDownloaded(key);
                    window.setTimeout(() => setDownloaded(null), 1400);
                  }}
                >
                  {downloaded === key ? (
                    <Check className="size-4" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  {t("actions.downloadImage")}
                </Button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
