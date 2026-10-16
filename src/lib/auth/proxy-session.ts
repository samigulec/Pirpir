import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { SIGNED_IN_COOKIE, SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

/** Her istekte Supabase oturum çerezini yeniler ve başlıktaki giriş işaretini günceller. */
export async function refreshSession(request: NextRequest, response: NextResponse) {
  if (!isSupabaseConfigured()) return;
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => list.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });
  try {
    const { data } = await supabase.auth.getUser();
    const flagged = request.cookies.has(SIGNED_IN_COOKIE);
    if (data.user && !flagged) response.cookies.set(SIGNED_IN_COOKIE, "1", { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
    if (!data.user && flagged) response.cookies.delete(SIGNED_IN_COOKIE);
  } catch {
    // Ağ hatasında sayfa yine açılsın.
  }
}
