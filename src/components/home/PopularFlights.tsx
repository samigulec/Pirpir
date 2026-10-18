"use client";

import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCurrency } from "../CurrencyProvider";
import {
  Amsterdam, Ankara, Antalya, Barselona, Bodrum, Dubai, Gaziantep, Istanbul, Izmir, Kapadokya, Kayseri, Konya, Lizbon, Londra,
  NewYork, Paris, Roma, Trabzon,
} from "../cities";
import type { CategoryId, PopularDestination } from "@/data/mock/home";
import type { Deal, DealMap } from "@/lib/deals";
import { coreCityByCode, countryName, expandMetro, findCoreAirport } from "@/data/airports-core";
import { searchHref } from "@/lib/search";
import { formatRangeShort, minsParts } from "@/lib/dates";
import { intlLocale } from "@/lib/intl";

const CATEGORIES: CategoryId[] = ["all", "tr", "eu", "sea", "city"];

const ILLUSTRATIONS = {
  ist: Istanbul, ayt: Antalya, fco: Roma, bcn: Barselona, lhr: Londra, cdg: Paris,
  adb: Izmir, bjv: Bodrum, dxb: Dubai, nyc: NewYork, lis: Lizbon, ams: Amsterdam,
  nav: Kapadokya, asr: Kayseri, kya: Konya, tzx: Trabzon, esb: Ankara, gzt: Gaziantep,
};

/** Başta gösterilen kart sayısı (masaüstünde üç satır) */
const INITIAL = 9;

/** "En ucuz" ve "En kısa uçuş" rozetleri bulunan fırsatlardan hesaplanır (en kısa: direkt uçuşlar arasında). */
function computedBadges(deals: DealMap, ids: string[]) {
  const found = ids.map((id) => [id, deals[id]] as const).filter((e): e is readonly [string, Deal] => !!e[1]);
  const cheapest = [...found].sort((a, b) => a[1].price - b[1].price)[0]?.[0];
  // En kısa uçuş en ucuz kartla aynıysa ikinci bir rozet verilmez (yanlış karta "en kısa" yazılmasın).
  const shortest = found.filter(([, d]) => d.stops === 0).sort((a, b) => a[1].mins - b[1].mins)[0]?.[0];
  return { cheapest, fastest: shortest === cheapest ? undefined : shortest };
}

