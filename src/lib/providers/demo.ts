// Örnek veri sağlayıcısı: gerçek API anahtarı yokken her rota, tarih ve yolcu sayısı için
// tutarlı (aynı aramada hep aynı) teklifler üretir. Fiyatlar ve saatler ÖRNEKTİR.
import { distanceKm, findAirport, type Airport } from "@/data/airports";
import { addDays, todayIso, type SearchQuery } from "../search";
import { bagsCost, mergeBags } from "../extras";
import type { ChangeOption, ChangeRequest, BagInfo, BagOffer, Bags, BagSpecs, Booking, CabinClass, FareConditions, FlightProvider, Leg, Offer, OrderInput, SeatMap, SeatRow, Segment } from "./types";

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

const FULL_SERVICE = new Set([
  "Turkish Airlines", "KLM", "Lufthansa", "British Airways", "Air France", "Emirates", "Qatar Airways",
  "ITA Airways", "Iberia", "Brussels Airlines", "Austrian", "Swiss", "TAP Air Portugal", "Aegean",
]);
const LONG_HAUL_KM = 4000;
const isTr = (x: Airport) => x.country === "TR";

// Uzun mesafede direkt uçuşu yalnızca uç noktaların ülkesindeki örnek havayolu yapar;
// aktarmalılar kendi merkezlerinden bağlanır (HUB_OF).
const HOME_CARRIER: Record<string, string> = {
  TR: "Turkish Airlines", NL: "KLM", DE: "Lufthansa", GB: "British Airways", FR: "Air France", AE: "Emirates", QA: "Qatar Airways",
};
const HUB_OF: Record<string, string> = {
  "Turkish Airlines": "IST", Pegasus: "SAW", AJet: "SAW", Emirates: "DXB", "Qatar Airways": "DOH",
  KLM: "AMS", Lufthansa: "FRA", "Air France": "CDG", Austrian: "VIE", Swiss: "ZRH",
};
const homeCarriers = (a: Airport, b: Airport) =>
  [...new Set([a, b].map((x) => HOME_CARRIER[x.country]).filter((x): x is string => !!x))];
const HOLIDAY = new Set(["SunExpress", "Corendon"]);
const EU_HOME: Record<string, string> = {
  NL: "KLM", DE: "Lufthansa", FR: "Air France", GB: "British Airways", IT: "ITA Airways", ES: "Iberia", BE: "Brussels Airlines",
  AT: "Austrian", CH: "Swiss", PT: "TAP Air Portugal", GR: "Aegean",
};

function carriers(a: Airport, b: Airport): string[] {
  if (distanceKm(a, b) > LONG_HAUL_KM) return homeCarriers(a, b);
  const tr = [a, b].filter(isTr).length;
  if (tr === 2) return ["Pegasus", "Turkish Airlines", "AJet", "SunExpress"];
  if (tr === 1) {
    // Tatil havayolları (SunExpress, Corendon, Transavia) yalnızca gurbetçi/tatil pazarlarında uçar.
    const other = isTr(a) ? b : a;
    if (other.country === "NL") return ["Pegasus", "Turkish Airlines", "SunExpress", "Corendon", "Transavia"];
    if (["DE", "AT", "CH", "BE"].includes(other.country)) return ["Pegasus", "Turkish Airlines", "SunExpress", "Corendon"];
    return ["Turkish Airlines", "Pegasus", "AJet"];
  }
  // Avrupa içi: uç noktaların ülkesindeki ana havayolları ve o pazarda uçan düşük maliyetliler
  const home = [a, b].map((x) => EU_HOME[x.country]).filter((x): x is string => !!x);
  const countries = [a.country, b.country];
  const lowCost = [
    "easyJet",
    ...(countries.some((c) => c === "NL" || c === "FR") ? ["Transavia"] : []),
    ...(countries.includes("ES") ? ["Vueling"] : []),
  ];
  return [...new Set([...home, ...lowCost])];
}

