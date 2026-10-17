// Ana sayfadaki fırsatlar: popüler uçuş kartları, karakter ipuçları ve popüler rotalar.
// Fiyatlar uydurulmaz; arama sonuçlarıyla aynı sağlayıcıdan (canlı Duffel ya da örnek veri)
// önümüzdeki hafta sonları için aranır ve birkaç saat önbellekte tutulur.
import "server-only";
import { unstable_cache } from "next/cache";
import { popularDestinations, popularRoutes } from "@/data/mock/home";
import { dataMode, searchFlights } from "./flights";
import { addDays, todayIso, type MultiQuery } from "./search";
import type { Offer } from "./providers/types";

export type Deal = {
  /** Kişi başı en düşük gidiş-dönüş fiyatı (TRY). */
  price: number;
  date: string;
  returnDate: string;
  /** En ucuz teklifin gidiş bacağı */
  stops: number;
  mins: number;
  /** Bulunan havayolları, ucuzdan pahalıya (en fazla 3) */
  airlines: string[];
  /** Bulunan varış havalimanları (en fazla 3) */
  airports: string[];
};

export type DealMap = Record<string, Deal | null>;

const REVALIDATE = 6 * 3600;

/** Önümüzdeki hafta sonu kaçamakları: Cuma gidiş, Pazartesi dönüş; ilk Cuma en az iki hafta sonra. */
export function weekendTrips(count: number, now = new Date()): [string, string][] {
  const today = todayIso(now);
  const dow = new Date(`${today}T00:00:00Z`).getUTCDay();
  const firstFriday = addDays(today, ((5 - dow + 7) % 7) + 14);
  return Array.from({ length: count }, (_, i) => {
    const d = addDays(firstFriday, i * 7);
    return [d, addDays(d, 3)];
  });
}

// Canlı API'de her arama gerçek istek ve sayfa üretimi uzamasın diye tek hafta sonu aranır.
const tripCount = () => (dataMode() === "demo" ? 4 : 1);

async function findDeal(from: string[], to: string, trips: [string, string][]): Promise<Deal | null> {
  const settled = await Promise.allSettled(
    trips.map(([date, returnDate]) =>
      searchFlights({ from, to: [to], date, returnDate, pax: { adults: 1, children: 0, infants: 0 }, cabin: "economy" }),
    ),
  );
  settled.forEach((r) => r.status === "rejected" && console.error("Fırsat araması başarısız:", from.join(","), to, r.reason));
  const offers: Offer[] = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  if (!offers.length) return null;
  offers.sort((a, b) => a.price - b.price);
  const best = offers[0];
  const distinct = (list: string[]) => [...new Set(list)].slice(0, 3);
  return {
    price: best.price,
    date: best.query.date,
    returnDate: best.query.returnDate ?? addDays(best.query.date, 3),
    stops: best.outbound.stops,
    mins: best.outbound.mins,
    airlines: distinct(offers.flatMap((o) => o.airline.split(" + "))),
    airports: distinct(offers.map((o) => o.outbound.toCode)),
  };
}

/** Canlı API'yi boğmamak için aynı anda en fazla `limit` rota aranır. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

const concurrency = () => (dataMode() === "demo" ? 16 : 3);

// Her rota ayrı önbelleklenir: biri başarısız olsa da diğerlerinin fiyatı saatlerce aynı kalır.
// Bulunamayan rota hata fırlatır; böylece önbelleğe "yok" yazılmaz, sonraki ziyarette yeniden denenir.
// `mode` yalnızca önbellek anahtarı için: örnek veriden canlıya geçince eski fiyatlar gösterilmez.
const cachedDeal = unstable_cache(
  async (from: string[], to: string, trips: [string, string][], _mode: string): Promise<Deal> => {
    const deal = await findDeal(from, to, trips);
    if (!deal) throw new Error(`Fırsat bulunamadı: ${from.join(",")} → ${to}`);
    return deal;
  },
  ["home-deal"],
  { revalidate: REVALIDATE },
);

async function dealFor(from: string[], to: string): Promise<Deal | null> {
  try {
    return await cachedDeal([...from].sort(), to, weekendTrips(tripCount()), dataMode());
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    return null;
  }
}

export const routeKey = (r: { fromCode: string; toCode: string }) => `${r.fromCode}-${r.toCode}`;

/** Popüler uçuş kartları için seçilen kalkış yerlerinden fırsatlar. */
export async function getDestinationDeals(from: string[]): Promise<DealMap> {
  const entries = await mapLimit(popularDestinations, concurrency(), async (d) => [d.id, await dealFor(from, d.searchCode)] as const);
  return Object.fromEntries(entries);
}

export async function getRouteDeals(): Promise<DealMap> {
  const entries = await mapLimit(popularRoutes, concurrency(), async (r) => [routeKey(r), await dealFor([r.fromCode], r.toCode)] as const);
  return Object.fromEntries(entries);
}

export type DatePrice = { date: string; returnDate?: string; price: number | null };

/** Esnek tarih şeridi: aynı yolculuk süresiyle ±3 gün; her gün ayrı önbelleklenir. */
const cachedDayPrice = unstable_cache(
  async (q: MultiQuery, _mode: string): Promise<number> => {
    const offers = await searchFlights(q);
    if (!offers.length) throw new Error(`Uçuş yok: ${q.from.join(",")} → ${q.to.join(",")} ${q.date}`);
    return Math.min(...offers.map((o) => o.price));
  },
  ["date-price"],
  { revalidate: 3 * 3600 },
);

export async function getDatePrices(q: MultiQuery, spread = 3): Promise<DatePrice[]> {
  const today = todayIso();
  const days = Array.from({ length: spread * 2 + 1 }, (_, i) => i - spread)
    .map((off) => ({ ...q, date: addDays(q.date, off), returnDate: q.returnDate ? addDays(q.returnDate, off) : undefined }))
    .filter((d) => d.date >= today);
  return mapLimit(days, concurrency(), async (d) => {
    let price: number | null = null;
    try {
      price = await cachedDayPrice({ ...d, from: [...d.from].sort(), to: [...d.to].sort() }, dataMode());
    } catch (e) {
      console.error(e instanceof Error ? e.message : e);
    }
    return { date: d.date, returnDate: d.returnDate, price };
  });
}
