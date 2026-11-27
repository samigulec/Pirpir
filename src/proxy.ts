import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { isAffiliate } from "./config/affiliate";
import { MARKET_COOKIE, MARKET_GUESS_COOKIE, resolveMarket } from "./config/markets";
import { isLocale, type Locale } from "./i18n/config";
import { getPathname } from "./i18n/navigation";
import { routing } from "./i18n/routing";
import { refreshSession } from "./lib/auth/proxy-session";

const intl = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const response = intl(request);
  // Ortaklık modunda bilet satışı yoktur: tüm dillerde /biletlerim → /hesap, /rezervasyon/* → / (HTTP 307)
  if (isAffiliate()) {
    const rewrite = response.headers.get("x-middleware-rewrite");
    const internalPath = rewrite ? new URL(rewrite).pathname : request.nextUrl.pathname;
    const match = internalPath.match(/^\/(tr|en|nl|de|fr|es|it)\/(biletlerim|rezervasyon)(?:\/|$)/);
    if (match) {
      const loc = match[1] as Locale;
      const target = match[2] === "biletlerim" ? getPathname({ href: "/hesap", locale: loc }) : getPathname({ href: "/", locale: loc });
      return NextResponse.redirect(new URL(target, request.url), 307);
    }
  }
  // Ülke seçilmediyse konumdan (yoksa dilden) tahmin edilir. Tahmin ayrı çerezde: dil değişince tahmin de değişir,
  // kullanıcının kendi seçimi ise hiç ezilmez. Tarayıcı tarafı varsayılan para birimini buradan alır.
  if (!request.cookies.has(MARKET_COOKIE)) {
    const first = request.nextUrl.pathname.split("/")[1];
    const locale = isLocale(first) ? first : routing.defaultLocale;
    const guess = resolveMarket(null, request.headers.get("x-vercel-ip-country"), locale);
    if (request.cookies.get(MARKET_GUESS_COOKIE)?.value !== guess) {
      response.cookies.set(MARKET_GUESS_COOKIE, guess, { path: "/", maxAge: 31536000, sameSite: "lax" });
    }
  }
  // Giriş oturumunun süresini yeniler (Supabase yapılandırıldıysa).
  await refreshSession(request, response);
  return response;
}

export const config = {
  // API, oturum geri dönüşü, Next.js dosyaları ve uzantılı statik dosyalar hariç her şey.
  matcher: "/((?!api|auth|git|_next|_vercel|.*\\..*).*)",
};
