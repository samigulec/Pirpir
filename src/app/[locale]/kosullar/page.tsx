import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/LegalPage";
import { isAffiliate } from "@/config/affiliate";
import { terms, termsAffiliate } from "@/content/legal/terms";
import { asLocale } from "@/lib/intl";

const docFor = (locale: string) => (isAffiliate() ? termsAffiliate[asLocale(locale)] : terms[asLocale(locale)]);

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: docFor(locale).title };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage doc={docFor(locale)} />;
}
