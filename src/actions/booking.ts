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
import { saveTraveller } from "./user";
import { getProviderForOffer } from "@/lib/providers/select";
import { bagChoiceValid, bagsCost, seatsCost } from "@/lib/extras";
import type { BagChoice, Bags, Booking, ChangeOption, ChangeRequest } from "@/lib/providers/types";

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
    booking.passengers = data.passengers.map((p) => `${p.givenName} ${p.familyName}`);
    booking.refundable = offer.conditions.refundable;
    booking.changeable = offer.conditions.changeable;
    booking.changeFee = offer.conditions.changeFee;
    booking.payingCount = paying;
    booking.includedBags = { cabin: offer.bags.cabin.included, checked: offer.bags.checked.included };
    // Ağırlıklar yalnızca havayolu bildirdiyse (dahil bagajınkini Duffel çoğu zaman vermez; uydurulmaz)
    booking.bagKg = {
      cabin: offer.bagSpecs?.cabin?.kg,
      checked: offer.bagSpecs?.checked?.kg,
      extraCabin: offer.bags.cabin.kg ?? offer.bagSpecs?.cabin?.kg,
      extraChecked: offer.bags.checked.kg ?? offer.bagSpecs?.checked?.kg,
      heavy: offer.bags.heavy?.kg,
    };
    booking.breakdown = { fare: offer.total, bags: bagsCost(offer.bags, data.bags), seats: seatTotal, discount: quoted - total };
    booking.offer = { ...booking.offer, airlineLogo: offer.airlineLogo, cabin: offer.cabin, fareBrand: offer.fareBrand };
    booking.extraBags = data.bags;
    await saveBooking(booking, user, locale);
    bookingId = booking.id;
    // "Bu yolcuyu hesabıma kaydet" işaretlenenler (giriş yapmışsa); hata rezervasyonu etkilemez
    if (user) {
      await Promise.all(
        data.passengers.map((p, i) =>
          form.get(`p${i}_save`) === "on"
            ? saveTraveller({ givenName: p.givenName, familyName: p.familyName, gender: p.gender, bornOn: p.bornOn, nationality: p.nationality, passport: p.passport })
            : null,
        ),
      ).catch((e) => console.error("Yolcu kaydedilemedi:", e));
    }
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

export type CancelState = {
  quote?: { id: string; refund: number; refundTo?: string };
  error?: "failed" | "live" | "notFound";
  done?: boolean;
};

/** İptal teklifi: iade tutarını gösterir, henüz iptal etmez. */
export async function getCancelQuote(bookingId: string): Promise<CancelState> {
  const booking = await getBooking(bookingId);
  if (!booking || booking.cancelled) return { error: "notFound" };
  try {
    const q = await getProviderForOffer(booking).cancelQuote(booking);
    return { quote: { id: q.id, refund: q.refund, refundTo: q.refundTo } };
  } catch (e) {
    console.error("İptal teklifi alınamadı:", e);
    return { error: e instanceof Error && e.message.startsWith("Canlı modda") ? "live" : "failed" };
  }
}

/** Rezervasyonu iptal eder (müşteri teklifi gördükten sonra). */
export async function confirmCancel(bookingId: string, quoteId: string): Promise<CancelState> {
  const booking = await getBooking(bookingId);
  if (!booking || booking.cancelled) return { error: "notFound" };
  try {
    await updateBooking(await getProviderForOffer(booking).cancelConfirm(booking, quoteId));
    return { done: true };
  } catch (e) {
    console.error("İptal onaylanamadı:", e);
    return { error: e instanceof Error && e.message.startsWith("Canlı modda") ? "live" : "failed" };
  }
}

export type AddBagsState = {
  bags?: Bags;
  passengers?: string[];
  error?: "failed" | "live" | "notFound" | "unavailable" | "invalid";
  done?: boolean;
};

const payingNames = (b: Booking) => (b.passengers ?? []).slice(0, b.payingCount ?? b.passengers?.length ?? 1);

