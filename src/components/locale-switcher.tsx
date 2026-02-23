"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { localeCookieName } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";
import { Languages } from "lucide-react";

const LOCALE_OPTIONS: { value: Locale; labelKey: "en" | "ar" }[] = [
  { value: "en", labelKey: "en" },
  { value: "ar", labelKey: "ar" },
];

function setLocaleCookie(value: string) {
  document.cookie = `${localeCookieName}=${value};path=/;max-age=31536000;SameSite=Lax`;
}

export function LocaleSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const t = useTranslations("locale");
  const router = useRouter();

  function onSelect(value: Locale) {
    setLocaleCookie(value);
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={t("switch")}>
          <Languages className="size-4" />
          <span className="ms-2 hidden sm:inline">{t(currentLocale)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALE_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onSelect(opt.value)}
          >
            {t(opt.labelKey)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
