"use client";

import { useTheme } from "next-themes";
import { usePreferences } from "@/hooks/use-preferences";
import { getFontCssVar } from "@/lib/preferences-constants";
import { useEffect } from "react";

/** Syncs user preferences to the DOM: theme mode (next-themes), theme preset (data attr), and font (--font-sans). */
export function PreferencesThemeSync() {
  const { setTheme } = useTheme();
  const { preferences, isLoading } = usePreferences();

  useEffect(() => {
    if (isLoading) return;
    const mode = preferences.themeMode.toLowerCase();
    setTheme(mode === "system" ? "system" : mode);
  }, [preferences.themeMode, isLoading, setTheme]);

  useEffect(() => {
    if (isLoading) return;
    document.documentElement.dataset.themePreset = preferences.themePreset;
  }, [preferences.themePreset, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    const root = document.documentElement;
    root.style.setProperty("--font-sans", getFontCssVar(preferences.fontFamily));
  }, [preferences.fontFamily, isLoading]);

  return null;
}
