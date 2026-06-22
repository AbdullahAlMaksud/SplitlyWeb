"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CurrencyAmount } from "@/components/ui/currency-amount";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  formatNumber,
  parseCurrencyToCents,
  parseLocalizedNumber,
} from "@/shared/lib/formatters";
import { roundCentsToCurrencyUnit } from "@/shared/lib/calculations/settlement";
import type { Expense, ExpenseShare, SplitType } from "@/shared/types";
import { cn } from "@/shared/lib/utils";
import { useSplitlyStore } from "@/store/splitly-store";

function distributePercentages(memberIds: string[]) {
  if (memberIds.length === 0) return {};

  const base = Math.floor((100 / memberIds.length) * 100) / 100;
  const percentages: Record<string, string> = {};
  let used = 0;

  memberIds.forEach((memberId, index) => {
    const value =
      index === memberIds.length - 1
        ? Math.round((100 - used) * 100) / 100
        : base;
    percentages[memberId] = String(value);
    used += value;
  });

  return percentages;
}

function parsePercentage(value: string | undefined) {
  const percentage = parseLocalizedNumber(value ?? "0");
  return Number.isFinite(percentage) ? percentage : 0;
}

function distributeFixedAmounts(amountCents: number, memberIds: string[]) {
  const roundedAmountCents = roundCentsToCurrencyUnit(amountCents);
  if (memberIds.length === 0 || roundedAmountCents <= 0) return {};

  const amountUnits = Math.round(roundedAmountCents / 100);
  const base = Math.floor(amountUnits / memberIds.length);
  const remainder = amountUnits % memberIds.length;

  return Object.fromEntries(
    memberIds.map((memberId, index) => [
      memberId,
      String(base + (index < remainder ? 1 : 0)),
    ]),
  );
}

