// Duffel uçuş API'si (https://duffel.com/docs). DUFFEL_ACCESS_TOKEN tanımlıysa kullanılır.
// Test anahtarı (duffel_test_…) ile siparişler Duffel'ın test bakiyesinden ödenir; gerçek para çekilmez.
// Canlı anahtarla sipariş, ödeme altyapısı (Mollie) bağlanana kadar kapalıdır.
import "server-only";
import { findAirport } from "@/data/airports";
import { toTry } from "../currency";
import type { SearchQuery } from "../search";
import type { BagInfo, BagOffer, Bags, CabinClass, Segment, Booking, FlightProvider, Leg, Offer, OrderInput, SeatMap, SeatRow } from "./types";

const API = "https://api.duffel.com";

export class ProviderError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

function token(): string {
  const t = process.env.DUFFEL_ACCESS_TOKEN;
  if (!t) throw new ProviderError("DUFFEL_ACCESS_TOKEN tanımlı değil");
  return t;
}

export const isDuffelTestMode = () => (process.env.DUFFEL_ACCESS_TOKEN ?? "").startsWith("duffel_test_");

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(API + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Duffel-Version": "v2",
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = body?.errors?.[0]?.message ?? `Duffel isteği başarısız (${res.status})`;
    throw new ProviderError(msg, res.status);
  }
  return body.data as T;
}

// --- Duffel yanıt tipleri (kullandığımız alanlar) ---
type DPlace = { iata_code: string; city_name?: string | null; name: string };
type DSegment = {
  id: string;
  departing_at: string;
  arriving_at: string;
  duration?: string | null;
  origin: DPlace;
  destination: DPlace;
  marketing_carrier: { name: string; iata_code?: string | null };
  marketing_carrier_flight_number?: string | null;
  aircraft?: { name?: string | null } | null;
  passengers?: {
    passenger_id: string;
    cabin_class?: string | null;
    cabin_class_marketing_name?: string | null;
    baggages?: { type: "checked" | "carry_on"; quantity: number }[];
  }[];
};
type DSlice = { duration: string | null; origin: DPlace; destination: DPlace; segments: DSegment[]; fare_brand_name?: string | null };
type DConditions = {
  refund_before_departure?: { allowed: boolean } | null;
  change_before_departure?: { allowed: boolean } | null;
} | null;
type DService = {
  id: string;
  type: string;
  total_amount: string;
  total_currency: string;
  passenger_ids: string[];
  segment_ids?: string[];
  maximum_quantity: number;
  metadata?: { type?: "checked" | "carry_on"; maximum_weight_kg?: number | null };
};
type DOffer = {
  id: string;
  total_amount: string;
  total_currency: string;
  expires_at?: string;
  owner: { name: string; logo_symbol_url?: string | null };
  slices: DSlice[];
  passengers: { id: string; type: string }[];
  passenger_identity_documents_required?: boolean;
  available_services?: DService[] | null;
  conditions?: DConditions;
};

const cityOf = (p: DPlace) => findAirport(p.iata_code)?.city ?? p.city_name ?? p.name;

