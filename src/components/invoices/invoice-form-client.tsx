"use client";

import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { invoicesService } from "@/services/invoices.service";
import { InvoiceForm } from "./invoice-form";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const INVOICES_QUERY_KEY = ["invoices"] as const;

export function InvoiceFormClient({
  mode,
  invoiceId,
}: Readonly<
  | { mode: "create"; invoiceId?: never }
  | { mode: "edit"; invoiceId: number }
>) {
  const router = useRouter();
  const queryClient = useQueryClient();

  if (mode === "create") {
    return (
      <Card>
        <CardContent className="pt-6">
          <InvoiceForm
            onSuccess={(invoice) => {
              queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
              router.push(`/dashboard/invoices/${invoice.id}`);
            }}
            onCancel={() => router.push("/dashboard/invoices")}
          />
        </CardContent>
      </Card>
    );
  }

  const { data: invoice, isLoading, isError } = useQuery({
    queryKey: ["invoices", invoiceId],
    queryFn: () => invoicesService.getInvoice(invoiceId),
  });

  if (isLoading || invoice == null) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load invoice.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <InvoiceForm
          invoice={invoice}
          onSuccess={(updated) => {
            queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
            queryClient.invalidateQueries({
              queryKey: ["invoices", invoiceId],
            });
            router.push(`/dashboard/invoices/${updated.id}`);
          }}
          onCancel={() => router.push(`/dashboard/invoices/${invoiceId}`)}
        />
      </CardContent>
    </Card>
  );
}
