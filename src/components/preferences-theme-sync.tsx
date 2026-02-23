"use client";

import { useTheme } from "next-themes";
import { usePreferences } from "@/hooks/use-preferences";
import { useEffect } from "react";

/** Syncs user preferences.themeMode to next-themes (light/dark/system). */
export function PreferencesThemeSync() {
  const { setTheme } = useTheme();
  const { preferences, isLoading } = usePreferences();

  useEffect(() => {
    if (isLoading) return;
    const mode = preferences.themeMode.toLowerCase();
    setTheme(mode === "system" ? "system" : mode);
  }, [preferences.themeMode, isLoading, setTheme]);

  return null;
}
