// Ülke (pazar) ayarları: Kiwi'deki gibi seçilen ülkeye göre varsayılan kalkış yeri, para birimi ve popüler rotalar.
// Dil ayrı seçilir (ör. Hollanda'da yaşayıp Türkçe kullanan biri). Ziyaretçinin ülkesi ilk girişte konumundan,
// o yoksa dilinden tahmin edilir; sonra başlıktaki "Ülke · Dil · Para birimi" penceresinden değiştirilebilir.
import type { Currency } from "@/lib/currency";
import type { Locale } from "@/i18n/config";

export type MarketId = "NL" | "BE" | "DE" | "TR" | "GB" | "US";

export type Market = {
  id: MarketId;
  currency: Currency;
  /** Ana sayfadaki "Nereden" ve popüler uçuş fiyatlarının kalkış yeri ("city:" önekli şehir ya da havalimanı) */
  from: string;
  /** Arama kutusunda önerilen varış */
  to: string;
  /** "Popüler rotalar" listesi: [kalkış, varış]; "city:" önekli kodlar şehrin tüm havalimanlarını arar */
  routes: [string, string][];
};

export const MARKETS: Market[] = [
  {
    id: "NL",
    currency: "EUR",
    from: "AMS",
    to: "ADB",
    routes: [["AMS", "IST"], ["AMS", "ADB"], ["EIN", "AYT"], ["RTM", "AYT"], ["AMS", "ESB"], ["AMS", "ASR"], ["AMS", "GZT"], ["AMS", "TZX"]],
  },
  {
    id: "BE",
    currency: "EUR",
    from: "city:BRU",
    to: "IST",
    routes: [["city:BRU", "city:IST"], ["city:BRU", "AYT"], ["city:BRU", "ADB"], ["city:BRU", "ESB"], ["city:BRU", "ASR"], ["city:BRU", "GZT"], ["city:BRU", "BJV"], ["city:BRU", "TZX"]],
  },
  {
    id: "DE",
    currency: "EUR",
    from: "FRA",
    to: "IST",
    routes: [["FRA", "city:IST"], ["DUS", "city:IST"], ["CGN", "city:IST"], ["MUC", "city:IST"], ["BER", "city:IST"], ["DUS", "AYT"], ["CGN", "ADB"], ["FRA", "ESB"]],
  },
  {
    id: "TR",
    currency: "TRY",
    from: "city:IST",
    to: "AYT",
    routes: [["city:IST", "AYT"], ["city:IST", "ADB"], ["city:IST", "TZX"], ["city:IST", "ESB"], ["city:IST", "AMS"], ["city:IST", "city:LON"], ["city:IST", "city:PAR"], ["city:IST", "city:ROM"]],
  },
  {
    id: "GB",
    currency: "GBP",
    from: "city:LON",
    to: "IST",
    routes: [["city:LON", "city:IST"], ["city:LON", "AYT"], ["city:LON", "DLM"], ["city:LON", "ADB"], ["city:LON", "BJV"], ["city:LON", "AMS"], ["city:LON", "BCN"], ["city:LON", "LIS"]],
  },
  {
    id: "US",
    currency: "USD",
    from: "city:NYC",
    to: "IST",
    routes: [["city:NYC", "city:IST"], ["city:NYC", "AMS"], ["city:NYC", "city:LON"], ["city:NYC", "city:PAR"], ["city:NYC", "city:ROM"], ["city:NYC", "BCN"], ["city:NYC", "LIS"], ["city:NYC", "ATH"]],
  },
];

/** Kullanıcının seçtiği ülke */
export const MARKET_COOKIE = "market";
/** Seçim yokken konumdan / dilden yapılan tahmin (her istekte yenilenir) */
export const MARKET_GUESS_COOKIE = "market_guess";

export function isMarketId(v: unknown): v is MarketId {
  return typeof v === "string" && MARKETS.some((m) => m.id === v);
}

export function marketById(id: MarketId): Market {
  return MARKETS.find((m) => m.id === id)!;
}

/** Konum yoksa dilden tahmin: Türkçe → Türkiye, Hollandaca → Hollanda, İngilizce → Hollanda (sitenin ana pazarı). */
const BY_LOCALE: Record<Locale, MarketId> = { tr: "TR", nl: "NL", en: "NL" };

/** Öncelik: kayıtlı seçim → ziyaretçinin konumu (desteklenen bir ülkeyse) → dil. */
export function resolveMarket(saved: string | undefined | null, geoCountry: string | undefined | null, locale: Locale): MarketId {
  if (isMarketId(saved)) return saved;
  const geo = geoCountry?.toUpperCase();
  if (isMarketId(geo)) return geo;
  return BY_LOCALE[locale];
}
