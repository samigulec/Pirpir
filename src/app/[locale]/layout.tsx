import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { LoginModalProvider } from "@/components/auth/LoginModal";
import { brand, siteUrl } from "@/config/brand";
import { baloo, fredoka, nunito } from "@/config/fonts";
import { routing } from "@/i18n/routing";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const OG_LOCALE: Record<string, string> = { tr: "tr_TR", en: "en_GB", nl: "nl_NL", de: "de_DE", fr: "fr_FR", es: "es_ES", it: "it_IT" };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    metadataBase: new URL(siteUrl()),
    // Ana sayfa başlığı "Nereye uçmak istersin?": sekmede ve paylaşım önizlemesinde "Ana sayfa"dan daha anlamlı
    title: { default: `${brand.name} — ${t("hero.title")}`, template: `${brand.name} — %s` },
    description: t("metaDescription"),
    // WhatsApp, iMessage, Telegram, X ve Facebook önizlemesi: dile göre görsel (public/og, scripts/og-images.py ile üretilir)
    openGraph: {
      type: "website",
      siteName: brand.name,
      locale: OG_LOCALE[locale] ?? "tr_TR",
      images: [{ url: `/og/home-${locale}.png`, width: 1200, height: 630, alt: `${brand.name} — ${t("hero.title")}` }],
    },
    twitter: { card: "summary_large_image", images: [`/og/home-${locale}.png`] },
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
    <html lang={locale} className={`${fredoka.variable} ${baloo.variable} ${nunito.variable}`}>
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
