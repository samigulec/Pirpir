// Fiyatlı takvim. Sağlayıcıda "ayın fiyatları" sorgusu yok (her gün ayrı arama olurdu); bu yüzden sitede yapılan
// her aramanın kişi başı en düşük fiyatı saklanır ve takvimde yalnızca son 24 saatte görülen fiyatlar gösterilir.
// Örnek veri modunda fiyatlar doğrudan örnek sağlayıcıdan hesaplanır.
import "server-only";
import { supabaseAdmin } from "./auth/supabase-server";
import { dataMode, searchFlights } from "./flights";
import { addDays, type MultiQuery } from "./search";
import type { Offer } from "./providers/types";

/** Takvimde gösterilecek en eski fiyat */
const MAX_AGE_MS = 24 * 3600 * 1000;

export type CalendarRoute = { from: string[]; to: string[]; cabin: string };

export const routeKey = (r: Pick<CalendarRoute, "from" | "to">) => `${[...r.from].sort().join(",")}>${[...r.to].sort().join(",")}`;
const nightsOf = (q: { date: string; returnDate?: string }) =>
  q.returnDate ? Math.round((Date.parse(q.returnDate) - Date.parse(q.date)) / 86400000) : -1;

/** Arama sonucunun en düşük fiyatını kaydeder. Yalnızca yetişkinli aramalar (çocuk/bebek fiyatı kişi başını değiştirir). */
export async function recordPrice(q: MultiQuery, offers: Offer[]): Promise<void> {
  const mode = dataMode();
  if (mode === "demo" || !offers.length || q.pax.children || q.pax.infants) return;
  const admin = supabaseAdmin();
  if (!admin) return;
  const row = {
    route: routeKey({ from: q.from, to: q.to }),
    cabin: q.cabin ?? "economy",
    mode,
    depart: q.date,
    nights: nightsOf(q),
    price_try: Math.min(...offers.map((o) => o.price)),
    seen_at: new Date().toISOString(),
  };
  try {
    let { error } = await admin.from("price_calendar").upsert({ ...row, details: detailsOf(offers) });
    // 0003 göçü çalıştırılmadıysa "details" sütunu yoktur: fiyat yine de kaydedilsin
    if (error && /details/.test(error.message)) ({ error } = await admin.from("price_calendar").upsert(row));
    if (error) console.error("Takvim fiyatı kaydedilemedi:", error.message);
  } catch (e) {
    console.error("Takvim fiyatı kaydedilemedi:", e instanceof Error ? e.message : e);
  }
}

/** Kartlarda gösterilen özet: en ucuz teklifin gidiş bacağı, bulunan havayolları ve varış havalimanları. */
export type PriceDetails = { stops: number; mins: number; airlines: string[]; airports: string[] };

function detailsOf(offers: Offer[]): PriceDetails {
  const sorted = [...offers].sort((a, b) => a.price - b.price);
  const distinct = (list: string[]) => [...new Set(list)].slice(0, 3);
  return {
    stops: sorted[0].outbound.stops,
    mins: sorted[0].outbound.mins,
    airlines: distinct(sorted.flatMap((o) => o.airline.split(" + "))),
    airports: distinct(sorted.map((o) => o.outbound.toCode)),
  };
}

export type KnownPrice = { depart: string; nights: number; price: number; seenAt: string; details?: PriceDetails };

/**
 * Rotaların son `maxAgeH` saatte görülen en ucuz gidiş-dönüş fiyatı (yalnızca yetişkinli aramalardan, ekonomi).
 * Tablo yoksa ya da Supabase bağlı değilse boş döner.
 */
