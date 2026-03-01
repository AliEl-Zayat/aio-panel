import { getTranslations } from "next-intl/server";
import { TasksList } from "@/components/knowledge/tasks-list";

export default async function KnowledgeTasksPage() {
  const t = await getTranslations("knowledge");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">{t("tasks")}</h2>
      <TasksList />
    </div>
  );
}
