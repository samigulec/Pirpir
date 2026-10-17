// Ek bagaj ve koltuk ücretleri: istemcide gösterim, sunucuda yeniden hesap için ortak.
import type { BagChoice, Bags, SeatChoice, SeatMap } from "./providers/types";

export const NO_BAGS: BagChoice = { cabin: 0, checked: 0 };

/** Seçim geçerli mi (alınabilir türde ve adet sınırında)? */
export function bagChoiceValid(bags: Bags, c: BagChoice): boolean {
  const ok = (n: number, b: Bags["cabin"] | undefined) =>
    Number.isInteger(n) && n >= 0 && (n === 0 || (!!b && n <= b.max && b.price !== undefined));
  const heavy = c.heavy ?? 0;
  // İki ağırlık birlikte alınırsa toplam, havayolunun izin verdiği en yüksek adedi geçmez
  const together = c.checked + heavy <= Math.max(bags.checked.max, bags.heavy?.max ?? 0);
  return ok(c.cabin, bags.cabin) && ok(c.checked, bags.checked) && ok(heavy, bags.heavy) && together;
}

/** Bir yolcunun ek bagaj ücreti (TRY). */
export const bagCost = (bags: Bags, c: BagChoice) =>
  c.cabin * (bags.cabin.price ?? 0) + c.checked * (bags.checked.price ?? 0) + (c.heavy ?? 0) * (bags.heavy?.price ?? 0);

export const bagsCost = (bags: Bags, choices: BagChoice[]) => choices.reduce((n, c) => n + bagCost(bags, c), 0);

/**
 * Arama filtresindeki "kabin bagajı / kontrol edilen bagaj" isteği için yolcu başı ek ücret.
 * Teklifte bu bagaj alınamıyorsa null.
 */
export function wantedBagsExtra(bags: Bags, want: BagChoice): { choice: BagChoice; extra: number } | null {
  const choice = { cabin: Math.max(0, want.cabin - bags.cabin.included), checked: Math.max(0, want.checked - bags.checked.included) };
  if (!bagChoiceValid(bags, choice)) return null;
  return { choice, extra: bagCost(bags, choice) };
}

export function findSeat(maps: SeatMap[], segment: number, designator: string) {
  return maps.find((m) => m.segment === segment)?.rows.flatMap((r) => r.seats).find((s) => s?.designator === designator) ?? null;
}

/** Koltuk seçimlerinin toplamı; geçersiz (dolu, yok, aynı koltuk iki kez) seçim varsa null. */
export function seatsCost(maps: SeatMap[], seats: SeatChoice[], paying: number): number | null {
  const seen = new Set<string>();
  let total = 0;
  for (const s of seats) {
    const key = `${s.segment}:${s.designator}`;
    const paxKey = `${s.segment}#${s.pax}`;
    const seat = findSeat(maps, s.segment, s.designator);
    if (!seat?.available || seen.has(key) || seen.has(paxKey) || s.pax < 0 || s.pax >= paying) return null;
    seen.add(key);
    seen.add(paxKey);
    total += seat.price;
  }
  return total;
}

/** Daha önce alınan ve yeni alınan ek bagajı yolcu yolcu toplar. */
export function mergeBags(before: BagChoice[] | undefined, added: BagChoice[]): BagChoice[] {
  return added.map((c, i) => {
    const heavy = (before?.[i]?.heavy ?? 0) + (c.heavy ?? 0);
    return { cabin: (before?.[i]?.cabin ?? 0) + c.cabin, checked: (before?.[i]?.checked ?? 0) + c.checked, ...(heavy ? { heavy } : {}) };
  });
}
