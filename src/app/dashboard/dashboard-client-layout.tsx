"use client";

import { CurrentOrgProvider } from "@/contexts/current-org-context";

export function DashboardClientLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <CurrentOrgProvider>{children}</CurrentOrgProvider>;
}
