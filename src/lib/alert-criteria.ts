// Fiyat alarmının neyi takip ettiği (tarayıcı ve sunucu ortak): esnek tarih, sadece direkt, bagajlı fiyat, hedef fiyat.
// Alarm penceresindeki "şu an en ucuz" ile günlük kontrolün bulduğu fiyat aynı kuralla hesaplanır.
import { wantedBagsExtra } from "./extras";
import type { BagChoice, Offer } from "./providers/types";

export type AlertCriteria = {
  /** Seçilen günün kaç gün öncesi/sonrası da taransın (0 = yalnızca seçilen tarihler) */
  flex?: 0 | 3;
  /** Yalnızca aktarmasız uçuşlar (gidiş ve dönüş) */
  direct?: boolean;
  /** Yolcu başı bagaj: fiyat bu bagajla birlikte (satmayan uçuş sayılmaz) */
  bags?: BagChoice;
  /** Kişi başı hedef fiyat (TRY); verilirse e-posta fiyat bunun altına inince gider */
  targetTry?: number;
};

/** Bulunan en ucuz uçuşun özeti (e-postada ve hesapta gösterilir). */
export type AlertBest = {
  price: number;
  airline: string;
  date: string;
  returnDate?: string;
  dep: string;
  stops: number;
};

const hasBags = (b?: BagChoice) => !!b && (b.cabin > 0 || b.checked > 0);

/** Kriterlere uyan en ucuz uçuş ve kişi başı fiyatı (bagaj eklenmiş). */
export function cheapestFor(offers: Offer[], c: AlertCriteria): AlertBest | null {
  let best: AlertBest | null = null;
  for (const o of offers) {
    if (c.direct && (o.outbound.stops > 0 || (o.inbound?.stops ?? 0) > 0)) continue;
    let price = o.price;
    if (hasBags(c.bags)) {
      const w = wantedBagsExtra(o.bags, c.bags!);
      if (!w) continue;
      price += w.extra;
    }
    if (!best || price < best.price) {
      best = {
        price,
        airline: o.airline,
        date: o.outbound.date,
        returnDate: o.inbound?.date,
        dep: o.outbound.dep,
        stops: Math.max(o.outbound.stops, o.inbound?.stops ?? 0),
      };
    }
  }
  return best;
}

/** Aynı alarm iki kez kurulmasın: rota + tarih + kriterler */
export function criteriaKey(c: AlertCriteria): string {
  return [c.flex ?? 0, c.direct ? 1 : 0, c.bags?.cabin ?? 0, c.bags?.checked ?? 0, c.targetTry ?? ""].join("|");
}
