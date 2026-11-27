// Satış modu: "affiliate" (varsayılan) — pirpir bilet satmaz, ziyaretçiyi ortaklık bağlantısıyla Skyscanner'a gönderir
// ve komisyon kazanır. "booking" — eski akış: Duffel ile site içinde rezervasyon ve ödeme (kod duruyor, kapalı).
// NEXT_PUBLIC_ olduğu için derleme anında koda gömülür; değiştirince yeniden yayınlamak gerekir.
export type SalesMode = "affiliate" | "booking";

export const salesMode = (): SalesMode => (process.env.NEXT_PUBLIC_SALES_MODE === "booking" ? "booking" : "affiliate");
export const isAffiliate = () => salesMode() === "affiliate";

/**
 * Travelpayouts White Label: kendi alt alan adımızda (ör. ucus.flypirpir.nl) canlı Aviasales araması. Tanımlıysa
 * "Fırsata git" oraya gider (canlı fiyat, aynı komisyon). Alan adının CNAME kaydı whitelabel.travelpayouts.com'a gider.
 */
export const whiteLabelHost = () => process.env.NEXT_PUBLIC_TP_WL_HOST?.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "") || null;

/**
 * "Fırsata git" ortağı: Skyscanner kimliği (SKYSCANNER_MEDIA_PARTNER_ID) tanımlıysa Skyscanner (next.config.ts),
 * değilse White Label alan adı varsa kendi canlı aramamız, yoksa Aviasales.
 */
export type OutboundPartner = "skyscanner" | "aviasales" | "whitelabel";
export const outboundPartner = (): OutboundPartner =>
  process.env.NEXT_PUBLIC_OUTBOUND_PARTNER === "skyscanner" ? "skyscanner" : whiteLabelHost() ? "whitelabel" : "aviasales";
