import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { brand } from "@/config/brand";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${brand.name} — Ana sayfa`, template: `${brand.name} — %s` },
  description: brand.tagline,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${fredoka.variable} ${nunito.variable}`}>
      <body>
        <NextIntlClientProvider>
          <CurrencyProvider>{children}</CurrencyProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
