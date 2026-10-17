// Dünya havalimanı listesi (sunucu tarafı). Kaynak: OurAirports (kamu malı), `npm run airports` ile üretilir.
// Çekirdek listedeki şehirlerin Türkçe adları ve rota sayfası adresleri ./airports-core.ts'ten gelir.
import "server-only";
import world from "./world-airports.json";
import {
  CITY_PREFIX,
  METROS,
  cityName,
  coreAirports,
  countryName,
  isCityCode,
  metroOf,
  type Airport,
  type PlaceSuggestion,
} from "./airports-core";

export * from "./airports-core";

type Row = [string, string, string, string, number, number, 1 | 2 | 3];

const slugify = (s: string) =>
  s
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const core = new Map(coreAirports.map((a) => [a.code, a]));

// Öneri sıralaması için yolcu trafiği yüksek merkezler (yaklaşık, kabaca büyükten küçüğe).
// Yalnızca listeleme sırasını etkiler; kullanıcıya gösterilmez.
const POPULAR = (
  "IST AMS LHR CDG FRA DXB AYT SAW MAD BCN FCO MUC ESB ADB JFK ATL LAX ORD DFW DEN HND NRT ICN SIN BKK HKG PEK PVG CAN DEL BOM DOH AUH " +
  "LGW STN MAN DUB ZRH VIE BRU CPH ARN OSL HEL LIS ATH WAW PRG BUD OTP SOF BEG ZAG DUS HAM BER STR CGN EIN RTM GVA MXP LIN VCE NAP " +
  "PMI AGP ALC TFS LPA NCE ORY BJV DLM TZX GZT ASR TLV CAI JED RUH KWI BAH MCT AMM BEY TBS GYD EVN ALA NQZ TAS SVO DME LED " +
  "YYZ YVR YUL EWR LGA BOS MIA MCO SFO SEA LAS PHX IAH MSP DTW PHL IAD DCA CLT SAN MEX CUN GRU GIG EZE SCL LIM BOG PTY " +
  "SYD MEL BNE AKL KUL CGK DPS MNL SGN HAN TPE KIX CTU SZX JNB CPT ADD NBO LOS CMN TUN ALG KHI ISB LHE DAC CMB MLE KTM"
).split(" ");
const popularRank = new Map(POPULAR.map((c, i) => [c, i]));
const rankOf = (code: string) => popularRank.get(code) ?? (core.has(code) ? 150 : 1000);

// Şehir grubundaki havalimanları aynı şehir adını taşısın (ör. LCY → Londra).
const metroByAirport = new Map<string, (typeof METROS)[string]>();
for (const m of Object.values(METROS)) for (const c of m.airports) metroByAirport.set(c, m);

export const airports: Airport[] = (world as Row[]).map(([code, name, city, country, lat, lon, size]) => {
  const c = core.get(code);
  if (c) return { ...c, name: c.name || name, size: Math.max(c.size, size) as Airport["size"] };
  const m = metroByAirport.get(code);
  // "Segrate (MI)", "Guangzhou (Huadu)" → parantez içi il/ilçe bilgisi şehir adından atılır.
  const cityName_ = m ? m.city : city.replace(/\s*\(.*\)\s*$/, "") || city;
  return { code, name, city: cityName_, i18n: m?.i18n, country, lat, lon, size, slug: slugify(m?.i18n?.en ?? cityName_) };
});
// Dünya listesinde olmayan çekirdek kayıtlar (olmamalı ama güvenli tarafta kalalım)
for (const c of coreAirports) if (!airports.some((a) => a.code === c.code)) airports.push(c);

const byCode = new Map(airports.map((a) => [a.code, a]));

export function findAirport(code: string): Airport | undefined {
  return byCode.get(code.toUpperCase());
}

/** Kod (havalimanı ya da city:XXX) → yerel şehir adı. */
export function cityByCode(code: string, lang: string = "tr", fallback?: string): string {
  const m = metroOf(code);
  if (m) return cityName(m, lang);
  const a = findAirport(code);
  return a ? cityName(a, lang) : (fallback ?? code);
}

/** Şehir grubunu (city:LON) havalimanlarına açar; en büyük `limit` tanesi. */
export function expandCode(code: string, limit = 3): string[] {
  const m = metroOf(code);
  if (!m) return [code.toUpperCase()];
  return m.airports
    .map((c) => findAirport(c))
    .filter((a): a is Airport => !!a)
    .sort((a, b) => b.size - a.size)
    .slice(0, limit)
    .map((a) => a.code);
}

