"use client";

import { brand } from "@/config/brand";
import { outboundPartner } from "@/config/affiliate";
import { seenDays } from "@/lib/freshness";
import { formatDayWithWeekday } from "@/lib/dates";
import { intlLocale } from "@/lib/intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuthUi } from "../auth/LoginModal";
import { getFavorites, toggleFavorite } from "@/actions/user";
import { favoriteKey } from "@/lib/user-types";
import { useLocale, useTranslations } from "next-intl";
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

type Sort = "best" | "cheap" | "fast" | "direct";
const SORTS: Sort[] = ["best", "cheap", "fast", "direct"];

/** Gidiş + dönüş toplam yolculuk süresi */
const totalMins = (o: Offer) => o.outbound.mins + (o.inbound?.mins ?? 0);
const totalStops = (o: Offer) => o.outbound.stops + (o.inbound?.stops ?? 0);

/**
 * "En iyi" (Kiwi'deki gibi): fiyat, toplam süre ve aktarma birlikte. Her biri listedeki en iyiye göre 0–1 arası
 * ölçeklenir; fiyat %60, süre %30, aktarma sayısı %10 ağırlıklı. Düşük puan önde.
 */
function bestScores(groups: Group[]): Map<string, number> {
  const prices = groups.map((g) => g.best.price);
  const mins = groups.map((g) => totalMins(g.best.offer));
  const stops = groups.map((g) => totalStops(g.best.offer));
  // Önbellekli fiyatlarda taze olan öne: eski fiyat satıcıda değişmiş olabilir
  const ages = groups.map((g) => (g.best.offer.seenAt ? Math.min(7, seenDays(g.best.offer.seenAt)) : 0));
  const norm = (v: number, list: number[]) => {
    const lo = Math.min(...list);
    const hi = Math.max(...list);
    return hi > lo ? (v - lo) / (hi - lo) : 0;
  };
  return new Map(
    groups.map((g, i) => [g.key, 0.6 * norm(prices[i], prices) + 0.3 * norm(mins[i], mins) + 0.1 * norm(stops[i], stops) + 0.2 * (ages[i] / 7)]),
  );
}

export type ResultsTip = { href: ReturnType<typeof searchHref>; day: string; price: number; save: number } | null;

