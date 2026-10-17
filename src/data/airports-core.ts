// Çekirdek havalimanı listesi: öne çıkan şehirler, Türkçe/İngilizce/Hollandaca adları ve rota sayfası adresleri.
// Tarayıcıya gönderilebilecek kadar küçüktür. Dünyadaki tüm havalimanları sunucuda: ./airports.ts

export type Lang = "tr" | "en" | "nl";

export type Airport = {
  code: string;
  /** Türkçe şehir adı (çekirdek listede) ya da İngilizce şehir adı (dünya listesinde). */
  city: string;
  name: string;
  /** ISO 3166-1 alpha-2 ülke kodu */
  country: string;
  /** Rota sayfası adresinde kullanılan şehir adı (ör. "istanbul"). */
  slug: string;
  lat: number;
  lon: number;
  /** 3: büyük, 2: orta, 1: küçük havalimanı */
  size: 1 | 2 | 3;
  aliases?: string[];
  /** Türkçeden farklıysa İngilizce / Hollandaca şehir adı. */
  i18n?: { en?: string; nl?: string };
};

export const coreAirports: Airport[] = [
  { code: "AMS", city: "Amsterdam", name: "Schiphol", country: "NL", slug: "amsterdam", lat: 52.31, lon: 4.76, size: 3 },
  { code: "EIN", city: "Eindhoven", name: "Eindhoven", country: "NL", slug: "eindhoven", lat: 51.45, lon: 5.37, size: 2 },
  { code: "RTM", city: "Rotterdam", name: "Rotterdam The Hague", country: "NL", slug: "rotterdam", lat: 51.96, lon: 4.44, size: 2, aliases: ["Lahey", "Den Haag"] },
  { code: "GRQ", city: "Groningen", name: "Groningen Eelde", country: "NL", slug: "groningen", lat: 53.12, lon: 6.58, size: 1 },
  { code: "MST", city: "Maastricht", name: "Maastricht Aachen", country: "NL", slug: "maastricht", lat: 50.92, lon: 5.78, size: 1 },
  { code: "BRU", city: "Brüksel", name: "Brussels Airport", country: "BE", slug: "bruksel", lat: 50.9, lon: 4.48, size: 3, aliases: ["Brussels"], i18n: { en: "Brussels", nl: "Brussel" } },
  { code: "CRL", city: "Charleroi", name: "Brussels South Charleroi", country: "BE", slug: "charleroi", lat: 50.46, lon: 4.45, size: 2 },
  { code: "DUS", city: "Düsseldorf", name: "Düsseldorf", country: "DE", slug: "dusseldorf", lat: 51.29, lon: 6.77, size: 2 },
  { code: "CGN", city: "Köln", name: "Köln/Bonn", country: "DE", slug: "koln", lat: 50.87, lon: 7.14, size: 2, aliases: ["Cologne", "Bonn"], i18n: { en: "Cologne", nl: "Keulen" } },
  { code: "FRA", city: "Frankfurt", name: "Frankfurt am Main", country: "DE", slug: "frankfurt", lat: 50.04, lon: 8.56, size: 3 },
  { code: "MUC", city: "Münih", name: "Franz Josef Strauss", country: "DE", slug: "munih", lat: 48.35, lon: 11.79, size: 3, aliases: ["München", "Munich"], i18n: { en: "Munich", nl: "München" } },
  { code: "BER", city: "Berlin", name: "Berlin Brandenburg", country: "DE", slug: "berlin", lat: 52.37, lon: 13.5, size: 2 },
  { code: "IST", city: "İstanbul", name: "İstanbul Havalimanı", country: "TR", slug: "istanbul", lat: 41.26, lon: 28.74, size: 3, i18n: { en: "Istanbul", nl: "Istanbul" } },
  { code: "SAW", city: "İstanbul", name: "Sabiha Gökçen", country: "TR", slug: "istanbul", lat: 40.9, lon: 29.31, size: 3, i18n: { en: "Istanbul", nl: "Istanbul" } },
  { code: "ADB", city: "İzmir", name: "Adnan Menderes", country: "TR", slug: "izmir", lat: 38.29, lon: 27.16, size: 2, i18n: { en: "Izmir", nl: "Izmir" } },
  { code: "AYT", city: "Antalya", name: "Antalya", country: "TR", slug: "antalya", lat: 36.9, lon: 30.8, size: 2 },
  { code: "ESB", city: "Ankara", name: "Esenboğa", country: "TR", slug: "ankara", lat: 40.13, lon: 32.99, size: 2 },
  { code: "DLM", city: "Dalaman", name: "Dalaman", country: "TR", slug: "dalaman", lat: 36.71, lon: 28.79, size: 2, aliases: ["Fethiye", "Marmaris"] },
  { code: "BJV", city: "Bodrum", name: "Milas-Bodrum", country: "TR", slug: "bodrum", lat: 37.25, lon: 27.66, size: 2 },
  { code: "ASR", city: "Kayseri", name: "Erkilet", country: "TR", slug: "kayseri", lat: 38.77, lon: 35.5, size: 1, aliases: ["Kapadokya"] },
  { code: "GZT", city: "Gaziantep", name: "Gaziantep", country: "TR", slug: "gaziantep", lat: 36.95, lon: 37.48, size: 1 },
  { code: "TZX", city: "Trabzon", name: "Trabzon", country: "TR", slug: "trabzon", lat: 40.99, lon: 39.79, size: 1 },
  { code: "ADA", city: "Adana", name: "Şakirpaşa", country: "TR", slug: "adana", lat: 36.98, lon: 35.28, size: 1 },
  { code: "KYA", city: "Konya", name: "Konya", country: "TR", slug: "konya", lat: 37.98, lon: 32.56, size: 1 },
  { code: "SZF", city: "Samsun", name: "Çarşamba", country: "TR", slug: "samsun", lat: 41.25, lon: 36.57, size: 1 },
  { code: "DIY", city: "Diyarbakır", name: "Diyarbakır", country: "TR", slug: "diyarbakir", lat: 37.89, lon: 40.2, size: 1, i18n: { en: "Diyarbakir", nl: "Diyarbakir" } },
  { code: "EZS", city: "Elazığ", name: "Elazığ", country: "TR", slug: "elazig", lat: 38.61, lon: 39.29, size: 1, i18n: { en: "Elazig", nl: "Elazig" } },
  { code: "MLX", city: "Malatya", name: "Malatya", country: "TR", slug: "malatya", lat: 38.44, lon: 38.09, size: 1 },
  { code: "ERZ", city: "Erzurum", name: "Erzurum", country: "TR", slug: "erzurum", lat: 39.96, lon: 41.17, size: 1 },
  { code: "VAN", city: "Van", name: "Ferit Melen", country: "TR", slug: "van", lat: 38.47, lon: 43.33, size: 1 },
  { code: "HTY", city: "Hatay", name: "Hatay", country: "TR", slug: "hatay", lat: 36.36, lon: 36.28, size: 1, aliases: ["Antakya"] },
  { code: "DNZ", city: "Denizli", name: "Çardak", country: "TR", slug: "denizli", lat: 37.79, lon: 29.7, size: 1 },
  { code: "LHR", city: "Londra", name: "Heathrow", country: "GB", slug: "londra", lat: 51.47, lon: -0.45, size: 3, aliases: ["London"], i18n: { en: "London", nl: "Londen" } },
  { code: "LGW", city: "Londra", name: "Gatwick", country: "GB", slug: "londra", lat: 51.15, lon: -0.18, size: 2, aliases: ["London"], i18n: { en: "London", nl: "Londen" } },
  { code: "CDG", city: "Paris", name: "Charles de Gaulle", country: "FR", slug: "paris", lat: 49.01, lon: 2.55, size: 3 },
  { code: "ORY", city: "Paris", name: "Orly", country: "FR", slug: "paris", lat: 48.73, lon: 2.36, size: 2 },
  { code: "FCO", city: "Roma", name: "Fiumicino", country: "IT", slug: "roma", lat: 41.8, lon: 12.25, size: 3, aliases: ["Rome"], i18n: { en: "Rome", nl: "Rome" } },
  { code: "MXP", city: "Milano", name: "Malpensa", country: "IT", slug: "milano", lat: 45.63, lon: 8.72, size: 2, aliases: ["Milan"], i18n: { en: "Milan", nl: "Milaan" } },
  { code: "BCN", city: "Barselona", name: "El Prat", country: "ES", slug: "barselona", lat: 41.3, lon: 2.08, size: 3, aliases: ["Barcelona"], i18n: { en: "Barcelona", nl: "Barcelona" } },
  { code: "MAD", city: "Madrid", name: "Barajas", country: "ES", slug: "madrid", lat: 40.47, lon: -3.56, size: 3 },
  { code: "LIS", city: "Lizbon", name: "Humberto Delgado", country: "PT", slug: "lizbon", lat: 38.77, lon: -9.13, size: 2, aliases: ["Lisbon", "Lisboa"], i18n: { en: "Lisbon", nl: "Lissabon" } },
  { code: "DXB", city: "Dubai", name: "Dubai International", country: "AE", slug: "dubai", lat: 25.25, lon: 55.36, size: 3 },
  { code: "NAV", city: "Kapadokya", name: "Nevşehir Kapadokya", country: "TR", slug: "kapadokya", lat: 38.77, lon: 34.53, size: 2, aliases: ["Nevşehir", "Cappadocia"], i18n: { en: "Cappadocia", nl: "Cappadocië" } },
  { code: "JFK", city: "New York", name: "John F. Kennedy", country: "US", slug: "new-york", lat: 40.64, lon: -73.78, size: 3 },
  { code: "EWR", city: "New York", name: "Newark Liberty", country: "US", slug: "new-york", lat: 40.69, lon: -74.17, size: 3 },
  { code: "ATH", city: "Atina", name: "Eleftherios Venizelos", country: "GR", slug: "atina", lat: 37.94, lon: 23.94, size: 2, aliases: ["Athens"], i18n: { en: "Athens", nl: "Athene" } },
  { code: "VIE", city: "Viyana", name: "Schwechat", country: "AT", slug: "viyana", lat: 48.11, lon: 16.57, size: 3, aliases: ["Vienna", "Wien"], i18n: { en: "Vienna", nl: "Wenen" } },
  { code: "PRG", city: "Prag", name: "Václav Havel", country: "CZ", slug: "prag", lat: 50.1, lon: 14.26, size: 2, aliases: ["Prague"], i18n: { en: "Prague", nl: "Praag" } },
  { code: "CPH", city: "Kopenhag", name: "Kastrup", country: "DK", slug: "kopenhag", lat: 55.62, lon: 12.65, size: 2, aliases: ["Copenhagen"], i18n: { en: "Copenhagen", nl: "Kopenhagen" } },
  { code: "ZRH", city: "Zürih", name: "Zürih", country: "CH", slug: "zurih", lat: 47.46, lon: 8.55, size: 3, aliases: ["Zurich"], i18n: { en: "Zurich", nl: "Zürich" } },
];

