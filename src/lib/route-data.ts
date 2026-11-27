// Rota sayfalarının (/ucuslar/[nereden]/[nereye]) katalog ve gerçek veri katmanı.
// Ortaklık modunda (TRAVELPAYOUTS_TOKEN tanımlıyken) Travelpayouts `grouped_prices` (aylık + yaklaşan günler)
// verisini 8 saatlik `unstable_cache` ile çeker; kayıt olmayan aylarda fiyat uydurmaz (null → "Fiyata bak").
// Demo modda mevcut örnek veri (src/data/mock/routes.ts) çalışmaya devam eder.
import "server-only";
import { unstable_cache } from "next/cache";
import { MARKETS } from "@/config/markets";
import { expandCode, findAirport } from "@/data/airports";
import { routes as editorialRoutes, type L, type RouteData } from "@/data/mock/routes";
import { guideForDestination, heroArtForDestination, type AirportCard, type HeroArtKey, type TipCard } from "@/data/route-guides";
import { RATES, toTry } from "./currency";
import { getRates } from "./currency-server";
import { itemSeenAt, targetMonths } from "./deal-scanner";
import { priceSource } from "./flights";
import { airlineName, groupedPrices, type GroupedPriceItem } from "./providers/travelpayouts";
import { addDays, todayIso } from "./search";

const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

export type MonthPoint = {
  /** 0 = Ocak … 11 = Aralık */
  month: number;
  /** YYYY-MM (ör. "2027-01") */
  ym: string;
  /** TRY cinsinden en düşük gidiş-dönüş fiyat; veri yoksa null */
  price: number | null;
  /** Örnek gidiş-dönüş tarihleri (varsa arama bağlantısı için) */
  date?: string;
  returnDate?: string;
  /** Fiyatın görüldüğü gün (YYYY-MM-DD, gerçek mod) */
  seenAt?: string | null;
};

export type RouteDealView = {
  date: string;
  returnDate: string;
  /** Gün sayısı (yerelleştirilir); demo editöryal veride özel metin varsa nightsLabel kullanılır */
  nightsCount: number;
  nightsLabel?: L;
  airline: string;
  /** Aktarma sayısı; demo editöryal veride özel metin varsa stopsLabel kullanılır */
  transfers: number | null;
  stopsLabel?: L;
  /** TRY cinsinden gidiş-dönüş fiyat */
  price: number;
  /** Fiyatın görüldüğü gün (YYYY-MM-DD) */
  seenAt?: string | null;
  /** Aviasales /search/... yolu ("Fırsata git" için) */
  deep?: string | null;
};

export type TimeDiffSpec =
  | { kind: "custom"; label: L }
  | { kind: "same" }
  | { kind: "fixed"; diff: string }
  | { kind: "seasonal"; summer: string; winter: string };

export type RouteOtherView = {
  code: string;
  slug: string;
  /** Varsa doğrudan rota sayfasına (/ucuslar/nereden/nereye) bağlanır */
  hasRoutePage: boolean;
  /** Yalnızca demo modda (veya gerçek veri varsa); uydurma fiyat gösterilmez */
  price: number | null;
};

export type RoutePageView = {
  slug: string;
  from: { slug: string; searchCode: string; tpCode: string; airportCode: string };
  to: { slug: string; searchCode: string; tpCode: string; airportCode: string; illustration: HeroArtKey; heroBg: string };
  live: boolean;
  minPrice: number | null;
  latestSeenAt: string | null;
  directMins: number;
  isEstimatedDuration: boolean;
  airportsShort: string;
  airlines: string | null;
  timeDiff: TimeDiffSpec;
  months: MonthPoint[];
  defaultMonth: number;
  deals: RouteDealView[];
  airports: AirportCard[];
  tips: TipCard[];
  others: RouteOtherView[];
  othersSameCountry: boolean;
};

