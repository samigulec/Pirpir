import type { Metadata } from "next";
import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import type { ResultsTip } from "@/components/results/ResultsView";
import { LiveResults, type LiveChunk } from "@/components/results/LiveResults";
import { cityByCode } from "@/data/airports";
import { intlLocale } from "@/lib/intl";
import { formatDayLong, formatRange } from "@/lib/dates";
import { dataMode, getFlexibleDateTip, searchFlightsCached, watchSearch } from "@/lib/flights";
import { paxTotal, searchHref, todayIso, type MultiQuery } from "@/lib/search";
import { ResultsSearchBar } from "@/components/results/ResultsSearchBar";
import { cheapestWithBags } from "@/lib/extras";
import { Pirpir } from "@/components/characters";
import { flexQueries, parseSearch, validateSearchServer } from "@/lib/search-server";
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

// Parça parça arama havayollarını bekler; varsayılan süre sınırına takılmasın.
export const maxDuration = 60;

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
      <SiteHeader width="page" />

      <main className="mx-auto flex max-w-page flex-col gap-5 px-4 pb-20 pt-2 md:px-6">
        <h1 className="sr-only">
          {fromCity} → {toCity}
          {!error && ` · ${t("summaryMeta", { dates: formatRange(q.date, q.returnDate, loc), count: paxTotal(q.pax) })}`}
        </h1>
        {/* Arama her değişince yeniden kurulur: tarih şeridinden gelince de alanlar güncel olsun */}
        <ResultsSearchBar
          key={JSON.stringify(q)}
          from={q.from.map((code) => ({ code, label: cityByCode(code, locale) }))}
          to={q.to.map((code) => ({ code, label: cityByCode(code, locale) }))}
          initial={{
            trip: q.returnDate ? "rt" : "ow",
            date: q.date,
            returnDate: q.returnDate ?? "",
            pax: q.pax,
            cabin: q.cabin ?? "economy",
            flex: q.flex ?? 0,
            bags: q.bags,
          }}
          today={todayIso()}
        />

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

/** Esnek aramada birleştirilen listede en fazla bu kadar teklif (en ucuzlar). */
const MAX_FLEX_RESULTS = 120;

/**
 * Arama zinciri: ilk halka ilk teklifler (ya da önbellekten tüm sonuç) gelince çözülür, sonrakiler havayolları
 * yanıt verdikçe. Esnek aramada komşu günlerin sonuçları da (`extras`) geldikçe eklenir.
 * Son halka (`done`) her günün önbelleğe yazılan listelerinin birleşimidir.
 */
function liveChain(q: MultiQuery, locale: string, extras: Promise<Offer[]>[]): Promise<LiveChunk> {
  let resolve!: (c: LiveChunk) => void;
  let reject!: (e: unknown) => void;
  const make = () => new Promise<LiveChunk>((res, rej) => ((resolve = res), (reject = rej)));
  const first = make();
  let main: Offer[] = [];
  let mainDone = false;
  const extra: Offer[][] = extras.map(() => []);
  let extrasLeft = extras.length;
  let dirty = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastSent = 0;
  let done = false;
  const merged = () =>
    extras.length ? [...main, ...extra.flat()].sort((a, b) => a.price - b.price).slice(0, MAX_FLEX_RESULTS) : main;
  const chunk = (last: boolean): LiveChunk => {
    const offers = merged();
    return {
      offers,
      cityNames: cityNamesFor(offers, locale),
      done: last,
      // Tarih şeridindeki seçili gün: yalnızca seçilen günün en ucuzu
      dayPrice: mainDone ? cheapestWithBags(main, q.bags) : undefined,
    };
  };
  // Ara sonuçlar en sık 600 ms'de bir gönderilir (çok havayolu peş peşe yanıt verirse sayfa titremesin)
  const flush = () => {
    timer = null;
    if (done || !dirty) return;
    dirty = false;
    lastSent = Date.now();
    const send = resolve;
    const next = make();
    send({ ...chunk(false), next });
  };
  const changed = () => {
    if (mainDone && extrasLeft === 0) {
      done = true;
      if (timer) clearTimeout(timer);
      resolve(chunk(true));
      return;
    }
    dirty = true;
    timer ??= setTimeout(flush, Math.max(0, 600 - (Date.now() - lastSent)));
  };
  const { result } = watchSearch(q, (offers) => {
    main = offers;
    changed();
  });
  result.then(
    (offers) => {
      main = offers;
      mainDone = true;
      changed();
    },
    (e) => {
      done = true;
      if (timer) clearTimeout(timer);
      reject(e);
    },
  );
  extras.forEach((p, i) =>
    p.then((offers) => {
      extra[i] = offers;
      extrasLeft--;
      if (!done) changed();
    }),
  );
  return first;
}

