import type { Metadata } from "next";
import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader, SignInLink } from "@/components/SiteHeader";
import { CurrencySelect } from "@/components/HeaderControls";
import { ResultsView, type ResultsTip } from "@/components/results/ResultsView";
import { cityByCode } from "@/data/airports";
import { intlLocale } from "@/lib/intl";
import { formatDayLong, formatRange } from "@/lib/dates";
import { dataMode, getFlexibleDateTip, searchFlightsCached } from "@/lib/flights";
import { paxTotal, searchHref, type MultiQuery } from "@/lib/search";
import { DateStrip } from "@/components/results/DateStrip";
import { Pirpir } from "@/components/characters";
import { parseSearch, validateSearchServer } from "@/lib/search-server";
import type { Offer } from "@/lib/providers/types";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "results" });
  return { title: t("metaTitle") };
}

/** Sonuçlardaki tüm havalimanlarının yerel şehir adları (dünya listesi tarayıcıya gönderilmez). */
function cityNamesFor(offers: Offer[], locale: string): Record<string, string> {
  const codes = new Set<string>();
  for (const o of offers)
    for (const leg of [o.outbound, o.inbound])
      for (const s of leg?.segments ?? []) {
        codes.add(s.fromCode);
        codes.add(s.toCode);
      }
  return Object.fromEntries([...codes].map((c) => [c, cityByCode(c, locale)]));
}

type Query = Record<string, string | string[] | undefined>;

const panel = "flex flex-col items-start gap-3 rounded-[28px] bg-field px-6 py-5";
const pill =
  "box-border inline-flex min-h-[44px] items-center rounded-pill bg-primary px-5 py-[10px] font-display font-semibold text-white no-underline";

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
  const error = validateSearchServer(q);
  const fromCity = q.from.map((c) => cityByCode(c, locale)).join(", ");
  const toCity = q.to.map((c) => cityByCode(c, locale)).join(", ");

  return (
    <div className="min-h-screen w-full bg-white">
      <SiteHeader width="page">
        <div className="flex items-center gap-2">
          <CurrencySelect />
          <SignInLink />
        </div>
      </SiteHeader>

      <main className="mx-auto flex max-w-page flex-col gap-5 px-6 pb-20 pt-2">
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
        ) : (
          <>
            {/* Arama her değiştiğinde (ör. tarih şeridinden) yükleme ekranı görünsün diye anahtarlı */}
            <Suspense key={JSON.stringify(q)} fallback={<ResultsLoading />}>
              <Results q={q} locale={locale} />
            </Suspense>
          </>
        )}
      </main>
    </div>
  );
}

/** Uçuş araması: sayfanın geri kalanı beklemeden görünür. */
async function Results({ q, locale }: { q: MultiQuery; locale: string }) {
  const t = await getTranslations("results");
  const loc = intlLocale(locale);
  let offers: Offer[] = [];
  let tip: ResultsTip = null;
  try {
    const [list, flex] = await Promise.all([searchFlightsCached(q), getFlexibleDateTip(q)]);
    offers = list;
    if (flex) {
      tip = { href: searchHref({ ...flex.query, returnDate: flex.query.returnDate ?? "" }), day: formatDayLong(flex.query.date, loc), price: flex.price, save: flex.save };
    }
  } catch (e) {
    console.error("Uçuş araması başarısız:", e);
    return (
      <div role="alert" className={panel}>
        <span className="font-display text-xl font-semibold">{t("failed.title")}</span>
        <span className="text-muted">{t("failed.text")}</span>
        <Link href={searchHref({ ...q, returnDate: q.returnDate ?? "" })} className={pill}>{t("failed.retry")}</Link>
      </div>
    );
  }
  const mode = dataMode();
  const note = mode === "demo" ? t("demoNote") : mode === "test" ? t("testNote") : undefined;
  // Şerit sonuçlar geldikten sonra çizilir: seçili günün fiyatı doğrudan bu sonuçlardan gelir (iki ayrı arama
  // farklı fiyat göstermesin) ve komşu günlerin aramaları ana aramayla yarışıp onu yavaşlatmaz.
  const cheapest = offers.length ? Math.min(...offers.map((o) => o.price)) : null;
  return (
    <>
      <DateStrip q={q} current={cheapest} />
      <ResultsView offers={offers} oneWay={!q.returnDate} tip={tip} note={note} cityNames={cityNamesFor(offers, locale)} />
    </>
  );
}

async function ResultsLoading() {
  const t = await getTranslations("results");
  return (
    <div className="flex flex-col items-center gap-4 pt-10 text-center">
      <Pirpir aria-hidden trail width={200} height={140} className="animate-bounce [animation-duration:2s]" />
      <p role="status" className="m-0 font-display text-xl font-semibold">{t("loading")}</p>
    </div>
  );
}
