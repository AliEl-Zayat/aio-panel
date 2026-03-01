"use client";

import { useTranslations } from "next-intl";
import type { Invoice } from "@/services/invoices.service";

export function InvoicePrintView({
  invoice,
  id = "invoice-print",
}: Readonly<{ invoice: Invoice; id?: string }>) {
  const t = useTranslations("invoices");

  const displayDate =
    invoice.issueDate ?? invoice.dueDate ?? invoice.createdAt;
  const lineItemsSubtotal = invoice.lineItems.reduce(
    (sum, li) => sum + li.lineTotal,
    0
  );
  const discount = invoice.discountAmount ?? 0;
  const total = invoice.total;
  const subtotal = discount > 0 ? total + discount : lineItemsSubtotal;
  const paidTotal = invoice.paidTotal;
  const amountDue = invoice.amountDue;
  const cur = invoice.currency;

  return (
    <div
      id={id}
      className="hidden print:block bg-white text-black p-4 print:p-0 max-w-full w-full box-border"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      {/* Header */}
      <header className="border-b border-neutral-300 pb-3 mb-4 print:pb-2 print:mb-3">
        <h1 className="text-xl print:text-lg font-bold tracking-tight text-neutral-900">
          {t("printTitle")}
        </h1>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs print:text-[11px] text-neutral-600">
          <span>
            {t("printInvoiceNumber")}: <strong className="text-neutral-900">{invoice.id}</strong>
          </span>
          {displayDate && (
            <span>
              {t("printDate")}:{" "}
              {new Date(displayDate).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          )}
          {invoice.dueDate && (
            <span>
              {t("printDueDate")}:{" "}
              {new Date(invoice.dueDate).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          )}
        </div>
      </header>

      {/* Bill to */}
      <section className="mb-4 print:mb-3">
        <h2 className="text-[10px] print:text-[9px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
          {t("printBillTo")}
        </h2>
        <div className="text-neutral-900">
          <p className="font-medium text-sm print:text-xs">{invoice.clientName}</p>
          {invoice.clientEmail && (
            <p className="text-xs print:text-[11px] mt-0.5">{invoice.clientEmail}</p>
          )}
          {invoice.clientAddress && (
            <p className="text-xs print:text-[11px] mt-0.5 whitespace-pre-line">
              {invoice.clientAddress}
            </p>
          )}
        </div>
      </section>

      {/* Line items table */}
      <table className="w-full border-collapse text-xs print:text-[11px] mb-4 print:mb-3 table-fixed">
        <thead>
          <tr className="border-b-2 border-neutral-300">
            <th className="text-left py-2 px-1 font-semibold text-neutral-700 w-[50%]">
              {t("lineItemDescription")}
            </th>
            <th className="text-right py-2 px-1 font-semibold text-neutral-700 w-12">
              {t("printQty")}
            </th>
            <th className="text-right py-2 px-1 font-semibold text-neutral-700 w-16">
              {t("printUnitPrice")}
            </th>
            <th className="text-right py-2 px-1 font-semibold text-neutral-700 w-16">
              {t("printAmount")} ({cur})
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((li) => (
            <tr key={li.id} className="border-b border-neutral-200">
              <td className="py-1.5 px-1 text-neutral-900 break-words">{li.description}</td>
              <td className="py-1.5 px-1 text-right tabular-nums">
                {li.quantity}
              </td>
              <td className="py-1.5 px-1 text-right tabular-nums">
                {li.unitPrice.toFixed(2)}
                {(li.discountAmount ?? 0) > 0 && (
                  <span className="text-neutral-500 block text-[10px]">
                    − { (li.discountAmount ?? 0).toFixed(2) } {t("lineDiscount")}
                  </span>
                )}
              </td>
              <td className="py-1.5 px-1 text-right tabular-nums font-medium">
                {li.lineTotal.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-48 min-w-0 space-y-1 text-xs print:text-[11px]">
          {discount > 0 && (
            <div className="flex justify-between text-neutral-600">
              <span>{t("printSubtotal")}</span>
              <span className="tabular-nums">{subtotal.toFixed(2)} {cur}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-neutral-600">
              <span>{t("invoiceDiscount")}</span>
              <span className="tabular-nums">− {discount.toFixed(2)} {cur}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-sm print:text-xs pt-1.5 border-t border-neutral-300">
            <span>{t("total")}</span>
            <span className="tabular-nums">{total.toFixed(2)} {cur}</span>
          </div>
          {paidTotal > 0 && (
            <div className="flex justify-between text-neutral-600">
              <span>{t("payments")}</span>
              <span className="tabular-nums">− {paidTotal.toFixed(2)} {cur}</span>
            </div>
          )}
          {amountDue > 0 && (
            <div className="flex justify-between font-semibold text-sm print:text-xs text-neutral-900">
              <span>{t("amountDue")}</span>
              <span className="tabular-nums">{amountDue.toFixed(2)} {cur}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payments list (if any) */}
      {invoice.payments.length > 0 && (
        <section className="mt-4 print:mt-3 pt-3 print:pt-2 border-t border-neutral-200">
          <h3 className="text-[10px] print:text-[9px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
            {t("payments")}
          </h3>
          <ul className="text-xs print:text-[11px] space-y-0.5">
            {invoice.payments.map((p) => (
              <li
                key={p.id}
                className="flex justify-between text-neutral-700"
              >
                <span>
                  {new Date(p.paidAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                  {p.note ? ` — ${p.note}` : ""}
                </span>
                <span className="tabular-nums">{p.amount.toFixed(2)} {cur}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Notes */}
      {invoice.notes?.trim() && (
        <section className="mt-4 print:mt-3 pt-3 print:pt-2 border-t border-neutral-200">
          <h3 className="text-[10px] print:text-[9px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
            {t("notes")}
          </h3>
          <p className="text-xs print:text-[11px] text-neutral-700 whitespace-pre-line">
            {invoice.notes.trim()}
          </p>
        </section>
      )}

      {/* Thank you */}
      <footer className="mt-6 print:mt-4 pt-4 print:pt-3 border-t border-neutral-200 text-center text-xs print:text-[11px] text-neutral-600">
        {t("printThankYou")}
      </footer>
    </div>
  );
}
