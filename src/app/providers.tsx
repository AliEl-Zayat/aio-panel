"use client";

import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { PreferencesThemeSync } from "@/components/preferences-theme-sync";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <PreferencesThemeSync />
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