export const isKnownPlace = (code: string) => (isCityCode(code) ? !!metroOf(code) : byCode.has(code.toUpperCase()));

const norm = (s: string) =>
  s
    .toLocaleLowerCase("tr-TR")
    .replace(/[ıi̇]/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

const namesOf = (a: Pick<Airport, "city" | "aliases" | "i18n">) => [a.city, ...(a.aliases ?? []), ...Object.values(a.i18n ?? {})];

// Arama için önceden normalize edilmiş dizin
const index = airports.map((a) => ({
  a,
  names: namesOf(a).map(norm),
  words: norm(a.name).split(/[\s\-/]+/),
}));


/** Yazılan metne uyan yerler: önce kod, sonra şehir, havalimanı adı, ülke. Büyük havalimanları öne. */
export function suggestPlaces(query: string, lang: string = "tr", limit = 8): PlaceSuggestion[] {
  const q = norm(query);
  if (!q) return [];
  const scored: { a: Airport; s: number; rank: number }[] = [];
  for (const it of index) {
    let s = 99;
    if (it.a.code.toLowerCase() === q) s = 0;
    else if (it.names.some((n) => n === q)) s = 1;
    else if (it.names.some((n) => n.startsWith(q))) s = 2;
    else if (q.length >= 2 && it.words.some((w) => w.startsWith(q))) s = 3;
    else if (q.length >= 3 && norm(countryName(it.a.country, lang)).startsWith(q)) s = 4;
    else if (q.length >= 3 && norm(countryName(it.a.country, "en")).startsWith(q)) s = 4;
    if (s < 99) scored.push({ a: it.a, s, rank: rankOf(it.a.code) });
  }
  scored.sort((x, y) => x.s - y.s || x.rank - y.rank || y.a.size - x.a.size || x.a.city.localeCompare(y.a.city));

  const out: PlaceSuggestion[] = [];
  const seenMetro = new Set<string>();
  for (const { a } of scored) {
    if (out.length >= limit) break;
    // Şehrin birden fazla havalimanı varsa önce "Tüm havalimanları" seçeneği
    const metroKey = Object.keys(METROS).find((k) => METROS[k].airports.includes(a.code));
    // Grup yalnızca şehir adı yazılana uyuyorsa (ör. "s" → Bergamo'nun ilçesi Milano grubunu getirmesin)
    if (metroKey && !seenMetro.has(metroKey) && namesOf(METROS[metroKey]).some((n) => norm(n).startsWith(q))) {
      seenMetro.add(metroKey);
      const m = METROS[metroKey];
      const codes = m.airports.filter((c) => byCode.has(c));
      if (codes.length > 1) {
        out.push({ code: CITY_PREFIX + metroKey, kind: "city", city: cityName(m, lang), detail: codes.join(", "), country: countryName(a.country, lang) });
        if (out.length >= limit) break;
      }
    }
    out.push({ code: a.code, kind: "airport", city: cityName(a, lang), detail: a.name, country: countryName(a.country, lang) });
  }
  return out;
}

/** "İzmir", "ADB", "london" → en iyi eşleşen yer kodu. Birden çok havalimanlı şehirde şehir grubu. */
export function resolvePlace(input: string): string | undefined {
  const v = input.trim();
  if (!v) return undefined;
  if (isCityCode(v)) return metroOf(v) ? v : undefined;
  if (/^[a-z]{3}$/i.test(v) && byCode.has(v.toUpperCase())) return v.toUpperCase();
  const q = norm(v);
  const metro = Object.entries(METROS).find(([, m]) => namesOf(m).some((n) => norm(n) === q));
  if (metro) return CITY_PREFIX + metro[0];
  const exact = index.filter((it) => it.names.includes(q)).sort((x, y) => y.a.size - x.a.size)[0];
  return exact?.a.code;
}

/** Eski adlar: yalnızca havalimanı kodu döner (şehir grubu yerine en büyük havalimanı). */
export function resolveAirport(input: string): Airport | undefined {
  const p = resolvePlace(input);
  return p ? findAirport(expandCode(p, 1)[0]) : undefined;
}

export function distanceKm(a: Airport, b: Airport): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(b.lat - a.lat);
  const dLon = r(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
