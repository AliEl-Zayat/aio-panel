import { getTranslations } from "next-intl/server";
import { InvoiceFormClient } from "@/components/invoices/invoice-form-client";

export default async function NewInvoicePage() {
  const t = await getTranslations("invoices");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">{t("newInvoice")}</h2>
      <InvoiceFormClient mode="create" />
    </div>
  );
}
