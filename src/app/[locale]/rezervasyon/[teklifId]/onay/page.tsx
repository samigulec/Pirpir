import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { TicketsLink } from "@/components/AccountLinks";
import { Bulut, Pirpir, Valiz } from "@/components/characters";
import { RemindToggle } from "@/components/booking/RemindToggle";
import { SAMPLE_BOOKING_ID } from "@/data/mock/booking";
import { cityByCode } from "@/data/airports";
import { Link } from "@/i18n/navigation";
import { getBooking } from "@/lib/bookings";
import { formatDateTime, formatDayWithWeekday, formatRange } from "@/lib/dates";
import { PayHeldButton } from "@/components/booking/PayHeldButton";
import { todayIso } from "@/lib/search";
import { AddBags, CancelBooking, ChangeFlight, TripActions } from "@/components/booking/TripActions";
import { Price } from "@/components/Price";
import { intlLocale } from "@/lib/intl";
import { demoProvider } from "@/lib/providers/demo";
import type { Booking, Leg } from "@/lib/providers/types";
import { defaultDates } from "@/lib/search";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "confirm" });
  return { title: t("metaTitle"), robots: { index: false } };
}

/** Biletçik ipucunun gösterdiği örnek onay ekranı (Amsterdam → İzmir). */
async function sampleBooking(): Promise<Booking | null> {
  const offers = await demoProvider.search({ from: "AMS", to: "ADB", ...defaultDates(), pax: { adults: 1, children: 0, infants: 0 } });
  const o = offers.find((x) => x.outbound.via) ?? offers[0];
  if (!o) return null;
  return { id: SAMPLE_BOOKING_ID, provider: "demo", email: "ayse@eposta.com", offer: o, total: o.total, createdAt: new Date().toISOString() };
}

