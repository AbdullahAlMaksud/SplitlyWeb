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

export function DashboardView() {
  const groups = useSplitlyStore((state) => state.groups);
  const expenses = useSplitlyStore((state) => state.expenses);
  const currentUserId = useSplitlyStore((state) => state.currentUser.id);
  const { t } = useTranslation();
  const groupSnapshots = useMemo(() => {
    const expensesByGroup = new Map<string, typeof expenses>();
    const balancesByGroup = new Map<string, number>();
    const settlementsByGroup = new Map<
      string,
      ReturnType<typeof optimizeSettlements>
    >();

    for (const expense of expenses) {
      const groupExpenses = expensesByGroup.get(expense.groupId) ?? [];
      groupExpenses.push(expense);
      expensesByGroup.set(expense.groupId, groupExpenses);
    }

    for (const groupExpenses of expensesByGroup.values()) {
      groupExpenses.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    for (const group of groups) {
      const groupExpenses = expensesByGroup.get(group.id) ?? [];
      const balances = calculateGroupBalances(group, groupExpenses);
      balancesByGroup.set(
        group.id,
        balances.find((item) => item.userId === currentUserId)?.balanceCents ??
          0,
      );
      settlementsByGroup.set(group.id, optimizeSettlements(balances));
    }

    return { expensesByGroup, balancesByGroup, settlementsByGroup };
  }, [currentUserId, expenses, groups]);

  const summary = useMemo(() => {
    let owedCents = 0;
    let oweCents = 0;
    let groupsWithBalance = 0;
    const individualsOwed = new Set<string>();
    const individualsOwe = new Set<string>();

    for (const group of groups) {
      const balance = groupSnapshots.balancesByGroup.get(group.id) ?? 0;

      if (balance > 0) {
        owedCents += balance;
        groupsWithBalance += 1;
      }

      if (balance < 0) {
        oweCents += Math.abs(balance);
        groupsWithBalance += 1;
      }

      for (const settlement of groupSnapshots.settlementsByGroup.get(
        group.id,
      ) ?? []) {
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
  }, [currentUserId, groupSnapshots, groups]);

  return (
    <div className="space-y-10">
      {groups.length === 0 ? (
        <section className="grid min-h-[calc(100vh-12rem)] items-center gap-10 py-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="section-glide space-y-7">
            <div className="inline-flex rounded-md border border-emerald-300/40 bg-emerald-50/80 px-3 py-1 text-sm font-medium text-emerald-800 backdrop-blur-xl dark:border-white/20 dark:bg-white/10 dark:text-muted-foreground">
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
                <span className="text-sm font-semibold text-foreground/80">
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
                    className="section-glide flex items-center gap-3 rounded-md border border-emerald-200/50 bg-white/60 p-3 backdrop-blur-xl dark:border-white/15 dark:bg-white/10"
                    style={{ animationDelay: `${(index + 2) * 90}ms` }}
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
                  expenses={groupSnapshots.expensesByGroup.get(group.id) ?? []}
                  balanceCents={
                    groupSnapshots.balancesByGroup.get(group.id) ?? 0
                  }
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
