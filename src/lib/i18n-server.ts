import { cookies } from "next/headers";
import {
  defaultLocale,
  localeCookieName,
  type Locale,
  locales,
} from "@/i18n/routing";
import en from "../../messages/en.json";
import ar from "../../messages/ar.json";

const messages: Record<Locale, typeof en> = { en, ar };

export type LocaleMessages = typeof en;

export async function getLocaleAndMessages(): Promise<{
  locale: Locale;
  messages: LocaleMessages;
}> {
  const store = await cookies();
  const cookieLocale = store.get(localeCookieName)?.value;
  const locale: Locale =
    cookieLocale && locales.includes(cookieLocale as Locale)
      ? (cookieLocale as Locale)
      : defaultLocale;
  return { locale, messages: messages[locale] };
}
