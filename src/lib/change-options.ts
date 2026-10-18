import type { ChangeOption, Leg } from "./providers/types";

/** Uçuşu tanımlayan anahtar: tarih, saatler ve uçuş numaraları (aynı uçuşun kopyaları birleşsin). */
export function legKey(l?: Leg): string {
  if (!l) return "";
  const flights = l.segments?.map((s) => s.flightNumber ?? `${s.fromCode}${s.dep}`).join("+") ?? `${l.airline}|${l.stops}`;
  return `${l.date}|${l.dep}|${l.arr}|${l.fromCode}|${l.toCode}|${flights}`;
}

/**
 * Havayolu aynı uçuşu ve aynı tutarı birden çok teklif olarak dönebiliyor (paket ya da kimlik farkı);
 * müşteriye aynı satırı tekrar tekrar göstermemek için uçuşlar + paket + tutar aynı olanların ilki kalır.
 */
export function uniqueChangeOptions(list: ChangeOption[]): ChangeOption[] {
  const seen = new Set<string>();
  return list.filter((o) => {
    const k = `${legKey(o.outbound)}#${legKey(o.inbound)}#${o.fareBrand ?? ""}#${o.changeTotal}`;
    return !seen.has(k) && !!seen.add(k);
  });
}
