"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { intlLocale } from "@/lib/intl";
import { SwapHorizontal, SwapVertical } from "../icons";
import { AirportField, type AirportValue } from "./AirportField";
import { Counter, FieldPopover } from "./Popover";
import { resolveAirport } from "@/data/airports";
import { formatRangeShort } from "@/lib/dates";
import { MAX_PASSENGERS, addDays, paxTotal, searchHref, validateSearch, type Passengers, type SearchError } from "@/lib/search";

type Trip = "rt" | "ow";

const fieldBox =
  "flex min-w-0 flex-col rounded-[16px] bg-field px-4 py-[10px] md:rounded-[18px] md:px-[18px] md:py-3";
const fieldLabel = "text-[12px] font-extrabold text-muted md:text-[13px]";
const fieldInput =
  "min-w-0 border-0 bg-transparent p-0 font-extrabold text-ink outline-none md:text-[19px]";

const dateInput =
  "box-border min-h-[48px] w-full rounded-[14px] border-2 border-solid border-line bg-white px-3 py-2 font-bold text-ink";

export function SearchForm({
  from,
  to,
  onFrom,
  onTo,
  defaults,
}: {
  from: AirportValue;
  to: AirportValue;
  onFrom: (v: AirportValue) => void;
  onTo: (v: AirportValue) => void;
  defaults: { date: string; returnDate: string; today: string };
}) {
  const t = useTranslations("home.search");
  const router = useRouter();
  const loc = intlLocale(useLocale());
  const [trip, setTrip] = useState<Trip>("rt");
  const [date, setDate] = useState(defaults.date);
  const [returnDate, setReturnDate] = useState(defaults.returnDate);
  const [pax, setPax] = useState<Passengers>({ adults: 1, children: 0, infants: 0 });
  const [error, setError] = useState<SearchError | null>(null);

  const swap = () => {
    onFrom(to);
    onTo(from);
  };

  const paxLabel = [
    t("paxAdults", { n: pax.adults }),
    pax.children ? t("paxChildren", { n: pax.children }) : null,
    pax.infants ? t("paxInfants", { n: pax.infants }) : null,
  ]
    .filter(Boolean)
    .join(", ");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const a = from.code ?? resolveAirport(from.text)?.code ?? "";
    const b = to.code ?? resolveAirport(to.text)?.code ?? "";
    const q = { from: a, to: b, date, returnDate: trip === "rt" ? returnDate : undefined, pax };
    const err = validateSearch(q);
    setError(err);
    if (err) return;
    router.push(searchHref({ ...q, returnDate: q.returnDate ?? "" }));
  };

  const total = paxTotal(pax);

  return (
    <form
      onSubmit={submit}
      noValidate
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
          <AirportField
            label={t("from")}
            value={from}
            onChange={(v) => { onFrom(v); setError(null); }}
            invalid={error === "from" || error === "same"}
            className={`${fieldBox} md:flex-1`}
            labelClassName={fieldLabel}
            inputClassName={`${fieldInput} text-[18px]`}
          />
          <button
            type="button"
            aria-label={t("swap")}
            onClick={swap}
            className="absolute right-[14px] top-1/2 z-[1] flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-[3px] border-white bg-sun text-ink md:left-1/2 md:right-auto md:-translate-x-1/2 md:border-4"
          >
            <span className="md:hidden"><SwapVertical /></span>
            <span className="hidden md:inline"><SwapHorizontal /></span>
          </button>
          <AirportField
            label={t("to")}
            value={to}
            onChange={(v) => { onTo(v); setError(null); }}
            invalid={error === "to" || error === "same"}
            className={`${fieldBox} md:flex-1 md:pl-[30px]`}
            labelClassName={fieldLabel}
            inputClassName={`${fieldInput} text-[18px]`}
          />
        </div>

        <FieldPopover
          label={t("when")}
          value={formatRangeShort(date, trip === "rt" ? returnDate : undefined, loc)}
          className={fieldBox}
          labelClassName={fieldLabel}
          valueClassName={`${fieldInput} text-base`}
        >
          {(close) => (
            <>
              <label className="flex flex-col gap-1 text-sm font-extrabold text-muted">
                {t("departDate")}
                <input
                  type="date"
                  min={defaults.today}
                  value={date}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) return;
                    setDate(v);
                    if (returnDate < v) setReturnDate(addDays(v, 7));
                    setError(null);
                  }}
                  className={dateInput}
                />
              </label>
              {trip === "rt" && (
                <label className="flex flex-col gap-1 text-sm font-extrabold text-muted">
                  {t("returnDate")}
                  <input
                    type="date"
                    min={date}
                    value={returnDate}
                    onChange={(e) => e.target.value && setReturnDate(e.target.value)}
                    className={dateInput}
                  />
                </label>
              )}
              <button type="button" onClick={close} className="min-h-[44px] cursor-pointer rounded-pill border-0 bg-ink px-5 font-display text-base font-semibold text-white">
                {t("done")}
              </button>
            </>
          )}
        </FieldPopover>

        <FieldPopover
          label={t("pax")}
          value={paxLabel}
          className={fieldBox}
          labelClassName={fieldLabel}
          valueClassName={`${fieldInput} text-base md:pl-1`}
          panelClassName="md:left-auto md:right-0 min-w-[300px]"
          chevron
        >
          {(close) => (
            <>
              <Counter label={t("adults")} hint={t("adultsHint")} value={pax.adults} min={1} max={MAX_PASSENGERS - pax.children - pax.infants}
                onChange={(n) => setPax({ ...pax, adults: n, infants: Math.min(pax.infants, n) })} />
              <Counter label={t("children")} hint={t("childrenHint")} value={pax.children} min={0} max={MAX_PASSENGERS - pax.adults - pax.infants}
                onChange={(n) => setPax({ ...pax, children: n })} />
              <Counter label={t("infants")} hint={t("infantsHint")} value={pax.infants} min={0} max={Math.min(pax.adults, MAX_PASSENGERS - pax.adults - pax.children)}
                onChange={(n) => setPax({ ...pax, infants: n })} />
              <span className="text-[13px] font-semibold text-muted">{t("paxNote", { max: MAX_PASSENGERS, total })}</span>
              <button type="button" onClick={close} className="min-h-[44px] cursor-pointer rounded-pill border-0 bg-ink px-5 font-display text-base font-semibold text-white">
                {t("done")}
              </button>
            </>
          )}
        </FieldPopover>

        <button
          type="submit"
          className="col-span-2 flex min-h-[56px] cursor-pointer items-center justify-center gap-2 rounded-[16px] border-0 bg-primary font-display text-[20px] font-semibold text-white md:col-span-1 md:min-h-[68px] md:rounded-[18px] md:text-[21px]"
        >
          {t("submit")}
        </button>
      </div>

      {error && (
        <p role="alert" className="m-0 px-[6px] text-[15px] font-extrabold text-coral-text">
          {t(`errors.${error}`)}
        </p>
      )}
    </form>
  );
}
