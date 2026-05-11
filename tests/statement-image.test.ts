import { describe, expect, it } from "vitest"

import { buildStatementImageData } from "@/lib/export/statement-image"
import type { Balance, Expense, Group, SettlementTransaction } from "@/lib/types"

describe("buildStatementImageData", () => {
  it("summarizes a settlement image with total, split, paid, and share", () => {
    const group: Group = {
      id: "group",
      name: "Weekend Trip",
      icon: "plane",
      createdAt: "2026-05-09T00:00:00.000Z",
      members: [
        { id: "rahim", name: "Rahim", color: "#93c5fd" },
        { id: "karim", name: "Karim", color: "#86efac" },
      ],
    }
    const expenses: Expense[] = [
      {
        id: "dinner",
        groupId: "group",
        amountCents: 12000,
        payments: [{ userId: "rahim", amountCents: 12000 }],
        paidBy: "rahim",
        splitType: "equal",
        participants: ["rahim", "karim"],
        note: "Dinner",
        createdAt: "2026-05-09T00:00:00.000Z",
      },
      {
        id: "cab",
        groupId: "group",
        amountCents: 3000,
        payments: [{ userId: "karim", amountCents: 3000 }],
        paidBy: "karim",
        splitType: "equal",
        participants: ["rahim", "karim"],
        note: "Cab",
        createdAt: "2026-05-09T00:00:00.000Z",
      },
    ]
    const balances: Balance[] = [
      { userId: "rahim", balanceCents: 4500 },
      { userId: "karim", balanceCents: -4500 },
    ]
    const settlement: SettlementTransaction = {
      fromId: "karim",
      toId: "rahim",
      amountCents: 4500,
    }

    const data = buildStatementImageData({
      group,
      expenses,
      balances,
      settlement,
      language: "en",
      createdAt: "2026-05-11T00:00:00.000Z",
    })

    expect(data.transferLabel).toBe("Karim pays Rahim")
    expect(data.receiveLabel).toBe("Rahim receives ৳45")
    expect(data.amountLabel).toBe("৳45")
    expect(data.stats).toEqual([
      { label: "Total spent", value: "৳150" },
      { label: "Split", value: "Equal" },
      { label: "Karim paid", value: "৳30" },
      { label: "Karim share", value: "৳75" },
    ])
  })
})
