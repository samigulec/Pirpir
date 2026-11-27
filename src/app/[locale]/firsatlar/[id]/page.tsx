import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Bulut } from "@/components/characters";
import { DealNormalPrice, DealPrice } from "@/components/deals/DealPrice";
import { DealShare } from "@/components/deals/DealShare";
import { siteUrl } from "@/config/brand";
import { getPathname, Link } from "@/i18n/navigation";
import { cityByCode } from "@/data/airports";
import { formatPrice, toTry } from "@/lib/currency";
import { getRates, serverCurrency } from "@/lib/currency-server";
import { getPublishedDeal } from "@/lib/deal-store";
import { formatDayWithWeekday, formatRange } from "@/lib/dates";
import { intlLocale } from "@/lib/intl";
import { goHref } from "@/lib/outbound";
import { airlineName } from "@/lib/providers/travelpayouts";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const found = await getPublishedDeal(id);
  if (!found) return { title: "404" };
  const [t, rates, cur] = await Promise.all([
    getTranslations({ locale, namespace: "deals" }),
    getRates(),
    serverCurrency(),
  ]);
  const loc = intlLocale(locale);
  const route = `${cityByCode(found.deal.origin, locale)} → ${cityByCode(found.deal.destination, locale)}`;
  const price = formatPrice(toTry(found.deal.price_eur, "EUR", rates), cur, loc, rates);
  const dates = formatRange(found.deal.depart, found.deal.return_date ?? undefined, loc);
  const title = `${route} · ${price}`;
  const description = `${route} (${dates}) · ${t("metaDescription")}`;
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const [found, t, rates] = await Promise.all([
    getPublishedDeal(id),
    getTranslations("deals"),
    getRates(),
  ]);
  if (!found) notFound();

  const { deal, siblings } = found;
  const loc = intlLocale(locale);
  const fromCity = cityByCode(deal.origin, locale);
  const toCity = cityByCode(deal.destination, locale);
  const route = `${fromCity} → ${toCity}`;
  const priceTry = toTry(deal.price_eur, "EUR", rates);
  const medianTry = toTry(deal.median_eur, "EUR", rates);
  const pct = deal.median_eur > 0 ? Math.round(((deal.median_eur - deal.price_eur) / deal.median_eur) * 100) : 0;
  const dates = formatRange(deal.depart, deal.return_date ?? undefined, loc);
  const shareUrl = `${siteUrl()}${getPathname({ href: { pathname: "/firsatlar/[id]", params: { id: deal.id } }, locale })}`;

  const stopsLabel = (n: number | null) =>
    n === null ? null : n === 0 ? t("direct") : n === 1 ? t("oneStop") : t("stops", { n });

  return (
    <div className="min-h-screen w-full bg-white">
      <SiteHeader width="results" />
      <main className="mx-auto flex max-w-results flex-col gap-6 px-4 pb-20 pt-2 md:px-6">
        <div>
          <Link href="/firsatlar" className="inline-flex min-h-[44px] items-center font-extrabold text-primary no-underline hover:underline">
            ← {t("allDeals")}
          </Link>
        </div>

        <section className="flex flex-col items-start justify-between gap-5 rounded-[40px] bg-sky px-6 py-7 md:flex-row md:items-center md:px-8 md:py-8">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-pill bg-white px-3 py-1 text-xs font-extrabold text-ink">
                {deal.return_date ? t("roundTrip") : t("oneWay")} · {deal.origin} → {deal.destination}
              </span>
              {pct > 0 && (
                <span className="rounded-pill bg-green-soft px-3 py-1 text-xs font-extrabold text-green-text">
                  {t("saveBadge", { pct })}
                </span>
              )}
            </div>

            <h1 className="m-0 font-display text-[32px] font-bold leading-[1.1] text-ink md:text-[40px]">
              {fromCity} → {toCity}
            </h1>

            <div className="mt-1 flex flex-wrap items-baseline gap-3">
              <DealPrice amountTry={priceTry} className="font-display text-[36px] font-bold leading-none text-ink" />
              <span className="text-sm font-bold text-muted">{t("perPerson")}</span>
              <span className="text-sm font-bold text-muted line-through">
                <DealNormalPrice amountTry={medianTry} label={t("normalPrice", { price: "{price}" })} />
              </span>
            </div>

            <p className="m-0 text-sm font-bold text-muted">
              {formatRange(deal.depart, deal.return_date ?? undefined, loc)}
              {deal.seen_at && ` · ${t("seenOn", { date: formatDayWithWeekday(deal.seen_at, loc) })}`}
            </p>
          </div>
          <Bulut aria-hidden width={128} height={96} className="flex-none" />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="m-0 font-display text-2xl font-bold text-ink">{t("datesTitle")}</h2>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {siblings.map((d) => {
              const rowTry = toTry(d.price_eur, "EUR", rates);
              const stops = stopsLabel(d.transfers);
              const href = goHref(
                {
                  from: d.origin,
                  to: d.destination,
                  date: d.depart,
                  returnDate: d.return_date ?? undefined,
                  adults: 1,
                  children: 0,
                  infants: 0,
                  cabin: "economy",
                  deep: d.link ?? undefined,
                },
                `deal:${d.id}`,
                locale,
              );
              return (
                <li
                  key={d.id}
                  className="flex flex-col gap-3 rounded-[24px] border-2 border-solid border-line bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-display text-lg font-bold text-ink">
                      {formatRange(d.depart, d.return_date ?? undefined, loc)}
                    </span>
                    <span className="text-sm font-bold text-muted">
                      {[
                        d.return_date ? t("roundTrip") : t("oneWay"),
                        d.airline ? airlineName(d.airline) : null,
                        stops,
                        d.seen_at ? t("seenOn", { date: formatDayWithWeekday(d.seen_at, loc) }) : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <DealPrice amountTry={rowTry} className="font-display text-2xl font-bold text-ink" />
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="inline-flex min-h-[44px] items-center whitespace-nowrap rounded-pill bg-primary px-5 font-display text-[16px] font-semibold text-white no-underline hover:bg-primary-dark"
                    >
                      {t("goDeal")}
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <DealShare route={route} priceTry={priceTry} dates={dates} url={shareUrl} />

        <p className="m-0 rounded-[20px] bg-field px-5 py-4 text-sm font-semibold text-muted">{t("priceNote")}</p>
      </main>
      <SiteFooter />
    </div>
  );
}
