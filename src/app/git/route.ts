import { NextResponse, type NextRequest } from "next/server";
import { MARKET_COOKIE, MARKET_GUESS_COOKIE, isMarketId, marketById, resolveMarket } from "@/config/markets";
import { CURRENCY_COOKIE, isCurrency } from "@/lib/currency";
import { isLocale } from "@/i18n/config";
import { parseGo } from "@/lib/outbound";
import { skyscannerUrl } from "@/lib/outbound-server";
import { supabaseAdmin } from "@/lib/auth/supabase-server";

// "Fırsata git": tıklamayı sayar ve ziyaretçiyi ortaklık bağlantısıyla Skyscanner'a gönderir.
// Arama motorları izlemez (robots.txt + X-Robots-Tag); geçersiz istek ana sayfaya döner.
export async function GET(req: NextRequest) {
  const t = parseGo(req.nextUrl.searchParams);
  if (!t) return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  const locale = isLocale(t.locale) ? t.locale : "tr";
  const saved = req.cookies.get(MARKET_COOKIE)?.value ?? req.cookies.get(MARKET_GUESS_COOKIE)?.value;
  const marketId = isMarketId(saved) ? saved : resolveMarket(null, req.headers.get("x-vercel-ip-country"), locale);
  const cur = req.cookies.get(CURRENCY_COOKIE)?.value;
  const currency = isCurrency(cur) ? cur : marketById(marketId).currency;
  const url = skyscannerUrl(t, { market: marketId, locale, currency, utmTerm: t.src.split(":")[0] || undefined });

  // Tıklama kaydı (Supabase varsa); yönlendirmeyi bekletmez, hata siteyi etkilemez
  const admin = supabaseAdmin();
  if (admin) {
    void admin
      .from("clicks")
      .insert({ src: t.src || null, origin: t.from, destination: t.to, depart: t.date, return_date: t.returnDate ?? null, market: marketId, partner: "skyscanner" })
      .then(({ error }) => error && console.error("Tıklama kaydedilemedi:", error.message));
  }
  return NextResponse.redirect(url, { status: 302, headers: { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" } });
}
