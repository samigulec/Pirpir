// Ana sayfadaki fırsatlar: popüler uçuş kartları, karakter ipuçları ve popüler rotalar.
// Fiyatlar uydurulmaz; arama sonuçlarıyla aynı sağlayıcıdan (canlı Duffel ya da örnek veri)
// önümüzdeki hafta sonları için aranır ve birkaç saat önbellekte tutulur.
import "server-only";
import { unstable_cache } from "next/cache";
import { popularDestinations, popularRoutes } from "@/data/mock/home";
import { dataMode, searchFlights } from "./flights";
import { addDays, todayIso } from "./search";
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

// Canlı API'de her arama gerçek bir istek: hafta sonu sayısı az tutulur.
const tripCount = () => (dataMode() === "demo" ? 4 : 2);

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

// Hiçbir fırsat bulunamadıysa hata fırlatılır ki boş sonuç önbelleğe yazılmasın.
function ensureSome(map: DealMap): DealMap {
  if (!Object.values(map).some(Boolean)) throw new Error("Fırsat bulunamadı");
  return map;
}

// `mode` yalnızca önbellek anahtarı için: örnek veriden canlıya geçince eski fiyatlar gösterilmez.
async function computeDestinationDeals(from: string[], trips: [string, string][], _mode: string): Promise<DealMap> {
  const entries = await mapLimit(popularDestinations, concurrency(), async (d) => [d.id, await findDeal(from, d.searchCode, trips)] as const);
  return ensureSome(Object.fromEntries(entries));
}

async function computeRouteDeals(trips: [string, string][], _mode: string): Promise<DealMap> {
  const entries = await mapLimit(popularRoutes, concurrency(), async (r) => [routeKey(r), await findDeal([r.fromCode], r.toCode, trips)] as const);
  return ensureSome(Object.fromEntries(entries));
}

export const routeKey = (r: { fromCode: string; toCode: string }) => `${r.fromCode}-${r.toCode}`;

const cachedDestinations = unstable_cache(computeDestinationDeals, ["home-destination-deals"], { revalidate: REVALIDATE });
const cachedRoutes = unstable_cache(computeRouteDeals, ["home-route-deals"], { revalidate: REVALIDATE });

/** Popüler uçuş kartları için seçilen kalkış yerlerinden fırsatlar. Tarihler önbellek anahtarına dahil. */
export async function getDestinationDeals(from: string[]): Promise<DealMap> {
  try {
    return await cachedDestinations([...from].sort(), weekendTrips(tripCount()), dataMode());
  } catch (e) {
    console.error("Popüler uçuş fırsatları alınamadı:", e);
    return {};
  }
}

export async function getRouteDeals(): Promise<DealMap> {
  try {
    return await cachedRoutes(weekendTrips(tripCount()), dataMode());
  } catch (e) {
    console.error("Popüler rota fırsatları alınamadı:", e);
    return {};
  }
}
