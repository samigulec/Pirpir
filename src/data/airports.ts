// Havalimanı listesi (IATA kodları ve yaklaşık koordinatlar). Arama kutusu önerileri,
// adres çözümleme ve örnek veri modundaki uçuş süreleri buradan gelir.

export type Airport = {
  code: string;
  city: string;
  name: string;
  country: string;
  /** Rota sayfası adresinde kullanılan şehir adı (ör. "istanbul"). */
  slug: string;
  lat: number;
  lon: number;
  /** 3: büyük aktarma merkezi, 2: çok direkt uçuşu olan, 1: bölgesel. */
  size: 1 | 2 | 3;
  aliases?: string[];
  /** Türkçeden farklıysa İngilizce / Hollandaca şehir adı. */
  i18n?: { en?: string; nl?: string };
};

type Lang = "tr" | "en" | "nl";

const COUNTRIES: Record<string, { en: string; nl: string }> = {
  Hollanda: { en: "Netherlands", nl: "Nederland" },
  Belçika: { en: "Belgium", nl: "België" },
  Almanya: { en: "Germany", nl: "Duitsland" },
  Türkiye: { en: "Türkiye", nl: "Turkije" },
  "Birleşik Krallık": { en: "United Kingdom", nl: "Verenigd Koninkrijk" },
  Fransa: { en: "France", nl: "Frankrijk" },
  İtalya: { en: "Italy", nl: "Italië" },
  İspanya: { en: "Spain", nl: "Spanje" },
  Portekiz: { en: "Portugal", nl: "Portugal" },
  Yunanistan: { en: "Greece", nl: "Griekenland" },
  Avusturya: { en: "Austria", nl: "Oostenrijk" },
  Çekya: { en: "Czechia", nl: "Tsjechië" },
  Danimarka: { en: "Denmark", nl: "Denemarken" },
  İsviçre: { en: "Switzerland", nl: "Zwitserland" },
};

