import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LogoMark } from "@/components/Logo";
import { PdfLink } from "@/components/account/PdfLink";
import { PrintButton } from "@/components/booking/PrintButton";
import { Download } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { getBookingOrSample } from "@/lib/sample-booking";
import { serverCurrency } from "@/lib/currency-server";
import { planData } from "@/lib/pdf/plan-data";
import { one, type Raw } from "@/lib/search";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "confirm.plan" });
  return { title: t("metaTitle"), robots: { index: false } };
}

const tones = { green: "bg-green-soft text-green-text", sun: "bg-sun-soft text-sun-text", muted: "bg-line text-muted" };

/**
 * Seyahat planı (e-bilet değildir). İndirilen PDF ile aynı veriden çizilir; yazdırınca da tek A4 sayfaya sığar.
 */
export default async function TripPlanPage({ params, searchParams }: { params: Promise<{ locale: string; teklifId: string }>; searchParams: Promise<Raw> }) {
  const { locale, teklifId } = await params;
  setRequestLocale(locale);
  const booking = await getBookingOrSample(decodeURIComponent(teklifId));
  if (!booking) notFound();
  const tp = await getTranslations("confirm.plan");
  const d = await planData(booking, locale, await serverCurrency(one((await searchParams).cur)));
  const label = "text-[11px] font-extrabold uppercase tracking-[0.06em] text-muted";

  return (
    <main className="mx-auto flex max-w-form flex-col gap-4 px-4 md:px-6 py-8 print:max-w-none print:gap-[10px] print:p-0 print:text-[14px]">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={{ pathname: "/rezervasyon/[teklifId]/onay", params: { teklifId: booking.id } }} className="py-2 font-bold">
          ← {tp("back")}
        </Link>
        <span className="flex flex-wrap gap-2">
          <PdfLink
            bookingId={booking.id}
            className="box-border inline-flex min-h-[48px] items-center gap-2 rounded-pill bg-primary px-6 py-3 font-display text-lg font-semibold text-white no-underline"
          >
            <Download size={20} />
            {tp("download")}
          </PdfLink>
          <PrintButton label={tp("print")} tone="soft" />
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <LogoMark size={32} />
          <span className="font-display text-2xl font-bold">{d.brand}</span>
        </span>
        <h1 className="m-0 font-display text-base font-semibold uppercase tracking-[0.1em] text-muted">{d.docTitle}</h1>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-[24px] bg-sky px-5 py-4 print:py-3">
        <div className="flex min-w-0 flex-[1_1_260px] flex-col">
          <span className="font-display text-[28px] font-bold leading-[1.15]">{d.route}</span>
          {d.sample && <span className="text-[13px] font-bold text-muted">{d.sample}</span>}
        </div>
        <div className="flex flex-col items-center rounded-[18px] bg-white px-6 py-3">
          <span className={label}>{d.pnrLabel}</span>
          <span className="font-display text-[26px] font-bold tracking-[0.12em]">{d.pnr}</span>
          <span className={`mt-1 rounded-pill px-3 py-[2px] text-[13px] font-extrabold ${tones[d.status.tone]}`}>{d.status.text}</span>
        </div>
      </div>

      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 rounded-[18px] border-2 border-solid border-line px-5 py-4 sm:grid-cols-4 print:grid-cols-4 print:py-3">
        {d.facts.map((f) => (
          <div key={f.label} className="flex min-w-0 flex-col">
            <dt className={label}>{f.label}</dt>
            <dd className="m-0 break-words font-bold">{f.value}</dd>
          </div>
        ))}
      </dl>

      {d.legs.map((leg) => (
        <section key={leg.title} className="overflow-hidden rounded-[20px] border-2 border-solid border-line print:break-inside-avoid">
          <div className="flex flex-wrap justify-between gap-2 bg-field px-5 py-2">
            <h2 className="m-0 text-[13px] font-extrabold uppercase tracking-[0.06em]">{leg.title}</h2>
            <span className="flex items-center gap-[6px] text-[13px] font-bold text-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {leg.logo && <img src={leg.logo} alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" />}
              {leg.airline}
            </span>
          </div>
          <div className="flex items-center gap-3 px-5 py-4 print:py-2">
            <span className="flex w-[110px] flex-none flex-col">
              <span className="font-display text-[30px] font-bold leading-none print:text-[24px]">{leg.dep}</span>
              <span className="mt-1 font-extrabold">{leg.fromCode}</span>
              <span className="text-sm text-muted">{leg.fromCity}</span>
            </span>
            <span className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[13px] font-bold text-muted">
              <span>{leg.duration}</span>
              <span aria-hidden="true" className="flex w-full items-center gap-1">
                <span className="h-2 w-2 flex-none rounded-full bg-primary" />
                <span className="h-0 flex-1 border-0 border-t-2 border-dashed border-line" />
                <span className="h-2 w-2 flex-none rounded-full bg-coral" />
              </span>
              <span className="text-center">{leg.stops}</span>
            </span>
            <span className="flex w-[110px] flex-none flex-col items-end text-right">
              <span className="font-display text-[30px] font-bold leading-none print:text-[24px]">
                {leg.arr}
                {leg.nextDay && <sup className="ml-1 text-[12px] font-extrabold text-coral-text">{leg.nextDay}</sup>}
              </span>
              <span className="mt-1 font-extrabold">{leg.toCode}</span>
              <span className="text-sm text-muted">{leg.toCity}</span>
            </span>
          </div>
          {leg.segments.map((g, i) => (
            <div key={i}>
              <div className="flex flex-wrap gap-x-4 gap-y-1 border-0 border-t border-solid border-line px-5 py-2 text-sm">
                <span className="font-extrabold">{g.flight}</span>
                <span className="font-bold">{g.route}</span>
                <span>{g.times}</span>
                {g.aircraft && <span className="ml-auto text-muted">{g.aircraft}</span>}
              </div>
              {g.layover && (
                <div className="border-0 border-t border-solid border-line bg-sun-soft px-5 py-1 text-sm font-bold text-sun-text">{g.layover}</div>
              )}
            </div>
          ))}
        </section>
      ))}

      {d.passengers.length > 0 && (
        <section className="flex flex-col print:break-inside-avoid">
          <h2 className="m-0 mb-1 font-display text-lg font-semibold">{d.passengersTitle}</h2>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-0 border-b-2 border-solid border-line">
                <th className={`${label} py-1`}>{d.passengerCol}</th>
                <th className={`${label} py-1`}>{d.bagsCol}</th>
              </tr>
            </thead>
            <tbody>
              {d.passengers.map((p, i) => (
                <tr key={i} className="border-0 border-b border-solid border-line">
                  <td className="py-2 pr-3 font-bold print:py-1">{p.name}</td>
                  <td className="py-2 print:py-1">{p.bags}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {d.bagNotes.map((n) => (
            <p key={n} className="m-0 mt-1 text-[13px] text-muted">{n}</p>
          ))}
        </section>
      )}

      <div className="grid gap-3 sm:grid-cols-2 print:grid-cols-2 print:break-inside-avoid">
        {d.rules.length > 0 && (
          <section className="rounded-[18px] bg-field px-5 py-4 print:py-3">
            <h2 className="m-0 mb-1 font-display text-lg font-semibold">{d.rulesTitle}</h2>
            <ul className="m-0 list-disc pl-5 text-[15px]">{d.rules.map((r) => <li key={r}>{r}</li>)}</ul>
          </section>
        )}
        <section className="rounded-[18px] bg-sun-soft px-5 py-4 print:py-3">
          <h2 className="m-0 mb-1 font-display text-lg font-semibold">{d.infoTitle}</h2>
          <ul className="m-0 list-disc pl-5 text-[15px]">{d.info.map((r) => <li key={r}>{r}</li>)}</ul>
        </section>
      </div>

      <p className="m-0 text-sm text-muted">{d.note}</p>
      <p className="m-0 border-0 border-t border-solid border-line pt-2 text-[12px] text-muted">{d.footer}</p>
    </main>
  );
}
