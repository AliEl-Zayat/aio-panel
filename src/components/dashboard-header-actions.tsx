"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { clearSessionCookie } from "@/lib/session";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { PreferencesSheet } from "@/components/preferences-sheet";
import type { Locale } from "@/i18n/routing";

function userInitials(email: string): string {
  const part = email.split("@")[0];
  if (!part) return "?";
  if (part.length >= 2) return part.slice(0, 2).toUpperCase();
  return part.toUpperCase();
}

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
      {!isLoading && user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative size-9 rounded-full"
              aria-label={t("openAccountMenu")}
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                  {userInitials(user.email)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
              <span className="font-medium truncate">{user.email}</span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <User className="size-4" />
                {t("profile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="size-4" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">{t("login")}</Link>
        </Button>
      )}
    </div>
  );
}
