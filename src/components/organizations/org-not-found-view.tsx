"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function OrgNotFoundView() {
  const t = useTranslations("organizations");
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-medium">{t("notFound")}</h2>
      <p className="text-muted-foreground">{t("notFoundDescription")}</p>
      <Link
        href="/dashboard/organizations"
        className="text-primary hover:underline font-medium"
      >
        {t("backToOrganizations")}
      </Link>
    </div>
  );
}
