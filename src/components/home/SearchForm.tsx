"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { intlLocale } from "@/lib/intl";
import { SwapHorizontal, SwapVertical } from "../icons";
import { AirportField, type AirportValue } from "./AirportField";
import { Counter, FieldPopover } from "./Popover";
import { DateRangePicker } from "./DateRangePicker";
import { formatRangeShort } from "@/lib/dates";
import { CabinBagIcon, CheckedBagIcon } from "../results/BagIcons";
import { CABINS, MAX_PASSENGERS, MAX_SEARCH_BAGS, addDays, paxTotal, searchHref, validateSearch, type CabinClass, type Flex, type Passengers, type SearchError } from "@/lib/search";

type Trip = "rt" | "ow";

const fieldBox =
  "flex min-w-0 flex-col rounded-[16px] bg-field px-4 py-[10px] md:rounded-[18px] md:px-[18px] md:py-3";
const fieldLabel = "text-[12px] font-extrabold text-muted md:text-[13px]";
const fieldInput =
  "min-w-0 border-0 bg-transparent p-0 font-extrabold text-ink outline-none md:text-[19px]";

export type SearchInitial = {
  trip: Trip;
  date: string;
  returnDate: string;
  pax: Passengers;
  cabin: CabinClass;
  flex: Flex;
  bags?: { cabin: number; checked: number };
};

/**
 * Arama kutusu (ana sayfa ve sonuç sayfasının üstü). Ana sayfada tarih boş başlar; rota seçilince o rotanın
 * bilinen en ucuz tarihi önerilir (kullanıcı kendisi tarih seçtiyse dokunulmaz). Sonuç sayfasında yapılan
 * aramayla dolu gelir ve sayfadan çıkmadan değiştirilir.
 */