export function ResultsView({
  offers,
  oneWay,
  tip,
  note,
  cityNames,
  settled = true,
  initialBags,
  onFiltersChange,
  liveHref,
  nearby,
  live,
}: {
  /** Canlı sonuçlar (White Label widget): kayıtlı uçuş az ya da yokken gösterilir */
  live?: React.ReactNode;
  nearby?: { sections: { title: "nearbyTitle" | "nearbyOut" | "nearbyBack"; offers: Offer[]; want: { date: string; returnDate?: string } }[]; cityNames: Record<string, string> };
  /** Sonuç yoksa ortakta canlı arama bağlantısı (ortaklık modu) */
  liveHref?: string;
  initialBags?: { cabin: number; checked: number };
  /** Filtre değişince (ör. fiyat alarmı penceresi aynı aktarma ve bagaj seçimiyle açılsın) */
  onFiltersChange?: (f: Filters) => void;
  offers: Offer[];
  oneWay: boolean;
  tip: ResultsTip;
  /** "örnek veri" / "test modu" etiketi */
  note?: string;
  /** Kod → yerel şehir adı */
  cityNames: Record<string, string>;
  /** Liste kesinleşmediyse (havayolları hâlâ yanıt veriyorsa) rozet verilmez. */
  settled?: boolean;
}) {
  const t = useTranslations("results");
  const { fmt } = useCurrency();
  const [sort, setSort] = useState<Sort>("best");
  const [filters, setFilters] = useState<Filters>(() => (initialBags ? { ...DEFAULT_FILTERS, bags: initialBags } : DEFAULT_FILTERS));
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Group | null>(null);
  useEffect(() => onFiltersChange?.(filters), [filters, onFiltersChange]);

  // Favoriler (girişliyse): kalbe basınca hesaba eklenir/çıkarılır; girişsizse giriş penceresi açılır
  const { signedIn, openLogin } = useAuthUi();
  const [favKeys, setFavKeys] = useState<Set<string>>(new Set());
  const [favNote, setFavNote] = useState<string | null>(null);
  useEffect(() => {
    if (!signedIn) return;
    getFavorites().then((r) => r.ok && setFavKeys(new Set(r.value.map((f) => f.data.key)))).catch(() => {});
  }, [signedIn]);
  const toggleFav = (o: Offer, price: number) => {
    if (!signedIn) return openLogin();
    const key = favoriteKey(o);
    const q = o.query;
    toggleFavorite({
      key,
      airline: o.airline,
      outbound: o.outbound,
      inbound: o.inbound,
      price,
      query: { from: [q.from], to: [q.to], date: q.date, returnDate: q.returnDate, pax: q.pax, cabin: q.cabin ?? "economy" },
    }).then((r) => {
      if (!r.ok) return setFavNote(t(r.error === "signIn" ? "favorite.signIn" : "favorite.error"));
      setFavKeys((s) => {
        const n = new Set(s);
        if (r.value) n.add(key);
        else n.delete(key);
        return n;
      });
      setFavNote(r.value ? t("favorite.added") : null);
    });
  };

  const groups = useMemo(() => groupByItinerary(applyFilters(offers, filters)), [offers, filters]);
  // Sonuç yokken filtreler yakın tarih kartlarına uygulanır; filtre seçenekleri de onlardan gelir
  const pool = useMemo(() => (offers.length ? offers : (nearby?.sections.flatMap((s) => s.offers) ?? [])), [offers, nearby]);
  const nearbyShown = useMemo(
    () => nearby?.sections.map((s) => ({ ...s, offers: applyFilters(s.offers, filters).map((p) => p.offer) })),
    [nearby, filters],
  );

  // Rozetler sıralamadan bağımsız, filtrelenmiş sonuçlar üzerinden hesaplanır.
  const cheapestKey = useMemo(() => [...groups].sort((a, b) => a.best.price - b.best.price)[0]?.key, [groups]);
  const fastestKey = useMemo(() => [...groups].sort((a, b) => totalMins(a.best.offer) - totalMins(b.best.offer))[0]?.key, [groups]);

  const list = useMemo(() => {
    let l = [...groups];
    if (sort === "best") {
      const score = bestScores(l);
      l.sort((a, b) => score.get(a.key)! - score.get(b.key)! || a.best.price - b.best.price);
    }
    if (sort === "cheap") l.sort((a, b) => a.best.price - b.best.price);
    if (sort === "fast") l.sort((a, b) => totalMins(a.best.offer) - totalMins(b.best.offer));
    if (sort === "direct")
      l = l.filter(({ best: { offer: o } }) => o.outbound.stops === 0 && (o.inbound?.stops ?? 0) === 0).sort((a, b) => a.best.price - b.best.price);
    return l;
  }, [groups, sort]);

  // Havayolu filtresi listesi: tüm sonuçlardaki havayolları ve en düşük fiyatları
  const airlines = useMemo(() => {
    const min = new Map<string, number>();
    for (const o of pool) for (const c of carriersOf(o)) min.set(c, Math.min(min.get(c) ?? Infinity, o.price));
    return [...min.entries()].map(([name, price]) => ({ name, price })).sort((a, b) => a.price - b.price);
  }, [pool]);
  const bounds = useMemo(() => durationBounds(pool), [pool]);
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
        <FiltersPanel value={filters} onChange={setFilters} airlines={airlines} oneWay={oneWay} bounds={bounds} hideBags={pool.every((o) => o.bagsUnknown)} />
      </aside>

      <div className="flex min-w-0 flex-col gap-5">
        {/* Telefonda tek satır, yana kayar */}
        <div role="tablist" aria-label={t("sortLabel")} className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
          {SORTS.map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setSort(s)}
                className={`min-h-[44px] flex-none cursor-pointer whitespace-nowrap rounded-pill border-0 px-[18px] py-[10px] font-display text-base md:px-[22px] md:text-[17px] font-semibold leading-[normal] ${
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
          {sort === "best" && <> · {t("bestHint")}</>}
          {note && <> · {note}</>}
        </span>

        {favNote && (
          <p role="status" className="m-0 rounded-[16px] bg-coral-soft px-4 py-2 text-[15px] font-bold">
            {favNote} <Link href={{ pathname: "/hesap", hash: "favoriler" }} className="font-extrabold">{t("favorite.see")}</Link>
          </p>
        )}
        {offers.length === 0 &&
          (liveHref ? (
            <div className="flex flex-col items-start gap-3 rounded-[24px] bg-sky px-5 py-5">
              <p className="m-0 font-bold text-ink">{outboundPartner() === "whitelabel" ? t("noResultsCachedWL") : t("noResultsCached", { partner: outboundPartner(), brand: brand.name })}</p>
              <a href={liveHref} target="_blank" rel="sponsored nofollow noopener" className="inline-flex min-h-[48px] items-center rounded-pill bg-primary px-6 font-display text-lg font-semibold text-white no-underline">
                {outboundPartner() === "whitelabel" ? t("liveSearchWL") : t("liveSearch", { partner: outboundPartner(), brand: brand.name })}
              </a>
            </div>
          ) : (
            <p className="m-0 font-bold text-muted">{t("noResults")}</p>
          ))}
        {list.length === 0 && live}
        {offers.length === 0 && nearbyShown && nearby && (
          <>
            {nearbyShown.every((s) => !s.offers.length) && <p className="m-0 font-bold text-muted">{t("empty")}</p>}
            {nearbyShown.filter((s) => s.offers.length).map((s, i) => (
              <section key={s.title} className="flex flex-col gap-4">
                <h2 className="m-0 mt-2 font-display text-[24px] font-bold">{t(s.title)}</h2>
                {s.title !== "nearbyTitle" && i === 0 && <p className="m-0 -mt-2 text-[15px] font-semibold text-muted">{t("nearbySeparate")}</p>}
                {s.offers.map((o) => (
                  <div key={o.id} className="flex flex-col gap-2">
                    <DateShift want={s.want} offer={o} />
                    <OfferCard offer={o} price={o.price} bagsAdded={false} fareCount={1} onSelect={() => {}} cityNames={nearby.cityNames} badge={null} />
                  </div>
                ))}
              </section>
            ))}
          </>
        )}
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
            badge={!settled ? null : g.key === cheapestKey ? "cheap" : g.key === fastestKey ? "fast" : null}
            favorite={favKeys.has(favoriteKey(g.best.offer))}
            onFavorite={() => toggleFav(g.best.offer, g.best.price)}
          />
        ))}

        {/* Az kayıtlı sonuç (seyrek rota): tüm uçuşlar ve güncel fiyat için canlı arama */}
        {list.length > 0 && list.length < 5 && live}
        {!live && liveHref && list.length > 0 && list.length < 5 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-sky px-5 py-4">
            <p className="m-0 min-w-[220px] flex-1 font-bold text-ink">{t("fewResults")}</p>
            <a href={liveHref} target="_blank" rel="sponsored nofollow noopener" className="inline-flex min-h-[44px] items-center rounded-pill bg-primary px-5 font-display text-[16px] font-semibold text-white no-underline">
              {outboundPartner() === "whitelabel" ? t("liveSearchWL") : t("liveSearch", { partner: outboundPartner(), brand: brand.name })}
            </a>
          </div>
        )}

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
      <TripModal group={selected && (groups.find((g) => g.key === selected.key) ?? selected)} wantBags={filters.bags} cityNames={cityNames} onClose={() => setSelected(null)} />
    </div>
  );
}

/** Yakın tarih kartının üstünde: seçilen günden farklıysa hangi gün olduğu ve kaç gün kaydığı */
function DateShift({ want, offer }: { want: { date: string; returnDate?: string }; offer: Offer }) {
  const t = useTranslations("results");
  const loc = intlLocale(useLocale());
  const parts = [
    { label: t("outbound"), want: want.date, got: offer.outbound.date },
    ...(want.returnDate && offer.inbound ? [{ label: t("inbound"), want: want.returnDate, got: offer.inbound.date }] : []),
  ].map((p) => ({ ...p, n: Math.round((Date.parse(p.got) - Date.parse(p.want)) / 86_400_000) }));
  if (parts.every((p) => p.n === 0)) return null;
  return (
    <p className="m-0 flex flex-wrap gap-2 text-[14px] font-bold">
      {parts.map((p) => (
        <span key={p.label} className={`rounded-pill px-3 py-1 ${p.n ? "bg-sun-soft text-ink" : "bg-field text-muted"}`}>
          {p.label}: {formatDayWithWeekday(p.got, loc)}
          {p.n !== 0 && <> · {t("shiftDays", { n: Math.abs(p.n), dir: p.n < 0 ? "before" : "after" })}</>}
        </span>
      ))}
    </p>
  );
}