export async function bestKnownPrices(routes: Pick<CalendarRoute, "from" | "to">[], maxAgeH = 6): Promise<Record<string, KnownPrice>> {
  const mode = dataMode();
  const admin = mode === "demo" ? null : supabaseAdmin();
  if (!admin || !routes.length) return {};
  const keys = [...new Set(routes.map(routeKey))];
  const since = new Date(Date.now() - maxAgeH * 3600 * 1000).toISOString();
  // En az iki gün sonrası: yarının uçuşu "fırsat" diye gösterilmez
  const fromDay = addDays(new Date().toISOString().slice(0, 10), 2);
  const query = (cols: string) =>
    admin
      .from("price_calendar")
      .select(cols)
      .in("route", keys)
      .eq("cabin", "economy")
      .eq("mode", mode)
      .gte("nights", 0)
      .gte("depart", fromDay)
      .gte("seen_at", since)
      .order("price_try", { ascending: true })
      .limit(500)
      .returns<{ route: string; depart: string; nights: number; price_try: number; seen_at: string; details?: PriceDetails | null }[]>();
  let { data, error } = await query("route, depart, nights, price_try, seen_at, details");
  // 0003 göçü yoksa özetsiz okunur
  if (error && /details/.test(error.message)) ({ data, error } = await query("route, depart, nights, price_try, seen_at"));
  if (error) {
    console.error("Bilinen fiyatlar okunamadı:", error.message);
    return {};
  }
  const out: Record<string, KnownPrice> = {};
  for (const r of data ?? []) {
    if (out[r.route]) continue; // fiyata göre sıralı: ilk görülen en ucuzu
    out[r.route] = { depart: r.depart, nights: r.nights, price: r.price_try, seenAt: r.seen_at, details: r.details ?? undefined };
  }
  return out;
}

export type CalendarPrices = {
  /** Gidiş günü → fiyat (gidiş-dönüşte `nights` gecelik yolculuk, tek yönde tek yön) */
  departs: Record<string, number>;
  /** `depart` sabitken dönüş günü → fiyat */
  returns: Record<string, number>;
};

/** `first` gününden başlayan `days` gün için bilinen fiyatlar. */
export async function getCalendarPrices(
  r: CalendarRoute,
  first: string,
  days: number,
  nights: number,
  depart?: string,
): Promise<CalendarPrices> {
  const mode = dataMode();
  if (mode === "demo") return demoPrices(r, first, days, nights, depart);
  const admin = supabaseAdmin();
  const out: CalendarPrices = { departs: {}, returns: {} };
  if (!admin) return out;
  const since = new Date(Date.now() - MAX_AGE_MS).toISOString();
  const base = () =>
    admin.from("price_calendar").select("depart, nights, price_try").eq("route", routeKey(r)).eq("cabin", r.cabin).eq("mode", mode).gte("seen_at", since);
  const [a, b] = await Promise.all([
    base().eq("nights", nights).gte("depart", first).lte("depart", addDays(first, days - 1)),
    depart && nights >= 0 ? base().eq("depart", depart).gte("nights", 0) : Promise.resolve({ data: [], error: null }),
  ]);
  if (a.error || b.error) {
    console.error("Takvim fiyatları okunamadı:", (a.error ?? b.error)?.message);
    return out;
  }
  for (const row of a.data ?? []) out.departs[row.depart] = row.price_try;
  for (const row of b.data ?? []) out.returns[addDays(row.depart, row.nights)] = row.price_try;
  return out;
}

async function demoPrices(r: CalendarRoute, first: string, days: number, nights: number, depart?: string): Promise<CalendarPrices> {
  const pax = { adults: 1, children: 0, infants: 0 };
  const cabin = r.cabin as MultiQuery["cabin"];
  const min = async (q: MultiQuery) => {
    const offers = await searchFlights(q).catch(() => []);
    return offers.length ? Math.min(...offers.map((o) => o.price)) : null;
  };
  const dates = Array.from({ length: days }, (_, i) => addDays(first, i));
  const departs = await Promise.all(
    dates.map((d) => min({ from: r.from, to: r.to, date: d, returnDate: nights >= 0 ? addDays(d, nights) : undefined, pax, cabin })),
  );
  const returns =
    depart && nights >= 0
      ? await Promise.all(dates.map((d) => (d > depart ? min({ from: r.from, to: r.to, date: depart, returnDate: d, pax, cabin }) : null)))
      : [];
  const pick = (list: (number | null)[]) => Object.fromEntries(dates.flatMap((d, i) => (list[i] == null ? [] : [[d, list[i]!]])));
  return { departs: pick(departs), returns: pick(returns) };
}
