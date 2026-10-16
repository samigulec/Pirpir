import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { CurrencySelect } from "@/components/HeaderControls";
import { AccountPill } from "@/components/AccountLinks";
import { Biletcik } from "@/components/characters";
import { TripCard } from "@/components/account/TripCard";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listBookings } from "@/lib/bookings";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.trips" });
  return { title: t("metaTitle"), robots: { index: false } };
}

export default async function TripsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account.trips");
  const tc = await getTranslations("common.characters");
  const user = await getCurrentUser();
  const bookings = await listBookings(user);
  const pill =
    "box-border inline-flex min-h-[48px] items-center rounded-pill bg-primary px-6 py-3 font-display text-lg font-semibold text-white no-underline";

  return (
    <div className="min-h-screen w-full bg-white">
      <SiteHeader width="results">
        <div className="flex items-center gap-2">
          <CurrencySelect />
          <AccountPill />
        </div>
      </SiteHeader>
      <main className="mx-auto flex max-w-results flex-col gap-5 px-6 pb-20 pt-2">
        <h1 className="m-0 font-display text-[44px] font-bold leading-[1.1]">{t("title")}</h1>

        {!user && (
          <div className="flex flex-wrap items-center gap-x-[18px] gap-y-3 rounded-[28px] bg-sky px-6 py-5">
            <div className="flex flex-[1_1_300px] flex-col">
              <span className="font-display text-xl font-semibold">{t("guestTitle")}</span>
              <span className="text-[15px] text-muted">{t("guestText")}</span>
            </div>
            <Link href={{ pathname: "/giris", query: { next: "/biletlerim" } }} className={pill}>{t("guestCta")}</Link>
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
          bookings.map((b) => <TripCard key={b.id} booking={b} />)
        )}
      </main>
    </div>
  );
}
