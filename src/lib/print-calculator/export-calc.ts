import { jsPDF } from "jspdf";
import type { BRDCostParams, BRDCostResult, WearAllocationItem } from "./cost";

function fmt(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function escapeCsvCell(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export interface ExportOptions {
  currency: string;
  fileName?: string;
  /** Job/product name for invoice title */
  jobName?: string;
}

/** Build CSV content (header + one data row) */
export function buildCalculationCSV(
  params: BRDCostParams,
  result: BRDCostResult,
  options: ExportOptions
): string {
  const { currency } = options;
  const rows: string[][] = [
    [
      "Weight (g)",
      "Print time (hrs)",
      "Material cost",
      "Machine cost",
      "Electricity cost",
      "Total wear cost",
      "Labor cost",
      "Subtotal",
      "Risk buffer",
      "Adjusted subtotal",
      "Profit",
      "Final price",
      "Cost per gram",
      "Hourly revenue",
      "Margin %",
    ],
    [
      String(params.weightG),
      String(params.printTimeHours),
      `${fmt(result.materialCost)} ${currency}`,
      `${fmt(result.machineCost)} ${currency}`,
      `${fmt(result.electricityCost)} ${currency}`,
      `${fmt(result.totalWearCost)} ${currency}`,
      `${fmt(result.laborCost)} ${currency}`,
      `${fmt(result.subtotal)} ${currency}`,
      `${fmt(result.riskBuffer)} ${currency}`,
      `${fmt(result.adjustedSubtotal)} ${currency}`,
      `${fmt(result.profitValue)} ${currency}`,
      `${fmt(result.finalPrice)} ${currency}`,
      `${fmt(result.costPerGram)} ${currency}/g`,
      `${fmt(result.hourlyRevenue)} ${currency}/hr`,
      `${result.marginPercent.toFixed(1)}%`,
    ],
  ];
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
}

/** Trigger download of CSV file */
export function downloadCalculationCSV(
  params: BRDCostParams,
  result: BRDCostResult,
  options: ExportOptions
): void {
  const csv = buildCalculationCSV(params, result, options);
  const name = options.fileName?.replace(/\.[^.]+$/, "") || "print-calculation";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Build invoice-style HTML for print or save as PDF via browser */
export function buildInvoiceHTML(
  params: BRDCostParams,
  result: BRDCostResult,
  options: ExportOptions
): string {
  const { currency, jobName } = options;
  const title = jobName || "Print job estimate";
  const wearRows =
    result.wearAllocations.length > 0
      ? result.wearAllocations
          .map(
            (w: WearAllocationItem) =>
              `<tr><td>Wear: ${escapeHtml(w.name)}</td><td>${fmt(w.allocatedCost)} ${currency}</td></tr>`
          )
          .join("") +
        `<tr><td><strong>Total wear</strong></td><td>${fmt(result.totalWearCost)} ${currency}</td></tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 560px; margin: 24px auto; padding: 0 16px; }
    h1 { font-size: 1.25rem; margin-bottom: 8px; }
    .meta { color: #666; font-size: 0.875rem; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; }
    th { font-weight: 600; }
    .total-row { font-weight: 600; font-size: 1.05rem; }
    .foot { margin-top: 24px; font-size: 0.875rem; color: #666; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">${new Date().toLocaleString()} · ${params.weightG} g · ${params.printTimeHours.toFixed(2)} hrs</p>
  <table>
    <tr><th>Item</th><th>Amount</th></tr>
    <tr><td>Material cost</td><td>${fmt(result.materialCost)} ${currency}</td></tr>
    <tr><td>Machine cost</td><td>${fmt(result.machineCost)} ${currency}</td></tr>
    <tr><td>Electricity cost</td><td>${fmt(result.electricityCost)} ${currency}</td></tr>
    ${wearRows}
    <tr><td>Labor cost</td><td>${fmt(result.laborCost)} ${currency}</td></tr>
    <tr><td>Subtotal</td><td>${fmt(result.subtotal)} ${currency}</td></tr>
    <tr><td>Risk buffer</td><td>${fmt(result.riskBuffer)} ${currency}</td></tr>
    <tr><td>Adjusted subtotal</td><td>${fmt(result.adjustedSubtotal)} ${currency}</td></tr>
    <tr><td>Profit</td><td>${fmt(result.profitValue)} ${currency}</td></tr>
    <tr class="total-row"><td>Final price</td><td>${fmt(result.finalPrice)} ${currency}</td></tr>
  </table>
  <p class="foot">Cost per gram: ${fmt(result.costPerGram)} ${currency}/g · Hourly revenue: ${fmt(result.hourlyRevenue)} ${currency}/hr · Margin: ${result.marginPercent.toFixed(1)}%</p>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Open invoice HTML in new window for print (e.g. Save as PDF) */
export function printInvoice(
  params: BRDCostParams,
  result: BRDCostResult,
  options: ExportOptions
): void {
  const html = buildInvoiceHTML(params, result, options);
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

/** Generate PDF blob using jspdf */
export function buildCalculationPDF(
  params: BRDCostParams,
  result: BRDCostResult,
  options: ExportOptions
): Blob {
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const { currency, jobName } = options;
  const title = jobName || "Print job estimate";
  let y = 20;

  doc.setFontSize(16);
  doc.text(title, 20, y);
  y += 10;

  doc.setFontSize(10);
  doc.text(
    `${new Date().toLocaleString()} · ${params.weightG} g · ${params.printTimeHours.toFixed(2)} hrs`,
    20,
    y
  );
  y += 12;

  const line = (label: string, value: string) => {
    doc.text(label, 20, y);
    doc.text(value, 120, y);
    y += 7;
  };

  doc.setFont("helvetica", "normal");
  line("Material cost", `${fmt(result.materialCost)} ${currency}`);
  line("Machine cost", `${fmt(result.machineCost)} ${currency}`);
  line("Electricity cost", `${fmt(result.electricityCost)} ${currency}`);
  if (result.wearAllocations.length > 0) {
    result.wearAllocations.forEach((w) =>
      line(`Wear: ${w.name}`, `${fmt(w.allocatedCost)} ${currency}`)
    );
    line("Total wear", `${fmt(result.totalWearCost)} ${currency}`);
  }
  line("Labor cost", `${fmt(result.laborCost)} ${currency}`);
  line("Subtotal", `${fmt(result.subtotal)} ${currency}`);
  line("Risk buffer", `${fmt(result.riskBuffer)} ${currency}`);
  line("Adjusted subtotal", `${fmt(result.adjustedSubtotal)} ${currency}`);
  line("Profit", `${fmt(result.profitValue)} ${currency}`);
  doc.setFont("helvetica", "bold");
  line("Final price", `${fmt(result.finalPrice)} ${currency}`);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Cost per gram: ${fmt(result.costPerGram)} ${currency}/g · Hourly revenue: ${fmt(result.hourlyRevenue)} ${currency}/hr · Margin: ${result.marginPercent.toFixed(1)}%`,
    20,
    y
  );

  return doc.output("blob");
}

/** Trigger download of PDF file */
export function downloadCalculationPDF(
  params: BRDCostParams,
  result: BRDCostResult,
  options: ExportOptions
): void {
  const blob = buildCalculationPDF(params, result, options);
  const name = options.fileName?.replace(/\.[^.]+$/, "") || "print-calculation";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