export function AddExpenseDialog({
  groupId,
  expense,
  children,
}: {
  groupId?: string;
  expense?: Expense;
  children?: React.ReactNode;
}) {
  const groups = useSplitlyStore((state) => state.groups);
  const addExpense = useSplitlyStore((state) => state.addExpense);
  const updateExpense = useSplitlyStore((state) => state.updateExpense);
  const { t } = useTranslation();
  const isEditing = Boolean(expense);
  const [open, setOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(groupId ?? "");
  const [amount, setAmount] = useState("");
  const [payerAmounts, setPayerAmounts] = useState<Record<string, string>>({});
  const [participants, setParticipants] = useState<string[]>([]);
  const [splitType, setSplitType] =
    useState<Extract<SplitType, "equal" | "percentage" | "custom">>("equal");
  const [percentageShares, setPercentageShares] = useState<
    Record<string, string>
  >({});
  const [fixedShareAmounts, setFixedShareAmounts] = useState<
    Record<string, string>
  >({});
  const [note, setNote] = useState("");
  const effectiveGroupId = groupId ?? selectedGroupId;

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === effectiveGroupId),
    [groups, effectiveGroupId],
  );

  const participantValues =
    participants.length > 0
      ? participants.filter((participantId) =>
          selectedGroup?.members.some((member) => member.id === participantId),
        )
      : (selectedGroup?.members.map((member) => member.id) ?? []);

  const amountCents = parseCurrencyToCents(amount);
  const roundedAmountCents = roundCentsToCurrencyUnit(amountCents);
  const payments = (selectedGroup?.members ?? [])
    .map((member) => ({
      userId: member.id,
      amountCents: parseCurrencyToCents(payerAmounts[member.id] ?? ""),
    }))
    .filter((payment) => payment.amountCents > 0);
  const paymentTotalCents = payments.reduce(
    (total, payment) => total + payment.amountCents,
    0,
  );
  const participantShares: ExpenseShare[] = participantValues.map(
    (memberId) => ({
      userId: memberId,
      ...(splitType === "percentage"
        ? { percentage: parsePercentage(percentageShares[memberId]) }
        : {
            amountCents: roundCentsToCurrencyUnit(
              parseCurrencyToCents(fixedShareAmounts[memberId] ?? ""),
            ),
          }),
    }),
  );
  const percentageTotal = participantShares.reduce(
    (total, share) => total + (share.percentage ?? 0),
    0,
  );
  const fixedTotalCents = participantShares.reduce(
    (total, share) => total + (share.amountCents ?? 0),
    0,
  );
  const canSave =
    Boolean(selectedGroup) &&
    amountCents > 0 &&
    payments.length > 0 &&
    paymentTotalCents === amountCents &&
    participantValues.length > 0 &&
    (splitType === "equal" ||
      (splitType === "percentage" && Math.abs(percentageTotal - 100) <= 0.01) ||
      (splitType === "custom" && fixedTotalCents === roundedAmountCents));

  const initializeForGroup = (nextGroupId: string) => {
    const nextGroup = groups.find((group) => group.id === nextGroupId);
    const nextParticipants =
      nextGroup?.members.map((member) => member.id) ?? [];

    setSelectedGroupId(nextGroupId);
    setParticipants(nextParticipants);
    setPayerAmounts({});
    setPercentageShares(distributePercentages(nextParticipants));
    setFixedShareAmounts(distributeFixedAmounts(amountCents, nextParticipants));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          const nextGroupId =
            groupId ?? (selectedGroupId || groups[0]?.id || "");
          if (nextGroupId) initializeForGroup(nextGroupId);

          if (expense) {
            // Pre-fill for editing
            setAmount(String(expense.amountCents / 100));
            setNote(expense.note);
            setSplitType(
              expense.splitType === "percentage" ||
                expense.splitType === "custom"
                ? expense.splitType
                : "equal",
            );
            setParticipants(expense.participants);

            const payers: Record<string, string> = {};
            for (const p of expense.payments ?? []) {
              payers[p.userId] = String(p.amountCents / 100);
            }
            setPayerAmounts(payers);

            const shares: Record<string, string> = {};
            for (const s of expense.participantShares ?? []) {
              shares[s.userId] = String(
                expense.splitType === "custom"
                  ? (s.amountCents ?? 0) / 100
                  : (s.percentage ?? 0),
              );
            }
            setPercentageShares(
              expense.splitType === "percentage" &&
                Object.keys(shares).length > 0
                ? shares
                : distributePercentages(expense.participants),
            );
            setFixedShareAmounts(
              expense.splitType === "custom" && Object.keys(shares).length > 0
                ? shares
                : distributeFixedAmounts(
                    expense.amountCents,
                    expense.participants,
                  ),
            );
          }
        }
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        {children ?? (
          <Button>
            <Plus className="size-4" />
            {t("actions.addExpense")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] min-w-2xl max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t("expenseDialog.editTitle")
              : t("expenseDialog.title")}
          </DialogTitle>
          <DialogDescription>
            {t("expenseDialog.description")}
          </DialogDescription>
        </DialogHeader>

        {groups.length === 0 ? (
          <div className="rounded-md border border-dashed border-white/20 bg-white/10 p-8 text-center text-sm text-muted-foreground backdrop-blur-xl">
            {t("expenseDialog.createGroupFirst")}
          </div>
        ) : (
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              if (!selectedGroup || !canSave) return;

              if (isEditing && expense) {
                updateExpense(expense.id, {
                  amountCents,
                  payments,
                  splitType,
                  participants: participantValues,
                  initialBillsEnabled: false,
                  initialBills: [],
                  participantShares:
                    splitType === "equal" ? [] : participantShares,
                  note,
                });
              } else {
                addExpense({
                  groupId: selectedGroup.id,
                  amountCents,
                  payments,
                  splitType,
                  participants: participantValues,
                  initialBillsEnabled: false,
                  initialBills: [],
                  participantShares:
                    splitType === "equal" ? [] : participantShares,
                  note,
                });
              }

              setAmount("");
              setPayerAmounts({});
              setFixedShareAmounts({});
              setSplitType("equal");
              setNote("");
              setOpen(false);
            }}
          >
            {!groupId ? (
              <div className="space-y-2">
                <Label>{t("expenseDialog.group")}</Label>
                <Select
                  value={selectedGroupId}
                  onValueChange={initializeForGroup}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("expenseDialog.selectGroup")} />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="expense-name">{t("expenseDialog.name")}</Label>
              <Input
                id="expense-name"
                placeholder={t("expenseDialog.namePlaceholder")}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-amount">
                {t("expenseDialog.totalExpense")}
              </Label>
              <Input
                id="expense-amount"
                inputMode="decimal"
                placeholder="120.00"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label>{t("expenseDialog.whoPaid")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("expenseDialog.whoPaidHint")}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-md px-2 py-1 text-xs font-medium",
                    paymentTotalCents === amountCents && amountCents > 0
                      ? "bg-primary/15 text-primary"
                      : "bg-white/10 text-muted-foreground",
                  )}
                >
                  {t("expenseDialog.paid")}{" "}
                  <CurrencyAmount cents={paymentTotalCents} />
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {selectedGroup?.members.map((member) => (
                  <div key={member.id} className="space-y-1">
                    <Label htmlFor={`payer-${member.id}`}>{member.name}</Label>
                    <Input
                      id={`payer-${member.id}`}
                      inputMode="decimal"
                      placeholder="0.00"
                      value={payerAmounts[member.id] ?? ""}
                      onChange={(event) =>
                        setPayerAmounts((current) => ({
                          ...current,
                          [member.id]: event.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
              {amountCents > 0 && paymentTotalCents !== amountCents ? (
                <p className="flex items-center gap-1 text-xs text-red-300">
                  <span>{t("expenseDialog.paymentDifferenceLabel")}:</span>
                  <CurrencyAmount cents={amountCents - paymentTotalCents} />
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              <Label>{t("expenseDialog.participants")}</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {selectedGroup?.members.map((member) => (
                  <label
                    key={member.id}
                    className="flex items-center gap-3 rounded-md border border-white/15 bg-white/10 p-3 text-sm backdrop-blur-xl"
                  >
                    <Checkbox
                      checked={participantValues.includes(member.id)}
                      onCheckedChange={(checked) => {
                        setParticipants((current) => {
                          const next = checked
                            ? [...new Set([...current, member.id])]
                            : current.filter((id) => id !== member.id);
                          setPercentageShares(distributePercentages(next));
                          setFixedShareAmounts(
                            distributeFixedAmounts(amountCents, next),
                          );
                          return next;
                        });
                      }}
                    />
                    {member.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>{t("expenseDialog.splitRemaining")}</Label>
              <Select
                value={splitType}
                onValueChange={(value) => {
                  const nextType = value as Extract<
                    SplitType,
                    "equal" | "percentage" | "custom"
                  >;
                  setSplitType(nextType);
                  if (nextType === "percentage") {
                    setPercentageShares(
                      distributePercentages(participantValues),
                    );
                  }
                  if (nextType === "custom") {
                    setFixedShareAmounts(
                      distributeFixedAmounts(amountCents, participantValues),
                    );
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equal">{t("table.equal")}</SelectItem>
                  <SelectItem value="percentage">
                    {t("table.percentage")}
                  </SelectItem>
                  <SelectItem value="custom">{t("table.custom")}</SelectItem>
                </SelectContent>
              </Select>

              {splitType === "percentage" ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {participantValues.map((memberId) => {
                      const member = selectedGroup?.members.find(
                        (item) => item.id === memberId,
                      );
                      if (!member) return null;

                      return (
                        <div key={member.id} className="space-y-1">
                          <Label htmlFor={`percentage-${member.id}`}>
                            {member.name}
                          </Label>
                          <Input
                            id={`percentage-${member.id}`}
                            inputMode="decimal"
                            placeholder="0"
                            value={percentageShares[member.id] ?? ""}
                            onChange={(event) =>
                              setPercentageShares((current) => ({
                                ...current,
                                [member.id]: event.target.value,
                              }))
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span
                      className={cn(
                        "font-medium",
                        Math.abs(percentageTotal - 100) <= 0.01
                          ? "text-primary"
                          : "text-red-300",
                      )}
                    >
                      {t("expenseDialog.totalPercentage", {
                        valueLabel: formatNumber(percentageTotal),
                      })}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPercentageShares(
                          distributePercentages(participantValues),
                        )
                      }
                    >
                      {t("actions.autoEqualPercent")}
                    </Button>
                  </div>
                </div>
              ) : null}

              {splitType === "custom" ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {participantValues.map((memberId) => {
                      const member = selectedGroup?.members.find(
                        (item) => item.id === memberId,
                      );
                      if (!member) return null;

                      return (
                        <div key={member.id} className="space-y-1">
                          <Label htmlFor={`fixed-${member.id}`}>
                            {member.name}
                          </Label>
                          <Input
                            id={`fixed-${member.id}`}
                            inputMode="decimal"
                            placeholder="0.00"
                            value={fixedShareAmounts[member.id] ?? ""}
                            onChange={(event) =>
                              setFixedShareAmounts((current) => ({
                                ...current,
                                [member.id]: event.target.value,
                              }))
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span
                      className={cn(
                        "flex items-center gap-1 font-medium",
                        fixedTotalCents === roundedAmountCents
                          ? "text-primary"
                          : "text-red-300",
                      )}
                    >
                      {t("expenseDialog.totalFixed")}:
                      <CurrencyAmount cents={fixedTotalCents} />
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFixedShareAmounts(
                          distributeFixedAmounts(
                            amountCents,
                            participantValues,
                          ),
                        )
                      }
                    >
                      {t("expenseDialog.autoEqualAmount")}
                    </Button>
                  </div>
                  {fixedTotalCents !== roundedAmountCents ? (
                    <p className="text-xs text-red-300">
                      {t("expenseDialog.fixedAmountError")}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <Button type="submit" className="w-full" disabled={!canSave}>
              {isEditing
                ? t("actions.updateExpense")
                : t("actions.saveExpense")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
