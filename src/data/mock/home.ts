// Örnek veri — Main.dc.html'deki değerler. Fiyatlar TRY.

export type CategoryId = "all" | "tr" | "eu" | "sea" | "city";

/** Ana sayfada "Nereden" alanının ve popüler uçuş fiyatlarının varsayılan kalkış yeri. */
export const DEFAULT_FROM = "AMS";

export type PopularDestination = {
  id: "ist" | "ayt" | "fco" | "bcn" | "lhr" | "cdg" | "adb" | "bjv" | "dxb" | "nyc" | "lis" | "ams";
  /** Şehir adı ve ülke için havalimanı kodu. */
  code: string;
  /** Aramada kullanılan yer: birden çok havalimanlı şehirlerde şehir grubu. */
  searchCode: string;
  /** Fırsat bulunamazsa kartta gösterilen havalimanları. */
  airports: string[];
  tags: Exclude<CategoryId, "all">[];
};

// Fiyat, süre ve havayolları burada yok: src/lib/deals.ts arama sağlayıcısından hesaplar.
export const popularDestinations: PopularDestination[] = [
  { id: "ist", code: "IST", searchCode: "city:IST", airports: ["IST", "SAW"], tags: ["tr", "city"] },
  { id: "ayt", code: "AYT", searchCode: "AYT", airports: ["AYT"], tags: ["tr", "sea"] },
  { id: "fco", code: "FCO", searchCode: "city:ROM", airports: ["FCO", "CIA"], tags: ["eu", "city"] },
  { id: "bcn", code: "BCN", searchCode: "BCN", airports: ["BCN"], tags: ["eu", "sea", "city"] },
  { id: "lhr", code: "LHR", searchCode: "city:LON", airports: ["LHR", "LGW"], tags: ["eu", "city"] },
  { id: "cdg", code: "CDG", searchCode: "city:PAR", airports: ["CDG", "ORY"], tags: ["eu", "city"] },
  { id: "adb", code: "ADB", searchCode: "ADB", airports: ["ADB"], tags: ["tr", "sea", "city"] },
  { id: "bjv", code: "BJV", searchCode: "BJV", airports: ["BJV"], tags: ["tr", "sea"] },
  { id: "lis", code: "LIS", searchCode: "LIS", airports: ["LIS"], tags: ["eu", "sea", "city"] },
  { id: "ams", code: "AMS", searchCode: "AMS", airports: ["AMS"], tags: ["eu", "city"] },
  { id: "dxb", code: "DXB", searchCode: "DXB", airports: ["DXB"], tags: ["city"] },
  { id: "nyc", code: "JFK", searchCode: "city:NYC", airports: ["JFK", "EWR"], tags: ["city"] },
];

export type PopularRoute = { fromCode: string; toCode: string };

export const popularRoutes: PopularRoute[] = [
  { fromCode: "AMS", toCode: "IST" },
  { fromCode: "AMS", toCode: "ADB" },
  { fromCode: "EIN", toCode: "AYT" },
  { fromCode: "RTM", toCode: "AYT" },
  { fromCode: "AMS", toCode: "ESB" },
  { fromCode: "AMS", toCode: "ASR" },
  { fromCode: "AMS", toCode: "GZT" },
  { fromCode: "AMS", toCode: "TZX" },
];
