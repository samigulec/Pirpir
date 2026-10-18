// Duffel uçuş API'si (https://duffel.com/docs). DUFFEL_ACCESS_TOKEN tanımlıysa kullanılır.
// Test anahtarı (duffel_test_…) ile siparişler Duffel'ın test bakiyesinden ödenir; gerçek para çekilmez.
// Canlı anahtarla sipariş, ödeme altyapısı (Mollie) bağlanana kadar kapalıdır.
import "server-only";
import { findAirport } from "@/data/airports";
import { uniqueChangeOptions } from "../change-options";
import { toTry } from "../currency";
import { mergeBags } from "../extras";
import type { SearchQuery } from "../search";
import { acquire, isBackground, isSkipped, noteResponse, retryWait } from "./rate-limit";
import { BAG_KINDS } from "./types";
import type { BagInfo, BagOffer, Bags, BagSpec, CabinClass, ChangeOption, ChangeRequest, Segment, Booking, FlightProvider, Leg, Offer, OrderInput, SeatMap, SeatRow } from "./types";

// Testlerde sahte bir sunucuya yönlendirilebilir.
const API = process.env.DUFFEL_API_URL || "https://api.duffel.com";

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

/** Duffel başarılı yanıt verdi ama içinde veri yok. */
class EmptyResponseError extends ProviderError {
  constructor(status: number) {
    super(`Duffel boş yanıt döndü (${status})`, status);
  }
}

/** Ayrılmış rezervasyonun güncel tutarı değişti (TRY). */
export class PriceChangedError extends ProviderError {
  constructor(readonly newTotal: number) {
    super("Fiyat değişti");
  }
}

export const isDuffelTestMode = () => (process.env.DUFFEL_ACCESS_TOKEN ?? "").startsWith("duffel_test_");

/**
 * Duffel isteği. İstek sınırı (429) ziyaretçinin aramasında kısa bekleyip en fazla iki kez yeniden denenir;
 * arka plan aramaları (fırsatlar, tarih şeridi) yeniden denenmez ve sınır darken hiç gönderilmez (rate-limit.ts).
 */
