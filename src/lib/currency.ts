export type Currency = "TRY" | "EUR" | "USD" | "GBP" | "CHF" | "DKK" | "SEK" | "NOK" | "PLN" | "CAD" | "AUD" | "AED";

export const CURRENCIES: Currency[] = ["TRY", "EUR", "USD", "GBP", "CHF", "DKK", "SEK", "NOK", "PLN", "CAD", "AUD", "AED"];

// Örnek kurlar (TRY bazlı). Sonra canlı kur servisine bağlanacak.
export const RATES: Record<Currency, number> = {
  TRY: 1,
  EUR: 1 / 40,
  USD: 1 / 34.5,
  GBP: 1 / 46,
  CHF: 1 / 42.8,
  DKK: 1 / 5.36,
  SEK: 1 / 3.57,
  NOK: 1 / 3.45,
  PLN: 1 / 9.3,
  CAD: 1 / 25,
  AUD: 1 / 22.5,
  AED: 1 / 9.4,
};

export const SYMBOLS: Record<Currency, string> = {
  TRY: "₺", EUR: "€", USD: "$", GBP: "£", CHF: "CHF", DKK: "kr", SEK: "kr", NOK: "kr", PLN: "zł", CAD: "CA$", AUD: "A$", AED: "AED",
};

/** Sembolü sayıdan sonra yazılanlar (1.234 kr, 1.234 zł); harfli semboller boşlukla ayrılır (CHF 120). */
const AFTER = new Set<Currency>(["DKK", "SEK", "NOK", "PLN"]);
const withSymbol = (cur: Currency, n: string) =>
  AFTER.has(cur) ? `${n} ${SYMBOLS[cur]}` : /^[A-Z]{3}$/.test(SYMBOLS[cur]) ? `${SYMBOLS[cur]} ${n}` : SYMBOLS[cur] + n;

export const CURRENCY_COOKIE = "cur";
export const CURRENCY_STORAGE_KEY = "rotala.cur";

// Sağlayıcıdan gelen fiyatları TRY'ye çevirmek için (örnek kurlar, 1 TRY = x birim).
const PROVIDER_RATES: Record<string, number> = RATES;

/** Sağlayıcı fiyatı (ör. "123.45 EUR") → TRY. Bilinmeyen para birimi EUR sayılır. */
export function toTry(amount: number, currency: string): number {
  const rate = PROVIDER_RATES[currency.toUpperCase()] ?? RATES.EUR;
  return Math.round(amount / rate);
}

export function isCurrency(v: unknown): v is Currency {
  return typeof v === "string" && (CURRENCIES as string[]).includes(v);
}

export function convert(amountTry: number, cur: Currency): number {
  return Math.round(amountTry * RATES[cur]);
}

/** ₺2.760 biçimi; binlik ayırıcı sayfa diline göre (tr/nl/de: nokta, en: virgül). */
export function formatPrice(amountTry: number, cur: Currency, intlLocale = "tr-TR"): string {
  return withSymbol(cur, convert(amountTry, cur).toLocaleString(intlLocale));
}

/** Grafik etiketleri için kısa biçim: ₺2,9B · ₺2.9K · ₺2,9K */
export function formatShort(amountTry: number, cur: Currency, intlLocale = "tr-TR"): string {
  const v = convert(amountTry, cur);
  const compact = new Intl.NumberFormat(intlLocale, { notation: "compact", maximumFractionDigits: 1 }).format(v);
  return withSymbol(cur, compact.replace(/\s/g, ""));
}
