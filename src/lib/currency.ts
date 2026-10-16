export type Currency = "TRY" | "EUR" | "USD";

export const CURRENCIES: Currency[] = ["TRY", "EUR", "USD"];

// Örnek kurlar (TRY bazlı). Sonra canlı kur servisine bağlanacak.
export const RATES: Record<Currency, number> = { TRY: 1, EUR: 1 / 40, USD: 1 / 34.5 };

export const SYMBOLS: Record<Currency, string> = { TRY: "₺", EUR: "€", USD: "$" };

export const CURRENCY_COOKIE = "cur";
export const CURRENCY_STORAGE_KEY = "rotala.cur";

export function isCurrency(v: unknown): v is Currency {
  return v === "TRY" || v === "EUR" || v === "USD";
}

export function convert(amountTry: number, cur: Currency): number {
  return Math.round(amountTry * RATES[cur]);
}

/** ₺2.760 biçimi (tr-TR binlik ayırıcı). */
export function formatPrice(amountTry: number, cur: Currency): string {
  return SYMBOLS[cur] + convert(amountTry, cur).toLocaleString("tr-TR");
}

/** Grafik etiketleri için kısa biçim: ₺2,9B */
export function formatShort(amountTry: number, cur: Currency): string {
  const v = convert(amountTry, cur);
  return (
    SYMBOLS[cur] +
    (v >= 1000 ? (v / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) + "B" : String(v))
  );
}