function hubFor(a: Airport, b: Airport): Airport {
  // İstanbul'un kendisi bir uç noktaysa aktarma Avrupa'da olur; Türkiye'nin başka şehirlerine İstanbul üzerinden.
  const istanbul = (x: Airport) => x.slug === "istanbul";
  const anyTr = isTr(a) || isTr(b);
  const pick = distanceKm(a, b) > LONG_HAUL_KM
    ? ["IST", "DXB", "DOH", "FRA"]
    : anyTr && !istanbul(a) && !istanbul(b) ? ["IST", "SAW"] : ["FRA", "VIE", "MUC", "AMS"];
  const code = pick.find((c) => {
    const h = findAirport(c)!;
    return h.slug !== a.slug && h.slug !== b.slug;
  })!;
  return findAirport(code)!;
}

function hasDirect(a: Airport, b: Airport): boolean {
  if (distanceKm(a, b) > LONG_HAUL_KM) return a.size >= 3 && b.size >= 3 && homeCarriers(a, b).length > 0;
  if (isTr(a) && isTr(b)) return a.size >= 2 || b.size >= 2;
  return Math.min(a.size, b.size) >= 2;
}

const CABIN_FACTOR: Record<CabinClass, number> = { economy: 1, premium_economy: 1.6, business: 3.2, first: 5 };

/**
 * Örnek bagaj kuralları (havayollarının yaygın ölçülerine yakın; kesin değildir, örnek veridir).
 * Kişisel eşya ve kabin bavulu: en×boy×yükseklik cm; kontrol edilen bagaj: kg ve toplam ölçü.
 */
type Policy = { personal: [number, number, number]; cabin: [number, number, number]; cabinKg: number; checkedKg: number };
const DEFAULT_POLICY: Policy = { personal: [40, 30, 15], cabin: [55, 40, 20], cabinKg: 8, checkedKg: 23 };
const POLICY: Record<string, Partial<Policy>> = {
  KLM: { personal: [40, 30, 15], cabin: [55, 35, 25], cabinKg: 12 },
  "Air France": { cabin: [55, 35, 25], cabinKg: 12 },
  Lufthansa: { cabin: [55, 40, 23] },
  "Turkish Airlines": { cabin: [55, 40, 23] },
  "British Airways": { cabin: [56, 45, 25], cabinKg: 23 },
  Pegasus: { checkedKg: 20 },
  AJet: { checkedKg: 20 },
  SunExpress: { cabin: [55, 40, 23], checkedKg: 20 },
  Corendon: { checkedKg: 20 },
  Transavia: { personal: [40, 30, 20], cabin: [55, 40, 25], cabinKg: 10, checkedKg: 20 },
  easyJet: { personal: [45, 36, 20], cabin: [56, 45, 25], cabinKg: 15 },
  Vueling: { personal: [40, 30, 20], cabinKg: 10 },
  Emirates: { cabin: [55, 38, 20], cabinKg: 7, checkedKg: 30 },
  "Qatar Airways": { cabin: [50, 37, 25], cabinKg: 7, checkedKg: 25 },
};
const policyOf = (airline: string): Policy => ({ ...DEFAULT_POLICY, ...POLICY[airline.split(" + ")[0]] });

function specsFor(airline: string, info: BagInfo): BagSpecs {
  const p = policyOf(airline);
  return {
    personal: { dims: p.personal },
    cabin: { kg: p.cabinKg, dims: p.cabin },
    checked: { kg: info.checkedKg ?? p.checkedKg, linearCm: 158 },
  };
}

function bagInfo(airline: string, cabin: CabinClass): BagInfo {
  const main = airline.split(" + ")[0];
  if (cabin === "business" || cabin === "first") return { cabin: true, checked: true, checkedKg: 32, checkedCount: 2 };
  if (FULL_SERVICE.has(main)) return { cabin: true, checked: true, checkedKg: policyOf(airline).checkedKg, checkedCount: 1 };
  if (HOLIDAY.has(main)) return { cabin: true, checked: true, checkedKg: policyOf(airline).checkedKg, checkedCount: 1 };
  return { cabin: false };
}

