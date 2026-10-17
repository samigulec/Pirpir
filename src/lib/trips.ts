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

/** Yolcu başı bagaj: biletle gelen + sonradan alınan (bebekler hariç, ödeyen yolcu sırasıyla). */
export function passengerBags(b: Booking): { name: string; cabin: number; checked: number; heavy: number; kg?: number }[] {
  const names = b.passengers ?? [];
  const paying = b.payingCount ?? names.length;
  const inc = b.includedBags ?? { cabin: 0, checked: 0 };
  return names.map((name, i) => {
    const extra = i < paying ? b.extraBags?.[i] : undefined;
    const own = i < paying;
    return {
      name,
      cabin: (own ? inc.cabin : 0) + (extra?.cabin ?? 0),
      checked: (own ? inc.checked : 0) + (extra?.checked ?? 0),
      heavy: extra?.heavy ?? 0,
      kg: inc.kg,
    };
  });
}
