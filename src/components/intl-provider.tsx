"use client";

import { NextIntlClientProvider } from "next-intl";
import type { Locale } from "@/i18n/routing";

export function IntlProvider({
  locale,
  messages,
  children,
}: Readonly<{
  locale: Locale;
  messages: Record<string, unknown>;
  children: React.ReactNode;
}>) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
