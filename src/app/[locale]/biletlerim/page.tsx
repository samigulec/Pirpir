import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { LoginButton } from "@/components/AccountLinks";
import { Biletcik } from "@/components/characters";
import { TripCard } from "@/components/account/TripCard";
import { cityByCode } from "@/data/airports";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listBookings } from "@/lib/bookings";
import { formatDayWithWeekday } from "@/lib/dates";
import { intlLocale } from "@/lib/intl";
import { one, type Raw } from "@/lib/search";
import { TRIP_TABS, daysUntil, sortTrips, tripStatus, tripTab, type TripTab } from "@/lib/trips";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.trips" });
  return { title: t("metaTitle"), robots: { index: false } };
}

const isTab = (v: unknown): v is TripTab => typeof v === "string" && (TRIP_TABS as string[]).includes(v);

export default async function TripsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Raw> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account.trips");
  const tc = await getTranslations("common.characters");
  const loc = intlLocale(locale);
  const user = await getCurrentUser();
  const bookings = await listBookings(user);
  const raw = one((await searchParams).tab);

  const groups: Record<TripTab, typeof bookings> = { upcoming: [], past: [], cancelled: [] };
  for (const b of bookings) groups[tripTab(tripStatus(b))].push(b);
  // Seçili sekme yoksa: yaklaşan varsa o, yoksa dolu ilk sekme
  const tab: TripTab = isTab(raw) ? raw : (TRIP_TABS.find((k) => groups[k].length) ?? "upcoming");
  const list = sortTrips(groups[tab], tab);
  const next = tab === "upcoming" ? sortTrips(groups.upcoming.filter((b) => tripStatus(b) === "upcoming"), "upcoming")[0] : undefined;
  const nextDays = next ? daysUntil(next.offer.outbound.date) : 0;

  const pill =
    "box-border inline-flex min-h-[48px] items-center rounded-pill bg-primary px-6 py-3 font-display text-lg font-semibold text-white no-underline";

  return (
    <div className="min-h-screen w-full bg-white">
      <SiteHeader width="results" />
      <main className="mx-auto flex max-w-results flex-col gap-5 px-6 pb-20 pt-2">
        <h1 className="m-0 font-display text-[44px] font-bold leading-[1.1]">{t("title")}</h1>

        {!user && (
          <div className="flex flex-wrap items-center gap-x-[18px] gap-y-3 rounded-[28px] bg-sky px-6 py-5">
            <div className="flex flex-[1_1_300px] flex-col">
              <span className="font-display text-xl font-semibold">{t("guestTitle")}</span>
              <span className="text-[15px] text-muted">{t("guestText")}</span>
            </div>
            <LoginButton className={pill}>{t("guestCta")}</LoginButton>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-[40px] bg-green-soft px-7 py-10 text-center">
            <Biletcik aria-label={tc("biletcik")} width={130} height={84} />
            <span className="font-display text-[28px] font-bold">{t("emptyTitle")}</span>
            <span className="font-display text-xl font-semibold">{t("biletcik")}</span>
            <span className="text-muted">{t("emptyText")}</span>
            <Link href="/" className={pill}>{t("emptyCta")}</Link>
          </div>
        ) : (
          <>
            <nav
              aria-label={t("tabs.label")}
              className="-mx-6 flex gap-2 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {TRIP_TABS.map((k) => {
                const on = k === tab;
                return (
                  <Link
                    key={k}
                    href={{ pathname: "/biletlerim", query: { tab: k } }}
                    aria-current={on ? "page" : undefined}
                    scroll={false}
                    className={`inline-flex min-h-[44px] flex-none items-center gap-2 whitespace-nowrap rounded-pill px-[18px] py-[10px] font-display text-[17px] font-semibold no-underline ${
                      on ? "bg-ink text-white" : "bg-field text-ink"
                    }`}
                  >
                    {t(`tabs.${k}`)}
                    <span className={`rounded-pill px-2 text-sm ${on ? "bg-white/20" : "bg-white text-muted"}`}>{groups[k].length}</span>
                  </Link>
                );
              })}
            </nav>

            {next && (
              <div className="flex items-center gap-4 rounded-[28px] bg-green-soft px-6 py-4">
                <Biletcik aria-label={tc("biletcik")} width={84} height={54} className="flex-none" />
                <div className="flex min-w-0 flex-col">
                  <span className="text-[13px] font-extrabold uppercase tracking-[0.04em] text-green-text">
                    {t("nextTitle")} · {nextDays === 0 ? t("today") : nextDays === 1 ? t("tomorrow") : t("inDays", { n: nextDays })}
                  </span>
                  <span className="font-display text-xl font-semibold">
                    {cityByCode(next.offer.outbound.fromCode, locale)} → {cityByCode(next.offer.outbound.toCode, locale)} ·{" "}
                    {formatDayWithWeekday(next.offer.outbound.date, loc)} {next.offer.outbound.dep}
                  </span>
                  <span className="text-[15px] font-semibold text-muted">{t("nextBiletcik")}</span>
                </div>
              </div>
            )}

            {list.length === 0 ? (
              <p className="m-0 rounded-[24px] bg-field px-6 py-6 text-center font-bold text-muted">{t(`emptyTab.${tab}`)}</p>
            ) : (
              list.map((b) => <TripCard key={b.id} booking={b} />)
            )}
          </>
        )}
      </main>
    </div>
  );
}
