// Arama sorgusu: URL ↔ nesne dönüşümü ve doğrulama. İstemci ve sunucuda ortak kullanılır.
import { findAirport, resolveAirport, type Airport } from "@/data/airports";

export type Passengers = { adults: number; children: number; infants: number };

export type SearchQuery = {
  from: string; // IATA
  to: string; // IATA
  date: string; // YYYY-MM-DD
  returnDate?: string;
  pax: Passengers;
};

export type SearchError = "from" | "to" | "same" | "date" | "past" | "return" | "pax";

export const MAX_PASSENGERS = 9;

export function todayIso(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const isIsoDate = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00Z"));

/** Tasarımdaki örnek tarihler (24 – 31 Ekim); geçmişte kaldıysa bir hafta sonrası. */
export function defaultDates(now = new Date()) {
  const today = todayIso(now);
  const date = "2026-10-24" > addDays(today, 1) ? "2026-10-24" : addDays(today, 7);
  return { date, returnDate: addDays(date, 7) };
}

export function paxTotal(p: Passengers) {
  return p.adults + p.children + p.infants;
}

export function validatePax(p: Passengers): boolean {
  return p.adults >= 1 && p.children >= 0 && p.infants >= 0 && p.infants <= p.adults && paxTotal(p) <= MAX_PASSENGERS;
}

export function validateSearch(q: SearchQuery, now = new Date()): SearchError | null {
  if (!findAirport(q.from)) return "from";
  if (!findAirport(q.to)) return "to";
  const a = findAirport(q.from)!;
  const b = findAirport(q.to)!;
  if (a.code === b.code || (a.slug === b.slug && a.country === b.country)) return "same";
  if (!isIsoDate(q.date)) return "date";
  if (q.date < todayIso(now)) return "past";
  if (q.returnDate !== undefined && (!isIsoDate(q.returnDate) || q.returnDate < q.date)) return "return";
  if (!validatePax(q.pax)) return "pax";
  return null;
}

type Raw = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const int = (v: string | undefined, d: number) => {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : d;
};

// Eski "pax=2a1c" biçimini de okur.
const LEGACY_PAX: Record<string, Passengers> = {
  "1a": { adults: 1, children: 0, infants: 0 },
  "2a": { adults: 2, children: 0, infants: 0 },
  "2a1c": { adults: 2, children: 1, infants: 0 },
  "2a2c": { adults: 2, children: 2, infants: 0 },
  "1a1i": { adults: 1, children: 0, infants: 1 },
};

/** URL parametreleri → sorgu. Şehir adı ("İzmir") ya da kod ("ADB") kabul edilir. */
export function parseSearch(raw: Raw, now = new Date()): SearchQuery {
  const d = defaultDates(now);
  const from = resolveAirport(one(raw.from) ?? "AMS")?.code ?? (one(raw.from) ?? "").toUpperCase();
  const to = resolveAirport(one(raw.to) ?? "ADB")?.code ?? (one(raw.to) ?? "").toUpperCase();
  const date = one(raw.date) || d.date;
  const ret = one(raw.return);
  // Tarih hiç verilmemişse tasarımdaki gibi gidiş-dönüş varsay.
  const returnDate = ret ? ret : one(raw.date) ? undefined : d.returnDate;
  const legacy = LEGACY_PAX[one(raw.pax) ?? ""];
  const pax = legacy ?? {
    adults: int(one(raw.adults), 1),
    children: int(one(raw.children), 0),
    infants: int(one(raw.infants), 0),
  };
  return { from, to, date, returnDate, pax };
}

/** Arama sonuçları bağlantısı (dil farkında Link/router için kanonik yol + sorgu). */
export function searchHref(q: Partial<SearchQuery> = {}, now = new Date()) {
  const d = defaultDates(now);
  const query: Record<string, string> = {
    from: q.from ?? "AMS",
    to: q.to ?? "ADB",
    date: q.date ?? d.date,
  };
  const ret = q.returnDate === undefined && !q.date ? d.returnDate : q.returnDate;
  if (ret) query.return = ret;
  const pax = q.pax ?? { adults: 1, children: 0, infants: 0 };
  query.adults = String(pax.adults);
  if (pax.children) query.children = String(pax.children);
  if (pax.infants) query.infants = String(pax.infants);
  return { pathname: "/ara" as const, query };
}

export function airportOrThrow(code: string): Airport {
  const a = findAirport(code);
  if (!a) throw new Error(`Bilinmeyen havalimanı: ${code}`);
  return a;
}

export function routeHref(slug: { from: string; to: string }) {
  return { pathname: "/ucuslar/[nereden]/[nereye]" as const, params: { nereden: slug.from, nereye: slug.to } };
}

export function bookingHref(offerId: string) {
  return { pathname: "/rezervasyon/[teklifId]" as const, params: { teklifId: offerId } };
}

export function confirmHref(bookingId: string) {
  return { pathname: "/rezervasyon/[teklifId]/onay" as const, params: { teklifId: bookingId } };
}
