"use server";

import { headers } from "next/headers";
import { redirect as externalRedirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getPathname, redirect } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/auth/config";
import { clearSession, getCurrentUser, setDemoUser } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/auth/supabase-server";
import { asLocale } from "@/lib/intl";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type LoginState = { status: "idle" | "sent" | "error"; error?: "email" | "failed" | "google"; email?: string };

async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

/** Yalnızca site içi yollara dönülür (açık yönlendirme olmasın). */
function safeNext(next: string | null | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export async function requestLogin(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const next = safeNext(String(form.get("next") ?? ""));
  if (!EMAIL.test(email)) return { status: "error", error: "email", email };
  const locale = asLocale(await getLocale());

  if (!isSupabaseConfigured()) {
    // Örnek mod: doğrulama yok, hemen giriş.
    await setDemoUser({ email });
    if (next) redirect({ href: next as "/", locale });
    redirect({ href: "/biletlerim", locale });
  }

  const supabase = await supabaseServer();
  const callback = new URL("/auth/callback", await siteOrigin());
  callback.searchParams.set("next", next ?? getPathname({ href: "/biletlerim", locale }));
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callback.toString(), shouldCreateUser: true },
  });
  if (error) {
    console.error("Giriş bağlantısı gönderilemedi:", error.message);
    return { status: "error", error: "failed", email };
  }
  return { status: "sent", email };
}

export async function signInWithGoogle(form: FormData) {
  const next = safeNext(String(form.get("next") ?? "")) ?? "/";
  const supabase = await supabaseServer();
  const callback = new URL("/auth/callback", await siteOrigin());
  callback.searchParams.set("next", next);
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback.toString() } });
  const locale = asLocale(await getLocale());
  if (error || !data.url) redirect({ href: { pathname: "/giris", query: { error: "google" } }, locale });
  else externalRedirect(data.url);
}

export async function signOut() {
  await clearSession();
  redirect({ href: "/", locale: asLocale(await getLocale()) });
}

export type ProfileState = { status: "idle" | "saved" | "error" };

export async function updateProfile(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error" };
  const name = String(form.get("name") ?? "").trim().slice(0, 80);
  if (user.mode === "demo") {
    await setDemoUser({ email: user.email, name: name || undefined });
    return { status: "saved" };
  }
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.updateUser({ data: { full_name: name } });
  return { status: error ? "error" : "saved" };
}
