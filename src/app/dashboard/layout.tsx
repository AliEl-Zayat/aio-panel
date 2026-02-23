import Sidebar02 from "@/components/sidebar-02";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardHeaderActions } from "@/components/dashboard-header-actions";
import { DashboardContent } from "@/components/dashboard-content";
import { getLocaleAndMessages } from "@/lib/i18n-server";
import { getDir } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { locale } = await getLocaleAndMessages();
  const dir = getDir(locale);
  return (
    <Sidebar02 dir={dir}>
      <DashboardHeader>
        <DashboardHeaderActions currentLocale={locale as Locale} />
      </DashboardHeader>
      <DashboardContent>{children}</DashboardContent>
    </Sidebar02>
  );
}
