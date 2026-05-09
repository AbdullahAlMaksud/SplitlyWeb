import { describe, expect, it } from "vitest"

import { generateMarkdownReport } from "@/lib/export/markdown"
import type { Expense, Group, SettlementTransaction } from "@/lib/types"

describe("generateMarkdownReport", () => {
  it("generates valid Splitly report sections", () => {
    const group: Group = {
      id: "group",
      name: "Weekend Trip",
      icon: "plane",
      createdAt: "2026-05-09T00:00:00.000Z",
      members: [
        { id: "rahim", name: "Rahim", color: "#93c5fd" },
        { id: "karim", name: "Karim", color: "#86efac" },
        { id: "sumi", name: "Sumi", color: "#fda4af" },
      ],
    }
    const expenses: Expense[] = [
      {
        id: "dinner",
        groupId: "group",
        amountCents: 10000,
        paidBy: "rahim",
        splitType: "equal",
        participants: ["rahim", "karim", "sumi"],
        note: "Dinner",
        createdAt: "2026-05-09T00:00:00.000Z",
      },
      {
        id: "hotel",
        groupId: "group",
        amountCents: 30000,
        paidBy: "karim",
        splitType: "equal",
        participants: ["rahim", "karim", "sumi"],
        note: "Hotel",
        createdAt: "2026-05-09T00:00:00.000Z",
      },
    ]
    const settlements: SettlementTransaction[] = [
      { fromId: "karim", toId: "rahim", amountCents: 5000 },
      { fromId: "sumi", toId: "karim", amountCents: 3000 },
    ]

    const markdown = generateMarkdownReport({ group, expenses, settlements })

    expect(markdown).toContain("# Splitly Group Report")
    expect(markdown).toContain("## Group Information")
    expect(markdown).toContain("- Group Name: Weekend Trip")
    expect(markdown).toContain("## Members")
    expect(markdown).toContain("- Rahim")
    expect(markdown).toContain("## Expenses")
    expect(markdown).toContain("- Dinner: $100.00 (paid by Rahim)")
    expect(markdown).toContain("- Hotel: $300.00 (paid by Karim)")
    expect(markdown).toContain("## Settlement Summary")
    expect(markdown).toContain("- Karim pays Rahim $50.00")
    expect(markdown).toContain("- Sumi pays Karim $30.00")
  })
})

