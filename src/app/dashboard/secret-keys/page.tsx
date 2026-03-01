import { getTranslations } from "next-intl/server";
import { SecretKeysClient } from "@/components/secret-keys/secret-keys-client";

export default async function SecretKeysPage() {
  const t = await getTranslations("secretKeys");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">{t("title")}</h2>
      <SecretKeysClient />
    </div>
  );
}
