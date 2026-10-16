import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { refreshSession } from "./lib/auth/proxy-session";

const intl = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const response = intl(request);
  // Giriş oturumunun süresini yeniler (Supabase yapılandırıldıysa).
  await refreshSession(request, response);
  return response;
}

export const config = {
  // API, oturum geri dönüşü, Next.js dosyaları ve uzantılı statik dosyalar hariç her şey.
  matcher: "/((?!api|auth|_next|_vercel|.*\\..*).*)",
};
