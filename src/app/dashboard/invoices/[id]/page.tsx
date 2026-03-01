import { getTranslations } from "next-intl/server";
import { InvoiceDetail } from "@/components/invoices/invoice-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations("invoices");
  const invoiceId = Number.parseInt(id, 10);
  if (Number.isNaN(invoiceId) || invoiceId < 1) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">{t("errorLoad")}</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <InvoiceDetail invoiceId={invoiceId} />
    </div>
  );
}
