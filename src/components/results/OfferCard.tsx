"use client";

import { useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCurrency } from "../CurrencyProvider";
import { CabinBagIcon, CheckedBagIcon, PersonalItemIcon } from "./BagIcons";
import { BagRules } from "./BagRules";
import { formatDayWithWeekday, minsParts } from "@/lib/dates";
import { intlLocale } from "@/lib/intl";
import type { Leg, Offer } from "@/lib/providers/types";

type Badge = "cheap" | "fast" | null;

export function OfferCard({
  offer,
  badge,
  cityNames,
  price,
  bagsAdded,
  fareCount,
  onSelect,
  favorite,
  onFavorite,
}: {
  /** Favorilerde mi; verilmezse kalp gösterilmez */
  favorite?: boolean;
  onFavorite?: () => void;
  offer: Offer;
  badge: Badge;
  cityNames: Record<string, string>;
  /** Yolcu başı fiyat (filtrede seçilen bagaj eklenmiş) */
  price: number;
  bagsAdded: boolean;
  /** Aynı uçuş için kaç paket var */
  fareCount: number;
  onSelect: () => void;
}) {
  const cityByCode = (code: string) => cityNames[code] ?? code;
  const t = useTranslations("results");
  const tc = useTranslations("common");
  const locale = useLocale();
  const loc = intlLocale(locale);
  const { fmt } = useCurrency();
  const [open, setOpen] = useState(false);
  const detailsId = useId();

  const dur = (m: number) => tc("duration", minsParts(m));
  const paxCount = offer.query.pax.adults + offer.query.pax.children + offer.query.pax.infants;
  const bag = offer.bagInfo;
  const chip = "inline-flex items-center gap-[6px] rounded-pill px-[10px] py-[3px] text-[13px] font-extrabold";

  const bags = [
    { key: "personal", icon: <PersonalItemIcon />, label: t("bags.personal"), on: true, note: undefined },
    { key: "cabin", icon: <CabinBagIcon />, label: t("bags.cabin"), on: bag.cabin, note: bag.cabin && offer.bagSpecs?.cabin?.kg ? `${offer.bagSpecs.cabin.kg} kg` : undefined },
    {
      key: "checked",
      icon: <CheckedBagIcon />,
      label: t("bags.checked"),
      on: !!bag.checked,
      note: bag.checked
        ? [bag.checkedCount && bag.checkedCount > 1 ? `${bag.checkedCount}×` : "", bag.checkedKg ? `${bag.checkedKg} kg` : ""].filter(Boolean).join(" ")
        : undefined,
    },
  ];

  return (
    <article className="flex flex-col overflow-hidden rounded-[28px] border-2 border-solid border-line bg-white md:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-4 px-5 py-5 md:px-6">
        <div className="flex flex-wrap items-center gap-2">
          {badge && (
            <span className={`rounded-pill px-3 py-1 font-display text-sm font-semibold text-ink ${badge === "cheap" ? "bg-sun" : "bg-blue-soft-light"}`}>
              {t(`badge.${badge}`)}
            </span>
          )}
          <span className="flex items-center gap-2 text-[15px] font-bold text-ink">
            {offer.airlineLogo && (
              <img src={offer.airlineLogo} alt="" width={24} height={24} className="h-6 w-6 flex-none object-contain" />
            )}
            {offer.airline}
          </span>
          <span className="text-[15px] font-semibold text-muted">
            · {t(`cabin.${offer.cabin}`)}
            {offer.fareBrand && ` · ${offer.fareBrand}`}
          </span>
          {onFavorite && (
            <button
              type="button"
              aria-pressed={!!favorite}
              aria-label={favorite ? t("favorite.remove") : t("favorite.add")}
              onClick={onFavorite}
              className={`ml-auto flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-0 ${favorite ? "bg-coral-soft text-coral-text" : "bg-field text-muted hover:text-ink"}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
              </svg>
            </button>
          )}
        </div>

        <LegRow leg={offer.outbound} label={t("outbound")} date={formatDayWithWeekday(offer.outbound.date, loc)} dur={dur} />
        {offer.inbound && (
          <>
            <span aria-hidden="true" className="h-0 border-0 border-t-2 border-dashed border-line" />
            <LegRow leg={offer.inbound} label={t("inbound")} date={formatDayWithWeekday(offer.inbound.date, loc)} dur={dur} />
          </>
        )}

        <div className="flex flex-wrap items-center gap-[6px]">
          {bags.map((b) => (
            <span
              key={b.key}
              className={`${chip} ${b.on ? "bg-green-soft text-green-text" : "bg-field text-muted"}`}
              title={b.on ? t("bags.included") : t("bags.notIncluded")}
            >
              {b.icon}
              <span className={b.on ? "text-ink" : "text-muted"}>
                {b.label}
                {b.note ? ` · ${b.note}` : ""}
              </span>
              <span aria-hidden="true">{b.on ? "✓" : "✕"}</span>
              <span className="sr-only">{b.on ? t("bags.included") : t("bags.notIncluded")}</span>
            </span>
          ))}
          {offer.conditions.refundable !== undefined && (
            <span className={`${chip} ${offer.conditions.refundable ? "bg-sky text-ink" : "bg-field text-muted"}`}>
              {offer.conditions.refundable ? t("conditions.refundable") : t("conditions.nonRefundable")}
            </span>
          )}
          {offer.conditions.changeable !== undefined && (
            <span className={`${chip} ${offer.conditions.changeable ? "bg-sky text-ink" : "bg-field text-muted"}`}>
              {offer.conditions.changeable ? t("conditions.changeable") : t("conditions.notChangeable")}
            </span>
          )}
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-controls={detailsId}
          onClick={() => setOpen(!open)}
          className="flex cursor-pointer items-center gap-1 self-start border-0 bg-transparent p-0 text-[15px] font-extrabold text-primary"
        >
          {open ? t("hideDetails") : t("details")}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={open ? "rotate-180" : ""}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {open && (
          <div id={detailsId} className="flex flex-col gap-4 rounded-[20px] bg-field px-4 py-4">
            <BagRules offer={offer} />
            {[
              { leg: offer.outbound, label: t("outbound") },
              ...(offer.inbound ? [{ leg: offer.inbound, label: t("inbound") }] : []),
            ].map(({ leg, label }) => (
              <div key={label} className="flex flex-col gap-2">
                <span className="text-sm font-extrabold text-muted">
                  {label} · {formatDayWithWeekday(leg.date, loc)} · {dur(leg.mins)}
                </span>
                {(leg.segments ?? []).map((s, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-display text-lg font-semibold">
                        {s.dep} {s.fromCode} → {s.arr}
                        {s.arrDayOffset > 0 && <sup className="text-[11px] text-coral-text">+{s.arrDayOffset}</sup>} {s.toCode}
                      </span>
                      <span className="text-sm font-semibold text-muted">
                        {cityByCode(s.fromCode)} → {cityByCode(s.toCode)} · {dur(s.mins)}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-muted">
                      {[s.carrier, s.flightNumber, s.aircraft].filter(Boolean).join(" · ")}
                    </span>
                    {s.layoverMins !== undefined && (
                      <span className="mt-1 self-start rounded-pill bg-coral-soft px-3 py-[2px] text-[13px] font-extrabold">
                        {t("layover", { city: cityByCode(s.toCode), code: s.toCode, wait: dur(s.layoverMins) })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 border-0 border-t-2 border-solid border-line bg-field px-5 py-4 md:w-[210px] md:flex-col md:items-stretch md:justify-center md:border-l-2 md:border-t-0 md:px-5">
        <div className="flex flex-col md:items-center">
          <span className="font-display text-[30px] font-bold leading-[1.1]">{fmt(price)}</span>
          <span className="text-[13px] font-bold text-muted">{t("perPerson")}</span>
          {bagsAdded && <span className="text-[13px] font-bold text-green-text">{t("withBags")}</span>}
          {paxCount > 1 && !bagsAdded && <span className="text-[13px] font-bold text-muted">{t("totalFor", { count: paxCount, total: fmt(offer.total) })}</span>}
          {fareCount > 1 && <span className="text-[13px] font-bold text-primary">{t("fareOptions", { n: fareCount })}</span>}
        </div>
        <button
          type="button"
          onClick={onSelect}
          className="box-border inline-flex min-h-[48px] cursor-pointer items-center justify-center rounded-pill border-0 bg-primary px-[26px] py-3 font-display text-[19px] font-semibold leading-[normal] text-white"
        >
          {t("select")}
        </button>
      </div>
    </article>
  );
}

function LegRow({ leg, label, date, dur }: { leg: Leg; label: string; date: string; dur: (m: number) => string }) {
  const t = useTranslations("results");
  const tc = useTranslations("common");
  const stopsText = leg.stops === 0 ? tc("direct") : leg.stops === 1 ? tc("oneStop") : tc("stops", { n: leg.stops });
  const viaCodes = (leg.segments ?? []).slice(0, -1).map((s) => s.toCode);
  const time = "font-display text-[26px] font-semibold leading-none";
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2 md:grid-cols-[110px_auto_1fr_auto]">
      <div className="col-span-3 flex items-baseline gap-2 md:col-span-1 md:flex-col md:gap-0">
        <span className="text-sm font-extrabold text-ink">{label}</span>
        <span className="text-[13px] font-bold text-muted">{date}</span>
      </div>
      <div className="flex flex-col">
        <span className={time}>{leg.dep}</span>
        <span className="text-[13px] font-extrabold text-muted">{leg.fromCode}</span>
      </div>
      <div className="flex min-w-[90px] flex-col items-center gap-[2px]">
        <span className="text-[13px] font-bold text-muted">{dur(leg.mins)}</span>
        <span className="relative flex w-full items-center">
          <span className="w-full border-0 border-t-[3px] border-dotted border-blue-soft" />
          {viaCodes.map((c, i) => (
            <span
              key={c + i}
              className="absolute h-[10px] w-[10px] -translate-x-1/2 rounded-full border-2 border-solid border-white bg-coral"
              style={{ left: `${((i + 1) / (viaCodes.length + 1)) * 100}%` }}
            />
          ))}
        </span>
        <span className={`text-[13px] font-extrabold ${leg.stops ? "text-coral-text" : "text-green-text"}`}>
          {stopsText}
          {viaCodes.length > 0 && ` · ${viaCodes.join(", ")}`}
        </span>
        {leg.via && leg.via.waitMins > 0 && <span className="sr-only">{t("layover", { city: leg.via.city, code: leg.via.code, wait: dur(leg.via.waitMins) })}</span>}
      </div>
      <div className="flex flex-col items-end">
        <span className={`${time} relative`}>
          {leg.arr}
          {leg.arrDayOffset > 0 && (
            <sup className="absolute -right-3 -top-2 text-[12px] font-extrabold text-coral-text">+{leg.arrDayOffset}</sup>
          )}
        </span>
        <span className="text-[13px] font-extrabold text-muted">{leg.toCode}</span>
      </div>
    </div>
  );
}
