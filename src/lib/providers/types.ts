// Sağlayıcıdan bağımsız uçuş veri modeli. Arayüz yalnızca bu tiplerle çalışır.
import type { Passengers, SearchQuery } from "../search";

export type Leg = {
  date: string; // YYYY-MM-DD (kalkış, yerel)
  dep: string; // HH:MM
  arr: string; // HH:MM
  /** Varış ertesi gün(ler)deyse +1, +2 */
  arrDayOffset: number;
  fromCode: string;
  toCode: string;
  fromCity: string;
  toCity: string;
  airline: string;
  mins: number;
  /** İlk aktarma (yoksa direkt). */
  via?: { city: string; code: string; waitMins: number };
  stops: number;
};

export type BagKind = "small" | "cabin" | "big";

export type BagOption = {
  kind: BagKind;
  /** Yolcu başı ek ücret (TRY); 0 = dahil. */
  price: number;
  /** Sağlayıcı ek hizmet kimlikleri (yolcu başına bir tane). */
  serviceIds?: string[];
  /** Sağlayıcı para biriminde yolcu başı tutar (sipariş ödemesi için). */
  rawAmount?: number;
};

export type Offer = {
  id: string;
  provider: "demo" | "duffel";
  query: SearchQuery;
  fromCity: string;
  toCity: string;
  airline: string;
  outbound: Leg;
  inbound?: Leg;
  /** Kişi başı fiyat (TRY) — sonuç kartında gösterilen. */
  price: number;
  /** Tüm yolcular için toplam (TRY). */
  total: number;
  /** Sağlayıcının kendi para birimindeki toplam (sipariş ödemesi bununla yapılır). */
  raw: { amount: string; currency: string };
  bagInfo: string;
  bagOptions: BagOption[];
  passportRequired: boolean;
  expiresAt?: string;
};

export type PassengerInput = {
  type: "adult" | "child" | "infant";
  givenName: string;
  familyName: string;
  gender: "f" | "m";
  bornOn: string; // YYYY-MM-DD
  nationality: string;
  passport?: string;
};

export type OrderInput = {
  offerId: string;
  passengers: PassengerInput[];
  email: string;
  phone: string;
  bag: BagKind;
  promo?: string;
};

export type Booking = {
  id: string;
  provider: Offer["provider"];
  /** Havayolu rezervasyon kodu (örnek modda yok). */
  pnr?: string;
  email: string;
  offer: Pick<Offer, "fromCity" | "toCity" | "airline" | "outbound" | "inbound">;
  total: number;
};

export interface FlightProvider {
  search(q: SearchQuery): Promise<Offer[]>;
  getOffer(id: string): Promise<Offer | null>;
  createOrder(input: OrderInput, offer: Offer, totalTry: number): Promise<Booking>;
}

export type { Passengers };
