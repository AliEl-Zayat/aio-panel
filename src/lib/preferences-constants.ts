/**
 * Theme presets and font options used by Preferences.
 * Keep in sync with preferences-sheet options and globals.css preset definitions.
 */

export const THEME_PRESETS = [
  { value: "default", label: "Default" },
  { value: "ocean", label: "Ocean" },
  { value: "forest", label: "Forest" },
] as const;

export type ThemePresetValue = (typeof THEME_PRESETS)[number]["value"];

/** CSS variable name for each font (must match layout font variable names). */
export const FONT_CSS_VARS: Record<string, string> = {
  Inter: "var(--font-inter)",
  "Geist Sans": "var(--font-geist-sans)",
  Roboto: "var(--font-roboto)",
  "Open Sans": "var(--font-open-sans)",
  Montserrat: "var(--font-montserrat)",
  "Noto Sans": "var(--font-noto-sans)",
};

export const FONT_OPTIONS = Object.keys(FONT_CSS_VARS).map((key) => ({
  value: key,
  label: key,
}));

/** Fallback when preference font is unknown (e.g. Geist Sans). */
export const DEFAULT_FONT_CSS_VAR = "var(--font-geist-sans)";

export function getFontCssVar(fontFamily: string): string {
  return FONT_CSS_VARS[fontFamily] ?? DEFAULT_FONT_CSS_VAR;
}
