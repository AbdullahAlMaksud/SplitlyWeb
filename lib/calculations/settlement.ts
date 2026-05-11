import type {
  Balance,
  Expense,
  ExpensePayment,
  ExpenseShare,
  Group,
  SettlementTransaction,
} from "@/lib/types"

const CENTS_PER_CURRENCY_UNIT = 100

export function roundCentsToCurrencyUnit(cents: number) {
  const sign = cents < 0 ? -1 : 1

  return sign * Math.round(Math.abs(cents) / CENTS_PER_CURRENCY_UNIT) * CENTS_PER_CURRENCY_UNIT
}

function normalizePayments(expense: Expense): ExpensePayment[] {
  const payments =
    expense.payments && expense.payments.length > 0
      ? expense.payments
      : [{ userId: expense.paidBy, amountCents: expense.amountCents }]

  return payments
    .map((payment) => ({
      ...payment,
      amountCents: roundCentsToCurrencyUnit(payment.amountCents),
    }))
    .filter((payment) => payment.amountCents > 0)
}

function normalizeInitialBills(expense: Expense): ExpensePayment[] {
  if (!expense.initialBillsEnabled) return []

  return (expense.initialBills ?? [])
    .map((bill) => ({
      ...bill,
      amountCents: roundCentsToCurrencyUnit(bill.amountCents),
    }))
    .filter((bill) => bill.amountCents > 0)
}

function splitEqual(amountCents: number, participants: string[]) {
  const shares = new Map<string, number>()
  const roundedAmountCents = roundCentsToCurrencyUnit(amountCents)
  if (participants.length === 0 || roundedAmountCents <= 0) return shares

  const amountUnits = Math.round(roundedAmountCents / CENTS_PER_CURRENCY_UNIT)
  const baseShareUnits = Math.floor(amountUnits / participants.length)
  const remainderUnits = amountUnits % participants.length

  participants.forEach((participantId, index) => {
    shares.set(
      participantId,
      (baseShareUnits + (index < remainderUnits ? 1 : 0)) *
        CENTS_PER_CURRENCY_UNIT
    )
  })

  return shares
}

function splitPercentage(
  amountCents: number,
  participants: string[],
  percentages: ExpenseShare[] = []
) {
  const percentByUser = new Map(
    percentages.map((share) => [
      share.userId,
      Math.max(0, share.percentage ?? 0),
    ])
  )
  const totalPercent = participants.reduce(
    (total, participantId) => total + (percentByUser.get(participantId) ?? 0),
    0
  )

  const roundedAmountCents = roundCentsToCurrencyUnit(amountCents)
  if (roundedAmountCents <= 0 || participants.length === 0)
    return new Map<string, number>()
  if (Math.abs(totalPercent - 100) > 0.01) return splitEqual(amountCents, participants)

  const amountUnits = Math.round(roundedAmountCents / CENTS_PER_CURRENCY_UNIT)
  const rawShares = participants.map((participantId) => {
    const raw = (amountUnits * (percentByUser.get(participantId) ?? 0)) / 100
    return {
      userId: participantId,
      amountUnits: Math.floor(raw),
      remainder: raw - Math.floor(raw),
    }
  })

  let remainingCents =
    amountUnits - rawShares.reduce((total, share) => total + share.amountUnits, 0)

  rawShares
    .sort((a, b) => b.remainder - a.remainder)
    .forEach((share) => {
      if (remainingCents <= 0) return
      share.amountUnits += 1
      remainingCents -= 1
    })

  return new Map(
    rawShares.map((share) => [
      share.userId,
      share.amountUnits * CENTS_PER_CURRENCY_UNIT,
    ])
  )
}

function normalizeFixedShares(
  amountCents: number,
  participants: string[],
  shares: ExpenseShare[] = []
) {
  const roundedAmountCents = roundCentsToCurrencyUnit(amountCents)
  if (participants.length === 0 || roundedAmountCents <= 0) return []

  const amountByUser = new Map(
    shares.map((share) => [
      share.userId,
      Math.max(0, roundCentsToCurrencyUnit(share.amountCents ?? 0)),
    ])
  )
  const rawTotal = participants.reduce(
    (total, participantId) => total + (amountByUser.get(participantId) ?? 0),
    0
  )

  if (rawTotal <= 0) return distributeCents(roundedAmountCents, participants)

  const amountUnits = Math.round(roundedAmountCents / CENTS_PER_CURRENCY_UNIT)
  const rawShares = participants.map((participantId) => {
    const raw = ((amountByUser.get(participantId) ?? 0) / rawTotal) * amountUnits
    return {
      userId: participantId,
      amountUnits: Math.floor(raw),
      remainder: raw - Math.floor(raw),
    }
  })

  let remainingCents =
    amountUnits - rawShares.reduce((total, share) => total + share.amountUnits, 0)

  rawShares
    .sort((a, b) => b.remainder - a.remainder)
    .forEach((share) => {
      if (remainingCents <= 0) return
      share.amountUnits += 1
      remainingCents -= 1
    })

  return rawShares.map(({ userId, amountUnits }) => ({
    userId,
    amountCents: amountUnits * CENTS_PER_CURRENCY_UNIT,
  }))
}

