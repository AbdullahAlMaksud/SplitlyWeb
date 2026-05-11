import {
  getExpenseInitialBills,
  getExpensePayments,
} from "@/lib/calculations/settlement"
import { DEFAULT_CURRENCY } from "@/lib/currency"
import { formatCurrency, formatDate, memberName } from "@/lib/formatters"
import type {
  Balance,
  CurrencyCode,
  Expense,
  Group,
  SettlementTransaction,
} from "@/lib/types"

type StatementLanguage = "bn" | "en"

type StatementImageInput = {
  group: Group
  expenses: Expense[]
  balances: Balance[]
  settlement: SettlementTransaction
  language?: string
  currency?: CurrencyCode
  createdAt?: Date | string
}

type StatementCopy = {
  title: string
  created: string
  paysTo: (from: string, to: string) => string
  receives: (to: string, amount: string) => string
  totalSpent: string
  split: string
  paid: (name: string) => string
  share: (name: string) => string
  nowPays: string
  equal: string
  percentage: string
  custom: string
  mixed: string
  personalBills: string
  noExpenses: string
  generated: string
}

const statementCopy: Record<StatementLanguage, StatementCopy> = {
  en: {
    title: "Settlement statement",
    created: "Created",
    paysTo: (from, to) => `${from} pays ${to}`,
    receives: (to, amount) => `${to} receives ${amount}`,
    totalSpent: "Total spent",
    split: "Split",
    paid: (name) => `${name} paid`,
    share: (name) => `${name} share`,
    nowPays: "Now pays",
    equal: "Equal",
    percentage: "Percentage",
    custom: "Custom",
    mixed: "Mixed",
    personalBills: "personal bills",
    noExpenses: "No expenses",
    generated: "Generated locally by Splitly",
  },
  bn: {
    title: "সেটেলমেন্ট স্টেটমেন্ট",
    created: "তৈরি",
    paysTo: (from, to) => `${from} ${to}-কে দেবে`,
    receives: (to, amount) => `${to} পাবে ${amount}`,
    totalSpent: "মোট খরচ",
    split: "ভাগ",
    paid: (name) => `${name} দিয়েছে`,
    share: (name) => `${name}-এর ভাগ`,
    nowPays: "এখন দেবে",
    equal: "সমান",
    percentage: "শতকরা",
    custom: "কাস্টম",
    mixed: "মিশ্র",
    personalBills: "ব্যক্তিগত বিলসহ",
    noExpenses: "খরচ নেই",
    generated: "Splitly থেকে তৈরি",
  },
}

function resolveLanguage(language?: string): StatementLanguage {
  return language?.startsWith("en") ? "en" : "bn"
}

function describeSplit(expenses: Expense[], language: StatementLanguage) {
  const copy = statementCopy[language]
  const splitTypes = new Set(expenses.map((expense) => expense.splitType))
  const hasPersonalBills = expenses.some(
    (expense) =>
      expense.initialBillsEnabled && getExpenseInitialBills(expense).length > 0
  )

  if (expenses.length === 0) return copy.noExpenses

  let splitLabel = copy.mixed
  if (splitTypes.size === 1) {
    const splitType = splitTypes.values().next().value
    if (splitType === "equal") splitLabel = copy.equal
    if (splitType === "percentage") splitLabel = copy.percentage
    if (splitType === "custom") splitLabel = copy.custom
  }

  return hasPersonalBills
    ? `${splitLabel} · ${copy.personalBills}`
    : splitLabel
}

function totalPaidBy(expenses: Expense[], userId: string) {
  return expenses.reduce(
    (total, expense) =>
      total +
      getExpensePayments(expense)
        .filter((payment) => payment.userId === userId)
        .reduce((paymentTotal, payment) => paymentTotal + payment.amountCents, 0),
    0
  )
}

function safeFilename(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")

  return slug || "splitly-statement"
}

