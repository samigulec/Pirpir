// Örnek rezervasyon verisi — Booking.dc.html ve Confirm.dc.html. Fiyatlar TRY.
export const DEMO_OFFER_ID = "ams-adb-2";
export const DEMO_BOOKING_ID = "demo";

export type BagId = "small" | "cabin" | "big";
export const bagOptions: { id: BagId; price: number }[] = [
  { id: "small", price: 0 },
  { id: "cabin", price: 640 },
  { id: "big", price: 1380 },
];

export type PaymentId = "card" | "ideal" | "apple" | "google";
export const paymentMethods: PaymentId[] = ["card", "ideal", "apple", "google"];

export const idealBanks = ["ING", "ABN AMRO", "Rabobank", "SNS", "ASN Bank", "bunq", "Knab", "Revolut"];

export const nationalities = ["Türkiye", "Hollanda", "Belçika", "Almanya", "Diğer"];
export const phoneCodes = ["+31", "+90", "+32", "+49"];

/** Örnek indirim: her kod için sabit tutar. Gerçek doğrulama sunucuda yapılacak. */
export const DEMO_PROMO_DISCOUNT = 150;

export const demoBooking = {
  id: DEMO_BOOKING_ID,
  offerId: DEMO_OFFER_ID,
  email: "ayse@eposta.com",
  pnr: "[PNR]",
};
