import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PillLink, SiteHeader } from "@/components/SiteHeader";
import { Bulut, Pirpir, Valiz } from "@/components/characters";
import { Calendar, Download, Share } from "@/components/icons";
import { RemindToggle } from "@/components/booking/RemindToggle";
import type { Leg } from "@/data/mock/flights";
import { formatDayWithWeekday } from "@/lib/dates";
import { getBooking } from "@/lib/flights";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("confirm");
  return { title: t("metaTitle") };
}

// Next.js aynı seviyede tek dinamik segment adına izin verdiği için rezervasyon kimliği
// burada [teklifId] adıyla gelir: /rezervasyon/<rezervasyonId>/onay
export default async function ConfirmPage({ params }: { params: Promise<{ teklifId: string }> }) {
  const { teklifId: bookingId } = await params;
  const booking = await getBooking(bookingId);
  if (!booking) notFound();
  const t = await getTranslations("confirm");
  const tc = await getTranslations("common");
  const { offer } = booking;

  const legs = [
    { title: t("outbound", { date: formatDayWithWeekday(offer.outbound.date) }), leg: offer.outbound },
    { title: t("inbound", { date: formatDayWithWeekday(offer.inbound.date) }), leg: offer.inbound },
  ];
  const legNote = (leg: Leg) => `${leg.airline} · ${leg.via ? t("transferVia", { city: leg.via.city }) : t("direct")}`;

  const action =
    "flex min-h-[56px] items-center justify-center gap-2 rounded-[18px] font-display text-lg font-semibold no-underline";

  return (
    <div className="min-h-screen w-full bg-white">
      <SiteHeader width="form">
        <PillLink href="#">{tc("myTickets")}</PillLink>
      </SiteHeader>

      <main className="mx-auto flex max-w-form flex-col gap-[22px] px-6 pb-20 pt-2">
        <div className="flex flex-col items-center gap-[14px] rounded-[40px] bg-sky px-7 py-9 text-center">
          <div className="flex items-end gap-[6px]">
            <Bulut happy width={96} height={66} />
            <Pirpir happy width={170} height={119} />
            <Valiz happy stripe={false} tag={false} width={56} height={70} />
          </div>
          <h1 className="m-0 font-display text-[46px] font-bold leading-[1.1]">{t("title")}</h1>
          <p className="m-0 text-lg text-muted">
            {t.rich("sent", { email: () => <strong className="text-ink">{booking.email}</strong> })}
          </p>
          <div className="flex flex-col items-center rounded-[20px] bg-white px-7 py-3">
            <span className="text-[13px] font-extrabold text-muted">{t("pnrLabel")}</span>
            <span className="font-display text-[32px] font-bold tracking-[0.12em]">{booking.pnr}</span>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 rounded-[28px] border-2 border-solid border-line px-6 py-5">
          {legs.map(({ title, leg }) => (
            <div key={title} className="flex flex-col">
              <span className="text-[13px] font-extrabold text-muted">{title}</span>
              <span className="font-display text-[22px] font-semibold">
                {leg.dep} {leg.fromCode} → {leg.arr} {leg.toCode}
              </span>
              <span className="text-[15px] font-semibold text-muted">{legNote(leg)}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[10px]">
          <a href="#" className={`${action} bg-primary text-white`}><Download />{t("download")}</a>
          <a href="#" className={`${action} bg-field text-ink`}><Calendar />{t("calendar")}</a>
          <a href="#" className={`${action} bg-field text-ink`}><Share />{t("share")}</a>
        </div>

        <div className="flex flex-wrap items-center gap-x-[18px] gap-y-[14px] rounded-[28px] bg-coral-soft px-6 py-5">
          <div className="flex flex-[1_1_300px] flex-col">
            <span className="font-display text-xl font-semibold">{t("remind.title")}</span>
            <span className="text-[15px] text-muted">{t("remind.text")}</span>
          </div>
          <RemindToggle />
        </div>

        <Link href="/" className="self-center py-[10px] font-extrabold">{t("home")}</Link>
      </main>
    </div>
  );
}
