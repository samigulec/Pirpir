// Ana sayfadaki fırsatlar: popüler uçuş kartları ve karakter ipuçları.
// Fiyatlar uydurulmaz; arama sonuçlarıyla aynı sağlayıcıdan (canlı Duffel ya da örnek veri)
// önümüzdeki hafta sonları için aranır; arama sonuçlarıyla aynı önbelleği paylaşır.
import "server-only";
import { after } from "next/server";
import { popularDestinations } from "@/data/mock/home";
import { dataMode, searchFlightsCached } from "./flights";
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
      searchFlightsCached({ from, to: [to], date, returnDate, pax: { adults: 1, children: 0, infants: 0 }, cabin: "economy" }),
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

const concurrency = () => (dataMode() === "demo" ? 16 : 6);

// Ayrı bir fırsat önbelleği yok: kart fiyatı her seferinde sonuç sayfasının kullandığı arama önbelleğinden
// hesaplanır. Böylece karta tıklayınca açılan aramadaki en ucuz fiyat, kartta yazanla aynıdır.
async function dealFor(from: string[], to: string): Promise<Deal | null> {
  try {
    return await findDeal(from, to, weekendTrips(tripCount()));
  } catch (e) {
    console.error("Fırsat hesaplanamadı:", from.join(","), to, e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * Sayfa en fazla `ms` bekler: o ana kadar bulunanlar döner, kalan aramalar arka planda sürüp önbelleğe yazılır
 * (ilk ziyaretçi birkaç kartta "Fiyatlara bak" görür, sonrakiler fiyatları hemen görür).
 */
async function withDeadline(keys: string[], run: (key: string) => Promise<Deal | null>, ms: number): Promise<DealMap> {
  const out: DealMap = {};
  const all = mapLimit(keys, concurrency(), async (k) => {
    out[k] = await run(k);
  });
  // Sayfa yanıtlandıktan sonra da kalan aramalar bitsin (sunucusuz ortamda aksi halde yarıda kalır)
  try {
    after(() => all);
  } catch {
    // Derleme sırasında istek bağlamı yok; orada zaten tamamı beklenir
  }
  await Promise.race([all, new Promise((r) => setTimeout(r, ms))]);
  return { ...out };
}

const DEADLINE_MS = 9000;

/** Popüler uçuş kartları için seçilen kalkış yerlerinden fırsatlar. */
export async function getDestinationDeals(from: string[], deadlineMs = DEADLINE_MS): Promise<DealMap> {
  const byId = new Map(popularDestinations.map((d) => [d.id as string, d.searchCode]));
  return withDeadline([...byId.keys()], (id) => dealFor(from, byId.get(id)!), deadlineMs);
}

/**
 * Esnek tarih şeridinde bir günün en düşük kişi başı fiyatı: sonuç sayfasıyla aynı (önbellekli) arama,
 * bu yüzden şeritteki fiyat o güne tıklayınca çıkan en ucuz uçuşla aynıdır ve tıklayınca sonuç anında gelir.
 */
export async function getDayPrice(q: MultiQuery): Promise<number | null> {
  try {
    const offers = await searchFlightsCached(q);
    return offers.length ? Math.min(...offers.map((o) => o.price)) : null;
  } catch (e) {
    console.error("Gün fiyatı alınamadı:", q.date, e instanceof Error ? e.message : e);
    return null;
  }
}
