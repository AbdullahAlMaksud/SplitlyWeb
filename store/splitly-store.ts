"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import {
  calculateGroupBalances,
  optimizeSettlements,
  rebalanceExpenseAfterMemberRemoval,
} from "@/lib/calculations/settlement"
import { createId } from "@/lib/ids"
import type {
  CurrentUserProfile,
  DashboardSummary,
  Expense,
  ExpensePayment,
  ExpenseShare,
  Group,
  GroupIcon,
  Member,
  SplitType,
} from "@/lib/types"

type CreateGroupInput = {
  name: string
  icon: GroupIcon
  memberNames: string[]
}

type AddExpenseInput = {
  groupId: string
  amountCents: number
  payments: ExpensePayment[]
  splitType: SplitType
  participants: string[]
  initialBillsEnabled: boolean
  initialBills: ExpensePayment[]
  participantShares: ExpenseShare[]
  note: string
}

type SplitlyState = {
  currentUser: CurrentUserProfile
  groups: Group[]
  expenses: Expense[]
  hasHydrated: boolean
  setHasHydrated: (value: boolean) => void
  updateCurrentUser: (profile: Pick<CurrentUserProfile, "name" | "color">) => void
  createGroup: (input: CreateGroupInput) => string
  addMember: (groupId: string, name: string) => string
  removeMember: (groupId: string, memberId: string) => boolean
  addExpense: (input: AddExpenseInput) => string
  resetAll: () => void
  getGroupExpenses: (groupId: string) => Expense[]
  getGroupBalances: (groupId: string) => ReturnType<typeof calculateGroupBalances>
  getGroupSettlements: (groupId: string) => ReturnType<typeof optimizeSettlements>
  getDashboardSummary: () => DashboardSummary
}

const CURRENT_USER_ID = "local-user"
const MEMBER_COLORS = ["#7dd3fc", "#5eead4", "#93c5fd", "#a5b4fc", "#67e8f9"]

const defaultCurrentUser: CurrentUserProfile = {
  id: CURRENT_USER_ID,
  name: "You",
  color: "#7dd3fc",
}

function currentUserMember(user: CurrentUserProfile): Member {
  return {
    id: user.id,
    name: user.name.trim() || "You",
    color: user.color,
  }
}

function memberFromName(name: string, index: number): Member {
  return {
    id: createId("member"),
    name: name.trim(),
    color: MEMBER_COLORS[(index + 1) % MEMBER_COLORS.length],
  }
}

export const useSplitlyStore = create<SplitlyState>()(
  persist(
    (set, get) => ({
      currentUser: defaultCurrentUser,
      groups: [],
      expenses: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      updateCurrentUser: (profile) =>
        set((state) => {
          const currentUser = {
            ...state.currentUser,
            name: profile.name.trim() || "You",
            color: profile.color,
          }

          return {
            currentUser,
            groups: state.groups.map((group) => ({
              ...group,
              members: group.members.map((member) =>
                member.id === currentUser.id
                  ? { ...member, name: currentUser.name, color: currentUser.color }
                  : member
              ),
            })),
          }
        }),
      createGroup: (input) => {
        const groupId = createId("group")
        const createdAt = new Date().toISOString()
        const names = input.memberNames
          .map((name) => name.trim())
          .filter((name) => name.length > 0)
        const extraMembers = names.map(memberFromName)

        const group: Group = {
          id: groupId,
          name: input.name.trim(),
          icon: input.icon,
          members: [currentUserMember(get().currentUser), ...extraMembers],
          createdAt,
        }

        set((state) => ({ groups: [group, ...state.groups] }))
        return groupId
      },
      addMember: (groupId, name) => {
        const memberId = createId("member")
        const member: Member = {
          id: memberId,
          name: name.trim(),
          color: MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)],
        }

        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId
              ? { ...group, members: [...group.members, member] }
              : group
          ),
        }))

        return memberId
      },
      removeMember: (groupId, memberId) => {
        if (memberId === get().currentUser.id) return false
        const group = get().groups.find((item) => item.id === groupId)
        if (!group?.members.some((member) => member.id === memberId)) return false

        const remainingMemberIds = group.members
          .filter((member) => member.id !== memberId)
          .map((member) => member.id)

        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId
              ? {
                  ...group,
                  members: group.members.filter((member) => member.id !== memberId),
                }
              : group
          ),
          expenses: state.expenses.map((expense) => {
            if (expense.groupId !== groupId) return expense

            return rebalanceExpenseAfterMemberRemoval(
              expense,
              remainingMemberIds,
              memberId
            )
          }),
        }))

        return true
      },
      addExpense: (input) => {
        const expenseId = createId("expense")
        const payments = input.payments.filter((payment) => payment.amountCents > 0)
        const expense: Expense = {
          id: expenseId,
          groupId: input.groupId,
          amountCents: input.amountCents,
          payments,
          paidBy: payments[0]?.userId ?? "",
          splitType: input.splitType,
          participants: input.participants,
          initialBillsEnabled: input.initialBillsEnabled,
          initialBills: input.initialBills.filter((bill) => bill.amountCents > 0),
          participantShares: input.participantShares,
          note: input.note.trim(),
          createdAt: new Date().toISOString(),
        }

        set((state) => ({ expenses: [expense, ...state.expenses] }))
        return expenseId
      },
      resetAll: () =>
        set({
          currentUser: defaultCurrentUser,
          groups: [],
          expenses: [],
        }),
      getGroupExpenses: (groupId) =>
        get()
          .expenses.filter((expense) => expense.groupId === groupId)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
      getGroupBalances: (groupId) => {
        const group = get().groups.find((item) => item.id === groupId)
        if (!group) return []

        return calculateGroupBalances(group, get().getGroupExpenses(groupId))
      },
      getGroupSettlements: (groupId) =>
        optimizeSettlements(get().getGroupBalances(groupId)),
      getDashboardSummary: () => {
        const state = get()
        let owedCents = 0
        let oweCents = 0
        const individualsOwed = new Set<string>()
        const individualsOwe = new Set<string>()
        let groupsWithBalance = 0

        for (const group of state.groups) {
          const balance =
            state
              .getGroupBalances(group.id)
              .find((item) => item.userId === state.currentUser.id)
              ?.balanceCents ?? 0

          if (balance > 0) {
            owedCents += balance
            groupsWithBalance += 1
          }

          if (balance < 0) {
            oweCents += Math.abs(balance)
            groupsWithBalance += 1
          }

          for (const settlement of state.getGroupSettlements(group.id)) {
            if (settlement.toId === state.currentUser.id) {
              individualsOwed.add(settlement.fromId)
            }
            if (settlement.fromId === state.currentUser.id) {
              individualsOwe.add(settlement.toId)
            }
          }
        }

        return {
          owedCents,
          oweCents,
          groupsWithBalance,
          individualsOwed: individualsOwed.size,
          individualsOwe: individualsOwe.size,
        }
      },
    }),
    {
      name: "splitly-store",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        currentUser: state.currentUser,
        groups: state.groups,
        expenses: state.expenses,
      }),
    }
  )
)
