import { getTranslations } from "next-intl/server";
import { EmailTemplatesClient } from "@/components/email-templates/email-templates-client";

export default async function EmailTemplatesPage() {
  const t = await getTranslations("emailTemplates");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">{t("title")}</h2>
      <EmailTemplatesClient />
    </div>
  );
}
