// Travelpayouts (Aviasales Data API) fiyat sağlayıcısı: Aviasales kullanıcılarının son günlerde yaptığı aramalardan
// önbelleğe alınmış fiyatlar. Canlı değildir (fiyat birkaç gün önce görülmüş olabilir), bilet satılmaz; her teklif
// Aviasales'teki aynı uçuşa ortaklık bağlantısıyla gider. Belge: support.travelpayouts.com → "Aviasales Data API".
// Bagaj ve bilet koşulları bilinmez (satıcıda gösterilir); varış saati kalkış + süre ile, havalimanının saat dilimine göre hesaplanır.
import "server-only";
import { findAirport } from "@/data/airports";
import { RATES, toTry, type Rates } from "../currency";
import { getRates } from "../currency-server";
import type { SearchQuery } from "../search";
import type { Bags, FlightProvider, Leg, Offer } from "./types";

const API = process.env.TRAVELPAYOUTS_API_URL?.trim() || "https://api.travelpayouts.com";
export const travelpayoutsToken = () => process.env.TRAVELPAYOUTS_TOKEN?.trim() || null;

/** API'nin döndürdüğü kayıt (prices_for_dates) */
type TpItem = {
  origin: string;
  destination: string;
  origin_airport: string;
  destination_airport: string;
  price: number;
  airline: string;
  flight_number?: string;
  departure_at: string; // 2026-12-20T19:45:00+01:00
  return_at?: string;
  transfers: number;
  return_transfers?: number;
  duration?: number;
  duration_to: number;
  duration_back?: number;
  link: string; // /search/AMS2012IST27121?t=…&search_date=21112026…
};

/** Kalkışına bu kadardan az kalan uçuş gösterilmez (satın alınamaz) */
const SOON_MS = 3 * 3600 * 1000;

export class TravelpayoutsError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

// Sınıf: Data API yalnızca ekonomi (0) ve business (1) bilir; premium ve first için sonuç verilmez (yanlış fiyat göstermemek için)
const TRIP_CLASS: Partial<Record<NonNullable<SearchQuery["cabin"]>, string>> = { economy: "0", business: "1" };

/**
 * Önbellek her gün (ya da tarih çifti) için sınırlı sayıda, en ucuz biletleri tutar: en ucuzu aktarmalıysa direkt uçuş
 * listede görünmeyebilir (ör. AMS→ADB'de 130 € aktarmalı AJet, 131 € direkt SunExpress'i gizler). Bu yüzden
 * "yalnızca direkt" sorgusu da yapılır, ikisi birleşir. Direkt sorgu başarısız olursa yalnızca ilki kullanılır.
 */
async function fetchPrices(q: SearchQuery, range?: { depart?: string; ret?: string }): Promise<TpItem[]> {
  const [all, direct] = await Promise.allSettled([fetchOnce(q, range, false), fetchOnce(q, range, true)]);
  if (all.status === "rejected") {
    if (direct.status === "fulfilled") return direct.value;
    throw all.reason;
  }
  return direct.status === "fulfilled" ? [...all.value, ...direct.value] : all.value;
}

