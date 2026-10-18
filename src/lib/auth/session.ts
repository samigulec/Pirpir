// Oturumdaki kullanıcı. Supabase yapılandırılmışsa gerçek hesap, değilse örnek mod.
import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { SIGNED_IN_COOKIE, isSupabaseConfigured } from "./config";
import { supabaseServer } from "./supabase-server";

export type CurrentUser = {
  id: string;
  email: string;
  name?: string;
  mode: "supabase" | "demo";
};

const DEMO_COOKIE = "rotala_demo_user";

/**
 * İstek başına bir kez çalışır (sayfa, eylemler ve kayıt listeleri aynı sonucu paylaşır).
 * Oturum anahtarı (JWT) Supabase'in açık anahtarıyla yerelde doğrulanır: her çağrıda Supabase'e ağ isteği gitmez.
 * Proje eski tip (HS256) anahtar kullanıyorsa getClaims kendiliğinden sunucuya sorar.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (isSupabaseConfigured()) {
    const supabase = await supabaseServer();
    const { data } = await supabase.auth.getClaims();
    const c = data?.claims;
    if (!c?.sub || !c.email) return null;
    return {
      id: c.sub,
      email: c.email,
      name: ((c.user_metadata as Record<string, unknown> | undefined)?.full_name as string | undefined) || undefined,
      mode: "supabase",
    };
  }
  const raw = (await cookies()).get(DEMO_COOKIE)?.value;
  if (!raw) return null;
  try {
    const v = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as { email: string; name?: string };
    return { id: "demo:" + v.email, email: v.email, name: v.name, mode: "demo" };
  } catch {
    return null;
  }
});

const cookieOpts = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 30,
};

/** Örnek mod: e-posta doğrulamasız oturum (yalnızca Supabase yokken). */
export async function setDemoUser(user: { email: string; name?: string }) {
  const jar = await cookies();
  jar.set(DEMO_COOKIE, Buffer.from(JSON.stringify(user)).toString("base64url"), { ...cookieOpts, httpOnly: true });
  jar.set(SIGNED_IN_COOKIE, "1", cookieOpts);
}

export async function clearSession() {
  const jar = await cookies();
  if (isSupabaseConfigured()) {
    const supabase = await supabaseServer();
    await supabase.auth.signOut();
  }
  jar.delete(DEMO_COOKIE);
  jar.delete(SIGNED_IN_COOKIE);
}

export async function markSignedIn() {
  (await cookies()).set(SIGNED_IN_COOKIE, "1", cookieOpts);
}
