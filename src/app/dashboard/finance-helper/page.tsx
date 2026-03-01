import { getTranslations } from "next-intl/server";
import { FinanceHelperClient } from "@/components/finance-helper/finance-helper-client";

export default async function FinanceHelperPage() {
  const t = await getTranslations("financeHelper");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">{t("title")}</h2>
      <FinanceHelperClient />
    </div>
  );
}
