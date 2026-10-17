// Sonuç filtreleri ve aynı uçuşun paketlerini gruplama (istemcide çalışır).
import { addDays } from "./search";
import { wantedBagsExtra } from "./extras";
import type { BagChoice, Leg, Offer } from "./providers/types";

export type StopsFilter = "any" | "0" | "1" | "2";
export type TimeSlot = "night" | "morning" | "afternoon" | "evening";
export const TIME_SLOTS: TimeSlot[] = ["night", "morning", "afternoon", "evening"];

export type Filters = {
  /** Yolcu başı istenen bagaj (dahil olanlar sayılır). */
  bags: BagChoice;
  stops: StopsFilter;
  overnight: boolean;
  /** Seçili havayolları; null = hepsi */
  airlines: string[] | null;
  outTimes: TimeSlot[];
  inTimes: TimeSlot[];
  /** Her yön için en fazla süre (saat); null = sınırsız */
  maxHours: number | null;
};

export const DEFAULT_FILTERS: Filters = {
  bags: { cabin: 0, checked: 0 },
  stops: "any",
  overnight: true,
  airlines: null,
  outTimes: [],
  inTimes: [],
  maxHours: null,
};

export const activeFilterCount = (f: Filters) =>
  [f.bags.cabin || f.bags.checked, f.stops !== "any", !f.overnight, f.airlines !== null, f.outTimes.length, f.inTimes.length, f.maxHours !== null].filter(Boolean).length;

export const carriersOf = (o: Offer) => o.airline.split(" + ");

const slotOf = (hhmm: string): TimeSlot => {
  const h = Number(hhmm.slice(0, 2));
  return h < 6 ? "night" : h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
};

/** Aktarmada gece yarısını geçen bekleme var mı? */
export function hasOvernightLayover(leg: Leg): boolean {
  const segs = leg.segments ?? [];
  return segs.slice(0, -1).some((s, i) => segs[i + 1].date > addDays(s.date, s.arrDayOffset));
}

const legs = (o: Offer) => [o.outbound, ...(o.inbound ? [o.inbound] : [])];

/** Aynı uçuşlar (paketi farklı) aynı anahtarı taşır. */
export function itineraryKey(o: Offer): string {
  const part = (l: Leg) =>
    l.segments?.length ? l.segments.map((s) => `${s.flightNumber ?? s.carrier}@${s.date}T${s.dep}`).join(">") : `${l.date}T${l.dep}-${l.arr}:${l.airline}`;
  return legs(o).map(part).join("|");
}

/** Filtre sonrası teklif: istenen bagaj eklenmiş yolcu başı fiyatla. */
export type Priced = { offer: Offer; price: number; bagExtra: number };

export function applyFilters(offers: Offer[], f: Filters): Priced[] {
  const out: Priced[] = [];
  for (const o of offers) {
    const wanted = wantedBagsExtra(o.bags, f.bags);
    if (!wanted) continue;
    const ls = legs(o);
    if (f.stops !== "any" && ls.some((l) => l.stops > Number(f.stops))) continue;
    if (!f.overnight && ls.some(hasOvernightLayover)) continue;
    if (f.airlines && !carriersOf(o).every((c) => f.airlines!.includes(c))) continue;
    if (f.outTimes.length && !f.outTimes.includes(slotOf(o.outbound.dep))) continue;
    if (o.inbound && f.inTimes.length && !f.inTimes.includes(slotOf(o.inbound.dep))) continue;
    if (f.maxHours !== null && ls.some((l) => l.mins > f.maxHours! * 60)) continue;
    out.push({ offer: o, price: o.price + wanted.extra, bagExtra: wanted.extra });
  }
  return out;
}

export type Group = { key: string; best: Priced; fares: Priced[] };

/** Aynı uçuşun paketleri tek kartta; kartta en ucuz paket gösterilir. */
export function groupByItinerary(list: Priced[]): Group[] {
  const map = new Map<string, Priced[]>();
  for (const p of list) {
    const k = itineraryKey(p.offer);
    map.set(k, [...(map.get(k) ?? []), p]);
  }
  return [...map.entries()].map(([key, fares]) => {
    const sorted = [...fares].sort((a, b) => a.price - b.price);
    return { key, best: sorted[0], fares: sorted };
  });
}

/** Süre filtresinin sınırları (saat) */
export function durationBounds(offers: Offer[]): [number, number] {
  const mins = offers.flatMap((o) => legs(o).map((l) => l.mins));
  if (!mins.length) return [1, 24];
  return [Math.ceil(Math.min(...mins) / 60), Math.ceil(Math.max(...mins) / 60)];
}
