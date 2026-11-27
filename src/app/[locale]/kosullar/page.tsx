import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/LegalPage";
import { isAffiliate } from "@/config/affiliate";
import { withBrand } from "@/config/brand";
import { terms, termsAffiliate } from "@/content/legal/terms";
import { asLocale } from "@/lib/intl";
import { alternatesFor } from "@/lib/seo";

const docFor = (locale: string) => (isAffiliate() ? termsAffiliate[asLocale(locale)] : terms[asLocale(locale)]);

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const doc = docFor(locale);
  return {
    title: doc.title,
    description: withBrand(doc.intro),
    alternates: alternatesFor("/kosullar", locale),
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage doc={docFor(locale)} />;
}
