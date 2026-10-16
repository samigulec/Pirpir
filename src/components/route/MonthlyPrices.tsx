"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCurrency } from "../CurrencyProvider";

export function MonthlyPrices({ values, defaultMonth }: { values: number[]; defaultMonth: number }) {
  const t = useTranslations("route.monthly");
  const { fmt, fmtShort } = useCurrency();
  const [month, setMonth] = useState(defaultMonth);

  const names = t.raw("names") as string[];
  const short = t.raw("short") as string[];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const diff = values[month] - min;

  return (
    <section className="flex flex-col gap-[18px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-[2px]">
          <h2 className="m-0 font-display text-[36px] font-bold">{t("title")}</h2>
          <span className="font-semibold text-muted">{t("subtitle")}</span>
        </div>
        <div aria-live="polite" className="flex min-w-[256px] flex-col rounded-[20px] bg-field px-[18px] py-3">
          <span className="text-sm font-extrabold text-muted">{names[month]}</span>
          <span className="font-display text-[28px] font-bold leading-[1.15]">{fmt(values[month])}</span>
          <span className="text-sm font-bold text-green-text">
            {diff === 0 ? t("cheapest") : t("diff", { price: fmt(diff) })}
          </span>
        </div>
      </div>
      <div className="overflow-x-auto rounded-[30px] border-2 border-solid border-line px-5 pb-4 pt-6">
        <div
          role="radiogroup"
          aria-label={t("groupLabel")}
          className="grid h-[220px] min-w-[600px] grid-cols-[repeat(12,minmax(44px,1fr))] items-end gap-[10px]"
        >
          {values.map((v, i) => {
            const sel = month === i;
            const color = sel ? "bg-primary" : v === min ? "bg-sun" : "bg-blue-soft-light";
            return (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={sel}
                aria-label={t("aria", { month: names[i], price: fmt(v) })}
                onClick={() => setMonth(i)}
                className="flex h-full cursor-pointer flex-col items-center justify-end gap-2 border-0 bg-transparent p-0 text-ink"
              >
                <span className="text-[12px] font-extrabold text-muted">{fmtShort(v)}</span>
                <span
                  className={`w-full max-w-[48px] rounded-[14px_14px_6px_6px] ${color}`}
                  style={{ height: Math.round((v / max) * 150) }}
                />
                <span className="text-sm font-extrabold">{short[i]}</span>
              </button>
            );
          })}
        </div>
      </div>
      <span className="text-sm text-muted">{t("note")}</span>
    </section>
  );
}