/** Komşu günler en fazla 3'er 3'er aranır (sağlayıcının istek sınırı); hata olan gün boş sayılır. */
function flexSearches(q: MultiQuery): Promise<Offer[]>[] {
  const days = flexQueries(q);
  let running = 0;
  const queue: (() => void)[] = [];
  const slot = () => new Promise<void>((r) => (running < 3 ? (running++, r()) : queue.push(() => (running++, r()))));
  const release = () => {
    running--;
    queue.shift()?.();
  };
  return days.map(async (d) => {
    await slot();
    try {
      return await searchFlightsCached(d);
    } catch (e) {
      console.error("Esnek gün araması başarısız:", d.date, e instanceof Error ? e.message : e);
      return [];
    } finally {
      release();
    }
  });
}

/** Uçuş araması: sayfanın geri kalanı beklemeden görünür; uçuşlar geldikçe listeye eklenir. */
async function Results({ q, locale }: { q: MultiQuery; locale: string }) {
  const t = await getTranslations("results");
  const loc = intlLocale(locale);
  let first: LiveChunk;
  let tip: ResultsTip = null;
  try {
    const [chunk, flex] = await Promise.all([liveChain(q, locale, flexSearches(q)), q.flex ? null : getFlexibleDateTip(q)]);
    first = chunk;
    if (flex) {
      tip = { href: searchHref({ ...flex.query, returnDate: flex.query.returnDate ?? "" }), day: formatDayLong(flex.query.date, loc), price: flex.price, save: flex.save };
    }
  } catch (e) {
    console.error("Uçuş araması başarısız:", e);
    // Test modunda nedeni de gösterilir (sorunu bulmak için); canlıda müşteriye teknik ayrıntı gösterilmez
    const status = (e as { status?: number } | null)?.status;
    const detail = dataMode() === "test" ? [status, e instanceof Error ? e.message : String(e)].filter(Boolean).join(" · ").slice(0, 300) : undefined;
    return <SearchFailed q={q} detail={detail} />;
  }
  const mode = dataMode();
  const modeNote = mode === "demo" ? t("demoNote") : mode === "test" ? t("testNote") : undefined;
  const note = [q.flex ? t("flexNote", { n: q.flex }) : undefined, modeNote].filter(Boolean).join(" · ") || undefined;
  return (
    <LiveResults first={first} q={q} oneWay={!q.returnDate} initialBags={q.bags} tip={tip} note={note} retryHref={searchHref({ ...q, returnDate: q.returnDate ?? "" })} />
  );
}

async function SearchFailed({ q, detail }: { q: MultiQuery; detail?: string }) {
  const t = await getTranslations("results");
  return (
    <div role="alert" className={panel}>
      <span className="font-display text-xl font-semibold">{t("failed.title")}</span>
      <span className="text-muted">{t("failed.text")}</span>
      {detail && <code className="rounded-[10px] bg-white px-3 py-2 text-[13px] text-muted">{detail}</code>}
      <Link href={searchHref({ ...q, returnDate: q.returnDate ?? "" })} className={pill}>{t("failed.retry")}</Link>
    </div>
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
