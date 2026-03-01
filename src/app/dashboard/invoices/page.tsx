import { getTranslations } from "next-intl/server";
import { InvoicesList } from "@/components/invoices/invoices-list";

export default async function InvoicesPage() {
  const t = await getTranslations("invoices");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">{t("title")}</h2>
      <InvoicesList />
    </div>
  );
}