/** Birden çok havalimanı olan şehirler: "Tüm havalimanları" seçeneği. Anahtarlar havalimanı kodlarıyla çakışmasın diye "city:" önekiyle kullanılır. */
export const METROS: Record<string, { airports: string[]; city: string; i18n?: { en?: string; nl?: string } }> = {
  IST: { airports: ["IST", "SAW"], city: "İstanbul", i18n: { en: "Istanbul", nl: "Istanbul" } },
  LON: { airports: ["LHR", "LGW", "STN", "LTN", "LCY", "SEN"], city: "Londra", i18n: { en: "London", nl: "Londen" } },
  PAR: { airports: ["CDG", "ORY", "BVA"], city: "Paris" },
  ROM: { airports: ["FCO", "CIA"], city: "Roma", i18n: { en: "Rome", nl: "Rome" } },
  MIL: { airports: ["MXP", "LIN", "BGY"], city: "Milano", i18n: { en: "Milan", nl: "Milaan" } },
  BRU: { airports: ["BRU", "CRL"], city: "Brüksel", i18n: { en: "Brussels", nl: "Brussel" } },
  STO: { airports: ["ARN", "BMA", "NYO"], city: "Stockholm" },
  MOW: { airports: ["SVO", "DME", "VKO"], city: "Moskova", i18n: { en: "Moscow", nl: "Moskou" } },
  NYC: { airports: ["JFK", "EWR", "LGA"], city: "New York" },
  CHI: { airports: ["ORD", "MDW"], city: "Chicago" },
  WAS: { airports: ["IAD", "DCA", "BWI"], city: "Washington" },
  TYO: { airports: ["HND", "NRT"], city: "Tokyo" },
  OSA: { airports: ["KIX", "ITM"], city: "Osaka" },
  SEL: { airports: ["ICN", "GMP"], city: "Seul", i18n: { en: "Seoul", nl: "Seoel" } },
  BJS: { airports: ["PEK", "PKX"], city: "Pekin", i18n: { en: "Beijing", nl: "Peking" } },
  SHA: { airports: ["PVG", "SHA"], city: "Şanghay", i18n: { en: "Shanghai", nl: "Shanghai" } },
  BKK: { airports: ["BKK", "DMK"], city: "Bangkok" },
  DXB: { airports: ["DXB", "DWC"], city: "Dubai" },
  SAO: { airports: ["GRU", "CGH", "VCP"], city: "São Paulo" },
  RIO: { airports: ["GIG", "SDU"], city: "Rio de Janeiro" },
  BUE: { airports: ["EZE", "AEP"], city: "Buenos Aires" },
};