export function PopularFlights({
  fromLabel,
  fromCodes,
  destinations,
  deals,
  loading,
  live,
}: {
  fromLabel: string;
  fromCodes: string[];
  destinations: PopularDestination[];
  deals: DealMap;
  loading: boolean;
  live: boolean;
}) {
  const t = useTranslations("home.popular");
  const tc = useTranslations("common");
  const { fmt } = useCurrency();
  const locale = useLocale();
  const loc = intlLocale(locale);
  const [cat, setCat] = useState<CategoryId>("all");
  const [expanded, setExpanded] = useState(false);

  // Kalkış şehriyle aynı yerdeki kart gösterilmez (İstanbul'dan İstanbul'a fırsat olmaz).
  const origin = new Set(fromCodes.flatMap((c) => expandMetro(c)));
  const available = destinations.filter((d) => !d.airports.some((a) => origin.has(a)) && !origin.has(d.code));
  const inCategory = available.filter((d) => cat === "all" || d.tags.includes(cat));
  const shown = expanded ? inCategory : inCategory.slice(0, INITIAL);
  const hidden = inCategory.length - shown.length;
  const badges = computedBadges(deals, available.map((d) => d.id));

  // Fiyat takviminden gelen fiyatın ne zaman bulunduğu: "2 saat önce"
  const ago = (iso: string) => {
    const mins = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60000));
    const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto" });
    return mins < 60 ? rtf.format(-mins, "minute") : rtf.format(-Math.round(mins / 60), "hour");
  };
  const stopsLabel = (n: number) => (n === 0 ? tc("direct") : n === 1 ? tc("oneStop") : tc("stops", { n }));

  return (
    <section id="populer" className="mx-auto flex max-w-page flex-col gap-[22px] px-4 pt-12 md:px-6 md:pt-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-[2px]">
          <span className="font-extrabold text-muted">{t("from", { city: fromLabel })}</span>
          <h2 className="m-0 font-display text-[40px] font-bold leading-[1.1]">{t("title")}</h2>
        </div>
        <div role="tablist" aria-label={t("categoryLabel")} className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const on = cat === c;
            return (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setCat(c);
                  setExpanded(false);
                }}
                className={`min-h-[44px] cursor-pointer rounded-pill border-0 px-[18px] leading-[normal] py-[10px] font-display text-base font-semibold ${
                  on ? "bg-ink text-white" : "bg-field text-ink"
                }`}
              >
                {t(`categories.${c}`)}
              </button>
            );
          })}
        </div>
      </div>

      <div
        aria-busy={loading}
        className={`grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-[18px] transition-opacity ${loading ? "opacity-60" : ""}`}
      >
        {shown.map((d) => {
          const Illustration = ILLUSTRATIONS[d.id];
          const deal = deals[d.id];
          const href = searchHref({ from: fromCodes, to: d.searchCode, ...(deal && { date: deal.date, returnDate: deal.returnDate }) });
          const badge = d.id === badges.cheapest ? t("badges.cheapest") : d.id === badges.fastest ? t("badges.fastest") : t(`cards.${d.id}.badge`);
          return (
            <Link
              key={d.id}
              href={href}
              className="flex flex-col gap-3 rounded-[30px] border-2 border-solid border-line bg-white px-[10px] pb-[18px] pt-[10px] text-ink no-underline"
            >
              <div className="relative h-[180px] overflow-hidden rounded-[22px]">
                <Illustration aria-label={t(`cards.${d.id}.alt`)} className="block h-full w-full" />
                <span className="absolute left-3 top-3 rounded-pill bg-white px-3 py-1 font-display text-sm font-semibold">{badge}</span>
              </div>
              <div className="flex items-end justify-between gap-3 px-2">
                <div className="flex flex-col">
                  <span className="font-display text-[26px] font-semibold leading-[1.15]">{coreCityByCode(d.code, locale)}</span>
                  <span className="text-[15px] font-bold text-muted">
                    {countryName(findCoreAirport(d.code)?.country ?? "", locale)} · {(deal?.airports ?? d.airports).join(", ")}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  {deal ? (
                    <>
                      <span className="text-[13px] font-bold text-muted">{tc("roundTrip")}</span>
                      <span className="font-display text-[26px] font-bold leading-[1.15]">{fmt(deal.price)}</span>
                      {deal.seenAt && <span suppressHydrationWarning className="text-[12px] font-bold text-muted">{t("seen", { time: ago(deal.seenAt) })}</span>}
                    </>
                  ) : (
                    <span className="font-display text-lg font-semibold text-primary">{t("seePrices")}</span>
                  )}
                </div>
              </div>
              {deal && (
                <div className="flex flex-wrap gap-[6px] px-2">
                  <span className="rounded-pill bg-field px-[10px] py-[3px] text-[13px] font-extrabold">
                    {stopsLabel(deal.stops)} · {tc("duration", minsParts(deal.mins, true))}
                  </span>
                  <span className="rounded-pill bg-field px-[10px] py-[3px] text-[13px] font-extrabold">{formatRangeShort(deal.date, deal.returnDate, loc)}</span>
                  <span className="rounded-pill bg-field px-[10px] py-[3px] text-[13px] font-extrabold">{deal.airlines.join(" · ")}</span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
      {(hidden > 0 || expanded) && inCategory.length > INITIAL && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
          className="min-h-[48px] cursor-pointer self-center rounded-pill border-2 border-solid border-line bg-white px-6 py-3 font-display text-lg font-semibold leading-[normal] text-ink hover:border-primary"
        >
          {expanded ? t("showLess") : t("showMore", { n: hidden })}
        </button>
      )}
      <p className="m-0 text-sm font-semibold text-muted">{t(live ? "noteLive" : "noteSample")}</p>
    </section>
  );
}