export function buildStatementImageData(input: StatementImageInput) {
  const language = resolveLanguage(input.language)
  const currency = input.currency ?? DEFAULT_CURRENCY
  const copy = statementCopy[language]
  const fromName = memberName(input.group.members, input.settlement.fromId)
  const toName = memberName(input.group.members, input.settlement.toId)
  const createdAt =
    input.createdAt instanceof Date
      ? input.createdAt.toISOString()
      : (input.createdAt ?? new Date().toISOString())
  const totalExpenseCents = input.expenses.reduce(
    (total, expense) => total + expense.amountCents,
    0
  )
  const payerPaidCents = totalPaidBy(input.expenses, input.settlement.fromId)
  const payerBalanceCents =
    input.balances.find((balance) => balance.userId === input.settlement.fromId)
      ?.balanceCents ?? 0
  const payerShareCents = Math.max(0, payerPaidCents - payerBalanceCents)
  const amountLabel = formatCurrency(
    input.settlement.amountCents,
    language,
    currency
  )

  return {
    amountLabel,
    copy,
    createdLabel: `${copy.created}: ${formatDate(createdAt, language)}`,
    filename: `${safeFilename(input.group.name)}-${safeFilename(
      fromName
    )}-to-${safeFilename(toName)}.png`,
    fromName,
    groupName: input.group.name,
    language,
    receiveLabel: copy.receives(toName, amountLabel),
    toName,
    transferLabel: copy.paysTo(fromName, toName),
    stats: [
      {
        label: copy.totalSpent,
        value: formatCurrency(totalExpenseCents, language, currency),
      },
      {
        label: copy.split,
        value: describeSplit(input.expenses, language),
      },
      {
        label: copy.paid(fromName),
        value: formatCurrency(payerPaidCents, language, currency),
      },
      {
        label: copy.share(fromName),
        value: formatCurrency(payerShareCents, language, currency),
      },
    ],
  }
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = Math.min(radius, width / 2, height / 2)

  context.beginPath()
  context.moveTo(x + safeRadius, y)
  context.lineTo(x + width - safeRadius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius)
  context.lineTo(x + width, y + height - safeRadius)
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - safeRadius,
    y + height
  )
  context.lineTo(x + safeRadius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius)
  context.lineTo(x, y + safeRadius)
  context.quadraticCurveTo(x, y, x + safeRadius, y)
  context.closePath()
}

function fillRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string | CanvasGradient
) {
  roundedRect(context, x, y, width, height, radius)
  context.fillStyle = fillStyle
  context.fill()
}

function strokeRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  strokeStyle: string,
  lineWidth = 1
) {
  roundedRect(context, x, y, width, height, radius)
  context.strokeStyle = strokeStyle
  context.lineWidth = lineWidth
  context.stroke()
}

function setFont(
  context: CanvasRenderingContext2D,
  size: number,
  weight: number,
  language: StatementLanguage
) {
  const family =
    language === "bn"
      ? '"Noto Sans Bengali", "Hind Siliguri", "SolaimanLipi", Arial, sans-serif'
      : '"Geist", Inter, Arial, sans-serif'

  context.font = `${weight} ${size}px ${family}`
}

function drawFittedText({
  context,
  text,
  x,
  y,
  maxWidth,
  size,
  minSize = 22,
  weight = 600,
  color,
  language,
  align = "left",
}: {
  context: CanvasRenderingContext2D
  text: string
  x: number
  y: number
  maxWidth: number
  size: number
  minSize?: number
  weight?: number
  color: string
  language: StatementLanguage
  align?: CanvasTextAlign
}) {
  let nextSize = size
  context.textAlign = align
  context.textBaseline = "alphabetic"
  context.fillStyle = color
  setFont(context, nextSize, weight, language)

  while (context.measureText(text).width > maxWidth && nextSize > minSize) {
    nextSize -= 2
    setFont(context, nextSize, weight, language)
  }

  context.fillText(text, x, y)
}

