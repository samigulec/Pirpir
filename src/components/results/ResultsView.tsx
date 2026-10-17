"use client";

import { Link } from "@/i18n/navigation";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useCurrency } from "../CurrencyProvider";
import { Bulut } from "../characters";
import { OfferCard } from "./OfferCard";
import { FiltersPanel } from "./FiltersPanel";
import { TripModal } from "./TripModal";
import {
  DEFAULT_FILTERS,
  activeFilterCount,
  applyFilters,
  carriersOf,
  durationBounds,
  groupByItinerary,
  type Filters,
  type Group,
} from "@/lib/results-filter";
import type { Offer } from "@/lib/providers/types";
import type { searchHref } from "@/lib/search";

type Sort = "cheap" | "fast" | "direct";
const SORTS: Sort[] = ["cheap", "fast", "direct"];

/** Gidiş + dönüş toplam yolculuk süresi */
const totalMins = (o: Offer) => o.outbound.mins + (o.inbound?.mins ?? 0);

export type ResultsTip = { href: ReturnType<typeof searchHref>; day: string; price: number; save: number } | null;

export function ResultsView({
  offers,
  oneWay,
  tip,
  note,
  cityNames,
}: {
  offers: Offer[];
  oneWay: boolean;
  tip: ResultsTip;
  /** "örnek veri" / "test modu" etiketi */
  note?: string;
  /** Kod → yerel şehir adı */
  cityNames: Record<string, string>;
}) {
  const t = useTranslations("results");
  const { fmt } = useCurrency();
  const [sort, setSort] = useState<Sort>("cheap");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Group | null>(null);

  const groups = useMemo(() => groupByItinerary(applyFilters(offers, filters)), [offers, filters]);

  // Rozetler sıralamadan bağımsız, filtrelenmiş sonuçlar üzerinden hesaplanır.
  const cheapestKey = useMemo(() => [...groups].sort((a, b) => a.best.price - b.best.price)[0]?.key, [groups]);
  const fastestKey = useMemo(() => [...groups].sort((a, b) => totalMins(a.best.offer) - totalMins(b.best.offer))[0]?.key, [groups]);

  const list = useMemo(() => {
    let l = [...groups];
    if (sort === "cheap") l.sort((a, b) => a.best.price - b.best.price);
    if (sort === "fast") l.sort((a, b) => totalMins(a.best.offer) - totalMins(b.best.offer));
    if (sort === "direct")
      l = l.filter(({ best: { offer: o } }) => o.outbound.stops === 0 && (o.inbound?.stops ?? 0) === 0).sort((a, b) => a.best.price - b.best.price);
    return l;
  }, [groups, sort]);

  // Havayolu filtresi listesi: tüm sonuçlardaki havayolları ve en düşük fiyatları
  const airlines = useMemo(() => {
    const min = new Map<string, number>();
    for (const o of offers) for (const c of carriersOf(o)) min.set(c, Math.min(min.get(c) ?? Infinity, o.price));
    return [...min.entries()].map(([name, price]) => ({ name, price })).sort((a, b) => a.price - b.price);
  }, [offers]);
  const bounds = useMemo(() => durationBounds(offers), [offers]);
  const active = activeFilterCount(filters);

  return (
    <div className="grid items-start gap-5 md:grid-cols-[260px_minmax(0,1fr)] md:gap-8">
      <button
        type="button"
        aria-expanded={showFilters}
        aria-controls="filters"
        onClick={() => setShowFilters(!showFilters)}
        className="min-h-[48px] cursor-pointer rounded-pill border-2 border-solid border-line bg-white px-5 font-display text-lg font-semibold leading-[normal] text-ink md:hidden"
      >
        {active ? t("filters.active", { n: active }) : t("filters.show")}
      </button>
      <aside id="filters" className={`${showFilters ? "block" : "hidden"} rounded-[28px] bg-field px-5 py-5 md:sticky md:top-4 md:block md:max-h-[calc(100vh-32px)] md:overflow-y-auto`}>
        <FiltersPanel value={filters} onChange={setFilters} airlines={airlines} oneWay={oneWay} bounds={bounds} />
      </aside>

      <div className="flex min-w-0 flex-col gap-5">
        <div role="tablist" aria-label={t("sortLabel")} className="flex flex-wrap gap-2">
          {SORTS.map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setSort(s)}
                className={`min-h-[44px] cursor-pointer rounded-pill border-0 px-[22px] py-[10px] font-display text-[17px] font-semibold leading-[normal] ${
                  on ? "bg-ink text-white" : "bg-field text-ink"
                }`}
              >
                {t(`sort.${s}`)}
              </button>
            );
          })}
        </div>
        <span className="-mt-2 text-sm font-bold text-muted">
          {t("count", { count: list.length })} · {oneWay ? t("countNoteOneWay") : t("countNote")}
          {note && <> · {note}</>}
        </span>

        {offers.length === 0 && <p className="m-0 font-bold text-muted">{t("noResults")}</p>}
        {offers.length > 0 && list.length === 0 && <p className="m-0 font-bold text-muted">{t("empty")}</p>}

        {list.map((g) => (
          <OfferCard
            key={g.key}
            offer={g.best.offer}
            price={g.best.price}
            bagsAdded={g.best.bagExtra > 0}
            fareCount={g.fares.length}
            onSelect={() => setSelected(g)}
            cityNames={cityNames}
            badge={g.key === cheapestKey ? "cheap" : g.key === fastestKey ? "fast" : null}
          />
        ))}

        {tip && (
          <div className="flex flex-wrap items-center gap-[18px] rounded-[28px] bg-sun-soft px-6 py-5 md:flex-nowrap">
            <Bulut highlights={false} width={90} height={62} className="flex-none" />
            <div className="flex min-w-[200px] flex-1 flex-col gap-[2px]">
              <span className="font-display text-xl font-semibold">{t.rich("tip.title", { price: () => fmt(tip.save) })}</span>
              <span className="text-muted">{t.rich("tip.text", { day: tip.day, price: () => fmt(tip.price) })}</span>
            </div>
            <Link href={tip.href} className="ml-auto whitespace-nowrap py-[10px] font-extrabold">
              {t("tip.cta")}
            </Link>
          </div>
        )}
      </div>
      <TripModal group={selected} wantBags={filters.bags} cityNames={cityNames} onClose={() => setSelected(null)} />
    </div>
  );
}
