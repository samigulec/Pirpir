// E-postadaki "Bu alarmı kapat" bağlantısı: giriş gerektirmez, alarm kimliğine bağlı imzayla doğrulanır.
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string | null {
  return process.env.ALERT_SECRET?.trim() || process.env.CRON_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
}

export function alertToken(id: string): string | null {
  const s = secret();
  return s ? createHmac("sha256", s).update(`alert-off:${id}`).digest("base64url").slice(0, 32) : null;
}

export function checkAlertToken(id: string, token: string): boolean {
  const want = alertToken(id);
  if (!want || token.length !== want.length) return false;
  return timingSafeEqual(Buffer.from(want), Buffer.from(token));
}
