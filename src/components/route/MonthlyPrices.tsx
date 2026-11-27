"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatDayShort, monthNames } from "@/lib/dates";
import { intlLocale } from "@/lib/intl";
import type { MonthPoint } from "@/lib/route-data";
import { searchHref } from "@/lib/search";
import { useCurrency } from "../CurrencyProvider";

export function MonthlyPrices({
  months,
  defaultMonth,
  fromCode,
  toCode,
  live,
}: {
  months: MonthPoint[];
  defaultMonth: number;
  fromCode: string;
  toCode: string;
  live: boolean;
}) {
  const t = useTranslations("route.monthly");
  const tr = useTranslations("route");
  const { fmt, fmtShort } = useCurrency();
  const [month, setMonth] = useState(defaultMonth);

  const loc = intlLocale(useLocale());
  const names = monthNames(loc, "long");
  const short = monthNames(loc, "short");

  const known = months.map((m) => m.price).filter((p): p is number => p !== null);
  const max = known.length ? Math.max(...known) : 0;
  const min = known.length ? Math.min(...known) : 0;

  const selected = months[month] ?? months[0];
  const selectedPrice = selected?.price ?? null;
  const diff = selectedPrice !== null ? selectedPrice - min : null;
  const monthSearchHref = searchHref({
    from: fromCode,
    to: toCode,
    date: selected?.date ?? `${selected?.ym}-10`,
    returnDate: selected?.returnDate,
  });

  return (
    <section className="flex flex-col gap-[18px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-[2px]">
          <h2 className="m-0 font-display text-[36px] font-bold">{t("title")}</h2>
          <span className="font-semibold text-muted">{t("subtitle")}</span>
        </div>
        <div aria-live="polite" className="flex min-w-[256px] flex-col gap-[2px] rounded-[20px] bg-field px-[18px] py-3">
          <span className="text-sm font-extrabold text-muted">{names[month]}</span>
          {selectedPrice !== null ? (
            <>
              <span className="font-display text-[28px] font-bold leading-[1.15]">{fmt(selectedPrice)}</span>
              <span className="text-sm font-bold text-green-text">
                {diff === 0 ? t("cheapest") : t("diff", { price: fmt(diff ?? 0) })}
              </span>
              {live && selected?.seenAt && (
                <span className="text-xs font-semibold text-muted">
                  {tr("seenOn", { date: formatDayShort(selected.seenAt, loc) })}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="font-display text-[24px] font-bold leading-[1.2] text-ink">{t("checkPrice")}</span>
              <span className="text-sm font-semibold text-muted">{t("noData")}</span>
            </>
          )}
          <Link
            href={monthSearchHref}
            className="mt-1 inline-flex items-center gap-1 text-sm font-extrabold text-primary no-underline hover:underline"
          >
            {t("searchMonth")} →
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto rounded-[30px] border-2 border-solid border-line px-5 pb-4 pt-6">
        <div
          role="radiogroup"
          aria-label={t("groupLabel")}
          className="grid h-[220px] min-w-[600px] grid-cols-[repeat(12,minmax(44px,1fr))] items-end gap-[10px]"
        >
          {months.map((m, i) => {
            const sel = month === i;
            const v = m.price;
            const hasPrice = v !== null && max > 0;
            const color = !hasPrice
              ? sel
                ? "border-2 border-dashed border-primary bg-sky"
                : "border-2 border-dashed border-line bg-field"
              : sel
                ? "bg-primary"
                : v === min
                  ? "bg-sun"
                  : "bg-blue-soft-light";
            const height = hasPrice ? Math.max(24, Math.round((v / max) * 150)) : 22;
            return (
              <button
                key={m.ym}
                type="button"
                role="radio"
                aria-checked={sel}
                aria-label={hasPrice ? t("aria", { month: names[i], price: fmt(v) }) : t("ariaEmpty", { month: names[i] })}
                onClick={() => setMonth(i)}
                className="flex h-full cursor-pointer flex-col items-center justify-end gap-2 border-0 bg-transparent p-0 text-ink"
              >
                <span className="text-[12px] font-extrabold text-muted">{hasPrice ? fmtShort(v) : "—"}</span>
                <span
                  className={`box-border w-full max-w-[48px] rounded-[14px_14px_6px_6px] ${color}`}
                  style={{ height }}
                />
                <span className="text-sm font-extrabold">{short[i]}</span>
              </button>
            );
          })}
        </div>
      </div>
      <span className="text-sm text-muted">{live ? t("noteLive") : t("note")}</span>
    </section>
  );
}
