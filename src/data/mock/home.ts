// Örnek veri — Main.dc.html'deki değerler. Fiyatlar TRY.

export type CategoryId = "all" | "tr" | "eu" | "sea" | "city";

export type PopularDestination = {
  id:
    | "ist" | "ayt" | "fco" | "bcn" | "lhr" | "cdg" | "adb" | "bjv" | "dxb" | "nyc" | "lis" | "ams"
    | "nav" | "asr" | "kya" | "tzx" | "esb" | "gzt";
  /** Şehir adı ve ülke için havalimanı kodu. */
  code: string;
  /** Aramada kullanılan yer: birden çok havalimanlı şehirlerde şehir grubu. */
  searchCode: string;
  /** Fırsat bulunamazsa kartta gösterilen havalimanları. */
  airports: string[];
  tags: Exclude<CategoryId, "all">[];
};

// Fiyat, süre ve havayolları burada yok: src/lib/deals.ts arama sağlayıcısından hesaplar.
// Sıra: kartlar bu sırayla gösterilir; ilk dokuzu açık, gerisi "Daha fazla şehir" ile.
export const popularDestinations: PopularDestination[] = [
  { id: "ist", code: "IST", searchCode: "city:IST", airports: ["IST", "SAW"], tags: ["tr", "city"] },
  { id: "ayt", code: "AYT", searchCode: "AYT", airports: ["AYT"], tags: ["tr", "sea"] },
  { id: "adb", code: "ADB", searchCode: "ADB", airports: ["ADB"], tags: ["tr", "sea", "city"] },
  { id: "fco", code: "FCO", searchCode: "city:ROM", airports: ["FCO", "CIA"], tags: ["eu", "city"] },
  { id: "bcn", code: "BCN", searchCode: "BCN", airports: ["BCN"], tags: ["eu", "sea", "city"] },
  { id: "nav", code: "NAV", searchCode: "NAV", airports: ["NAV"], tags: ["tr"] },
  { id: "lhr", code: "LHR", searchCode: "city:LON", airports: ["LHR", "LGW"], tags: ["eu", "city"] },
  { id: "bjv", code: "BJV", searchCode: "BJV", airports: ["BJV"], tags: ["tr", "sea"] },
  { id: "cdg", code: "CDG", searchCode: "city:PAR", airports: ["CDG", "ORY"], tags: ["eu", "city"] },
  { id: "esb", code: "ESB", searchCode: "ESB", airports: ["ESB"], tags: ["tr", "city"] },
  { id: "asr", code: "ASR", searchCode: "ASR", airports: ["ASR"], tags: ["tr"] },
  { id: "tzx", code: "TZX", searchCode: "TZX", airports: ["TZX"], tags: ["tr", "sea"] },
  { id: "kya", code: "KYA", searchCode: "KYA", airports: ["KYA"], tags: ["tr", "city"] },
  { id: "gzt", code: "GZT", searchCode: "GZT", airports: ["GZT"], tags: ["tr", "city"] },
  { id: "lis", code: "LIS", searchCode: "LIS", airports: ["LIS"], tags: ["eu", "sea", "city"] },
  { id: "ams", code: "AMS", searchCode: "AMS", airports: ["AMS"], tags: ["eu", "city"] },
  { id: "dxb", code: "DXB", searchCode: "DXB", airports: ["DXB"], tags: ["city"] },
  { id: "nyc", code: "JFK", searchCode: "city:NYC", airports: ["JFK", "EWR"], tags: ["city"] },
];
