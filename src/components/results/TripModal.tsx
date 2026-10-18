"use client";

import { useEffect, useId, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCurrency } from "../CurrencyProvider";
import { formatDayWithWeekday, minsParts } from "@/lib/dates";
import { intlLocale } from "@/lib/intl";
import { locative } from "@/lib/tr-suffix";
import { bookingHref } from "@/lib/search";
import type { Leg } from "@/lib/providers/types";
import type { BagChoice } from "@/lib/providers/types";
import { fareDifferences, type Group } from "@/lib/results-filter";
import { useBagSpecText } from "./BagRules";
import { useConditionText } from "./conditions";

const dayDiff = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

/**
 * Seçilen uçuşun ayrıntısı (Kiwi'deki "Seyahat bilgileri"): solda uçuş bacakları, sağda
 * aynı uçuş için satılan paketler. Paket seçilince rezervasyona geçilir.
 */
export function TripModal({
  group,
  wantBags,
  cityNames,
  onClose,
}: {
  group: Group | null;
  wantBags: BagChoice;
  cityNames: Record<string, string>;
  onClose: () => void;
}) {
  const t = useTranslations("results.trip");
  const tc = useTranslations("common");
  const tr = useTranslations("results");
  const locale = useLocale();
  const loc = intlLocale(locale);
  const { fmt } = useCurrency();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const city = (code: string) => cityNames[code] ?? code;
  const spec = useBagSpecText();
  const detail = (...parts: (string | undefined)[]) => {
    const p = parts.filter(Boolean);
    return p.length ? ` · ${p.join(" · ")}` : "";
  };
  const dur = (m: number) => tc("duration", minsParts(m));
  const conditionText = useConditionText("results.trip");

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (group && !d.open) d.showModal();
    if (!group && d.open) d.close();
  }, [group]);

  // Pencere açılınca paketlerin rezervasyon verisi (teklif + koltuk haritası) sunucuda hazırlanır:
  // "… ile devam et"e basınca rezervasyon sayfası Duffel'ı beklemeden açılır. Sonuç beklenmez.
  useEffect(() => {
    for (const { offer: o } of group?.fares.slice(0, 3) ?? []) {
      if (!o.id.startsWith("demo_")) fetch(`/api/offer-warm?id=${encodeURIComponent(o.id)}`, { method: "POST", keepalive: true }).catch(() => {});
    }
  }, [group]);

  const offer = group?.best.offer;
  const nights = offer?.inbound ? dayDiff(offer.outbound.date, offer.inbound.date) : 0;
  const bagsWanted = wantBags.cabin > 0 || wantBags.checked > 0;

  const legBlock = (leg: Leg, title: string) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-display text-lg font-semibold">{city(leg.fromCode)} → {city(leg.toCode)}</span>
        <span className="text-sm font-bold text-muted">{title} · {dur(leg.mins)}</span>
      </div>
      <div className="flex flex-col gap-2 rounded-[20px] bg-white px-4 py-3">
        {(leg.segments ?? []).map((s, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="grid grid-cols-[70px_1fr] gap-x-3 gap-y-1">
              <span className="flex flex-col">
                <span className="font-display text-lg font-semibold leading-tight">{s.dep}</span>
                <span className="text-[12px] font-bold text-muted">{formatDayWithWeekday(s.date, loc)}</span>
              </span>
              <span className="flex flex-col">
                <span className="font-extrabold">{city(s.fromCode)} · {s.fromCode}</span>
              </span>
              <span className="text-[12px] font-bold text-muted">{dur(s.mins)}</span>
              <span className="text-[13px] font-semibold text-muted">
                {[s.carrier, s.flightNumber && t("flightNo", { no: s.flightNumber }), s.aircraft].filter(Boolean).join(" · ")}
              </span>
              <span className="font-display text-lg font-semibold leading-tight">
                {s.arr}
                {s.arrDayOffset > 0 && <sup className="text-[11px] text-coral-text">+{s.arrDayOffset}</sup>}
              </span>
              <span className="font-extrabold">{city(s.toCode)} · {s.toCode}</span>
            </div>
            {s.layoverMins !== undefined && (
              <span className="self-start rounded-pill bg-coral-soft px-3 py-[2px] text-[13px] font-extrabold">
                {t("layover", { city: city(s.toCode), wait: dur(s.layoverMins) })}
              </span>
            )}
          </div>
        ))}
        {!leg.segments?.length && (
          <span className="font-bold">{leg.dep} {leg.fromCode} → {leg.arr} {leg.toCode} · {leg.airline}</span>
        )}
      </div>
    </div>
  );

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
      className="m-auto box-border max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[1040px] overflow-y-auto rounded-[32px] border-0 bg-white p-0 text-ink shadow-search backdrop:bg-ink/50"
    >
      {offer && group && (
        <div className="flex flex-col md:flex-row">
          <div className="flex flex-col gap-4 bg-field px-5 pb-6 pt-6 md:w-[420px] md:flex-none md:px-7">
            <div className="flex items-center justify-between gap-2">
              <h2 id={titleId} className="m-0 font-display text-2xl font-semibold">{t("title")}</h2>
              <button type="button" onClick={() => ref.current?.close()} aria-label={t("close")}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-0 bg-white text-muted md:hidden">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            {legBlock(offer.outbound, tr("outbound"))}
            {offer.inbound && (
              <>
                <span className="flex items-center gap-3 text-sm font-extrabold text-muted">
                  <span className="h-px flex-1 bg-line" />
                  {t("nights", { place: locative(city(offer.outbound.toCode)), city: city(offer.outbound.toCode), n: nights })}
                  <span className="h-px flex-1 bg-line" />
                </span>
                {legBlock(offer.inbound, tr("inbound"))}
              </>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-4 px-5 pb-6 pt-6 md:px-7">
            <div className="flex items-center justify-between gap-2">
              <h3 className="m-0 font-display text-2xl font-semibold">{t("fareTitle")}</h3>
              <button type="button" onClick={() => ref.current?.close()} aria-label={t("close")}
                className="hidden h-11 w-11 cursor-pointer items-center justify-center rounded-full border-0 bg-field text-muted md:flex">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            {bagsWanted && <span className="text-sm font-bold text-green-text">{t("bagsAdded")}</span>}
            {group.fares.map(({ offer: o, price }, i) => {
              const b = o.bags;
              const kg = b.checked.kg ? ` · ${b.checked.kg} kg` : "";
              const features: { ok: boolean; text: string }[] = [
                { ok: true, text: t("personal") + detail(spec.size(o.bagSpecs?.personal)) },
                b.cabin.included
                  ? { ok: true, text: t("cabinIncluded") + detail(spec.weight(o.bagSpecs?.cabin), spec.size(o.bagSpecs?.cabin)) }
                  : b.cabin.price !== undefined && b.cabin.max > 0
                    ? { ok: false, text: t("cabinAdd", { price: fmt(b.cabin.price) }) }
                    : { ok: false, text: t("cabinNo") },
                b.checked.included
                  ? { ok: true, text: t("checkedIncluded", { n: b.checked.included, kg }) + detail(spec.size(o.bagSpecs?.checked)) }
                  : b.checked.price !== undefined && b.checked.max > 0
                    ? { ok: false, text: t("checkedAdd", { price: fmt(b.checked.price) }) }
                    : { ok: false, text: t("checkedNo") },
                ...(b.heavy?.price !== undefined && b.heavy.max > 0
                  ? [{ ok: false, text: t("heavyAdd", { kg: b.heavy.kg ?? "", price: fmt(b.heavy.price) }) }]
                  : []),
                ...(o.conditions.changeable === undefined && o.conditions.refundable === undefined
                  ? [{ ok: false, text: t("conditionsUnknown") }]
                  : [
                      ...(o.conditions.changeable !== undefined ? [{ ok: o.conditions.changeable, text: conditionText(o.conditions, "change") }] : []),
                      ...(o.conditions.refundable !== undefined ? [{ ok: o.conditions.refundable, text: conditionText(o.conditions, "refund") }] : []),
                    ]),
              ];
              return (
                <div key={o.id} className={`flex flex-col gap-3 rounded-[24px] border-[3px] border-solid px-5 py-4 ${i === 0 ? "border-primary" : "border-line"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex flex-wrap items-center gap-2 font-display text-xl font-semibold">
                      {o.airlineLogo && <img src={o.airlineLogo} alt="" width={24} height={24} className="h-6 w-6 object-contain" />}
                      {o.fareBrand ?? tr(`cabin.${o.cabin}`)}
                      <span className="text-[15px] font-bold text-muted">· {tr(`cabin.${o.cabin}`)}</span>
                      {/* Aynı adlı paketlerde fark adın yanında yazar */}
                      {fareDifferences(o, group.fares.map((f) => f.offer)).map((d) => (
                        <span key={d} className="rounded-pill bg-green-soft px-[10px] py-[2px] text-[13px] font-extrabold text-green-text">{t(`diff.${d}`)}</span>
                      ))}
                    </span>
                    {i === 0 && group.fares.length > 1 && <span className="rounded-pill bg-sun px-3 py-1 font-display text-sm font-semibold">{t("cheapest")}</span>}
                  </div>
                  <ul className="m-0 grid list-none gap-x-4 gap-y-1 p-0 sm:grid-cols-2">
                    {features.map((f) => (
                      <li key={f.text} className={`flex items-start gap-2 text-sm font-bold ${f.ok ? "text-ink" : "text-muted"}`}>
                        <span aria-hidden="true" className={f.ok ? "text-green-text" : "text-muted"}>{f.ok ? "✓" : "•"}</span>
                        {f.text}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-0 border-t-2 border-dashed border-line pt-3">
                    <span className="flex flex-col">
                      <span className="font-display text-[26px] font-bold leading-none">{fmt(price)}</span>
                      <span className="text-[13px] font-bold text-muted">{tr("perPerson")}</span>
                    </span>
                    <Link
                      href={bookingHref(o.id, wantBags)}
                      className="box-border inline-flex min-h-[48px] items-center justify-center rounded-pill bg-primary px-6 py-3 font-display text-lg font-semibold text-white no-underline"
                    >
                      {t("continue", { price: fmt(price) })}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </dialog>
  );
}
