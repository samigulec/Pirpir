export type CardBrand = "Visa" | "Mastercard" | "Amex" | null;

/** Kart numarasını rakamlara indirger, 16 haneyle sınırlar ve 4'lü gruplar. */
export function formatCardNumber(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

/** İlk haneye göre kart türü: 4 → Visa, 5/2 → Mastercard, 3 → Amex. */
export function detectCardBrand(raw: string): CardBrand {
  const first = raw.replace(/\D/g, "").charAt(0);
  if (first === "4") return "Visa";
  if (first === "5" || first === "2") return "Mastercard";
  if (first === "3") return "Amex";
  return null;
}
