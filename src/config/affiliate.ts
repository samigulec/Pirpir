// Satış modu: "affiliate" (varsayılan) — pirpir bilet satmaz, ziyaretçiyi ortaklık bağlantısıyla Skyscanner'a gönderir
// ve komisyon kazanır. "booking" — eski akış: Duffel ile site içinde rezervasyon ve ödeme (kod duruyor, kapalı).
// NEXT_PUBLIC_ olduğu için derleme anında koda gömülür; değiştirince yeniden yayınlamak gerekir.
export type SalesMode = "affiliate" | "booking";

export const salesMode = (): SalesMode => (process.env.NEXT_PUBLIC_SALES_MODE === "booking" ? "booking" : "affiliate");
export const isAffiliate = () => salesMode() === "affiliate";