async function fetchOnce(q: SearchQuery, range: { depart?: string; ret?: string } | undefined, direct: boolean): Promise<TpItem[]> {
  const token = travelpayoutsToken();
  if (!token) throw new TravelpayoutsError("TRAVELPAYOUTS_TOKEN tanımlı değil");
  const cls = TRIP_CLASS[q.cabin ?? "economy"];
  if (cls === undefined) return [];
  const p = new URLSearchParams({
    origin: q.from,
    destination: q.to,
    departure_at: range?.depart ?? q.date,
    one_way: q.returnDate ? "false" : "true",
    currency: "eur",
    sorting: "price",
    limit: "100",
    trip_class: cls,
  });
  if (q.returnDate) p.set("return_at", range?.ret ?? q.returnDate);
  if (direct) p.set("direct", "true");
  const res = await fetch(`${API}/aviasales/v3/prices_for_dates?${p}`, {
    headers: { "X-Access-Token": token, "Accept-Encoding": "gzip" },
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  if (!res.ok) throw new TravelpayoutsError(`Travelpayouts ${res.status}`, res.status);
  const body = (await res.json()) as { success?: boolean; data?: TpItem[]; error?: string };
  if (body.success === false) throw new TravelpayoutsError(`Travelpayouts: ${body.error ?? "hata"}`, 502);
  if (range) return body.data ?? [];
  // Aynı gün ve (varsa) dönüş günü olanlar; API ay aralığı da döndürebilir
  return (body.data ?? []).filter((x) => Date.parse(x.departure_at) > Date.now() + SOON_MS && x.departure_at.startsWith(q.date) && (!q.returnDate || x.return_at?.startsWith(q.returnDate)));
}

// ---- Saat dilimi: varış saati için (API yalnızca kalkış saati ve süre verir) ----
// Tek saat dilimli ülkeler; listede olmayan ülkede varış saati gösterilmez.
const COUNTRY_TZ: Record<string, string> = {
  TR: "Europe/Istanbul", NL: "Europe/Amsterdam", BE: "Europe/Brussels", LU: "Europe/Luxembourg", DE: "Europe/Berlin",
  FR: "Europe/Paris", GB: "Europe/London", IE: "Europe/Dublin", IT: "Europe/Rome", MT: "Europe/Malta", AT: "Europe/Vienna",
  CH: "Europe/Zurich", DK: "Europe/Copenhagen", SE: "Europe/Stockholm", NO: "Europe/Oslo", FI: "Europe/Helsinki",
  IS: "Atlantic/Reykjavik", PL: "Europe/Warsaw", CZ: "Europe/Prague", SK: "Europe/Bratislava", HU: "Europe/Budapest",
  SI: "Europe/Ljubljana", HR: "Europe/Zagreb", BA: "Europe/Sarajevo", RS: "Europe/Belgrade", ME: "Europe/Podgorica",
  MK: "Europe/Skopje", AL: "Europe/Tirane", XK: "Europe/Belgrade", GR: "Europe/Athens", CY: "Asia/Nicosia",
  BG: "Europe/Sofia", RO: "Europe/Bucharest", MD: "Europe/Chisinau", UA: "Europe/Kyiv", LT: "Europe/Vilnius",
  LV: "Europe/Riga", EE: "Europe/Tallinn", GE: "Asia/Tbilisi", AZ: "Asia/Baku", AM: "Asia/Yerevan", AE: "Asia/Dubai",
  QA: "Asia/Qatar", BH: "Asia/Bahrain", KW: "Asia/Kuwait", OM: "Asia/Muscat", SA: "Asia/Riyadh", JO: "Asia/Amman",
  LB: "Asia/Beirut", IL: "Asia/Jerusalem", EG: "Africa/Cairo", MA: "Africa/Casablanca", TN: "Africa/Tunis",
  DZ: "Africa/Algiers", IQ: "Asia/Baghdad", IR: "Asia/Tehran", TH: "Asia/Bangkok", JP: "Asia/Tokyo", KR: "Asia/Seoul",
  IN: "Asia/Kolkata", SG: "Asia/Singapore", MV: "Indian/Maldives", LK: "Asia/Colombo",
};
// Ülkenin ana saat diliminden farklı olanlar (Kanarya Adaları, Azorlar, Madeira dahil)
const AIRPORT_TZ: Record<string, string> = {
  LPA: "Atlantic/Canary", TFS: "Atlantic/Canary", TFN: "Atlantic/Canary", ACE: "Atlantic/Canary", FUE: "Atlantic/Canary", SPC: "Atlantic/Canary",
  FNC: "Atlantic/Madeira", PDL: "Atlantic/Azores", TER: "Atlantic/Azores",
};
const SPLIT_COUNTRY_DEFAULT: Record<string, string> = { ES: "Europe/Madrid", PT: "Europe/Lisbon" };

function tzOf(airport: string): string | null {
  if (AIRPORT_TZ[airport]) return AIRPORT_TZ[airport];
  const c = findAirport(airport)?.country;
  return c ? (COUNTRY_TZ[c] ?? SPLIT_COUNTRY_DEFAULT[c] ?? null) : null;
}

/** Bir anın verilen saat dilimindeki tarih ve saati */
function localParts(ms: number, tz: string): { date: string; time: string } {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

/** "2026-12-20T19:45:00+01:00" → kalkışın yerel tarih/saati ve anı */
function parseLocal(iso: string) {
  return { date: iso.slice(0, 10), time: iso.slice(11, 16), ms: Date.parse(iso) };
}

function leg(depIso: string, mins: number, stops: number, from: string, to: string, airline: string): Leg {
  const dep = parseLocal(depIso);
  const tz = tzOf(to);
  const arr = tz ? localParts(dep.ms + mins * 60_000, tz) : null;
  const dayOffset = arr ? Math.round((Date.parse(arr.date) - Date.parse(dep.date)) / 86_400_000) : 0;
  return {
    date: dep.date,
    dep: dep.time,
    arr: arr?.time ?? "",
    arrDayOffset: Math.max(0, dayOffset),
    fromCode: from,
    toCode: to,
    fromCity: findAirport(from)?.city ?? from,
    toCity: findAirport(to)?.city ?? to,
    airline,
    mins,
    stops,
  };
}

// ---- Havayolu adları (API yalnızca IATA kodu verir) ----
const AIRLINES: Record<string, string> = {
  TK: "Turkish Airlines", PC: "Pegasus", VF: "AJet", XQ: "SunExpress", KL: "KLM", HV: "Transavia", TO: "Transavia France",
  FR: "Ryanair", RK: "Ryanair UK", U2: "easyJet", EC: "easyJet Europe", DS: "easyJet Switzerland", W6: "Wizz Air", W4: "Wizz Air Malta",
  W9: "Wizz Air UK", VY: "Vueling", IB: "Iberia", I2: "Iberia Express", UX: "Air Europa", V7: "Volotea", LH: "Lufthansa",
  EW: "Eurowings", DE: "Condor", "4Y": "Discover Airlines", LX: "SWISS", OS: "Austrian", SN: "Brussels Airlines", AF: "Air France",
  BA: "British Airways", EI: "Aer Lingus", LS: "Jet2", AZ: "ITA Airways", LO: "LOT", JU: "Air Serbia", A3: "Aegean",
  OA: "Olympic Air", CY: "Cyprus Airways", RO: "TAROM", FB: "Bulgaria Air", OU: "Croatia Airlines", TP: "TAP Air Portugal",
  SK: "SAS", DY: "Norwegian", D8: "Norwegian", AY: "Finnair", BT: "airBaltic", LG: "Luxair", KM: "KM Malta Airlines",
  EK: "Emirates", QR: "Qatar Airways", EY: "Etihad", FZ: "flydubai", G9: "Air Arabia", "3O": "Air Arabia Maroc",
  J2: "Azerbaijan Airlines", A9: "Georgian Airways", MS: "EgyptAir", AT: "Royal Air Maroc", RJ: "Royal Jordanian",
  ME: "Middle East Airlines", LY: "El Al", TU: "Tunisair", BJ: "Nouvelair", CD: "Corendon Dutch Airlines", XC: "Corendon Airlines",
  X3: "TUI fly", OR: "TUI fly Netherlands", TB: "TUI fly Belgium", BY: "TUI Airways", "6B": "TUI fly Nordic",
  SM: "Air Cairo", PS: "Ukraine International", EN: "Air Dolomiti", WK: "Edelweiss", "2L": "Helvetic", "6E": "IndiGo",
};
const airlineName = (code: string) => AIRLINES[code] ?? code;

const NO_BAGS: Bags = { cabin: { included: 0, max: 0 }, checked: { included: 0, max: 0 } };

/** Bağlantıdaki search_date (GGAAYYYY): fiyatın Aviasales'te görüldüğü gün */
function seenOn(link: string): string | undefined {
  const m = link.match(/[?&]search_date=(\d{2})(\d{2})(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : undefined;
}

/**
 * Bağlantıdaki bilet kimliği (t=…) her yönü taşır: kalkış ve varış (yerel saat, UTC gibi yazılmış saniye),
 * süre (dk) ve sırayla havalimanları. Ör. PC|1800633300|1800653100|000210|AMSSAW|1800877200|…|000555|ISTOTPAMS
 * Başta biletin havayolu kodu durur. Havayolu yön ya da uçuş bazında yazılmaz.
 */
type TDir = { date: string; dep: string; arrDate: string; arr: string; mins: number; airports: string[] };
export function parseTicket(link: string): { carrier?: string; dirs: TDir[] } | null {
  const m = link.match(/[?&]t=([A-Z0-9]+)_/);
  if (!m) return null;
  let s = m[1];
  let carrier: string | undefined;
  const head = s.match(/^([A-Z0-9]{2})(?=\d{26}[A-Z]{6})/);
  if (head) {
    carrier = head[1];
    s = s.slice(2);
  }
  const dirs: TDir[] = [];
  for (const d of s.matchAll(/(\d{10})(\d{10})(\d{6})([A-Z]{6,})/g)) {
    if (d[4].length % 3) return null;
    const at = (sec: string) => new Date(Number(sec) * 1000).toISOString();
    const dep = at(d[1]);
    const arr = at(d[2]);
    dirs.push({ date: dep.slice(0, 10), dep: dep.slice(11, 16), arrDate: arr.slice(0, 10), arr: arr.slice(11, 16), mins: Number(d[3]), airports: d[4].match(/.{3}/g)! });
  }
  return dirs.length ? { carrier, dirs } : null;
}

function legFromTicket(d: TDir, airline: string): Leg {
  const from = d.airports[0];
  const to = d.airports[d.airports.length - 1];
  const via = d.airports.slice(1, -1);
  return {
    date: d.date,
    dep: d.dep,
    arr: d.arr,
    arrDayOffset: Math.max(0, Math.round((Date.parse(d.arrDate) - Date.parse(d.date)) / 86_400_000)),
    fromCode: from,
    toCode: to,
    fromCity: findAirport(from)?.city ?? from,
    toCity: findAirport(to)?.city ?? to,
    airline,
    mins: d.mins,
    stops: via.length,
    ...(via.length && { viaCodes: via, via: { code: via[0], city: findAirport(via[0])?.city ?? via[0], waitMins: 0 } }),
  };
}

/** Havayolunun resmî kare simgesi (Aviasales görsel sunucusu; yatay logolar küçük karede okunmuyor) */
const logoOf = (code: string) => `https://pics.avs.io/al_square/96/96/${encodeURIComponent(code)}.png`;

export function toOffer(x: TpItem, q: SearchQuery, rates: Rates = RATES): Offer {
  const ticket = parseTicket(x.link);
  // Bilet kimliğindeki havayolu API'dekinden farklıysa ikisi de bilette vardır
  const codes = [...new Set([x.airline, ticket?.carrier].filter((c): c is string => !!c))];
  const airline = codes.map(airlineName).join(" + ");
  const okTicket = ticket && ticket.dirs.length === (q.returnDate && x.return_at ? 2 : 1) ? ticket : null;
  const outbound = okTicket
    ? legFromTicket(okTicket.dirs[0], airline)
    : leg(x.departure_at, x.duration_to, x.transfers, x.origin_airport, x.destination_airport, airline);
  const inbound =
    x.return_at && q.returnDate
      ? okTicket
        ? legFromTicket(okTicket.dirs[1], airline)
        : leg(x.return_at, x.duration_back || x.duration_to, x.return_transfers ?? 0, x.destination_airport, x.origin_airport, airline)
      : undefined;
  // Dönüş, gidişin tersi değilse (başka havalimanı ya da aktarma) büyük olasılıkla başka havayoludur; adı veride yok
  const mirror = (a?: Leg, b?: Leg) =>
    !!a && !!b && a.fromCode === b.toCode && a.toCode === b.fromCode && (a.viaCodes ?? []).join() === [...(b.viaCodes ?? [])].reverse().join();
  const mixedCarriers = codes.length > 1 || (!!inbound && !mirror(outbound, inbound));
  // Fiyat bir yetişkin içindir; çocuk aynı, bebek yaklaşık %10 sayılır (son fiyat satıcıda görülür)
  const price = toTry(x.price, "EUR", rates);
  const payers = q.pax.adults + q.pax.children;
  const totalEur = x.price * payers + Math.round(x.price * 0.1) * q.pax.infants;
  return {
    id: `tp_${[x.origin_airport, x.destination_airport, x.departure_at, x.return_at ?? "", x.airline, x.flight_number ?? "", x.price].join("_")}`,
    provider: "travelpayouts",
    query: q,
    fromCity: outbound.fromCity,
    toCity: outbound.toCity,
    airline,
    airlineLogo: logoOf(codes[0]),
    airlineLogos: codes.slice(0, 2).map(logoOf),
    outbound,
    inbound,
    price,
    total: toTry(totalEur, "EUR", rates),
    raw: { amount: totalEur.toFixed(2), currency: "EUR" },
    bagInfo: { cabin: false },
    bags: NO_BAGS,
    bagsUnknown: true,
    mixedCarriers,
    cabin: q.cabin ?? "economy",
    conditions: {},
    passportRequired: false,
    seenAt: seenOn(x.link),
    deepLink: x.link.startsWith("/search/") ? x.link : undefined,
  };
}

const unsupported = () => Promise.reject(new Error("Travelpayouts ile bilet satılmaz"));

export const travelpayoutsProvider: FlightProvider = {
  async search(q) {
    const [items, rates] = await Promise.all([fetchPrices(q), getRates()]);
    // Aynı uçuş (aynı güzergâh ve saatler) birkaç kez gelebilir: en taze fiyat kalır (eşitse en ucuzu).
    // Eski bir fiyat daha ucuz görünüp yanıltmasın.
    const best = new Map<string, TpItem>();
    const sig = (x: TpItem) => x.link.match(/[?&]t=([A-Z0-9]+)_/)?.[1] ?? [x.departure_at, x.return_at ?? "", x.airline, x.flight_number ?? "", x.transfers, x.return_transfers ?? 0].join("|");
    const seen = (x: TpItem) => seenOn(x.link) ?? "";
    for (const x of items) {
      const k = sig(x);
      const cur = best.get(k);
      if (!cur || seen(x) > seen(cur) || (seen(x) === seen(cur) && x.price < cur.price)) best.set(k, x);
    }
    return [...best.values()].map((x) => toOffer(x, q, rates));
  },
  getOffer: async () => null,
  seatMaps: async () => [],
  createOrder: unsupported,
  payHeld: unsupported,
  cancelQuote: unsupported,
  cancelConfirm: unsupported,
  orderBags: async () => null,
  changeOptions: async () => [],
  changeConfirm: unsupported,
  addBags: unsupported,
};

const dayDiff = (a: string, b: string) => Math.abs(Date.parse(a.slice(0, 10)) - Date.parse(b)) / 86_400_000;

/**
 * Tam tarihlerde kayıt yoksa: ±`days` gün içindeki kayıtlı en ucuz uçuşlar (her biri kendi tarihleriyle).
 * Gidiş-dönüşte biri sabit tutulup diğeri ay içinde aranır (iki istek); tek yönde ay aranır.
 */
export async function nearbyOffers(q: SearchQuery, days = 3, limit = 8): Promise<Offer[]> {
  const month = (d: string) => d.slice(0, 7);
  const calls = q.returnDate
    ? [
        fetchPrices(q, { depart: q.date, ret: month(q.returnDate) }),
        fetchPrices(q, { depart: month(q.date), ret: q.returnDate }),
        // İkisi de birkaç gün kaysın (±7 için)
        fetchPrices(q, { depart: month(q.date), ret: month(q.returnDate) }),
      ]
    : [fetchPrices(q, { depart: month(q.date) })];
  const today = new Date().toISOString().slice(0, 10);
  const [settled, rates] = await Promise.all([Promise.allSettled(calls), getRates()]);
  const all = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  // Önce ±days, hiç yoksa ±7 gün
  for (const d of days < 7 ? [days, 7] : [days]) {
    const found = pick(all, q, d, today, limit, rates);
    if (found.length) return found;
  }
  return [];
}

const shift = (x: TpItem, q: SearchQuery) =>
  dayDiff(x.departure_at, q.date) + (q.returnDate && x.return_at ? dayDiff(x.return_at, q.returnDate) : 0);

function pick(all: TpItem[], q: SearchQuery, days: number, today: string, limit: number, rates: Rates): Offer[] {
  const items = all
    .filter(
      (x) =>
        x.departure_at.slice(0, 10) >= today &&
        Date.parse(x.departure_at) > Date.now() + SOON_MS &&
        dayDiff(x.departure_at, q.date) <= days &&
        (!q.returnDate || (x.return_at && dayDiff(x.return_at, q.returnDate) <= days && x.return_at > x.departure_at)),
    )
    // Seçilen tarihlere en yakın günler önce (sonra fiyat): 18 Ara seçen önce 17–19 Ara'yı görsün
    .sort((a, b) => shift(a, q) - shift(b, q) || a.price - b.price);
  // Her tarih çifti için en ucuz uçuş ve (aktarmalıysa) en ucuz direkt uçuş: liste farklı günleri göstersin
  const seen = new Set<string>();
  const out: Offer[] = [];
  for (const x of items) {
    const k = `${x.departure_at.slice(0, 10)}|${x.return_at?.slice(0, 10) ?? ""}|${x.transfers === 0 && !x.return_transfers ? "d" : "x"}`;
    if (seen.has(k)) continue;
    seen.add(k);
    const dq = { ...q, date: x.departure_at.slice(0, 10), returnDate: x.return_at?.slice(0, 10) };
    out.push(toOffer(x, dq, rates));
    if (out.length >= limit) break;
  }
  return out;
}

/** `/aviasales/v3/grouped_prices` yanıtındaki gün kaydı */
export type GroupedPriceItem = {
  origin: string;
  destination: string;
  origin_airport?: string;
  destination_airport?: string;
  price: number;
  airline?: string;
  flight_number?: string | number;
  departure_at: string;
  return_at?: string;
  transfers?: number;
  return_transfers?: number;
  duration?: number;
  duration_to?: number;
  duration_back?: number;
  link?: string;
};

export type GroupedPricesParams = {
  origin: string;
  destination: string;
  /** YYYY-MM ya da YYYY-MM-DD */
  departureAt: string;
  /** YYYY-MM ya da YYYY-MM-DD; tek yön için boş bırakılır */
  returnAt?: string;
  groupBy?: "departure_at" | "month";
  minTripDuration?: number;
  maxTripDuration?: number;
  direct?: boolean;
  cabin?: SearchQuery["cabin"];
};

/**
 * Tek istekte bir ayın her günü (ya da ayları) için en ucuz önbellekli fiyat.
 * Tarih şeridi, fiyat takvimi ve fırsat motoru tarafından kullanılır.
 */
export async function groupedPrices(params: GroupedPricesParams): Promise<Record<string, GroupedPriceItem>> {
  const token = travelpayoutsToken();
  if (!token) throw new TravelpayoutsError("TRAVELPAYOUTS_TOKEN tanımlı değil");
  // grouped_prices yalnızca ekonomi sınıfı döndürür; başka kabinde yanlış fiyat göstermemek için boş dön
  if (params.cabin && params.cabin !== "economy") return {};
  const p = new URLSearchParams({
    origin: params.origin.replace(/^city:/, ""),
    destination: params.destination.replace(/^city:/, ""),
    departure_at: params.departureAt,
    group_by: params.groupBy ?? "departure_at",
    currency: "eur",
  });
  if (params.returnAt) p.set("return_at", params.returnAt);
  if (params.minTripDuration !== undefined) p.set("min_trip_duration", String(params.minTripDuration));
  if (params.maxTripDuration !== undefined) p.set("max_trip_duration", String(params.maxTripDuration));
  if (params.direct) p.set("direct", "true");
  const res = await fetch(`${API}/aviasales/v3/grouped_prices?${p}`, {
    headers: { "X-Access-Token": token, "Accept-Encoding": "gzip" },
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  if (!res.ok) throw new TravelpayoutsError(`Travelpayouts ${res.status}`, res.status);
  const body = (await res.json()) as { success?: boolean; data?: Record<string, GroupedPriceItem>; error?: string };
  if (body.success === false) throw new TravelpayoutsError(`Travelpayouts: ${body.error ?? "hata"}`, 502);
  return body.data ?? {};
}

/**
 * Sabit gidiş günü (`depart`) için verilen dönüş ayındaki (`returnMonth`: YYYY-MM) en ucuz kişi başı fiyatlar (TRY).
 * Takvimde dönüş günü seçilirken kullanılır; tek istekte ayın dönüş günlerini getirir.
 */
export async function returnMonthPrices(params: {
  origin: string;
  destination: string;
  depart: string;
  returnMonth: string;
  cabin?: SearchQuery["cabin"];
}): Promise<Record<string, number>> {
  const cls = TRIP_CLASS[params.cabin ?? "economy"];
  if (cls === undefined) return {};
  const q: SearchQuery = {
    from: params.origin.replace(/^city:/, ""),
    to: params.destination.replace(/^city:/, ""),
    date: params.depart,
    returnDate: params.returnMonth,
    pax: { adults: 1, children: 0, infants: 0 },
    cabin: params.cabin ?? "economy",
  };
  const [items, rates] = await Promise.all([fetchOnce(q, { depart: params.depart, ret: params.returnMonth }, false), getRates()]);
  const out: Record<string, number> = {};
  for (const x of items) {
    if (!x.return_at || !x.departure_at.startsWith(params.depart) || x.return_at <= x.departure_at) continue;
    if (Date.parse(x.departure_at) <= Date.now() + SOON_MS) continue;
    const retDay = x.return_at.slice(0, 10);
    const price = toTry(x.price, "EUR", rates);
    if (out[retDay] === undefined || price < out[retDay]) out[retDay] = price;
  }
  return out;
}
