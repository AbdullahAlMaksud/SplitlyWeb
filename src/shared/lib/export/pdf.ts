import {
  getExpenseInitialBills,
  getExpensePayments,
  getExpenseSharedAmountCents,
} from "@/shared/lib/calculations/settlement";
import { DEFAULT_CURRENCY } from "@/shared/lib/currency";
import { formatCurrency, formatDate, memberName } from "@/shared/lib/formatters";
import type { CurrencyCode, Expense, Group, SettlementTransaction } from "@/shared/types";

type PdfReportInput = {
  group: Group;
  expenses: Expense[];
  settlements: SettlementTransaction[];
  currency?: CurrencyCode;
};

type Rgb = [number, number, number];

const ink: Rgb = [15, 23, 42];
const muted: Rgb = [100, 116, 139];
const line: Rgb = [203, 213, 225];
const paper: Rgb = [248, 250, 252];
const teal: Rgb = [13, 148, 136];
const sky: Rgb = [14, 165, 233];
const indigo: Rgb = [79, 70, 229];
const pdfFontName = "NotoSansBengali";

function arrayBufferToBinaryString(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return binary;
}

async function loadPdfFonts(doc: import("jspdf").jsPDF) {
  try {
    const [regular, bold] = await Promise.all([
      fetch("/fonts/NotoSansBengali-Regular.ttf").then((response) =>
        response.arrayBuffer(),
      ),
      fetch("/fonts/NotoSansBengali-Bold.ttf").then((response) =>
        response.arrayBuffer(),
      ),
    ]);

    doc.addFileToVFS(
      "NotoSansBengali-Regular.ttf",
      arrayBufferToBinaryString(regular),
    );
    doc.addFont("NotoSansBengali-Regular.ttf", pdfFontName, "normal");
    doc.addFileToVFS(
      "NotoSansBengali-Bold.ttf",
      arrayBufferToBinaryString(bold),
    );
    doc.addFont("NotoSansBengali-Bold.ttf", pdfFontName, "bold");

    return pdfFontName;
  } catch {
    return "helvetica";
  }
}

function voucherNumber(groupId: string) {
  return `SPL-${groupId.slice(-8).toUpperCase()}`;
}

function filenameFor(groupName: string) {
  return `${groupName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-splitly-voucher.pdf`;
}

