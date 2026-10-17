import { getTranslations } from "next-intl/server";
import { brand } from "@/config/brand";
import { cityByCode } from "@/data/airports";
import { formatDateTime, formatDayWithYear, minsParts } from "@/lib/dates";
import { formatPrice, type Currency } from "@/lib/currency";
import { intlLocale } from "@/lib/intl";
import type { Booking, Leg, Segment } from "@/lib/providers/types";
import { passengerBags, tripStatus } from "@/lib/trips";
import type { PlanData, PlanLeg, PlanSegment } from "./TripPlanPdf";

const minutes = (date: string, hhmm: string, dayOffset = 0) => {
  const [h, m] = hhmm.split(":").map(Number);
  return Date.parse(date) / 60_000 + dayOffset * 1440 + h * 60 + m;
};

/** Seyahat planının metinleri: PDF ve sayfa aynı veriden çizilir. */
export async function planData(booking: Booking, locale: string, cur: Currency): Promise<PlanData> {
  const t = await getTranslations({ locale, namespace: "confirm" });
  const tp = await getTranslations({ locale, namespace: "confirm.plan" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const loc = intlLocale(locale);
  const city = (c: string, fallback?: string) => cityByCode(c, locale, fallback);
  const price = (n: number) => formatPrice(n, cur, loc);
  const dur = (mins: number) => tc("duration", minsParts(mins));

  const status = tripStatus(booking);
  const statusText =
    status === "cancelled" ? tp("statuses.cancelled") : status === "held" || status === "expired" ? tp("statuses.held") : tp("statuses.confirmed");

  const segRows = (leg: Leg): PlanSegment[] =>
    (leg.segments ?? []).map((g: Segment, i, all) => {
      const next = all[i + 1];
      const wait = next ? minutes(next.date, next.dep) - minutes(g.date, g.arr, g.arrDayOffset) : 0;
      return {
        flight: [g.flightNumber, g.carrier].filter(Boolean).join(" · "),
        route: `${g.fromCode} – ${g.toCode}`,
        times: `${g.dep} – ${g.arr}${g.arrDayOffset > 0 ? ` (+${g.arrDayOffset})` : ""} · ${dur(g.mins)}`,
        aircraft: g.aircraft,
        layover: next && wait > 0 ? tp("layover", { city: city(g.toCode), time: dur(wait) }) : undefined,
      };
    });

  const legs: PlanLeg[] = [
    { title: t("outbound", { date: formatDayWithYear(booking.offer.outbound.date, loc) }), leg: booking.offer.outbound },
    ...(booking.offer.inbound ? [{ title: t("inbound", { date: formatDayWithYear(booking.offer.inbound.date, loc) }), leg: booking.offer.inbound }] : []),
  ].map(({ title, leg }) => ({
    title,
    airline: leg.airline,
    dep: leg.dep,
    arr: leg.arr,
    nextDay: leg.arrDayOffset > 0 ? tp("arrivesNextDay", { n: leg.arrDayOffset }) : undefined,
    fromCode: leg.fromCode,
    toCode: leg.toCode,
    fromCity: city(leg.fromCode, leg.fromCity),
    toCity: city(leg.toCode, leg.toCity),
    duration: leg.mins > 0 ? dur(leg.mins) : "",
    stops: leg.via ? t("transferVia", { city: city(leg.via.code, leg.via.city) }) : t("direct"),
    segments: segRows(leg),
  }));

  const paying = booking.payingCount ?? booking.passengers?.length ?? 0;
  const passengers = passengerBags(booking).map((p, i) => ({
    name: i >= paying ? `${p.name} (${tp("infant")})` : p.name,
    bags:
      i >= paying
        ? "—"
        : !booking.includedBags && !booking.extraBags
        ? tp("noBags")
        : tp("bagsLine", { cabin: p.cabin, checked: p.checked, kg: p.checked && p.kg ? String(p.kg) : "none", heavy: p.heavy }),
  }));

  const rules: string[] = [];
  if (booking.changeable === false) rules.push(tp("changeNo"));
  else if (booking.changeable) {
    rules.push(booking.changeFee === undefined ? tp("changeAllowed") : booking.changeFee > 0 ? tp("changeFee", { price: price(booking.changeFee) }) : tp("changeFree"));
  }
  if (booking.refundable !== undefined) rules.push(booking.refundable ? tp("refundYes") : tp("refundNo"));
  if (booking.cancelled) {
    const tx = await getTranslations({ locale, namespace: "confirm.cancelled" });
    rules.push(booking.cancelled.refund > 0 ? tx("refund", { price: price(booking.cancelled.refund) }) : tx("noRefund"));
  }

  const out = booking.offer.outbound;
  const routeText = `${city(out.fromCode, out.fromCity)} – ${city(out.toCode, out.toCity)}`;
  const tt = await getTranslations({ locale, namespace: "account.trips" });

  return {
    brand: brand.name,
    lang: locale,
    docTitle: tp("title"),
    route: routeText,
    pnrLabel: booking.held && !booking.cancelled ? t("held.pnrLabel") : t("pnrLabel"),
    pnr: booking.pnr ?? "[PNR]",
    status: {
      text: status === "held" ? `${statusText} · ${formatDateTime(booking.held!.payBy, loc)}` : status === "expired" ? tt("holdExpired") : statusText,
      tone: status === "upcoming" || status === "past" ? "green" : status === "held" ? "sun" : "muted",
    },
    sample: booking.provider === "demo" ? tp("sample") : undefined,
    facts: [
      { label: tp("passengers"), value: tt("passengers", { n: booking.passengers?.length || 1 }) + ` · ${tt(booking.offer.inbound ? "roundTrip" : "oneWay")}` },
      { label: tp("bookedOn"), value: formatDayWithYear(booking.createdAt.slice(0, 10), loc) },
      { label: tp("email"), value: booking.email },
      { label: tp("total"), value: price(booking.total) },
    ],
    legs,
    passengersTitle: tp("passengersTitle"),
    passengerCol: tp("passenger"),
    bagsCol: tp("bags"),
    passengers,
    rulesTitle: tp("rulesTitle"),
    rules,
    infoTitle: tp("infoTitle"),
    info: tp.raw("info") as string[],
    note: tp("note"),
    footer: `${brand.name} · ${tp("support")} · ${tp("generated", { date: formatDayWithYear(new Date().toISOString().slice(0, 10), loc) })}`,
  };
}
