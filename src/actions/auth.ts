"use server";

import { headers } from "next/headers";
import { redirect as externalRedirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getPathname, redirect } from "@/i18n/navigation";
import { enabledProviders, isSupabaseConfigured } from "@/lib/auth/config";
import { clearSession, getCurrentUser, setDemoUser } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/auth/supabase-server";
import { clearLocalBookings } from "@/lib/bookings";
import { asLocale } from "@/lib/intl";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type OAuthProvider = "google" | "facebook" | "apple";
const OAUTH: OAuthProvider[] = ["google", "facebook", "apple"];

export type LoginState = {
  status: "idle" | "sent" | "signedIn" | "error";
  error?: "email" | "failed" | "provider" | "notConfigured" | "rateLimit" | "signupDisabled";
  email?: string;
};

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
    // Örnek mod: doğrulama yok, hemen giriş. Pencere kapanır, sayfa yenilenir.
    await setDemoUser({ email });
    return { status: "signedIn", email };
  }

  const supabase = await supabaseServer();
  const callback = new URL("/auth/callback", await siteOrigin());
  callback.searchParams.set("next", next ?? getPathname({ href: "/biletlerim", locale }));
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callback.toString(), shouldCreateUser: true },
  });
  if (error) {
    console.error("Giriş bağlantısı gönderilemedi:", error.code ?? error.status, error.message);
    const code = error.code ?? "";
    if (error.status === 429 || code.includes("rate_limit")) return { status: "error", error: "rateLimit", email };
    if (code === "signup_disabled" || code === "email_provider_disabled") return { status: "error", error: "signupDisabled", email };
    if (code === "email_address_invalid") return { status: "error", error: "email", email };
    return { status: "error", error: "failed", email };
  }
  return { status: "sent", email };
}

/** Google / Facebook / Apple: sağlayıcının giriş sayfasına yönlendirir, dönüş /auth/callback'e gelir. */
export async function signInWithProvider(_prev: LoginState, form: FormData): Promise<LoginState> {
  const provider = String(form.get("provider") ?? "") as OAuthProvider;
  if (!OAUTH.includes(provider)) return { status: "error", error: "provider" };
  if (!isSupabaseConfigured() || !enabledProviders().includes(provider)) return { status: "error", error: "notConfigured" };
  const next = safeNext(String(form.get("next") ?? "")) ?? "/";
  const supabase = await supabaseServer();
  const callback = new URL("/auth/callback", await siteOrigin());
  callback.searchParams.set("next", next);
  const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: callback.toString() } });
  if (error || !data.url) {
    console.error("Sosyal giriş başlatılamadı:", error?.message);
    return { status: "error", error: "provider" };
  }
  externalRedirect(data.url);
}

export async function signOut() {
  await clearSession();
  await clearLocalBookings();
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
