"use client";

import { Check, Copy, MoveRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, memberName } from "@/lib/formatters";
import type { Group, SettlementTransaction } from "@/lib/types";

export function settlementText(
  group: Group,
  settlements: SettlementTransaction[],
  t: TFunction,
) {
  if (settlements.length === 0) return t("settlement.noneNeeded");

  return settlements
    .map((settlement) =>
      t("settlement.pays", {
        from: memberName(group.members, settlement.fromId),
        to: memberName(group.members, settlement.toId),
        amount: formatCurrency(settlement.amountCents),
      }),
    )
    .join("\n");
}

export function SettlementList({
  group,
  settlements,
  copyable = false,
}: {
  group: Group;
  settlements: SettlementTransaction[];
  copyable?: boolean;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const text = useMemo(
    () => settlementText(group, settlements, t),
    [group, settlements, t],
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
          settlements.map((settlement, index) => (
            <div
              key={`${settlement.fromId}-${settlement.toId}-${index}`}
              className="grid items-center gap-3 rounded-md border border-white/15 bg-white/10 p-4 backdrop-blur-xl sm:grid-cols-[1fr_auto_1fr_auto]"
            >
              <span className="font-medium">
                {memberName(group.members, settlement.fromId)}
              </span>
              <MoveRight className="size-4 text-muted-foreground" />
              <span className="font-medium">
                {memberName(group.members, settlement.toId)}
              </span>
              <span className="font-mono text-lg font-semibold text-primary">
                {formatCurrency(settlement.amountCents)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
