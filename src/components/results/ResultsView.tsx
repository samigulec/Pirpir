"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useCurrency } from "../CurrencyProvider";
import { Bulut } from "../characters";
import type { Offer } from "@/data/mock/flights";
import { formatDayShort } from "@/lib/dates";
import { splitDuration } from "@/lib/format";

type Sort = "cheap" | "fast" | "direct";
const SORTS: Sort[] = ["cheap", "fast", "direct"];

const stopsOf = (o: Offer) => (o.outbound.via ? 1 : 0);

export function ResultsView({
  offers,
  oneWay,
  tip,
}: {
  offers: Offer[];
  oneWay: boolean;
  tip: { href: string; day: string; price: number; save: number };
}) {
  const t = useTranslations("results");
  const tc = useTranslations("common");
  const { fmt } = useCurrency();
  const [sort, setSort] = useState<Sort>("cheap");

  // Rozetler sıralamadan bağımsız, tüm sonuçlar üzerinden hesaplanır.
  const cheapestId = useMemo(() => [...offers].sort((a, b) => a.price - b.price)[0]?.id, [offers]);
  const fastestId = useMemo(() => [...offers].sort((a, b) => a.mins - b.mins)[0]?.id, [offers]);

  const list = useMemo(() => {
    let l = [...offers];
    if (sort === "cheap") l.sort((a, b) => a.price - b.price);
    if (sort === "fast") l.sort((a, b) => a.mins - b.mins);
    if (sort === "direct") l = l.filter((o) => stopsOf(o) === 0).sort((a, b) => a.price - b.price);
    return l;
  }, [offers, sort]);

  return (
    <>
      <div role="tablist" aria-label={t("sortLabel")} className="flex flex-wrap gap-2">
        {SORTS.map((s) => {
          const on = sort === s;
          return (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setSort(s)}
              className={`min-h-[44px] cursor-pointer rounded-pill border-0 px-[22px] leading-[normal] py-[10px] font-display text-[17px] font-semibold ${
                on ? "bg-ink text-white" : "bg-field text-ink"
              }`}
            >
              {t(`sort.${s}`)}
            </button>
          );
        })}
      </div>
      <span className="-mt-2 text-sm font-bold text-muted">
        {t("count", { count: list.length })} · {oneWay ? t("countNoteOneWay") : t("countNote")}
      </span>

      {list.length === 0 && <p className="m-0 font-bold text-muted">{t("empty")}</p>}

      {list.map((o) => {
        const badge = o.id === cheapestId ? "cheap" : o.id === fastestId ? "fast" : null;
        const via = o.outbound.via;
        return (
          <article
            key={o.id}
            className="flex flex-wrap items-center gap-x-7 gap-y-4 rounded-[28px] border-2 border-solid border-line bg-white px-6 py-5"
          >
            <div className="flex min-w-0 flex-[999_1_380px] flex-col gap-[10px]">
              {badge && (
                <span
                  className={`self-start rounded-pill px-3 py-1 font-display text-sm font-semibold text-ink ${
                    badge === "cheap" ? "bg-sun" : "bg-blue-soft-light"
                  }`}
                >
                  {t(`badge.${badge}`)}
                </span>
              )}
              <div className="flex items-center gap-4">
                <span className="font-display text-[28px] font-semibold leading-none">{o.outbound.dep}</span>
                <div className="flex min-w-[80px] flex-1 flex-col items-center gap-[2px]">
                  <span className="text-[13px] font-bold text-muted">{tc("duration", splitDuration(o.mins))}</span>
                  <span className="w-full border-0 border-t-[3px] border-dotted border-blue-soft" />
                  <span className="text-[13px] font-extrabold text-ink">{via ? tc("oneStop") : tc("direct")}</span>
                </div>
                <span className="font-display text-[28px] font-semibold leading-none">{o.outbound.arr}</span>
              </div>
              <span className="text-[15px] font-semibold text-muted">
                {o.airline}
                {!oneWay && <> · {t("returnInfo", { date: formatDayShort(o.inbound.date), time: o.inbound.dep })}</>}
              </span>
              <span className="flex flex-wrap gap-[6px]">
                <span className="rounded-pill bg-field px-[10px] py-[3px] text-[13px] font-extrabold text-ink">{o.bagInfo}</span>
                {via && (
                  <span className="rounded-pill bg-coral-soft px-[10px] py-[3px] text-[13px] font-extrabold text-ink">
                    {t("transfer", { via: `${via.city} (${via.code})`, wait: via.wait ?? "" })}
                  </span>
                )}
              </span>
            </div>
            <div className="flex flex-[1_1_160px] items-center justify-between gap-4">
              <span className="font-display text-[30px] font-bold">{fmt(o.price)}</span>
              <Link
                href={`/rezervasyon/${o.id}`}
                className="box-border inline-flex min-h-[48px] items-center rounded-pill bg-primary px-[26px] py-3 font-display text-[19px] font-semibold text-white no-underline"
              >
                {t("select")}
              </Link>
            </div>
          </article>
        );
      })}

      <div className="flex flex-wrap items-center gap-[18px] rounded-[28px] bg-sun-soft px-6 py-5 md:flex-nowrap">
        <Bulut highlights={false} width={90} height={62} className="flex-none" />
        <div className="flex min-w-[200px] flex-1 flex-col gap-[2px]">
          <span className="font-display text-xl font-semibold">{t.rich("tip.title", { price: () => fmt(tip.save) })}</span>
          <span className="text-muted">{t.rich("tip.text", { day: tip.day, price: () => fmt(tip.price) })}</span>
        </div>
        <Link href={tip.href} className="ml-auto whitespace-nowrap py-[10px] font-extrabold">
          {t("tip.cta")}
        </Link>
      </div>
    </>
  );
}
