import { NextResponse, type NextRequest } from "next/server";
import { brand, siteUrl } from "@/config/brand";
import { isLocale } from "@/i18n/config";
import { getPathname } from "@/i18n/navigation";
import { checkAlertToken } from "@/lib/alert-token";
import { supabaseAdmin } from "@/lib/auth/supabase-server";

// E-postadaki "Bu alarmı kapat" bağlantısı ve e-posta programlarının tek tık "abonelikten çık" isteği (POST).
// Giriş gerekmez: bağlantıdaki imza yalnızca o alarmı siler.
const TEXT = {
  tr: { title: "Alarm kapatıldı", text: "Bu uçuş için artık e-posta göndermeyeceğiz.", bad: "Bu bağlantı geçersiz ya da alarm zaten kapalı.", home: "Ana sayfaya dön" },
  en: { title: "Alert turned off", text: "We won't email you about this flight anymore.", bad: "This link is invalid or the alert is already off.", home: "Back to home" },
  nl: { title: "Alarm uitgezet", text: "We mailen je niet meer over deze vlucht.", bad: "Deze link is ongeldig of het alarm staat al uit.", home: "Terug naar home" },
  de: { title: "Alarm ausgeschaltet", text: "Wir schreiben dir zu diesem Flug nicht mehr.", bad: "Dieser Link ist ungültig oder der Alarm ist bereits aus.", home: "Zur Startseite" },
  fr: { title: "Alerte désactivée", text: "Nous ne t'enverrons plus d'e-mails pour ce vol.", bad: "Ce lien n'est pas valide ou l'alerte est déjà désactivée.", home: "Retour à l'accueil" },
  es: { title: "Alerta desactivada", text: "Ya no te escribiremos sobre este vuelo.", bad: "Este enlace no es válido o la alerta ya está desactivada.", home: "Volver al inicio" },
  it: { title: "Avviso disattivato", text: "Non ti scriveremo più per questo volo.", bad: "Questo link non è valido o l'avviso è già disattivato.", home: "Torna alla home" },
} as const;

async function turnOff(req: NextRequest): Promise<boolean> {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const token = req.nextUrl.searchParams.get("t") ?? "";
  const admin = supabaseAdmin();
  if (!admin || !/^[0-9a-f-]{36}$/.test(id) || !checkAlertToken(id, token)) return false;
  const { data, error } = await admin.from("user_items").delete().eq("id", id).eq("kind", "alert").select("id");
  return !error && !!data?.length;
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ ok: await turnOff(req) });
}

export async function GET(req: NextRequest) {
  const ok = await turnOff(req);
  const lang = req.nextUrl.searchParams.get("lang") ?? "tr";
  const l = isLocale(lang) ? lang : "tr";
  const t = TEXT[l];
  const home = siteUrl() + getPathname({ href: "/", locale: l });
  const html = `<!doctype html><html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${brand.name} — ${ok ? t.title : t.bad}</title></head>
<body style="margin:0;background:#EAF3FF;font-family:Nunito,'Segoe UI',Helvetica,Arial,sans-serif;color:#1E2A44;display:flex;min-height:100vh;align-items:center;justify-content:center">
<main style="background:#fff;border-radius:28px;padding:32px 28px;max-width:420px;margin:16px;text-align:center">
<img src="/email/pirpir.png" width="140" height="98" alt="" style="display:block;margin:0 auto 12px">
<h1 style="margin:0 0 8px;font-size:26px">${ok ? t.title : t.bad}</h1>
${ok ? `<p style="margin:0 0 20px;color:#56607A">${t.text}</p>` : ""}
<a href="${home}" style="display:inline-block;background:#2F5BD3;color:#fff;text-decoration:none;border-radius:999px;padding:12px 24px;font-weight:800">${t.home}</a>
</main></body></html>`;
  return new NextResponse(html, { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
