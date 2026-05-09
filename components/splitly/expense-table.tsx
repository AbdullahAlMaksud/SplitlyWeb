"use client";

import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
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
} from "@/lib/calculations/settlement";
import { formatCurrency, formatDate, memberName } from "@/lib/formatters";
import type { Expense, Group } from "@/lib/types";

export function ExpenseTable({
  group,
  expenses,
}: {
  group: Group;
  expenses: Expense[];
}) {
  const { t } = useTranslation();

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
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="font-medium">
                {expense.note || t("table.sharedExpense")}
              </TableCell>
              <TableCell>
                {getExpensePayments(expense)
                  .map(
                    (payment) =>
                      `${memberName(group.members, payment.userId)} ${formatCurrency(
                        payment.amountCents,
                      )}`,
                  )
                  .join(", ")}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary">
                    {expense.splitType === "percentage"
                      ? t("table.percentage")
                      : t("table.equal")}
                  </Badge>
                  {expense.initialBillsEnabled &&
                  getExpenseInitialBills(expense).length > 0 ? (
                    <Badge variant="outline">
                      {t("table.sharedAmount", {
                        amount: formatCurrency(
                          getExpenseSharedAmountCents(expense),
                        ),
                      })}
                    </Badge>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(expense.createdAt)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(expense.amountCents)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
