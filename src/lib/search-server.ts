// Arama sorgusunun sunucu tarafı: URL'yi dünya havalimanı listesiyle çözer ve doğrular.
import "server-only";
import { expandCode, findAirport, isKnownPlace, resolvePlace } from "@/data/airports";
import { LEGACY_PAX, MAX_SEARCH_BAGS, addDays, defaultDates, int, isCabin, isFlex, one, todayIso, validateSearch, type Flex, type MultiQuery, type Raw, type SearchQuery } from "./search";

const splitPlaces = (v: string | undefined, dflt: string) =>
  (v ?? dflt)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => resolvePlace(x) ?? x.toUpperCase())
    .filter((x, i, arr) => arr.indexOf(x) === i)
    .slice(0, 3);

/** URL parametreleri → sorgu. Şehir adı ("İzmir"), kod ("ADB"), şehir grubu ("city:LON") ve virgülle birden fazlası kabul edilir. */
export function parseSearch(raw: Raw, now = new Date()): MultiQuery {
  const d = defaultDates(now);
  const date = one(raw.date) || d.date;
  const ret = one(raw.return);
  // Tarih hiç verilmemişse tasarımdaki gibi gidiş-dönüş varsay.
  const returnDate = ret ? ret : one(raw.date) ? undefined : d.returnDate;
  const legacy = LEGACY_PAX[one(raw.pax) ?? ""];
  const pax = legacy ?? {
    adults: int(one(raw.adults), 1),
    children: int(one(raw.children), 0),
    infants: int(one(raw.infants), 0),
  };
  const cabinRaw = one(raw.cabin);
  const flexRaw = Number(one(raw.flex) ?? 0);
  const clamp = (v: string | undefined, max: number) => Math.min(max, Math.max(0, int(v, 0)));
  const bags = { cabin: clamp(one(raw.cabinBags), MAX_SEARCH_BAGS.cabin), checked: clamp(one(raw.checkedBags), MAX_SEARCH_BAGS.checked) };
  const flex: Flex = isFlex(flexRaw) ? flexRaw : 0;
  return {
    from: splitPlaces(one(raw.from), "AMS"),
    to: splitPlaces(one(raw.to), "ADB"),
    date,
    returnDate,
    pax,
    cabin: isCabin(cabinRaw) ? cabinRaw : "economy",
    ...(flex ? { flex } : {}),
    ...(bags.cabin || bags.checked ? { bags } : {}),
  };
}

/** Esnek aramada seçilen gün dışında aranacak günler (yolculuk süresi aynı; geçmiş günler hariç). */
export function flexQueries(q: MultiQuery, now = new Date()): MultiQuery[] {
  if (!q.flex) return [];
  const today = todayIso(now);
  const out: MultiQuery[] = [];
  for (let k = -q.flex; k <= q.flex; k++) {
    if (k === 0) continue;
    const date = addDays(q.date, k);
    if (date < today) continue;
    out.push({ ...q, date, returnDate: q.returnDate ? addDays(q.returnDate, k) : undefined });
  }
  return out;
}

export function validateSearchServer(q: MultiQuery, now = new Date()) {
  const err = validateSearch(q, isKnownPlace, now);
  if (err) return err;
  return expandCombos(q).length ? null : "same";
}

export const MAX_COMBOS = 9;

/**
 * Her kalkış–varış ikilisi için sağlayıcı sorgusu. Şehir grupları havalimanlarına açılır,
 * aynı şehir ikilileri atlanır, en fazla MAX_COMBOS sorgu (büyük havalimanları önce).
 */
export function expandCombos(q: MultiQuery): SearchQuery[] {
  const froms = q.from.flatMap((c) => expandCode(c));
  const tos = q.to.flatMap((c) => expandCode(c));
  const pairs: { from: string; to: string; weight: number }[] = [];
  for (const f of froms)
    for (const t of tos) {
      const a = findAirport(f);
      const b = findAirport(t);
      if (!a || !b || a.code === b.code || (a.slug === b.slug && a.country === b.country)) continue;
      if (!pairs.some((p) => p.from === f && p.to === t)) pairs.push({ from: f, to: t, weight: a.size + b.size });
    }
  // Kullanıcının seçtiği sıra korunur ama çok kombinasyonda büyük havalimanları öne alınır.
  const picked = pairs.length > MAX_COMBOS ? [...pairs].sort((x, y) => y.weight - x.weight).slice(0, MAX_COMBOS) : pairs;
  return picked.map(({ from, to }) => ({ from, to, date: q.date, returnDate: q.returnDate, pax: q.pax, cabin: q.cabin }));
}
