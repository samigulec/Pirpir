import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { SIGNED_IN_COOKIE, SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

/** Her istekte Supabase oturum çerezini yeniler ve başlıktaki giriş işaretini günceller. */
export async function refreshSession(request: NextRequest, response: NextResponse) {
  if (!isSupabaseConfigured()) return;
  // Oturum çerezi yoksa (misafir) yapılacak bir şey yok; ön yüklemelerde (prefetch) de atlanır, asıl geçişte yenilenir
  const hasSession = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  if (!hasSession) {
    if (request.cookies.has(SIGNED_IN_COOKIE)) response.cookies.delete(SIGNED_IN_COOKIE);
    return;
  }
  if (request.headers.get("next-router-prefetch")) return;
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => list.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });
  try {
    // getClaims: süresi dolmuşsa oturumu yeniler, anahtarı yerelde doğrular (getUser gibi her istekte ağa gitmez)
    const { data } = await supabase.auth.getClaims();
    const user = data?.claims?.sub;
    const flagged = request.cookies.has(SIGNED_IN_COOKIE);
    if (user && !flagged) response.cookies.set(SIGNED_IN_COOKIE, "1", { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
    if (!user && flagged) response.cookies.delete(SIGNED_IN_COOKIE);
  } catch {
    // Ağ hatasında sayfa yine açılsın.
  }
}
