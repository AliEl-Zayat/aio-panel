"use client";

import { useTranslations } from "next-intl";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function DashboardHeader({
  title,
  className,
  children,
}: Readonly<{
  title?: string;
  className?: string;
  children?: React.ReactNode;
}>) {
  const t = useTranslations("dashboard");
  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center gap-2 border-b border-border/40 px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-10",
        className
      )}
    >
      <SidebarTrigger className="-ms-1" />
      <Separator orientation="vertical" className="me-2 h-6" />
      <h1 className="flex-1 text-lg font-semibold">{title ?? t("title")}</h1>
      {children}
    </header>
  );
}