export const CITY_PREFIX = "city:";
export const isCityCode = (code: string) => code.startsWith(CITY_PREFIX);
export const metroOf = (code: string) => (isCityCode(code) ? METROS[code.slice(CITY_PREFIX.length)] : undefined);

/** "city:IST" → ["IST", "SAW"]; havalimanı kodu olduğu gibi. */
export const expandMetro = (code: string) => metroOf(code)?.airports ?? [code.toUpperCase()];

const coreByCode = new Map(coreAirports.map((a) => [a.code, a]));
export const findCoreAirport = (code: string) => coreByCode.get(code.toUpperCase());

export function cityName(a: Pick<Airport, "city" | "i18n">, lang: string = "tr"): string {
  return (lang !== "tr" && a.i18n?.[lang as Exclude<Lang, "tr">]) || a.city;
}

const regionNames = new Map<string, Intl.DisplayNames>();
/** ISO ülke kodu → ülke adı, sayfa dilinde (Türkiye / Turkey / Turkije). */
export function countryName(iso: string, lang: string = "tr"): string {
  if (!iso) return "";
  try {
    let dn = regionNames.get(lang);
    if (!dn) {
      dn = new Intl.DisplayNames([lang], { type: "region" });
      regionNames.set(lang, dn);
    }
    return dn.of(iso) ?? iso;
  } catch {
    return iso;
  }
}

/** Çekirdek listede ya da şehir grubunda (city:LON) yerel ad; yoksa yedek değer veya kod. */
export function coreCityByCode(code: string, lang: string = "tr", fallback?: string): string {
  const m = metroOf(code);
  if (m) return cityName(m, lang);
  const a = findCoreAirport(code);
  return a ? cityName(a, lang) : (fallback ?? code);
}

export type PlaceSuggestion = {
  /** Havalimanı kodu ya da "city:LON" */
  code: string;
  /** "nearby": bu yer ve çevresindeki havalimanları birlikte (Kiwi'deki "+ yakın havalimanları") */
  kind: "airport" | "city" | "nearby";
  /** Yalnızca "nearby": birlikte eklenecek yakın havalimanları */
  nearby?: { code: string; label: string; km: number }[];
  city: string;
  /** Havalimanı adı ya da şehirdeki havalimanı kodları */
  detail: string;
  country: string;
};
