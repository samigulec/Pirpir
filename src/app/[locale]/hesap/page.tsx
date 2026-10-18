import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { CurrencySelect, LanguageSelect } from "@/components/HeaderControls";
import { ProfileForm } from "@/components/account/ProfileForm";
import { signOut } from "@/actions/auth";
import { Link, redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { asLocale } from "@/lib/intl";
import { getAlerts, getFavorites, getTravellers } from "@/actions/user";
import { emailEnabled } from "@/lib/email";
import { SavedTravellers } from "@/components/account/SavedTravellers";
import { countryOptions, DEFAULT_NATIONALITY } from "@/data/countries";
import { SavedAlerts, SavedFavorites } from "@/components/account/SavedLists";
import { cityByCode } from "@/data/airports";
import { todayIso } from "@/lib/search";

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
  const card = "flex scroll-mt-6 flex-col gap-4 rounded-[28px] border-2 border-solid border-line px-6 py-5";
  const [travellers, alerts, favorites] = await Promise.all([getTravellers(), getAlerts(), getFavorites()]);
  const alertList = alerts.ok ? alerts.value : [];
  const favList = favorites.ok ? favorites.value : [];
  // Alarm ve favorilerdeki yerlerin yerel adları (dünya listesi tarayıcıya gönderilmez)
  const codes = new Set([
    ...alertList.flatMap((a) => [...a.data.from, ...a.data.to]),
    ...favList.flatMap((f) => [f.data.outbound.fromCode, f.data.outbound.toCode]),
  ]);
  const names = Object.fromEntries([...codes].map((c) => [c, cityByCode(c, locale)]));
  const tl = await getTranslations("account");
  const sub = "m-0 -mt-2 text-[15px] text-muted";
  const h2 = "m-0 font-display text-2xl font-semibold";

  return (
    <div className="min-h-screen w-full bg-white">
      <SiteHeader width="form" />
      <main className="mx-auto flex max-w-form flex-col gap-[22px] px-4 md:px-6 pb-20 pt-2">
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

        <nav aria-label={t("title")} className="flex flex-wrap gap-2">
          {[["yolcular", tl("sections.travellers")], ["alarmlar", tl("sections.alerts")], ["favoriler", tl("sections.favorites")]].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="inline-flex min-h-[44px] items-center rounded-pill bg-field px-5 font-extrabold text-ink no-underline">{label}</a>
          ))}
        </nav>

        <section id="yolcular" className={card}>
          <h2 className={h2}>{tl("travellers.title")}</h2>
          <p className={sub}>{tl("travellers.text")}</p>
          <SavedTravellers initial={travellers.ok ? travellers.value : []} countries={countryOptions(locale)} defaultNationality={DEFAULT_NATIONALITY[locale] ?? ""} />
        </section>

        <section id="alarmlar" className={card}>
          <h2 className={h2}>{tl("alerts.title")}</h2>
          <p className={sub}>{tl("alerts.text")}</p>
          <SavedAlerts initial={alertList} names={names} notice={u.mode === "demo" ? "demo" : emailEnabled() ? "email" : "noEmail"} />
        </section>

        <section id="favoriler" className={card}>
          <h2 className={h2}>{tl("favorites.title")}</h2>
          <p className={sub}>{tl("favorites.text")}</p>
          <SavedFavorites initial={favList} names={names} today={todayIso()} />
        </section>

        <section className={card}>
          <h2 className={h2}>{t("preferences")}</h2>
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col gap-[6px] text-[15px] font-extrabold">
              <span id="pref-language">{t("language")}</span>
              <LanguageSelect labelId="pref-language" />
            </div>
            <div className="flex flex-col gap-[6px] text-[15px] font-extrabold">
              <span id="pref-currency">{t("currency")}</span>
              <CurrencySelect labelId="pref-currency" />
            </div>
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
