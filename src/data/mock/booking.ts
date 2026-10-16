// Rezervasyon sayfası seçenekleri — Booking.dc.html.

/** Biletçik ipucunun açtığı örnek onay ekranı. */
export const SAMPLE_BOOKING_ID = "ornek";

export const idealBanks = ["ING", "ABN AMRO", "Rabobank", "SNS", "ASN Bank", "bunq", "Knab", "Revolut"];

export const nationalities = ["Türkiye", "Hollanda", "Belçika", "Almanya", "Diğer"];
export const phoneCodes = ["+31", "+90", "+32", "+49"];

export type PaymentId = "card" | "ideal" | "apple" | "google";
export const paymentMethods: PaymentId[] = ["card", "ideal", "apple", "google"];

/** Geçerli indirim kodları (TRY). Gerçek kampanya sistemi gelene kadar buradan yönetilir. */
export const PROMO_CODES: Record<string, number> = { HOSGELDIN: 150 };

export function promoDiscount(code?: string): number {
  if (!code) return 0;
  const key = code
    .trim()
    .toLocaleUpperCase("tr-TR")
    .replace(/[İŞĞÜÖÇ]/g, (c) => ({ İ: "I", Ş: "S", Ğ: "G", Ü: "U", Ö: "O", Ç: "C" })[c] ?? c);
  return PROMO_CODES[key] ?? 0;
}
