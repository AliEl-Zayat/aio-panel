"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
  invoicesService,
  type InvoiceStatus,
  type InvoiceDirection,
} from "@/services/invoices.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";

const INVOICES_QUERY_KEY = ["invoices"] as const;

function statusLabel(status: InvoiceStatus, overdue: boolean): string {
  if (overdue) return "statusOverdue";
  if (status === "DRAFT") return "statusDraft";
  if (status === "SENT") return "statusSent";
  return "statusPaid";
}

function directionLabel(direction: InvoiceDirection, t: (k: string) => string): string {
  return direction === "INCOMING" ? t("directionShortIncoming") : t("directionShortOutgoing");
}

export function InvoicesList() {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");

  const {
    data: invoices = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: INVOICES_QUERY_KEY,
    queryFn: () => invoicesService.getInvoices(),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium p-4">{t("clientOrSupplier")}</th>
                  <th className="text-left font-medium p-4">{t("direction")}</th>
                  <th className="text-left font-medium p-4">{t("status")}</th>
                  <th className="text-right font-medium p-4">{t("total")}</th>
                  <th className="text-left font-medium p-4">{t("dueDate")}</th>
                  <th className="text-right font-medium p-4">{tCommon("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="p-4">
                      <Skeleton className="h-5 w-32" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-5 w-16" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-5 w-16" />
                    </td>
                    <td className="p-4 text-right">
                      <Skeleton className="h-5 w-16 ml-auto" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-5 w-24" />
                    </td>
                    <td className="p-4" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
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
    );
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-4">{t("emptyInvoices")}</p>
          <Button asChild>
            <Link href="/dashboard/invoices/new">
              <Plus className="size-4" />
              {t("newInvoice")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/dashboard/invoices/new">
            <Plus className="size-4" />
            {t("newInvoice")}
          </Link>
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium p-4">{t("clientOrSupplier")}</th>
                  <th className="text-left font-medium p-4">{t("direction")}</th>
                  <th className="text-left font-medium p-4">{t("status")}</th>
                  <th className="text-right font-medium p-4">{t("total")}</th>
                  <th className="text-left font-medium p-4">{t("dueDate")}</th>
                  <th className="text-right font-medium p-4">{tCommon("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="p-4">
                      <Link
                        href={`/dashboard/invoices/${inv.id}`}
                        className="font-medium hover:underline"
                      >
                        {inv.clientName}
                      </Link>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {directionLabel(inv.direction ?? "OUTGOING", t)}
                    </td>
                    <td className="p-4">
                      <span className="capitalize">
                        {t(statusLabel(inv.status, inv.overdue))}
                      </span>
                    </td>
                    <td className="p-4 text-right tabular-nums">
                      {inv.total.toFixed(2)} {inv.currency}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {inv.dueDate
                        ? new Date(inv.dueDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/invoices/${inv.id}`}>
                          {inv.status === "DRAFT" ? "Edit" : "View"}
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
