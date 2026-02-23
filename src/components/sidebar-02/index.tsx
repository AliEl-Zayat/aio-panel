import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/sidebar-02/app-sidebar";

export default function Sidebar02({
  children,
  dir = "ltr",
}: Readonly<{ children?: React.ReactNode; dir?: "ltr" | "rtl" }>) {
  // RTL: set dir on container so flex puts first item (sidebar) at start (right). Sidebar uses side="right" to stick right.
  return (
    <SidebarProvider>
      <div
        dir={dir}
        className="panel-gradient-bg relative flex h-dvh w-full bg-sidebar/60 backdrop-blur-sm"
      >
        <div className="flex shrink-0">
          <DashboardSidebar side={dir === "rtl" ? "right" : "left"} />
        </div>
        <SidebarInset className="relative z-0 min-w-0 flex flex-1 flex-col m-2 rounded-xl shadow overflow-hidden bg-transparent">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
