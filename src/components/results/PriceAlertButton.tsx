"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useAuthUi } from "../auth/LoginModal";
import { useCurrency } from "../CurrencyProvider";
import { createAlert } from "@/actions/user";
import { cheapestFor, type AlertCriteria } from "@/lib/alert-criteria";
import { RATES } from "@/lib/currency";
import { formatDayWithWeekday, formatRange } from "@/lib/dates";
import { intlLocale } from "@/lib/intl";
import type { Filters } from "@/lib/results-filter";
import type { Offer } from "@/lib/providers/types";
import type { MultiQuery } from "@/lib/search";

/**
 * "Fiyat alarmı kur": önce "Neyi takip edelim?" penceresi açılır. Tarih (yalnızca seçilenler ya da ± 3 gün),
 * aktarma (sonuç filtresinden hazır gelir), bagaj (filtredeki bagajla) ve ne zaman haber verileceği
 * (belirgin düşüşte ya da hedef fiyatın altına inince) seçilir; seçime uyan şu anki en ucuz uçuş canlı görünür.
 * Giriş yapılmamışsa giriş penceresi açılır, girişten sonra alarm kendiliğinden kurulur.
 * Adreste `alarm=1` varsa (ana sayfadaki alarm formundan gelindi) pencere sonuçlar gelince açılır.
 */
