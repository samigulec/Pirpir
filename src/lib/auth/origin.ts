// Giriş adresleri: Supabase dönüşünün geleceği ana adres ve sosyal girişin başlatılması (sunucu).
import "server-only";
import { headers } from "next/headers";
import { supabaseServer } from "./supabase-server";

export type OAuthProvider = "google" | "facebook" | "apple";

/**
 * Girişin döneceği ana adres: ayarlı site adresi (NEXT_PUBLIC_SITE_URL, Supabase'in izin listesinde), yoksa istekteki adres.
 */
export async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  return requestOrigin();
}

export async function requestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return `${h.get("x-forwarded-proto") ?? "https"}://${host}`;
}

/** Sağlayıcının giriş sayfası (güvenlik çerezi bu istekte yazılır). Başlatılamazsa null. */
export async function oauthUrl(provider: OAuthProvider, next: string): Promise<string | null> {
  const supabase = await supabaseServer();
  const callback = new URL("/auth/callback", await siteOrigin());
  callback.searchParams.set("next", next);
  const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: callback.toString() } });
  if (error || !data.url) {
    console.error("Sosyal giriş başlatılamadı:", error?.message);
    return null;
  }
  return data.url;
}
