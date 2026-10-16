import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/** Oturum çerezleriyle çalışan istemci (RLS kullanıcı adına uygulanır). */
export async function supabaseServer() {
  const jar = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {
          // Sunucu bileşeninden çağrıldıysa çerez yazılamaz; oturumu proxy yeniler.
        }
      },
    },
  });
}

/** Yalnızca sunucuda, rezervasyon kaydı için (RLS'yi aşar). Anahtar yoksa null. */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) return null;
  return createAdminClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
