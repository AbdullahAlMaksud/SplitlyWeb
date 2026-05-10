"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

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
import { Textarea } from "@/components/ui/textarea";
import {
  formatCurrency,
  formatNumber,
  parseCurrencyToCents,
  parseLocalizedNumber,
} from "@/lib/formatters";
import type { SplitType } from "@/lib/types";
import { cn } from "@/lib/utils";
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

export function AddExpenseDialog({
  groupId,
  children,
}: {
  groupId?: string;
  children?: React.ReactNode;
}) {
  const { groups, addExpense } = useSplitlyStore();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(groupId ?? "");
  const [amount, setAmount] = useState("");
  const [payerAmounts, setPayerAmounts] = useState<Record<string, string>>({});
  const [participants, setParticipants] = useState<string[]>([]);
  const [splitType, setSplitType] =
    useState<Extract<SplitType, "equal" | "percentage">>("equal");
  const [percentageShares, setPercentageShares] = useState<
    Record<string, string>
  >({});
  const [initialBillsEnabled, setInitialBillsEnabled] = useState(false);
  const [initialBillAmounts, setInitialBillAmounts] = useState<
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
  const initialBills = initialBillsEnabled
    ? participantValues
        .map((memberId) => ({
          userId: memberId,
          amountCents: parseCurrencyToCents(initialBillAmounts[memberId] ?? ""),
        }))
        .filter((bill) => bill.amountCents > 0)
    : [];
  const initialTotalCents = initialBills.reduce(
    (total, bill) => total + bill.amountCents,
    0,
  );
  const sharedAmountCents = Math.max(0, amountCents - initialTotalCents);
  const participantShares = participantValues.map((memberId) => ({
    userId: memberId,
    percentage: parsePercentage(percentageShares[memberId]),
  }));
  const percentageTotal = participantShares.reduce(
    (total, share) => total + share.percentage,
    0,
  );
  const canSave =
    Boolean(selectedGroup) &&
    amountCents > 0 &&
    payments.length > 0 &&
    paymentTotalCents === amountCents &&
    participantValues.length > 0 &&
    initialTotalCents <= amountCents &&
    (splitType === "equal" || Math.abs(percentageTotal - 100) <= 0.01);

  const initializeForGroup = (nextGroupId: string) => {
    const nextGroup = groups.find((group) => group.id === nextGroupId);
    const nextParticipants =
      nextGroup?.members.map((member) => member.id) ?? [];

    setSelectedGroupId(nextGroupId);
    setParticipants(nextParticipants);
    setPayerAmounts({});
    setInitialBillAmounts({});
    setPercentageShares(distributePercentages(nextParticipants));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          const nextGroupId =
            groupId ?? (selectedGroupId || groups[0]?.id || "");
          if (nextGroupId) initializeForGroup(nextGroupId);
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
          <DialogTitle>{t("expenseDialog.title")}</DialogTitle>
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

              addExpense({
                groupId: selectedGroup.id,
                amountCents,
                payments,
                splitType,
                participants: participantValues,
                initialBillsEnabled,
                initialBills,
                participantShares:
                  splitType === "percentage" ? participantShares : [],
                note,
              });

              setAmount("");
              setPayerAmounts({});
              setInitialBillAmounts({});
              setInitialBillsEnabled(false);
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
                  {t("expenseDialog.paidSummary", {
                    amount: formatCurrency(paymentTotalCents),
                  })}
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
                <p className="text-xs text-red-300">
                  {t("expenseDialog.paymentDifference", {
                    amount: formatCurrency(amountCents - paymentTotalCents),
                  })}
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Label>{t("expenseDialog.initialBills")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("expenseDialog.initialBillsHint")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={initialBillsEnabled ? "default" : "outline"}
                  aria-pressed={initialBillsEnabled}
                  onClick={() => setInitialBillsEnabled((value) => !value)}
                >
                  {initialBillsEnabled
                    ? t("toggles.initialBillsOn")
                    : t("toggles.initialBillsOff")}
                </Button>
              </div>

              {initialBillsEnabled ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {participantValues.map((memberId) => {
                    const member = selectedGroup?.members.find(
                      (item) => item.id === memberId,
                    );
                    if (!member) return null;

                    return (
                      <div key={member.id} className="space-y-1">
                        <Label htmlFor={`initial-${member.id}`}>
                          {member.name}
                        </Label>
                        <Input
                          id={`initial-${member.id}`}
                          inputMode="decimal"
                          placeholder="0.00"
                          value={initialBillAmounts[member.id] ?? ""}
                          onChange={(event) =>
                            setInitialBillAmounts((current) => ({
                              ...current,
                              [member.id]: event.target.value,
                            }))
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              ) : null}
              <p className="text-xs text-muted-foreground">
                {t("expenseDialog.sharedAfterInitial", {
                  amount: formatCurrency(sharedAmountCents),
                })}
              </p>
              {initialTotalCents > amountCents ? (
                <p className="text-xs text-red-300">
                  {t("expenseDialog.initialBillsError")}
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
                    "equal" | "percentage"
                  >;
                  setSplitType(nextType);
                  if (nextType === "percentage") {
                    setPercentageShares(
                      distributePercentages(participantValues),
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-note">{t("expenseDialog.note")}</Label>
              <Textarea
                id="expense-note"
                placeholder={t("expenseDialog.notePlaceholder")}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={!canSave}>
              {t("actions.saveExpense")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