function splitFixedAmount(
  amountCents: number,
  participants: string[],
  shares: ExpenseShare[] = []
) {
  return new Map(
    normalizeFixedShares(amountCents, participants, shares).map((share) => [
      share.userId,
      share.amountCents,
    ])
  )
}

function distributeCents(amountCents: number, userIds: string[]) {
  const roundedAmountCents = roundCentsToCurrencyUnit(amountCents)
  if (roundedAmountCents <= 0 || userIds.length === 0) return []

  const amountUnits = Math.round(roundedAmountCents / CENTS_PER_CURRENCY_UNIT)
  const baseAmountUnits = Math.floor(amountUnits / userIds.length)
  const remainderUnits = amountUnits % userIds.length

  return userIds
    .map((userId, index) => ({
      userId,
      amountCents:
        (baseAmountUnits + (index < remainderUnits ? 1 : 0)) *
        CENTS_PER_CURRENCY_UNIT,
    }))
    .filter((payment) => payment.amountCents > 0)
}

function mergePayments(payments: ExpensePayment[]) {
  const order: string[] = []
  const totals = new Map<string, number>()

  for (const payment of payments) {
    if (payment.amountCents <= 0) continue
    if (!totals.has(payment.userId)) order.push(payment.userId)
    totals.set(payment.userId, (totals.get(payment.userId) ?? 0) + payment.amountCents)
  }

  return order
    .map((userId) => ({ userId, amountCents: totals.get(userId) ?? 0 }))
    .filter((payment) => payment.amountCents > 0)
}

function normalizePaymentTotal(
  amountCents: number,
  payments: ExpensePayment[],
  fallbackPayers: string[]
) {
  const targetAmount = Math.max(0, roundCentsToCurrencyUnit(amountCents))
  const nextPayments = mergePayments(payments)
  const paidTotal = nextPayments.reduce(
    (total, payment) => total + payment.amountCents,
    0
  )

  if (paidTotal < targetAmount) {
    return mergePayments([
      ...nextPayments,
      ...distributeCents(targetAmount - paidTotal, fallbackPayers),
    ])
  }

  if (paidTotal > targetAmount) {
    let overage = paidTotal - targetAmount
    const trimmed = nextPayments.map((payment) => ({ ...payment }))

    for (let index = trimmed.length - 1; index >= 0 && overage > 0; index -= 1) {
      const reduction = Math.min(trimmed[index].amountCents, overage)
      trimmed[index].amountCents -= reduction
      overage -= reduction
    }

    return trimmed.filter((payment) => payment.amountCents > 0)
  }

  return nextPayments
}

function normalizePercentageShares(
  participants: string[],
  shares: ExpenseShare[] = []
) {
  if (participants.length === 0) return []

  const shareByUser = new Map(
    shares.map((share) => [
      share.userId,
      Math.max(0, share.percentage ?? 0),
    ])
  )
  const totalPercentage = participants.reduce(
    (total, participantId) => total + (shareByUser.get(participantId) ?? 0),
    0
  )

  if (totalPercentage <= 0) {
    const base = Math.floor((100 / participants.length) * 100) / 100
    let used = 0

    return participants.map((participantId, index) => {
      const percentage =
        index === participants.length - 1
          ? Math.round((100 - used) * 100) / 100
          : base
      used += percentage

      return { userId: participantId, percentage }
    })
  }

  let used = 0

  return participants.map((participantId, index) => {
    const rawPercentage =
      ((shareByUser.get(participantId) ?? 0) / totalPercentage) * 100
    const percentage =
      index === participants.length - 1
        ? Math.round((100 - used) * 100) / 100
        : Math.round(rawPercentage * 100) / 100
    used += percentage

    return { userId: participantId, percentage }
  })
}

export function getExpensePayments(expense: Expense) {
  return normalizePayments(expense)
}

export function getExpenseInitialBills(expense: Expense) {
  return normalizeInitialBills(expense)
}

export function getExpenseSharedAmountCents(expense: Expense) {
  const initialTotal = normalizeInitialBills(expense).reduce(
    (total, bill) => total + bill.amountCents,
    0
  )

  return Math.max(0, roundCentsToCurrencyUnit(expense.amountCents) - initialTotal)
}

