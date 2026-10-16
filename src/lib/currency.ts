export type Currency = "TRY" | "EUR" | "USD";

export const CURRENCIES: Currency[] = ["TRY", "EUR", "USD"];

// Örnek kurlar (TRY bazlı). Sonra canlı kur servisine bağlanacak.
export const RATES: Record<Currency, number> = { TRY: 1, EUR: 1 / 40, USD: 1 / 34.5 };

export const SYMBOLS: Record<Currency, string> = { TRY: "₺", EUR: "€", USD: "$" };

export const CURRENCY_COOKIE = "cur";
export const CURRENCY_STORAGE_KEY = "rotala.cur";

// Sağlayıcıdan gelen fiyatları TRY'ye çevirmek için (örnek kurlar, 1 TRY = x birim).
const PROVIDER_RATES: Record<string, number> = { ...RATES, GBP: 1 / 46 };

/** Sağlayıcı fiyatı (ör. "123.45 EUR") → TRY. Bilinmeyen para birimi EUR sayılır. */
export function toTry(amount: number, currency: string): number {
  const rate = PROVIDER_RATES[currency.toUpperCase()] ?? RATES.EUR;
  return Math.round(amount / rate);
}

export function isCurrency(v: unknown): v is Currency {
  return v === "TRY" || v === "EUR" || v === "USD";
}

export function convert(amountTry: number, cur: Currency): number {
  return Math.round(amountTry * RATES[cur]);
}

/** ₺2.760 biçimi; binlik ayırıcı sayfa diline göre (tr/nl: nokta, en: virgül). */
export function formatPrice(amountTry: number, cur: Currency, intlLocale = "tr-TR"): string {
  return SYMBOLS[cur] + convert(amountTry, cur).toLocaleString(intlLocale);
}

/** Grafik etiketleri için kısa biçim: ₺2,9B · ₺2.9K · ₺2,9K */
export function formatShort(amountTry: number, cur: Currency, intlLocale = "tr-TR"): string {
  const v = convert(amountTry, cur);
  const compact = new Intl.NumberFormat(intlLocale, { notation: "compact", maximumFractionDigits: 1 }).format(v);
  return SYMBOLS[cur] + compact.replace(/\s/g, "");
}
