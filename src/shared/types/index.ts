export type SplitType = "equal" | "custom" | "percentage"

export type CurrencyCode = "BDT" | "USD" | "EUR" | "GBP" | "INR"

export type GroupIcon = "wallet" | "plane" | "utensils" | "home" | "sparkles"

export type CurrentUserProfile = {
  id: string
  name: string
  avatar?: string
  color: string
  currency: CurrencyCode
}

export type Member = {
  id: string
  name: string
  avatar?: string
  color: string
}

export type Group = {
  id: string
  name: string
  icon: GroupIcon
  members: Member[]
  createdAt: string
}

export type Expense = {
  id: string
  groupId: string
  amountCents: number
  payments?: ExpensePayment[]
  paidBy: string
  splitType: SplitType
  participants: string[]
  initialBillsEnabled?: boolean
  initialBills?: ExpensePayment[]
  participantShares?: ExpenseShare[]
  note: string
  createdAt: string
}

export type ExpensePayment = {
  userId: string
  amountCents: number
}

export type ExpenseShare = {
  userId: string
  percentage?: number
  amountCents?: number
}

export type Balance = {
  userId: string
  balanceCents: number
}

export type SettlementTransaction = {
  fromId: string
  toId: string
  amountCents: number
}

export type DashboardSummary = {
  owedCents: number
  oweCents: number
  groupsWithBalance: number
  individualsOwed: number
  individualsOwe: number
}