type Fare = { brand: string; factor: number; info: BagInfo; conditions: FareConditions };

/**
 * Örnek paketler: aynı uçuş için havayolunun sattığı tarifeler (ör. Light / Standard / Flex).
 * İlk paket en ucuzudur.
 */
function faresFor(airline: string, cabin: CabinClass): Fare[] {
  const main = airline.split(" + ")[0];
  const base = bagInfo(airline, cabin);
  if (cabin === "business" || cabin === "first") return [{ brand: "Flex", factor: 1, info: base, conditions: { refundable: true, changeable: true } }];
  if (cabin === "premium_economy") return [{ brand: "Comfort", factor: 1, info: base, conditions: { refundable: false, changeable: true, changeFee: 2000 } }];
  const flex = (factor: number, kg: number): Fare => ({
    brand: "Flex", factor, info: { cabin: true, checked: true, checkedKg: kg, checkedCount: 1 }, conditions: { refundable: true, changeable: true, changeFee: 0, refundFee: 0 },
  });
  if (FULL_SERVICE.has(main)) {
    return [
      { brand: "Light", factor: 0.88, info: { cabin: true }, conditions: { refundable: false, changeable: false } },
      { brand: "Standard", factor: 1, info: base, conditions: { refundable: false, changeable: true, changeFee: 1600 } },
      flex(1.35, 23),
    ];
  }
  if (HOLIDAY.has(main)) return [{ brand: "Basic", factor: 1, info: base, conditions: { refundable: false, changeable: false } }, flex(1.3, 20)];
  return [
    { brand: "Basic", factor: 1, info: base, conditions: { refundable: false, changeable: false } },
    { brand: "Plus", factor: 1.28, info: { cabin: true, checked: true, checkedKg: 20, checkedCount: 1 }, conditions: { refundable: false, changeable: true, changeFee: 1200 } },
  ];
}

/** Ek bagaj fiyatları (yolcu başı, adet başı; dönüşlü yolculukta iki yön). */
function bagsFor(info: BagInfo, km: number, roundTrip: boolean, airline = ""): Bags {
  const scale = Math.max(0.6, Math.min(1.4, km / 2200)) * (roundTrip ? 2 : 1);
  const included = info.checked ? (info.checkedCount ?? 1) : 0;
  const p = policyOf(airline);
  return {
    cabin: info.cabin ? { included: 1, max: 0, kg: p.cabinKg } : { included: 0, price: round10(640 * scale), max: 1, kg: p.cabinKg },
    checked: { included, price: round10(1380 * scale), max: 2, kg: info.checkedKg ?? p.checkedKg },
    // Örnek: daha ağır bagaj seçeneği (32 kg)
    ...((info.checkedKg ?? p.checkedKg) < 32 ? { heavy: { included: 0, price: round10(2200 * scale), max: 2, kg: 32 } } : {}),
  };
}

