"use client";

import { useTranslations } from "next-intl";
import { CompaniesList } from "./companies-list";
import { TasksList } from "./tasks-list";
import { PeopleList } from "./people-list";

export function KnowledgeClient() {
  const t = useTranslations("knowledge");

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-lg font-medium">{t("companies")}</h3>
        <CompaniesList />
      </section>
      <section className="space-y-4">
        <h3 className="text-lg font-medium">{t("tasks")}</h3>
        <TasksList />
      </section>
      <section className="space-y-4">
        <h3 className="text-lg font-medium">{t("people")}</h3>
        <PeopleList />
      </section>
    </div>
  );
}