function drawStatCard({
  context,
  label,
  value,
  x,
  y,
  width,
  language,
}: {
  context: CanvasRenderingContext2D
  label: string
  value: string
  x: number
  y: number
  width: number
  language: StatementLanguage
}) {
  fillRoundedRect(context, x, y, width, 150, 28, "rgba(255,255,255,0.72)")
  strokeRoundedRect(context, x, y, width, 150, 28, "rgba(6,95,70,0.12)", 2)
  drawFittedText({
    context,
    text: label,
    x: x + 28,
    y: y + 48,
    maxWidth: width - 56,
    size: 26,
    minSize: 18,
    weight: 500,
    color: "rgba(15, 80, 63, 0.72)",
    language,
  })
  drawFittedText({
    context,
    text: value,
    x: x + 28,
    y: y + 102,
    maxWidth: width - 56,
    size: 38,
    minSize: 22,
    weight: 700,
    color: "rgb(15, 55, 45)",
    language,
  })
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function downloadSettlementStatementImage(
  input: StatementImageInput
) {
  const data = buildStatementImageData(input)
  const width = 1080
  const height = 1350
  const scale = 2
  const canvas = document.createElement("canvas")
  canvas.width = width * scale
  canvas.height = height * scale

  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas is not available.")

  context.scale(scale, scale)

  const background = context.createLinearGradient(0, 0, width, height)
  background.addColorStop(0, "rgb(255,255,255)")
  background.addColorStop(0.52, "rgb(247,255,250)")
  background.addColorStop(1, "rgb(231,248,240)")
  context.fillStyle = background
  context.fillRect(0, 0, width, height)

  context.save()
  context.shadowColor = "rgba(6,78,59,0.16)"
  context.shadowBlur = 48
  context.shadowOffsetY = 22
  fillRoundedRect(context, 64, 64, 952, 1222, 48, "rgba(255,255,255,0.78)")
  context.restore()
  strokeRoundedRect(context, 64, 64, 952, 1222, 48, "rgba(6,95,70,0.16)", 2)

  fillRoundedRect(context, 104, 104, 76, 76, 22, "rgb(6,95,70)")
  drawFittedText({
    context,
    text: "S",
    x: 142,
    y: 158,
    maxWidth: 52,
    size: 44,
    minSize: 36,
    weight: 800,
    color: "rgb(255,255,255)",
    language: "en",
    align: "center",
  })
  drawFittedText({
    context,
    text: "Splitly",
    x: 204,
    y: 132,
    maxWidth: 440,
    size: 42,
    minSize: 30,
    weight: 750,
    color: "rgb(12, 55, 45)",
    language: "en",
  })
  drawFittedText({
    context,
    text: data.copy.title,
    x: 204,
    y: 168,
    maxWidth: 430,
    size: 25,
    minSize: 18,
    weight: 500,
    color: "rgba(15, 80, 63, 0.68)",
    language: data.language,
  })
  drawFittedText({
    context,
    text: data.createdLabel,
    x: 976,
    y: 148,
    maxWidth: 330,
    size: 24,
    minSize: 17,
    weight: 500,
    color: "rgba(15, 80, 63, 0.72)",
    language: data.language,
    align: "right",
  })

  fillRoundedRect(context, 104, 222, 872, 78, 28, "rgba(236,253,245,0.8)")
  drawFittedText({
    context,
    text: data.groupName,
    x: 136,
    y: 272,
    maxWidth: 808,
    size: 34,
    minSize: 22,
    weight: 650,
    color: "rgb(15, 65, 52)",
    language: data.language,
  })

  const transferGradient = context.createLinearGradient(104, 338, 976, 638)
  transferGradient.addColorStop(0, "rgb(3, 84, 68)")
  transferGradient.addColorStop(1, "rgb(13, 120, 92)")
  fillRoundedRect(context, 104, 338, 872, 328, 42, transferGradient)
  drawFittedText({
    context,
    text: data.transferLabel,
    x: 152,
    y: 418,
    maxWidth: 776,
    size: 44,
    minSize: 26,
    weight: 700,
    color: "rgb(236,253,245)",
    language: data.language,
  })
  drawFittedText({
    context,
    text: data.amountLabel,
    x: 152,
    y: 535,
    maxWidth: 776,
    size: 90,
    minSize: 48,
    weight: 800,
    color: "rgb(255,255,255)",
    language: data.language,
  })
  drawFittedText({
    context,
    text: data.receiveLabel,
    x: 152,
    y: 610,
    maxWidth: 776,
    size: 30,
    minSize: 20,
    weight: 500,
    color: "rgba(236,253,245,0.82)",
    language: data.language,
  })
  fillRoundedRect(context, 790, 578, 138, 44, 22, "rgba(255,255,255,0.14)")
  drawFittedText({
    context,
    text: data.copy.nowPays,
    x: 859,
    y: 607,
    maxWidth: 110,
    size: 20,
    minSize: 14,
    weight: 600,
    color: "rgba(236,253,245,0.9)",
    language: data.language,
    align: "center",
  })

  const statWidth = 420
  data.stats.forEach((stat, index) => {
    drawStatCard({
      context,
      label: stat.label,
      value: stat.value,
      x: index % 2 === 0 ? 104 : 556,
      y: index < 2 ? 720 : 902,
      width: statWidth,
      language: data.language,
    })
  })

  context.strokeStyle = "rgba(6,95,70,0.14)"
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(104, 1124)
  context.lineTo(976, 1124)
  context.stroke()
  drawFittedText({
    context,
    text: data.copy.generated,
    x: 104,
    y: 1186,
    maxWidth: 620,
    size: 26,
    minSize: 18,
    weight: 500,
    color: "rgba(15,80,63,0.72)",
    language: data.language,
  })
  drawFittedText({
    context,
    text: "splitly.local",
    x: 976,
    y: 1186,
    maxWidth: 220,
    size: 26,
    minSize: 18,
    weight: 650,
    color: "rgb(15,65,52)",
    language: "en",
    align: "right",
  })

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((nextBlob) => {
      if (nextBlob) resolve(nextBlob)
      else reject(new Error("Could not create statement image."))
    }, "image/png")
  })

  downloadBlob(blob, data.filename)
}