/** Rezervasyondan sonra eklenebilecek bagaj seçenekleri. */
export async function getOrderBags(bookingId: string): Promise<AddBagsState> {
  const booking = await getBooking(bookingId);
  if (!booking || booking.cancelled || booking.held) return { error: "notFound" };
  try {
    const bags = await getProviderForOffer(booking).orderBags(booking);
    if (!bags || (bags.cabin.max === 0 && bags.checked.max === 0)) return { error: "unavailable" };
    const names = payingNames(booking);
    const count = names.length || bags.checked.serviceIds?.length || bags.cabin.serviceIds?.length || 1;
    return { bags, passengers: Array.from({ length: count }, (_, i) => names[i] ?? "") };
  } catch (e) {
    console.error("Ek bagaj seçenekleri alınamadı:", e);
    return { error: e instanceof Error && e.message.startsWith("Canlı modda") ? "live" : "failed" };
  }
}

/** Ek bagajı satın alır. Tutar istemciden alınmaz; sağlayıcının güncel fiyatıyla hesaplanır. */
export async function addBagsToBooking(bookingId: string, choices: BagChoice[]): Promise<AddBagsState> {
  const booking = await getBooking(bookingId);
  if (!booking || booking.cancelled || booking.held) return { error: "notFound" };
  try {
    const provider = getProviderForOffer(booking);
    const bags = await provider.orderBags(booking);
    const clean = choices.map((c) => ({ cabin: Number(c.cabin) || 0, checked: Number(c.checked) || 0, heavy: Number(c.heavy) || 0 }));
    if (!bags || !clean.length || !clean.every((c) => bagChoiceValid(bags, c)) || !clean.some((c) => c.cabin || c.checked || c.heavy)) {
      return { error: "invalid" };
    }
    await updateBooking(await provider.addBags(booking, clean));
    return { done: true };
  } catch (e) {
    console.error("Ek bagaj eklenemedi:", e);
    return { error: e instanceof Error && e.message.startsWith("Canlı modda") ? "live" : "failed" };
  }
}

export type ChangeState = {
  options?: ChangeOption[];
  error?: "failed" | "live" | "notFound" | "notChangeable" | "invalid" | "none" | "priceChanged";
  newTotal?: number;
  done?: boolean;
};

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** İstek geçerli mi: en az bir bacak, bugünden sonra, dönüş gidişten önce değil. */
function changeRequestValid(b: Booking, req: ChangeRequest): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const out = req.outDate ?? b.offer.outbound.date;
  const inn = req.inDate ?? b.offer.inbound?.date;
  if (!req.outDate && !req.inDate) return false;
  if (req.inDate && !b.offer.inbound) return false;
  for (const d of [req.outDate, req.inDate]) if (d !== undefined && (!ISO_DAY.test(d) || d < today)) return false;
  return !inn || inn >= out;
}

async function changeable(bookingId: string, req: ChangeRequest): Promise<Booking | ChangeState> {
  const booking = await getBooking(bookingId);
  if (!booking || booking.cancelled || booking.held) return { error: "notFound" };
  if (booking.changeable === false) return { error: "notChangeable" };
  if (!changeRequestValid(booking, req)) return { error: "invalid" };
  return booking;
}

/** Yeni tarih için havayolunun değişiklik seçenekleri; henüz bir şey değişmez. */
export async function getChangeOptions(bookingId: string, req: ChangeRequest): Promise<ChangeState> {
  const b = await changeable(bookingId, req);
  if (!("id" in b)) return b;
  try {
    const options = await getProviderForOffer(b).changeOptions(b, req);
    return options.length ? { options } : { error: "none" };
  } catch (e) {
    console.error("Değişiklik seçenekleri alınamadı:", e);
    return { error: e instanceof Error && e.message.startsWith("Canlı modda") ? "live" : "failed" };
  }
}

/** Seçilen değişikliği onaylar. Tutar müşterinin gördüğüyle aynı değilse onaylanmaz. */
export async function confirmChange(bookingId: string, req: ChangeRequest, optionId: string, expectedTotal: number): Promise<ChangeState> {
  const b = await changeable(bookingId, req);
  if (!("id" in b)) return b;
  try {
    await updateBooking(await getProviderForOffer(b).changeConfirm(b, req, optionId, expectedTotal));
    return { done: true };
  } catch (e) {
    if (e instanceof PriceChangedError) return { error: "priceChanged", newTotal: e.newTotal };
    console.error("Değişiklik onaylanamadı:", e);
    return { error: e instanceof Error && e.message.startsWith("Canlı modda") ? "live" : "failed" };
  }
}