type RouteEntry = {
  from: { slug: string; searchCode: string; tpCode: string; airportCode: string };
  to: { slug: string; searchCode: string; tpCode: string; airportCode: string };
  editorial?: RouteData;
  /** Ön derlemede (generateStaticParams) statik üretilecek öncelikli rotalar */
  prerender: boolean;
};

const PRIORITY_MARKETS = new Set(["NL", "TR", "DE"]);
/** Türkiye'nin büyük havalimanları (7.4): kalkış merkezleri × TR varış rota sayfaları */
const TR_MAJOR_DESTS = ["city:IST", "AYT", "ADB", "ESB", "DLM", "BJV", "GZT", "TZX", "ASR"] as const;
const TR_CORRIDOR_ORIGINS = ["AMS", "DUS", "FRA", "city:BRU", "city:IST"] as const;
const MAX_CATALOG_ROUTES = 180;

function placeMeta(rawCode: string): { slug: string; searchCode: string; tpCode: string; airportCode: string } | null {
  const airportCode = expandCode(rawCode, 1)[0];
  const ap = findAirport(airportCode);
  if (!ap) return null;
  const tpCode = rawCode.replace(/^city:/, "").toUpperCase();
  return { slug: ap.slug, searchCode: rawCode, tpCode, airportCode: ap.code };
}

function buildCatalog(): RouteEntry[] {
  const byKey = new Map<string, RouteEntry>();

  const add = (rawFrom: string, rawTo: string, prerender: boolean, editorial?: RouteData) => {
    const from = placeMeta(rawFrom);
    const to = placeMeta(rawTo);
    if (!from || !to || from.slug === to.slug) return;
    const key = `${from.slug}/${to.slug}`;
    const existing = byKey.get(key);
    if (existing) {
      if (prerender) existing.prerender = true;
      return;
    }
    if (byKey.size >= MAX_CATALOG_ROUTES) return;
    byKey.set(key, { from, to, editorial, prerender });
  };

  // 1. Mevcut editöryal rotalar (amsterdam/istanbul)
  for (const r of editorialRoutes) {
    add(r.from.code, r.to.code, true, r);
  }

  // 2. Pazarların (MARKETS) tüm popüler rotaları
  for (const m of MARKETS) {
    const isPriority = PRIORITY_MARKETS.has(m.id);
    for (const [rawFrom, rawTo] of m.routes) add(rawFrom, rawTo, isPriority);
  }

  // 3. Ana kalkış merkezleri × Türkiye'nin büyük havalimanları (iç bağlantılar rota sayfalarına gitsin)
  for (const rawFrom of TR_CORRIDOR_ORIGINS) {
    for (const rawTo of TR_MAJOR_DESTS) {
      add(rawFrom, rawTo, rawFrom === "AMS");
    }
  }

  return [...byKey.values()];
}

const CATALOG = buildCatalog();
const CATALOG_MAP = new Map(CATALOG.map((e) => [`${e.from.slug}/${e.to.slug}`, e]));

/** Sitemap ve doğrulama için tüm geçerli rota adresleri (editöryal + tüm pazarlar + TR koridorları). */
export function getAllRouteSlugs(): { nereden: string; nereye: string }[] {
  return CATALOG.map((e) => ({ nereden: e.from.slug, nereye: e.to.slug }));
}

/** Derleme anında önceden üretilecek öncelikli rotalar (kalan katalog rotaları ISR ile isteğe bağlı üretilir). */
export function getStaticRouteSlugs(): { nereden: string; nereye: string }[] {
  return CATALOG.filter((e) => e.prerender).map((e) => ({ nereden: e.from.slug, nereye: e.to.slug }));
}

export function resolveRoute(fromSlug: string, toSlug: string): RouteEntry | null {
  return CATALOG_MAP.get(`${fromSlug}/${toSlug}`) ?? null;
}

/** İki havalimanı/şehir kodu için katalogda rota sayfası varsa `{ nereden, nereye }` döndürür; yoksa null. */
export function routeSlugsForCodes(fromCode: string, toCode: string): { nereden: string; nereye: string } | null {
  const from = placeMeta(fromCode);
  const to = placeMeta(toCode);
  if (!from || !to) return null;
  return CATALOG_MAP.has(`${from.slug}/${to.slug}`) ? { nereden: from.slug, nereye: to.slug } : null;
}