export const airports: Airport[] = [
  // Hollanda
  { code: "AMS", city: "Amsterdam", name: "Schiphol", country: "Hollanda", slug: "amsterdam", lat: 52.31, lon: 4.76, size: 3 },
  { code: "EIN", city: "Eindhoven", name: "Eindhoven", country: "Hollanda", slug: "eindhoven", lat: 51.45, lon: 5.37, size: 2 },
  { code: "RTM", city: "Rotterdam", name: "Rotterdam The Hague", country: "Hollanda", slug: "rotterdam", lat: 51.96, lon: 4.44, size: 2, aliases: ["Lahey", "Den Haag"] },
  { code: "GRQ", city: "Groningen", name: "Groningen Eelde", country: "Hollanda", slug: "groningen", lat: 53.12, lon: 6.58, size: 1 },
  { code: "MST", city: "Maastricht", name: "Maastricht Aachen", country: "Hollanda", slug: "maastricht", lat: 50.92, lon: 5.78, size: 1 },
  // Belçika, Almanya
  { code: "BRU", city: "Brüksel", name: "Brussels Airport", country: "Belçika", slug: "bruksel", lat: 50.9, lon: 4.48, size: 3, aliases: ["Brussels"], i18n: { en: "Brussels", nl: "Brussel" } },
  { code: "CRL", city: "Charleroi", name: "Brussels South Charleroi", country: "Belçika", slug: "charleroi", lat: 50.46, lon: 4.45, size: 2 },
  { code: "DUS", city: "Düsseldorf", name: "Düsseldorf", country: "Almanya", slug: "dusseldorf", lat: 51.29, lon: 6.77, size: 2 },
  { code: "CGN", city: "Köln", name: "Köln/Bonn", country: "Almanya", slug: "koln", lat: 50.87, lon: 7.14, size: 2, aliases: ["Cologne", "Bonn"], i18n: { en: "Cologne", nl: "Keulen" } },
  { code: "FRA", city: "Frankfurt", name: "Frankfurt am Main", country: "Almanya", slug: "frankfurt", lat: 50.04, lon: 8.56, size: 3 },
  { code: "MUC", city: "Münih", name: "Franz Josef Strauss", country: "Almanya", slug: "munih", lat: 48.35, lon: 11.79, size: 3, aliases: ["München", "Munich"], i18n: { en: "Munich", nl: "München" } },
  { code: "BER", city: "Berlin", name: "Berlin Brandenburg", country: "Almanya", slug: "berlin", lat: 52.37, lon: 13.5, size: 2 },
  // Türkiye
  { code: "IST", city: "İstanbul", name: "İstanbul Havalimanı", country: "Türkiye", slug: "istanbul", lat: 41.26, lon: 28.74, size: 3, i18n: { en: "Istanbul", nl: "Istanbul" } },
  { code: "SAW", city: "İstanbul", name: "Sabiha Gökçen", country: "Türkiye", slug: "istanbul", lat: 40.9, lon: 29.31, size: 3, i18n: { en: "Istanbul", nl: "Istanbul" } },
  { code: "ADB", city: "İzmir", name: "Adnan Menderes", country: "Türkiye", slug: "izmir", lat: 38.29, lon: 27.16, size: 2, i18n: { en: "Izmir", nl: "Izmir" } },
  { code: "AYT", city: "Antalya", name: "Antalya", country: "Türkiye", slug: "antalya", lat: 36.9, lon: 30.8, size: 2 },
  { code: "ESB", city: "Ankara", name: "Esenboğa", country: "Türkiye", slug: "ankara", lat: 40.13, lon: 32.99, size: 2 },
  { code: "DLM", city: "Dalaman", name: "Dalaman", country: "Türkiye", slug: "dalaman", lat: 36.71, lon: 28.79, size: 2, aliases: ["Fethiye", "Marmaris"] },
  { code: "BJV", city: "Bodrum", name: "Milas-Bodrum", country: "Türkiye", slug: "bodrum", lat: 37.25, lon: 27.66, size: 2 },
  { code: "ASR", city: "Kayseri", name: "Erkilet", country: "Türkiye", slug: "kayseri", lat: 38.77, lon: 35.5, size: 1, aliases: ["Kapadokya"] },
  { code: "GZT", city: "Gaziantep", name: "Gaziantep", country: "Türkiye", slug: "gaziantep", lat: 36.95, lon: 37.48, size: 1 },
  { code: "TZX", city: "Trabzon", name: "Trabzon", country: "Türkiye", slug: "trabzon", lat: 40.99, lon: 39.79, size: 1 },
  { code: "ADA", city: "Adana", name: "Şakirpaşa", country: "Türkiye", slug: "adana", lat: 36.98, lon: 35.28, size: 1 },
  { code: "KYA", city: "Konya", name: "Konya", country: "Türkiye", slug: "konya", lat: 37.98, lon: 32.56, size: 1 },
  { code: "SZF", city: "Samsun", name: "Çarşamba", country: "Türkiye", slug: "samsun", lat: 41.25, lon: 36.57, size: 1 },
  { code: "DIY", city: "Diyarbakır", name: "Diyarbakır", country: "Türkiye", slug: "diyarbakir", lat: 37.89, lon: 40.2, size: 1, i18n: { en: "Diyarbakir", nl: "Diyarbakir" } },
  { code: "EZS", city: "Elazığ", name: "Elazığ", country: "Türkiye", slug: "elazig", lat: 38.61, lon: 39.29, size: 1, i18n: { en: "Elazig", nl: "Elazig" } },
  { code: "MLX", city: "Malatya", name: "Malatya", country: "Türkiye", slug: "malatya", lat: 38.44, lon: 38.09, size: 1 },
  { code: "ERZ", city: "Erzurum", name: "Erzurum", country: "Türkiye", slug: "erzurum", lat: 39.96, lon: 41.17, size: 1 },
  { code: "VAN", city: "Van", name: "Ferit Melen", country: "Türkiye", slug: "van", lat: 38.47, lon: 43.33, size: 1 },
  { code: "HTY", city: "Hatay", name: "Hatay", country: "Türkiye", slug: "hatay", lat: 36.36, lon: 36.28, size: 1, aliases: ["Antakya"] },
  { code: "DNZ", city: "Denizli", name: "Çardak", country: "Türkiye", slug: "denizli", lat: 37.79, lon: 29.7, size: 1 },
  // Avrupa
  { code: "LHR", city: "Londra", name: "Heathrow", country: "Birleşik Krallık", slug: "londra", lat: 51.47, lon: -0.45, size: 3, aliases: ["London"], i18n: { en: "London", nl: "Londen" } },
  { code: "LGW", city: "Londra", name: "Gatwick", country: "Birleşik Krallık", slug: "londra", lat: 51.15, lon: -0.18, size: 2, aliases: ["London"], i18n: { en: "London", nl: "Londen" } },
  { code: "CDG", city: "Paris", name: "Charles de Gaulle", country: "Fransa", slug: "paris", lat: 49.01, lon: 2.55, size: 3 },
  { code: "ORY", city: "Paris", name: "Orly", country: "Fransa", slug: "paris", lat: 48.73, lon: 2.36, size: 2 },
  { code: "FCO", city: "Roma", name: "Fiumicino", country: "İtalya", slug: "roma", lat: 41.8, lon: 12.25, size: 3, aliases: ["Rome"], i18n: { en: "Rome", nl: "Rome" } },
  { code: "MXP", city: "Milano", name: "Malpensa", country: "İtalya", slug: "milano", lat: 45.63, lon: 8.72, size: 2, aliases: ["Milan"], i18n: { en: "Milan", nl: "Milaan" } },
  { code: "BCN", city: "Barselona", name: "El Prat", country: "İspanya", slug: "barselona", lat: 41.3, lon: 2.08, size: 3, aliases: ["Barcelona"], i18n: { en: "Barcelona", nl: "Barcelona" } },
  { code: "MAD", city: "Madrid", name: "Barajas", country: "İspanya", slug: "madrid", lat: 40.47, lon: -3.56, size: 3 },
  { code: "LIS", city: "Lizbon", name: "Humberto Delgado", country: "Portekiz", slug: "lizbon", lat: 38.77, lon: -9.13, size: 2, aliases: ["Lisbon", "Lisboa"], i18n: { en: "Lisbon", nl: "Lissabon" } },
  { code: "ATH", city: "Atina", name: "Eleftherios Venizelos", country: "Yunanistan", slug: "atina", lat: 37.94, lon: 23.94, size: 2, aliases: ["Athens"], i18n: { en: "Athens", nl: "Athene" } },
  { code: "VIE", city: "Viyana", name: "Schwechat", country: "Avusturya", slug: "viyana", lat: 48.11, lon: 16.57, size: 3, aliases: ["Vienna", "Wien"], i18n: { en: "Vienna", nl: "Wenen" } },
  { code: "PRG", city: "Prag", name: "Václav Havel", country: "Çekya", slug: "prag", lat: 50.1, lon: 14.26, size: 2, aliases: ["Prague"], i18n: { en: "Prague", nl: "Praag" } },
  { code: "CPH", city: "Kopenhag", name: "Kastrup", country: "Danimarka", slug: "kopenhag", lat: 55.62, lon: 12.65, size: 2, aliases: ["Copenhagen"], i18n: { en: "Copenhagen", nl: "Kopenhagen" } },
  { code: "ZRH", city: "Zürih", name: "Zürih", country: "İsviçre", slug: "zurih", lat: 47.46, lon: 8.55, size: 3, aliases: ["Zurich"], i18n: { en: "Zurich", nl: "Zürich" } },
];