async function call<T>(path: string, init: RequestInit = {}, attempt = 0): Promise<T> {
  const release = await acquire();
  let res: Response;
  try {
    res = await fetch(API + path, {
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
  } finally {
    release();
  }
  noteResponse(res);
  if (res.status === 429 && attempt < 2 && !isBackground()) {
    await new Promise((r) => setTimeout(r, retryWait()));
    return call<T>(path, init, attempt + 1);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = body?.errors?.[0]?.message ?? `Duffel isteği başarısız (${res.status})`;
    throw new ProviderError(msg, res.status);
  }
  // Başarılı ama gövdesiz yanıt (ör. parça parça aramada boş dönen yoklama): çağıran karar verir
  if (body?.data == null) throw new EmptyResponseError(res.status);
  return body.data as T;
}

/** Yeni bir istekle tekrar denemek boşuna: sınır dolu ya da arka plan isteği ertelendi. */
const rateLimited = (e: unknown) => isSkipped(e) || (e instanceof ProviderError && e.status === 429);

type DBatch = { id: string; total_batches: number; remaining_batches: number; offers?: DOffer[] };

/**
 * Parça parça arama (batch offer request): havayolları yanıt verdikçe teklifler gelir. Aynı arama isteğinin
 * teklifleridir; sona eklenenler öncekileri değiştirmez, yalnızca listeye katılır. Bir şey ters giderse aynı
 * isteğin tüm teklifleri tek seferde alınır, böylece eksik liste son sonuç diye gösterilmez.
 */
async function batchSearch(
  body: string,
  timeout: number,
  finish: (offers: DOffer[]) => Offer[],
  onPartial: (offers: Offer[]) => void,
  whole: () => Promise<Offer[]>,
): Promise<Offer[]> {
  let created: DBatch;
  try {
    created = await call<DBatch>(`/air/batch_offer_requests?supplier_timeout=${timeout}`, { method: "POST", body });
  } catch (e) {
    if (rateLimited(e)) throw e;
    console.error("Parça parça arama başlatılamadı, tek seferde aranıyor:", e instanceof Error ? e.message : e);
    return whole();
  }
  const byId = new Map<string, DOffer>();
  const deadline = Date.now() + timeout + 10_000;
  let remaining = created.remaining_batches;
  try {
    while (remaining > 0) {
      if (Date.now() > deadline) throw new ProviderError("Parça parça arama zamanında bitmedi.");
      // Kendi sinyali olan istek Next.js'in aynı adres birleştirmesine takılmaz (her yoklama gerçekten gider)
      const b = await call<DBatch>(`/air/batch_offer_requests/${created.id}`, { signal: AbortSignal.timeout(Math.max(1000, deadline - Date.now())) }).catch(
        (e) => {
          // Uzun bekleyen yoklama bazen gövdesiz döner: yeni parti yok sayılıp yeniden yoklanır
          if (e instanceof EmptyResponseError) return { id: created.id, total_batches: created.total_batches, remaining_batches: remaining, offers: [] } as DBatch;
          throw e;
        },
      );
      const before = byId.size;
      for (const o of b.offers ?? []) byId.set(o.id, o);
      remaining = b.remaining_batches;
      if (remaining > 0 && byId.size > before) onPartial(finish([...byId.values()]));
      // Uzun bekleyen (long-poll) uç nokta boş dönerse kısa ara verilir
      else if (remaining > 0) await new Promise((r) => setTimeout(r, 300));
    }
  } catch (e) {
    if (isSkipped(e)) throw e;
    console.error("Parça parça arama kesildi, tüm teklifler alınıyor:", e instanceof Error ? e.message : e);
    try {
      const all = await call<DOffer[]>(`/air/offers?offer_request_id=${created.id}&sort=total_amount&limit=200`);
      return finish(all);
    } catch (e2) {
      if (rateLimited(e2)) throw e2;
      console.error("Teklif listesi alınamadı, tek seferde aranıyor:", e2 instanceof Error ? e2.message : e2);
      return whole();
    }
  }
  return finish([...byId.values()]);
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
  marketing_carrier: { name: string; iata_code?: string | null; logo_symbol_url?: string | null };
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
type DCondition = { allowed: boolean; penalty_amount?: string | null; penalty_currency?: string | null } | null;
type DConditions = {
  refund_before_departure?: DCondition;
  change_before_departure?: DCondition;
} | null;

/** İzin verilen işlemin ceza tutarı (TRY); bildirilmediyse undefined. */
const penaltyOf = (c?: DCondition) =>
  c?.allowed && c.penalty_amount != null && c.penalty_currency ? toTry(Number(c.penalty_amount), c.penalty_currency) : undefined;
type DService = {
  id: string;
  type: string;
  total_amount: string;
  total_currency: string;
  passenger_ids: string[];
  segment_ids?: string[];
  maximum_quantity: number;
  metadata?: {
    type?: "checked" | "carry_on";
    maximum_weight_kg?: number | null;
    maximum_length_cm?: number | null;
    maximum_height_cm?: number | null;
    maximum_depth_cm?: number | null;
  };
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
  payment_requirements?: {
    requires_instant_payment: boolean;
    payment_required_by?: string | null;
    price_guarantee_expires_at?: string | null;
  } | null;
};

type DOrder = {
  id: string;
  booking_reference: string;
  total_amount: string;
  total_currency: string;
  payment_status?: { awaiting_payment: boolean; payment_required_by?: string | null; price_guarantee_expires_at?: string | null } | null;
};

type DCancellation = {
  id: string;
  refund_amount?: string | null;
  refund_currency?: string | null;
  refund_to?: string | null;
  expires_at?: string | null;
  confirmed_at?: string | null;
};

/**
 * Rezervasyon sonrası bagaj: siparişin bacakları ve yolcuları + sipariş için satılabilen hizmetler.
 * Teklifteki bagaj hesabı (bags) aynen kullanılabilsin diye teklif biçimine çevrilir.
 */
async function orderAsOffer(orderId: string): Promise<DOffer> {
  const order = await call<DOrder & { slices: DSlice[]; passengers: { id: string; type: string }[] }>(`/air/orders/${orderId}`);
  const services = await call<DService[]>(`/air/orders/${orderId}/available_services`);
  return { ...order, owner: { name: "" }, available_services: services } as DOffer;
}

/** Havayolu "sonra öde"ye izin veriyorsa ayırma koşulları. */
function holdOf(p: DOffer["payment_requirements"] | DOrder["payment_status"]): Offer["hold"] {
  if (!p || ("requires_instant_payment" in p && p.requires_instant_payment) || !p.payment_required_by) return undefined;
  return { payBy: p.payment_required_by, priceGuaranteedUntil: p.price_guarantee_expires_at ?? undefined };
}

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
    carrierLogo: logoUrl(x.marketing_carrier.logo_symbol_url),
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
function bagOffer(o: DOffer, t: "carry_on" | "checked", included: number, kg?: number): BagOffer {
  const services = (o.available_services ?? []).filter(
    (s) => s.type === "baggage" && s.metadata?.type === t && (kg === undefined || s.metadata?.maximum_weight_kg === kg),
  );
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
  // Kabin bagajı yolcu başı bir tane; kontrol edilen bagajda sınır havayolunun bildirdiği adettir
  const cap = t === "carry_on" ? Math.max(0, 1 - included) : 9;
  return {
    included,
    price: toTry(amount, lists[0][0].total_currency),
    rawAmount: amount,
    max: Math.min(cap, ...lists.flat().map((s) => s.maximum_quantity)),
    kg: lists[0][0].metadata?.maximum_weight_kg ?? undefined,
    serviceIds: lists.map((l) => l.map((s) => s.id)),
  };
}

/** Havayolunun ek bagaj hizmetinde bildirdiği ölçüler (dahil bagajın ölçüsünü Duffel vermez). */
function specOf(o: DOffer, t: "carry_on" | "checked"): BagSpec | undefined {
  const m = (o.available_services ?? []).find((s) => s.type === "baggage" && s.metadata?.type === t)?.metadata;
  if (!m) return undefined;
  const dims = m.maximum_length_cm && m.maximum_height_cm && m.maximum_depth_cm
    ? ([m.maximum_length_cm, m.maximum_height_cm, m.maximum_depth_cm] as [number, number, number])
    : undefined;
  const spec: BagSpec = { kg: m.maximum_weight_kg ?? undefined, dims };
  return spec.kg || spec.dims ? spec : undefined;
}

function bags(o: DOffer): Bags {
  const { checked, carryOn } = includedBags(o);
  const cabin = bagOffer(o, "carry_on", carryOn > 0 ? 1 : 0);
  // Havayolu farklı ağırlıkta kontrol edilen bagaj satıyorsa en hafifi ve en ağırı ayrı seçenek olur
  const weights = [
    ...new Set(
      (o.available_services ?? [])
        .filter((s) => s.type === "baggage" && s.metadata?.type === "checked" && s.metadata.maximum_weight_kg)
        .map((s) => s.metadata!.maximum_weight_kg as number),
    ),
  ].sort((a, b) => a - b);
  if (weights.length < 2) return { cabin, checked: bagOffer(o, "checked", checked) };
  const light = bagOffer(o, "checked", checked, weights[0]);
  const heavy = bagOffer(o, "checked", 0, weights[weights.length - 1]);
  return heavy.max > 0 ? { cabin, checked: light, heavy } : { cabin, checked: bagOffer(o, "checked", checked) };
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
    // Ek bagaj hizmetinin ölçüsü yalnızca o tür bilete dahil değilse gösterilir (dahil olanınki farklı olabilir).
    bagSpecs: (() => {
      const inc = includedBags(o);
      return { cabin: inc.carryOn ? undefined : specOf(o, "carry_on"), checked: inc.checked ? undefined : specOf(o, "checked") };
    })(),
    cabin: cabinOf(o, q),
    fareBrand: o.slices[0]?.fare_brand_name ?? undefined,
    conditions: {
      refundable: o.conditions?.refund_before_departure?.allowed,
      changeable: o.conditions?.change_before_departure?.allowed,
      refundFee: penaltyOf(o.conditions?.refund_before_departure),
      changeFee: penaltyOf(o.conditions?.change_before_departure),
    },
    passportRequired: !!o.passenger_identity_documents_required,
    hold: holdOf(o.payment_requirements),
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

// --- Uçuş değişikliği (order change) ---
type DChangeSlice = DSlice & { id: string };
type DChangeOffer = {
  id: string;
  change_total_amount: string | null;
  change_total_currency: string | null;
  penalty_amount?: string | null;
  penalty_currency?: string | null;
  new_total_amount: string | null;
  new_total_currency: string;
  expires_at: string;
  slices: { add: DChangeSlice[]; remove: DChangeSlice[] };
};
type DChangeRequest = { id: string; order_change_offers?: DChangeOffer[] };
type DOrderChange = { id: string; change_total_amount: string; change_total_currency: string; new_total_amount: string; new_total_currency: string };

const money = (amount: string | null | undefined, currency: string | null | undefined) =>
  amount != null && currency ? toTry(Number(amount), currency) : undefined;

/** İstenen bacakları (eski slice kimlikleriyle) çıkarıp aynı güzergâhı yeni günde ekleyen istek gövdesi. */
async function changeBody(orderId: string, req: ChangeRequest) {
  const order = await call<{ slices: DChangeSlice[]; cabin_class?: string }>(`/air/orders/${orderId}`);
  const picks = [req.outDate ? 0 : -1, req.inDate ? 1 : -1].filter((i) => i >= 0 && order.slices[i]);
  if (!picks.length) throw new ProviderError("Değiştirilecek uçuş seçilmedi.");
  return {
    order_id: orderId,
    slices: {
      remove: picks.map((i) => ({ slice_id: order.slices[i].id })),
      add: picks.map((i) => ({
        origin: order.slices[i].origin.iata_code,
        destination: order.slices[i].destination.iata_code,
        departure_date: i === 0 ? req.outDate : req.inDate,
        cabin_class: order.slices[i].segments[0]?.passengers?.[0]?.cabin_class ?? "economy",
      })),
    },
  };
}

function mapChangeOffer(c: DChangeOffer, req: ChangeRequest): ChangeOption {
  const added = [...c.slices.add].sort((a, b) => a.segments[0].departing_at.localeCompare(b.segments[0].departing_at));
  const out = req.outDate ? added[0] : undefined;
  const inn = req.inDate ? added[req.outDate ? 1 : 0] : undefined;
  return {
    id: c.id,
    outbound: out ? mapLeg(out) : undefined,
    inbound: inn ? mapLeg(inn) : undefined,
    fareBrand: added[0]?.fare_brand_name ?? undefined,
    changeTotal: money(c.change_total_amount, c.change_total_currency) ?? 0,
    penalty: money(c.penalty_amount, c.penalty_currency),
    newTotal: money(c.new_total_amount, c.new_total_currency),
    expiresAt: c.expires_at,
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
  async search(q, opts) {
    const slices = [{ origin: q.from, destination: q.to, departure_date: q.date }];
    if (q.returnDate) slices.push({ origin: q.to, destination: q.from, departure_date: q.returnDate });
    const passengers = [
      ...Array.from({ length: q.pax.adults }, () => ({ type: "adult" })),
      ...Array.from({ length: q.pax.children }, () => ({ type: "child" })),
      ...Array.from({ length: q.pax.infants }, () => ({ type: "infant_without_seat" })),
    ];
    const timeout = opts?.timeoutMs ?? 15000;
    const body = JSON.stringify({ data: { slices, passengers, cabin_class: q.cabin ?? "economy", max_connections: 1 } });
    // Aynı uçuşun farklı paketleri de gelir; sonuç sayfası bunları tek kartta toplar.
    const finish = (offers: DOffer[]) =>
      offers
        .sort((a, b) => Number(a.total_amount) - Number(b.total_amount))
        .slice(0, 60)
        .map((o) => mapOffer(o, q));
    const whole = async () => {
      const data = await call<{ offers: DOffer[] }>(`/air/offer_requests?return_offers=true&supplier_timeout=${timeout}`, { method: "POST", body });
      return finish(data.offers);
    };
    return opts?.onPartial ? batchSearch(body, timeout, finish, opts.onPartial, whole) : whole();
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
      for (const kind of BAG_KINDS) {
        const n = choice[kind] ?? 0;
        if (!n) continue;
        const ids = fresh[kind]?.serviceIds?.[i];
        if (!ids || n > fresh[kind]!.max) throw new ProviderError("Seçilen bagaj artık alınamıyor.");
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
    if (input.hold && !holdOf(o.payment_requirements)) throw new ProviderError("Bu teklif ayrılamıyor.");

    // Ayırmada (hold) ödeme gönderilmez; havayolu koltuğu son ödeme zamanına kadar tutar.
    const order = await call<DOrder>("/air/orders", {
      method: "POST",
      body: JSON.stringify({
        data: {
          type: input.hold ? "hold" : "instant",
          selected_offers: [o.id],
          passengers,
          services,
          ...(input.hold ? {} : { payments: [{ type: "balance", currency: o.total_currency, amount }] }),
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
      held: input.hold ? holdOf(order.payment_status) ?? offer.hold : undefined,
      providerTotal: input.hold ? toTry(Number(order.total_amount), order.total_currency) : undefined,
    };
  },

  async orderBags(booking) {
    if (!isDuffelTestMode()) throw new ProviderError("Canlı modda ödeme altyapısı bağlanmadan bagaj eklenemez.");
    return bags(await orderAsOffer(booking.id));
  },

  async addBags(booking, choices) {
    if (!isDuffelTestMode()) throw new ProviderError("Canlı modda ödeme altyapısı bağlanmadan bagaj eklenemez.");
    const o = await orderAsOffer(booking.id);
    const fresh = bags(o);
    const byId = new Map((o.available_services ?? []).map((s) => [s.id, s]));
    const add: { id: string; quantity: number }[] = [];
    let amount = 0;
    let currency = "";
    choices.forEach((c, i) => {
      for (const kind of BAG_KINDS) {
        const n = c[kind] ?? 0;
        if (!n) continue;
        const ids = fresh[kind]?.serviceIds?.[i];
        if (!ids || n > fresh[kind]!.max) throw new ProviderError("Seçilen bagaj artık alınamıyor.");
        for (const id of ids) {
          const s = byId.get(id)!;
          add.push({ id, quantity: n });
          amount += Number(s.total_amount) * n;
          currency = s.total_currency;
        }
      }
    });
    if (!add.length) throw new ProviderError("Eklenecek bagaj yok.");
    await call(`/air/orders/${booking.id}/services`, {
      method: "POST",
      body: JSON.stringify({ data: { add_services: add, payment: { type: "balance", currency, amount: amount.toFixed(2) } } }),
    });
    return { ...booking, total: booking.total + toTry(amount, currency), extraBags: mergeBags(booking.extraBags, choices) };
  },

  async cancelQuote(booking) {
    if (!isDuffelTestMode()) throw new ProviderError("Canlı modda ödeme altyapısı bağlanmadan iptal yapılamaz.");
    const c = await call<DCancellation>("/air/order_cancellations", {
      method: "POST",
      body: JSON.stringify({ data: { order_id: booking.id } }),
    });
    return {
      id: c.id,
      refund: c.refund_amount ? toTry(Number(c.refund_amount), c.refund_currency ?? "EUR") : 0,
      refundTo: c.refund_to ?? undefined,
      expiresAt: c.expires_at ?? undefined,
    };
  },

  async cancelConfirm(booking, quoteId) {
    if (!isDuffelTestMode()) throw new ProviderError("Canlı modda ödeme altyapısı bağlanmadan iptal yapılamaz.");
    if (!/^ore_[A-Za-z0-9]+$/.test(quoteId)) throw new ProviderError("Geçersiz iptal teklifi.");
    const c = await call<DCancellation>(`/air/order_cancellations/${quoteId}/actions/confirm`, { method: "POST" });
    const refund = c.refund_amount ? toTry(Number(c.refund_amount), c.refund_currency ?? "EUR") : 0;
    return { ...booking, held: undefined, cancelled: { at: c.confirmed_at ?? new Date().toISOString(), refund } };
  },

  async changeOptions(booking, req) {
    if (!isDuffelTestMode()) throw new ProviderError("Canlı modda ödeme altyapısı bağlanmadan değişiklik yapılamaz.");
    const r = await call<DChangeRequest>("/air/order_change_requests", {
      method: "POST",
      body: JSON.stringify({ data: await changeBody(booking.id, req) }),
    });
    const offers = r.order_change_offers?.length
      ? r.order_change_offers
      : await call<DChangeOffer[]>(`/air/order_change_offers?order_change_request_id=${r.id}&limit=50`);
    return uniqueChangeOptions(
      offers
        .map((o) => mapChangeOffer(o, req))
        .filter((o) => (!req.outDate || o.outbound) && (!req.inDate || o.inbound))
        .sort((a, b) => a.changeTotal - b.changeTotal || (a.outbound?.dep ?? "").localeCompare(b.outbound?.dep ?? "")),
    ).slice(0, 40);
  },

  async changeConfirm(booking, req, optionId, expectedTotal) {
    if (!isDuffelTestMode()) throw new ProviderError("Canlı modda ödeme altyapısı bağlanmadan değişiklik yapılamaz.");
    if (!/^oco_[A-Za-z0-9]+$/.test(optionId)) throw new ProviderError("Geçersiz değişiklik teklifi.");
    const pending = await call<DOrderChange>("/air/order_changes", {
      method: "POST",
      body: JSON.stringify({ data: { selected_order_change_offer: optionId } }),
    });
    // Müşterinin gördüğü tutar değiştiyse onaylanmaz
    const due = toTry(Number(pending.change_total_amount), pending.change_total_currency);
    if (Math.abs(due - expectedTotal) > 1) throw new PriceChangedError(due);
    const pay = Number(pending.change_total_amount) > 0;
    await call(`/air/order_changes/${pending.id}/actions/confirm`, {
      method: "POST",
      body: JSON.stringify(
        pay ? { data: { payment: { type: "balance", amount: pending.change_total_amount, currency: pending.change_total_currency } } } : {},
      ),
    });
    const order = await call<DOrder & { slices: DSlice[] }>(`/air/orders/${booking.id}`);
    return {
      ...booking,
      pnr: order.booking_reference ?? booking.pnr,
      offer: { ...booking.offer, outbound: mapLeg(order.slices[0]), inbound: order.slices[1] ? mapLeg(order.slices[1]) : undefined },
      // Müşterinin ödediği: eski tutar (bagaj, koltuk, indirim dahil) + değişiklik farkı
      total: booking.total + due,
      changed: { at: new Date().toISOString(), paid: due },
    };
  },

  async payHeld(booking) {
    if (!isDuffelTestMode()) {
      throw new ProviderError("Canlı modda ödeme altyapısı bağlanmadan bilet kesilemez.");
    }
    const order = await call<DOrder>(`/air/orders/${booking.id}`);
    if (!order.payment_status?.awaiting_payment) return { ...booking, held: undefined, pnr: order.booking_reference };
    // Fiyat garantisi bittiyse tutar değişmiş olabilir: müşteriye göstermeden ödeme yapılmaz.
    const total = toTry(Number(order.total_amount), order.total_currency);
    if (Math.abs(total - (booking.providerTotal ?? booking.total)) > 1) throw new PriceChangedError(total);
    await call("/air/payments", {
      method: "POST",
      body: JSON.stringify({ data: { order_id: order.id, payment: { type: "balance", currency: order.total_currency, amount: order.total_amount } } }),
    });
    return { ...booking, held: undefined, pnr: order.booking_reference };
  },
};