// ---- Coğrafi mesafe ve saat dilimi yardımcıları ----

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateFlightMins(fromAirport: string, toAirport: string): number {
  const a = findAirport(fromAirport);
  const b = findAirport(toAirport);
  if (!a || !b) return 180;
  const km = haversineKm(a.lat, a.lon, b.lat, b.lon);
  // 820 km/sa seyir hızı + 35 dk kalkış/iniş payı, 5 dk'ya yuvarlı
  return Math.max(55, Math.round(((km / 820) * 60 + 35) / 5) * 5);
}

const COUNTRY_TZ: Record<string, string> = {
  TR: "Europe/Istanbul", NL: "Europe/Amsterdam", BE: "Europe/Brussels", DE: "Europe/Berlin",
  FR: "Europe/Paris", GB: "Europe/London", IE: "Europe/Dublin", IT: "Europe/Rome",
  AT: "Europe/Vienna", CH: "Europe/Zurich", DK: "Europe/Copenhagen", SE: "Europe/Stockholm",
  NO: "Europe/Oslo", PL: "Europe/Warsaw", ES: "Europe/Madrid", PT: "Europe/Lisbon",
  GR: "Europe/Athens", AE: "Asia/Dubai", US: "America/New_York", CZ: "Europe/Prague",
};