export function rebalanceExpenseAfterMemberRemoval(
  expense: Expense,
  remainingMemberIds: string[],
  removedMemberId: string
) {
  const remainingIds = [...new Set(remainingMemberIds)]
  const remainingIdSet = new Set(remainingIds)
  const participants = [
    ...new Set(
      expense.participants.filter(
        (participantId) =>
          participantId !== removedMemberId && remainingIdSet.has(participantId)
      )
    ),
  ]
  const nextParticipants = participants.length > 0 ? participants : remainingIds
  const participantSet = new Set(nextParticipants)
  const fallbackPayers = nextParticipants.length > 0 ? nextParticipants : remainingIds
  const roundedExpenseAmountCents = roundCentsToCurrencyUnit(expense.amountCents)
  const payments = normalizePaymentTotal(
    roundedExpenseAmountCents,
    normalizePayments(expense).filter(
      (payment) =>
        payment.userId !== removedMemberId && remainingIdSet.has(payment.userId)
    ),
    fallbackPayers
  )
  const initialBills = (expense.initialBills ?? []).filter(
    (bill) =>
      bill.userId !== removedMemberId &&
      participantSet.has(bill.userId) &&
      bill.amountCents > 0
  )

  return {
    ...expense,
    paidBy: payments[0]?.userId ?? fallbackPayers[0] ?? "",
    payments,
    participants: nextParticipants,
    initialBills,
    participantShares:
      expense.splitType === "percentage"
        ? normalizePercentageShares(nextParticipants, expense.participantShares)
        : expense.splitType === "custom"
          ? normalizeFixedShares(
              roundedExpenseAmountCents,
              nextParticipants,
              expense.participantShares
            )
          : [],
  }
}

export function calculateGroupBalances(group: Group, expenses: Expense[]) {
  const balances = new Map<string, number>()

  for (const member of group.members) {
    balances.set(member.id, 0)
  }

  for (const expense of expenses) {
    if (expense.groupId !== group.id) continue

    const participants = expense.participants.filter((participantId) =>
      balances.has(participantId)
    )

    const expenseAmountCents = roundCentsToCurrencyUnit(expense.amountCents)

    if (participants.length === 0 || expenseAmountCents <= 0) continue

    for (const payment of normalizePaymentTotal(
      expenseAmountCents,
      normalizePayments(expense),
      participants
    )) {
      if (!balances.has(payment.userId)) continue
      balances.set(
        payment.userId,
        (balances.get(payment.userId) ?? 0) + payment.amountCents
      )
    }

    const owedByUser = new Map<string, number>()
    const initialBills = normalizeInitialBills(expense)
    const initialTotal = initialBills.reduce(
      (total, bill) => total + bill.amountCents,
      0
    )
    const sharedAmountCents = Math.max(0, expenseAmountCents - initialTotal)

    for (const bill of initialBills) {
      if (!participants.includes(bill.userId)) continue
      owedByUser.set(bill.userId, (owedByUser.get(bill.userId) ?? 0) + bill.amountCents)
    }

    const sharedShares =
      expense.splitType === "percentage"
        ? splitPercentage(sharedAmountCents, participants, expense.participantShares)
        : expense.splitType === "custom"
          ? splitFixedAmount(sharedAmountCents, participants, expense.participantShares)
          : splitEqual(sharedAmountCents, participants)

    for (const [participantId, amountCents] of sharedShares) {
      owedByUser.set(
        participantId,
        (owedByUser.get(participantId) ?? 0) + amountCents
      )
    }

    for (const [participantId, amountCents] of owedByUser) {
      balances.set(participantId, (balances.get(participantId) ?? 0) - amountCents)
    }
  }

  return Array.from(balances.entries()).map(([userId, balanceCents]) => ({
    userId,
    balanceCents,
  }))
}

export function optimizeSettlements(balances: Balance[]) {
  const debtors = balances
    .filter((balance) => balance.balanceCents < 0)
    .map((balance) => ({
      userId: balance.userId,
      amountCents: Math.abs(balance.balanceCents),
    }))
    .sort((a, b) => b.amountCents - a.amountCents)

  const creditors = balances
    .filter((balance) => balance.balanceCents > 0)
    .map((balance) => ({
      userId: balance.userId,
      amountCents: balance.balanceCents,
    }))
    .sort((a, b) => b.amountCents - a.amountCents)

  const transactions: SettlementTransaction[] = []
  let debtorIndex = 0
  let creditorIndex = 0

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex]
    const creditor = creditors[creditorIndex]
    const amountCents = Math.min(debtor.amountCents, creditor.amountCents)

    if (amountCents > 0) {
      transactions.push({
        fromId: debtor.userId,
        toId: creditor.userId,
        amountCents,
      })
    }

    debtor.amountCents -= amountCents
    creditor.amountCents -= amountCents

    if (debtor.amountCents === 0) debtorIndex += 1
    if (creditor.amountCents === 0) creditorIndex += 1
  }

  return transactions
}
