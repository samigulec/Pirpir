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

/**
 * Travelpayouts White Label "Widget" kimliği: kayıtlı fiyat az ya da yokken sonuç sayfasında canlı Aviasales sonuçları
 * gösterilir (`src/components/results/LiveWidget.tsx`). Gizli değildir (sayfa kaynağında görünür).
 */
export const liveWidgetId = () => process.env.NEXT_PUBLIC_TP_WL_WIDGET_ID?.trim() || null;

/** Widget betiğinin adresi: değişkende tam adres (Travelpayouts kodundaki `script.src`) ya da yalnızca `wl_id` olabilir */
export function liveWidgetSrc(): string | null {
  const v = liveWidgetId();
  if (!v) return null;
  if (/^https:\/\/tpwgts?\.com\/wl_web\/main\.js\?wl_id=\d+$/.test(v)) return v;
  const id = v.replace(/\D/g, "");
  return id ? `https://tpwgt.com/wl_web/main.js?wl_id=${id}` : null;
}
