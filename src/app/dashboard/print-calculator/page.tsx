import { getTranslations } from "next-intl/server";
import { PrintCalculatorForm } from "@/components/print-calculator/calculator-form";

export default async function PrintCalculatorPage() {
  const t = await getTranslations("printCalculator");
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium">{t("title")}</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {t("description")}
        </p>
      </div>
      <PrintCalculatorForm />
    </div>
  );
}
