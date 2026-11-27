// Fiyat alarmı penceresi (/api/alert-price) için 10 dk önbellekli en düşük fiyat sorgusu.
// Sonuç sayfası canlı widget gösterdiğinde (kartlar boşken) alarm penceresi bu önbellek fiyatını kullanır.
import "server-only";
import { unstable_cache } from "next/cache";
import { cheapestFor, type AlertBest } from "./alert-criteria";
import { toTry } from "./currency";
import { getRates } from "./currency-server";
import { itemSeenAt } from "./deal-rules";
import { priceSource, searchFlightsCached } from "./flights";
import { airlineName, groupedPrices, type GroupedPriceItem } from "./providers/travelpayouts";
import { addDays, todayIso, type MultiQuery } from "./search";
import { flexQueries } from "./search-server";

const ALERT_PRICE_TTL = 10 * 60; // 10 dk

const stripCity = (c: string) => c.replace(/^city:/, "");

const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

type RawGroupedBest = {
  priceEur: number;
  airline: string;
  date: string;
  returnDate?: string;
  dep: string;
  stops: number;
  seenAt?: string;
};

async function fetchGroupedWindowBest(
  origins: string[],
  dests: string[],
  date: string,
  returnDate: string,
  flex: 0 | 3,
  direct: boolean,
  cabin: MultiQuery["cabin"],
): Promise<RawGroupedBest | null> {
  const today = todayIso();
  const minDate = flex === 3 ? [today, addDays(date, -3)].sort()[1] : date;
  const maxDate = flex === 3 ? addDays(date, 3) : date;
  const nights = returnDate ? Math.max(1, daysBetween(date, returnDate)) : 0;

  // Pencerenin kapsadığı aylar (en fazla 2 ay)
  const months = [...new Set([minDate.slice(0, 7), maxDate.slice(0, 7)])];
  const pairs: [string, string, string][] = [];
  for (const o of origins.slice(0, 3)) {
    for (const d of dests.slice(0, 3)) {
      if (o === d) continue;
      for (const m of months) pairs.push([o, d, m]);
    }
  }
  if (!pairs.length) return null;

  const settled = await Promise.allSettled(
    pairs.map(([origin, destination, m]) =>
      groupedPrices({
        origin,
        destination,
        departureAt: m,
        ...(nights > 0 ? { returnAt: m, minTripDuration: nights, maxTripDuration: nights } : {}),
        groupBy: "departure_at",
        direct: direct || undefined,
        cabin,
      }),
    ),
  );

  const candidates: GroupedPriceItem[] = [];
  for (const r of settled) {
    if (r.status !== "fulfilled") continue;
    for (const item of Object.values(r.value)) {
      if (!item || typeof item.price !== "number" || item.price <= 0 || !item.departure_at) continue;
      const dep = item.departure_at.slice(0, 10);
      if (dep < minDate || dep > maxDate) continue;
      if (direct && typeof item.transfers === "number" && item.transfers > 0) continue;
      if (nights > 0) {
        if (!item.return_at) continue;
        const ret = item.return_at.slice(0, 10);
        if (daysBetween(dep, ret) !== nights) continue;
      }
      candidates.push(item);
    }
  }
  if (!candidates.length) return null;

  candidates.sort((a, b) => a.price - b.price || (a.transfers ?? 9) - (b.transfers ?? 9));
  const best = candidates[0];
  const seenAt = itemSeenAt(best) ?? undefined;
  return {
    priceEur: best.price,
    airline: best.airline ? airlineName(best.airline) : "",
    date: best.departure_at.slice(0, 10),
    returnDate: best.return_at?.slice(0, 10),
    dep: best.departure_at.length >= 16 ? best.departure_at.slice(11, 16) : "",
    stops: typeof best.transfers === "number" ? best.transfers : 0,
    ...(seenAt && { seenAt }),
  };
}

const cachedGroupedWindowBest = unstable_cache(fetchGroupedWindowBest.bind(null), ["alert-price-tp-v1"], {
  revalidate: ALERT_PRICE_TTL,
});

/** Fiyat alarmı penceresi için seçili tarih/esneklik/aktarma kriterine uyan en ucuz önbellekli uçuş. */
export async function getAlertPreviewPrice(
  q: MultiQuery,
  opts: { flex: 0 | 3; direct: boolean },
): Promise<{ best: AlertBest | null; source: ReturnType<typeof priceSource> }> {
  const src = priceSource();

  if (src === "travelpayouts") {
    // Tam tarih için önce prices_for_dates (searchFlightsCached, 10 dk önbellekli) dene — saat & havayolu daha ayrıntılıdır
    if (opts.flex === 0) {
      const offers = await searchFlightsCached(q).catch(() => []);
      const fromExact = cheapestFor(offers, { direct: opts.direct });
      if (fromExact) return { best: fromExact, source: src };
    }

    // Esnek (±3 gün) veya tam günde prices_for_dates boşsa grouped_prices (10 dk önbellekli)
    const origins = [...new Set(q.from.map(stripCity))].sort();
    const dests = [...new Set(q.to.map(stripCity))].sort();
    const [raw, rates] = await Promise.all([
      cachedGroupedWindowBest(origins, dests, q.date, q.returnDate ?? "", opts.flex, opts.direct, q.cabin ?? "economy").catch(() => null),
      getRates(),
    ]);
    if (!raw) return { best: null, source: src };
    return {
      source: src,
      best: {
        price: toTry(raw.priceEur, "EUR", rates),
        airline: raw.airline,
        date: raw.date,
        returnDate: raw.returnDate,
        dep: raw.dep,
        stops: raw.stops,
        ...(raw.seenAt && { seenAt: raw.seenAt }),
      },
    };
  }

  // Demo / Duffel modu: mevcut önbellekli arama katmanı
  const queries = opts.flex === 3 ? [q, ...flexQueries({ ...q, flex: 3 })] : [q];
  const settled = await Promise.allSettled(queries.map((day) => searchFlightsCached(day)));
  const allOffers = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  return { best: cheapestFor(allOffers, { direct: opts.direct }), source: src };
}
