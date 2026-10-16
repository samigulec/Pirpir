// Örnek uçuş teklifleri — Results.dc.html (Amsterdam → İzmir, 24 – 31 Ekim). Fiyatlar TRY, kişi başı.

export type Leg = {
  date: string;
  dep: string;
  arr: string;
  fromCode: string;
  toCode: string;
  airline: string;
  /** Aktarma yeri (yoksa direkt). */
  via?: { city: string; locative: string; code: string; wait?: string };
};

export type Offer = {
  id: string;
  fromCity: string;
  toCity: string;
  mins: number;
  outbound: Leg;
  inbound: Leg;
  airline: string;
  price: number;
  bagInfo: string;
};

const AMS = "AMS";
const ADB = "ADB";

export const offers: Offer[] = [
  {
    id: "ams-adb-1",
    fromCity: "Amsterdam",
    toCity: "İzmir",
    mins: 220,
    airline: "Pegasus",
    price: 3420,
    bagInfo: "Küçük çanta dahil",
    outbound: { date: "2026-10-24", dep: "07:15", arr: "11:55", fromCode: AMS, toCode: ADB, airline: "Pegasus" },
    inbound: { date: "2026-10-31", dep: "18:30", arr: "21:20", fromCode: ADB, toCode: AMS, airline: "Pegasus" },
  },
  {
    id: "ams-adb-2",
    fromCity: "Amsterdam",
    toCity: "İzmir",
    mins: 325,
    airline: "Transavia + Pegasus",
    price: 2760,
    bagInfo: "Küçük çanta dahil",
    outbound: { date: "2026-10-24", dep: "06:40", arr: "13:05", fromCode: AMS, toCode: ADB, airline: "Transavia + Pegasus", via: { city: "İstanbul", locative: "İstanbul'da", code: "IST", wait: "1 sa 20 dk" } },
    inbound: { date: "2026-10-31", dep: "12:10", arr: "19:00", fromCode: ADB, toCode: AMS, airline: "SunExpress", via: { city: "Antalya", locative: "Antalya'da", code: "AYT" } },
  },
  {
    id: "ams-adb-3",
    fromCity: "Amsterdam",
    toCity: "İzmir",
    mins: 225,
    airline: "SunExpress",
    price: 3890,
    bagInfo: "Kabin bavulu + 20 kg dahil",
    outbound: { date: "2026-10-24", dep: "10:25", arr: "15:10", fromCode: AMS, toCode: ADB, airline: "SunExpress" },
    inbound: { date: "2026-10-31", dep: "16:05", arr: "18:55", fromCode: ADB, toCode: AMS, airline: "SunExpress" },
  },
  {
    id: "ams-adb-4",
    fromCity: "Amsterdam",
    toCity: "İzmir",
    mins: 365,
    airline: "Turkish Airlines",
    price: 5240,
    bagInfo: "Kabin bavulu + 23 kg dahil",
    outbound: { date: "2026-10-24", dep: "11:50", arr: "18:55", fromCode: AMS, toCode: ADB, airline: "Turkish Airlines", via: { city: "İstanbul", locative: "İstanbul'da", code: "IST", wait: "2 sa 10 dk" } },
    inbound: { date: "2026-10-31", dep: "07:30", arr: "13:45", fromCode: ADB, toCode: AMS, airline: "Turkish Airlines", via: { city: "İstanbul", locative: "İstanbul'da", code: "IST" } },
  },
];

/** Bulut'un tarih ipucu: iki gün sonraki en düşük fiyat. */
export const flexibleDateTip = { date: "2026-10-26", price: 2590, save: 170 };
