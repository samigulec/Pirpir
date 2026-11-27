// Önbellekli fiyatın tazeliği (fiyatın Aviasales'te görüldüğü günden bu yana geçen gün). Tarayıcıda da çalışır.

/** Görüldüğü günden bu yana geçen takvim günü */
export function seenDays(iso: string): number {
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((today - Date.parse(iso)) / 86_400_000));
}

/** 0–1 gün taze, 2–3 gün orta, 4+ gün eski (fiyat satıcıda değişmiş olabilir) */
export const freshness = (days: number): "fresh" | "ok" | "stale" => (days <= 1 ? "fresh" : days <= 3 ? "ok" : "stale");
