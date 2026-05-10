"use client";

import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { AddExpenseDialog } from "@/components/splitly/add-expense-dialog";
import { BalanceSummaryCard } from "@/components/splitly/balance-summary-card";
import { GroupCard } from "@/components/splitly/group-card";
import { Button } from "@/components/ui/button";
import {
  calculateGroupBalances,
  optimizeSettlements,
} from "@/lib/calculations/settlement";
import { useSplitlyStore } from "@/store/splitly-store";
import AnimatedBuildingLogo from "../preview";

export function DashboardView() {
  const { groups, expenses, currentUser } = useSplitlyStore();
  const { t } = useTranslation();
  const currentUserId = currentUser.id;
  const summary = useMemo(() => {
    let owedCents = 0;
    let oweCents = 0;
    let groupsWithBalance = 0;
    const individualsOwed = new Set<string>();
    const individualsOwe = new Set<string>();

    for (const group of groups) {
      const groupExpenses = expenses
        .filter((expense) => expense.groupId === group.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      const balances = calculateGroupBalances(group, groupExpenses);
      const balance =
        balances.find((item) => item.userId === currentUserId)?.balanceCents ??
        0;

      if (balance > 0) {
        owedCents += balance;
        groupsWithBalance += 1;
      }

      if (balance < 0) {
        oweCents += Math.abs(balance);
        groupsWithBalance += 1;
      }

      for (const settlement of optimizeSettlements(balances)) {
        if (settlement.toId === currentUserId)
          individualsOwed.add(settlement.fromId);
        if (settlement.fromId === currentUserId)
          individualsOwe.add(settlement.toId);
      }
    }

    return {
      owedCents,
      oweCents,
      groupsWithBalance,
      individualsOwed: individualsOwed.size,
      individualsOwe: individualsOwe.size,
    };
  }, [currentUserId, expenses, groups]);

  return (
    <div className="space-y-10">
      {groups.length === 0 ? (
        <section className="grid min-h-[calc(100vh-12rem)] items-center gap-10 py-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="section-glide space-y-7">
            <div className="inline-flex rounded-md border border-white/20 bg-white/10 px-3 py-1 text-sm text-muted-foreground backdrop-blur-xl">
              {t("dashboard.tag")}
            </div>
            <div className="space-y-4">
              <h1 className="gradient-text max-w-3xl text-5xl font-semibold tracking-normal md:text-7xl">
                {t("dashboard.heroTitle")}
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                {t("dashboard.heroDescription")}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/groups/new">
                  <Users className="size-4" />
                  {t("actions.createFirstGroup")}
                </Link>
              </Button>
              <AddExpenseDialog>
                <Button variant="outline" size="lg">
                  <Plus className="size-4" />
                  {t("actions.addExpense")}
                </Button>
              </AddExpenseDialog>
            </div>
          </div>
          <div className="glass-panel section-glide rounded-lg p-6 motion-safe:[animation-delay:140ms]">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {t("dashboard.exampleFlow")}
                </span>
                <span className="rounded-md bg-primary/15 px-2 py-1 text-xs font-medium text-primary">
                  {t("dashboard.mvp")}
                </span>
              </div>
              <div className="space-y-3">
                {[
                  t("dashboard.flow.item1"),
                  t("dashboard.flow.item2"),
                  t("dashboard.flow.item3"),
                  t("dashboard.flow.item4"),
                  t("dashboard.flow.item5"),
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-md border border-white/15 bg-white/10 p-3 backdrop-blur-xl"
                  >
                    <span className="flex size-7 items-center justify-center rounded-md bg-primary/15 font-mono text-xs text-primary">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="section-glide space-y-2">
            <h1 className="text-4xl font-semibold tracking-normal md:text-5xl">
              {t("dashboard.overview")}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("dashboard.overviewDescription")}
            </p>
          </section>
<div className="bg-white p-10">
  <AnimatedBuildingLogo effect="none" size={1000} play={true} loop={true}/>
</div>
          <BalanceSummaryCard
            owedCents={summary.owedCents}
            oweCents={summary.oweCents}
            groupsWithBalance={summary.groupsWithBalance}
            individualsOwe={summary.individualsOwe}
          />

          <section className="section-glide space-y-5 motion-safe:[animation-delay:140ms]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-3xl font-semibold tracking-normal">
                {t("dashboard.activeGroups")}
              </h2>
              <div className="flex gap-2">
                <AddExpenseDialog>
                  <Button variant="outline">
                    <Plus className="size-4" />
                    {t("actions.addExpense")}
                  </Button>
                </AddExpenseDialog>
                <Button asChild>
                  <Link href="/groups/new">
                    <Users className="size-4" />
                    {t("actions.createGroup")}
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  expenses={expenses
                    .filter((expense) => expense.groupId === group.id)
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                    )}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
