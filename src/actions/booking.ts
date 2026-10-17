"use server";

import { getLocale } from "next-intl/server";
import { promoDiscount } from "@/data/mock/booking";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getBooking, saveBooking, updateBooking } from "@/lib/bookings";
import { PriceChangedError } from "@/lib/providers/duffel";
import { asLocale } from "@/lib/intl";
import { confirmHref } from "@/lib/search";
import { validateBookingForm, type FieldErrors } from "@/lib/booking-validate";
import { getOffer } from "@/lib/flights";
import { getProviderForOffer } from "@/lib/providers/select";
import { bagsCost, seatsCost } from "@/lib/extras";

export type PlaceOrderState = { errors: FieldErrors; message?: "expired" | "failed" | "live" };

export async function placeOrder(offerId: string, form: FormData): Promise<PlaceOrderState> {
  const offer = await getOffer(offerId);
  if (!offer) return { errors: {}, message: "expired" };

  const { data, errors } = validateBookingForm(form, offer);
  if (!data) return { errors };

  // Fiyat istemciden alınmaz; sunucuda teklif, bagaj ve koltuk haritasından yeniden hesaplanır.
  const provider = getProviderForOffer(offer);
  const paying = data.passengers.filter((p) => p.type !== "infant").length;
  let seatTotal = 0;
  if (data.seats.length) {
    const maps = await provider.seatMaps(offer).catch(() => []);
    const cost = seatsCost(maps, data.seats, paying);
    if (cost === null) return { errors: { seats: "seats" } };
    seatTotal = cost;
  }
  const quoted = offer.total + bagsCost(offer.bags, data.bags) + seatTotal;
  const total = Math.max(0, quoted - promoDiscount(data.promo));

  const locale = asLocale(await getLocale());
  const user = await getCurrentUser();
  let bookingId: string;
  try {
    const booking = await provider.createOrder({ ...data, offerId }, offer, total);
    if (booking.held) booking.providerTotal ??= quoted;
    await saveBooking(booking, user, locale);
    bookingId = booking.id;
  } catch (e) {
    console.error("Sipariş oluşturulamadı:", e);
    const live = e instanceof Error && e.message.startsWith("Canlı modda");
    return { errors: {}, message: live ? "live" : "failed" };
  }
  redirect({ href: confirmHref(bookingId), locale });
  return { errors: {} }; // redirect() burada akışı keser
}

export type PayHeldState = { error?: "expired" | "failed" | "live" | "priceChanged"; newTotal?: number };

/** Fiyatı sabitlenmiş (ayrılmış) rezervasyonun ödemesi. */
export async function payHeldBooking(bookingId: string): Promise<PayHeldState> {
  const booking = await getBooking(bookingId);
  if (!booking) return { error: "failed" };
  const locale = asLocale(await getLocale());
  if (booking.held) {
    if (Date.parse(booking.held.payBy) < Date.now()) return { error: "expired" };
    try {
      await updateBooking(await getProviderForOffer(booking).payHeld(booking));
    } catch (e) {
      if (e instanceof PriceChangedError) return { error: "priceChanged", newTotal: e.newTotal };
      console.error("Ayrılmış rezervasyon ödenemedi:", e);
      const live = e instanceof Error && e.message.startsWith("Canlı modda");
      return { error: live ? "live" : "failed" };
    }
  }
  redirect({ href: confirmHref(bookingId), locale });
  return {};
}
