import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { CurrencySelect } from "@/components/HeaderControls";
import { BookingForm } from "@/components/booking/BookingForm";
import { DEMO_BOOKING_ID } from "@/data/mock/booking";
import type { Leg } from "@/data/mock/flights";
import { formatDayWithWeekday } from "@/lib/dates";
import { getOffer, searchHref } from "@/lib/flights";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("booking");
  return { title: t("metaTitle") };
}

export default async function BookingPage({ params }: { params: Promise<{ teklifId: string }> }) {
  const { teklifId } = await params;
  const offer = await getOffer(teklifId);
  if (!offer) notFound();
  const t = await getTranslations("booking");

  const legNote = (leg: Leg) =>
    !leg.via
      ? t("direct")
      : leg.via.wait
        ? t("transferWait", { place: leg.via.locative, wait: leg.via.wait })
        : t("transfer", { place: leg.via.locative });

  const legs = [
    { title: t("outbound", { date: formatDayWithWeekday(offer.outbound.date) }), leg: offer.outbound },
    { title: t("inbound", { date: formatDayWithWeekday(offer.inbound.date) }), leg: offer.inbound },
  ];

  return (
    <div className="min-h-screen w-full bg-white">
      <SiteHeader width="form">
        <CurrencySelect />
      </SiteHeader>

      <main className="mx-auto flex max-w-form flex-col gap-[22px] px-6 pb-20 pt-2">
        <Link href={searchHref({ from: offer.fromCity, to: offer.toCity })} className="self-start py-[6px] text-[15px] font-bold">
          {t("back")}
        </Link>

        <ol aria-label={t("steps.label")} className="m-0 flex list-none gap-2 p-0 text-sm font-extrabold">
          {(["passenger", "bags", "payment"] as const).map((s) => (
            <li key={s} className="flex flex-1 flex-col gap-[6px]">
              <span className="h-[6px] rounded-[3px] bg-primary" />
              {t(`steps.${s}`)}
            </li>
          ))}
        </ol>

        <h1 className="m-0 font-display text-[44px] font-bold leading-[1.1]">{t("title")}</h1>

        <div className="flex flex-col gap-3 rounded-[28px] bg-sky px-6 py-[22px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-display text-[22px] font-semibold">
              {offer.fromCity} → {offer.toCity}
            </span>
            <span className="font-bold text-muted">{offer.airline}</span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[10px]">
            {legs.map(({ title, leg }) => (
              <div key={title} className="flex flex-col rounded-[18px] bg-white px-4 py-3">
                <span className="text-[13px] font-extrabold text-muted">{title}</span>
                <span className="font-display text-xl font-semibold">
                  {leg.dep} → {leg.arr}
                </span>
                <span className="text-[13px] font-bold text-muted">{legNote(leg)}</span>
              </div>
            ))}
          </div>
        </div>

        <BookingForm
          ticketPrice={offer.price} confirmHref={`/rezervasyon/${DEMO_BOOKING_ID}/onay`}
          transferPlace={offer.outbound.via?.locative}
        />

        <span className="text-center text-sm text-muted">{t("footnote")}</span>
      </main>
    </div>
  );
}
