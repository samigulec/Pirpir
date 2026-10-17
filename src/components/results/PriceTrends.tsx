"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useCurrency } from "../CurrencyProvider";
import { formatDayWithWeekday } from "@/lib/dates";
import { intlLocale } from "@/lib/intl";
import { addDays, searchHref, todayIso, type MultiQuery } from "@/lib/search";

const DAYS = 62;
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

/**
 * Fiyat trendleri (Kiwi'deki gibi): önümüzdeki iki ayın gidiş günlerine göre kişi başı en düşük fiyat, aynı
 * yolculuk süresiyle. Fiyatlar fiyat takviminden (son 24 saatte bulunanlar); yeni arama yapılmaz, aranmamış
 * günler boş kalır. Sütuna tıklayınca o gün aranır.
 */
export function PriceTrends({ q }: { q: MultiQuery }) {
  const t = useTranslations("results.trends");
  const { fmt, fmtShort } = useCurrency();
  const loc = intlLocale(useLocale());
  const router = useRouter();
  const tableId = useId();
  const [open, setOpen] = useState(false);
  const [prices, setPrices] = useState<Record<string, number> | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const nights = q.returnDate ? daysBetween(q.date, q.returnDate) : -1;
  const first = addDays(todayIso(), 1);

  const query = new URLSearchParams({
    from: q.from.join(","),
    to: q.to.join(","),
    cabin: q.cabin ?? "economy",
    first,
    days: String(DAYS),
    nights: String(nights),
  }).toString();

  useEffect(() => {
    if (!open || prices) return;
    const ctrl = new AbortController();
    fetch(`/api/calendar-prices?${query}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : { departs: {} }))
      .then((res: { departs?: Record<string, number> }) => setPrices(res.departs ?? {}))
      .catch(() => !ctrl.signal.aborted && setPrices({}));
    return () => ctrl.abort();
  }, [open, prices, query]);

  const days = useMemo(() => Array.from({ length: DAYS }, (_, i) => addDays(first, i)), [first]);
  const known = days.filter((d) => prices?.[d] !== undefined);
  const values = known.map((d) => prices![d]);
  const max = values.length ? Math.max(...values) : 0;
  const min = values.length ? Math.min(...values) : 0;
  const cheapest = known.find((d) => prices![d] === min);
  // Y ekseni: 0'dan başlar (sütun uzunluğu fiyatla orantılı), üstte yuvarlak bir değer
  const top = max ? niceCeil(max) : 0;
  const go = (d: string) =>
    router.push(searchHref({ ...q, date: d, returnDate: nights >= 0 ? addDays(d, nights) : "" }));

  const shown = hover ?? cheapest ?? null;

  return (
    <section className="flex flex-col gap-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 self-start rounded-pill border-2 border-solid border-line bg-white px-5 font-display text-base font-semibold text-ink"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
        </svg>
        {t("open")}
      </button>

      {open && (
        <div className="flex flex-col gap-3 rounded-[24px] border-2 border-solid border-line bg-white px-5 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="m-0 font-display text-xl font-semibold">{nights >= 0 ? t("title", { nights }) : t("titleOneWay")}</h2>
            {shown && prices?.[shown] !== undefined && (
              <span aria-live="polite" className="text-[15px] font-bold">
                {formatDayWithWeekday(shown, loc)}
                {nights >= 0 && ` – ${formatDayWithWeekday(addDays(shown, nights), loc)}`} · <span className="font-display">{fmt(prices[shown])}</span>
                {shown === cheapest && <span className="ml-2 text-green-text">{t("cheapest")}</span>}
              </span>
            )}
          </div>

          {prices === null ? (
            <div className="h-[180px] animate-pulse rounded-[16px] bg-field" />
          ) : known.length < 2 ? (
            <p className="m-0 text-muted">{t("empty")}</p>
          ) : (
            <>
              <div className="flex gap-2">
                {/* Y ekseni: üç değer */}
                <div aria-hidden="true" className="flex h-[180px] flex-col justify-between text-right text-[11px] font-bold text-muted">
                  <span>{fmtShort(top)}</span>
                  <span>{fmtShort(top / 2)}</span>
                  <span>{fmtShort(0)}</span>
                </div>
                <div className="min-w-0 flex-1 overflow-x-auto">
                  <div
                    className="relative flex h-[180px] min-w-[620px] items-end gap-[2px] border-0 border-b border-solid border-line"
                    onMouseLeave={() => setHover(null)}
                  >
                    {days.map((d) => {
                      const p = prices[d];
                      const isCurrent = d === q.date;
                      return (
                        <button
                          key={d}
                          type="button"
                          disabled={p === undefined}
                          onMouseEnter={() => setHover(d)}
                          onFocus={() => setHover(d)}
                          onClick={() => go(d)}
                          aria-label={`${formatDayWithWeekday(d, loc)} · ${p === undefined ? t("unknown") : fmt(p)}`}
                          className="group flex h-full min-w-0 flex-1 cursor-pointer items-end justify-center border-0 bg-transparent p-0 disabled:cursor-default"
                        >
                          {p !== undefined && (
                            <span
                              className={`block w-full max-w-[24px] rounded-t-[4px] ${
                                d === cheapest ? "bg-green-text" : isCurrent ? "bg-ink" : "bg-primary"
                              } ${hover === d ? "opacity-100" : hover ? "opacity-60" : ""}`}
                              style={{ height: `${Math.max(2, (p / top) * 100)}%` }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {/* X ekseni: iki haftada bir tarih */}
                  <div aria-hidden="true" className="flex min-w-[620px] gap-[2px] pt-1 text-[11px] font-bold text-muted">
                    {days.map((d, i) => (
                      <span key={d} className="flex-1 overflow-visible whitespace-nowrap text-left">
                        {i % 14 === 0 ? new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(d + "T00:00:00Z")) : ""}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-semibold text-muted">
                <span className="inline-flex items-center gap-1"><span aria-hidden="true" className="h-3 w-3 rounded-[3px] bg-green-text" />{t("legendCheapest")}</span>
                <span className="inline-flex items-center gap-1"><span aria-hidden="true" className="h-3 w-3 rounded-[3px] bg-ink" />{t("legendCurrent")}</span>
                <span>{t(q.bags ? "noteBags" : "note")}</span>
              </div>
              <details>
                <summary className="cursor-pointer text-[13px] font-extrabold text-primary">{t("table")}</summary>
                <table aria-describedby={tableId} className="mt-2 w-full border-collapse text-left text-[14px]">
                  <caption id={tableId} className="sr-only">{nights >= 0 ? t("title", { nights }) : t("titleOneWay")}</caption>
                  <thead>
                    <tr><th className="py-1 pr-4">{t("colDate")}</th><th className="py-1">{t("colPrice")}</th></tr>
                  </thead>
                  <tbody>
                    {known.map((d) => (
                      <tr key={d} className="border-0 border-t border-solid border-line">
                        <td className="py-1 pr-4">{formatDayWithWeekday(d, loc)}</td>
                        <td className="py-1 font-bold">{fmt(prices[d])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </>
          )}
        </div>
      )}
    </section>
  );
}

/** Eksen için yukarı yuvarlanmış "temiz" değer (1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8 × 10^n) */
function niceCeil(v: number): number {
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}
