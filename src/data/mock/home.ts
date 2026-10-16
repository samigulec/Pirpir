// Örnek veri — Main.dc.html'deki değerler. Fiyatlar TRY.

export type CategoryId = "all" | "tr" | "eu" | "sea" | "city";

export type PopularDestination = {
  id: "ist" | "ayt" | "fco" | "bcn" | "lhr" | "cdg";
  /** Arama için havalimanı kodu. */
  code: string;
  city: string;
  price: number;
  mins: number;
  airlines: string[];
  tags: Exclude<CategoryId, "all">[];
  /** Rota sayfası varsa slug'ları. */
  routeSlug?: { from: string; to: string };
};

export const popularDestinations: PopularDestination[] = [
  { id: "ist", code: "IST", city: "İstanbul", price: 2980, mins: 215, airlines: ["Turkish Airlines", "Pegasus", "KLM"], tags: ["tr", "city"], routeSlug: { from: "amsterdam", to: "istanbul" } },
  { id: "ayt", code: "AYT", city: "Antalya", price: 3090, mins: 245, airlines: ["SunExpress", "Corendon", "Transavia"], tags: ["tr", "sea"] },
  { id: "fco", code: "FCO", city: "Roma", price: 1890, mins: 140, airlines: ["KLM", "Transavia", "ITA"], tags: ["eu", "city"] },
  { id: "bcn", code: "BCN", city: "Barselona", price: 2150, mins: 135, airlines: ["Vueling", "KLM", "Transavia"], tags: ["eu", "sea", "city"] },
  { id: "lhr", code: "LHR", city: "Londra", price: 1690, mins: 75, airlines: ["British Airways", "KLM", "easyJet"], tags: ["eu", "city"] },
  { id: "cdg", code: "CDG", city: "Paris", price: 1590, mins: 80, airlines: ["Air France", "KLM", "Transavia"], tags: ["eu", "city"] },
];

export type PopularRoute = {
  from: string;
  to: string;
  fromCode: string;
  toCode: string;
  stops: number;
  mins: number;
  price: number;
  routeSlug?: { from: string; to: string };
};

export const popularRoutes: PopularRoute[] = [
  { from: "Amsterdam", to: "İstanbul", fromCode: "AMS", toCode: "IST", stops: 0, mins: 215, price: 2980, routeSlug: { from: "amsterdam", to: "istanbul" } },
  { from: "Amsterdam", to: "İzmir", fromCode: "AMS", toCode: "ADB", stops: 0, mins: 225, price: 3420 },
  { from: "Eindhoven", to: "Antalya", fromCode: "EIN", toCode: "AYT", stops: 0, mins: 240, price: 2890 },
  { from: "Rotterdam", to: "Antalya", fromCode: "RTM", toCode: "AYT", stops: 0, mins: 245, price: 3150 },
  { from: "Amsterdam", to: "Ankara", fromCode: "AMS", toCode: "ESB", stops: 1, mins: 340, price: 3250 },
  { from: "Amsterdam", to: "Kayseri", fromCode: "AMS", toCode: "ASR", stops: 1, mins: 370, price: 3680 },
  { from: "Amsterdam", to: "Gaziantep", fromCode: "AMS", toCode: "GZT", stops: 1, mins: 390, price: 3780 },
  { from: "Amsterdam", to: "Trabzon", fromCode: "AMS", toCode: "TZX", stops: 1, mins: 410, price: 3990 },
];
