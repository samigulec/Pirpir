// Ana sayfadaki fırsatlar: popüler uçuş kartları, karakter ipuçları ve popüler rota tarihleri.
// Fiyatlar uydurulmaz; arama sonuçlarıyla aynı sağlayıcıdan (canlı Duffel ya da örnek veri) aranır.
// Amaç her şehir için en ucuz tarihi göstermek: önümüzdeki haftalardaki hafta sonu ve bir haftalık geziler
// sırayla (her 10 dakikada başka bir tarih) aranır; bulunan fiyatlar fiyat takvimine yazılır ve kartta
// son saatlerde görülen en ucuz tarih gösterilir. Örnek veri modunda tüm tarihler bir kerede taranır.
import "server-only";
import { after } from "next/server";
import { popularDestinations } from "@/data/mock/home";
import { dataMode, searchFlightsCached } from "./flights";
import { addDays, todayIso, type MultiQuery } from "./search";
import type { Offer } from "./providers/types";
import { cheapestWithBags } from "./extras";
import { bestKnownPrices, routeKey, type KnownPrice } from "./price-calendar";

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
  /** Fiyat takviminden geldiyse ne zaman bulunduğu (ISO) */
  seenAt?: string;
};

export type DealMap = Record<string, Deal | null>;

/**
 * Taranan gezi tarihleri: ilk Cuma en az iki hafta sonra; 8 hafta sonu (Cuma → Pazartesi) ve
 * araya serpiştirilmiş 4 bir haftalık gezi (Cumartesi → Cumartesi).
 */
export function candidateTrips(now = new Date()): [string, string][] {
  const today = todayIso(now);
  const dow = new Date(`${today}T00:00:00Z`).getUTCDay();
  const firstFriday = addDays(today, ((5 - dow + 7) % 7) + 14);
  const out: [string, string][] = [];
  for (let i = 0; i < 8; i++) {
    const fri = addDays(firstFriday, i * 7);
    out.push([fri, addDays(fri, 3)]);
    if (i % 2 === 1) out.push([addDays(fri, 1), addDays(fri, 8)]);
  }
  return out;
}

/** Canlıda her şehir için bu 10 dakikalık dilimde aranacak tek tarih (şehirler farklı tarihlerden başlar). */
function rotatingTrip(index: number, now = Date.now()): [string, string] {
  const trips = candidateTrips(new Date(now));
  const slot = Math.floor(now / (10 * 60 * 1000));
  return trips[(slot + index * 5) % trips.length];
}

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

// Canlıda/testte az: ana sayfa fırsatları ziyaretçinin kendi aramasıyla aynı istek sınırını paylaşır
const concurrency = () => (dataMode() === "demo" ? 16 : 3);

// Ayrı bir fırsat önbelleği yok: kart fiyatı her seferinde sonuç sayfasının kullandığı arama önbelleğinden
// hesaplanır. Böylece karta tıklayınca açılan aramadaki en ucuz fiyat, kartta yazanla aynıdır.
/** Örnek modda tüm tarihler, canlıda bu dilimin tek tarihi aranır. */
async function dealFor(from: string[], to: string, index: number): Promise<Deal | null> {
  try {
    return await findDeal(from, to, dataMode() === "demo" ? candidateTrips() : [rotatingTrip(index)]);
  } catch (e) {
    console.error("Fırsat hesaplanamadı:", from.join(","), to, e instanceof Error ? e.message : e);
    return null;
  }
}

/** Fiyat takviminde bilinen daha ucuz bir tarih varsa onu kullanır. */
function cheaper(found: Deal | null, known: KnownPrice | undefined): Deal | null {
  if (!known || (found && found.price <= known.price)) return found;
  if (!known.details && !found) return null;
  const d = known.details ?? found!;
  return {
    price: known.price,
    date: known.depart,
    returnDate: addDays(known.depart, known.nights),
    stops: d.stops,
    mins: d.mins,
    airlines: d.airlines,
    airports: d.airports,
    seenAt: known.seenAt,
  };
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
  const list = popularDestinations.map((d, i) => ({ id: d.id as string, to: d.searchCode, index: i }));
  const byId = new Map(list.map((d) => [d.id, d]));
  const [found, known] = await Promise.all([
    withDeadline([...byId.keys()], (id) => dealFor(from, byId.get(id)!.to, byId.get(id)!.index), deadlineMs),
    bestKnownPrices(list.map((d) => ({ from, to: [d.to] }))).catch(() => ({}) as Record<string, KnownPrice>),
  ]);
  return Object.fromEntries(list.map((d) => [d.id, cheaper(found[d.id] ?? null, known[routeKey({ from, to: [d.to] })])]));
}

/**
 * Popüler rota bağlantılarının tarihleri: fiyat takviminde bilinen en ucuz tarih; bilinmiyorsa ilk aday hafta sonu.
 * Canlıda yeni arama yapılmaz (rotalarda fiyat gösterilmiyor). Örnek modda en ucuz tarih hesaplanır.
 */
export async function getRouteDates(routes: [string, string][]): Promise<Record<string, { date: string; returnDate: string }>> {
  const key = ([f, t]: [string, string]) => `${f}>${t}`;
  const first = candidateTrips()[0];
  const fallback = { date: first[0], returnDate: first[1] };
  if (dataMode() === "demo") {
    const deals = await Promise.all(routes.map(([f, t], i) => dealFor([f], t, i)));
    return Object.fromEntries(routes.map((r, i) => [key(r), deals[i] ? { date: deals[i]!.date, returnDate: deals[i]!.returnDate } : fallback]));
  }
  const known = await bestKnownPrices(routes.map(([f, t]) => ({ from: [f], to: [t] }))).catch(() => ({}) as Record<string, KnownPrice>);
  return Object.fromEntries(
    routes.map(([f, t]) => {
      const k = known[routeKey({ from: [f], to: [t] })];
      return [key([f, t]), k ? { date: k.depart, returnDate: addDays(k.depart, k.nights) } : fallback];
    }),
  );
}

/**
 * Esnek tarih şeridinde bir günün en düşük kişi başı fiyatı: sonuç sayfasıyla aynı (önbellekli) arama,
 * bu yüzden şeritteki fiyat o güne tıklayınca çıkan en ucuz uçuşla aynıdır ve tıklayınca sonuç anında gelir.
 */
export async function getDayPrice(q: MultiQuery): Promise<number | null> {
  try {
    const offers = await searchFlightsCached(q);
    return cheapestWithBags(offers, q.bags);
  } catch (e) {
    console.error("Gün fiyatı alınamadı:", q.date, e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * Arama kutusu için: bu rotanın bilinen en ucuz gidiş-dönüş tarihi (fiyat takviminden; örnek modda taranır).
 * Bilinmiyorsa null: kutu tarihi boş bırakır, kullanıcı seçer.
 */
export async function getBestDates(from: string[], to: string[]): Promise<{ date: string; returnDate: string; price: number } | null> {
  if (dataMode() === "demo") {
    const deal = await findDeal(from, to[0], candidateTrips()).catch(() => null);
    return deal ? { date: deal.date, returnDate: deal.returnDate, price: deal.price } : null;
  }
  const known = await bestKnownPrices([{ from, to }]).catch(() => ({}) as Record<string, KnownPrice>);
  const k = known[routeKey({ from, to })];
  return k ? { date: k.depart, returnDate: addDays(k.depart, k.nights), price: k.price } : null;
}