export function SearchForm({
  from,
  to,
  onFrom,
  onTo,
  defaults,
  initial,
  compact = false,
}: {
  from: AirportValue;
  to: AirportValue;
  onFrom: (v: AirportValue) => void;
  onTo: (v: AirportValue) => void;
  defaults: { today: string };
  initial?: SearchInitial;
  /** Sonuç sayfasının üstünde: gölgesiz, daha sıkı */
  compact?: boolean;
}) {
  const t = useTranslations("home.search");
  const router = useRouter();
  const loc = intlLocale(useLocale());
  const [trip, setTrip] = useState<Trip>(initial?.trip ?? "rt");
  const [date, setDate] = useState(initial?.date ?? "");
  const [returnDate, setReturnDate] = useState(initial?.returnDate ?? "");
  const [pax, setPax] = useState<Passengers>(initial?.pax ?? { adults: 1, children: 0, infants: 0 });
  const [cabin, setCabin] = useState<CabinClass>(initial?.cabin ?? "economy");
  const [flex, setFlex] = useState<Flex>(initial?.flex ?? 0);
  const [bags, setBags] = useState(initial?.bags ?? { cabin: 0, checked: 0 });
  const [error, setError] = useState<SearchError | null>(null);
  // Kullanıcı tarihi kendisi seçtiyse öneri yapılmaz; öneri yapıldıysa alanda "en ucuz" yazar
  const [datesTouched, setDatesTouched] = useState(!!initial);
  const [suggested, setSuggested] = useState(false);

  const routeKey = `${from.map((p) => p.code).join(",")}>${to.map((p) => p.code).join(",")}`;
  useEffect(() => {
    if (datesTouched || !from.length || !to.length) return;
    const ctrl = new AbortController();
    const q = new URLSearchParams({ from: from.map((p) => p.code).join(","), to: to.map((p) => p.code).join(",") });
    fetch(`/api/best-dates?${q}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((res: { best: { date: string; returnDate: string } | null } | null) => {
        if (!res?.best || res.best.date < defaults.today) return;
        setDate(res.best.date);
        setReturnDate(res.best.returnDate);
        setSuggested(true);
        setError(null);
      })
      .catch(() => {});
    return () => ctrl.abort();
    // Rota değişince yeniden önerilir (from/to dizileri her çizimde yenidir; anahtar yeterli)
  }, [routeKey, datesTouched]);

  const swap = () => {
    onFrom(to);
    onTo(from);
  };

  // Yalnızca yetişkin varsa "1 yetişkin", karışıksa Kiwi'deki gibi toplam: "3 yolcu".
  const paxLabel = pax.children || pax.infants ? t("paxTotal", { n: paxTotal(pax) }) : t("paxAdults", { n: pax.adults });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = { from: from.map((p) => p.code), to: to.map((p) => p.code), date, returnDate: trip === "rt" && date ? returnDate || addDays(date, 7) : undefined, pax, cabin, flex, bags };
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
      className={`relative box-border flex w-full flex-col gap-2 rounded-[24px] bg-white p-[10px] md:gap-3 md:rounded-[28px] md:p-[14px] ${
        compact ? "border-2 border-solid border-line" : "max-w-[1040px] md:shadow-search"
      }`}
    >
      {/* Üst satır (Kiwi'deki gibi): yolculuk türü, kabin sınıfı ve bagaj */}
      <div className="flex flex-wrap items-center gap-[6px] px-[6px] pt-1">
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
        <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-line sm:block" />
        <FieldPopover
          label={t("cabinLabel")}
          value={t(`cabins.${cabin}`)}
          className="min-h-[40px] items-center rounded-pill bg-field px-4 py-2"
          labelClassName="sr-only"
          valueClassName="text-[15px] font-extrabold text-ink"
          panelClassName="md:w-[280px]"
          closeLabel={t("done")}
          chevron
        >
          {(close) => (
            <div role="radiogroup" aria-label={t("cabinLabel")} className="flex flex-col gap-1">
              {CABINS.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={cabin === c}
                  onClick={() => {
                    setCabin(c);
                    close();
                  }}
                  className={`flex min-h-[48px] cursor-pointer items-center justify-between gap-3 rounded-[14px] border-0 px-4 text-left text-[16px] font-extrabold text-ink ${
                    cabin === c ? "bg-sky" : "bg-transparent hover:bg-field"
                  }`}
                >
                  {t(`cabins.${c}`)}
                  {cabin === c && <span aria-hidden="true" className="text-primary">✓</span>}
                </button>
              ))}
            </div>
          )}
        </FieldPopover>
        <FieldPopover
          label={t("bagsLabel")}
          value={
            <span className="inline-flex items-center gap-3" aria-label={t("bagsValue", bags)}>
              <span className="inline-flex items-center gap-1"><CabinBagIcon />{bags.cabin}</span>
              <span className="inline-flex items-center gap-1"><CheckedBagIcon />{bags.checked}</span>
            </span>
          }
          className="min-h-[40px] items-center rounded-pill bg-field px-4 py-2"
          labelClassName="sr-only"
          valueClassName="text-[15px] font-extrabold text-ink"
          panelClassName="md:w-[340px]"
          closeLabel={t("done")}
          chevron
        >
          {(close) => (
            <>
              <Counter label={t("cabinBags")} hint={t("cabinBagsHint")} value={bags.cabin} min={0} max={MAX_SEARCH_BAGS.cabin}
                onChange={(n) => setBags({ ...bags, cabin: n })} />
              <Counter label={t("checkedBags")} hint={t("checkedBagsHint")} value={bags.checked} min={0} max={MAX_SEARCH_BAGS.checked}
                onChange={(n) => setBags({ ...bags, checked: n })} />
              <span className="text-[13px] font-semibold text-muted">{t("bagsNote")}</span>
              <button type="button" onClick={close} className="min-h-[44px] cursor-pointer rounded-pill border-0 bg-ink px-5 font-display text-base font-semibold text-white">
                {t("done")}
              </button>
            </>
          )}
        </FieldPopover>
      </div>

      {/* Masaüstünde Kiwi'deki gibi uzun tek satır: nereden-nereye en geniş, alanlar şehir ekledikçe büyümez */}
      <div className="grid grid-cols-2 gap-[6px] lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(156px,1fr)_minmax(130px,0.7fr)] lg:gap-2">
        <div className="relative col-span-2 flex flex-col gap-[6px] lg:col-span-1 lg:flex-row lg:gap-2">
          <AirportField
            label={t("from")}
            value={from}
            onChange={(v) => { onFrom(v); setError(null); }}
            invalid={error === "from" || error === "same"}
            className={`${fieldBox} lg:flex-1`}
            labelClassName={fieldLabel}
            inputClassName={`${fieldInput} text-[18px]`}
            tone="primary"
          />
          <button
            type="button"
            aria-label={t("swap")}
            onClick={swap}
            className="absolute right-[14px] top-1/2 z-[1] flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-[3px] border-white bg-sun text-ink lg:left-1/2 lg:right-auto lg:-translate-x-1/2 md:border-4"
          >
            <span className="lg:hidden"><SwapVertical /></span>
            <span className="hidden lg:inline"><SwapHorizontal /></span>
          </button>
          <AirportField
            label={t("to")}
            value={to}
            onChange={(v) => { onTo(v); setError(null); }}
            invalid={error === "to" || error === "same"}
            className={`${fieldBox} lg:flex-1 lg:pl-[30px]`}
            labelClassName={fieldLabel}
            inputClassName={`${fieldInput} text-[18px]`}
            tone="coral"
          />
        </div>

        <FieldPopover
          label={suggested ? t("whenCheapest") : t("when")}
          value={date ? formatRangeShort(date, trip === "rt" && returnDate ? returnDate : undefined, loc) + (flex ? ` ±${flex}` : "") : t("pickDates")}
          panelClassName="lg:left-1/2 lg:-translate-x-1/2"
          closeLabel={t("done")}
          className={fieldBox}
          labelClassName={fieldLabel}
          valueClassName={`${fieldInput} text-base`}
        >
          {(close) => (
            <DateRangePicker
              route={from.length && to.length ? { from: from.map((p) => p.code), to: to.map((p) => p.code), cabin } : undefined}
              mode={trip === "rt" ? "range" : "single"}
              flex={flex}
              onFlex={setFlex}
              start={date}
              end={trip === "rt" ? returnDate || undefined : undefined}
              min={defaults.today}
              onChange={(s, e) => {
                setDate(s);
                setReturnDate(e ?? "");
                setError(null);
                setDatesTouched(true);
                setSuggested(false);
              }}
              onDone={() => {
                if (trip === "rt" && date && !returnDate) setReturnDate(addDays(date, 7));
                close();
              }}
            />
          )}
        </FieldPopover>

        <FieldPopover
          label={t("pax")}
          value={paxLabel}
          className={fieldBox}
          labelClassName={fieldLabel}
          valueClassName={`${fieldInput} text-base md:pl-1`}
          panelClassName="lg:left-auto lg:right-0 lg:w-[360px]"
          closeLabel={t("done")}
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
          className="col-span-2 flex min-h-[56px] cursor-pointer items-center justify-center gap-2 rounded-[16px] border-0 bg-primary font-display text-[20px] font-semibold text-white lg:col-span-1 md:min-h-[68px] md:rounded-[18px] md:text-[21px]"
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
