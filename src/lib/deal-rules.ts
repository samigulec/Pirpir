// Fırsat tarayıcısının saf aday seçim kuralları (sunucu bağımsız; birim testleriyle doğrudan test edilebilir).
// Kurallar (DEVAM.md): 90 günlük ortancanın ≤ %75'i, ≥ 30 € tasarruf, son 3 gün içinde görülmüş, rota başına en fazla 3.
import type { DealCandidateInput } from "./deal-store";
import type { GroupedPriceItem } from "./providers/travelpayouts";
import { addDays } from "./search";

export const DEAL_MAX_RATIO = 0.75;
export const DEAL_MIN_SAVE_EUR = 30;
export const DEAL_MAX_SEEN_AGE_DAYS = 3;
export const DEAL_MAX_PER_ROUTE = 3;
/** Ortanca hesabının anlamlı olması için bir rotada en az bu kadar gün fiyatı olmalı */
const MIN_DAYS_FOR_MEDIAN = 6;
/** En az 3 gün sonrası, en fazla 90 gün sonrası taranır */
export const MIN_LEAD_DAYS = 3;
export const MAX_LEAD_DAYS = 90;

function seenOnLink(link: string): string | undefined {
  const m = link.match(/[?&]search_date=(\d{2})(\d{2})(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : undefined;
}

/** Fiyatın görüldüğü gün (`YYYY-MM-DD`): `found_at` yoksa linkteki `search_date`. */
export function itemSeenAt(item: Pick<GroupedPriceItem, "found_at" | "link">): string | null {
  if (item.found_at && /^\d{4}-\d{2}-\d{2}/.test(item.found_at)) return item.found_at.slice(0, 10);
  if (item.link) return seenOnLink(item.link) ?? null;
  return null;
}

export function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Bir rotanın 90 günlük `grouped_prices` kayıtlarından fırsat adaylarını seçer (saf fonksiyon, test edilebilir).
 * Kriter: fiyat <= ortanca * 0.75 VE (ortanca - fiyat) >= 30 € VE son 3 gün içinde görülmüş; en fazla 3 aday.
 */
export function pickDealCandidates(
  origin: string,
  destination: string,
  items: GroupedPriceItem[],
  today: string,
): DealCandidateInput[] {
  const minDate = addDays(today, MIN_LEAD_DAYS);
  const maxDate = addDays(today, MAX_LEAD_DAYS);
  const minSeen = addDays(today, -DEAL_MAX_SEEN_AGE_DAYS);

  // Her gidiş günü için en ucuz kaydı al
  const byDay = new Map<string, GroupedPriceItem>();
  for (const item of items) {
    if (!item || typeof item.price !== "number" || item.price <= 0 || !item.departure_at) continue;
    const dep = item.departure_at.slice(0, 10);
    if (dep < minDate || dep > maxDate) continue;
    const prev = byDay.get(dep);
    if (!prev || item.price < prev.price) byDay.set(dep, item);
  }
  const unique = [...byDay.values()];
  if (unique.length < MIN_DAYS_FOR_MEDIAN) return [];

  const med = Math.round(median(unique.map((x) => x.price)) * 100) / 100;

  const picked = unique
    .map((item) => {
      const seenAt = itemSeenAt(item);
      const dep = item.departure_at.slice(0, 10);
      const ret = item.return_at && /^\d{4}-\d{2}-\d{2}/.test(item.return_at) ? item.return_at.slice(0, 10) : null;
      const safeLink = item.link && item.link.startsWith("/search/") ? item.link.slice(0, 1500) : null;
      return {
        origin,
        destination,
        depart: dep,
        return_date: ret && ret >= dep ? ret : null,
        price_eur: Math.round(item.price * 100) / 100,
        median_eur: med,
        airline: item.airline ? item.airline.slice(0, 10) : null,
        transfers: typeof item.transfers === "number" ? item.transfers : null,
        seen_at: seenAt,
        link: safeLink,
      };
    })
    .filter(
      (c) =>
        c.price_eur <= med * DEAL_MAX_RATIO &&
        med - c.price_eur >= DEAL_MIN_SAVE_EUR &&
        c.seen_at !== null &&
        c.seen_at >= minSeen,
    )
    .sort((a, b) => a.price_eur - b.price_eur || (a.transfers ?? 9) - (b.transfers ?? 9) || a.depart.localeCompare(b.depart));

  return picked.slice(0, DEAL_MAX_PER_ROUTE);
}
