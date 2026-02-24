import { getTranslations } from "next-intl/server";
import { CommandSnippetsClient } from "@/components/command-snippets/command-snippets-client";

export default async function CommandSnippetsPage() {
  const t = await getTranslations("commandSnippets");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">{t("title")}</h2>
      <CommandSnippetsClient />
    </div>
  );
}
