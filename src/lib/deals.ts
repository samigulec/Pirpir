// Ana sayfadaki fırsatlar: popüler uçuş kartları, karakter ipuçları ve popüler rota tarihleri.
// Fiyatlar uydurulmaz; arama sonuçlarıyla aynı sağlayıcıdan (canlı Duffel ya da örnek veri) aranır.
// Amaç her şehir için en ucuz tarihi göstermek: önümüzdeki haftalardaki hafta sonu ve bir haftalık geziler
// sırayla (her 10 dakikada başka bir tarih) aranır; bulunan fiyatlar fiyat takvimine yazılır ve kartta
// son saatlerde görülen en ucuz tarih gösterilir. Örnek veri modunda tüm tarihler bir kerede taranır.
import "server-only";
import { unstable_cache } from "next/cache";
import { after } from "next/server";
import { popularDestinations } from "@/data/mock/home";
import { toTry, type Rates } from "./currency";
import { getRates } from "./currency-server";
import { itemSeenAt } from "./deal-scanner";
import { publishedDealsForOrigins, type DealRow } from "./deal-store";
import { dataMode, priceSource, searchFlightsCached } from "./flights";
import { backgroundRetryIn, inBackground, isSkipped } from "./providers/rate-limit";
import { airlineName, groupedPrices, type GroupedPriceItem } from "./providers/travelpayouts";
import { addDays, todayIso, type MultiQuery } from "./search";
import type { Offer } from "./providers/types";
import { cheapestWithBags } from "./extras";
import { bestKnownPrices, routeKey, travelpayoutsDayPrices, type KnownPrice } from "./price-calendar";

