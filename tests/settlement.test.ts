import { describe, expect, it } from "vitest"

import {
  calculateGroupBalances,
  optimizeSettlements,
  rebalanceExpenseAfterMemberRemoval,
  roundCentsToCurrencyUnit,
} from "@/lib/calculations/settlement"
import type { Balance, Expense, Group } from "@/lib/types"

function settlements(balances: Balance[]) {
  return optimizeSettlements(balances).map((item) => ({
    ...item,
    amountCents: item.amountCents,
  }))
}

describe("optimizeSettlements", () => {
  it("rounds currency units at .50 and above", () => {
    expect(roundCentsToCurrencyUnit(5049)).toBe(5000)
    expect(roundCentsToCurrencyUnit(5050)).toBe(5100)
  })

  it("returns no transactions for balanced users", () => {
    expect(
      settlements([
        { userId: "a", balanceCents: 0 },
        { userId: "b", balanceCents: 0 },
      ])
    ).toEqual([])
  })

  it("settles one debtor against many creditors", () => {
    expect(
      settlements([
        { userId: "a", balanceCents: -10000 },
        { userId: "b", balanceCents: 7000 },
        { userId: "c", balanceCents: 3000 },
      ])
    ).toEqual([
      { fromId: "a", toId: "b", amountCents: 7000 },
      { fromId: "a", toId: "c", amountCents: 3000 },
    ])
  })

  it("settles many debtors against one creditor", () => {
    expect(
      settlements([
        { userId: "a", balanceCents: -2500 },
        { userId: "b", balanceCents: -500 },
        { userId: "c", balanceCents: 3000 },
      ])
    ).toEqual([
      { fromId: "a", toId: "c", amountCents: 2500 },
      { fromId: "b", toId: "c", amountCents: 500 },
    ])
  })

  it("keeps whole-unit rounding balanced for equal split expenses", () => {
    const group: Group = {
      id: "group",
      name: "Trip",
      icon: "plane",
      createdAt: "2026-05-09T00:00:00.000Z",
      members: [
        { id: "a", name: "A", color: "#fff" },
        { id: "b", name: "B", color: "#fff" },
      ],
    }
    const expenses: Expense[] = [
      {
        id: "expense",
        groupId: "group",
        amountCents: 10100,
        paidBy: "a",
        splitType: "equal",
        participants: ["a", "b"],
        note: "Snack",
        createdAt: "2026-05-09T00:00:00.000Z",
      },
    ]

    const balances = calculateGroupBalances(group, expenses)
    expect(balances.reduce((sum, balance) => sum + balance.balanceCents, 0)).toBe(0)
    expect(balances).toEqual([
      { userId: "a", balanceCents: 5000 },
      { userId: "b", balanceCents: -5000 },
    ])
  })

  it("supports multiple payers, initial bills, and percentage split", () => {
    const group: Group = {
      id: "group",
      name: "Dinner",
      icon: "utensils",
      createdAt: "2026-05-09T00:00:00.000Z",
      members: [
        { id: "a", name: "A", color: "#fff" },
        { id: "b", name: "B", color: "#fff" },
        { id: "c", name: "C", color: "#fff" },
      ],
    }
    const expenses: Expense[] = [
      {
        id: "expense",
        groupId: "group",
        amountCents: 10000,
        payments: [
          { userId: "a", amountCents: 6000 },
          { userId: "b", amountCents: 4000 },
        ],
        paidBy: "a",
        splitType: "percentage",
        participants: ["a", "b", "c"],
        initialBillsEnabled: true,
        initialBills: [
          { userId: "a", amountCents: 1000 },
          { userId: "b", amountCents: 2000 },
        ],
        participantShares: [
          { userId: "a", percentage: 50 },
          { userId: "b", percentage: 30 },
          { userId: "c", percentage: 20 },
        ],
        note: "Dinner",
        createdAt: "2026-05-09T00:00:00.000Z",
      },
    ]

    expect(calculateGroupBalances(group, expenses)).toEqual([
      { userId: "a", balanceCents: 1500 },
      { userId: "b", balanceCents: -100 },
      { userId: "c", balanceCents: -1400 },
    ])
  })

  it("supports fixed amount splits", () => {
    const group: Group = {
      id: "group",
      name: "Dinner",
      icon: "utensils",
      createdAt: "2026-05-09T00:00:00.000Z",
      members: [
        { id: "a", name: "A", color: "#fff" },
        { id: "b", name: "B", color: "#fff" },
        { id: "c", name: "C", color: "#fff" },
      ],
    }
    const expenses: Expense[] = [
      {
        id: "expense",
        groupId: "group",
        amountCents: 12000,
        payments: [{ userId: "a", amountCents: 12000 }],
        paidBy: "a",
        splitType: "custom",
        participants: ["a", "b", "c"],
        participantShares: [
          { userId: "a", amountCents: 2000 },
          { userId: "b", amountCents: 4000 },
          { userId: "c", amountCents: 6000 },
        ],
        note: "Dinner",
        createdAt: "2026-05-09T00:00:00.000Z",
      },
    ]

    expect(calculateGroupBalances(group, expenses)).toEqual([
      { userId: "a", balanceCents: 10000 },
      { userId: "b", balanceCents: -4000 },
      { userId: "c", balanceCents: -6000 },
    ])
  })

  it("rebalances active removed members across the remaining group", () => {
    const group: Group = {
      id: "group",
      name: "Trip",
      icon: "plane",
      createdAt: "2026-05-09T00:00:00.000Z",
      members: [
        { id: "a", name: "A", color: "#fff" },
        { id: "b", name: "B", color: "#fff" },
      ],
    }
    const expense: Expense = {
      id: "expense",
      groupId: "group",
      amountCents: 12000,
      payments: [
        { userId: "a", amountCents: 6000 },
        { userId: "c", amountCents: 6000 },
      ],
      paidBy: "a",
      splitType: "equal",
      participants: ["a", "b", "c"],
      initialBillsEnabled: true,
      initialBills: [{ userId: "c", amountCents: 3000 }],
      note: "Hotel",
      createdAt: "2026-05-09T00:00:00.000Z",
    }

    const rebalanced = rebalanceExpenseAfterMemberRemoval(
      expense,
      ["a", "b"],
      "c"
    )

    expect(rebalanced.participants).toEqual(["a", "b"])
    expect(rebalanced.initialBills).toEqual([])
    expect(rebalanced.payments).toEqual([
      { userId: "a", amountCents: 9000 },
      { userId: "b", amountCents: 3000 },
    ])
    expect(
      rebalanced.payments?.reduce((total, payment) => total + payment.amountCents, 0)
    ).toBe(12000)
    expect(calculateGroupBalances(group, [rebalanced])).toEqual([
      { userId: "a", balanceCents: 3000 },
      { userId: "b", balanceCents: -3000 },
    ])
  })
})
