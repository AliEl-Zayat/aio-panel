import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import { IntlProvider } from "@/components/intl-provider";
import { getLocaleAndMessages } from "@/lib/i18n-server";
import { getDir } from "@/i18n/routing";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AIO Panel",
  description: "Dashboard and tools",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, messages } = await getLocaleAndMessages();
  const dir = getDir(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      suppressContentEditableWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
        suppressContentEditableWarning
      >
        <IntlProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </IntlProvider>
      </body>
    </html>
  );
}
