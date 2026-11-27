// Günlük fırsat tarayıcısı (/api/cron/deals): popüler rotalar için önümüzdeki 3 ayın Travelpayouts
// `grouped_prices` verisini çeker, rotanın 90 günlük ortanca fiyatına göre belirgin ucuz günleri
// fırsat adayı olarak Supabase `deals` tablosuna yazar.
import "server-only";
import { MARKETS } from "@/config/markets";
import { popularDestinations } from "@/data/mock/home";
import { groupedPrices, seenOn, travelpayoutsToken, type GroupedPriceItem } from "./providers/travelpayouts";
import { addDays, todayIso } from "./search";
import { saveDealCandidates, type DealCandidateInput } from "./deal-store";

/** Aday eşikleri (DEVAM.md): ortancanın en fazla %75'i, en az 30 € tasarruf, son 3 gün içinde görülmüş, rota başına en fazla 3 */
export const DEAL_MAX_RATIO = 0.75;
export const DEAL_MIN_SAVE_EUR = 30;
export const DEAL_MAX_SEEN_AGE_DAYS = 3;
export const DEAL_MAX_PER_ROUTE = 3;
/** Ortanca hesabının anlamlı olması için bir rotada en az bu kadar gün fiyatı olmalı */
const MIN_DAYS_FOR_MEDIAN = 6;
/** En az 3 gün sonrası, en fazla 90 gün sonrası taranır */
const MIN_LEAD_DAYS = 3;
const MAX_LEAD_DAYS = 90;
/** 60 sn Vercel cron sınırına rahat sığmak için çalışma başına rota sayısı (günlere bölünür) */
const ROUTES_PER_RUN = 24;
const CONCURRENCY = 4;

const stripCity = (c: string) => c.replace(/^city:/, "");

/** Pazarlar (`MARKETS`) ve popüler hedeflerden (`popularDestinations`) tekil tarama rotaları (IATA kodları). */
export function scanRoutePool(): [string, string][] {
  const seen = new Set<string>();
  const out: [string, string][] = [];
  const push = (f: string, t: string) => {
    const a = stripCity(f);
    const b = stripCity(t);
    if (!a || !b || a === b) return;
    const k = `${a}>${b}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push([a, b]);
  };
  // Öncelik ana pazarlar (NL, TR, DE, BE) + popüler destinasyonlar, ardından diğer pazarlar
  for (const m of MARKETS) for (const [f, t] of m.routes) push(f, t);
  for (const from of ["AMS", "IST", "FRA", "BRU"]) {
    for (const d of popularDestinations) push(from, d.searchCode);
  }
  return out;
}

/** Rotaları günlere böler: her gün `ROUTES_PER_RUN` rota taranır, tüm havuz ~5-6 günde bir tam döner. */
export function dailyRouteSlice(now = new Date(), limit = ROUTES_PER_RUN): [string, string][] {
  const pool = scanRoutePool();
  if (pool.length <= limit) return pool;
  const dayIndex = Math.floor(now.getTime() / 86_400_000);
  const offset = (dayIndex * limit) % pool.length;
  const out: [string, string][] = [];
  for (let i = 0; i < limit; i++) out.push(pool[(offset + i) % pool.length]);
  return out;
}

/** Bugünden sonraki 90 günü en çok günle kapsayan 3 ay (`YYYY-MM`, kronolojik). */
export function targetMonths(today: string): string[] {
  const counts = new Map<string, number>();
  for (let d = MIN_LEAD_DAYS; d <= MAX_LEAD_DAYS; d++) {
    const m = addDays(today, d).slice(0, 7);
    counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([m]) => m)
    .sort();
}

/** Fiyatın görüldüğü gün (`YYYY-MM-DD`): `found_at` yoksa linkteki `search_date`. */
export function itemSeenAt(item: GroupedPriceItem): string | null {
  if (item.found_at && /^\d{4}-\d{2}-\d{2}/.test(item.found_at)) return item.found_at.slice(0, 10);
  if (item.link) return seenOn(item.link) ?? null;
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

export type DealScanSummary = {
  routesScanned: number;
  routesTotal: number;
  candidatesFound: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
};

/** Günlük cron girişi: sıradaki rota dilimini 3 ay boyunca tarayıp adayları Supabase'e yazar. */
export async function scanDeals({ deadlineMs = 45_000, now = new Date() } = {}): Promise<DealScanSummary> {
  const routes = dailyRouteSlice(now);
  const sum: DealScanSummary = {
    routesScanned: 0,
    routesTotal: routes.length,
    candidatesFound: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  };
  if (!travelpayoutsToken()) return sum;

  const started = Date.now();
  const today = todayIso(now);
  const months = targetMonths(today);
  const allCandidates: DealCandidateInput[] = [];

  const queue = [...routes];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let pair = queue.shift(); pair; pair = queue.shift()) {
        if (Date.now() - started > deadlineMs) break;
        const [origin, destination] = pair;
        const settled = await Promise.allSettled(
          months.map((m) =>
            groupedPrices({
              origin,
              destination,
              departureAt: m,
              returnAt: m,
              groupBy: "departure_at",
              minTripDuration: 3,
              maxTripDuration: 10,
            }),
          ),
        );
        const ok = settled.filter((r): r is PromiseFulfilledResult<Record<string, GroupedPriceItem>> => r.status === "fulfilled");
        if (!ok.length) {
          sum.failed++;
          const reason = (settled[0] as PromiseRejectedResult | undefined)?.reason;
          console.error("Fırsat taraması rota hatası:", origin, destination, reason instanceof Error ? reason.message : reason);
          continue;
        }
        sum.routesScanned++;
        const items = ok.flatMap((r) => Object.values(r.value));
        const found = pickDealCandidates(origin, destination, items, today);
        allCandidates.push(...found);
      }
    }),
  );

  sum.candidatesFound = allCandidates.length;
  if (allCandidates.length) {
    const saved = await saveDealCandidates(allCandidates);
    sum.inserted = saved.inserted;
    sum.updated = saved.updated;
    sum.skipped = saved.skipped;
  }
  return sum;
}
