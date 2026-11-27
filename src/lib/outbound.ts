// Ortaklık (affiliate) bağlantıları: site içindeki "Fırsata git" düğmeleri /git adresine gider; sunucu tıklamayı sayar
// ve ziyaretçiyi ortaklık kimliğiyle Skyscanner'a yönlendirir (outbound-server.ts). Bu dosya tarayıcıda da çalışır.
import type { CabinClass } from "./search";

export type OutboundTrip = {
  from: string;
  to: string;
  date: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  cabin: CabinClass;
  /** Satıcıdaki aynı uçuşun adresi (Aviasales /search/… yolu); varsa o bilet açılır */
  deep?: string;
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;
/** Havalimanı (AMS) ya da şehir grubu (city:IST) */
const PLACE = /^(city:)?[A-Z]{3}$/;
const CABINS: CabinClass[] = ["economy", "premium_economy", "business", "first"];

/**
 * Site içi yönlendirme adresi. `src`: tıklamanın nereden geldiği (ör. "results", "deal:<id>"), istatistik için.
 * `locale`: Skyscanner'ın aynı dilde açılması için.
 */
export function goHref(t: OutboundTrip, src: string, locale: string): string {
  const p = new URLSearchParams({ from: t.from, to: t.to, d: t.date, a: String(t.adults), l: locale, src });
  if (t.returnDate) p.set("r", t.returnDate);
  if (t.children) p.set("c", String(t.children));
  if (t.infants) p.set("i", String(t.infants));
  if (t.cabin !== "economy") p.set("cabin", t.cabin);
  if (t.deep && isDeepLink(t.deep)) p.set("t", t.deep);
  return `/git?${p}`;
}

/** Yalnızca Aviasales arama yolu kabul edilir (açık yönlendirme olmasın) */
const isDeepLink = (s: string) => s.length <= 1500 && /^\/search\/[A-Za-z0-9]+(\?[A-Za-z0-9_.~%&=+-]*)?$/.test(s);

const int = (v: string | null, min: number, max: number, dflt: number) => {
  const n = Number(v ?? dflt);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
};

/** /git adresindeki parametreleri doğrular; geçersizse null. */
export function parseGo(p: URLSearchParams): (OutboundTrip & { src: string; locale: string }) | null {
  const from = (p.get("from") ?? "").trim();
  const to = (p.get("to") ?? "").trim();
  const date = p.get("d") ?? "";
  const returnDate = p.get("r") ?? undefined;
  const adults = int(p.get("a"), 1, 9, 1);
  const children = int(p.get("c"), 0, 8, 0);
  const infants = int(p.get("i"), 0, 4, 0);
  const cabin = (p.get("cabin") ?? "economy") as CabinClass;
  const deep = p.get("t") ?? undefined;
  if (!PLACE.test(from) || !PLACE.test(to) || from === to || !ISO.test(date)) return null;
  if (returnDate !== undefined && (!ISO.test(returnDate) || returnDate < date)) return null;
  if (adults === null || children === null || infants === null || infants > adults || !CABINS.includes(cabin)) return null;
  return {
    from, to, date, returnDate, adults, children, infants, cabin,
    deep: deep && isDeepLink(deep) ? deep : undefined,
    src: (p.get("src") ?? "").slice(0, 80),
    locale: (p.get("l") ?? "tr").slice(0, 5),
  };
}

const AVIASALES_CLASS: Record<CabinClass, string> = { economy: "", premium_economy: "w", business: "c", first: "f" };
const ddmm = (iso: string) => iso.slice(8, 10) + iso.slice(5, 7);

/**
 * Aviasales arama kodu (resmî biçim): AMS2101ADB2801 + sınıf + yetişkin/çocuk/bebek, ör. AMS2201IST250121.
 * Şehir kodları (IST, LON…) doğrudan kullanılır: tüm havalimanları birlikte aranır.
 */
export function aviasalesRoute(t: Pick<OutboundTrip, "from" | "to" | "date" | "returnDate" | "adults" | "children" | "infants" | "cabin">): string {
  const code = (c: string) => (c.startsWith("city:") ? c.slice(5) : c);
  const pax = String(t.adults) + (t.children || t.infants ? String(t.children) + (t.infants ? String(t.infants) : "") : "");
  return code(t.from) + ddmm(t.date) + code(t.to) + (t.returnDate ? ddmm(t.returnDate) : "") + AVIASALES_CLASS[t.cabin] + pax;
}

/**
 * Aviasales arama kodunu çözer (tarayıcıda da çalışır): AMS2712ADB[0301][c|w|f]<yetişkin>[çocuk][bebek].
 * Yıl verilmez; tarih bugünden önceyse gelecek yıl sayılır. Tanınmazsa null.
 */
export function parseAviasalesRoute(code: string, today = new Date().toISOString().slice(0, 10)) {
  const m = /^([A-Z]{3})(\d{2})(\d{2})([A-Z]{3})(?:(\d{2})(\d{2}))?([cwf])?(\d)(\d)?(\d)?$/.exec(code.trim());
  if (!m) return null;
  const y = Number(today.slice(0, 4));
  const iso = (dd: string, mm: string) => {
    const d = `${y}-${mm}-${dd}`;
    return d < today ? `${y + 1}-${mm}-${dd}` : d;
  };
  const date = iso(m[2], m[3]);
  let returnDate = m[5] && m[6] ? iso(m[5], m[6]) : undefined;
  if (returnDate && returnDate < date) returnDate = `${Number(returnDate.slice(0, 4)) + 1}${returnDate.slice(4)}`;
  const cabin = ({ c: "business", w: "premium_economy", f: "first" } as Record<string, CabinClass>)[m[7] ?? ""] ?? "economy";
  return { from: m[1], to: m[4], date, returnDate, adults: Number(m[8]), children: Number(m[9] ?? 0), infants: Number(m[10] ?? 0), cabin };
}
