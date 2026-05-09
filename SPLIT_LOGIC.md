# Splitly Split Logic

This document describes the current expense splitting and settlement rules used by
Splitly. The implementation lives in `lib/calculations/settlement.ts` and the
member removal flow is called from `store/splitly-store.ts`.

## Core Model

Each group has members, and each expense belongs to one group.

An expense stores:

- `amountCents`: the total bill in cents.
- `payments`: one or more people who paid part of the bill.
- `paidBy`: the first payer, kept for backward compatibility.
- `participants`: members included in the split.
- `splitType`: currently `equal` or `percentage` in the UI.
- `initialBillsEnabled`: whether member-specific bills are subtracted first.
- `initialBills`: personal amounts assigned to participants before the shared split.
- `participantShares`: percentage weights for percentage splits.

All calculations use cents so the final balances stay integer-safe.

## Payment Normalization

If an expense has a `payments` array, Splitly uses it. If it does not, the app
falls back to `{ userId: paidBy, amountCents }`.

Payments with zero or negative amounts are ignored.

## Initial Personal Bills

Initial bills are optional. When enabled:

1. Positive `initialBills` are collected.
2. Their total is subtracted from the expense total.
3. Each initial bill is charged directly to its member.
4. The remaining amount is split among participants.

Formula:

```text
sharedAmountCents = max(0, expense.amountCents - initialBillsTotal)
```

Initial bills only count for users who are still valid participants.

## Equal Split

For equal splits, `sharedAmountCents` is divided across all participants.

Remainder cents are assigned from the start of the participant list so the total
always matches exactly.

Example:

```text
100 cents / 3 people = 34, 33, 33
```

## Percentage Split

For percentage splits:

1. Splitly reads each participant's percentage.
2. If the percentages total 100, it calculates each participant's raw share.
3. Each raw share is floored to cents.
4. Any remaining cents are assigned to the largest fractional remainders first.

If the percentages do not total 100, Splitly falls back to an equal split.

## Balance Calculation

Each member starts at `0`.

For each expense:

1. Valid payments increase the payer's balance.
2. Initial bills decrease the assigned participant's balance.
3. Shared split amounts decrease each participant's balance.

Interpretation:

- Positive balance: this member should receive money.
- Negative balance: this member owes money.
- Zero balance: this member is settled.

## Optimized Settlements

Settlement optimization converts final balances into fewer transfers.

1. Members with negative balances become debtors.
2. Members with positive balances become creditors.
3. The largest debtors and creditors are matched first.
4. Each transaction uses the smaller remaining amount between the debtor and
   creditor.

The result is a compact list like:

```text
Rahim pays Sumi $24.50
Karim pays Rahim $10.00
```

## Removing Active Members

Members can be removed even if they appear in existing expenses. The current
local user cannot remove themselves.

When a member is removed:

1. The member is removed from the group member list.
2. Their participant references are removed from group expenses.
3. Their initial bills are removed.
4. Their percentage shares are removed and remaining percentage shares are
   normalized back to 100.
5. Their payment amount is removed from `payments`.
6. If the remaining payment total is now lower than the expense total, the
   missing paid amount is distributed across the remaining participants.
7. If the remaining payment total is higher than the expense total, the overage
   is trimmed from the latest payments.

This keeps every expense internally balanced after removal:

```text
sum(payments) === expense.amountCents
```

If removing a participant leaves no participants on an expense, Splitly falls
back to all remaining group members.

## Current UI Constraints

The add expense dialog currently allows:

- Multiple payers.
- Equal split.
- Percentage split.
- Optional initial personal bills.
- Participant selection.

The `custom` split type exists in the TypeScript type, but the current UI does
not expose a custom fixed-amount split control.
