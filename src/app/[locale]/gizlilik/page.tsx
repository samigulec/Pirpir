import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/LegalPage";
import { withBrand } from "@/config/brand";
import { privacy } from "@/content/legal/privacy";
import { asLocale } from "@/lib/intl";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const doc = privacy[asLocale(locale)];
  return {
    title: doc.title,
    description: withBrand(doc.intro),
    alternates: alternatesFor("/gizlilik", locale),
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage doc={privacy[asLocale(locale)]} />;
}
