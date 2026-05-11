"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { GroupNav } from "@/components/splitly/group-nav";
import { SettlementList } from "@/components/splitly/settlement-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  calculateGroupBalances,
  optimizeSettlements,
} from "@/lib/calculations/settlement";
import { useSplitlyStore } from "@/store/splitly-store";

export function SettlementView({ groupId }: { groupId: string }) {
  const groups = useSplitlyStore((state) => state.groups);
  const allExpenses = useSplitlyStore((state) => state.expenses);
  const { t } = useTranslation();
  const group = useMemo(
    () => groups.find((item) => item.id === groupId),
    [groupId, groups],
  );
  const expenses = useMemo(
    () => allExpenses.filter((expense) => expense.groupId === groupId),
    [allExpenses, groupId],
  );
  const balances = useMemo(
    () => (group ? calculateGroupBalances(group, expenses) : []),
    [expenses, group],
  );
  const settlements = useMemo(() => optimizeSettlements(balances), [balances]);

  if (!group) {
    return (
      <Card className="mx-auto max-w-xl border-dashed">
        <CardContent className="space-y-5 p-8 text-center">
          <h1 className="text-2xl font-semibold">{t("group.notFound")}</h1>
          <Button asChild>
            <Link href="/">{t("actions.backToDashboard")}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost">
        <Link href={`/groups/${group.id}`}>
          <ArrowLeft className="size-4" />
          {t("actions.backToGroupDetail")}
        </Link>
      </Button>
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-normal">
            {t("settlement.pageTitle", { name: group.name })}
          </h1>
          <p className="text-muted-foreground">
            {t("settlement.pageDescription")}
          </p>
        </div>
        <GroupNav groupId={group.id} />
      </section>
      <SettlementList
        group={group}
        expenses={expenses}
        balances={balances}
        settlements={settlements}
        copyable
      />
    </div>
  );
}
