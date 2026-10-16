import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { LoginModalProvider } from "@/components/auth/LoginModal";
import { brand } from "@/config/brand";
import { fredoka, nunito } from "@/config/fonts";
import { routing } from "@/i18n/routing";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: { default: `${brand.name} — ${t("metaTitle")}`, template: `${brand.name} — %s` },
    description: t("metaDescription"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return (
    <html lang={locale} className={`${fredoka.variable} ${nunito.variable}`}>
      <body>
        <NextIntlClientProvider>
          <CurrencyProvider>
            <LoginModalProvider>{children}</LoginModalProvider>
          </CurrencyProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
