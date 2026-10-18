import { NextResponse, type NextRequest } from "next/server";
import { oauthUrl, type OAuthProvider } from "@/lib/auth/origin";
import { enabledProviders, isSupabaseConfigured } from "@/lib/auth/config";

// Ana adreste sosyal giriş başlatır (giriş www gibi başka bir adreste başladıysa buraya yönlenir):
// güvenlik çerezi bu adrese yazılır, Google da buraya döner.
export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider") as OAuthProvider;
  const raw = req.nextUrl.searchParams.get("next") ?? "/";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  if (!isSupabaseConfigured() || !enabledProviders().includes(provider)) {
    return NextResponse.redirect(new URL("/giris?error=link", req.nextUrl.origin));
  }
  const url = await oauthUrl(provider, next);
  return NextResponse.redirect(url ?? new URL("/giris?error=link", req.nextUrl.origin));
}
