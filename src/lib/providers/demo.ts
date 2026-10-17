// Örnek veri sağlayıcısı: gerçek API anahtarı yokken her rota, tarih ve yolcu sayısı için
// tutarlı (aynı aramada hep aynı) teklifler üretir. Fiyatlar ve saatler ÖRNEKTİR.
import { distanceKm, findAirport, type Airport } from "@/data/airports";
import { addDays, todayIso, type SearchQuery } from "../search";
import type { BagInfo, BagOption, Booking, CabinClass, FareConditions, FlightProvider, Leg, Offer, OrderInput, Segment } from "./types";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round5 = (n: number) => Math.round(n / 5) * 5;
const round10 = (n: number) => Math.round(n / 10) * 10;
const flightMins = (a: Airport, b: Airport) => round5(35 + (distanceKm(a, b) / 780) * 60);

const FULL_SERVICE = new Set(["Turkish Airlines", "KLM", "Lufthansa", "British Airways", "Air France"]);
const HOLIDAY = new Set(["SunExpress", "Corendon"]);

function carriers(a: Airport, b: Airport): string[] {
  const tr = [a, b].filter((x) => x.country === "Türkiye").length;
  if (tr === 2) return ["Pegasus", "Turkish Airlines", "AJet", "SunExpress"];
  if (tr === 1) return ["Pegasus", "Turkish Airlines", "SunExpress", "Corendon", "Transavia"];
  if ([a, b].some((x) => x.country === "Birleşik Krallık")) return ["British Airways", "KLM", "easyJet", "Transavia"];
  return ["KLM", "Transavia", "easyJet", "Lufthansa", "Vueling"];
}

function hubFor(a: Airport, b: Airport): Airport {
  // İstanbul'un kendisi bir uç noktaysa aktarma Avrupa'da olur; Türkiye'nin başka şehirlerine İstanbul üzerinden.
  const istanbul = (x: Airport) => x.slug === "istanbul";
  const anyTr = a.country === "Türkiye" || b.country === "Türkiye";
  const pick = anyTr && !istanbul(a) && !istanbul(b) ? ["IST", "SAW"] : ["FRA", "VIE", "MUC", "AMS"];
  const code = pick.find((c) => {
    const h = findAirport(c)!;
    return h.slug !== a.slug && h.slug !== b.slug;
  })!;
  return findAirport(code)!;
}

function hasDirect(a: Airport, b: Airport): boolean {
  if (a.country === "Türkiye" && b.country === "Türkiye") return a.size >= 2 || b.size >= 2;
  return Math.min(a.size, b.size) >= 2;
}

const CABIN_FACTOR: Record<CabinClass, number> = { economy: 1, premium_economy: 1.6, business: 3.2, first: 5 };

function bagInfo(airline: string, cabin: CabinClass): BagInfo {
  const main = airline.split(" + ")[0];
  if (cabin === "business" || cabin === "first") return { cabin: true, checked: true, checkedKg: 32, checkedCount: 2 };
  if (FULL_SERVICE.has(main)) return { cabin: true, checked: true, checkedKg: 23, checkedCount: 1 };
  if (HOLIDAY.has(main)) return { cabin: true, checked: true, checkedKg: 20, checkedCount: 1 };
  return { cabin: false };
}

/** Örnek paket adı ve koşulları. */
function fareFor(airline: string, cabin: CabinClass): { brand: string; conditions: FareConditions } {
  if (cabin === "business" || cabin === "first") return { brand: "Flex", conditions: { refundable: true, changeable: true } };
  if (cabin === "premium_economy") return { brand: "Comfort", conditions: { refundable: false, changeable: true } };
  if (FULL_SERVICE.has(airline.split(" + ")[0])) return { brand: "Standard", conditions: { refundable: false, changeable: true } };
  return { brand: "Basic", conditions: { refundable: false, changeable: false } };
}

function bagOptions(info: BagInfo, km: number): BagOption[] {
  const scale = Math.max(0.6, Math.min(1.4, km / 2200));
  if (info.checked) {
    return [{ kind: "small", price: 0 }, { kind: "cabin", price: 0 }, { kind: "big", price: 0 }];
  }
  return [
    { kind: "small", price: 0 },
    { kind: "cabin", price: round10(640 * scale) },
    { kind: "big", price: round10(1380 * scale) },
  ];
}

