import "server-only";
import { cookies, headers } from "next/headers";
import { MARKET_COOKIE, marketById, resolveMarket, type Market } from "@/config/markets";
import { isLocale } from "@/i18n/config";

/** Ziyaretçinin ülkesi: kayıtlı seçim → Vercel'in konum başlığı → sayfa dili. Okumak sayfayı dinamik yapar. */
export async function getMarket(locale: string): Promise<Market> {
  const [c, h] = await Promise.all([cookies(), headers()]);
  return marketById(resolveMarket(c.get(MARKET_COOKIE)?.value, h.get("x-vercel-ip-country"), isLocale(locale) ? locale : "tr"));
}
