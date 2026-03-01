"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { invoicesService, type InvoiceStatus } from "@/services/invoices.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Printer } from "lucide-react";
import { AxiosError } from "axios";
import { InvoicePrintView } from "@/components/invoices/invoice-print-view";

const INVOICE_QUERY_KEY = (id: number) => ["invoices", id] as const;

function statusLabel(status: InvoiceStatus, overdue: boolean): string {
  if (overdue) return "statusOverdue";
  if (status === "DRAFT") return "statusDraft";
  if (status === "SENT") return "statusSent";
  return "statusPaid";
}

export function InvoiceDetail({
  invoiceId,
}: Readonly<{ invoiceId: number }>) {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentPaidAt, setPaymentPaidAt] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [markPaidError, setMarkPaidError] = useState<string | null>(null);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingSent, setIsMarkingSent] = useState(false);

  const {
    data: invoice,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: INVOICE_QUERY_KEY(invoiceId),
    queryFn: () => invoicesService.getInvoice(invoiceId),
  });

  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(paymentAmount);
    if (Number.isNaN(amount) || amount <= 0) return;
    setIsAddingPayment(true);
    setPaymentError(null);
    try {
      await invoicesService.addPayment(invoiceId, {
        amount,
        paidAt: new Date(paymentPaidAt).toISOString(),
        note: paymentNote.trim() || null,
      });
      queryClient.invalidateQueries({ queryKey: INVOICE_QUERY_KEY(invoiceId) });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setAddPaymentOpen(false);
      setPaymentAmount("");
      setPaymentPaidAt(new Date().toISOString().slice(0, 16));
      setPaymentNote("");
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string; message?: string }>;
      setPaymentError(
        axiosError.response?.data?.message ??
          axiosError.response?.data?.error ??
          t("errorLoad")
      );
    } finally {
      setIsAddingPayment(false);
    }
  }

  async function handleMarkPaid() {
    if (!invoice) return;
    setIsMarkingPaid(true);
    setMarkPaidError(null);
    try {
      await invoicesService.markPaid(invoiceId);
      queryClient.invalidateQueries({ queryKey: INVOICE_QUERY_KEY(invoiceId) });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string; message?: string }>;
      setMarkPaidError(
        axiosError.response?.data?.message ??
          axiosError.response?.data?.error ??
          t("insufficientStock")
      );
    } finally {
      setIsMarkingPaid(false);
    }
  }

  async function handleMarkSent() {
    setIsMarkingSent(true);
    try {
      await invoicesService.markSent(invoiceId);
      queryClient.invalidateQueries({ queryKey: INVOICE_QUERY_KEY(invoiceId) });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    } finally {
      setIsMarkingSent(false);
    }
  }

  async function handleDelete() {
    if (!invoice) return;
    setIsDeleting(true);
    try {
      await invoicesService.deleteInvoice(invoiceId);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      globalThis.location.href = "/dashboard/invoices";
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  }

  if (isLoading || invoice == null) {
    if (isError) {
      return (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/invoices">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive mb-2">
                {error instanceof Error ? error.message : t("errorLoad")}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                {tCommon("retry")}
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-24" />
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const canEdit = invoice.status === "DRAFT";
  const canAddPayment = invoice.status === "SENT";
  const amountDue = invoice.amountDue;
  const canMarkPaid = invoice.status === "SENT" && amountDue > 1e-6;
  const markPaidButtonLabel =
    invoice.direction === "INCOMING" ? t("markReceived") : t("markPaid");

  function handlePrint() {
    globalThis.print();
  }

  return (
    <div className="space-y-4">
      <style>{`
        @media print {
          @page {
            size: auto;
            margin: 8mm;
          }
          body * { visibility: hidden; }
          #invoice-print, #invoice-print * { visibility: visible; }
          #invoice-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            padding: 0;
          }
        }
      `}</style>
      <InvoicePrintView invoice={invoice} />
      <div className="flex items-center gap-2 print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/invoices">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
      </div>
      <Card className="print:hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <h3 className="text-lg font-semibold">
              {invoice.direction === "INCOMING"
                ? t("directionShortIncoming") + ": " + invoice.clientName
                : invoice.clientName}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t(statusLabel(invoice.status, invoice.overdue))}
              {invoice.direction === "INCOMING" && " · " + t("directionIncoming")}
              {" · "}
              {invoice.currency}
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="size-4" />
              {t("print")}
            </Button>
            {canEdit && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleMarkSent}
                  disabled={isMarkingSent}
                >
                  {isMarkingSent ? "…" : t("markSent")}
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/invoices/${invoiceId}/edit`}>
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  {t("deleteInvoice")}
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {invoice.clientEmail && (
            <p className="text-sm">
              <span className="text-muted-foreground">{t("clientEmail")}:</span>{" "}
              {invoice.clientEmail}
            </p>
          )}
          {invoice.dueDate && (
            <p className="text-sm">
              <span className="text-muted-foreground">{t("dueDate")}:</span>{" "}
              {new Date(invoice.dueDate).toLocaleDateString()}
            </p>
          )}
          <div>
            <h4 className="text-sm font-medium mb-2">{t("lineItems")}</h4>
            <ul className="text-sm border rounded-md divide-y">
              {invoice.lineItems.map((li) => {
                const hasDiscount = (li.discountAmount ?? 0) > 0;
                return (
                  <li
                    key={li.id}
                    className="flex justify-between gap-4 px-4 py-2"
                  >
                    <span>{li.description}</span>
                    <span className="tabular-nums">
                      {li.quantity} × {li.unitPrice.toFixed(2)}
                      {hasDiscount &&
                        ` − ${(li.discountAmount ?? 0).toFixed(2)}`}{" "}
                      = {li.lineTotal.toFixed(2)}
                    </span>
                  </li>
                );
              })}
            </ul>
            {(invoice.discountAmount ?? 0) > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                {t("invoiceDiscount")}:{" "}
                {invoice.discountAmount.toFixed(2)} {invoice.currency}
              </p>
            )}
            <p className="mt-2 font-medium">
              {t("total")}: {invoice.total.toFixed(2)} {invoice.currency}
              {invoice.paidTotal > 0 && (
                <span className="text-muted-foreground ms-2">
                  ({t("payments")}: {invoice.paidTotal.toFixed(2)})
                </span>
              )}
              {amountDue > 0 && (
                <span className="text-muted-foreground ms-2">
                  · {t("amountDue")}: {amountDue.toFixed(2)}
                </span>
              )}
            </p>
          </div>
          {invoice.payments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">{t("payments")}</h4>
              <ul className="text-sm space-y-1">
                {invoice.payments.map((p) => (
                  <li key={p.id} className="flex justify-between">
                    <span>
                      {new Date(p.paidAt).toLocaleDateString()} — {p.amount.toFixed(2)}
                    </span>
                    {p.note && (
                      <span className="text-muted-foreground">{p.note}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {canAddPayment && (
            <div className="flex gap-2 flex-wrap print:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddPaymentOpen(true)}
              >
                {t("addPayment")}
              </Button>
              {canMarkPaid && (
                <Button
                  size="sm"
                  onClick={handleMarkPaid}
                  disabled={isMarkingPaid}
                >
                  {isMarkingPaid ? "…" : markPaidButtonLabel}
                </Button>
              )}
            </div>
          )}
          {markPaidError && (
            <p className="text-sm text-destructive" role="alert">
              {markPaidError}
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={addPaymentOpen} onOpenChange={setAddPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addPayment")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPayment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">{t("amount")}</Label>
              <Input
                id="payment-amount"
                type="number"
                min={0.01}
                step="any"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-paidAt">{t("paidAt")}</Label>
              <Input
                id="payment-paidAt"
                type="datetime-local"
                value={paymentPaidAt}
                onChange={(e) => setPaymentPaidAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-note">{t("notes")}</Label>
              <Input
                id="payment-note"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
              />
            </div>
            {paymentError && (
              <p className="text-sm text-destructive">{paymentError}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={isAddingPayment}>
                {isAddingPayment ? tCommon("saving") : tCommon("save")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddPaymentOpen(false)}
              >
                {tCommon("cancel")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteInvoice")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDeleteDraft")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? tCommon("deleting") : t("deleteInvoice")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
