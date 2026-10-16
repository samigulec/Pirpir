import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SiteHeader, SignInLink } from "@/components/SiteHeader";
import { CurrencySelect } from "@/components/HeaderControls";
import { ResultsView } from "@/components/results/ResultsView";
import { formatDayLong, formatRange } from "@/lib/dates";
import { getDefaultSearch, getFlexibleDateTip, paxCount, searchFlights, searchHref, type SearchParams } from "@/lib/flights";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("results");
  return { title: t("metaTitle") };
}

type Query = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ResultsPage({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const d = getDefaultSearch();
  const params: SearchParams = {
    from: one(q.from) || d.from,
    to: one(q.to) || d.to,
    date: one(q.date) || d.date,
    // "return" yoksa ve tarih de verilmemişse varsayılan gidiş-dönüş; verilmiş tarihte yoksa tek yön.
    returnDate: one(q.return) ?? (one(q.date) ? undefined : d.returnDate),
    pax: one(q.pax),
  };
  const oneWay = !params.returnDate;

  const t = await getTranslations("results");
  const [offers, tip] = await Promise.all([searchFlights(params), getFlexibleDateTip(params)]);

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
              {params.from} → {params.to}
            </span>
            <span className="font-semibold text-muted">
              {t("summaryMeta", { dates: formatRange(params.date, params.returnDate), count: paxCount(params.pax) })}
            </span>
          </div>
          <Link
            href="/"
            className="box-border inline-flex min-h-[44px] items-center rounded-pill bg-white px-5 py-[10px] font-extrabold text-ink no-underline"
          >
            {t("change")}
          </Link>
        </div>

        <ResultsView
          offers={offers}
          oneWay={oneWay}
          tip={{
            href: searchHref({ ...params, date: tip.date }),
            day: formatDayLong(tip.date),
            price: tip.price,
            save: tip.save,
          }}
        />
      </main>
    </div>
  );
}
