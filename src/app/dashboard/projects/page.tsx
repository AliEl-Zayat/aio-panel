import { getTranslations } from "next-intl/server";
import { ProjectsList } from "@/components/projects/projects-list";

export default async function ProjectsPage() {
  const t = await getTranslations("nav");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">{t("projects")}</h2>
      <ProjectsList />
    </div>
  );
}
