import { getTranslations } from "next-intl/server";
import { CompaniesList } from "@/components/knowledge/companies-list";

export default async function KnowledgeCompaniesPage() {
  const t = await getTranslations("knowledge");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">{t("companies")}</h2>
      <CompaniesList />
    </div>
  );
}
