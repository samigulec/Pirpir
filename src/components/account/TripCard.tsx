import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Price } from "../Price";
import { Calendar, Download } from "../icons";
import { PdfLink } from "./PdfLink";
import { cityByCode } from "@/data/airports";
import { formatDateTime, formatDayWithWeekday, minsParts } from "@/lib/dates";
import { asLocale, intlLocale } from "@/lib/intl";
import type { Booking, Leg } from "@/lib/providers/types";
import { confirmHref, searchHref, todayIso } from "@/lib/search";
import { daysUntil, tripLegs, tripStatus } from "@/lib/trips";

const chip = "rounded-pill px-3 py-[2px] font-display text-sm font-semibold";
const smallAction =
  "inline-flex min-h-[44px] flex-1 items-center justify-center gap-[5px] whitespace-nowrap rounded-pill bg-white px-2 py-2 text-[14px] font-extrabold text-ink no-underline";

/**
 * Biletlerim kartı: biniş kartı gibi iki parça. Solda uçuşlar, kesik çizginin sağında
 * (telefonda altında) rezervasyon kodu, tutar ve eylemler.
 */
export async function TripCard({ booking }: { booking: Booking }) {
  const t = await getTranslations("account.trips");
  const tf = await getTranslations("confirm");
  const tc = await getTranslations("common");
  const locale = asLocale(await getLocale());
  const loc = intlLocale(locale);
  const { outbound, inbound } = booking.offer;
  const status = tripStatus(booking);
  const active = status === "upcoming" || status === "held";
  const city = (code: string, fallback?: string) => cityByCode(code, locale, fallback);

  // Geri sayım: henüz uçulmamış ilk bacak
  const nextLeg = tripLegs(booking).find((l) => l.date >= todayIso());
  const days = nextLeg ? daysUntil(nextLeg.date) : -1;
  const countdown = status === "upcoming" && nextLeg ? (days === 0 ? t("today") : days === 1 ? t("tomorrow") : t("inDays", { n: days })) : null;

  const statusChip =
    status === "cancelled" ? (
      <span className={`${chip} bg-line text-muted`}>{t("cancelled")}</span>
    ) : status === "expired" ? (
      <span className={`${chip} bg-line text-muted`}>{t("holdExpired")}</span>
    ) : status === "held" ? (
      <span className={`${chip} bg-sun-soft text-sun-text`}>{t("awaitingPayment")}</span>
    ) : (
      <span className={`${chip} ${status === "upcoming" ? "bg-green-soft text-green-text" : "bg-line text-muted"}`}>
        {status === "upcoming" ? t("upcoming") : t("past")}
      </span>
    );

  const legRow = (label: string, leg: Leg) => (
    <div key={label} className="flex flex-col gap-[2px]">
      <span className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="text-[13px] font-extrabold uppercase tracking-[0.04em] text-muted">
          {label} · {formatDayWithWeekday(leg.date, loc)}
        </span>
        <span className="text-sm font-semibold text-muted">
          {leg.via ? tf("transferVia", { city: city(leg.via.code, leg.via.city) }) : tf("direct")}
          {leg.mins > 0 && <> · {tc("duration", minsParts(leg.mins))}</>}
        </span>
      </span>
      <span className="flex min-w-0 items-center gap-[10px] font-display text-[20px] font-semibold">
        <span className="whitespace-nowrap" title={city(leg.fromCode, leg.fromCity)}>
          {leg.dep} <span className="text-muted">{leg.fromCode}</span>
        </span>
        <span aria-hidden="true" className="flex min-w-[24px] flex-1 items-center gap-1">
          <span className="h-[7px] w-[7px] flex-none rounded-full bg-primary" />
          <span className="h-0 flex-1 border-0 border-t-2 border-dashed border-line" />
          <span className="h-[7px] w-[7px] flex-none rounded-full bg-coral" />
        </span>
        <span className="whitespace-nowrap" title={city(leg.toCode, leg.toCity)}>
          {leg.arr}
          {leg.arrDayOffset > 0 && <sup className="ml-[1px] text-[11px] font-extrabold text-coral-text">+{leg.arrDayOffset}</sup>}{" "}
          <span className="text-muted">{leg.toCode}</span>
        </span>
      </span>
    </div>
  );

  const pax = booking.passengers?.length || 1;
  const again = searchHref({
    from: outbound.fromCode,
    to: outbound.toCode,
    ...(inbound ? {} : { returnDate: "" }),
  });

  return (
    <article
      className={`relative flex flex-col overflow-hidden rounded-[28px] border-2 border-solid border-line md:flex-row ${active ? "bg-white" : "bg-field"}`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3 px-5 py-5 md:px-6">
        <div className="flex flex-wrap items-center gap-2">
          {statusChip}
          {countdown && <span className={`${chip} bg-sky text-primary`}>{countdown}</span>}
          <span className="text-sm font-bold text-muted">
            {t(inbound ? "roundTrip" : "oneWay")} · {t("passengers", { n: pax })} · {booking.offer.airline}
          </span>
        </div>
        <h2 className={`m-0 font-display text-[24px] font-semibold leading-[1.15] ${active ? "" : "text-ink-soft"}`}>
          {city(outbound.fromCode, outbound.fromCity)} → {city(outbound.toCode, outbound.toCity)}
        </h2>
        <div className="flex flex-col gap-[14px]">
          {legRow(t("outbound"), outbound)}
          {inbound && legRow(t("inbound"), inbound)}
        </div>
        {status === "held" && booking.held && (
          <span className="text-sm font-bold text-sun-text">{t("payBy", { date: formatDateTime(booking.held.payBy, loc) })}</span>
        )}
        {booking.cancelled && booking.cancelled.refund > 0 && (
          <span className="text-sm font-bold text-muted">{t.rich("refund", { price: () => <Price amount={booking.cancelled!.refund} /> })}</span>
        )}
      </div>

      {/* Kesik çizgi ve iki yandaki yarım daireler (masaüstü) */}
      <span aria-hidden="true" className="absolute -top-[13px] right-[277px] hidden h-6 w-6 rounded-full border-2 border-solid border-line bg-white md:block" />
      <span aria-hidden="true" className="absolute -bottom-[13px] right-[277px] hidden h-6 w-6 rounded-full border-2 border-solid border-line bg-white md:block" />

      <div
        className={`flex flex-col gap-3 border-0 border-t-2 border-dashed border-line px-5 py-5 md:w-[290px] md:flex-none md:border-l-2 md:border-t-0 md:px-6 ${
          active ? "bg-sky/60" : ""
        }`}
      >
        <div className="flex items-end justify-between gap-3">
          <span className="flex flex-col">
            <span className="text-[13px] font-extrabold text-muted">{t("pnr")}</span>
            <span className="font-display text-[22px] font-bold tracking-[0.1em]">{booking.pnr ?? "[PNR]"}</span>
          </span>
          <span className="flex flex-col text-right">
            <span className="text-[13px] font-extrabold text-muted">{t("total")}</span>
            <span className="font-display text-xl font-semibold"><Price amount={booking.total} /></span>
          </span>
        </div>
        <Link
          href={confirmHref(booking.id)}
          className={`box-border inline-flex min-h-[48px] items-center justify-center rounded-pill px-5 py-3 font-display text-[17px] font-semibold no-underline ${
            status === "held" ? "bg-sun text-ink" : "bg-primary text-white"
          }`}
        >
          {status === "held" ? t("pay") : t("view")}
        </Link>
        <div className="flex gap-2">
          {status !== "expired" && (
            <PdfLink bookingId={booking.id} className={smallAction}>
              <Download size={18} />
              {t("pdf")}
            </PdfLink>
          )}
          {status === "upcoming" ? (
            <a href={`/api/takvim/${encodeURIComponent(booking.id)}?lang=${locale}`} download className={smallAction}>
              <Calendar size={18} />
              {t("calendar")}
            </a>
          ) : status !== "held" ? (
            <Link href={again} className={smallAction}>
              {t("again")}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
