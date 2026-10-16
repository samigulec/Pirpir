"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCurrency } from "../CurrencyProvider";
import { Antalya, Barselona, Istanbul, Londra, Paris, Roma } from "../cities";
import type { CategoryId, PopularDestination } from "@/data/mock/home";
import { routeHref, searchHref } from "@/lib/flights";
import { splitDuration } from "@/lib/format";

const CATEGORIES: CategoryId[] = ["all", "tr", "eu", "sea", "city"];

const ILLUSTRATIONS = { ist: Istanbul, ayt: Antalya, fco: Roma, bcn: Barselona, lhr: Londra, cdg: Paris };

export function PopularFlights({ fromLabel, destinations }: { fromLabel: string; destinations: PopularDestination[] }) {
  const t = useTranslations("home.popular");
  const tc = useTranslations("common");
  const { fmt } = useCurrency();
  const [cat, setCat] = useState<CategoryId>("all");

  const shown = destinations.filter((d) => cat === "all" || d.tags.includes(cat));

  return (
    <section id="populer" className="mx-auto flex max-w-page flex-col gap-[22px] px-6 pt-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-[2px]">
          <span className="font-extrabold text-muted">{t("from", { city: fromLabel })}</span>
          <h2 className="m-0 font-display text-[40px] font-bold leading-[1.1]">{t("title")}</h2>
        </div>
        <div role="tablist" aria-label={t("categoryLabel")} className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const on = cat === c;
            return (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setCat(c)}
                className={`min-h-[44px] cursor-pointer rounded-pill border-0 px-[18px] leading-[normal] py-[10px] font-display text-base font-semibold ${
                  on ? "bg-ink text-white" : "bg-field text-ink"
                }`}
              >
                {t(`categories.${c}`)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-[18px]">
        {shown.map((d) => {
          const Illustration = ILLUSTRATIONS[d.id];
          const href = d.routeSlug ? routeHref(d.routeSlug) : searchHref({ to: d.city });
          return (
            <Link
              key={d.id}
              href={href}
              className="flex flex-col gap-3 rounded-[30px] border-2 border-solid border-line bg-white px-[10px] pb-[18px] pt-[10px] text-ink no-underline"
            >
              <div className="relative h-[180px] overflow-hidden rounded-[22px]">
                <Illustration aria-label={t(`cards.${d.id}.alt`)} className="block h-full w-full" />
                <span className="absolute left-3 top-3 rounded-pill bg-white px-3 py-1 font-display text-sm font-semibold">
                  {t(`cards.${d.id}.badge`)}
                </span>
              </div>
              <div className="flex items-end justify-between gap-3 px-2">
                <div className="flex flex-col">
                  <span className="font-display text-[26px] font-semibold leading-[1.15]">{d.city}</span>
                  <span className="text-[15px] font-bold text-muted">{t(`cards.${d.id}.meta`)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[13px] font-bold text-muted">{tc("roundTrip")}</span>
                  <span className="font-display text-[26px] font-bold leading-[1.15]">{fmt(d.price)}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-[6px] px-2">
                <span className="rounded-pill bg-field px-[10px] py-[3px] text-[13px] font-extrabold">
                  {tc("direct")} · {tc("duration", splitDuration(d.mins, true))}
                </span>
                <span className="rounded-pill bg-field px-[10px] py-[3px] text-[13px] font-extrabold">{d.airlines.join(" · ")}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
