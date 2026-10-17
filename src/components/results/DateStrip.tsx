"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCurrency } from "../CurrencyProvider";
import { formatDayWithWeekday } from "@/lib/dates";
import { intlLocale } from "@/lib/intl";
import { addDays, searchHref, todayIso, type MultiQuery } from "@/lib/search";
import type { DatePrice } from "@/lib/deals";

/**
 * Esnek tarih şeridi (Kiwi'deki gibi): aynı yolculuk süresiyle ±3 günün en düşük kişi başı fiyatı.
 * Fiyatlar sonuçlar gösterildikten sonra ayrı istekle gelir; sonuçları bekletmez.
 */
export function DateStrip({ q }: { q: MultiQuery }) {
  const t = useTranslations("results.dates");
  const { fmt } = useCurrency();
  const loc = intlLocale(useLocale());
  const [days, setDays] = useState<DatePrice[] | null>(null);
  const [failed, setFailed] = useState(false);
  const query = new URLSearchParams(searchHref(q).query).toString();

  useEffect(() => {
    const ctrl = new AbortController();
    setDays(null);
    setFailed(false);
    fetch(`/api/date-prices?${query}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((res: { days: DatePrice[] }) => setDays(res.days))
      .catch(() => !ctrl.signal.aborted && setFailed(true));
    return () => ctrl.abort();
  }, [query]);

  if (failed || (days && days.filter((d) => d.price !== null).length < 2)) return null;

  const prices = (days ?? []).map((d) => d.price).filter((p): p is number => p !== null);
  const min = prices.length ? Math.min(...prices) : null;

  return (
    <nav aria-label={t("label")} aria-busy={!days} className="-mx-1 overflow-x-auto px-1 pb-1">
      <ol className="m-0 flex min-w-max list-none gap-2 p-0">
        {(days ?? placeholders(q)).map((d) => {
          const current = d.date === q.date;
          const cheapest = d.price !== null && d.price === min;
          return (
            <li key={d.date}>
              <Link
                href={searchHref({ ...q, date: d.date, returnDate: d.returnDate ?? "" })}
                aria-current={current ? "date" : undefined}
                className={`flex min-h-[64px] min-w-[118px] flex-col justify-center rounded-[18px] border-2 border-solid px-3 py-2 text-ink no-underline ${
                  current ? "border-primary bg-sky" : "border-line bg-white"
                }`}
              >
                <span className="text-[13px] font-extrabold">
                  {formatDayWithWeekday(d.date, loc)}
                  {d.returnDate && <span className="font-bold text-muted"> – {formatDayWithWeekday(d.returnDate, loc)}</span>}
                </span>
                <span className={`font-display text-lg font-semibold ${cheapest ? "text-green-text" : ""}`}>
                  {!days ? <span className="inline-block h-4 w-14 animate-pulse rounded bg-line align-middle" /> : d.price === null ? "—" : fmt(d.price)}
                </span>
                {cheapest && <span className="text-[11px] font-extrabold uppercase text-green-text">{t("cheapest")}</span>}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Fiyatlar gelene kadar aynı tarihlerle iskelet */
function placeholders(q: MultiQuery): DatePrice[] {
  const today = todayIso();
  return [-3, -2, -1, 0, 1, 2, 3]
    .map((n) => ({ date: addDays(q.date, n), returnDate: q.returnDate ? addDays(q.returnDate, n) : undefined, price: null }))
    .filter((d) => d.date >= today);
}