export function cityName(a: Airport, lang: string = "tr"): string {
  return (lang !== "tr" && a.i18n?.[lang as Exclude<Lang, "tr">]) || a.city;
}

export function countryName(country: string, lang: string = "tr"): string {
  return lang === "tr" ? country : (COUNTRIES[country]?.[lang as Exclude<Lang, "tr">] ?? country);
}

/** Kod → yerel şehir adı (bilinmiyorsa yedek değer). */
export function cityByCode(code: string, lang: string = "tr", fallback?: string): string {
  const a = findAirport(code);
  return a ? cityName(a, lang) : (fallback ?? code);
}

const searchNames = (a: Airport) => [a.city, ...(a.aliases ?? []), ...Object.values(a.i18n ?? {})];

const norm = (s: string) =>
  s
    .toLocaleLowerCase("tr-TR")
    .replace(/[ıi̇]/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

export function findAirport(code: string): Airport | undefined {
  const c = code.toUpperCase();
  return airports.find((a) => a.code === c);
}

/** Yazılan metne uyan havalimanları: önce kod, sonra şehir başı, sonra içerik eşleşmesi. */
export function suggestAirports(query: string, limit = 6): Airport[] {
  const q = norm(query);
  if (!q) return [];
  const score = (a: Airport) => {
    if (a.code.toLowerCase() === q) return 0;
    const names = searchNames(a).map(norm);
    if (names.some((n) => n === q)) return 1;
    if (names.some((n) => n.startsWith(q))) return 2;
    if (norm(a.name).startsWith(q)) return 3;
    const countries = [a.country, ...Object.values(COUNTRIES[a.country] ?? {})].map(norm);
    if ([...names, norm(a.name), ...countries].some((n) => n.includes(q))) return 4;
    return 99;
  };
  return airports
    .map((a) => [a, score(a)] as const)
    .filter(([, s]) => s < 99)
    .sort((x, y) => x[1] - y[1] || y[0].size - x[0].size)
    .slice(0, limit)
    .map(([a]) => a);
}

/** "İzmir", "ADB" veya "izmir" → havalimanı. Aynı şehirde birden fazlaysa en büyüğü. */
export function resolveAirport(input: string): Airport | undefined {
  const byCode = /^[a-z]{3}$/i.test(input.trim()) ? findAirport(input.trim()) : undefined;
  if (byCode) return byCode;
  const q = norm(input);
  const exact = airports.filter((a) => searchNames(a).some((n) => norm(n) === q));
  if (exact.length) return [...exact].sort((a, b) => b.size - a.size)[0];
  return undefined;
}

export function distanceKm(a: Airport, b: Airport): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(b.lat - a.lat);
  const dLon = r(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
