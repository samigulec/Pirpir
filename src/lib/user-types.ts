// Hesaba bağlı kayıtların biçimleri (tarayıcı ve sunucu ortak).
import type { CabinClass, Passengers } from "./search";
import type { Leg } from "./providers/types";

export type Traveller = {
  givenName: string;
  familyName: string;
  gender: "f" | "m";
  /** YYYY-MM-DD */
  bornOn: string;
  nationality: string;
  passport?: string;
};

export type PriceAlert = {
  from: string[];
  to: string[];
  date: string;
  returnDate?: string;
  cabin: CabinClass;
  pax: Passengers;
  /** Alarm kurulduğunda kişi başı en düşük fiyat (TRY); bilinmiyorsa null */
  priceAt: number | null;
  /** Bildirim için: alarmı kuranın e-postası, dili ve para birimi (kurulduğu andaki) */
  email?: string;
  lang?: string;
  cur?: string;
  /** Günlük kontrolün bulduğu son fiyat (TRY) ve zamanı */
  lastPrice?: number | null;
  lastCheckedAt?: string;
  /** Son e-postada bildirilen fiyat; bir sonraki e-posta bundan belirgin düşükse gider */
  notifiedPrice?: number;
  notifiedAt?: string;
  /** Son kontrollerin fiyatları (en fazla 14) */
  history?: { at: string; price: number }[];
};

export type Favorite = {
  /** Aynı uçuş iki kez kaydedilmesin: güzergâh + tarih + saatler + havayolu */
  key: string;
  airline: string;
  outbound: Leg;
  inbound?: Leg;
  /** Kaydedildiğinde kişi başı fiyat (TRY) */
  price: number;
  query: { from: string[]; to: string[]; date: string; returnDate?: string; pax: Passengers; cabin: CabinClass };
};

export type Saved<T> = { id: string; data: T; createdAt: string };

/** Favori anahtarı: aynı uçuş (tarih, saat, havayolu) */
export const favoriteKey = (o: { airline: string; outbound: Leg; inbound?: Leg }) =>
  [o.airline, o.outbound.date, o.outbound.dep, o.outbound.fromCode, o.outbound.toCode, o.inbound?.date ?? "", o.inbound?.dep ?? ""].join("|");
