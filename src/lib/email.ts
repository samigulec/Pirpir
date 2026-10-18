// E-posta gönderimi (Resend, https://resend.com/docs/api-reference/emails/send-email).
// RESEND_API_KEY ve EMAIL_FROM tanımlı değilse e-posta gönderilmez; fiyat alarmları yine kontrol edilir ve
// hesaptaki listede görünür. Gönderen adresin alan adı (flypirpir.nl) Resend'de doğrulanmış olmalı.
import "server-only";

// Testlerde sahte bir sunucuya yönlendirilebilir.
const API = process.env.RESEND_API_URL || "https://api.resend.com";

export const emailEnabled = () => !!process.env.RESEND_API_KEY?.trim() && !!process.env.EMAIL_FROM?.trim();

export type Email = { to: string; subject: string; html: string; text: string; headers?: Record<string, string> };

/** Gönderildiyse true. Hata fırlatmaz (bir alarmın e-postası diğerlerini durdurmasın). */
export async function sendEmail(m: Email): Promise<boolean> {
  if (!emailEnabled()) return false;
  try {
    const res = await fetch(`${API}/emails`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM!.trim(), to: [m.to], subject: m.subject, html: m.html, text: m.text, headers: m.headers }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("E-posta gönderilemedi:", res.status, (await res.text().catch(() => "")).slice(0, 300));
      return false;
    }
    return true;
  } catch (e) {
    console.error("E-posta gönderilemedi:", e instanceof Error ? e.message : e);
    return false;
  }
}
