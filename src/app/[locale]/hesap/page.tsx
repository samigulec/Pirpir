import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { CurrencySelect, LanguageSelect } from "@/components/HeaderControls";
import { ProfileForm } from "@/components/account/ProfileForm";
import { signOut } from "@/actions/auth";
import { Link, redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { asLocale } from "@/lib/intl";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.account" });
  return { title: t("metaTitle"), robots: { index: false } };
}

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) redirect({ href: { pathname: "/giris", query: { next: "/hesap" } }, locale: asLocale(locale) });
  const u = user!;
  const t = await getTranslations("account.account");
  const card = "flex flex-col gap-4 rounded-[28px] border-2 border-solid border-line px-6 py-5";
  const h2 = "m-0 font-display text-2xl font-semibold";

  return (
    <div className="min-h-screen w-full bg-white">
      <SiteHeader width="form" />
      <main className="mx-auto flex max-w-form flex-col gap-[22px] px-6 pb-20 pt-2">
        <div className="flex flex-col gap-1 rounded-[40px] bg-sky px-7 py-8">
          <span className="font-extrabold text-muted">{t("title")}</span>
          <h1 className="m-0 font-display text-[40px] font-bold leading-[1.1]">
            {u.name ? t("hello", { name: u.name.split(" ")[0] }) : t("helloNoName")}
          </h1>
          <span className="font-semibold text-muted">{u.email}</span>
        </div>

        <section className={card}>
          <h2 className={h2}>{t("profile")}</h2>
          <ProfileForm name={u.name} email={u.email} />
        </section>

        <section className={card}>
          <h2 className={h2}>{t("preferences")}</h2>
          <div className="flex flex-wrap gap-6">
            <label className="flex flex-col gap-[6px] text-[15px] font-extrabold">
              {t("language")}
              <LanguageSelect />
            </label>
            <label className="flex flex-col gap-[6px] text-[15px] font-extrabold">
              {t("currency")}
              <CurrencySelect />
            </label>
          </div>
        </section>

        <Link href="/biletlerim" className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] bg-green-soft px-6 py-5 text-ink no-underline">
          <span className="flex flex-col">
            <span className="font-display text-xl font-semibold">{t("trips")}</span>
            <span className="text-[15px] text-muted">{t("tripsText")}</span>
          </span>
          <span aria-hidden="true" className="font-display text-2xl font-semibold">→</span>
        </Link>

        <form action={signOut}>
          <button type="submit" className="min-h-[48px] cursor-pointer rounded-pill border-2 border-solid border-line bg-white px-6 py-3 font-display text-[17px] font-semibold leading-[normal] text-ink">
            {t("signOut")}
          </button>
        </form>
        {u.mode === "demo" && <p className="m-0 text-sm font-bold text-muted">{t("demoNote")}</p>}
      </main>
    </div>
  );
}