export async function downloadPdfReport({
  group,
  expenses,
  settlements,
  currency = DEFAULT_CURRENCY,
}: PdfReportInput) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ putOnlyUsedFonts: true });
  const fontFamily = await loadPdfFonts(doc);
  const margin = 16;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  const setColor = (color: Rgb) =>
    doc.setTextColor(color[0], color[1], color[2]);
  const setFill = (color: Rgb) =>
    doc.setFillColor(color[0], color[1], color[2]);
  const setStroke = (color: Rgb) =>
    doc.setDrawColor(color[0], color[1], color[2]);

  const drawChrome = () => {
    setFill(paper);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    setFill(teal);
    doc.rect(0, 0, pageWidth, 4, "F");
    setStroke(line);
    doc.roundedRect(margin, 10, contentWidth, pageHeight - 20, 3, 3, "S");
  };

  const ensureSpace = (height = 14) => {
    if (y + height <= pageHeight - margin) return;
    doc.addPage();
    drawChrome();
    y = 18;
  };

  const text = (
    value: string,
    x: number,
    nextY: number,
    options: {
      size?: number;
      style?: "normal" | "bold";
      color?: Rgb;
      maxWidth?: number;
      align?: "left" | "center" | "right";
    } = {},
  ) => {
    const size = options.size ?? 10;
    doc.setFont(fontFamily, options.style ?? "normal");
    doc.setFontSize(size);
    setColor(options.color ?? ink);
    const lines = doc.splitTextToSize(value, options.maxWidth ?? contentWidth);
    doc.text(lines, x, nextY, { align: options.align ?? "left" });
    return Array.isArray(lines) ? lines.length * (size * 0.42) : size * 0.42;
  };

  const sectionTitle = (title: string) => {
    ensureSpace(18);
    y += 4;
    text(title.toUpperCase(), margin + 6, y, {
      size: 8,
      style: "bold",
      color: teal,
    });
    y += 4;
    setStroke(line);
    doc.line(margin + 6, y, pageWidth - margin - 6, y);
    y += 7;
  };

  const summaryBox = (
    x: number,
    width: number,
    label: string,
    value: string,
    accent: Rgb,
  ) => {
    setFill([255, 255, 255]);
    setStroke(line);
    doc.roundedRect(x, y, width, 22, 2, 2, "FD");
    setFill(accent);
    doc.roundedRect(x, y, 2.6, 22, 1, 1, "F");
    text(label, x + 6, y + 8, { size: 7.5, color: muted, style: "bold" });
    text(value, x + 6, y + 17, { size: 12, style: "bold", color: ink });
  };

  const table = (headers: string[], rows: string[][], widths: number[]) => {
    const drawHeader = () => {
      ensureSpace(11);
      setFill([226, 232, 240]);
      doc.roundedRect(margin + 6, y, contentWidth - 12, 9, 1.5, 1.5, "F");
      let x = margin + 8;
      headers.forEach((header, index) => {
        text(header, x, y + 6, {
          size: 7,
          style: "bold",
          color: [51, 65, 85],
          maxWidth: widths[index] - 2,
        });
        x += widths[index];
      });
      y += 10;
    };

    drawHeader();

    rows.forEach((row, rowIndex) => {
      const cellLines = row.map((cell, index) =>
        doc.splitTextToSize(cell, widths[index] - 3),
      );
      const maxLines = Math.max(...cellLines.map((lines) => lines.length), 1);
      const rowHeight = Math.max(9, maxLines * 4.2 + 4);

      if (y + rowHeight > pageHeight - margin) {
        doc.addPage();
        drawChrome();
        y = 18;
        drawHeader();
      }

      if (rowIndex % 2 === 0) {
        setFill([255, 255, 255]);
        doc.rect(margin + 6, y - 1, contentWidth - 12, rowHeight, "F");
      }

      let x = margin + 8;
      cellLines.forEach((lines, index) => {
        doc.setFont(fontFamily, index === 2 ? "bold" : "normal");
        doc.setFontSize(7.8);
        setColor(index === 2 ? ink : [51, 65, 85]);
        doc.text(lines, x, y + 5);
        x += widths[index];
      });
      y += rowHeight;
      setStroke([226, 232, 240]);
      doc.line(margin + 6, y - 1, pageWidth - margin - 6, y - 1);
    });

    y += 3;
  };

  const totalExpenses = expenses.reduce(
    (total, expense) => total + expense.amountCents,
    0,
  );
  const totalSettlement = settlements.reduce(
    (total, settlement) => total + settlement.amountCents,
    0,
  );
  const generatedAt = new Date().toISOString();

  doc.setProperties({
    title: `${group.name} Splitly Voucher`,
    subject: "Professional group settlement voucher",
    creator: "Splitly",
  });

  drawChrome();

  setFill(ink);
  doc.roundedRect(margin + 6, y, contentWidth - 12, 34, 3, 3, "F");
  setFill(teal);
  doc.roundedRect(margin + 6, y, 5, 34, 2, 2, "F");
  text("SPLITLY", margin + 14, y + 11, {
    size: 8,
    style: "bold",
    color: [153, 246, 228],
  });
  text("Settlement Voucher", margin + 14, y + 24, {
    size: 18,
    style: "bold",
    color: [255, 255, 255],
  });
  text(
    `Voucher No. ${voucherNumber(group.id)}`,
    pageWidth - margin - 12,
    y + 12,
    {
      size: 8,
      style: "bold",
      color: [226, 232, 240],
      align: "right",
    },
  );
  text(
    `Generated ${formatDate(generatedAt, "en")}`,
    pageWidth - margin - 12,
    y + 23,
    {
      size: 8,
      color: [203, 213, 225],
      align: "right",
    },
  );
  y += 44;

  const leftBoxWidth = contentWidth * 0.58;
  setFill([255, 255, 255]);
  setStroke(line);
  doc.roundedRect(margin + 6, y, leftBoxWidth, 32, 2, 2, "FD");
  text("GROUP", margin + 12, y + 9, { size: 7.5, style: "bold", color: muted });
  text(group.name, margin + 12, y + 21, {
    size: 14,
    style: "bold",
    maxWidth: leftBoxWidth - 12,
  });
  text(`Created ${formatDate(group.createdAt, "en")}`, margin + 12, y + 29, {
    size: 7.5,
    color: muted,
  });

  const rightX = margin + 10 + leftBoxWidth;
  const rightWidth = contentWidth - leftBoxWidth - 16;
  setFill([255, 255, 255]);
  setStroke(line);
  doc.roundedRect(rightX, y, rightWidth, 32, 2, 2, "FD");
  text("STATUS", rightX + 6, y + 9, { size: 7.5, style: "bold", color: muted });
  text(
    settlements.length > 0 ? "Action Required" : "Settled",
    rightX + 6,
    y + 21,
    {
      size: 13,
      style: "bold",
      color: settlements.length > 0 ? sky : teal,
    },
  );
  text(`${group.members.length} members`, rightX + 6, y + 29, {
    size: 7.5,
    color: muted,
  });
  y += 42;

  const boxGap = 4;
  const boxWidth = (contentWidth - 12 - boxGap * 2) / 3;
  summaryBox(
    margin + 6,
    boxWidth,
    "TOTAL EXPENSE",
    formatCurrency(totalExpenses, "en", currency),
    teal,
  );
  summaryBox(
    margin + 6 + boxWidth + boxGap,
    boxWidth,
    "EXPENSES",
    String(expenses.length),
    sky,
  );
  summaryBox(
    margin + 6 + (boxWidth + boxGap) * 2,
    boxWidth,
    "TO SETTLE",
    formatCurrency(totalSettlement, "en", currency),
    settlements.length > 0 ? indigo : teal,
  );
  y += 31;

  sectionTitle("Member Roster");
  const memberRows = group.members.map((member, index) => [
    String(index + 1).padStart(2, "0"),
    member.name,
  ]);
  table(
    ["No.", "Member"],
    memberRows.length > 0 ? memberRows : [["--", "No members"]],
    [18, contentWidth - 30],
  );

  sectionTitle("Expense Ledger");
  const expenseRows = expenses.map((expense) => {
    const payments = getExpensePayments(expense);
    const paidBy =
      payments.length === 1
        ? memberName(group.members, payments[0].userId)
        : payments
            .map(
              (payment) =>
                `${memberName(group.members, payment.userId)} ${formatCurrency(
                  payment.amountCents,
                  "en",
                  currency,
                )}`,
            )
            .join(", ");
    const splitNote =
      expense.initialBillsEnabled && getExpenseInitialBills(expense).length > 0
        ? `${expense.splitType}; shared ${formatCurrency(
            getExpenseSharedAmountCents(expense),
            "en",
            currency,
          )}`
        : expense.splitType;

    return [
      formatDate(expense.createdAt, "en"),
      expense.note.trim() || "Shared expense",
      formatCurrency(expense.amountCents, "en", currency),
      paidBy,
      splitNote,
    ];
  });
  table(
    ["Date", "Description", "Amount", "Paid By", "Split"],
    expenseRows.length > 0
      ? expenseRows
      : [
          [
            "--",
            "No expenses recorded",
            formatCurrency(0, "en", currency),
            "--",
            "--",
          ],
        ],
    [22, 40, 25, 51, 28],
  );

  sectionTitle("Settlement Instructions");
  const settlementRows = settlements.map((settlement) => [
    memberName(group.members, settlement.fromId),
    memberName(group.members, settlement.toId),
    formatCurrency(settlement.amountCents, "en", currency),
  ]);
  table(
    ["From", "To", "Amount"],
    settlementRows.length > 0
      ? settlementRows
      : [
          [
            "No settlement required",
            "Everyone is balanced",
            formatCurrency(0, "en", currency),
          ],
        ],
    [58, 58, 50],
  );

  ensureSpace(34);
  y += 4;
  setStroke(line);
  doc.line(margin + 8, y + 16, margin + 70, y + 16);
  doc.line(pageWidth - margin - 70, y + 16, pageWidth - margin - 8, y + 16);
  text("Prepared By", margin + 8, y + 23, { size: 7.5, color: muted });
  text("Received By", pageWidth - margin - 70, y + 23, {
    size: 7.5,
    color: muted,
  });

  text(
    "This voucher summarizes the local Splitly calculation. Confirm payments before marking the group settled.",
    pageWidth / 2,
    pageHeight - 11,
    { size: 7, color: muted, align: "center", maxWidth: contentWidth - 20 },
  );

  doc.save(filenameFor(group.name));
}
