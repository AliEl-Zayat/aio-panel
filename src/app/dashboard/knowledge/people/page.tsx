import { getTranslations } from "next-intl/server";
import { PeopleList } from "@/components/knowledge/people-list";

export default async function KnowledgePeoplePage() {
  const t = await getTranslations("knowledge");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">{t("people")}</h2>
      <PeopleList />
    </div>
  );
}
