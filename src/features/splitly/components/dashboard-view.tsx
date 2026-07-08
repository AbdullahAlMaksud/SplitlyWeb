"use client";

import Link from "next/link";
import {
  Plus,
  Users,
  LayoutDashboard,
  Settings,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { AddExpenseDialog } from "@/features/splitly/components/add-expense-dialog";
import { BalanceSummaryCard } from "@/features/splitly/components/balance-summary-card";
import { GroupCard } from "@/features/splitly/components/group-card";
import { Button } from "@/components/ui/button";
import {
  calculateGroupBalances,
  optimizeSettlements,
} from "@/shared/lib/calculations/settlement";
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
    <div className="space-y-12">
      {groups.length === 0 ? (
        <section className="flex flex-col items-center justify-center py-12 md:py-20 text-center space-y-8 max-w-5xl mx-auto">
          {/* Centered Tag Category */}
          <div className="inline-flex rounded-md border border-border bg-muted/60 px-3.5 py-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            {t("dashboard.tag")}
          </div>
          
          {/* Centered Hero Header */}
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl leading-tight">
              {t("dashboard.heroTitle")}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t("dashboard.heroDescription")}
            </p>
          </div>

          {/* Centered Action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button asChild size="lg" className="bg-slate-950 text-slate-50 hover:bg-slate-900 border border-slate-950 font-semibold cursor-pointer">
              <Link href="/groups/new">
                <Users className="size-4 mr-1.5" />
                {t("actions.createFirstGroup")}
              </Link>
            </Button>
            <AddExpenseDialog>
              <Button variant="outline" size="lg" className="font-semibold cursor-pointer">
                <Plus className="size-4 mr-1.5" />
                {t("actions.addExpense")}
              </Button>
            </AddExpenseDialog>
          </div>

          {/* Premium Flat Dashboard Mockup (Image 1 style) */}
          <div className="w-full border border-border bg-card rounded-xl overflow-hidden mt-16 p-4 md:p-6 text-left section-glide motion-safe:[animation-delay:200ms] shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
            {/* Mockup Windows Header */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-border text-xs text-muted-foreground/60 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-border" />
                <span className="size-3 rounded-full bg-border" />
                <span className="size-3 rounded-full bg-border" />
                <span className="ml-3 font-semibold text-foreground/80 tracking-wide">bonton.local/dashboard</span>
              </div>
              <div className="flex items-center gap-4">
                <span>LOCAL-FIRST</span>
                <span>SECURE</span>
              </div>
            </div>

            {/* Mockup Workspace Grid */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Dummy Sidebar */}
              <div className="hidden md:flex flex-col gap-1 pr-6 border-r border-border w-48 text-xs font-semibold text-muted-foreground/80">
                <div className="flex items-center gap-2 px-2 py-2 rounded-md bg-accent/40 text-foreground cursor-default">
                  <LayoutDashboard className="size-3.5" />
                  মূল পাতা
                </div>
                <div className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent/20 cursor-default">
                  <Users className="size-3.5" />
                  উইকেন্ড ট্রিপ
                </div>
                <div className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent/20 cursor-default">
                  <Users className="size-3.5" />
                  ব্যাচেলর ফ্ল্যাট
                </div>
                <div className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent/20 cursor-default">
                  <Settings className="size-3.5" />
                  সেটিংস
                </div>
              </div>

              {/* Dummy Main Panel */}
              <div className="flex-1 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold tracking-tight">ড্যাশবোর্ড ওভারভিউ</h3>
                  <p className="text-xs text-muted-foreground">সব সক্রিয় গ্রুপ জুড়ে আপনার হিসাবের আর্থিক অবস্থার বিবরণী এখানে।</p>
                </div>

                {/* Dummy Stats Swatches */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="border border-border p-4 rounded-lg bg-card space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">আপনি পাবেন</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-extrabold text-primary">৳৪,৫০০</span>
                      <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <TrendingUp className="size-2.5" /> +১২%
                      </span>
                    </div>
                  </div>
                  <div className="border border-border p-4 rounded-lg bg-card space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">আপনার বাকি</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-extrabold text-red-500">৳১,২০০</span>
                      <span className="text-[9px] font-bold bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded">পরিশোধ্য</span>
                    </div>
                  </div>
                  <div className="border border-border p-4 rounded-lg bg-card space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">সক্রিয় গ্রুপ</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-extrabold text-foreground">৩টি</span>
                      <span className="text-[9px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">রানিং</span>
                    </div>
                  </div>
                </div>

                {/* Dummy List of Groups */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">গ্রুপ সমূহের তালিকা</h4>
                  <div className="border border-border rounded-lg bg-card divide-y divide-border">
                    <div className="flex items-center justify-between p-3.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full bg-emerald-500" />
                        <span className="font-bold">উইকেন্ড ট্রিপ</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">৮ জন সদস্য</span>
                        <span className="font-bold text-primary">আপনি পাবেন ৳৩,০০০</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full bg-emerald-500" />
                        <span className="font-bold">ব্যাচেলর ফ্ল্যাট</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">৪ জন সদস্য</span>
                        <span className="font-bold text-red-500">বাকি ৳১,২০০</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full bg-emerald-500" />
                        <span className="font-bold">অফিস লাঞ্চ</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">৫ জন সদস্য</span>
                        <span className="font-bold text-primary">আপনি পাবেন ৳১,৫০০</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="section-glide space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl leading-tight text-foreground">
              {t("dashboard.overview")}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
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
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {t("dashboard.activeGroups")}
              </h2>
              <div className="flex gap-2">
                <AddExpenseDialog>
                  <Button variant="outline" className="cursor-pointer font-semibold">
                    <Plus className="size-4" />
                    {t("actions.addExpense")}
                  </Button>
                </AddExpenseDialog>
                <Button asChild className="cursor-pointer font-semibold bg-slate-950 text-slate-50 hover:bg-slate-900 border border-slate-950">
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
