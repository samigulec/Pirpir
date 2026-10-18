// Fiyat alarmlarının günlük kontrolü (Vercel Cron → /api/cron/price-alerts).
// Her alarm için sonuç sayfasıyla aynı (önbellekli) arama yapılır; fiyat belirgin düştüyse e-posta gider.
// Aramalar arka plan önceliğindedir: ziyaretçinin aramasından pay almaz, istek sınırı darsa kalanlar
// bir sonraki çalışmaya kalır. Örnek moddaki (çerezde tutulan) alarmlar sunucudan görülemez, kontrol edilmez.
import "server-only";
import { cityByCode } from "@/data/airports";
import { getPathname } from "@/i18n/navigation";
import { isLocale } from "@/i18n/config";
import { siteUrl } from "@/config/brand";
import { supabaseAdmin } from "./auth/supabase-server";
import { alertToken } from "./alert-token";
import { emailEnabled, sendEmail } from "./email";
import { priceDropEmail } from "./emails/price-drop";
import { cheapestWithBags } from "./extras";
import { dataMode, searchFlightsCached } from "./flights";
import { inBackground, isSkipped } from "./providers/rate-limit";
import { searchHref, todayIso } from "./search";
import type { PriceAlert } from "./user-types";

/** E-posta için fiyat en az bu kadar düşmeli (son bildirilen ya da kurulduğu andaki fiyata göre). */
export const DROP_MIN_RATIO = 0.03;
export const DROP_MIN_TRY = 150;
/** Bir alarm en fazla bu sıklıkta kontrol edilir. */
const RECHECK_MS = 20 * 3600 * 1000;
const MAX_PER_RUN = 40;
const HISTORY = 14;

export type AlertRunSummary = {
  checked: number;
  dropped: number;
  emailed: number;
  skipped: number;
  failed: number;
  remaining: number;
  email: boolean;
};

/** Bildirime değer bir düşüş mü? (küçük oynamalarda e-posta gitmesin) */
export function isNotableDrop(ref: number, now: number) {
  return now <= ref * (1 - DROP_MIN_RATIO) && ref - now >= DROP_MIN_TRY;
}

export async function checkPriceAlerts({ deadlineMs = 45_000 } = {}): Promise<AlertRunSummary> {
  const sum: AlertRunSummary = { checked: 0, dropped: 0, emailed: 0, skipped: 0, failed: 0, remaining: 0, email: emailEnabled() };
  const admin = supabaseAdmin();
  if (!admin) return sum;
  const started = Date.now();
  const today = todayIso();

  const { data, error } = await admin.from("user_items").select("id, user_id, data").eq("kind", "alert").limit(2000);
  if (error) throw new Error(`Alarmlar okunamadı: ${error.message}`);
  const due = (data ?? [])
    .map((r) => ({ id: r.id as string, userId: r.user_id as string, alert: r.data as PriceAlert }))
    // Tarihi geçmemiş, son 20 saatte kontrol edilmemiş olanlar; en uzun süredir bakılmayan önce
    .filter((r) => r.alert.date > today && (!r.alert.lastCheckedAt || Date.now() - Date.parse(r.alert.lastCheckedAt) > RECHECK_MS))
    .sort((a, b) => (a.alert.lastCheckedAt ?? "").localeCompare(b.alert.lastCheckedAt ?? ""));
  const batch = due.slice(0, MAX_PER_RUN);
  sum.remaining = due.length - batch.length;

  let stop = false;
  const work = async (r: (typeof batch)[number]) => {
    if (stop || Date.now() - started > deadlineMs) {
      sum.remaining++;
      return;
    }
    const a = r.alert;
    let now: number | null;
    try {
      const offers = await inBackground(() =>
        searchFlightsCached({ from: a.from, to: a.to, date: a.date, returnDate: a.returnDate, pax: a.pax, cabin: a.cabin }),
      );
      now = cheapestWithBags(offers);
    } catch (e) {
      if (isSkipped(e)) {
        // İstek sınırı dar: kalanlar sonraki çalışmaya
        stop = true;
        sum.skipped++;
        return;
      }
      console.error("Alarm kontrol edilemedi:", r.id, e instanceof Error ? e.message : e);
      sum.failed++;
      return;
    }
    sum.checked++;
    const at = new Date().toISOString();
    const next: PriceAlert = { ...a, lastPrice: now, lastCheckedAt: at };
    if (now !== null) {
      next.history = [...(a.history ?? []), { at, price: now }].slice(-HISTORY);
      const ref = a.notifiedPrice ?? a.priceAt;
      if (ref == null) next.priceAt = now; // kurulduğunda fiyat bilinmiyordu: ilk bulunan fiyat başlangıç olur
      else if (isNotableDrop(ref, now)) {
        sum.dropped++;
        const email = a.email ?? (await admin.auth.admin.getUserById(r.userId)).data.user?.email;
        if (email && (await sendDropEmail(r.id, { ...a, email }, ref, now))) {
          sum.emailed++;
          next.notifiedPrice = now;
          next.notifiedAt = at;
          next.email = email;
        }
      }
    }
    const { error: upErr } = await admin.from("user_items").update({ data: next, updated_at: at }).eq("id", r.id);
    if (upErr) console.error("Alarm güncellenemedi:", r.id, upErr.message);
  };

  // Aynı anda üç alarm (arka plan sırası zaten sınırlı)
  const queue = [...batch];
  await Promise.all(Array.from({ length: 3 }, async () => {
    for (let r = queue.shift(); r; r = queue.shift()) await work(r);
  }));
  return sum;
}

async function sendDropEmail(id: string, a: PriceAlert & { email: string }, was: number, now: number): Promise<boolean> {
  if (!emailEnabled()) return false;
  const lang = a.lang && isLocale(a.lang) ? a.lang : "tr";
  const base = siteUrl();
  const place = (codes: string[]) => codes.map((c) => cityByCode(c, lang)).join(", ");
  const s = searchHref({ from: a.from, to: a.to, date: a.date, returnDate: a.returnDate ?? "", pax: a.pax, cabin: a.cabin });
  const searchUrl = `${base}${getPathname({ href: "/ara", locale: lang })}?${new URLSearchParams(s.query)}`;
  const alertsUrl = `${base}${getPathname({ href: "/hesap", locale: lang })}#alarmlar`;
  const token = alertToken(id);
  const stopUrl = token ? `${base}/api/alarm-kapat?id=${encodeURIComponent(id)}&t=${token}&lang=${lang}` : null;
  const mail = priceDropEmail({
    lang,
    cur: a.cur ?? "EUR",
    route: `${place(a.from)} → ${place(a.to)}`,
    date: a.date,
    returnDate: a.returnDate,
    was,
    now,
    searchUrl,
    alertsUrl,
    stopUrl,
    testMode: dataMode() !== "live",
  });
  return sendEmail({
    to: a.email,
    ...mail,
    // Gmail/Outlook'ta "abonelikten çık" düğmesi: tek tıkla bu alarm kapanır
    headers: stopUrl ? { "List-Unsubscribe": `<${stopUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : undefined,
  });
}
