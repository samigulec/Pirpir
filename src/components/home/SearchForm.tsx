"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { SwapHorizontal, SwapVertical } from "../icons";
import { searchHref, type SearchParams } from "@/lib/flights";

type Trip = "rt" | "ow";

const PAX = ["1a", "2a", "2a1c", "2a2c", "1a1i"] as const;

const fieldBox =
  "flex min-w-0 flex-col rounded-[16px] bg-field px-4 py-[10px] md:rounded-[18px] md:px-[18px] md:py-3";
const fieldLabel = "text-[12px] font-extrabold text-muted md:text-[13px]";
const fieldInput =
  "min-w-0 border-0 bg-transparent p-0 font-extrabold text-ink outline-none md:text-[19px]";

export function SearchForm({
  from,
  to,
  onFrom,
  onTo,
  defaults,
}: {
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  defaults: { date: string; returnDate: string };
}) {
  const t = useTranslations("home.search");
  const router = useRouter();
  const [trip, setTrip] = useState<Trip>("rt");
  const [pax, setPax] = useState<(typeof PAX)[number]>("1a");

  const swap = () => {
    onFrom(to);
    onTo(from);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params: Partial<SearchParams> = {
      from,
      to,
      date: defaults.date,
      returnDate: trip === "rt" ? defaults.returnDate : "",
      pax,
    };
    router.push(searchHref(params));
  };

  return (
    <form
      onSubmit={submit}
      className="relative box-border flex w-full max-w-[920px] flex-col gap-2 rounded-[24px] bg-white p-[10px] md:gap-3 md:rounded-[28px] md:p-[14px] md:shadow-search"
    >
      <div className="flex gap-[6px] px-[6px] pt-1">
        {(["rt", "ow"] as const).map((id) => {
          const on = trip === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => setTrip(id)}
              className={`min-h-[40px] cursor-pointer rounded-pill border-0 px-4 py-2 text-[15px] font-extrabold ${
                on ? "bg-ink text-white" : "bg-transparent text-muted"
              }`}
            >
              {t(id === "rt" ? "roundTrip" : "oneWay")}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-[6px] md:grid-cols-[repeat(auto-fit,minmax(170px,1fr))] md:gap-2">
        <div className="relative col-span-2 flex flex-col gap-[6px] md:flex-row md:gap-2">
          <label className={`${fieldBox} md:flex-1`}>
            <span className={fieldLabel}>{t("from")}</span>
            <input type="text" value={from} onChange={(e) => onFrom(e.target.value)} className={`${fieldInput} text-[18px]`} />
          </label>
          <button
            type="button"
            aria-label={t("swap")}
            onClick={swap}
            className="absolute right-[14px] top-1/2 z-[1] flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-[3px] border-white bg-sun text-ink md:left-1/2 md:right-auto md:-translate-x-1/2 md:border-4"
          >
            <span className="md:hidden"><SwapVertical /></span>
            <span className="hidden md:inline"><SwapHorizontal /></span>
          </button>
          <label className={`${fieldBox} md:flex-1 md:pl-[30px]`}>
            <span className={fieldLabel}>{t("to")}</span>
            <input type="text" value={to} onChange={(e) => onTo(e.target.value)} className={`${fieldInput} text-[18px]`} />
          </label>
        </div>
        <label className={fieldBox}>
          <span className={fieldLabel}>{t("when")}</span>
          <input type="text" readOnly value={trip === "rt" ? t("dateRange") : t("dateSingle")} className={`${fieldInput} text-base`} />
        </label>
        <label className={fieldBox}>
          <span className={fieldLabel}>{t("pax")}</span>
          <select value={pax} onChange={(e) => setPax(e.target.value as (typeof PAX)[number])} className={`${fieldInput} w-full text-base`}>
            {PAX.map((p) => (
              <option key={p} value={p}>{t(`paxOptions.${p}`)}</option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="col-span-2 flex min-h-[56px] cursor-pointer items-center justify-center gap-2 rounded-[16px] border-0 bg-primary font-display text-[20px] font-semibold text-white md:col-span-1 md:min-h-[68px] md:rounded-[18px] md:text-[21px]"
        >
          {t("submit")}
        </button>
      </div>
    </form>
  );
}
