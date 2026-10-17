import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { CurrencySelect } from "@/components/HeaderControls";
import { BookingForm } from "@/components/booking/BookingForm";
import { passengerSlots } from "@/lib/booking-validate";
import { formatDayWithWeekday, minsParts } from "@/lib/dates";
import { dataMode, getOffer } from "@/lib/flights";
import type { Leg } from "@/lib/providers/types";
import { searchHref } from "@/lib/search";
import { cityByCode } from "@/data/airports";
import { intlLocale } from "@/lib/intl";
import { getCurrentUser } from "@/lib/auth/session";
import { locative } from "@/lib/tr-suffix";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "booking" });
  return { title: t("metaTitle"), robots: { index: false } };
}

export default async function BookingPage({ params }: { params: Promise<{ locale: string; teklifId: string }> }) {
  const { locale, teklifId } = await params;
  setRequestLocale(locale);
  const loc = intlLocale(locale);
  const user = await getCurrentUser();
  const offer = await getOffer(decodeURIComponent(teklifId));
  const t = await getTranslations("booking");
  const tc = await getTranslations("common");
  const tr = await getTranslations("results");

  const header = (
    <SiteHeader width="form">
      <CurrencySelect />
    </SiteHeader>
  );

  if (!offer) {
    return (
      <div className="min-h-screen w-full bg-white">
        {header}
        <main className="mx-auto flex max-w-form flex-col items-start gap-4 px-6 pb-20 pt-2">
          <h1 className="m-0 font-display text-[44px] font-bold leading-[1.1]">{t("expiredPage.title")}</h1>
          <p className="m-0 text-muted">{t("expiredPage.text")}</p>
          <Link href="/" className="box-border inline-flex min-h-[48px] items-center rounded-pill bg-primary px-6 py-3 font-display text-lg font-semibold text-white no-underline">
            {t("expiredPage.cta")}
          </Link>
        </main>
      </div>
    );
  }

  const legNote = (leg: Leg) => {
    if (!leg.via) return t("direct");
    const city = cityByCode(leg.via.code, locale, leg.via.city);
    const args = { place: locative(city), city };
    return leg.via.waitMins ? t("transferWait", { ...args, wait: tc("duration", minsParts(leg.via.waitMins)) }) : t("transfer", args);
  };

  const legs = [
    { title: t("outbound", { date: formatDayWithWeekday(offer.outbound.date, loc) }), leg: offer.outbound },
    ...(offer.inbound ? [{ title: t("inbound", { date: formatDayWithWeekday(offer.inbound.date, loc) }), leg: offer.inbound }] : []),
  ];
  const q = offer.query;

  return (
    <div className="min-h-screen w-full bg-white">
      {header}

      <main className="mx-auto flex max-w-form flex-col gap-[22px] px-6 pb-20 pt-2">
        <Link href={searchHref({ ...q, returnDate: q.returnDate ?? "" })} className="self-start py-[6px] text-[15px] font-bold">
          {t("back")}
        </Link>

        <ol aria-label={t("steps.label")} className="m-0 flex list-none gap-2 p-0 text-sm font-extrabold">
          {(["passenger", "bags", "payment"] as const).map((s) => (
            <li key={s} className="flex flex-1 flex-col gap-[6px]">
              <span className="h-[6px] rounded-[3px] bg-primary" />
              {t(`steps.${s}`)}
            </li>
          ))}
        </ol>

        <h1 className="m-0 font-display text-[44px] font-bold leading-[1.1]">{t("title")}</h1>

        <div className="flex flex-col gap-3 rounded-[28px] bg-sky px-6 py-[22px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-display text-[22px] font-semibold">
              {cityByCode(q.from, locale, offer.fromCity)} → {cityByCode(q.to, locale, offer.toCity)}
            </span>
            <span className="font-bold text-muted">
              {offer.airline} · {tr(`cabin.${offer.cabin}`)}
              {offer.fareBrand && ` · ${offer.fareBrand}`}
            </span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[10px]">
            {legs.map(({ title, leg }) => (
              <div key={title} className="flex flex-col rounded-[18px] bg-white px-4 py-3">
                <span className="text-[13px] font-extrabold text-muted">{title}</span>
                <span className="font-display text-xl font-semibold">
                  {leg.dep} → {leg.arr}
                  {leg.arrDayOffset > 0 && <sup className="ml-1 text-[12px] text-coral-text">+{leg.arrDayOffset}</sup>}
                </span>
                <span className="text-[13px] font-bold text-muted">{legNote(leg)}</span>
              </div>
            ))}
          </div>
        </div>

        <BookingForm offer={offer} slots={passengerSlots(offer)} testMode={dataMode() !== "live"} defaultEmail={user?.email} />

        <span className="text-center text-sm text-muted">{t("footnote")}</span>
      </main>
    </div>
  );
}
