import "server-only";
import { SAMPLE_BOOKING_ID } from "@/data/mock/booking";
import { getBooking } from "./bookings";
import { demoProvider } from "./providers/demo";
import type { Booking } from "./providers/types";
import { defaultDates } from "./search";

/** Biletçik ipucunun gösterdiği örnek rezervasyon (Amsterdam → İzmir). */
async function sampleBooking(): Promise<Booking | null> {
  const offers = await demoProvider.search({ from: "AMS", to: "ADB", ...defaultDates(), pax: { adults: 1, children: 0, infants: 0 } });
  const o = offers.find((x) => x.outbound.via) ?? offers[0];
  if (!o) return null;
  return { id: SAMPLE_BOOKING_ID, provider: "demo", email: "ayse@eposta.com", offer: o, total: o.total, createdAt: new Date().toISOString() };
}

/** Rezervasyon ya da örnek kimlikse örnek rezervasyon (onay, plan, PDF ve takvim aynı veriyi görsün). */
export async function getBookingOrSample(id: string): Promise<Booking | null> {
  return id === SAMPLE_BOOKING_ID ? sampleBooking() : getBooking(id);
}