const hhmm = (mins: number) => `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

// Havayolu IATA kodları (uçuş numarası için) ve örnek uçak tipleri.
const IATA: Record<string, string> = {
  Pegasus: "PC", "Turkish Airlines": "TK", SunExpress: "XQ", Corendon: "XC", Transavia: "HV", KLM: "KL",
  easyJet: "U2", Lufthansa: "LH", Vueling: "VY", "British Airways": "BA", AJet: "VF", "Air France": "AF",
};
const AIRCRAFT = ["Airbus A320neo", "Airbus A321neo", "Boeing 737-800", "Boeing 737 MAX 8"];

// Basit saat dilimi: Türkiye UTC+3, Birleşik Krallık/Portekiz UTC+0, diğerleri UTC+1 (kış saati yaklaşığı).
const tz = (x: Airport) => (x.country === "Türkiye" ? 3 : x.country === "Birleşik Krallık" || x.country === "Portekiz" ? 0 : 1);

function makeLeg(r: () => number, a: Airport, b: Airport, date: string, airline: string, via?: Airport): Leg {
  const carriers = airline.split(" + ");
  const stops = via ? [a, via, b] : [a, b];
  // Kalkış saatini dakika olarak kalkış yerinin saatinde tutup her bacakta UTC üzerinden ilerliyoruz.
  let utc = round5(6 * 60 + r() * 15 * 60) - tz(a) * 60;
  const startUtc = utc;
  const segments: Segment[] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const from = stops[i];
    const to = stops[i + 1];
    const mins = flightMins(from, to);
    const depLocal = utc + tz(from) * 60;
    const arrLocal = utc + mins + tz(to) * 60;
    const carrier = carriers[Math.min(i, carriers.length - 1)];
    const dayOf = (m: number) => Math.floor(m / 1440);
    segments.push({
      fromCode: from.code,
      toCode: to.code,
      date: dayOf(depLocal) === 0 ? date : addDays(date, dayOf(depLocal)),
      dep: hhmm(((depLocal % 1440) + 1440) % 1440),
      arr: hhmm(((arrLocal % 1440) + 1440) % 1440),
      arrDayOffset: dayOf(arrLocal) - dayOf(depLocal),
      mins,
      carrier,
      flightNumber: `${IATA[carrier] ?? "ZZ"} ${100 + Math.floor(r() * 8900)}`,
      aircraft: AIRCRAFT[Math.floor(r() * AIRCRAFT.length)],
    });
    utc += mins;
    if (i < stops.length - 2) {
      const wait = round5(55 + r() * 130);
      segments[i].layoverMins = wait;
      utc += wait;
    }
  }
  const first = segments[0];
  const last = segments[segments.length - 1];
  const arrLocalAbs = utc + tz(b) * 60;
  const depLocalAbs = startUtc + tz(a) * 60;
  return {
    date,
    dep: first.dep,
    arr: last.arr,
    arrDayOffset: Math.floor(arrLocalAbs / 1440) - Math.floor(depLocalAbs / 1440),
    fromCode: a.code,
    toCode: b.code,
    fromCity: a.city,
    toCity: b.city,
    airline,
    mins: utc - startUtc,
    via: via ? { city: via.city, code: via.code, waitMins: segments[0].layoverMins ?? 0 } : undefined,
    stops: stops.length - 2,
    segments,
  };
}

function generate(q: SearchQuery): Offer[] {
  const a = findAirport(q.from);
  const b = findAirport(q.to);
  if (!a || !b) return [];
  const cabin: CabinClass = q.cabin ?? "economy";
  const r = rng(hash(`${q.from}-${q.to}-${q.date}-${q.returnDate ?? ""}-${cabin}`));
  const km = distanceKm(a, b);
  const list = carriers(a, b);
  const hub = hubFor(a, b);
  const direct = hasDirect(a, b);

  const daysAhead = Math.max(0, (Date.parse(q.date) - Date.parse(todayIso())) / 86400000);
  const month = Number(q.date.slice(5, 7));
  const season = month === 7 || month === 8 ? 1.35 : month === 6 || month === 12 ? 1.15 : 1;
  const urgency = daysAhead < 7 ? 1.4 : daysAhead < 21 ? 1.15 : 1;
  const base = (700 + km * 1.05) * season * urgency * (q.returnDate ? 1.85 : 1) * CABIN_FACTOR[cabin];
  // Düşük maliyetli havayolları ekonomi dışında kabin satmaz.
  const premium = cabin !== "economy";

  const plans: { airline: string; via?: Airport; factor: number }[] = [];
  if (direct) {
    const n = 2 + Math.floor(r() * 2);
    for (let i = 0; i < n; i++) {
      const pool = premium ? list.filter((x) => FULL_SERVICE.has(x)) : list;
      if (!pool.length) break;
      const airline = pool[(i + Math.floor(r() * pool.length)) % pool.length];
      if (plans.some((p) => p.airline === airline)) continue;
      plans.push({ airline, factor: (FULL_SERVICE.has(airline) ? 1.45 : 1.15) * (0.9 + r() * 0.3) });
    }
  }
  const transferAirlines = a.country === "Türkiye" || b.country === "Türkiye"
    ? ["Turkish Airlines", "Pegasus", "Transavia + Pegasus"]
    : ["KLM", "Lufthansa", "Transavia + KLM"];
  const transferPool = premium ? transferAirlines.filter((x) => FULL_SERVICE.has(x)) : transferAirlines;
  const nT = premium ? Math.min(2, transferPool.length) : direct ? 2 : 3;
  for (let i = 0; i < nT; i++) {
    const airline = transferPool[i % transferPool.length];
    plans.push({ airline, via: hub, factor: (FULL_SERVICE.has(airline) ? 1.6 : 0.85) * (0.9 + r() * 0.3) });
  }

  const pax = q.pax;
  return plans.map((p, i) => {
    const outbound = makeLeg(r, a, b, q.date, p.airline, p.via);
    const inbound = q.returnDate ? makeLeg(r, b, a, q.returnDate, p.airline, p.via) : undefined;
    const price = round10(base * p.factor);
    // Çocuk %75, bebek %10 ödenir (örnek kural).
    const total = round10(price * (pax.adults + pax.children * 0.75 + pax.infants * 0.1));
    const info = bagInfo(p.airline, cabin);
    const fare = fareFor(p.airline, cabin);
    return {
      id: encodeId(q, i),
      provider: "demo" as const,
      query: q,
      fromCity: a.city,
      toCity: b.city,
      airline: p.airline,
      outbound,
      inbound,
      price,
      total,
      raw: { amount: String(total), currency: "TRY" },
      bagInfo: info,
      bagOptions: bagOptions(info, km),
      cabin,
      fareBrand: fare.brand,
      conditions: fare.conditions,
      passportRequired: a.country !== b.country,
    };
  });
}

function encodeId(q: SearchQuery, i: number): string {
  return "demo_" + Buffer.from(JSON.stringify({ q, i })).toString("base64url");
}

function decodeId(id: string): { q: SearchQuery; i: number } | null {
  if (!id.startsWith("demo_")) return null;
  try {
    const v = JSON.parse(Buffer.from(id.slice(5), "base64url").toString("utf8"));
    if (typeof v?.i !== "number" || typeof v?.q?.from !== "string") return null;
    return v;
  } catch {
    return null;
  }
}

export const demoProvider: FlightProvider = {
  async search(q) {
    return generate(q);
  },
  async getOffer(id) {
    const d = decodeId(id);
    if (!d || d.q.date < todayIso()) return null;
    return generate(d.q)[d.i] ?? null;
  },
  async createOrder(input: OrderInput, offer: Offer, totalTry: number): Promise<Booking> {
    return {
      id: "demo-" + hash(input.offerId + input.email + Date.now()).toString(36),
      provider: "demo",
      email: input.email,
      offer: { airline: offer.airline, outbound: offer.outbound, inbound: offer.inbound },
      total: totalTry,
      createdAt: new Date().toISOString(),
    };
  },
};

/** Esnek tarih ipucu: iki gün sonrası daha ucuzsa döner. */
export async function demoFlexibleTip(q: SearchQuery) {
  const later = { ...q, date: addDays(q.date, 2), returnDate: q.returnDate ? addDays(q.returnDate, 2) : undefined };
  const now = Math.min(...generate(q).map((o) => o.price));
  const then = Math.min(...generate(later).map((o) => o.price));
  if (!Number.isFinite(now) || !(then < now)) return null;
  return { query: later, price: then, save: now - then };
}