const hhmm = (mins: number) => `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

// Havayolu IATA kodları (uçuş numarası için) ve örnek uçak tipleri.
const IATA: Record<string, string> = {
  Pegasus: "PC", "Turkish Airlines": "TK", SunExpress: "XQ", Corendon: "XC", Transavia: "HV", KLM: "KL",
  easyJet: "U2", Lufthansa: "LH", Vueling: "VY", "British Airways": "BA", AJet: "VF", "Air France": "AF",
  Emirates: "EK", "Qatar Airways": "QR", "ITA Airways": "AZ", Iberia: "IB", "Brussels Airlines": "SN", Austrian: "OS",
  Swiss: "LX", "TAP Air Portugal": "TP", Aegean: "A3",
};
const AIRCRAFT = ["Airbus A320neo", "Airbus A321neo", "Boeing 737-800", "Boeing 737 MAX 8"];
const WIDEBODY = ["Airbus A350-900", "Boeing 777-300ER", "Boeing 787-9"];

// Basit saat dilimi: Türkiye UTC+3, diğerleri boylamdan yaklaşık (yaz/kış saati yok sayılır).
const tz = (x: Airport) => (isTr(x) ? 3 : Math.round(x.lon / 15));

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
      aircraft: (mins > 300 ? WIDEBODY : AIRCRAFT)[Math.floor(r() * (mins > 300 ? WIDEBODY : AIRCRAFT).length)],
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
  // Aktarmalı biletler havayolunun kendi merkezinden bağlanır; büyük sapma yapan merkez seçilmez.
  const candidates = km > LONG_HAUL_KM
    ? ["Turkish Airlines", "Emirates", "Qatar Airways"]
    : isTr(a) || isTr(b)
    ? ["Turkish Airlines", "Pegasus", "AJet"]
    : ["KLM", "Lufthansa", "Air France", "Austrian", "Swiss"];
  const transfers = candidates
    .map((airline) => ({ airline, via: findAirport(HUB_OF[airline]) }))
    .filter((t): t is { airline: string; via: Airport } =>
      !!t.via && t.via.city !== a.city && t.via.city !== b.city && distanceKm(a, t.via) + distanceKm(t.via, b) < km * 1.5,
    );
  if (!transfers.length) transfers.push({ airline: candidates[0], via: hub });
  const transferPool = premium ? transfers.filter((x) => FULL_SERVICE.has(x.airline)) : transfers;
  const nT = Math.min(premium ? 2 : direct ? 2 : 3, transferPool.length);
  for (let i = 0; i < nT; i++) {
    const { airline, via } = transferPool[i];
    // Direkt uçuş olan rotalarda aktarmalı bilet genelde daha ucuz değildir.
    const lowCost = direct ? 1.2 : 0.85;
    plans.push({ airline, via, factor: (FULL_SERVICE.has(airline) ? 1.6 : lowCost) * (0.9 + r() * 0.3) });
  }

  const pax = q.pax;
  const offers: Omit<Offer, "id">[] = plans.flatMap((p) => {
    const outbound = makeLeg(r, a, b, q.date, p.airline, p.via);
    const inbound = q.returnDate ? makeLeg(r, b, a, q.returnDate, p.airline, p.via) : undefined;
    return faresFor(p.airline, cabin).map((fare) => {
      const price = round10(base * p.factor * fare.factor);
      // Çocuk %75, bebek %10 ödenir (örnek kural).
      const total = round10(price * (pax.adults + pax.children * 0.75 + pax.infants * 0.1));
      return {
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
        bagInfo: fare.info,
        bags: bagsFor(fare.info, km, !!q.returnDate, p.airline),
        bagSpecs: specsFor(p.airline, fare.info),
        cabin,
        fareBrand: fare.brand,
        conditions: fare.conditions,
        passportRequired: a.country !== b.country,
        hold: demoHold(p.airline, q.date),
      };
    });
  });
  return offers.map((o, i) => ({ ...o, id: encodeId(q, i) }));
}

/**
 * Örnek "sonra öde": yalnızca tam hizmet havayollarında ve kalkışa en az 4 gün varken;
 * son ödeme 3 gün sonra, fiyat o zamana kadar garanti.
 */
function demoHold(airline: string, date: string): Offer["hold"] {
  if (!FULL_SERVICE.has(airline.split(" + ")[0])) return undefined;
  const payDay = addDays(todayIso(), 3);
  if (addDays(payDay, 1) >= date) return undefined;
  const payBy = `${payDay}T21:00:00Z`;
  return { payBy, priceGuaranteedUntil: payBy };
}

/** Örnek koltuk haritası: aynı teklif ve bacak için hep aynı dolu koltuklar ve fiyatlar. */
function demoSeatMap(offer: Offer, segment: number, seg: Segment): SeatMap {
  const wide = /A350|777|787/.test(seg.aircraft ?? "");
  const columns: (string | null)[] = wide ? ["A", "B", "C", null, "D", "E", "F", "G", null, "H", "J", "K"] : ["A", "B", "C", null, "D", "E", "F"];
  const rowCount = wide ? 40 : 30;
  const exitRows = wide ? [20] : [12, 13];
  const r = rng(hash(`${offer.id}-${segment}`));
  const fullService = FULL_SERVICE.has(seg.carrier) && offer.fareBrand !== "Light";
  const freeAll = offer.fareBrand === "Flex" || offer.cabin === "business" || offer.cabin === "first";
  const km = seg.mins * 13;
  const unit = Math.max(0.7, Math.min(1.8, km / 2600));
  const rows: SeatRow[] = Array.from({ length: rowCount }, (_, k) => {
    const number = k + 1;
    const exit = exitRows.includes(number);
    const front = number <= 3;
    return {
      number,
      exit,
      seats: columns.map((col) => {
        if (!col) return null;
        const window = col === "A" || col === columns[columns.length - 1];
        const aisle = columns[columns.indexOf(col) - 1] === null || columns[columns.indexOf(col) + 1] === null;
        let price = front ? 2000 : exit ? 1800 : number > rowCount - 8 ? 1100 : 1300;
        if (window || aisle) price += 40;
        price = round10(price * unit);
        if (freeAll || (fullService && !front && !exit)) price = 0;
        return { designator: `${number}${col}`, available: r() > 0.38, price, legroom: exit };
      }),
    };
  });
  return { segment, fromCode: seg.fromCode, toCode: seg.toCode, columns, rows };
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
  async seatMaps(offer) {
    const segs = [...(offer.outbound.segments ?? []), ...(offer.inbound?.segments ?? [])];
    return segs.map((seg, i) => demoSeatMap(offer, i, seg));
  },
  async createOrder(input: OrderInput, offer: Offer, totalTry: number): Promise<Booking> {
    if (input.hold && !offer.hold) throw new Error("Bu teklif ayrılamıyor.");
    return {
      held: input.hold ? offer.hold : undefined,
      id: "demo-" + hash(input.offerId + input.email + Date.now()).toString(36),
      provider: "demo",
      email: input.email,
      offer: { airline: offer.airline, outbound: offer.outbound, inbound: offer.inbound },
      total: totalTry,
      createdAt: new Date().toISOString(),
    };
  },
  async payHeld(booking) {
    return { ...booking, held: undefined };
  },
  // Örnek iptal: iade edilebilir bilette tamamı, edilemeyende hiçbir şey; ödenmemiş ayırmada iade yok.
  async cancelQuote(booking) {
    const refund = booking.held ? 0 : booking.refundable ? booking.total : 0;
    return { id: "demo-cancel", refund, refundTo: booking.held ? undefined : "original_form_of_payment" };
  },
  // Örnek: rezervasyondaki fiyatlarla; daha önce alınan bagaj üst sınırdan düşülür.
  async orderBags(booking) {
    const a = findAirport(booking.offer.outbound.fromCode);
    const b = findAirport(booking.offer.outbound.toCode);
    if (!a || !b) return null;
    const inc = booking.includedBags ?? { cabin: 0, checked: 0 };
    const extra = booking.extraBags ?? [];
    const hasCabin = inc.cabin > 0 || extra.some((x) => x.cabin > 0);
    const bags = bagsFor({ cabin: hasCabin, checked: inc.checked > 0, checkedCount: inc.checked || undefined, checkedKg: inc.kg }, distanceKm(a, b), !!booking.offer.inbound, booking.offer.airline);
    const boughtChecked = Math.max(0, ...extra.map((x) => x.checked + (x.heavy ?? 0)));
    const left = (b: BagOffer) => ({ ...b, max: Math.max(0, b.max - boughtChecked) });
    return { cabin: bags.cabin, checked: left(bags.checked), ...(bags.heavy ? { heavy: left(bags.heavy) } : {}) };
  },
  async addBags(booking, choices) {
    const bags = await this.orderBags(booking);
    if (!bags) throw new Error("Bagaj eklenemiyor.");
    return { ...booking, total: booking.total + bagsCost(bags, choices), extraBags: mergeBags(booking.extraBags, choices) };
  },
  async cancelConfirm(booking) {
    const { refund } = await this.cancelQuote(booking);
    return { ...booking, held: undefined, cancelled: { at: new Date().toISOString(), refund } };
  },
  async changeOptions(booking, req) {
    return demoChangeOptions(booking, req);
  },
  async changeConfirm(booking, req, optionId, expectedTotal) {
    const option = demoChangeOptions(booking, req).find((o) => o.id === optionId);
    if (!option) throw new Error("Değişiklik seçeneği bulunamadı.");
    if (option.changeTotal !== expectedTotal) throw new Error("Fiyat değişti");
    return {
      ...booking,
      offer: { ...booking.offer, outbound: option.outbound ?? booking.offer.outbound, inbound: option.inbound ?? booking.offer.inbound },
      total: booking.total + option.changeTotal,
      changed: { at: new Date().toISOString(), paid: option.changeTotal },
    };
  },
};

/**
 * Örnek değişiklik: yeni günün örnek uçuşları; ödenecek = değişiklik ücreti + (pahalıysa) fiyat farkı.
 * Kimlik tarih ve sıradan oluşur, onayda aynı hesap yeniden yapılır (istemcinin tutarına güvenilmez).
 */
function demoChangeOptions(booking: Booking, req: ChangeRequest): ChangeOption[] {
  const out = booking.offer.outbound;
  const inn = booking.offer.inbound;
  const paying = booking.payingCount ?? 1;
  const legs = inn ? 2 : 1;
  const both = !!(req.outDate && req.inDate && inn);
  const base = req.outDate ? out : inn;
  if (!base) return [];
  const q: SearchQuery = {
    from: base.fromCode,
    to: base.toCode,
    date: (req.outDate ?? req.inDate)!,
    returnDate: both ? req.inDate : undefined,
    pax: { adults: paying, children: 0, infants: 0 },
    cabin: "economy",
  };
  if (q.date < todayIso() || (both && q.returnDate! < q.date)) return [];
  // Eski bacağın kişi başı payı (örnek): toplam tutar bacaklara eşit bölünür
  const oldShare = Math.round(booking.total / paying / legs) * (both ? 2 : 1);
  const fee = booking.changeFee ?? 1500;
  // Aynı uçuşun paketlerinden en ucuzu (örnekte paket seçimi yok)
  const seen = new Set<string>();
  const offers = generate(q).filter((o) => {
    const k = `${o.airline}|${o.outbound.dep}|${o.inbound?.dep ?? ""}`;
    return !seen.has(k) && !!seen.add(k);
  });
  const same = offers.filter((o) => o.airline === booking.offer.airline);
  return (same.length ? same : offers).slice(0, 6).map((o, i) => {
    const diff = Math.max(0, o.price - oldShare) * paying;
    return {
      id: `demochg_${req.outDate ?? ""}_${req.inDate ?? ""}_${i}`,
      outbound: req.outDate ? o.outbound : undefined,
      inbound: both ? o.inbound : req.inDate ? o.outbound : undefined,
      changeTotal: fee + diff,
      penalty: fee,
      newTotal: booking.total + fee + diff,
    };
  });
}

/** Esnek tarih ipucu: iki gün sonrası daha ucuzsa döner. */
export async function demoFlexibleTip(q: SearchQuery) {
  const later = { ...q, date: addDays(q.date, 2), returnDate: q.returnDate ? addDays(q.returnDate, 2) : undefined };
  const now = Math.min(...generate(q).map((o) => o.price));
  const then = Math.min(...generate(later).map((o) => o.price));
  if (!Number.isFinite(now) || !(then < now)) return null;
  return { query: later, price: then, save: now - then };
}
