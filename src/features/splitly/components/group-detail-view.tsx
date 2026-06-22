"use client";

import Link from "next/link";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { AddExpenseDialog } from "@/features/splitly/components/add-expense-dialog";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { ExpenseTable } from "@/features/splitly/components/expense-table";
import {
  GROUP_ICON_OPTIONS,
  GroupIcon,
  getGroupIconLabel,
} from "@/features/splitly/components/group-icon";
import { GroupNav } from "@/features/splitly/components/group-nav";
import { MemberList } from "@/features/splitly/components/member-list";
import { SettlementList } from "@/features/splitly/components/settlement-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  calculateGroupBalances,
  optimizeSettlements,
} from "@/shared/lib/calculations/settlement";
import { formatNumber, memberName } from "@/shared/lib/formatters";
import type { GroupIcon as GroupIconType } from "@/shared/types";
import { useSplitlyStore } from "@/store/splitly-store";

export function GroupDetailView({ groupId }: { groupId: string }) {
  const groups = useSplitlyStore((state) => state.groups);
  const allExpenses = useSplitlyStore((state) => state.expenses);
  const updateGroup = useSplitlyStore((state) => state.updateGroup);
  const { t } = useTranslation();
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupIcon, setEditGroupIcon] = useState<GroupIconType>("wallet");
  const group = useMemo(
    () => groups.find((item) => item.id === groupId),
    [groupId, groups],
  );
  const expenses = useMemo(
    () =>
      allExpenses
        .filter((expense) => expense.groupId === groupId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
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
          <p className="text-muted-foreground">{t("group.dependsOnBrowser")}</p>
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
        <Link href="/">
          <ArrowLeft className="size-4" />
          {t("actions.dashboard")}
        </Link>
      </Button>

      <section className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-primary backdrop-blur-xl">
            <GroupIcon icon={group.icon} className="size-7" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-4xl font-semibold tracking-normal">
                {group.name}
              </h1>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("actions.editGroup")}
                onClick={() => {
                  setEditGroupName(group.name);
                  setEditGroupIcon(group.icon);
                  setEditGroupOpen(true);
                }}
              >
                <Pencil className="size-4" />
              </Button>
            </div>
            <p className="text-muted-foreground">
              {t("group.memberStats", {
                memberCount: group.members.length,
                memberCountLabel: formatNumber(group.members.length),
                expenseCount: expenses.length,
                expenseCountLabel: formatNumber(expenses.length),
              })}
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <GroupNav groupId={group.id} />
          <AddExpenseDialog groupId={group.id}>
            <Button className="w-full">
              <Plus className="size-4" />
              {t("actions.addExpense")}
            </Button>
          </AddExpenseDialog>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("group.balanceOverview")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-md border border-white/15">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.member")}</TableHead>
                      <TableHead>{t("table.status")}</TableHead>
                      <TableHead className="text-right">
                        {t("table.amount")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balances.map((balance) => (
                      <TableRow key={balance.userId}>
                        <TableCell className="font-medium">
                          {memberName(group.members, balance.userId)}
                        </TableCell>
                        <TableCell>
                          {balance.balanceCents === 0 ? (
                            <Badge variant="secondary">
                              {t("group.settled")}
                            </Badge>
                          ) : balance.balanceCents > 0 ? (
                            <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                              {t("table.owedStatus")}
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/15 text-red-200 hover:bg-red-500/15">
                              {t("table.owesStatus")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <CurrencyAmount cents={balance.balanceCents} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("group.expenseTimeline")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseTable group={group} expenses={expenses} />
            </CardContent>
          </Card>

          <SettlementList
            group={group}
            expenses={expenses}
            balances={balances}
            settlements={settlements}
          />
        </div>

        <MemberList group={group} />
      </div>

      <Dialog open={editGroupOpen} onOpenChange={setEditGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("group.editTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-group-name">{t("group.groupName")}</Label>
              <Input
                id="edit-group-name"
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("group.icon")}</Label>
              <Select
                value={editGroupIcon}
                onValueChange={(v) => setEditGroupIcon(v as GroupIconType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_ICON_OPTIONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      {getGroupIconLabel(icon, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              disabled={!editGroupName.trim()}
              onClick={() => {
                updateGroup(groupId, {
                  name: editGroupName,
                  icon: editGroupIcon,
                });
                setEditGroupOpen(false);
              }}
            >
              {t("actions.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
