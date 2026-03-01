import { getTranslations } from "next-intl/server";
import { SideBudgetClient } from "@/components/side-budget/side-budget-client";

export default async function SideBudgetPage() {
  const t = await getTranslations("sideBudget");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">{t("title")}</h2>
      <SideBudgetClient />
    </div>
  );
}
