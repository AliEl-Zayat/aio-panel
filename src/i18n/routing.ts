/**
 * Locale and RTL configuration.
 * Locale is persisted via NEXT_LOCALE cookie; no locale segment in URL.
 */
export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** RTL locales; all others are LTR */
export const rtlLocales: readonly Locale[] = ["ar"];

export function isRtl(locale: string): boolean {
  return rtlLocales.includes(locale as Locale);
}

export function getDir(locale: string): "ltr" | "rtl" {
  return isRtl(locale) ? "rtl" : "ltr";
}

export const localeCookieName = "NEXT_LOCALE";
