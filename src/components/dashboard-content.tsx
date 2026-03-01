"use client";

import { usePreferences } from "@/hooks/use-preferences";
import { cn } from "@/lib/utils";

export function DashboardContent({
  children,
  className,
}: Readonly<{ children?: React.ReactNode; className?: string }>) {
  const { preferences } = usePreferences();
  const isCentered = preferences.pageLayout === "CENTERED";
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-auto p-4",
        isCentered && "max-w-7xl w-full mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
}
