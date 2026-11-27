// Ortaklık tıklama raporu (/yonetim/tiklamalar): `clicks` tablosundan salt okunur özet.
import "server-only";
import { supabaseAdmin } from "./auth/supabase-server";

export type ClickRow = {
  id: number;
  created_at: string;
  src: string | null;
  origin: string;
  destination: string;
  depart: string;
  return_date: string | null;
  market: string | null;
  partner: string;
};

export type CountEntry = { key: string; count: number };
export type RouteCount = { origin: string; destination: string; count: number };

export type ClickReport = {
  days: 7 | 30;
  total7: number;
  total30: number;
  total: number;
  uniqueRoutes: number;
  byDay: CountEntry[];
  topRoutes: RouteCount[];
  bySource: CountEntry[];
  byPartner: CountEntry[];
  byMarket: CountEntry[];
  recent: ClickRow[];
  truncated: boolean;
};

const MAX_ROWS = 10_000;

function countSorted(values: string[], limit = 25): CountEntry[] {
  const map = new Map<string, number>();
  for (const v of values) map.set(v, (map.get(v) ?? 0) + 1);
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, limit);
}

/** 30 günlük tıklama satırlarından hem 7/30 toplamlarını hem seçilen pencerenin kırılımını hesaplar. */
export function summarizeClicks(rows30: ClickRow[], days: 7 | 30, now = new Date()): ClickReport {
  const cutoff7 = now.getTime() - 7 * 86_400_000;
  const rows7 = rows30.filter((r) => Date.parse(r.created_at) >= cutoff7);
  const active = days === 7 ? rows7 : rows30;

  const routeMap = new Map<string, RouteCount>();
  const dayMap = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    dayMap.set(d, 0);
  }

  for (const r of active) {
    const rk = `${r.origin}>${r.destination}`;
    const existing = routeMap.get(rk);
    if (existing) existing.count++;
    else routeMap.set(rk, { origin: r.origin, destination: r.destination, count: 1 });

    const day = r.created_at.slice(0, 10);
    if (dayMap.has(day)) dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
  }

  const topRoutes = [...routeMap.values()]
    .sort((a, b) => b.count - a.count || `${a.origin}${a.destination}`.localeCompare(`${b.origin}${b.destination}`))
    .slice(0, 20);

  return {
    days,
    total7: rows7.length,
    total30: rows30.length,
    total: active.length,
    uniqueRoutes: routeMap.size,
    byDay: [...dayMap.entries()].map(([key, count]) => ({ key, count })),
    topRoutes,
    bySource: countSorted(active.map((r) => r.src?.trim() || "(boş)"), 25),
    byPartner: countSorted(active.map((r) => r.partner || "unknown"), 10),
    byMarket: countSorted(active.map((r) => r.market || "—"), 16),
    recent: active.slice(0, 20),
    truncated: rows30.length >= MAX_ROWS,
  };
}

/** Supabase `clicks` tablosundan son 30 günü tek sorguda okur ve istenen pencereyi (7/30) özetler. */
export async function getClickReport(days: 7 | 30): Promise<ClickReport> {
  const now = new Date();
  const admin = supabaseAdmin();
  if (!admin) return summarizeClicks([], days, now);

  const since30 = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  const { data, error } = await admin
    .from("clicks")
    .select("id, created_at, src, origin, destination, depart, return_date, market, partner")
    .gte("created_at", since30)
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS)
    .returns<ClickRow[]>();

  if (error) {
    console.error("Tıklama raporu okunamadı:", error.message);
    return summarizeClicks([], days, now);
  }
  return summarizeClicks(data ?? [], days, now);
}
