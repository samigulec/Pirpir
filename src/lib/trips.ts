import { brand } from "@/config/brand";
import type { Booking, Leg } from "./providers/types";
import { todayIso } from "./search";

/** Biletlerim'de bir rezervasyonun durumu. */
export type TripStatus = "held" | "upcoming" | "past" | "cancelled" | "expired";
/** Biletlerim sekmeleri: ödeme bekleyenler yaklaşanlarda, süresi dolan ayırmalar iptal edilenlerde. */
export type TripTab = "upcoming" | "past" | "cancelled";

export const TRIP_TABS: TripTab[] = ["upcoming", "past", "cancelled"];

export function tripStatus(b: Booking, now = new Date()): TripStatus {
  if (b.cancelled) return "cancelled";
  if (b.held) return Date.parse(b.held.payBy) < now.getTime() ? "expired" : "held";
  return lastLeg(b).date >= todayIso(now) ? "upcoming" : "past";
}

export function tripTab(s: TripStatus): TripTab {
  return s === "held" || s === "upcoming" ? "upcoming" : s === "past" ? "past" : "cancelled";
}

export const tripLegs = (b: Booking): Leg[] => [b.offer.outbound, ...(b.offer.inbound ? [b.offer.inbound] : [])];
const lastLeg = (b: Booking) => b.offer.inbound ?? b.offer.outbound;

/** Kalkışa kaç gün var (bugün 0; geçtiyse negatif). */
export function daysUntil(date: string, now = new Date()): number {
  return Math.round((Date.parse(date) - Date.parse(todayIso(now))) / 86_400_000);
}

/**
 * Sekmeye göre sıralama: yaklaşanlarda en yakın kalkış önce (ödeme bekleyenler en üstte),
 * geçmiş ve iptal edilenlerde en yeni önce.
 */
export function sortTrips(list: Booking[], tab: TripTab, now = new Date()): Booking[] {
  const out = [...list];
  if (tab === "upcoming") {
    const held = (b: Booking) => (tripStatus(b, now) === "held" ? 0 : 1);
    return out.sort((a, b) => held(a) - held(b) || a.offer.outbound.date.localeCompare(b.offer.outbound.date) || a.offer.outbound.dep.localeCompare(b.offer.outbound.dep));
  }
  return out.sort((a, b) => lastLeg(b).date.localeCompare(lastLeg(a).date) || b.createdAt.localeCompare(a.createdAt));
}

export type BagKind = "personal" | "cabin" | "checked" | "heavy";
export type BagItem = { kind: BagKind; count: number; kg?: number };

/**
 * Yolcu başı bagaj kalemleri: biletle gelen + sonradan alınan (ödeyen yolcu sırasıyla; bebeklerin bagajı yok).
 * Ağırlık yalnızca havayolu bildirdiyse yazılır; aynı tür ve ağırlıktaki kalemler birleştirilir.
 */
export function passengerBags(b: Booking): { name: string; infant: boolean; items: BagItem[] }[] {
  const names = b.passengers ?? [];
  const paying = b.payingCount ?? names.length;
  const inc = b.includedBags ?? { cabin: 0, checked: 0 };
  const kg = b.bagKg ?? { checked: inc.kg, extraChecked: inc.kg };
  return names.map((name, i) => {
    if (i >= paying) return { name, infant: true, items: [] };
    const extra = b.extraBags?.[i];
    const items: BagItem[] = [{ kind: "personal", count: 1 }];
    const add = (kind: BagKind, count: number, w?: number) => {
      if (count <= 0) return;
      const same = items.find((x) => x.kind === kind && x.kg === w);
      if (same) same.count += count;
      else items.push({ kind, count, kg: w });
    };
    add("cabin", inc.cabin, kg.cabin);
    add("cabin", extra?.cabin ?? 0, kg.extraCabin);
    add("checked", inc.checked, kg.checked);
    add("checked", extra?.checked ?? 0, kg.extraChecked);
    add("heavy", extra?.heavy ?? 0, kg.heavy);
    return { name, infant: false, items };
  });
}

/** Dahil kontrol edilen bagajın ağırlığı bilinmiyor ama bu uçuşta satılan ek bagajınki biliniyorsa o (bilgi notu için). */
export function unknownIncludedKgHint(b: Booking): number | undefined {
  const inc = b.includedBags;
  if (!inc?.checked || b.bagKg?.checked || inc.kg) return undefined;
  return b.bagKg?.extraChecked;
}

/** İndirilen PDF'in adı: rotala-PNR.pdf ya da rotala-AMS-IST-2026-11-07.pdf */
export function planFileName(b: Booking): string {
  const o = b.offer.outbound;
  return `${brand.name}-${b.pnr ?? `${o.fromCode}-${o.toCode}-${o.date}`}.pdf`;
}
