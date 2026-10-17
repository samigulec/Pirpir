import { getLocale, getTranslations } from "next-intl/server";
import { Price } from "../Price";
import { cityByCode, findAirport } from "@/data/airports";
import { bagItemText } from "@/lib/bag-text";
import { formatDayWithYear, minsParts } from "@/lib/dates";
import { intlLocale } from "@/lib/intl";
import type { PlanData } from "@/lib/pdf/TripPlanPdf";
import type { Booking, Leg, Segment } from "@/lib/providers/types";
import { passengerBags } from "@/lib/trips";

const card = "flex flex-col gap-3 rounded-[28px] border-2 border-solid border-line px-6 py-5";
const h2 = "m-0 font-display text-xl font-semibold";

/** Bacağın uçuşları; eski kayıtlarda ayrıntı yoksa bacağın kendisi tek uçuş gibi gösterilir. */
const flightsOf = (leg: Leg): Segment[] =>
  leg.segments?.length
    ? leg.segments
    : [{ fromCode: leg.fromCode, toCode: leg.toCode, date: leg.date, dep: leg.dep, arr: leg.arr, arrDayOffset: leg.arrDayOffset, mins: leg.mins, carrier: leg.airline }];

/**
 * Uçuş ayrıntıları (Kiwi'deki yolculuk özeti gibi): her uçuş için saat, havalimanı, havayolu logosu,
 * uçuş numarası, uçak ve süre; aktarmalarda bekleme süresi.
 */
