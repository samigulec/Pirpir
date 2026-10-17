// Duffel uçuş API'si (https://duffel.com/docs). DUFFEL_ACCESS_TOKEN tanımlıysa kullanılır.
// Test anahtarı (duffel_test_…) ile siparişler Duffel'ın test bakiyesinden ödenir; gerçek para çekilmez.
// Canlı anahtarla sipariş, ödeme altyapısı (Mollie) bağlanana kadar kapalıdır.
import "server-only";
import { findAirport } from "@/data/airports";
import { toTry } from "../currency";
import type { SearchQuery } from "../search";
import type { BagInfo, BagKind, BagOption, CabinClass, Segment, Booking, FlightProvider, Leg, Offer, OrderInput } from "./types";

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

function bagOptions(o: DOffer): BagOption[] {
  const { checked, carryOn } = includedBags(o);
  const opts: BagOption[] = [{ kind: "small", price: 0 }];
  const paying = o.passengers.filter((p) => !p.type.startsWith("infant"));
  const services = (o.available_services ?? []).filter((s) => s.type === "baggage");
  const fromServices = (kind: BagKind, t: "carry_on" | "checked"): BagOption | null => {
    const perPax = paying.map((p) =>
      services
        .filter((s) => s.metadata?.type === t && s.passenger_ids.includes(p.id))
        .sort((a, b) => Number(a.total_amount) - Number(b.total_amount))[0],
    );
    if (!perPax.length || perPax.some((s) => !s)) return null;
    const amount = Number(perPax[0]!.total_amount);
    return { kind, price: toTry(amount, perPax[0]!.total_currency), rawAmount: amount, serviceIds: perPax.map((s) => s!.id) };
  };
  const cabin = carryOn > 0 ? { kind: "cabin" as const, price: 0 } : fromServices("cabin", "carry_on");
  const big = checked > 0 ? { kind: "big" as const, price: 0 } : fromServices("big", "checked");
  if (cabin) opts.push(cabin);
  if (big) opts.push(big);
  return opts;
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
    bagOptions: bagOptions(o),
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
      .slice(0, 30)
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

    const bag = mapOffer(o, offer.query).bagOptions.find((b) => b.kind === input.bag);
    const services = bag?.serviceIds?.map((id) => ({ id, quantity: 1 })) ?? [];
    const extra = (bag?.rawAmount ?? 0) * (bag?.serviceIds?.length ?? 0);
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
