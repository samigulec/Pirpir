// Arama sorgusu: URL ↔ nesne dönüşümü ve doğrulama. İstemci ve sunucuda ortak kullanılır
// (dünya havalimanı listesine bakan kısımlar ./search-server.ts içinde).

export type Passengers = { adults: number; children: number; infants: number };

export type CabinClass = "economy" | "premium_economy" | "business" | "first";
export const CABINS: CabinClass[] = ["economy", "premium_economy", "business", "first"];
export const isCabin = (v: unknown): v is CabinClass => typeof v === "string" && (CABINS as string[]).includes(v);

export type SearchQuery = {
  from: string; // IATA
  to: string; // IATA
  date: string; // YYYY-MM-DD
  returnDate?: string;
  pax: Passengers;
  /** Yoksa ekonomi. */
  cabin?: CabinClass;
  /** Esnek tarih (Kiwi'deki "± 3 gün"): seçilen günün bu kadar öncesi ve sonrası da aranır. */
  flex?: Flex;
  /** Yolcu başı istenen bagaj (arama kutusundan); sonuçlarda bagaj filtresi olarak uygulanır, aramayı değiştirmez. */
  bags?: { cabin: number; checked: number };
};

export const MAX_SEARCH_BAGS = { cabin: 1, checked: 3 } as const;

export const FLEX_DAYS = [1, 3, 5] as const;
export type Flex = 0 | (typeof FLEX_DAYS)[number];
export const isFlex = (v: number): v is Flex => v === 0 || (FLEX_DAYS as readonly number[]).includes(v);

/**
 * Kullanıcının araması: birden fazla kalkış ve varış seçilebilir (havalimanı kodu ya da "city:LON").
 * Sağlayıcılar her kalkış–varış ikilisi için ayrı bir SearchQuery ile çağrılır.
 */
export type MultiQuery = Omit<SearchQuery, "from" | "to"> & { from: string[]; to: string[] };

export type SearchError = "from" | "to" | "same" | "date" | "past" | "return" | "pax";

const PLACE_CODE = /^([A-Z]{3}|city:[A-Z]{3})$/;

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
/**
 * Tarih verilmemiş bağlantılar için (ör. eski adresler): en az iki hafta sonraki Cuma, bir hafta.
 * Arama kutusu tarihi boş başlatır; bu yalnızca adreste tarih yoksa kullanılır.
 */
export function defaultDates(now = new Date()) {
  const today = todayIso(now);
  const dow = new Date(`${today}T00:00:00Z`).getUTCDay();
  const date = addDays(today, ((5 - dow + 7) % 7) + 14);
  return { date, returnDate: addDays(date, 7) };
}

export function paxTotal(p: Passengers) {
  return p.adults + p.children + p.infants;
}

export function validatePax(p: Passengers): boolean {
  return p.adults >= 1 && p.children >= 0 && p.infants >= 0 && p.infants <= p.adults && paxTotal(p) <= MAX_PASSENGERS;
}

/** Doğrulama. `known` verilmezse yalnızca kod biçimi kontrol edilir (tarayıcıda); sunucu dünya listesine bakar. */
export function validateSearch(q: MultiQuery, known: (code: string) => boolean = (c) => PLACE_CODE.test(c), now = new Date()): SearchError | null {
  if (!q.from.length || !q.from.every(known)) return "from";
  if (!q.to.length || !q.to.every(known)) return "to";
  if (q.from.every((f) => q.to.includes(f))) return "same";
  if (!isIsoDate(q.date)) return "date";
  if (q.date < todayIso(now)) return "past";
  if (q.returnDate !== undefined && (!isIsoDate(q.returnDate) || q.returnDate < q.date)) return "return";
  if (!validatePax(q.pax)) return "pax";
  return null;
}

export type Raw = Record<string, string | string[] | undefined>;
export const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
export const int = (v: string | undefined, d: number) => {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : d;
};

// Eski "pax=2a1c" biçimini de okur.
export const LEGACY_PAX: Record<string, Passengers> = {
  "1a": { adults: 1, children: 0, infants: 0 },
  "2a": { adults: 2, children: 0, infants: 0 },
  "2a1c": { adults: 2, children: 1, infants: 0 },
  "2a2c": { adults: 2, children: 2, infants: 0 },
  "1a1i": { adults: 1, children: 0, infants: 1 },
};

/** Arama sonuçları bağlantısı (dil farkında Link/router için kanonik yol + sorgu). */
export function searchHref(
  q: Partial<Omit<SearchQuery, "from" | "to">> & { from?: string | string[]; to?: string | string[] } = {},
  now = new Date(),
) {
  const d = defaultDates(now);
  const list = (v: string | string[] | undefined, dflt: string) => (v === undefined ? dflt : Array.isArray(v) ? v.join(",") : v);
  const query: Record<string, string> = {
    from: list(q.from, "AMS"),
    to: list(q.to, "ADB"),
    date: q.date ?? d.date,
  };
  const ret = q.returnDate === undefined && !q.date ? d.returnDate : q.returnDate;
  if (ret) query.return = ret;
  const pax = q.pax ?? { adults: 1, children: 0, infants: 0 };
  query.adults = String(pax.adults);
  if (pax.children) query.children = String(pax.children);
  if (pax.infants) query.infants = String(pax.infants);
  if (q.cabin && q.cabin !== "economy") query.cabin = q.cabin;
  if (q.flex) query.flex = String(q.flex);
  if (q.bags?.cabin) query.cabinBags = String(q.bags.cabin);
  if (q.bags?.checked) query.checkedBags = String(q.bags.checked);
  return { pathname: "/ara" as const, query };
}

export function routeHref(slug: { from: string; to: string }) {
  return { pathname: "/ucuslar/[nereden]/[nereye]" as const, params: { nereden: slug.from, nereye: slug.to } };
}

/** Rezervasyon sayfası; sonuçlarda bagaj filtresi seçildiyse her yolcuya önceden eklenir. */
export function bookingHref(offerId: string, bags?: { cabin: number; checked: number }) {
  const query: Record<string, string> = {};
  if (bags?.cabin) query.cabin = String(bags.cabin);
  if (bags?.checked) query.checked = String(bags.checked);
  return { pathname: "/rezervasyon/[teklifId]" as const, params: { teklifId: offerId }, ...(Object.keys(query).length && { query }) };
}

export function confirmHref(bookingId: string) {
  return { pathname: "/rezervasyon/[teklifId]/onay" as const, params: { teklifId: bookingId } };
}
