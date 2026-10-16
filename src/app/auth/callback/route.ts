import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, SIGNED_IN_COOKIE } from "@/lib/auth/config";
import { supabaseServer } from "@/lib/auth/supabase-server";

// E-postadaki giriş bağlantısı ve Google dönüşü buraya gelir: kod oturuma çevrilir.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (code && isSupabaseConfigured()) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const res = NextResponse.redirect(new URL(next, url.origin));
      res.cookies.set(SIGNED_IN_COOKIE, "1", { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
      return res;
    }
    console.error("Giriş kodu doğrulanamadı:", error.message);
  }
  return NextResponse.redirect(new URL("/giris?error=link", url.origin));
}
