"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { SearchForm, type SearchInitial } from "../home/SearchForm";
import type { AirportValue } from "../home/AirportField";
import { formatRangeShort } from "@/lib/dates";
import { intlLocale } from "@/lib/intl";

/**
 * Sonuç sayfasının üstündeki arama (Kiwi'deki gibi): sayfadan çıkmadan rota, tarih ve yolcu değiştirilir.
 * Telefonda yer kaplamasın diye tek satırlık özet; dokununca form açılır.
 */
export function ResultsSearchBar({
  from: initialFrom,
  to: initialTo,
  initial,
  today,
}: {
  from: AirportValue;
  to: AirportValue;
  initial: SearchInitial;
  today: string;
}) {
  const t = useTranslations("results");
  const loc = intlLocale(useLocale());
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [open, setOpen] = useState(false);
  const names = (v: AirportValue) => v.map((p) => p.label).join(", ");
  const pax = initial.pax.adults + initial.pax.children + initial.pax.infants;
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="results-search"
        onClick={() => setOpen(!open)}
        className="flex min-h-[56px] w-full cursor-pointer items-center justify-between gap-3 rounded-[20px] border-0 bg-sky px-4 py-3 text-left text-ink md:hidden"
      >
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-display text-lg font-semibold">
            {names(initialFrom)} → {names(initialTo)}
          </span>
          <span className="text-sm font-semibold text-muted">
            {formatRangeShort(initial.date, initial.returnDate || undefined, loc)}
            {initial.flex ? ` ±${initial.flex}` : ""} · {t("paxCount", { count: pax })}
          </span>
        </span>
        <span className="flex-none rounded-pill bg-white px-4 py-2 font-extrabold">{open ? t("close") : t("change")}</span>
      </button>
      <div id="results-search" className={`${open ? "block" : "hidden"} md:block`}>
        <SearchForm compact from={from} to={to} onFrom={setFrom} onTo={setTo} defaults={{ today }} initial={initial} />
      </div>
    </>
  );
}
