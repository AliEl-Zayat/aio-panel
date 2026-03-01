import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import {
  defaultLocale,
  localeCookieName,
  type Locale,
  locales,
} from "./routing";

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get(localeCookieName)?.value;
  const locale: Locale =
    cookieLocale && locales.includes(cookieLocale as Locale)
      ? (cookieLocale as Locale)
      : defaultLocale;

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});
