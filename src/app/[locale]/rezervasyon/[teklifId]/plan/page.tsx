import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LogoMark } from "@/components/Logo";
import { Price } from "@/components/Price";
import { PrintButton } from "@/components/booking/PrintButton";
import { brand } from "@/config/brand";
import { cityByCode } from "@/data/airports";
import { Link } from "@/i18n/navigation";
import { getBooking } from "@/lib/bookings";
import { formatDateTime, formatDayWithWeekday, minsParts } from "@/lib/dates";
import { intlLocale } from "@/lib/intl";
import type { Leg } from "@/lib/providers/types";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "confirm.plan" });
  return { title: t("metaTitle"), robots: { index: false } };
}

/** Yazdırılabilir seyahat planı (e-bilet değildir). */
export default async function TripPlanPage({ params }: { params: Promise<{ locale: string; teklifId: string }> }) {
  const { locale, teklifId } = await params;
  setRequestLocale(locale);
  const booking = await getBooking(decodeURIComponent(teklifId));
  if (!booking) notFound();
  const t = await getTranslations("confirm");
  const tp = await getTranslations("confirm.plan");
  const tc = await getTranslations("common");
  const loc = intlLocale(locale);
  const city = (c: string) => cityByCode(c, locale);
  const status = booking.cancelled ? "cancelled" : booking.held ? "held" : "confirmed";
  const legs = [
    { title: t("outbound", { date: formatDayWithWeekday(booking.offer.outbound.date, loc) }), leg: booking.offer.outbound },
    ...(booking.offer.inbound ? [{ title: t("inbound", { date: formatDayWithWeekday(booking.offer.inbound.date, loc) }), leg: booking.offer.inbound }] : []),
  ];
  const note = (leg: Leg) => (leg.via ? t("transferVia", { city: cityByCode(leg.via.code, locale, leg.via.city) }) : t("direct"));
  const row = "flex flex-wrap justify-between gap-x-6 gap-y-1 border-0 border-b border-solid border-line py-3";

  return (
    <main className="mx-auto flex max-w-form flex-col gap-5 px-6 py-8 print:max-w-none print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={{ pathname: "/rezervasyon/[teklifId]/onay", params: { teklifId: booking.id } }} className="py-2 font-bold">
          ← {tp("back")}
        </Link>
        <PrintButton label={tp("print")} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <LogoMark size={36} />
          <span className="font-display text-2xl font-bold">{brand.name}</span>
        </span>
        <h1 className="m-0 font-display text-[32px] font-bold">{tp("title")}</h1>
      </div>

      <div className="flex flex-col">
        <div className={row}>
          <span className="font-bold text-muted">{t("pnrLabel")}</span>
          <span className="font-display text-xl font-bold tracking-[0.1em]">{booking.pnr ?? "[PNR]"}</span>
        </div>
        <div className={row}>
          <span className="font-bold text-muted">{tp("status")}</span>
          <span className="font-bold">
            {tp(`statuses.${status}`)}
            {booking.held && !booking.cancelled && ` · ${formatDateTime(booking.held.payBy, loc)}`}
          </span>
        </div>
        {booking.passengers?.length ? (
          <div className={row}>
            <span className="font-bold text-muted">{tp("passengers")}</span>
            <span className="text-right font-bold">{booking.passengers.join(", ")}</span>
          </div>
        ) : null}
        <div className={row}>
          <span className="font-bold text-muted">{tp("email")}</span>
          <span className="font-bold">{booking.email}</span>
        </div>
        <div className={row}>
          <span className="font-bold text-muted">{tp("total")}</span>
          <span className="font-bold"><Price amount={booking.total} /></span>
        </div>
      </div>

      {legs.map(({ title, leg }) => (
        <section key={title} className="flex flex-col gap-1 rounded-[20px] border-2 border-solid border-line px-5 py-4 print:break-inside-avoid">
          <span className="text-sm font-extrabold text-muted">{title}</span>
          <span className="font-display text-2xl font-semibold">
            {leg.dep} {city(leg.fromCode)} ({leg.fromCode}) → {leg.arr}
            {leg.arrDayOffset > 0 && <sup className="ml-[2px] text-[12px] font-extrabold">+{leg.arrDayOffset}</sup>} {city(leg.toCode)} ({leg.toCode})
          </span>
          <span className="font-semibold text-muted">
            {leg.airline} · {note(leg)}
            {leg.mins > 0 && ` · ${tc("duration", minsParts(leg.mins))}`}
          </span>
        </section>
      ))}

      <p className="m-0 text-sm text-muted">{tp("note")}</p>
    </main>
  );
}
