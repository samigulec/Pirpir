import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Bulut } from "@/components/characters";
import { DealNormalPrice, DealPrice } from "@/components/deals/DealPrice";
import { Link } from "@/i18n/navigation";
import { cityByCode } from "@/data/airports";
import { toTry } from "@/lib/currency";
import { getRates } from "@/lib/currency-server";
import { listPublishedDeals, type DealRow } from "@/lib/deal-store";
import { formatDayWithWeekday, formatRange } from "@/lib/dates";
import { intlLocale } from "@/lib/intl";
import { airlineName } from "@/lib/providers/travelpayouts";
import { alternatesFor } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "deals" });
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    title,
    description,
    alternates: alternatesFor("/firsatlar", locale),
    openGraph: { title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

type RouteGroup = { best: DealRow; count: number };

function groupByRoute(deals: DealRow[]): RouteGroup[] {
  const map = new Map<string, RouteGroup>();
  for (const d of deals) {
    const k = `${d.origin}>${d.destination}`;
    const existing = map.get(k);
    if (!existing) {
      map.set(k, { best: d, count: 1 });
    } else {
      existing.count++;
      if (d.price_eur < existing.best.price_eur) existing.best = d;
    }
  }
  return [...map.values()].sort((a, b) => a.best.price_eur - b.best.price_eur);
}

export default async function DealsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("deals");
  const loc = intlLocale(locale);
  const [deals, rates] = await Promise.all([listPublishedDeals(120), getRates()]);
  const groups = groupByRoute(deals);

  const stopsLabel = (n: number | null) =>
    n === null ? null : n === 0 ? t("direct") : n === 1 ? t("oneStop") : t("stops", { n });

  return (
    <div className="min-h-screen w-full bg-white">
      <SiteHeader width="page" />
      <main className="mx-auto flex max-w-page flex-col gap-7 px-4 pb-20 pt-2 md:px-6">
        <section className="flex flex-col items-start justify-between gap-5 rounded-[40px] bg-sky px-6 py-7 md:flex-row md:items-center md:px-9 md:py-9">
          <div className="flex max-w-[640px] flex-col gap-2">
            <span className="text-sm font-extrabold text-primary">{t("heroEyebrow")}</span>
            <h1 className="m-0 font-display text-[32px] font-bold leading-[1.1] text-ink md:text-[42px]">
              {t("heroTitle")}
            </h1>
            <p className="m-0 font-display text-lg font-semibold text-ink">{t("heroQuote")}</p>
            <p className="m-0 text-[15px] font-semibold text-muted">{t("heroSubtitle")}</p>
          </div>
          <Bulut aria-hidden width={140} height={104} className="flex-none" />
        </section>

        {groups.length === 0 ? (
          <section className="flex flex-col items-center gap-3 rounded-[32px] border-2 border-solid border-line bg-field px-6 py-12 text-center">
            <h2 className="m-0 font-display text-2xl font-bold text-ink">{t("emptyTitle")}</h2>
            <p className="m-0 max-w-[460px] text-[15px] font-semibold text-muted">{t("emptyText")}</p>
            <Link
              href="/"
              className="mt-2 inline-flex min-h-[48px] items-center rounded-pill bg-primary px-6 font-display text-lg font-semibold text-white no-underline"
            >
              {t("searchFlights")}
            </Link>
          </section>
        ) : (
          <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-2 lg:grid-cols-3">
            {groups.map(({ best, count }) => {
              const fromCity = cityByCode(best.origin, locale);
              const toCity = cityByCode(best.destination, locale);
              const priceTry = toTry(best.price_eur, "EUR", rates);
              const medianTry = toTry(best.median_eur, "EUR", rates);
              const pct = best.median_eur > 0 ? Math.round(((best.median_eur - best.price_eur) / best.median_eur) * 100) : 0;
              const stops = stopsLabel(best.transfers);
              return (
                <li key={best.id} className="flex">
                  <Link
                    href={{ pathname: "/firsatlar/[id]", params: { id: best.id } }}
                    className="flex w-full flex-col justify-between gap-4 rounded-[28px] border-2 border-solid border-line bg-white p-6 text-ink no-underline transition-colors hover:border-primary"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-pill bg-field px-3 py-1 text-xs font-extrabold text-muted">
                          {best.return_date ? t("roundTrip") : t("oneWay")} · {best.origin} → {best.destination}
                        </span>
                        {pct > 0 && (
                          <span className="rounded-pill bg-green-soft px-3 py-1 text-xs font-extrabold text-green-text">
                            {t("saveBadge", { pct })}
                          </span>
                        )}
                      </div>

                      <h2 className="m-0 font-display text-2xl font-bold leading-snug text-ink">
                        {fromCity} → {toCity}
                      </h2>

                      <p className="m-0 text-sm font-bold text-muted">
                        {formatRange(best.depart, best.return_date ?? undefined, loc)}
                        {best.airline && ` · ${airlineName(best.airline)}`}
                        {stops && ` · ${stops}`}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 border-0 border-t border-solid border-line pt-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <div>
                          <DealPrice amountTry={priceTry} className="font-display text-[28px] font-bold leading-none text-ink" />
                          <span className="ml-1.5 text-xs font-bold text-muted">{t("perPerson")}</span>
                        </div>
                        <span className="text-xs font-bold text-muted line-through">
                          <DealNormalPrice amountTry={medianTry} label={t("normalPrice", { price: "{price}" })} />
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs font-bold text-muted">
                        <span>{best.seen_at ? t("seenOn", { date: formatDayWithWeekday(best.seen_at, loc) }) : ""}</span>
                        <span className="font-extrabold text-primary">
                          {count > 1 ? t("datesCount", { n: count }) : t("viewDeal")} →
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <p className="m-0 rounded-[20px] bg-field px-5 py-4 text-sm font-semibold text-muted">{t("priceNote")}</p>
      </main>
      <SiteFooter />
    </div>
  );
}
