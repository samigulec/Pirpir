import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { CurrencySelect } from "@/components/HeaderControls";
import { Pirpir } from "@/components/characters";
import { LoginForm } from "@/components/account/LoginForm";
import { isSupabaseConfigured } from "@/lib/auth/config";

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
  const tc = await getTranslations("common.characters");
  const next = typeof q.next === "string" ? q.next : undefined;
  const error = typeof q.error === "string" && ["link", "google"].includes(q.error) ? q.error : undefined;
  const supabase = isSupabaseConfigured();

  return (
    <div className="min-h-screen w-full bg-white">
      <SiteHeader width="form">
        <CurrencySelect />
      </SiteHeader>
      <main className="mx-auto flex max-w-form flex-col gap-[22px] px-6 pb-20 pt-2">
        <div className="flex flex-col items-center gap-3 rounded-[40px] bg-sky px-7 py-9 text-center">
          <Pirpir aria-label={tc("pirpir")} highlights={false} width={150} height={105} />
          <h1 className="m-0 font-display text-[44px] font-bold leading-[1.1]">{t("title")}</h1>
          <p className="m-0 max-w-[460px] text-lg text-muted">{t("subtitle")}</p>
        </div>
        <LoginForm next={next} google={supabase && process.env.NEXT_PUBLIC_AUTH_GOOGLE === "1"} initialError={error} />
        <p className="m-0 text-center text-[15px] text-muted">{t("why")}</p>
        {!supabase && <p className="m-0 rounded-[20px] bg-sun-soft px-5 py-4 text-sm font-bold text-sun-text">{t("demoNote")}</p>}
      </main>
    </div>
  );
}