export type Deal = {
  /** Yayınlanmış fırsat motoru kaydıysa kimliği (kart /firsatlar/[id] sayfasına gider). */
  dealId?: string;
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
  /** Fiyat takviminden geldiyse ne zaman bulunduğu (ISO zaman damgası, Duffel) */
  seenAt?: string;
  /** Ortaklık / Aviasales önbelleğinde fiyatın görüldüğü gün (YYYY-MM-DD) */
  seenDate?: string;
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
  settled.forEach((r) => r.status === "rejected" && !isSkipped(r.reason) && console.error("Fırsat araması başarısız:", from.join(","), to, r.reason));
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

// Canlıda/testte Duffel istek sınırını zorlamaz; Travelpayouts `grouped_prices` hafiftir.
const concurrency = () => (dataMode() === "demo" ? 16 : priceSource() === "travelpayouts" ? 6 : 3);

// Ayrı bir fırsat önbelleği yok: kart fiyatı her seferinde sonuç sayfasının kullandığı arama önbelleğinden
// hesaplanır. Böylece karta tıklayınca açılan aramadaki en ucuz fiyat, kartta yazanla aynıdır.
/** Örnek modda tüm tarihler, canlıda bu dilimin tek tarihi aranır. */
async function dealFor(from: string[], to: string, index: number): Promise<Deal | null> {
  try {
    // Arka plan önceliği: ziyaretçinin kendi araması istek sınırında önce gelir
    return await inBackground(() => findDeal(from, to, dataMode() === "demo" ? candidateTrips() : [rotatingTrip(index)]));
  } catch (e) {
    if (isSkipped(e)) return null;
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
const TP_HOME_TTL = 2 * 3600; // 2 saat

type TpCheapest60d = {
  priceEur: number;
  date: string;
  returnDate: string;
  stops: number;
  mins: number;
  airlines: string[];
  airports: string[];
  seenDate?: string;
};

/** Bugünden sonraki 60 günü (3..60 gün) kapsayan takvim ayları (YYYY-MM). */
function monthsNext60Days(today: string): string[] {
  const set = new Set<string>();
  for (let d = 3; d <= 60; d += 7) set.add(addDays(today, d).slice(0, 7));
  set.add(addDays(today, 60).slice(0, 7));
  return [...set].sort();
}

async function fetchTpCheapest60d(origin: string, destination: string): Promise<TpCheapest60d | null> {
  const today = todayIso();
  const minDate = addDays(today, 3);
  const maxDate = addDays(today, 60);
  const months = monthsNext60Days(today);

  const settled = await Promise.allSettled(
    months.map((m) =>
      groupedPrices({
        origin,
        destination,
        departureAt: m,
        returnAt: m,
        groupBy: "departure_at",
        minTripDuration: 2,
        maxTripDuration: 10,
      }),
    ),
  );

  const valid: GroupedPriceItem[] = [];
  for (const r of settled) {
    if (r.status !== "fulfilled") continue;
    for (const item of Object.values(r.value)) {
      if (!item || typeof item.price !== "number" || item.price <= 0 || !item.departure_at || !item.return_at) continue;
      const dep = item.departure_at.slice(0, 10);
      const ret = item.return_at.slice(0, 10);
      if (dep < minDate || dep > maxDate || ret <= dep) continue;
      valid.push(item);
    }
  }
  if (!valid.length) return null;

  valid.sort((a, b) => a.price - b.price || (a.transfers ?? 9) - (b.transfers ?? 9) || a.departure_at.localeCompare(b.departure_at));
  const best = valid[0];
  const airlines = [...new Set(valid.slice(0, 8).map((x) => (x.airline ? airlineName(x.airline) : "")).filter(Boolean))].slice(0, 3);
  const airports = [...new Set(valid.slice(0, 8).map((x) => x.destination_airport || destination).filter(Boolean))].slice(0, 3);
  const seen = itemSeenAt(best);

  return {
    priceEur: best.price,
    date: best.departure_at.slice(0, 10),
    returnDate: best.return_at!.slice(0, 10),
    stops: typeof best.transfers === "number" ? best.transfers : 0,
    mins: typeof best.duration_to === "number" && best.duration_to > 0 ? best.duration_to : 0,
    airlines,
    airports: airports.length ? airports : [destination],
    seenDate: seen ?? undefined,
  };
}

const cachedTpCheapest60d = unstable_cache(fetchTpCheapest60d.bind(null), ["tp-home-60d-v1"], { revalidate: TP_HOME_TTL });

async function tpDealFor(from: string[], to: string, fallbackAirport: string, rates: Rates): Promise<Deal | null> {
  const dest = to.replace(/^city:/, "");
  const origins = [...new Set(from.map((c) => c.replace(/^city:/, "")))].filter((o) => o && o !== dest);
  if (!origins.length) return null;
  const settled = await Promise.allSettled(origins.map((o) => cachedTpCheapest60d(o, dest)));
  const hits = settled
    .filter((r): r is PromiseFulfilledResult<TpCheapest60d | null> => r.status === "fulfilled" && !!r.value)
    .map((r) => r.value!);
  if (!hits.length) return null;
  hits.sort((a, b) => a.priceEur - b.priceEur);
  const best = hits[0];
  return {
    price: toTry(best.priceEur, "EUR", rates),
    date: best.date,
    returnDate: best.returnDate,
    stops: best.stops,
    mins: best.mins,
    airlines: best.airlines,
    airports: best.airports.length ? best.airports : [fallbackAirport],
    seenDate: best.seenDate,
  };
}

/** Popüler uçuş kartları için seçilen kalkış yerlerinden fırsatlar. Yayınlanmış fırsatlar önceliklidir; yoksa ortaklık modunda 60 günlük `groupedPrices`. */
export async function getDestinationDeals(from: string[], deadlineMs = DEADLINE_MS): Promise<DealMap> {
  const list = popularDestinations.map((d, i) => ({
    id: d.id as string,
    code: d.code,
    to: d.searchCode,
    airports: d.airports,
    index: i,
  }));

  const src = priceSource();
  const rates = src !== "demo" ? await getRates() : undefined;

  // Yayınlanmış fırsat motoru kayıtları (yalnızca gerçek modda)
  const publishedMap = new Map<string, Deal>();
  if (src !== "demo" && rates) {
    const pubRows = await publishedDealsForOrigins(from).catch((): DealRow[] => []);
    for (const d of list) {
      const destCodes = new Set([d.code, d.to.replace(/^city:/, ""), ...d.airports]);
      const match = pubRows.find((r) => destCodes.has(r.destination) && r.return_date);
      if (match && match.return_date) {
        publishedMap.set(d.id, {
          dealId: match.id,
          price: toTry(match.price_eur, "EUR", rates),
          date: match.depart,
          returnDate: match.return_date,
          stops: match.transfers ?? 0,
          mins: 0,
          airlines: match.airline ? [airlineName(match.airline)] : [],
          airports: [match.destination],
          seenDate: match.seen_at ?? undefined,
        });
      }
    }
  }

  const remaining = list.filter((d) => !publishedMap.has(d.id));
  const byId = new Map(remaining.map((d) => [d.id, d]));

  // Ortaklık modunda (Travelpayouts): yayınlanmış fırsat olmayan her hedef için önümüzdeki 60 günün en ucuz günü (`groupedPrices`)
  if (src === "travelpayouts" && rates) {
    const tpFound = remaining.length
      ? await withDeadline(
          [...byId.keys()],
          (id) => {
            const item = byId.get(id)!;
            return tpDealFor(from, item.to, item.code, rates);
          },
          deadlineMs,
        )
      : {};
    return Object.fromEntries(list.map((d) => [d.id, publishedMap.get(d.id) ?? tpFound[d.id] ?? null]));
  }

  const [found, known] = remaining.length
    ? await Promise.all([
        withDeadline([...byId.keys()], (id) => dealFor(from, byId.get(id)!.to, byId.get(id)!.index), deadlineMs),
        bestKnownPrices(remaining.map((d) => ({ from, to: [d.to] }))).catch(() => ({}) as Record<string, KnownPrice>),
      ])
    : [{}, {} as Record<string, KnownPrice>];

  return Object.fromEntries(
    list.map((d) => [
      d.id,
      publishedMap.get(d.id) ?? cheaper(found[d.id] ?? null, known[routeKey({ from, to: [d.to] })]),
    ]),
  );
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
 * Eski (takvimde saklanan) fiyat gösterilmez: tıklayınca çıkan fiyatla çelişirdi. İstek sınırı darken arama
 * gönderilmez, `busy` döner ve şerit istek hakkı yenilenince (`retryMs`) yeniden sorar.
 * `price: null` o gün uçuş yok; `failed` fiyat alınamadı.
 */
export async function getDayPrice(q: MultiQuery): Promise<{ price: number | null; busy?: boolean; retryMs?: number; failed?: boolean }> {
  if (priceSource() === "travelpayouts") {
    if (q.bags && (q.bags.cabin || q.bags.checked)) return { price: null };
    const nights = q.returnDate ? Math.round((Date.parse(q.returnDate) - Date.parse(q.date)) / 86_400_000) : -1;
    const { prices, failed } = await travelpayoutsDayPrices({ from: q.from, to: q.to, cabin: q.cabin ?? "economy" }, q.date, 1, nights);
    return failed ? { price: null, failed: true } : { price: prices[q.date] ?? null };
  }
  try {
    const offers = await inBackground(() => searchFlightsCached(q));
    return { price: cheapestWithBags(offers, q.bags) };
  } catch (e) {
    if (isSkipped(e)) return { price: null, busy: true, retryMs: backgroundRetryIn() };
    console.error("Gün fiyatı alınamadı:", q.date, e instanceof Error ? e.message : e);
    return { price: null, failed: true };
  }
}

/**
 * Esnek tarih şeridi (±3 gün) için Travelpayouts ay verisi: tek/iki `grouped_prices` isteğiyle tüm komşu günler.
 * Kayıt olmayan günler `null` döner ("Fiyata bak" görünür).
 */
export async function getStripPrices(q: MultiQuery): Promise<{ prices: Record<string, number | null>; failed: boolean }> {
  const today = todayIso();
  const days = [-3, -2, -1, 0, 1, 2, 3].map((n) => addDays(q.date, n)).filter((d) => d >= today);
  if (!days.length || (q.bags && (q.bags.cabin || q.bags.checked))) {
    return { prices: Object.fromEntries(days.map((d) => [d, null])), failed: false };
  }
  const nights = q.returnDate ? Math.round((Date.parse(q.returnDate) - Date.parse(q.date)) / 86_400_000) : -1;
  const { prices, failed } = await travelpayoutsDayPrices({ from: q.from, to: q.to, cabin: q.cabin ?? "economy" }, days[0], days.length, nights);
  if (failed) return { prices: {}, failed: true };
  return { prices: Object.fromEntries(days.map((d) => [d, prices[d] ?? null])), failed: false };
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
  if (priceSource() === "travelpayouts") {
    const rates = await getRates();
    const deal = await tpDealFor(from, to[0], to[0].replace(/^city:/, ""), rates).catch(() => null);
    if (deal) return { date: deal.date, returnDate: deal.returnDate, price: deal.price };
  }
  const known = await bestKnownPrices([{ from, to }]).catch(() => ({}) as Record<string, KnownPrice>);
  const k = known[routeKey({ from, to })];
  return k ? { date: k.depart, returnDate: addDays(k.depart, k.nights), price: k.price } : null;
}
