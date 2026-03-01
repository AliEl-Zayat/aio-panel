import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Inter,
  Roboto,
  Open_Sans,
  Montserrat,
  Noto_Sans,
} from "next/font/google";
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

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

const fontClassNames = [
  geistSans.variable,
  geistMono.variable,
  inter.variable,
  roboto.variable,
  openSans.variable,
  montserrat.variable,
  notoSans.variable,
].join(" ");

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
        className={`${fontClassNames} antialiased`}
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