/** ISO 8601 süre (P1DT2H30M) → dakika */
function isoMins(d: string | null, fallback: number): number {
  if (!d) return fallback;
  const m = d.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return fallback;
  return Number(m[1] ?? 0) * 1440 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

const minsBetween = (a: string, b: string) => Math.round((Date.parse(b + "Z") - Date.parse(a + "Z")) / 60000);
const localDate = (s: string) => s.slice(0, 10);
const localTime = (s: string) => s.slice(11, 16);
const dayDiff = (a: string, b: string) => Math.round((Date.parse(localDate(b)) - Date.parse(localDate(a))) / 86400000);

function mapSegment(x: DSegment, next?: DSegment): Segment {
  return {
    fromCode: x.origin.iata_code,
    toCode: x.destination.iata_code,
    date: localDate(x.departing_at),
    dep: localTime(x.departing_at),
    arr: localTime(x.arriving_at),
    arrDayOffset: dayDiff(x.departing_at, x.arriving_at),
    mins: isoMins(x.duration ?? null, minsBetween(x.departing_at, x.arriving_at)),
    carrier: x.marketing_carrier.name,
    flightNumber: x.marketing_carrier_flight_number
      ? `${x.marketing_carrier.iata_code ?? ""} ${x.marketing_carrier_flight_number}`.trim()
      : undefined,
    aircraft: x.aircraft?.name ?? undefined,
    layoverMins: next ? minsBetween(x.arriving_at, next.departing_at) : undefined,
  };
}

function mapLeg(s: DSlice): Leg {
  const first = s.segments[0];
  const last = s.segments[s.segments.length - 1];
  const carriers = [...new Set(s.segments.map((x) => x.marketing_carrier.name))];
  const via = s.segments.length > 1
    ? { city: cityOf(first.destination), code: first.destination.iata_code, waitMins: minsBetween(first.arriving_at, s.segments[1].departing_at) }
    : undefined;
  return {
    date: localDate(first.departing_at),
    dep: localTime(first.departing_at),
    arr: localTime(last.arriving_at),
    arrDayOffset: dayDiff(first.departing_at, last.arriving_at),
    fromCode: s.origin.iata_code,
    toCode: s.destination.iata_code,
    fromCity: cityOf(s.origin),
    toCity: cityOf(s.destination),
    airline: carriers.join(" + "),
    mins: isoMins(s.duration, minsBetween(first.departing_at, last.arriving_at)),
    via,
    stops: s.segments.length - 1,
    segments: s.segments.map((x, i) => mapSegment(x, s.segments[i + 1])),
  };
}

function includedBags(o: DOffer) {
  const bags = o.slices[0]?.segments[0]?.passengers?.[0]?.baggages ?? [];
  const q = (t: string) => bags.filter((b) => b.type === t).reduce((n, b) => n + b.quantity, 0);
  return { checked: q("checked"), carryOn: q("carry_on") };
}

function bagInfo(o: DOffer): BagInfo {
  const { checked, carryOn } = includedBags(o);
  return { cabin: carryOn > 0, checked: checked > 0, checkedCount: checked || undefined };
}

const CABIN_VALUES: CabinClass[] = ["economy", "premium_economy", "business", "first"];

function cabinOf(o: DOffer, q: SearchQuery): CabinClass {
  const c = o.slices[0]?.segments[0]?.passengers?.[0]?.cabin_class;
  return CABIN_VALUES.includes(c as CabinClass) ? (c as CabinClass) : (q.cabin ?? "economy");
}

const payingPassengers = (o: DOffer) => o.passengers.filter((p) => !p.type.startsWith("infant"));

/**
 * Ek bagaj: her ödeyen yolcu için her bacakta (gidiş, dönüş) en ucuz uygun hizmet seçilir.
 * Bir bacakta bile hizmet yoksa o bagaj türü bu teklifte satın alınamaz.
 */
function bagOffer(o: DOffer, t: "carry_on" | "checked", included: number): BagOffer {
  const services = (o.available_services ?? []).filter((s) => s.type === "baggage" && s.metadata?.type === t);
  const perPax = payingPassengers(o).map((p) => {
    const picked = o.slices.map((sl) => {
      const ids = sl.segments.map((x) => x.id);
      return services
        .filter((s) => s.passenger_ids.includes(p.id) && (s.segment_ids ?? []).some((id) => ids.includes(id)))
        .sort((a, b) => Number(a.total_amount) - Number(b.total_amount))[0];
    });
    // Aynı hizmet iki bacağı birden kapsıyorsa bir kez sayılır
    return picked.every(Boolean) ? [...new Map(picked.map((s) => [s!.id, s!])).values()] : null;
  });
  if (!perPax.length || perPax.some((l) => !l)) return { included, max: 0 };
  const lists = perPax as DService[][];
  const amount = lists[0].reduce((n, s) => n + Number(s.total_amount), 0);
  const cap = t === "carry_on" ? Math.max(0, 1 - included) : 3;
  return {
    included,
    price: toTry(amount, lists[0][0].total_currency),
    rawAmount: amount,
    max: Math.min(cap, ...lists.flat().map((s) => s.maximum_quantity)),
    kg: lists[0][0].metadata?.maximum_weight_kg ?? undefined,
    serviceIds: lists.map((l) => l.map((s) => s.id)),
  };
}

function bags(o: DOffer): Bags {
  const { checked, carryOn } = includedBags(o);
  return { cabin: bagOffer(o, "carry_on", carryOn > 0 ? 1 : 0), checked: bagOffer(o, "checked", checked) };
}

// Yalnızca Duffel'ın kendi logo sunucusundan gelen adresler gösterilir.
const logoUrl = (u?: string | null) => (u && u.startsWith("https://assets.duffel.com/") ? u : undefined);

function mapOffer(o: DOffer, q: SearchQuery): Offer {
  const total = toTry(Number(o.total_amount), o.total_currency);
  const paying = Math.max(1, q.pax.adults + q.pax.children);
  return {
    id: o.id,
    provider: "duffel",
    query: q,
    fromCity: cityOf(o.slices[0].origin),
    toCity: cityOf(o.slices[0].destination),
    airline: o.owner.name,
    airlineLogo: logoUrl(o.owner.logo_symbol_url),
    outbound: mapLeg(o.slices[0]),
    inbound: o.slices[1] ? mapLeg(o.slices[1]) : undefined,
    price: Math.round(total / paying),
    total,
    raw: { amount: o.total_amount, currency: o.total_currency },
    bagInfo: bagInfo(o),
    bags: bags(o),
    cabin: cabinOf(o, q),
    fareBrand: o.slices[0]?.fare_brand_name ?? undefined,
    conditions: {
      refundable: o.conditions?.refund_before_departure?.allowed,
      changeable: o.conditions?.change_before_departure?.allowed,
    },
    passportRequired: !!o.passenger_identity_documents_required,
    expiresAt: o.expires_at,
  };
}

function queryFromOffer(o: DOffer): SearchQuery {
  const n = (t: string) => o.passengers.filter((p) => p.type === t).length;
  return {
    from: o.slices[0].origin.iata_code,
    to: o.slices[0].destination.iata_code,
    date: localDate(o.slices[0].segments[0].departing_at),
    returnDate: o.slices[1] ? localDate(o.slices[1].segments[0].departing_at) : undefined,
    pax: { adults: Math.max(1, n("adult")), children: n("child"), infants: n("infant_without_seat") },
    cabin: cabinOf(o, { cabin: "economy" } as SearchQuery),
  };
}

// --- Koltuk haritaları ---
type DSeatService = { id: string; passenger_id: string; total_amount: string; total_currency: string };
type DSeatElement = { type: string; designator?: string; disclosures?: string[]; available_services?: DSeatService[] };
type DSeatMap = { segment_id: string; cabins: { rows: { sections: { elements: DSeatElement[] }[] }[] }[] };

async function seatMapsFor(o: DOffer): Promise<SeatMap[]> {
  const data = await call<DSeatMap[]>(`/air/seat_maps?offer_id=${o.id}`);
  const segIds = o.slices.flatMap((s) => s.segments.map((x) => x.id));
  const segs = o.slices.flatMap((s) => s.segments);
  const paying = payingPassengers(o);
  return data.flatMap((m) => {
    const index = segIds.indexOf(m.segment_id);
    if (index < 0) return [];
    const rows = m.cabins.flatMap((c) => c.rows);
    // Her bölümün sütun harfleri; bölümler arası koridor
    const sectionCount = Math.max(...rows.map((r) => r.sections.length));
    const letters = Array.from({ length: sectionCount }, (_, k) =>
      [...new Set(rows.flatMap((r) => (r.sections[k]?.elements ?? []).map((e) => e.designator?.replace(/^\d+/, "")).filter((x): x is string => !!x)))].sort(),
    );
    const columns = letters.flatMap((l, k) => (k === 0 ? l : [null, ...l]));
    const out: SeatRow[] = [];
    for (const r of rows) {
      const elements = r.sections.flatMap((s) => s.elements);
      const seatsHere = elements.filter((e) => e.type === "seat" && e.designator);
      if (!seatsHere.length) continue;
      const number = Number(seatsHere[0].designator!.match(/^\d+/)?.[0]);
      const seats = columns.map((col) => {
        if (!col) return null;
        const e = seatsHere.find((x) => x.designator === `${number}${col}`);
        if (!e) return null;
        const svc = e.available_services ?? [];
        const first = svc.find((s) => s.passenger_id === paying[0]?.id) ?? svc[0];
        const amount = first ? Number(first.total_amount) : 0;
        return {
          designator: e.designator!,
          available: svc.length > 0,
          price: first ? toTry(amount, first.total_currency) : 0,
          rawAmount: amount,
          serviceIds: paying.map((p) => svc.find((s) => s.passenger_id === p.id)?.id ?? null),
        };
      });
      out.push({ number, exit: elements.some((e) => e.type === "exit_row"), seats });
    }
    return [{ segment: index, fromCode: segs[index].origin.iata_code, toCode: segs[index].destination.iata_code, columns, rows: out }];
  });
}

export const duffelProvider: FlightProvider = {
  async search(q) {
    const slices = [{ origin: q.from, destination: q.to, departure_date: q.date }];
    if (q.returnDate) slices.push({ origin: q.to, destination: q.from, departure_date: q.returnDate });
    const passengers = [
      ...Array.from({ length: q.pax.adults }, () => ({ type: "adult" })),
      ...Array.from({ length: q.pax.children }, () => ({ type: "child" })),
      ...Array.from({ length: q.pax.infants }, () => ({ type: "infant_without_seat" })),
    ];
    const data = await call<{ offers: DOffer[] }>("/air/offer_requests?return_offers=true&supplier_timeout=20000", {
      method: "POST",
      body: JSON.stringify({ data: { slices, passengers, cabin_class: q.cabin ?? "economy", max_connections: 1 } }),
    });
    return data.offers
      .sort((a, b) => Number(a.total_amount) - Number(b.total_amount))
      // Aynı uçuşun farklı paketleri de gelir; sonuç sayfası bunları tek kartta toplar.
      .slice(0, 60)
      .map((o) => mapOffer(o, q));
  },

  async getOffer(id) {
    if (!/^off_[A-Za-z0-9]+$/.test(id)) return null;
    try {
      const o = await call<DOffer>(`/air/offers/${id}?return_available_services=true`);
      return mapOffer(o, queryFromOffer(o));
    } catch (e) {
      if (e instanceof ProviderError && (e.status === 404 || e.status === 422)) return null;
      throw e;
    }
  },

  async seatMaps(offer) {
    if (!/^off_[A-Za-z0-9]+$/.test(offer.id)) return [];
    const o = await call<DOffer>(`/air/offers/${offer.id}`);
    return seatMapsFor(o);
  },

  async createOrder(input: OrderInput, offer: Offer, totalTry: number): Promise<Booking> {
    if (!isDuffelTestMode()) {
      throw new ProviderError("Canlı modda ödeme altyapısı bağlanmadan bilet kesilemez.");
    }
    const o = await call<DOffer>(`/air/offers/${input.offerId}?return_available_services=true`);
    const adults = o.passengers.filter((p) => p.type === "adult");
    const byType = (t: string) => o.passengers.filter((p) => p.type === t);
    const ours = (t: "adult" | "child" | "infant") => input.passengers.filter((p) => p.type === t);
    const pairs = [
      ...byType("adult").map((d, i) => [d, ours("adult")[i]] as const),
      ...byType("child").map((d, i) => [d, ours("child")[i]] as const),
      ...byType("infant_without_seat").map((d, i) => [d, ours("infant")[i]] as const),
    ];
    const infants = byType("infant_without_seat");
    const phone = input.phone.replace(/[^\d+]/g, "");
    const passengers = pairs.map(([d, p]) => {
      if (!p) throw new ProviderError("Yolcu bilgileri eksik.");
      const infantIdx = adults.indexOf(d);
      return {
        id: d.id,
        title: p.gender === "f" ? "ms" : "mr",
        gender: p.gender,
        given_name: p.givenName,
        family_name: p.familyName,
        born_on: p.bornOn,
        email: input.email,
        phone_number: phone,
        ...(infantIdx >= 0 && infants[infantIdx] ? { infant_passenger_id: infants[infantIdx].id } : {}),
      };
    });

    // Ek hizmetler: bagaj (adetli) ve koltuk. Tutar Duffel'ın hizmet fiyatlarından hesaplanır.
    const byId = new Map((o.available_services ?? []).map((s) => [s.id, s]));
    const services: { id: string; quantity: number }[] = [];
    let extra = 0;
    const add = (id: string, quantity: number, amount: number) => {
      services.push({ id, quantity });
      extra += amount * quantity;
    };
    const fresh = bags(o);
    input.bags.forEach((choice, i) => {
      for (const kind of ["cabin", "checked"] as const) {
        const n = choice[kind];
        if (!n) continue;
        const ids = fresh[kind].serviceIds?.[i];
        if (!ids || n > fresh[kind].max) throw new ProviderError("Seçilen bagaj artık alınamıyor.");
        for (const id of ids) add(id, n, Number(byId.get(id)?.total_amount ?? 0));
      }
    });
    if (input.seats.length) {
      const maps = await seatMapsFor(o);
      for (const s of input.seats) {
        const seat = maps.find((m) => m.segment === s.segment)?.rows.flatMap((r) => r.seats).find((x) => x?.designator === s.designator);
        const id = seat?.serviceIds?.[s.pax];
        if (!seat?.available || !id) throw new ProviderError("Seçilen koltuk artık müsait değil.");
        add(id, 1, seat.rawAmount ?? 0);
      }
    }
    const amount = (Number(o.total_amount) + extra).toFixed(2);

    const order = await call<{ id: string; booking_reference: string }>("/air/orders", {
      method: "POST",
      body: JSON.stringify({
        data: {
          type: "instant",
          selected_offers: [o.id],
          passengers,
          services,
          payments: [{ type: "balance", currency: o.total_currency, amount }],
        },
      }),
    });
    return {
      id: order.id,
      provider: "duffel",
      pnr: order.booking_reference,
      email: input.email,
      offer: { airline: offer.airline, outbound: offer.outbound, inbound: offer.inbound },
      total: totalTry,
      createdAt: new Date().toISOString(),
    };
  },
};