export async function Itinerary({ booking }: { booking: Booking }) {
  const t = await getTranslations("confirm");
  const td = await getTranslations("confirm.details");
  const tc = await getTranslations("common");
  const tr = await getTranslations("results");
  const locale = await getLocale();
  const loc = intlLocale(locale);
  const dur = (m: number) => tc("duration", minsParts(m));
  const city = (c: string, f?: string) => cityByCode(c, locale, f);
  const airport = (c: string) => findAirport(c)?.name;
  const cabin = booking.offer.cabin ? tr(`cabin.${booking.offer.cabin}`) : undefined;
  const logo = booking.offer.airlineLogo;

  const legs = [
    { title: t("outbound", { date: formatDayWithYear(booking.offer.outbound.date, loc) }), leg: booking.offer.outbound },
    ...(booking.offer.inbound ? [{ title: t("inbound", { date: formatDayWithYear(booking.offer.inbound.date, loc) }), leg: booking.offer.inbound }] : []),
  ];

  const point = (time: string, code: string, extra?: number) => (
    <div className="flex items-start gap-3">
      <span className="w-[62px] flex-none text-right font-display text-xl font-semibold leading-tight">
        {time}
        {extra ? <sup className="ml-[1px] text-[11px] font-extrabold text-coral-text">+{extra}</sup> : null}
      </span>
      <span className="mt-[7px] h-3 w-3 flex-none rounded-full border-[3px] border-solid border-primary bg-white" aria-hidden="true" />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="font-extrabold">
          {city(code)} <span className="text-muted">({code})</span>
        </span>
        {airport(code) && <span className="text-sm font-semibold text-muted">{airport(code)}</span>}
      </span>
    </div>
  );

  return (
    <section aria-labelledby="itinerary" className="flex flex-col gap-3">
      <h2 id="itinerary" className={h2}>{td("title")}</h2>
      {legs.map(({ title, leg }) => {
        const flights = flightsOf(leg);
        return (
          <div key={title} className="overflow-hidden rounded-[28px] border-2 border-solid border-line">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 bg-field px-6 py-3">
              <span className="text-[13px] font-extrabold uppercase tracking-[0.04em]">{title}</span>
              <span className="text-sm font-bold text-muted">
                {leg.mins > 0 && <>{dur(leg.mins)} · </>}
                {leg.via ? t("transferVia", { city: city(leg.via.code, leg.via.city) }) : t("direct")}
              </span>
            </div>
            <div className="flex flex-col gap-1 px-6 py-4">
              {flights.map((g, i) => {
                const mark = g.carrierLogo ?? (g.carrier === booking.offer.airline ? logo : undefined);
                return (
                  <div key={i} className="flex flex-col gap-1">
                    {point(g.dep, g.fromCode)}
                    <div className="flex gap-3">
                      <span className="w-[62px] flex-none" />
                      <span className="ml-[5px] w-[2px] flex-none bg-line" aria-hidden="true" />
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 py-2 pl-[9px] text-sm font-semibold text-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {mark && <img src={mark} alt="" width={20} height={20} className="h-5 w-5 object-contain" />}
                        <span className="font-extrabold text-ink">{g.carrier}</span>
                        {g.flightNumber && <span>· {g.flightNumber}</span>}
                        {g.aircraft && <span>· {g.aircraft}</span>}
                        {cabin && <span>· {cabin}{booking.offer.fareBrand ? ` (${booking.offer.fareBrand})` : ""}</span>}
                        {g.mins > 0 && <span>· {dur(g.mins)}</span>}
                      </span>
                    </div>
                    {point(g.arr, g.toCode, g.arrDayOffset)}
                    {flights[i + 1] && (
                      <div className="my-2 ml-[74px] rounded-[14px] bg-sun-soft px-4 py-2 text-sm font-bold text-sun-text">
                        {td("layover", { city: city(g.toCode), time: dur(g.layoverMins ?? (i === 0 ? (leg.via?.waitMins ?? 0) : 0)) })}
                      </div>
                    )}
                  </div>
                );
              })}
              {flights.length === 1 && leg.via && (
                <span className="ml-[74px] text-sm font-bold text-sun-text">{t("transferVia", { city: city(leg.via.code, leg.via.city) })}</span>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

/** Yolcular ve bagaj (kilolar havayolu bildirdiyse), bilet kuralları ve ödeme özeti. */
export async function BookingFacts({ booking, plan }: { booking: Booking; plan: PlanData }) {
  const td = await getTranslations("confirm.details");
  const tb = await getTranslations("confirm.bagsText");
  const tp = await getTranslations("confirm.plan");
  const loc = intlLocale(await getLocale());
  const pax = passengerBags(booking);
  const known = !!booking.includedBags || !!booking.extraBags;
  const b = booking.breakdown;
  const later = b ? booking.total - (b.fare + b.bags + b.seats - b.discount) : 0;
  const row = "flex justify-between gap-4 py-[6px]";

  return (
    <>
      {pax.length > 0 && (
        <section aria-labelledby="pax" className={card}>
          <h2 id="pax" className={h2}>{td("passengersTitle")}</h2>
          <ul className="m-0 flex list-none flex-col p-0">
            {pax.map((p, i) => (
              <li key={i} className="flex flex-col gap-2 border-0 border-t border-solid border-line py-3 first:border-t-0 first:pt-0">
                <span className="font-extrabold">
                  {p.name}
                  {p.infant && <span className="font-semibold text-muted"> · {td("infant")}</span>}
                </span>
                <span className="flex flex-wrap gap-2">
                  {p.infant ? (
                    <span className="text-sm font-semibold text-muted">{tb("infant")}</span>
                  ) : known ? (
                    p.items.map((x) => (
                      <span key={x.kind + (x.kg ?? "")} className="rounded-pill bg-field px-3 py-1 text-sm font-bold">
                        {bagItemText(tb, x)}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm font-semibold text-muted">{tp("noBags")}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {plan.bagNotes.map((n) => (
            <p key={n} className="m-0 text-[13px] font-semibold text-muted">{n}</p>
          ))}
        </section>
      )}

      <section aria-labelledby="rules" className={card}>
        <h2 id="rules" className={h2}>{td("rulesTitle")}</h2>
        {plan.rules.length ? (
          <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-[15px] font-semibold">
            {plan.rules.map((r) => <li key={r}>{r}</li>)}
          </ul>
        ) : (
          <p className="m-0 text-[15px] text-muted">{td("noRules")}</p>
        )}
      </section>

      <section aria-labelledby="payment" className={card}>
        <h2 id="payment" className={h2}>{td("paymentTitle")}</h2>
        <div className="flex flex-col text-[15px] font-semibold">
          {b && (
            <>
              <span className={row}><span>{td("fare")}</span><Price amount={b.fare} /></span>
              {b.bags > 0 && <span className={row}><span>{td("bags")}</span><Price amount={b.bags} /></span>}
              {b.seats > 0 && <span className={row}><span>{td("seats")}</span><Price amount={b.seats} /></span>}
              {b.discount > 0 && <span className={`${row} text-green-text`}><span>{td("discount")}</span><span>−<Price amount={b.discount} /></span></span>}
              {later > 0 && <span className={row}><span>{td("later")}</span><Price amount={later} /></span>}
            </>
          )}
          <span className={`${row} border-0 border-t-2 border-solid border-line pt-2 font-display text-xl`}>
            <span>{td("total")}</span>
            <Price amount={booking.total} />
          </span>
          <span className={`${row} text-muted`}><span>{td("bookedOn")}</span><span>{formatDayWithYear(booking.createdAt.slice(0, 10), loc)}</span></span>
          <span className={`${row} text-muted`}><span>{td("email")}</span><span className="break-all text-right">{booking.email}</span></span>
        </div>
      </section>
    </>
  );
}
