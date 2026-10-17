import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader, SignInLink } from "@/components/SiteHeader";
import { CurrencySelect } from "@/components/HeaderControls";
import { ResultsView, type ResultsTip } from "@/components/results/ResultsView";
import { cityByCode } from "@/data/airports";
import { intlLocale } from "@/lib/intl";
import { formatDayLong, formatRange } from "@/lib/dates";
import { dataMode, getFlexibleDateTip, searchFlights } from "@/lib/flights";
import { parseSearch, paxTotal, searchHref, validateSearch } from "@/lib/search";
import type { Offer } from "@/lib/providers/types";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "results" });
  return { title: t("metaTitle") };
}

type Query = Record<string, string | string[] | undefined>;

export default async function ResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Query>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = intlLocale(locale);
  const q = parseSearch(await searchParams);
  const t = await getTranslations("results");
  const tSearch = await getTranslations("home.search");
  const error = validateSearch(q);
  const fromCity = cityByCode(q.from, locale);
  const toCity = cityByCode(q.to, locale);

  let offers: Offer[] = [];
  let failed = false;
  let tip: ResultsTip = null;
  if (!error) {
    try {
      const [list, flex] = await Promise.all([searchFlights(q), getFlexibleDateTip(q)]);
      offers = list;
      if (flex) {
        tip = { href: searchHref({ ...flex.query, returnDate: flex.query.returnDate ?? "" }), day: formatDayLong(flex.query.date, loc), price: flex.price, save: flex.save };
      }
    } catch (e) {
      console.error("Uçuş araması başarısız:", e);
      failed = true;
    }
  }
  const mode = dataMode();
  const note = mode === "demo" ? t("demoNote") : mode === "test" ? t("testNote") : undefined;
  const panel = "flex flex-col items-start gap-3 rounded-[28px] bg-field px-6 py-5";
  const pill =
    "box-border inline-flex min-h-[44px] items-center rounded-pill bg-primary px-5 py-[10px] font-display font-semibold text-white no-underline";

  return (
    <div className="min-h-screen w-full bg-white">
      <SiteHeader width="results">
        <div className="flex items-center gap-2">
          <CurrencySelect />
          <SignInLink />
        </div>
      </SiteHeader>

      <main className="mx-auto flex max-w-results flex-col gap-5 px-6 pb-20 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] bg-sky px-[22px] py-[18px]">
          <div className="flex flex-col">
            <span className="font-display text-[26px] font-semibold">
              {fromCity} → {toCity}
            </span>
            {!error && (
              <span className="font-semibold text-muted">
                {t("summaryMeta", { dates: formatRange(q.date, q.returnDate, loc), count: paxTotal(q.pax) })}
                {q.cabin && q.cabin !== "economy" && ` · ${t(`cabin.${q.cabin}`)}`}
              </span>
            )}
          </div>
          <Link
            href="/"
            className="box-border inline-flex min-h-[44px] items-center rounded-pill bg-white px-5 py-[10px] font-extrabold text-ink no-underline"
          >
            {t("change")}
          </Link>
        </div>

        {error ? (
          <div role="alert" className={panel}>
            <span className="font-display text-xl font-semibold">{t("invalid.title")}</span>
            <span className="text-muted">{tSearch(`errors.${error}`)}</span>
            <Link href="/" className={pill}>{t("invalid.back")}</Link>
          </div>
        ) : failed ? (
          <div role="alert" className={panel}>
            <span className="font-display text-xl font-semibold">{t("failed.title")}</span>
            <span className="text-muted">{t("failed.text")}</span>
            <Link href={searchHref({ ...q, returnDate: q.returnDate ?? "" })} className={pill}>{t("failed.retry")}</Link>
          </div>
        ) : (
          <ResultsView offers={offers} oneWay={!q.returnDate} tip={tip} note={note} />
        )}
      </main>
    </div>
  );
}
