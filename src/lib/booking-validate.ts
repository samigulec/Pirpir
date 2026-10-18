// Rezervasyon formu doğrulaması (sunucuda çalışır; istemci de aynı kuralları gösterir).
import { toCountryCode } from "@/data/countries";
import type { BagChoice, Offer, PassengerInput, SeatChoice } from "./providers/types";
import { bagChoiceValid, NO_BAGS } from "./extras";

export type FieldErrors = Record<string, string>;

export type PassengerSlot = { type: PassengerInput["type"] };

export function passengerSlots(offer: Offer): PassengerSlot[] {
  const p = offer.query.pax;
  return [
    ...Array.from({ length: p.adults }, () => ({ type: "adult" as const })),
    ...Array.from({ length: p.children }, () => ({ type: "child" as const })),
    ...Array.from({ length: p.infants }, () => ({ type: "infant" as const })),
  ];
}

/** GG.AA.YYYY → YYYY-MM-DD (geçersizse null) */
export function parseBirthDate(s: string): string | null {
  const m = s.trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return dt.toISOString().slice(0, 10);
}

function ageOn(bornOn: string, onDate: string): number {
  const [by, bm, bd] = bornOn.split("-").map(Number);
  const [y, m, d] = onDate.split("-").map(Number);
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
}

const NAME = /^[\p{L}][\p{L} '\-]{0,49}$/u;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type ParsedBooking = {
  passengers: PassengerInput[];
  email: string;
  phone: string;
  bags: BagChoice[];
  seats: SeatChoice[];
  promo?: string;
  hold: boolean;
};

export function validateBookingForm(form: FormData, offer: Offer): { data?: ParsedBooking; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const travelDate = offer.inbound?.date ?? offer.outbound.date;

  const passengers: PassengerInput[] = passengerSlots(offer).map((slot, i) => {
    const k = (f: string) => `p${i}_${f}`;
    const givenName = get(k("given"));
    const familyName = get(k("family"));
    const gender = get(k("gender")) === "m" ? "m" : "f";
    const birthRaw = get(k("birth"));
    const bornOn = parseBirthDate(birthRaw);
    const passport = get(k("passport")).toUpperCase();
    if (!NAME.test(givenName)) errors[k("given")] = "name";
    if (!NAME.test(familyName)) errors[k("family")] = "name";
    if (!bornOn) errors[k("birth")] = "birth";
    else {
      const age = ageOn(bornOn, travelDate);
      const ageAtDep = ageOn(bornOn, offer.outbound.date);
      if (ageAtDep < 0 || bornOn > new Date().toISOString().slice(0, 10)) errors[k("birth")] = "birth";
      else if (slot.type === "adult" && ageAtDep < 12) errors[k("birth")] = "adultAge";
      else if (slot.type === "child" && (ageAtDep < 2 || age >= 12)) errors[k("birth")] = "childAge";
      else if (slot.type === "infant" && age >= 2) errors[k("birth")] = "infantAge";
    }
    if (offer.passportRequired && !/^[A-Z0-9]{5,12}$/.test(passport)) errors[k("passport")] = "passport";
    return {
      type: slot.type,
      givenName,
      familyName,
      gender,
      bornOn: bornOn ?? "",
      nationality: toCountryCode(get(k("nationality"))),
      passport: passport || undefined,
    };
  });

  const email = get("email");
  if (!EMAIL.test(email)) errors.email = "email";
  const phoneDigits = get("phone").replace(/\D/g, "");
  const code = get("phoneCode").replace(/[^\d+]/g, "") || "+31";
  if (phoneDigits.length < 6 || phoneDigits.length > 14) errors.phone = "phone";
  const paying = passengers.filter((p) => p.type !== "infant").length;
  const bags = parseJsonList(get("bags"), paying, (v): v is BagChoice => !!v && typeof v === "object" && "cabin" in v && "checked" in v)
    ?.map((b) => ({ cabin: Number(b.cabin), checked: Number(b.checked), ...(b.heavy ? { heavy: Number(b.heavy) } : {}) }));
  const finalBags = bags ?? Array.from({ length: paying }, () => NO_BAGS);
  if (finalBags.length !== paying || !finalBags.every((b) => bagChoiceValid(offer.bags, b))) errors.bag = "bag";
  const seats =
    parseJsonList(get("seats"), 64, (v): v is SeatChoice => !!v && typeof v === "object" && "segment" in v && "pax" in v && "designator" in v)?.map((s) => ({
      segment: Number(s.segment),
      pax: Number(s.pax),
      designator: String(s.designator).slice(0, 4),
    })) ?? [];
  if (form.get("terms") !== "on") errors.terms = "terms";
  const hold = form.get("hold") === "1";
  if (hold && !offer.hold) errors.hold = "hold";

  if (Object.keys(errors).length) return { errors };
  return {
    errors,
    data: { passengers, email, phone: code + phoneDigits.replace(/^0/, ""), bags: finalBags, seats, promo: get("promo") || undefined, hold },
  };
}

/** Formdaki JSON listesi; boşsa undefined, bozuksa ya da çok uzunsa boş liste. */
function parseJsonList<T>(raw: string, max: number, is: (v: unknown) => v is T): T[] | undefined {
  if (!raw) return undefined;
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) && v.length <= max && v.every(is) ? v : [];
  } catch {
    return [];
  }
}
