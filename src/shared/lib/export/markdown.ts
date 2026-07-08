import { remark } from "remark";
import remarkStringify from "remark-stringify";
import type {
  Content,
  Heading,
  List,
  ListItem,
  Paragraph,
  Root,
  Text,
} from "mdast";

import { getExpensePayments } from "@/shared/lib/calculations/settlement";
import { formatCurrency, formatDate, memberName } from "@/shared/lib/formatters";
import { DEFAULT_CURRENCY } from "@/shared/lib/currency";
import type { CurrencyCode, Expense, Group, SettlementTransaction } from "@/shared/types";

function text(value: string): Text {
  return { type: "text", value };
}

function paragraph(value: string): Paragraph {
  return { type: "paragraph", children: [text(value)] };
}

function heading(depth: Heading["depth"], value: string): Heading {
  return { type: "heading", depth, children: [text(value)] };
}

function listItem(value: string): ListItem {
  return { type: "listItem", children: [paragraph(value)] };
}

function list(values: string[]): List {
  return {
    type: "list",
    ordered: false,
    spread: false,
    children: values.map(listItem),
  };
}

export function generateMarkdownReport({
  group,
  expenses,
  settlements,
  currency = DEFAULT_CURRENCY,
}: {
  group: Group;
  expenses: Expense[];
  settlements: SettlementTransaction[];
  currency?: CurrencyCode;
}) {
  const members = group.members;
  const nodes: Content[] = [
    heading(1, "Bonton Group Report"),
    heading(2, "Group Information"),
    list([
      `Group Name: ${group.name}`,
      `Created At: ${formatDate(group.createdAt, "en")}`,
    ]),
    heading(2, "Members"),
    list(
      members.length > 0
        ? members.map((member) => member.name)
        : ["No members"],
    ),
    heading(2, "Expenses"),
    list(
      expenses.length > 0
        ? expenses.map((expense) => {
            const label = expense.note.trim() || "Expense";
            const payments = getExpensePayments(expense);
            const paidBy =
              payments.length === 1
                ? memberName(members, payments[0].userId)
                : payments
                    .map(
                      (payment) =>
                        `${memberName(members, payment.userId)} ${formatCurrency(
                          payment.amountCents,
                          "en",
                          currency,
                        )}`,
                    )
                    .join(", ");
            return `${label}: ${formatCurrency(expense.amountCents, "en", currency)} (paid by ${paidBy})`;
          })
        : ["No expenses recorded"],
    ),
    heading(2, "Settlement Summary"),
    list(
      settlements.length > 0
        ? settlements.map(
            (settlement) =>
              `${memberName(members, settlement.fromId)} pays ${memberName(
                members,
                settlement.toId,
              )} ${formatCurrency(settlement.amountCents, "en", currency)}`,
          )
        : ["No settlements needed"],
    ),
  ];

  const tree: Root = { type: "root", children: nodes };

  return remark()
    .use(remarkStringify, {
      bullet: "-",
      fences: true,
      listItemIndent: "one",
    })
    .stringify(tree);
}
