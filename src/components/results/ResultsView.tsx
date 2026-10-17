"use client";

import { Link } from "@/i18n/navigation";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useCurrency } from "../CurrencyProvider";
import { Bulut } from "../characters";
import { OfferCard } from "./OfferCard";
import type { Offer } from "@/lib/providers/types";
import type { searchHref } from "@/lib/search";

type Sort = "cheap" | "fast" | "direct";
const SORTS: Sort[] = ["cheap", "fast", "direct"];

/** Gidiş + dönüş toplam yolculuk süresi */
const totalMins = (o: Offer) => o.outbound.mins + (o.inbound?.mins ?? 0);

export type ResultsTip = { href: ReturnType<typeof searchHref>; day: string; price: number; save: number } | null;

export function ResultsView({
  offers,
  oneWay,
  tip,
  note,
  cityNames,
}: {
  offers: Offer[];
  oneWay: boolean;
  tip: ResultsTip;
  /** "örnek veri" / "test modu" etiketi */
  note?: string;
  /** Kod → yerel şehir adı */
  cityNames: Record<string, string>;
}) {
  const t = useTranslations("results");
  const { fmt } = useCurrency();
  const [sort, setSort] = useState<Sort>("cheap");

  // Rozetler sıralamadan bağımsız, tüm sonuçlar üzerinden hesaplanır.
  const cheapestId = useMemo(() => [...offers].sort((a, b) => a.price - b.price)[0]?.id, [offers]);
  const fastestId = useMemo(() => [...offers].sort((a, b) => totalMins(a) - totalMins(b))[0]?.id, [offers]);

  const list = useMemo(() => {
    let l = [...offers];
    if (sort === "cheap") l.sort((a, b) => a.price - b.price);
    if (sort === "fast") l.sort((a, b) => totalMins(a) - totalMins(b));
    if (sort === "direct") l = l.filter((o) => o.outbound.stops === 0 && (o.inbound?.stops ?? 0) === 0).sort((a, b) => a.price - b.price);
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
              className={`min-h-[44px] cursor-pointer rounded-pill border-0 px-[22px] py-[10px] font-display text-[17px] font-semibold leading-[normal] ${
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
        {note && <> · {note}</>}
      </span>

      {offers.length === 0 && <p className="m-0 font-bold text-muted">{t("noResults")}</p>}
      {offers.length > 0 && list.length === 0 && <p className="m-0 font-bold text-muted">{t("empty")}</p>}

      {list.map((o) => (
        <OfferCard key={o.id} offer={o} cityNames={cityNames} badge={o.id === cheapestId ? "cheap" : o.id === fastestId ? "fast" : null} />
      ))}

      {tip && (
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
      )}
    </>
  );
}
