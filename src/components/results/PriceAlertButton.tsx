"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useAuthUi } from "../auth/LoginModal";
import { useCurrency } from "../CurrencyProvider";
import { createAlert } from "@/actions/user";
import { isAffiliate } from "@/config/affiliate";
import { cheapestFor, type AlertBest, type AlertCriteria } from "@/lib/alert-criteria";
import { formatDayShort, formatDayWithWeekday, formatRange } from "@/lib/dates";
import { intlLocale } from "@/lib/intl";
import type { Filters } from "@/lib/results-filter";
import type { Offer } from "@/lib/providers/types";
import { todayIso, type MultiQuery } from "@/lib/search";

/**
 * "Fiyat alarmı kur": önce "Neyi takip edelim?" penceresi açılır. Tarih (yalnızca seçilenler ya da ± 3 gün),
 * aktarma (sonuç filtresinden hazır gelir), bagaj (filtredeki bagajla) ve ne zaman haber verileceği
 * (belirgin düşüşte ya da hedef fiyatın altına inince) seçilir; seçime uyan en ucuz önbellekli fiyat
 * `/api/alert-price` uç noktasından (10 dk önbellekli) alınır ve görülme günü yazılır.
 * Giriş yapılmamışsa giriş penceresi açılır, girişten sonra alarm kendiliğinden kurulur.
 * Adreste `alarm=1` varsa (ana sayfadaki alarm formundan gelindi) pencere sonuçlar gelince açılır.
 */