function offsetHours(tz: string, isoDate: string): number {
  const d = new Date(`${isoDate}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(d);
  const raw = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = raw.match(/GMT([+-])(\d+)(?::(\d+))?/);
  if (!m) return 0;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * (Number(m[2]) + (m[3] ? Number(m[3]) / 60 : 0));
}

const fmtSigned = (h: number) => (h > 0 ? `+${h}` : String(h));

function computeTimeDiff(fromAirport: string, toAirport: string): TimeDiffSpec {
  const c1 = findAirport(fromAirport)?.country;
  const c2 = findAirport(toAirport)?.country;
  const tz1 = c1 ? COUNTRY_TZ[c1] : undefined;
  const tz2 = c2 ? COUNTRY_TZ[c2] : undefined;
  if (!tz1 || !tz2) return { kind: "same" };
  const winter = Math.round((offsetHours(tz2, "2027-01-15") - offsetHours(tz1, "2027-01-15")) * 10) / 10;
  const summer = Math.round((offsetHours(tz2, "2027-07-15") - offsetHours(tz1, "2027-07-15")) * 10) / 10;
  if (winter === 0 && summer === 0) return { kind: "same" };
  if (winter === summer) return { kind: "fixed", diff: fmtSigned(winter) };
  return { kind: "seasonal", summer: fmtSigned(summer), winter: fmtSigned(winter) };
}

// ---- Travelpayouts gerçek veri (8 saat önbellekli) ----

type RawLiveRouteData = {
  monthlyByYm: Record<string, { priceEur: number; date: string; returnDate?: string; seenAt: string | null; airline?: string; durationTo?: number; transfers?: number; link?: string }>;
  dailyItems: { date: string; returnDate: string; priceEur: number; airline: string; transfers: number | null; durationTo?: number; seenAt: string | null; link: string | null }[];
};

const ROUTE_CACHE_TTL = 8 * 3600; // 8 saat (DEVAM.md: 6–12 saat)

async function fetchRouteLiveRaw(origin: string, destination: string): Promise<RawLiveRouteData> {
  const today = todayIso();
  const months3 = targetMonths(today);

  const [monthRes, ...dayRes] = await Promise.allSettled([
    groupedPrices({ origin, destination, groupBy: "month", minTripDuration: 2, maxTripDuration: 21 }),
    ...months3.map((m) =>
      groupedPrices({
        origin,
        destination,
        departureAt: m,
        returnAt: m,
        groupBy: "departure_at",
        minTripDuration: 2,
        maxTripDuration: 14,
      }),
    ),
  ]);

  const monthlyByYm: RawLiveRouteData["monthlyByYm"] = {};
  if (monthRes.status === "fulfilled") {
    for (const [k, item] of Object.entries(monthRes.value)) {
      if (!item || typeof item.price !== "number" || item.price <= 0 || !item.departure_at) continue;
      const ym = /^\d{4}-\d{2}/.test(k) ? k.slice(0, 7) : item.departure_at.slice(0, 7);
      const prev = monthlyByYm[ym];
      if (!prev || item.price < prev.priceEur) {
        monthlyByYm[ym] = {
          priceEur: item.price,
          date: item.departure_at.slice(0, 10),
          returnDate: item.return_at?.slice(0, 10),
          seenAt: itemSeenAt(item),
          airline: item.airline,
          durationTo: item.duration_to,
          transfers: item.transfers,
          link: item.link && item.link.startsWith("/search/") ? item.link.slice(0, 1500) : undefined,
        };
      }
    }
  }

  const minDate = addDays(today, 2);
  const byDep = new Map<string, GroupedPriceItem>();
  for (const r of dayRes) {
    if (r.status !== "fulfilled") continue;
    for (const item of Object.values(r.value)) {
      if (!item || typeof item.price !== "number" || item.price <= 0 || !item.departure_at || !item.return_at) continue;
      const dep = item.departure_at.slice(0, 10);
      const ret = item.return_at.slice(0, 10);
      if (dep < minDate || ret <= dep) continue;
      const prev = byDep.get(dep);
      if (!prev || item.price < prev.price) byDep.set(dep, item);
    }
  }

  const dailyItems = [...byDep.values()]
    .map((item) => ({
      date: item.departure_at.slice(0, 10),
      returnDate: item.return_at!.slice(0, 10),
      priceEur: item.price,
      airline: item.airline ? airlineName(item.airline) : "",
      transfers: typeof item.transfers === "number" ? item.transfers : null,
      durationTo: item.duration_to,
      seenAt: itemSeenAt(item),
      link: item.link && item.link.startsWith("/search/") ? item.link.slice(0, 1500) : null,
    }))
    .sort((a, b) => a.priceEur - b.priceEur || (a.transfers ?? 9) - (b.transfers ?? 9) || a.date.localeCompare(b.date));

  return { monthlyByYm, dailyItems };
}

const cachedRouteLive = unstable_cache(fetchRouteLiveRaw.bind(null), ["route-live-v1"], { revalidate: ROUTE_CACHE_TTL });

/** Bugünden başlayarak önümüzdeki 12 ayın her takvim ayı (0..11) için karşılık gelen YYYY-MM değeri. */
function upcomingYearMonths(today: string): string[] {
  const curY = Number(today.slice(0, 4));
  const curM = Number(today.slice(5, 7)); // 1..12
  return Array.from({ length: 12 }, (_, mIdx) => {
    const mNum = mIdx + 1;
    const y = mNum < curM ? curY + 1 : curY;
    return `${y}-${String(mNum).padStart(2, "0")}`;
  });
}

function buildOtherCities(entry: RouteEntry, live: boolean): { list: RouteOtherView[]; sameCountry: boolean } {
  const toCountry = findAirport(entry.to.airportCode)?.country ?? "";
  if (!live && entry.editorial) {
    return {
      sameCountry: true,
      list: entry.editorial.others.map((o) => {
        const ap = findAirport(o.code);
        const slug = ap?.slug ?? o.code.toLowerCase();
        return {
          code: o.code,
          slug,
          hasRoutePage: CATALOG_MAP.has(`${entry.from.slug}/${slug}`),
          price: o.price,
        };
      }),
    };
  }

  const guide = guideForDestination(entry.to.tpCode);
  const rawPool = guide?.others ?? (toCountry === "TR" ? TR_MAJOR_DESTS.map((c) => c.replace(/^city:/, "")) : []);
  // Önce rota sayfası olan şehirleri öne al ki iç bağlantılar rota sayfalarına gitsin
  const candidates = rawPool.filter((c) => {
    const ap = findAirport(expandCode(c, 1)[0]);
    return ap && ap.slug !== entry.from.slug && ap.slug !== entry.to.slug;
  });

  const sameCountryCodes = candidates.filter((c) => findAirport(expandCode(c, 1)[0])?.country === toCountry);
  const chosen = (sameCountryCodes.length >= 2 ? sameCountryCodes : candidates).sort((a, b) => {
    const slugA = findAirport(expandCode(a, 1)[0])?.slug ?? "";
    const slugB = findAirport(expandCode(b, 1)[0])?.slug ?? "";
    const hasA = CATALOG_MAP.has(`${entry.from.slug}/${slugA}`) ? 0 : 1;
    const hasB = CATALOG_MAP.has(`${entry.from.slug}/${slugB}`) ? 0 : 1;
    return hasA - hasB;
  });
  const sameCountry = sameCountryCodes.length >= 2;

  return {
    sameCountry,
    list: chosen.slice(0, 6).map((c) => {
      const ap = findAirport(expandCode(c, 1)[0]);
      const slug = ap?.slug ?? c.toLowerCase();
      return {
        code: ap?.code ?? c,
        slug,
        hasRoutePage: CATALOG_MAP.has(`${entry.from.slug}/${slug}`),
        price: null,
      };
    }),
  };
}

/** Demo modda editöryal verisi olmayan pazar rotaları için deterministik çevrimdışı örnek fiyatlar. */
function demoFallbackPricing(entry: RouteEntry, today: string): { months: MonthPoint[]; defaultMonth: number; deals: RouteDealView[]; airlines: string } {
  const yms = upcomingYearMonths(today);
  const estMins = estimateFlightMins(entry.from.airportCode, entry.to.airportCode);
  const baseEur = Math.max(75, Math.min(520, Math.round(estMins * 0.65)));
  const factors = [0.88, 0.84, 0.92, 1.0, 1.08, 1.24, 1.42, 1.38, 1.12, 0.96, 0.82, 1.06];
  const months: MonthPoint[] = yms.map((ym, i) => ({
    month: i,
    ym,
    price: toTry(Math.round(baseEur * factors[i]), "EUR", RATES),
    date: `${ym}-12`,
    returnDate: `${ym}-19`,
  }));
  const defaultMonth = 10; // Kasım (en ucuz örnek faktör)
  const d1 = addDays(today, 21);
  const d2 = addDays(today, 35);
  const d3 = addDays(today, 49);
  const deals: RouteDealView[] = [
    { date: d1, returnDate: addDays(d1, 7), nightsCount: 7, airline: "Pegasus", transfers: 0, price: toTry(Math.round(baseEur * 0.9), "EUR", RATES) },
    { date: d2, returnDate: addDays(d2, 4), nightsCount: 4, airline: "Turkish Airlines", transfers: 0, price: toTry(Math.round(baseEur * 0.98), "EUR", RATES) },
    { date: d3, returnDate: addDays(d3, 7), nightsCount: 7, airline: "KLM", transfers: 0, price: toTry(Math.round(baseEur * 1.05), "EUR", RATES) },
  ];
  return { months, defaultMonth, deals, airlines: "Turkish Airlines, Pegasus, KLM" };
}

/** Rota sayfası için tüm veriyi (gerçek veya örnek modda) döndürür; rota katalogda yoksa null. */
export async function getRoutePageData(fromSlug: string, toSlug: string): Promise<RoutePageView | null> {
  const entry = resolveRoute(fromSlug, toSlug);
  if (!entry) return null;

  const today = todayIso();
  const yms = upcomingYearMonths(today);
  const guide = guideForDestination(entry.to.tpCode);
  // İçerik uydurulmaz: şehir rehberi yoksa havalimanları ve ipuçları boş kalır (bölümler gizlenir)
  const airports = entry.editorial?.airports ?? guide?.airports ?? [];
  const tips = entry.editorial?.tips ?? guide?.tips ?? [];
  const art = heroArtForDestination(entry.to.tpCode);
  const illustration: HeroArtKey = guide?.illustration ?? art.illustration;
  const heroBg = guide?.heroBg ?? art.heroBg;
  const airportsShort = entry.editorial?.airportsShort ?? guide?.airportsShort ?? entry.to.airportCode;
  const timeDiff: TimeDiffSpec = entry.editorial
    ? { kind: "custom", label: entry.editorial.timeDiff }
    : computeTimeDiff(entry.from.airportCode, entry.to.airportCode);

  const isLive = priceSource() === "travelpayouts";

  if (!isLive) {
    const others = buildOtherCities(entry, false);
    if (entry.editorial) {
      const ed = entry.editorial;
      const months: MonthPoint[] = ed.monthly.map((p, i) => ({
        month: i,
        ym: yms[i],
        price: p,
        date: `${yms[i]}-10`,
        returnDate: `${yms[i]}-17`,
      }));
      const deals: RouteDealView[] = ed.deals.map((d) => ({
        date: d.date,
        returnDate: d.returnDate,
        nightsCount: daysBetween(d.date, d.returnDate),
        nightsLabel: d.nights,
        airline: d.airline,
        transfers: 0,
        stopsLabel: d.stops,
        price: d.price,
      }));
      return {
        slug: `${entry.from.slug}-${entry.to.slug}`,
        from: entry.from,
        to: { ...entry.to, illustration, heroBg },
        live: false,
        minPrice: Math.min(...ed.monthly),
        latestSeenAt: null,
        directMins: ed.directMins,
        isEstimatedDuration: false,
        airportsShort,
        airlines: ed.airlines,
        timeDiff,
        months,
        defaultMonth: ed.defaultMonth,
        deals,
        airports,
        tips,
        others: others.list,
        othersSameCountry: others.sameCountry,
      };
    }

    const demo = demoFallbackPricing(entry, today);
    const prices = demo.months.map((m) => m.price).filter((p): p is number => p !== null);
    return {
      slug: `${entry.from.slug}-${entry.to.slug}`,
      from: entry.from,
      to: { ...entry.to, illustration, heroBg },
      live: false,
      minPrice: prices.length ? Math.min(...prices) : null,
      latestSeenAt: null,
      directMins: estimateFlightMins(entry.from.airportCode, entry.to.airportCode),
      isEstimatedDuration: true,
      airportsShort,
      airlines: demo.airlines,
      timeDiff,
      months: demo.months,
      defaultMonth: demo.defaultMonth,
      deals: demo.deals,
      airports,
      tips,
      others: others.list,
      othersSameCountry: others.sameCountry,
    };
  }

  // ---- Gerçek ortaklık (Travelpayouts) modu ----
  const [raw, rates] = await Promise.all([
    cachedRouteLive(entry.from.tpCode, entry.to.tpCode).catch((e) => {
      console.error("Rota sayfası Travelpayouts verisi alınamadı:", entry.from.tpCode, entry.to.tpCode, e instanceof Error ? e.message : e);
      return { monthlyByYm: {}, dailyItems: [] } as RawLiveRouteData;
    }),
    getRates(),
  ]);

  const months: MonthPoint[] = yms.map((ym, i) => {
    const item = raw.monthlyByYm[ym];
    if (!item) return { month: i, ym, price: null };
    return {
      month: i,
      ym,
      price: toTry(item.priceEur, "EUR", rates),
      date: item.date,
      returnDate: item.returnDate,
      seenAt: item.seenAt,
    };
  });

  const knownMonths = months.filter((m): m is MonthPoint & { price: number } => m.price !== null);
  const cheapestMonth = knownMonths.length ? [...knownMonths].sort((a, b) => a.price - b.price)[0] : null;
  const defaultMonth = cheapestMonth ? cheapestMonth.month : Number(today.slice(5, 7)) - 1;

  // En ucuz yaklaşan tarihler: 3 aylık gün verisinden en fazla 6 adet; yetersizse aylık kayıtlardan tamamla
  let deals: RouteDealView[] = raw.dailyItems.slice(0, 6).map((d) => ({
    date: d.date,
    returnDate: d.returnDate,
    nightsCount: Math.max(1, daysBetween(d.date, d.returnDate)),
    airline: d.airline,
    transfers: d.transfers,
    price: toTry(d.priceEur, "EUR", rates),
    seenAt: d.seenAt,
    deep: d.link,
  }));

  if (deals.length < 3) {
    const seenDates = new Set(deals.map((d) => d.date));
    const extras = Object.values(raw.monthlyByYm)
      .filter((m) => m.date >= addDays(today, 2) && m.returnDate && m.returnDate > m.date && !seenDates.has(m.date))
      .sort((a, b) => a.priceEur - b.priceEur)
      .slice(0, 4 - deals.length)
      .map((m) => ({
        date: m.date,
        returnDate: m.returnDate!,
        nightsCount: Math.max(1, daysBetween(m.date, m.returnDate!)),
        airline: m.airline ? airlineName(m.airline) : "",
        transfers: typeof m.transfers === "number" ? m.transfers : null,
        price: toTry(m.priceEur, "EUR", rates),
        seenAt: m.seenAt,
        deep: m.link ?? null,
      }));
    deals = [...deals, ...extras].sort((a, b) => a.price - b.price);
  }

  // Gözlemlenen havayolları (en fazla 3) ve en kısa direkt süre
  const carrierCounts = new Map<string, number>();
  let minDirectMins: number | null = null;
  const seenDatesAll: string[] = [];

  for (const m of Object.values(raw.monthlyByYm)) {
    if (m.airline) {
      const name = airlineName(m.airline);
      carrierCounts.set(name, (carrierCounts.get(name) ?? 0) + 1);
    }
    if (m.transfers === 0 && m.durationTo && m.durationTo >= 35) {
      minDirectMins = minDirectMins === null ? m.durationTo : Math.min(minDirectMins, m.durationTo);
    }
    if (m.seenAt) seenDatesAll.push(m.seenAt);
  }
  for (const d of raw.dailyItems) {
    if (d.airline) carrierCounts.set(d.airline, (carrierCounts.get(d.airline) ?? 0) + 1);
    if (d.transfers === 0 && d.durationTo && d.durationTo >= 35) {
      minDirectMins = minDirectMins === null ? d.durationTo : Math.min(minDirectMins, d.durationTo);
    }
    if (d.seenAt) seenDatesAll.push(d.seenAt);
  }

  const observedAirlines = [...carrierCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  const allPrices = [
    ...knownMonths.map((m) => m.price),
    ...deals.map((d) => d.price),
  ];
  const minPrice = allPrices.length ? Math.min(...allPrices) : null;
  const latestSeenAt = seenDatesAll.length ? [...seenDatesAll].sort().at(-1) ?? null : null;

  const directMins = minDirectMins ?? entry.editorial?.directMins ?? estimateFlightMins(entry.from.airportCode, entry.to.airportCode);
  const isEstimatedDuration = minDirectMins === null && !entry.editorial;
  const airlines = observedAirlines.length ? observedAirlines.join(", ") : (entry.editorial?.airlines ?? null);
  const others = buildOtherCities(entry, true);

  return {
    slug: `${entry.from.slug}-${entry.to.slug}`,
    from: entry.from,
    to: { ...entry.to, illustration, heroBg },
    live: true,
    minPrice,
    latestSeenAt,
    directMins,
    isEstimatedDuration,
    airportsShort,
    airlines,
    timeDiff,
    months,
    defaultMonth,
    deals,
    airports,
    tips,
    others: others.list,
    othersSameCountry: others.sameCountry,
  };
}