export function PriceAlertButton({ q, offers, filters }: { q: MultiQuery; offers: Offer[]; filters: Filters }) {
  const t = useTranslations("results.alert");
  const tc = useTranslations("common");
  const { signedIn, openLogin } = useAuthUi();
  const { fmt, cur } = useCurrency();
  const loc = intlLocale(useLocale());
  const id = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  const auto = useSearchParams().get("alarm") === "1";
  const opened = useRef(false);
  const pendingCriteria = useRef<AlertCriteria | null>(null);
  const [awaitLogin, setAwaitLogin] = useState(false);

  const bags = filters.bags.cabin || filters.bags.checked ? { cabin: filters.bags.cabin, checked: filters.bags.checked } : undefined;
  const [flex, setFlex] = useState<0 | 3>(q.flex === 3 ? 3 : 0);
  const [direct, setDirect] = useState(filters.stops === "0");
  const [mode, setMode] = useState<"drop" | "target">("drop");
  const [target, setTarget] = useState("");

  const best = useMemo(() => cheapestFor(offers, { direct, bags }), [offers, direct, bags]);
  const toLocal = (tryAmount: number) => Math.round((tryAmount * RATES[cur]) / 5) * 5;

  const open = () => {
    // Pencere her açılışta sonuç filtresini yansıtsın; hedef, şu anki fiyatın %10 altı önerilir
    setDirect(filters.stops === "0");
    const b = cheapestFor(offers, { direct: filters.stops === "0", bags });
    setTarget(b ? String(toLocal(b.price * 0.9)) : "");
    setError(false);
    ref.current?.showModal();
  };

  const run = useCallback(
    (crit: AlertCriteria) =>
      start(async () => {
        const r = await createAlert(q, crit);
        if (r.ok) {
          setDone(true);
          ref.current?.close();
          if (auto) {
            const u = new URL(window.location.href);
            u.searchParams.delete("alarm");
            window.history.replaceState(window.history.state, "", u);
          }
        } else if (r.error === "signIn") {
          pendingCriteria.current = crit;
          setAwaitLogin(true);
          ref.current?.close();
          openLogin();
        } else setError(true);
      }),
    [q, auto, openLogin],
  );

  // Ana sayfadaki alarm formundan gelindiyse pencere kendiliğinden açılır
  useEffect(() => {
    if (auto && !opened.current && !done) {
      opened.current = true;
      open();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  // Giriş penceresinden giriş yapılınca bekleyen alarm kurulur
  useEffect(() => {
    if (awaitLogin && signedIn && pendingCriteria.current) {
      setAwaitLogin(false);
      run(pendingCriteria.current);
    }
  }, [awaitLogin, signedIn, run]);

  const confirm = () => {
    const crit: AlertCriteria = { flex, direct, ...(bags && { bags }) };
    if (mode === "target") {
      const v = Number(target.replace(",", "."));
      if (!Number.isFinite(v) || v <= 0) return setError(true);
      crit.targetTry = Math.round(v / RATES[cur]);
    }
    if (!signedIn) {
      pendingCriteria.current = crit;
      setAwaitLogin(true);
      ref.current?.close();
      return openLogin();
    }
    run(crit);
  };

  if (done)
    return (
      <span role="status" className="inline-flex min-h-[44px] flex-wrap items-center gap-2 rounded-pill bg-green-soft px-5 text-[15px] font-bold text-green-text">
        ✓ {t("done")}
        <Link href={{ pathname: "/hesap", hash: "alarmlar" }} className="font-extrabold text-green-text">{t("see")}</Link>
      </span>
    );

  const pill = (on: boolean) =>
    `flex min-h-[44px] cursor-pointer items-center rounded-pill border-2 border-solid px-4 text-[15px] font-bold ${on ? "border-primary bg-sky text-ink" : "border-line bg-white text-ink"}`;
  const stopsText = (n: number) => (n === 0 ? tc("direct") : n === 1 ? tc("oneStop") : tc("stops", { n }));
  const legend = "mb-2 p-0 text-sm font-extrabold text-muted";

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        className="inline-flex min-h-[44px] flex-[1_1_auto] cursor-pointer items-center justify-center gap-2 rounded-pill border-2 border-solid border-line bg-white px-4 font-display text-base font-semibold text-ink md:flex-none md:px-5"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9zM10 20a2 2 0 0 0 4 0" />
        </svg>
        {t("create")}
      </button>

      <dialog
        ref={ref}
        aria-labelledby={`${id}-title`}
        onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
        className="m-auto box-border max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[560px] overflow-y-auto rounded-[32px] border-0 bg-white p-0 text-ink shadow-search backdrop:bg-ink/50"
      >
        <div className="flex flex-col gap-5 px-6 py-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id={`${id}-title`} className="m-0 font-display text-[26px] font-bold leading-tight">{t("title")}</h2>
            <button type="button" aria-label={t("cancel")} onClick={() => ref.current?.close()} className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-full border-0 bg-field text-ink">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>

          <fieldset className="m-0 border-0 p-0">
            <legend className={legend}>{t("datesLabel")}</legend>
            <div className="flex flex-wrap gap-2">
              <label className={pill(flex === 0)}>
                <input type="radio" name={`${id}-flex`} checked={flex === 0} onChange={() => setFlex(0)} className="sr-only" />
                {t("exact", { dates: formatRange(q.date, q.returnDate, loc) })}
              </label>
              <label className={pill(flex === 3)}>
                <input type="radio" name={`${id}-flex`} checked={flex === 3} onChange={() => setFlex(3)} className="sr-only" />
                {t("flex")}
              </label>
            </div>
            {flex === 3 && <p className="m-0 mt-2 text-sm text-muted">{t("flexHint")}</p>}
          </fieldset>

          <fieldset className="m-0 border-0 p-0">
            <legend className={legend}>{t("stopsLabel")}</legend>
            <div className="flex flex-wrap gap-2">
              <label className={pill(!direct)}>
                <input type="radio" name={`${id}-stops`} checked={!direct} onChange={() => setDirect(false)} className="sr-only" />
                {t("any")}
              </label>
              <label className={pill(direct)}>
                <input type="radio" name={`${id}-stops`} checked={direct} onChange={() => setDirect(true)} className="sr-only" />
                {t("direct")}
              </label>
            </div>
            {bags && <p className="m-0 mt-2 text-sm text-muted">{t("bags")}</p>}
          </fieldset>

          <fieldset className="m-0 border-0 p-0">
            <legend className={legend}>{t("whenLabel")}</legend>
            <div className="flex flex-wrap gap-2">
              <label className={pill(mode === "drop")}>
                <input type="radio" name={`${id}-mode`} checked={mode === "drop"} onChange={() => setMode("drop")} className="sr-only" />
                {t("onDrop")}
              </label>
              <label className={pill(mode === "target")}>
                <input type="radio" name={`${id}-mode`} checked={mode === "target"} onChange={() => setMode("target")} className="sr-only" />
                {t("onTarget")}
              </label>
            </div>
            {mode === "target" && (
              <label className="mt-3 flex max-w-[260px] flex-col gap-1 rounded-[18px] bg-field px-4 py-[10px]">
                <span className="text-[12px] font-extrabold text-muted">{t("targetLabel")} · {cur}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  value={target}
                  aria-invalid={error || undefined}
                  onChange={(e) => {
                    setTarget(e.target.value);
                    setError(false);
                  }}
                  className="min-w-0 border-0 bg-transparent p-0 font-display text-[22px] font-semibold text-ink outline-none"
                />
              </label>
            )}
          </fieldset>

          <div aria-live="polite" className="rounded-[20px] bg-sky px-4 py-3">
            {best ? (
              <>
                <span className="block text-sm font-extrabold text-muted">{t("nowLabel")}</span>
                <span className="font-display text-[24px] font-bold">{fmt(best.price)}</span>
                <span className="ml-2 text-sm font-bold text-muted">
                  {[best.airline, stopsText(best.stops), `${formatDayWithWeekday(best.date, loc)} ${best.dep}`].join(" · ")}
                </span>
              </>
            ) : (
              <span className="text-sm font-bold text-muted">{t("none")}</span>
            )}
          </div>

          {error && <span role="alert" className="text-sm font-bold text-coral-text">{t("error")}</span>}

          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => ref.current?.close()} className="min-h-[48px] cursor-pointer rounded-pill border-0 bg-field px-6 font-display text-lg font-semibold text-ink">
              {t("cancel")}
            </button>
            <button type="button" disabled={pending} onClick={confirm} className="min-h-[48px] cursor-pointer rounded-pill border-0 bg-primary px-6 font-display text-lg font-semibold text-white disabled:opacity-60">
              {t("confirm")}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
