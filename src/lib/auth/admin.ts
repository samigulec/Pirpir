// Yönetim sayfaları (/yonetim/*) erişim kontrolü: yalnızca ADMIN_EMAILS içindeki e-postalar.
import "server-only";
import { getCurrentUser, type CurrentUser } from "./session";

function adminAllowlist(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = adminAllowlist();
  return allowed.size > 0 && allowed.has(email.trim().toLowerCase());
}

/**
 * Yönetici oturumunu doğrular. Üretimde yalnızca doğrulanmış Supabase oturumu kabul edilir
 * (örnek çerezle yönetim sayfasına girilemez).
 */
export async function getAdminUser(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (process.env.NODE_ENV === "production" && user.mode !== "supabase") return null;
  return isAdminEmail(user.email) ? user : null;
}
