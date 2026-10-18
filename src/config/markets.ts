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
  /** "Popüler rotalar" listesi: [kalkış, varış]; "city:" önekli kodlar şehrin tüm havalimanlarını arar */
  routes: [string, string][];
};

export const MARKETS: Market[] = [
  {
    id: "NL",
    currency: "EUR",
    from: "AMS",
    routes: [["AMS", "city:IST"], ["AMS", "city:LON"], ["AMS", "BCN"], ["AMS", "city:ROM"], ["AMS", "LIS"], ["AMS", "AYT"], ["EIN", "ADB"], ["AMS", "DXB"], ["AMS", "city:NYC"]],
  },
  {
    id: "BE",
    currency: "EUR",
    from: "city:BRU",
    routes: [["city:BRU", "city:IST"], ["city:BRU", "BCN"], ["city:BRU", "city:ROM"], ["city:BRU", "LIS"], ["city:BRU", "AYT"], ["city:BRU", "ATH"], ["city:BRU", "MAD"], ["city:BRU", "DXB"], ["city:BRU", "city:NYC"]],
  },
  {
    id: "DE",
    currency: "EUR",
    from: "FRA",
    routes: [["FRA", "city:IST"], ["BER", "city:LON"], ["MUC", "BCN"], ["DUS", "AYT"], ["FRA", "city:ROM"], ["FRA", "LIS"], ["MUC", "ATH"], ["FRA", "DXB"], ["FRA", "city:NYC"]],
  },
  {
    id: "TR",
    currency: "TRY",
    from: "city:IST",
    routes: [["city:IST", "AYT"], ["city:IST", "ADB"], ["city:IST", "AMS"], ["city:IST", "city:LON"], ["city:IST", "city:PAR"], ["city:IST", "city:ROM"], ["city:IST", "BCN"], ["city:IST", "DXB"], ["city:IST", "city:NYC"]],
  },
  {
    id: "GB",
    currency: "GBP",
    from: "city:LON",
    routes: [["city:LON", "city:IST"], ["city:LON", "BCN"], ["city:LON", "city:ROM"], ["city:LON", "LIS"], ["city:LON", "AMS"], ["city:LON", "AYT"], ["city:LON", "DLM"], ["city:LON", "DXB"], ["city:LON", "city:NYC"]],
  },
  {
    id: "US",
    currency: "USD",
    from: "city:NYC",
    routes: [["city:NYC", "city:LON"], ["city:NYC", "city:PAR"], ["city:NYC", "city:ROM"], ["city:NYC", "BCN"], ["city:NYC", "LIS"], ["city:NYC", "AMS"], ["city:NYC", "city:IST"], ["city:NYC", "ATH"], ["city:NYC", "DXB"]],
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
const BY_LOCALE: Record<Locale, MarketId> = { tr: "TR", nl: "NL", en: "NL", de: "DE" };

/** Öncelik: kayıtlı seçim → ziyaretçinin konumu (desteklenen bir ülkeyse) → dil. */
export function resolveMarket(saved: string | undefined | null, geoCountry: string | undefined | null, locale: Locale): MarketId {
  if (isMarketId(saved)) return saved;
  const geo = geoCountry?.toUpperCase();
  if (isMarketId(geo)) return geo;
  return BY_LOCALE[locale];
}
