"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCurrency } from "../CurrencyProvider";
import { formatDayWithWeekday } from "@/lib/dates";
import { intlLocale } from "@/lib/intl";
import { addDays, searchHref, todayIso, type MultiQuery } from "@/lib/search";

type Day = { date: string; returnDate?: string };

// Sayfalar arasında gezinirken bilinen günler kısa süre yeniden istenmez (komşu tarihler çoğunlukla aynıdır).
// Süre sunucudaki arama önbelleğinden kısa: eski bir fiyat, o güne tıklayınca çıkan sonuçla çelişmesin.
const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { price: number | null; at: number }>();
const known = {
  has: (k: string) => {
    const e = cache.get(k);
    return !!e && Date.now() - e.at < TTL_MS;
  },
  get: (k: string) => cache.get(k)!.price,
  set: (k: string, price: number | null) => cache.set(k, { price, at: Date.now() }),
};

const dayQuery = (q: MultiQuery, d: Day) => new URLSearchParams(searchHref({ ...q, ...d, returnDate: d.returnDate ?? "" }).query).toString();

/**
 * Esnek tarih şeridi (Kiwi'deki gibi): aynı yolculuk süresiyle ±3 günün en düşük kişi başı fiyatı.
 * Her gün ayrı ve paralel istenir; fiyatlar geldikçe görünür; seçili gün sonuçlardan gelir.
 */
export function DateStrip({ q, current }: { q: MultiQuery; current: number | null }) {
  const t = useTranslations("results.dates");
  const { fmt } = useCurrency();
  const loc = intlLocale(useLocale());
  const today = todayIso();
  const days: Day[] = [-3, -2, -1, 0, 1, 2, 3]
    .map((n) => ({ date: addDays(q.date, n), returnDate: q.returnDate ? addDays(q.returnDate, n) : undefined }))
    .filter((d) => d.date >= today);
  const keys = days.map((d) => dayQuery(q, d));
  // Seçili günün fiyatı aşağıdaki sonuçların en ucuzudur; ayrıca istenmez.
  const currentKey = dayQuery(q, { date: q.date, returnDate: q.returnDate });
  // İlk çizim sunucuyla aynı olsun: tarayıcıdaki bilinen günler efektte eklenir.
  const [prices, setPrices] = useState<Record<string, number | null>>(() => ({ [currentKey]: current }));
  const signature = keys.join("|");

  useEffect(() => {
    known.set(currentKey, current);
    const ctrl = new AbortController();
    setPrices(Object.fromEntries(signature.split("|").filter((k) => known.has(k)).map((k) => [k, known.get(k)!])));
    for (const key of signature.split("|")) {
      if (known.has(key)) continue;
      fetch(`/api/date-prices?${key}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : { price: null }))
        .then((res: { price: number | null }) => {
          known.set(key, res.price);
          setPrices((p) => ({ ...p, [key]: res.price }));
        })
        .catch(() => {
          if (!ctrl.signal.aborted) setPrices((p) => ({ ...p, [key]: null }));
        });
    }
    return () => ctrl.abort();
  }, [signature, currentKey, current]);

  const found = Object.values(prices).filter((p): p is number => typeof p === "number");
  const allDone = keys.every((k) => k in prices);
  const min = allDone && found.length > 1 ? Math.min(...found) : null;
  if (allDone && found.length < 2) return null;

  return (
    <nav aria-label={t("label")} aria-busy={!allDone} className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
      <ol className="m-0 flex min-w-max list-none gap-2 p-0 md:min-w-0">
        {days.map((d, i) => {
          const key = keys[i];
          const price = prices[key];
          const current = d.date === q.date;
          const cheapest = min !== null && price === min;
          return (
            <li key={key} className="md:min-w-0 md:flex-1">
              <Link
                href={searchHref({ ...q, ...d, returnDate: d.returnDate ?? "" })}
                aria-current={current ? "date" : undefined}
                className={`flex min-h-[64px] min-w-[112px] flex-col justify-center rounded-[18px] border-2 border-solid px-3 py-2 text-ink no-underline hover:border-primary ${
                  current ? "border-primary bg-sky" : "border-line bg-white"
                }`}
              >
                <span className="text-[13px] font-extrabold">
                  {formatDayWithWeekday(d.date, loc)}
                  {d.returnDate && <span className="block font-bold text-muted">– {formatDayWithWeekday(d.returnDate, loc)}</span>}
                </span>
                <span className={`font-display text-lg font-semibold ${cheapest ? "text-green-text" : ""}`}>
                  {price === undefined ? (
                    <span className="inline-block h-4 w-14 animate-pulse rounded bg-line align-middle" />
                  ) : price === null ? (
                    "—"
                  ) : (
                    fmt(price)
                  )}
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
