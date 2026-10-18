import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { Bulut, Pirpir, Valiz } from "@/components/characters";
import { CalendarReminder } from "@/components/booking/CalendarReminder";
import { BookingFacts, Itinerary } from "@/components/booking/TripDetails";
import { googleCalendarUrl } from "@/lib/calendar";
import { serverCurrency } from "@/lib/currency-server";
import { planData } from "@/lib/pdf/plan-data";
import { planFileName } from "@/lib/trips";
import { SAMPLE_BOOKING_ID } from "@/data/mock/booking";
import { cityByCode } from "@/data/airports";
import { Link } from "@/i18n/navigation";
import { getBookingOrSample } from "@/lib/sample-booking";
import { formatDateTime, formatDayWithWeekday } from "@/lib/dates";
import { PayHeldButton } from "@/components/booking/PayHeldButton";
import { todayIso } from "@/lib/search";
import { AddBags, CancelBooking, ChangeFlight, TripActions } from "@/components/booking/TripActions";
import { Price } from "@/components/Price";
import { intlLocale } from "@/lib/intl";
import type { Leg } from "@/lib/providers/types";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "confirm" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// Next.js aynı seviyede tek dinamik segment adına izin verdiği için rezervasyon kimliği
// burada [teklifId] adıyla gelir: /rezervasyon/<rezervasyonId>/onay
export default async function ConfirmPage({ params }: { params: Promise<{ locale: string; teklifId: string }> }) {
  const { locale, teklifId } = await params;
  setRequestLocale(locale);
  const bookingId = decodeURIComponent(teklifId);
  const booking = await getBookingOrSample(bookingId);
  if (!booking) notFound();
  const t = await getTranslations("confirm");
  const tc = await getTranslations("common.characters");
  const loc = intlLocale(locale);
  const { offer } = booking;
  const city = (code: string) => cityByCode(code, locale);

  const ts = await getTranslations("confirm.shareSheet");
  const th = await getTranslations("confirm.held");
  const cancelled = booking.cancelled;
  const held = cancelled ? undefined : booking.held;
  const tx = await getTranslations("confirm.cancelled");
  // Paylaşılan metin: güzergâh, iki bacağın saatleri ve yolcu sayısı (rezervasyon kodu yok)
  const shareTitle = `${city(offer.outbound.fromCode)} → ${city(offer.outbound.toCode)}`;
  const legLine = (label: string, leg: Leg) =>
    ts("leg", {
      label,
      date: formatDayWithWeekday(leg.date, loc),
      dep: leg.dep,
      from: leg.fromCode,
      arr: leg.arr + (leg.arrDayOffset > 0 ? ` (+${leg.arrDayOffset})` : ""),
      to: leg.toCode,
      airline: leg.airline,
      stops: leg.via ? t("transferVia", { city: cityByCode(leg.via.code, locale, leg.via.city) }) : t("direct"),
    });
  const tt = await getTranslations("account.trips");
  const shareText = [
    legLine(tt("outbound"), offer.outbound),
    ...(offer.inbound ? [legLine(tt("inbound"), offer.inbound)] : []),
    ts("pax", { n: booking.passengers?.length || 1 }),
  ].join("\n");
  const google = [
    { label: tt("outbound"), leg: offer.outbound },
    ...(offer.inbound ? [{ label: tt("inbound"), leg: offer.inbound }] : []),
  ].map(({ label, leg }) => ({
    label,
    url: googleCalendarUrl(
      leg,
      `${city(leg.fromCode)} → ${city(leg.toCode)} · ${leg.airline}`,
      `${leg.fromCode} ${leg.dep} → ${leg.toCode} ${leg.arr}${booking.pnr ? ` · ${t("pnrLabel")}: ${booking.pnr}` : ""}`,
      `${city(leg.fromCode)} (${leg.fromCode})`,
    ),
  }));
  const plan = await planData(booking, locale, await serverCurrency());
  const expired = !!held && Date.parse(held.payBy) < Date.now();
  const payBy = held ? formatDateTime(held.payBy, loc) : "";


  return (
    <div className="min-h-screen w-full bg-white">
      <SiteHeader width="form" />

      <main className="mx-auto flex max-w-form flex-col gap-[22px] px-4 md:px-6 pb-20 pt-2">
        <div className="flex flex-col items-center gap-[14px] rounded-[32px] bg-sky px-5 py-8 text-center md:rounded-[40px] md:px-7 md:py-9">
          <div className="flex items-end gap-[6px]">
            <Bulut aria-label={tc("bulut")} happy width={96} height={66} className="h-auto w-[64px] min-[360px]:w-[80px] md:w-[96px]" />
            <Pirpir aria-label={tc("pirpirHappy")} happy width={170} height={119} className="h-auto w-[116px] min-[360px]:w-[144px] md:w-[170px]" />
            <Valiz aria-label={tc("valiz")} happy stripe={false} tag={false} width={56} height={70} className="h-auto w-[38px] min-[360px]:w-[46px] md:w-[56px]" />
          </div>
          {cancelled ? (
            <>
              <h1 className="m-0 font-display text-[38px] font-bold leading-[1.1] md:text-[46px]">{tx("title")}</h1>
              <p className="m-0 text-lg text-muted">
                {cancelled.refund > 0 ? tx("refund", { price: "" }).trim() : tx("noRefund")}
                {cancelled.refund > 0 && <> <Price amount={cancelled.refund} /></>}
              </p>
            </>
          ) : held ? (
            <>
              <h1 className="m-0 font-display text-[38px] font-bold leading-[1.1] md:text-[46px]">{expired ? th("expiredTitle") : th("title")}</h1>
              <p className="m-0 text-lg text-muted">{expired ? th("expiredText") : th("text", { date: payBy })}</p>
              {!expired && <p className="m-0 font-bold text-ink">{th(held.priceGuaranteedUntil ? "guaranteed" : "notGuaranteed")}</p>}
            </>
          ) : (
            <>
              <h1 className="m-0 font-display text-[38px] font-bold leading-[1.1] md:text-[46px]">{t("title")}</h1>
              <p className="m-0 text-lg text-muted">
                {t.rich("sent", { email: () => <strong className="text-ink">{booking.email}</strong> })}
              </p>
            </>
          )}
          <div className="flex flex-col items-center rounded-[20px] bg-white px-7 py-3">
            <span className="text-[13px] font-extrabold text-muted">{held ? th("pnrLabel") : t("pnrLabel")}</span>
            <span className="font-display text-[32px] font-bold tracking-[0.12em]">{booking.pnr ?? "[PNR]"}</span>
          </div>
          {held && !expired && <PayHeldButton bookingId={booking.id} total={booking.total} />}
          {held && expired && (
            <Link href="/" className="box-border inline-flex min-h-[52px] items-center rounded-pill bg-primary px-7 py-3 font-display text-lg font-semibold text-white no-underline">
              {th("searchAgain")}
            </Link>
          )}
        </div>

        {!held && !cancelled && <TripActions bookingId={booking.id} share={{ title: shareTitle, text: shareText, fileName: planFileName(booking) }} />}

        <Itinerary booking={booking} />
        {booking.changed && (
          <p className="-mt-2 mb-0 text-[15px] font-semibold text-muted">
            {t.rich(booking.changed.paid > 0 ? "change.changedPaid" : "change.changed", {
              date: formatDateTime(booking.changed.at, loc),
              price: () => <Price amount={Math.abs(booking.changed!.paid)} />,
            })}
          </p>
        )}

        {!cancelled && !expired && <CalendarReminder bookingId={booking.id} google={google} />}

        <BookingFacts booking={booking} plan={plan} />

        {!cancelled && !held && booking.id !== SAMPLE_BOOKING_ID && (
          <ChangeFlight
            bookingId={booking.id}
            outDate={booking.offer.outbound.date}
            inDate={booking.offer.inbound?.date}
            changeable={booking.changeable}
            changeFee={booking.changeFee}
            today={todayIso()}
          />
        )}
        {!cancelled && !held && booking.id !== SAMPLE_BOOKING_ID && <AddBags bookingId={booking.id} />}
        {!cancelled && booking.id !== SAMPLE_BOOKING_ID && <CancelBooking bookingId={booking.id} held={!!held} />}

        <Link href="/" className="self-center py-[10px] font-extrabold">{t("home")}</Link>
      </main>
    </div>
  );
}
