"use client";

import { useTranslations } from "next-intl";
import { useCurrency } from "../CurrencyProvider";
import { CabinBagIcon, CheckedBagIcon } from "./BagIcons";
import { DEFAULT_FILTERS, TIME_SLOTS, activeFilterCount, type Filters, type StopsFilter, type TimeSlot } from "@/lib/results-filter";

const STOPS: StopsFilter[] = ["any", "0", "1", "2"];

/** Kiwi tarzı filtre paneli: bagaj, aktarma, havayolu, kalkış saati, süre. */
export function FiltersPanel({
  value,
  onChange,
  airlines,
  oneWay,
  bounds,
}: {
  value: Filters;
  onChange: (f: Filters) => void;
  /** Havayolu → en düşük fiyat (yolcu başı) */
  airlines: { name: string; price: number }[];
  oneWay: boolean;
  bounds: [number, number];
}) {
  const t = useTranslations("results.filters");
  const { fmt } = useCurrency();
  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch });
  const h3 = "m-0 font-display text-lg font-semibold";
  const section = "flex flex-col gap-3 border-0 border-b-2 border-solid border-line pb-5";
  const check = "flex min-h-[32px] cursor-pointer items-center gap-[10px] text-[15px] font-bold";
  const box = "m-0 h-5 w-5 flex-none accent-primary";

  const counter = (label: string, icon: React.ReactNode, n: number, max: number, setN: (n: number) => void) => (
    <div className="flex items-center justify-between gap-2">
      <span className="flex min-w-0 items-center gap-2 text-[15px] font-bold leading-tight">
        <span className="flex-none">{icon}</span>
        {label}
      </span>
      <span className="flex flex-none items-center gap-2">
        <button type="button" aria-label={t("remove", { label })} disabled={n === 0} onClick={() => setN(n - 1)}
          className="h-11 w-11 cursor-pointer rounded-full border-2 border-solid border-primary bg-white text-lg font-extrabold leading-none text-primary disabled:cursor-not-allowed disabled:border-line disabled:text-muted">−</button>
        <span aria-live="polite" className="w-4 text-center font-display text-lg font-semibold">{n}</span>
        <button type="button" aria-label={t("add", { label })} disabled={n >= max} onClick={() => setN(n + 1)}
          className="h-11 w-11 cursor-pointer rounded-full border-2 border-solid border-primary bg-white text-lg font-extrabold leading-none text-primary disabled:cursor-not-allowed disabled:border-line disabled:text-muted">+</button>
      </span>
    </div>
  );

  const slots = (key: "outTimes" | "inTimes", label: string) => (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="mb-1 p-0 text-sm font-extrabold text-muted">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {TIME_SLOTS.map((s: TimeSlot) => {
          const on = value[key].includes(s);
          return (
            <button key={s} type="button" aria-pressed={on}
              onClick={() => set({ [key]: on ? value[key].filter((x) => x !== s) : [...value[key], s] })}
              className={`min-h-[40px] cursor-pointer rounded-pill border-0 px-3 py-2 text-[13px] font-extrabold leading-[normal] ${on ? "bg-ink text-white" : "bg-field text-ink"}`}>
              {t(`slots.${s}`)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );

  const selected = value.airlines ?? airlines.map((a) => a.name);
  const [minH, maxH] = bounds;
  const hours = value.maxHours ?? maxH;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 font-display text-2xl font-semibold">{t("title")}</h2>
        {activeFilterCount(value) > 0 && (
          <button type="button" onClick={() => onChange(DEFAULT_FILTERS)} className="min-h-[44px] cursor-pointer border-0 bg-transparent p-0 text-[15px] font-extrabold text-primary">
            {t("reset")}
          </button>
        )}
      </div>

      <section className={section}>
        <h3 className={h3}>{t("bagsTitle")}</h3>
        {counter(t("cabinBag"), <CabinBagIcon />, value.bags.cabin, 1, (n) => set({ bags: { ...value.bags, cabin: n } }))}
        {counter(t("checkedBag"), <CheckedBagIcon />, value.bags.checked, 2, (n) => set({ bags: { ...value.bags, checked: n } }))}
        <span className="text-[13px] font-semibold text-muted">{t("bagsNote")}</span>
      </section>

      <section className={section}>
        <h3 className={h3}>{t("stopsTitle")}</h3>
        <div role="radiogroup" aria-label={t("stopsTitle")} className="flex flex-col gap-1">
          {STOPS.map((s) => (
            <label key={s} className={check}>
              <input type="radio" name="stops" checked={value.stops === s} onChange={() => set({ stops: s })} className={box} />
              {t(`stops.${s}`)}
            </label>
          ))}
        </div>
        <label className={check}>
          <input type="checkbox" checked={value.overnight} onChange={() => set({ overnight: !value.overnight })} className={box} />
          {t("overnight")}
        </label>
      </section>

      {airlines.length > 1 && (
        <section className={section}>
          <h3 className={h3}>{t("airlinesTitle")}</h3>
          <div className="flex gap-4">
            <button type="button" onClick={() => set({ airlines: null })} className="min-h-[32px] cursor-pointer border-0 bg-transparent p-0 text-sm font-extrabold text-primary">{t("allAirlines")}</button>
            <button type="button" onClick={() => set({ airlines: [] })} className="min-h-[32px] cursor-pointer border-0 bg-transparent p-0 text-sm font-extrabold text-primary">{t("noAirlines")}</button>
          </div>
          <div className="flex flex-col gap-1">
            {airlines.map((a) => {
              const on = selected.includes(a.name);
              return (
                <label key={a.name} className={`${check} justify-between`}>
                  <span className="flex items-center gap-[10px]">
                    <input type="checkbox" checked={on} className={box}
                      onChange={() => {
                        const next = on ? selected.filter((x) => x !== a.name) : [...selected, a.name];
                        set({ airlines: next.length === airlines.length ? null : next });
                      }} />
                    {a.name}
                  </span>
                  <span className="text-[13px] font-bold text-muted">{t("from", { price: fmt(a.price) })}</span>
                </label>
              );
            })}
          </div>
        </section>
      )}

      <section className={section}>
        <h3 className={h3}>{t("timesTitle")}</h3>
        {slots("outTimes", t("outTimes"))}
        {!oneWay && slots("inTimes", t("inTimes"))}
      </section>

      {maxH > minH && (
        <section className="flex flex-col gap-3">
          <h3 className={h3}>{t("durationTitle")}</h3>
          <label className="flex flex-col gap-2 text-[15px] font-bold">
            {value.maxHours === null ? t("anyDuration") : t("maxDuration", { h: hours })}
            <input type="range" min={minH} max={maxH} step={1} value={hours}
              onChange={(e) => {
                const h = Number(e.target.value);
                set({ maxHours: h >= maxH ? null : h });
              }}
              className="w-full accent-primary" />
          </label>
        </section>
      )}
    </div>
  );
}
