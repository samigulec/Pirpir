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
  // Canlı arama bileşeni (White Label) adresi kendi biçimine çevirebilir (?flightSearch=AMS2712ADB1):
  // sayfa yenilenir ya da bağlantı paylaşılırsa arama bu koddan okunur
  if (!one(raw.from) && one(raw.flightSearch)) raw = { ...raw, ...fromAviasalesRoute(one(raw.flightSearch)!, now) };
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

/**
 * Aviasales/White Label arama kodu → URL parametreleri. Biçim: AMS2712ADB[0301][c|w|f]<yetişkin>[çocuk][bebek].
 * Yıl verilmez: tarih bugünden önceyse gelecek yıl sayılır. Tanınmayan kodda boş döner (varsayılanlar kullanılır).
 */
export function fromAviasalesRoute(code: string, now = new Date()): Raw {
  const m = /^([A-Z]{3})(\d{2})(\d{2})([A-Z]{3})(?:(\d{2})(\d{2}))?([cwf])?(\d)(\d)?(\d)?$/.exec(code.trim());
  if (!m) return {};
  const today = todayIso(now);
  const iso = (dd: string, mm: string) => {
    const y = Number(today.slice(0, 4));
    const d = `${y}-${mm}-${dd}`;
    return d < today ? `${y + 1}-${mm}-${dd}` : d;
  };
  const place = (c: string) => (findAirport(c) ? c : `city:${c}`);
  const date = iso(m[2], m[3]);
  let ret = m[5] && m[6] ? iso(m[5], m[6]) : undefined;
  if (ret && ret < date) ret = `${Number(ret.slice(0, 4)) + 1}${ret.slice(4)}`;
  const cabin = { c: "business", w: "premium_economy", f: "first" }[m[7] ?? ""] ?? "economy";
  return {
    from: place(m[1]),
    to: place(m[4]),
    date,
    ...(ret && { return: ret }),
    adults: m[8],
    children: m[9] ?? "0",
    infants: m[10] ?? "0",
    cabin,
  };
}