// Next.js aynı seviyede tek dinamik segment adına izin verdiği için rezervasyon kimliği
// burada [teklifId] adıyla gelir: /rezervasyon/<rezervasyonId>/onay
export default async function ConfirmPage({ params }: { params: Promise<{ locale: string; teklifId: string }> }) {
  const { locale, teklifId } = await params;
  setRequestLocale(locale);
  const bookingId = decodeURIComponent(teklifId);
  const booking = bookingId === SAMPLE_BOOKING_ID ? await sampleBooking() : await getBooking(bookingId);
  if (!booking) notFound();
  const t = await getTranslations("confirm");
  const tc = await getTranslations("common.characters");
  const loc = intlLocale(locale);
  const { offer } = booking;
  const city = (code: string) => cityByCode(code, locale);

  const legs = [
    { title: t("outbound", { date: formatDayWithWeekday(offer.outbound.date, loc) }), leg: offer.outbound },
    ...(offer.inbound ? [{ title: t("inbound", { date: formatDayWithWeekday(offer.inbound.date, loc) }), leg: offer.inbound }] : []),
  ];
  const legNote = (leg: Leg) =>
    `${leg.airline} · ${leg.via ? t("transferVia", { city: cityByCode(leg.via.code, locale, leg.via.city) }) : t("direct")}`;

  const th = await getTranslations("confirm.held");
  const cancelled = booking.cancelled;
  const ta = await getTranslations("confirm.addBags");
  const bought = (booking.extraBags ?? [])
    .map((x, i) => ({ ...x, name: booking.passengers?.[i] ?? ta("pax", { n: i + 1 }) }))
    .filter((x) => x.cabin > 0 || x.checked > 0 || (x.heavy ?? 0) > 0)
    .map((x) => ta("boughtItem", { name: x.name, cabin: x.cabin, checked: x.checked, heavy: x.heavy ?? 0 }));
  const held = cancelled ? undefined : booking.held;
  const tx = await getTranslations("confirm.cancelled");
  const shareTitle = `${city(offer.outbound.fromCode)} → ${city(offer.outbound.toCode)}`;
  const shareText = t("shareText", {
    route: shareTitle,
    dates: formatRange(offer.outbound.date, offer.inbound?.date, loc),
    airline: offer.airline,
  });
  const expired = !!held && Date.parse(held.payBy) < Date.now();
  const payBy = held ? formatDateTime(held.payBy, loc) : "";


  return (
    <div className="min-h-screen w-full bg-white">
      <SiteHeader width="form">
        <TicketsLink variant="pill" />
      </SiteHeader>

      <main className="mx-auto flex max-w-form flex-col gap-[22px] px-6 pb-20 pt-2">
        <div className="flex flex-col items-center gap-[14px] rounded-[40px] bg-sky px-7 py-9 text-center">
          <div className="flex items-end gap-[6px]">
            <Bulut aria-label={tc("bulut")} happy width={96} height={66} />
            <Pirpir aria-label={tc("pirpirHappy")} happy width={170} height={119} />
            <Valiz aria-label={tc("valiz")} happy stripe={false} tag={false} width={56} height={70} />
          </div>
          {cancelled ? (
            <>
              <h1 className="m-0 font-display text-[46px] font-bold leading-[1.1]">{tx("title")}</h1>
              <p className="m-0 text-lg text-muted">
                {cancelled.refund > 0 ? tx("refund", { price: "" }).trim() : tx("noRefund")}
                {cancelled.refund > 0 && <> <Price amount={cancelled.refund} /></>}
              </p>
            </>
          ) : held ? (
            <>
              <h1 className="m-0 font-display text-[46px] font-bold leading-[1.1]">{expired ? th("expiredTitle") : th("title")}</h1>
              <p className="m-0 text-lg text-muted">{expired ? th("expiredText") : th("text", { date: payBy })}</p>
              {!expired && <p className="m-0 font-bold text-ink">{th(held.priceGuaranteedUntil ? "guaranteed" : "notGuaranteed")}</p>}
            </>
          ) : (
            <>
              <h1 className="m-0 font-display text-[46px] font-bold leading-[1.1]">{t("title")}</h1>
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

        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 rounded-[28px] border-2 border-solid border-line px-6 py-5">
          {legs.map(({ title, leg }) => (
            <div key={title} className="flex flex-col">
              <span className="text-[13px] font-extrabold text-muted">{title}</span>
              <span className="font-display text-[22px] font-semibold" title={`${city(leg.fromCode)} → ${city(leg.toCode)}`}>
                {leg.dep} {leg.fromCode} → {leg.arr}
                {leg.arrDayOffset > 0 && <sup className="ml-[2px] text-[12px] font-extrabold text-coral-text">+{leg.arrDayOffset}</sup>}{" "}
                {leg.toCode}
              </span>
              <span className="text-[15px] font-semibold text-muted">{legNote(leg)}</span>
            </div>
          ))}
        </div>

        {booking.changed && (
          <p className="-mt-2 mb-0 text-[15px] font-semibold text-muted">
            {t.rich(booking.changed.paid > 0 ? "change.changedPaid" : "change.changed", {
              date: formatDateTime(booking.changed.at, loc),
              price: () => <Price amount={Math.abs(booking.changed!.paid)} />,
            })}
          </p>
        )}
        {bought.length > 0 && (
          <p className="-mt-2 mb-0 text-[15px] font-semibold text-muted">{ta("bought", { list: bought.join(" · ") })}</p>
        )}
        {!held && !cancelled && <TripActions bookingId={booking.id} shareTitle={shareTitle} shareText={shareText} />}

        {!cancelled && (
          <div className="flex flex-wrap items-center gap-x-[18px] gap-y-[14px] rounded-[28px] bg-coral-soft px-6 py-5">
            <div className="flex flex-[1_1_300px] flex-col">
              <span className="font-display text-xl font-semibold">{t("remind.title")}</span>
              <span className="text-[15px] text-muted">{t("remind.text")}</span>
            </div>
            <RemindToggle />
          </div>
        )}

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
