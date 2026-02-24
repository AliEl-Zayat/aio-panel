import { getTranslations } from "next-intl/server";
import { ComposeView } from "@/components/email-templates/compose-view";

export default async function ComposePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const templateId = Number(id);
  if (!Number.isInteger(templateId) || templateId < 1) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Invalid template ID.</p>
      </div>
    );
  }

  const t = await getTranslations("emailTemplates");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">{t("compose")}</h2>
      <ComposeView templateId={templateId} />
    </div>
  );
}
