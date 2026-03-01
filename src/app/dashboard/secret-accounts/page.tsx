import { getTranslations } from "next-intl/server";
import { SecretAccountsClient } from "@/components/secret-accounts/secret-accounts-client";

export default async function SecretAccountsPage() {
  const t = await getTranslations("secretAccounts");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">{t("title")}</h2>
      <SecretAccountsClient />
    </div>
  );
}
