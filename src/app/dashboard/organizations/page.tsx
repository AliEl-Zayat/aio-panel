import { getTranslations } from "next-intl/server";
import { OrganizationsList } from "@/components/organizations/organizations-list";

export default async function OrganizationsPage() {
  const t = await getTranslations("nav");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">{t("organizations")}</h2>
      <OrganizationsList />
    </div>
  );
}
