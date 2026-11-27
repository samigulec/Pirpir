// Günlük fırsat tarayıcısı (/api/cron/deals): popüler rotalar için önümüzdeki 3 ayın Travelpayouts
// `grouped_prices` verisini çeker, rotanın 90 günlük ortanca fiyatına göre belirgin ucuz günleri
// fırsat adayı olarak Supabase `deals` tablosuna yazar.
import "server-only";
import { MARKETS } from "@/config/markets";
import { popularDestinations } from "@/data/mock/home";
import { groupedPrices, travelpayoutsToken, type GroupedPriceItem } from "./providers/travelpayouts";
import { addDays, todayIso } from "./search";
import { saveDealCandidates, type DealCandidateInput } from "./deal-store";
import {
  DEAL_MAX_PER_ROUTE,
  DEAL_MAX_RATIO,
  DEAL_MAX_SEEN_AGE_DAYS,
  DEAL_MIN_SAVE_EUR,
  MAX_LEAD_DAYS,
  MIN_LEAD_DAYS,
  itemSeenAt,
  median,
  pickDealCandidates,
} from "./deal-rules";

export {
  DEAL_MAX_PER_ROUTE,
  DEAL_MAX_RATIO,
  DEAL_MAX_SEEN_AGE_DAYS,
  DEAL_MIN_SAVE_EUR,
  itemSeenAt,
  median,
  pickDealCandidates,
};

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
