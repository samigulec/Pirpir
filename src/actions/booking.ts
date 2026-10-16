"use server";

import { getLocale } from "next-intl/server";
import { promoDiscount } from "@/data/mock/booking";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { saveBooking } from "@/lib/bookings";
import { asLocale } from "@/lib/intl";
import { confirmHref } from "@/lib/search";
import { validateBookingForm, type FieldErrors } from "@/lib/booking-validate";
import { getOffer } from "@/lib/flights";
import { getProviderForOffer } from "@/lib/providers/select";

export type PlaceOrderState = { errors: FieldErrors; message?: "expired" | "failed" | "live" };

export async function placeOrder(offerId: string, form: FormData): Promise<PlaceOrderState> {
  const offer = await getOffer(offerId);
  if (!offer) return { errors: {}, message: "expired" };

  const { data, errors } = validateBookingForm(form, offer);
  if (!data) return { errors };

  // Fiyat istemciden alınmaz; sunucuda tekliften yeniden hesaplanır.
  const bag = offer.bagOptions.find((b) => b.kind === data.bag)!;
  const paying = data.passengers.filter((p) => p.type !== "infant").length;
  const total = Math.max(0, offer.total + bag.price * paying - promoDiscount(data.promo));

  const locale = asLocale(await getLocale());
  const user = await getCurrentUser();
  let bookingId: string;
  try {
    const booking = await getProviderForOffer(offer).createOrder({ ...data, offerId }, offer, total);
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
