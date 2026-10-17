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
  /** Uçuş bacakları (ayrıntı görünümü için; eski kayıtlarda olmayabilir). */
  segments?: Segment[];
};

export type Segment = {
  fromCode: string;
  toCode: string;
  date: string; // kalkış YYYY-MM-DD
  dep: string;
  arr: string;
  arrDayOffset: number;
  mins: number;
  carrier: string;
  /** Ör. "PC 1254" */
  flightNumber?: string;
  aircraft?: string;
  /** Bu bacaktan sonraki aktarmada bekleme (dakika). */
  layoverMins?: number;
};

export type { CabinClass } from "../search";
import type { CabinClass } from "../search";

/** Havayolu bildirdiyse iade / değişiklik koşulları (bilinmiyorsa undefined). */
export type FareConditions = { refundable?: boolean; changeable?: boolean };

/** Fiyata dahil bagaj (yolcu başı). Kişisel eşya (koltuk altı çanta) her bilete dahildir. */
export type BagInfo = { cabin: boolean; checkedKg?: number; checked?: boolean; checkedCount?: number };

/** Bir bagaj türü için (yolcu başı, tüm yolculuk): dahil adet ve satın alınabilen ek adet. */
export type BagOffer = {
  included: number;
  /** Ek bagaj alınabiliyorsa adet başı fiyat (TRY, gidiş + dönüş birlikte). */
  price?: number;
  /** Sağlayıcı para biriminde adet başı tutar (sipariş ödemesi için). */
  rawAmount?: number;
  /** En fazla kaç ek adet alınabilir (0 = alınamaz). */
  max: number;
  kg?: number;
  /** Sağlayıcı hizmet kimlikleri: ödeyen yolcu sırasına göre, her bacak için bir kimlik. */
  serviceIds?: string[][];
};

export type Bags = { cabin: BagOffer; checked: BagOffer };

/** Yolcunun seçtiği ek bagaj (dahil olanların üstüne). */
export type BagChoice = { cabin: number; checked: number };

/** Koltuk haritası (bir uçuş bacağı). */
export type SeatMap = {
  segment: number;
  fromCode: string;
  toCode: string;
  /** Sütun harfleri; null = koridor */
  columns: (string | null)[];
  rows: SeatRow[];
};
export type SeatRow = { number: number; exit?: boolean; seats: (Seat | null)[] };
export type Seat = {
  designator: string;
  available: boolean;
  /** TRY; 0 = ücretsiz */
  price: number;
  rawAmount?: number;
  legroom?: boolean;
  /** Ödeyen yolcu sırasına göre sağlayıcı hizmet kimliği */
  serviceIds?: (string | null)[];
};
/** Seçilen koltuk: bacak sırası, ödeyen yolcu sırası, koltuk. */
export type SeatChoice = { segment: number; pax: number; designator: string };

export type Offer = {
  id: string;
  provider: "demo" | "duffel";
  query: SearchQuery;
  fromCity: string;
  toCity: string;
  airline: string;
  /** Havayolunun resmi simge logosu (Duffel'ın varlık sunucusundan SVG); örnek veride yok. */
  airlineLogo?: string;
  outbound: Leg;
  inbound?: Leg;
  /** Kişi başı fiyat (TRY) — sonuç kartında gösterilen. */
  price: number;
  /** Tüm yolcular için toplam (TRY). */
  total: number;
  /** Sağlayıcının kendi para birimindeki toplam (sipariş ödemesi bununla yapılır). */
  raw: { amount: string; currency: string };
  bagInfo: BagInfo;
  bags: Bags;
  cabin: CabinClass;
  /** Havayolunun paket adı (ör. "Basic", "Standard"). */
  fareBrand?: string;
  conditions: FareConditions;
  passportRequired: boolean;
  expiresAt?: string;
  /** Havayolu "şimdi ayır, sonra öde"ye izin veriyorsa: son ödeme zamanı ve fiyat garantisi (ISO). */
  hold?: HoldTerms;
};

export type HoldTerms = {
  payBy: string;
  /** Yoksa koltuk ayrılır ama fiyat ödemeye kadar değişebilir. */
  priceGuaranteedUntil?: string;
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
  /** Ödeyen yolcu sırasına göre (bebekler hariç) */
  bags: BagChoice[];
  seats: SeatChoice[];
  promo?: string;
  /** Şimdi ödemeden ayır (fiyat sabitleme) */
  hold?: boolean;
};

export type Booking = {
  id: string;
  provider: Offer["provider"];
  /** Havayolu rezervasyon kodu (örnek modda yok). */
  pnr?: string;
  email: string;
  offer: Pick<Offer, "airline" | "outbound" | "inbound">;
  total: number;
  createdAt: string;
  /** Ayrıldı, ödeme bekliyor (yoksa ödenmiş, bilet kesilmiş) */
  held?: HoldTerms;
  /** Ayırmada sağlayıcının istediği tutar (TRY, indirimden önce); ödemede fiyat değişti mi diye karşılaştırılır. */
  providerTotal?: number;
  /** Yolcu adları (seyahat planı için) */
  passengers?: string[];
  /** Bilet iade edilebilir mi (biliniyorsa) */
  refundable?: boolean;
  /** İptal edildiyse zamanı ve iade tutarı (TRY) */
  cancelled?: { at: string; refund: number };
  /** Ödeyen (bebek olmayan) yolcu sayısı; `passengers` listesinin ilk bu kadarı */
  payingCount?: number;
  /** Bilete dahil bagaj (yolcu başı) */
  includedBags?: { cabin: number; checked: number; kg?: number };
  /** Satın alınan ek bagaj (ödeyen yolcu sırasıyla; rezervasyonda ve sonradan) */
  extraBags?: BagChoice[];
};

export interface FlightProvider {
  search(q: SearchQuery): Promise<Offer[]>;
  getOffer(id: string): Promise<Offer | null>;
  seatMaps(offer: Offer): Promise<SeatMap[]>;
  createOrder(input: OrderInput, offer: Offer, totalTry: number): Promise<Booking>;
  /** Ayrılmış rezervasyonun ödemesini yapar; güncel tutar değiştiyse hata verir. */
  payHeld(booking: Booking): Promise<Booking>;
  /** İptal teklifi: iade tutarı ve teklifin geçerlilik süresi. Henüz bir şey iptal edilmez. */
  cancelQuote(booking: Booking): Promise<CancelQuote>;
  /** Teklifi onaylar; rezervasyon iptal edilir. */
  cancelConfirm(booking: Booking, quoteId: string): Promise<Booking>;
  /** Rezervasyondan sonra eklenebilecek bagaj (yoksa null). */
  orderBags(booking: Booking): Promise<Bags | null>;
  /** Ek bagajı satın alır; tutar sunucuda hesaplanır. */
  addBags(booking: Booking, choices: BagChoice[]): Promise<Booking>;
}

export type { Passengers };

export type CancelQuote = {
  id: string;
  /** İade tutarı (TRY) */
  refund: number;
  /** İadenin gideceği yer: "original_form_of_payment", "balance", "airline_credits" … */
  refundTo?: string;
  expiresAt?: string;
};
