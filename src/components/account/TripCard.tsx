import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Price } from "../Price";
import { cityByCode } from "@/data/airports";
import { formatDayWithWeekday } from "@/lib/dates";
import { asLocale, intlLocale } from "@/lib/intl";
import type { Booking } from "@/lib/providers/types";
import { confirmHref, todayIso } from "@/lib/search";

export async function TripCard({ booking }: { booking: Booking }) {
  const t = await getTranslations("account.trips");
  const locale = asLocale(await getLocale());
  const loc = intlLocale(locale);
  const { outbound, inbound } = booking.offer;
  const upcoming = (inbound?.date ?? outbound.date) >= todayIso();
  const city = (code: string) => cityByCode(code, locale);
  const heldExpired = !!booking.held && Date.parse(booking.held.payBy) < Date.now();

  return (
    <article className={`flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[28px] border-2 border-solid border-line px-6 py-5 ${upcoming ? "bg-white" : "bg-field"}`}>
      <div className="flex min-w-0 flex-[999_1_340px] flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          {booking.held ? (
            <span className={`rounded-pill px-3 py-[2px] font-display text-sm font-semibold ${heldExpired ? "bg-line text-muted" : "bg-sun-soft text-sun-text"}`}>
              {heldExpired ? t("holdExpired") : t("awaitingPayment")}
            </span>
          ) : (
            <span className={`rounded-pill px-3 py-[2px] font-display text-sm font-semibold ${upcoming ? "bg-green-soft text-green-text" : "bg-line text-muted"}`}>
              {upcoming ? t("upcoming") : t("past")}
            </span>
          )}
        </span>
        <span className="font-display text-2xl font-semibold">
          {city(outbound.fromCode)} → {city(outbound.toCode)}
        </span>
        <span className="text-[15px] font-semibold text-muted">
          {formatDayWithWeekday(outbound.date, loc)} · {outbound.dep}
          {inbound && <> — {formatDayWithWeekday(inbound.date, loc)} · {inbound.dep}</>}
          {" · "}
          {booking.offer.airline}
        </span>
      </div>
      <div className="flex flex-[1_1_200px] items-center justify-between gap-4">
        <span className="flex flex-col">
          <span className="text-[13px] font-extrabold text-muted">{t("pnr")}</span>
          <span className="font-display text-xl font-bold tracking-[0.08em]">{booking.pnr ?? "[PNR]"}</span>
          <span className="text-sm font-bold text-muted">{t("total")}: <Price amount={booking.total} /></span>
        </span>
        <Link
          href={confirmHref(booking.id)}
          className="box-border inline-flex min-h-[48px] items-center rounded-pill bg-primary px-[22px] py-3 font-display text-[17px] font-semibold text-white no-underline"
        >
          {t("view")}
        </Link>
      </div>
    </article>
  );
}
