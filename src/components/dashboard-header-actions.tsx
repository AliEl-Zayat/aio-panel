"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearSessionCookie } from "@/lib/session";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { PreferencesSheet } from "@/components/preferences-sheet";
import type { Locale } from "@/i18n/routing";

export function DashboardHeaderActions({
  currentLocale,
}: Readonly<{
  currentLocale: Locale;
}>) {
  const t = useTranslations("common");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading } = useCurrentUser();
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  const handleLogout = () => {
    clearSessionCookie();
    queryClient.removeQueries({ queryKey: ["users", "me"] });
    router.push("/login");
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("preferences")}
        onClick={() => setPreferencesOpen(true)}
      >
        <Settings className="size-4" />
      </Button>
      <PreferencesSheet
        open={preferencesOpen}
        onOpenChange={setPreferencesOpen}
      />
      <LocaleSwitcher currentLocale={currentLocale} />
      {!isLoading && user && (
        <span className="text-muted-foreground text-sm">{user.email}</span>
      )}
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        {t("logout")}
      </Button>
    </div>
  );
}
