import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { LoginPageClient } from "@/components/auth/LoginPage";
import { isSupabaseConfigured } from "@/lib/auth/config";
import { getPathname } from "@/i18n/navigation";
import { asLocale } from "@/lib/intl";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.login" });
  return { title: t("metaTitle"), robots: { index: false } };
}

type Query = Record<string, string | string[] | undefined>;

export default async function LoginPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Query> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const q = await searchParams;
  const t = await getTranslations("account.login");
  // "next" kanonik yol olarak gelir (/hesap); dile göre çevrilir (/en/account).
  const rawNext = typeof q.next === "string" && q.next.startsWith("/") && !q.next.startsWith("//") ? q.next : undefined;
  let next: string | undefined;
  try {
    next = rawNext ? getPathname({ href: rawNext as "/hesap", locale: asLocale(locale) }) : undefined;
  } catch {
    next = rawNext;
  }
  const error = q.error === "link" || q.error === "provider" ? (q.error === "link" ? "failed" : "provider") : undefined;

  return (
    <div className="min-h-screen w-full bg-white">
      <SiteHeader width="form" />
      <main className="mx-auto flex max-w-[508px] flex-col gap-5 px-4 md:px-6 pb-20 pt-2">
        <div className="rounded-[32px] border-2 border-solid border-line px-6 pb-7 pt-8 sm:px-9">
          <LoginPageClient next={next} initialError={error} />
        </div>
        {!isSupabaseConfigured() && <p className="m-0 rounded-[20px] bg-sun-soft px-5 py-4 text-sm font-bold text-sun-text">{t("demoNote")}</p>}
      </main>
    </div>
  );
}
