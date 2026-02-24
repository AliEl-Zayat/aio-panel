import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ComposeView } from "@/components/email-templates/compose-view";
import { Button } from "@/components/ui/button";

export default async function ComposePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const templateId = Number(id);
  if (!Number.isInteger(templateId) || templateId < 1) {
    const t = await getTranslations("emailTemplates");
    return (
      <div className="space-y-4">
        <p className="text-destructive">{t("invalidTemplateId")}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/email-templates">{t("backToList")}</Link>
        </Button>
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
