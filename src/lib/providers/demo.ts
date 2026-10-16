// Örnek veri sağlayıcısı: gerçek API anahtarı yokken her rota, tarih ve yolcu sayısı için
// tutarlı (aynı aramada hep aynı) teklifler üretir. Fiyatlar ve saatler ÖRNEKTİR.
import { distanceKm, findAirport, type Airport } from "@/data/airports";
import { addDays, todayIso, type SearchQuery } from "../search";
import type { BagOption, Booking, FlightProvider, Leg, Offer, OrderInput } from "./types";

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
  const anyTr = a.country === "Türkiye" || b.country === "Türkiye";
  const pick = anyTr ? ["IST", "SAW", "AYT"] : ["AMS", "FRA", "MUC"];
  const code = pick.find((c) => c !== a.code && c !== b.code && findAirport(c)!.slug !== a.slug && findAirport(c)!.slug !== b.slug)!;
  return findAirport(code)!;
}

function hasDirect(a: Airport, b: Airport): boolean {
  if (a.country === "Türkiye" && b.country === "Türkiye") return a.size >= 2 || b.size >= 2;
  return Math.min(a.size, b.size) >= 2;
}

function bagInfo(airline: string): string {
  const main = airline.split(" + ")[0];
  if (FULL_SERVICE.has(main)) return "Kabin bavulu + 23 kg dahil";
  if (HOLIDAY.has(main)) return "Kabin bavulu + 20 kg dahil";
  return "Küçük çanta dahil";
}

function bagOptions(info: string, km: number): BagOption[] {
  const scale = Math.max(0.6, Math.min(1.4, km / 2200));
  if (info.includes("23 kg") || info.includes("20 kg")) {
    return [{ kind: "small", price: 0 }, { kind: "cabin", price: 0 }, { kind: "big", price: 0 }];
  }
  return [
    { kind: "small", price: 0 },
    { kind: "cabin", price: round10(640 * scale) },
    { kind: "big", price: round10(1380 * scale) },
  ];
}

const hhmm = (mins: number) => `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

function makeLeg(r: () => number, a: Airport, b: Airport, date: string, airline: string, via?: Airport): Leg {
  const depMins = round5(6 * 60 + r() * 15 * 60);
  let mins: number;
  let viaInfo: Leg["via"];
  if (via) {
    const wait = round5(55 + r() * 130);
    mins = flightMins(a, via) + wait + flightMins(via, b);
    viaInfo = { city: via.city, code: via.code, waitMins: wait };
  } else {
    mins = flightMins(a, b);
  }
  // Basit saat dilimi farkı: Türkiye kışın Batı Avrupa'dan +2 saat.
  const tz = (x: Airport) => (x.country === "Türkiye" ? 3 : x.country === "Birleşik Krallık" || x.country === "Portekiz" ? 0 : 1);
  const arrAbs = depMins + mins + (tz(b) - tz(a)) * 60;
  return {
    date,
    dep: hhmm(depMins),
    arr: hhmm(((arrAbs % 1440) + 1440) % 1440),
    arrDayOffset: Math.floor(arrAbs / 1440),
    fromCode: a.code,
    toCode: b.code,
    fromCity: a.city,
    toCity: b.city,
    airline,
    mins,
    via: viaInfo,
    stops: via ? 1 : 0,
  };
}

function generate(q: SearchQuery): Offer[] {
  const a = findAirport(q.from);
  const b = findAirport(q.to);
  if (!a || !b) return [];
  const r = rng(hash(`${q.from}-${q.to}-${q.date}-${q.returnDate ?? ""}`));
  const km = distanceKm(a, b);
  const list = carriers(a, b);
  const hub = hubFor(a, b);
  const direct = hasDirect(a, b);

  const daysAhead = Math.max(0, (Date.parse(q.date) - Date.parse(todayIso())) / 86400000);
  const month = Number(q.date.slice(5, 7));
  const season = month === 7 || month === 8 ? 1.35 : month === 6 || month === 12 ? 1.15 : 1;
  const urgency = daysAhead < 7 ? 1.4 : daysAhead < 21 ? 1.15 : 1;
  const base = (700 + km * 1.05) * season * urgency * (q.returnDate ? 1.85 : 1);

  const plans: { airline: string; via?: Airport; factor: number }[] = [];
  if (direct) {
    const n = 2 + Math.floor(r() * 2);
    for (let i = 0; i < n; i++) {
      const airline = list[(i + Math.floor(r() * list.length)) % list.length];
      if (plans.some((p) => p.airline === airline)) continue;
      plans.push({ airline, factor: (FULL_SERVICE.has(airline) ? 1.45 : 1.15) * (0.9 + r() * 0.3) });
    }
  }
  const transferAirlines = a.country === "Türkiye" || b.country === "Türkiye"
    ? ["Turkish Airlines", "Pegasus", "Transavia + Pegasus"]
    : ["KLM", "Lufthansa", "Transavia + KLM"];
  const nT = direct ? 2 : 3;
  for (let i = 0; i < nT; i++) {
    const airline = transferAirlines[i % transferAirlines.length];
    plans.push({ airline, via: hub, factor: (FULL_SERVICE.has(airline) ? 1.6 : 0.85) * (0.9 + r() * 0.3) });
  }

  const pax = q.pax;
  return plans.map((p, i) => {
    const outbound = makeLeg(r, a, b, q.date, p.airline, p.via);
    const inbound = q.returnDate ? makeLeg(r, b, a, q.returnDate, p.airline, p.via) : undefined;
    const price = round10(base * p.factor);
    // Çocuk %75, bebek %10 ödenir (örnek kural).
    const total = round10(price * (pax.adults + pax.children * 0.75 + pax.infants * 0.1));
    const info = bagInfo(p.airline);
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
      offer: { fromCity: offer.fromCity, toCity: offer.toCity, airline: offer.airline, outbound: offer.outbound, inbound: offer.inbound },
      total: totalTry,
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
