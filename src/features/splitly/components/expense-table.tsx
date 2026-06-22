"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AddExpenseDialog } from "@/features/splitly/components/add-expense-dialog";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getExpenseInitialBills,
  getExpensePayments,
  getExpenseSharedAmountCents,
} from "@/shared/lib/calculations/settlement";
import { formatDate, memberName } from "@/shared/lib/formatters";
import type { Expense, Group } from "@/shared/types";
import { useSplitlyStore } from "@/store/splitly-store";

export function ExpenseTable({
  group,
  expenses,
}: {
  group: Group;
  expenses: Expense[];
}) {
  const { t } = useTranslation();
  const deleteExpense = useSplitlyStore((state) => state.deleteExpense);

  if (expenses.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-white/20 bg-white/10 p-8 text-center text-sm text-muted-foreground backdrop-blur-xl">
        {t("dashboard.noExpenses")}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-white/15">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("table.expense")}</TableHead>
            <TableHead>{t("table.paidBy")}</TableHead>
            <TableHead>{t("table.split")}</TableHead>
            <TableHead>{t("table.date")}</TableHead>
            <TableHead className="text-right">{t("table.amount")}</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="font-medium">
                {expense.note || t("table.sharedExpense")}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  {getExpensePayments(expense).map((payment) => (
                    <span key={payment.userId}>
                      {memberName(group.members, payment.userId)}{" "}
                      <CurrencyAmount cents={payment.amountCents} />
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary">
                    {expense.splitType === "percentage"
                      ? t("table.percentage")
                      : expense.splitType === "custom"
                        ? t("table.custom")
                        : t("table.equal")}
                  </Badge>
                  {expense.initialBillsEnabled &&
                  getExpenseInitialBills(expense).length > 0 ? (
                    <Badge variant="outline">
                      {t("table.sharedAmount", { amount: "" })}
                      <CurrencyAmount
                        cents={getExpenseSharedAmountCents(expense)}
                        className="ml-1"
                      />
                    </Badge>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(expense.createdAt)}
              </TableCell>
              <TableCell className="text-right font-mono">
                <CurrencyAmount cents={expense.amountCents} />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <AddExpenseDialog groupId={group.id} expense={expense}>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("actions.edit")}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  </AddExpenseDialog>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("actions.delete")}
                    onClick={() => deleteExpense(expense.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
