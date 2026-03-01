"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { financeHelperService } from "@/services/finance-helper.service";
import { Button } from "@/components/ui/button";

export function ReminderBanner() {
  const t = useTranslations("financeHelper");
  const { data: status, isLoading } = useQuery({
    queryKey: ["finance-helper", "reminder-status"],
    queryFn: () => financeHelperService.getReminderStatus(),
  });

  if (isLoading || !status?.overdue) return null;

  return (
    <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3">
      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
        {t("reminderMessage")}
      </p>
      <Button asChild variant="link" size="sm" className="mt-1 h-auto p-0 text-amber-700 dark:text-amber-300">
        <Link href="/dashboard/finance-helper">{t("reminderLink")}</Link>
      </Button>
    </div>
  );
}