export function PriceAlertButton({ q, offers, filters }: { q: MultiQuery; offers: Offer[]; filters: Filters }) {
  const t = useTranslations("results.alert");
  const tc = useTranslations("common");
  const { signedIn, openLogin } = useAuthUi();
  const { fmt, cur, rates } = useCurrency();
  const loc = intlLocale(useLocale());
  const id = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  const auto = useSearchParams().get("alarm") === "1";
  const opened = useRef(false);
  const pendingCriteria = useRef<AlertCriteria | null>(null);
  const [awaitLogin, setAwaitLogin] = useState(false);

  const affiliate = isAffiliate();
  const bags = filters.bags.cabin || filters.bags.checked ? { cabin: filters.bags.cabin, checked: filters.bags.checked } : undefined;
  const [flex, setFlex] = useState<0 | 3>(q.flex === 3 ? 3 : 0);
  const [direct, setDirect] = useState(filters.stops === "0");
  const [mode, setMode] = useState<"drop" | "target">("drop");
  const [target, setTarget] = useState("");
  const targetEdited = useRef(false);

  const localBest = useMemo(() => cheapestFor(offers, { direct, bags }), [offers, direct, bags]);
  const [remoteState, setRemoteState] = useState<{ key: string; best: AlertBest | null } | null>(null);
  const [loadingRemote, setLoadingRemote] = useState(false);

  const shouldFetchRemote = dialogOpen && (affiliate || offers.length === 0 || flex === 3);
  const fetchKey = `${q.from.join(",")}|${q.to.join(",")}|${q.date}|${q.returnDate ?? ""}|${q.cabin ?? "economy"}|${flex}|${direct ? 1 : 0}`;
  const toLocal = useCallback((tryAmount: number) => Math.round((tryAmount * rates[cur]) / 5) * 5, [rates, cur]);

  useEffect(() => {
    if (!shouldFetchRemote) return;
    const ctrl = new AbortController();
    setLoadingRemote(true);
    const p = new URLSearchParams({
      from: q.from.join(","),
      to: q.to.join(","),
      date: q.date,
      adults: String(q.pax.adults),
      flex: String(flex),
      direct: direct ? "1" : "0",
    });
    if (q.returnDate) p.set("return", q.returnDate);
    if (q.pax.children) p.set("children", String(q.pax.children));
    if (q.pax.infants) p.set("infants", String(q.pax.infants));
    if (q.cabin && q.cabin !== "economy") p.set("cabin", q.cabin);

    fetch(`/api/alert-price?${p}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : { best: null }))
      .then((res: { best?: AlertBest | null }) => {
        if (ctrl.signal.aborted) return;
        const found = res.best ?? null;
        setRemoteState({ key: fetchKey, best: found });
        if (found && !targetEdited.current) setTarget(String(toLocal(found.price * 0.9)));
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setRemoteState({ key: fetchKey, best: null });
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoadingRemote(false);
      });

    return () => ctrl.abort();
  }, [shouldFetchRemote, fetchKey, q, flex, direct, toLocal]);

  const best: AlertBest | null =
    shouldFetchRemote
      ? remoteState?.key === fetchKey
        ? remoteState.best
        : flex === 0
          ? localBest
          : null
      : localBest;

  const open = () => {
    // Pencere her açılışta sonuç filtresini yansıtsın; hedef, şu anki fiyatın %10 altı önerilir
    setDirect(filters.stops === "0");
    targetEdited.current = false;
    const b = cheapestFor(offers, { direct: filters.stops === "0", bags });
    setTarget(b ? String(toLocal(b.price * 0.9)) : "");
    setError(false);
    setDialogOpen(true);
    ref.current?.showModal();
  };

  const closeDialog = () => {
    setDialogOpen(false);
    ref.current?.close();
  };

  const run = useCallback(
    (crit: AlertCriteria) =>
      start(async () => {
        const r = await createAlert(q, crit);
        if (r.ok) {
          setDone(true);
          setDialogOpen(false);
          ref.current?.close();
          if (auto) {
            const u = new URL(window.location.href);
            u.searchParams.delete("alarm");
            window.history.replaceState(window.history.state, "", u);
          }
        } else if (r.error === "signIn") {
          pendingCriteria.current = crit;
          setAwaitLogin(true);
          setDialogOpen(false);
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
      crit.targetTry = Math.round(v / rates[cur]);
    }
    if (!signedIn) {
      pendingCriteria.current = crit;
      setAwaitLogin(true);
      closeDialog();
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

  const seenLabel = (iso?: string) => {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
    const today = todayIso();
    const days = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${iso}T00:00:00Z`)) / 86_400_000);
    if (days === 0) return t("seenToday");
    if (days === 1) return t("seenYesterday");
    if (days > 1 && days <= 30) return t("seenDaysAgo", { n: days });
    return t("seenOnDate", { date: formatDayShort(iso, loc) });
  };
  const seenText = seenLabel(best?.seenAt);

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
        onClose={() => setDialogOpen(false)}
        onClick={(e) => e.target === e.currentTarget && closeDialog()}
        className="m-auto box-border max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[560px] overflow-y-auto rounded-[32px] border-0 bg-white p-0 text-ink shadow-search backdrop:bg-ink/50"
      >
        <div className="flex flex-col gap-5 px-6 py-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id={`${id}-title`} className="m-0 font-display text-[26px] font-bold leading-tight">{t("title")}</h2>
            <button type="button" aria-label={t("cancel")} onClick={closeDialog} className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-full border-0 bg-field text-ink">
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
                    targetEdited.current = true;
                    setTarget(e.target.value);
                    setError(false);
                  }}
                  className="min-w-0 border-0 bg-transparent p-0 font-display text-[22px] font-semibold text-ink outline-none"
                />
              </label>
            )}
          </fieldset>

          <div aria-live="polite" className="rounded-[20px] bg-sky px-4 py-3">
            {loadingRemote && !best ? (
              <span className="text-sm font-bold text-muted">{t("loading")}</span>
            ) : best ? (
              <>
                <span className="block text-sm font-extrabold text-muted">{t("nowLabel")}</span>
                <span className="font-display text-[24px] font-bold">{fmt(best.price)}</span>
                <span className="ml-2 text-sm font-bold text-muted">
                  {[best.airline, stopsText(best.stops), `${formatDayWithWeekday(best.date, loc)}${best.dep ? ` ${best.dep}` : ""}`]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                {seenText && <span className="mt-1 block text-xs font-bold text-muted">{seenText}</span>}
              </>
            ) : (
              <span className="text-sm font-bold text-muted">{t("noneCached")}</span>
            )}
          </div>

          {error && <span role="alert" className="text-sm font-bold text-coral-text">{t("error")}</span>}

          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={closeDialog} className="min-h-[48px] cursor-pointer rounded-pill border-0 bg-field px-6 font-display text-lg font-semibold text-ink">
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
