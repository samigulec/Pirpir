"use client";

import { useId, useMemo, useRef, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCurrency } from "./CurrencyProvider";
import { CURRENCIES, SYMBOLS, isCurrency, type Currency } from "@/lib/currency";
import {
  MARKETS,
  isMarketId,
  marketById,
  type MarketId,
} from "@/config/markets";
import { LOCALES, LOCALE_LABELS, isLocale, type Locale } from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/navigation";

const selectBase =
  "min-h-[44px] cursor-pointer rounded-pill border-0 bg-field font-extrabold text-ink";

export function CurrencySelect({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("common");
  const { cur, setCur } = useCurrency();
  return (
    <select
      aria-label={t("currency")}
      value={cur}
      onChange={(e) => isCurrency(e.target.value) && setCur(e.target.value)}
      className={`${selectBase} ${compact ? "px-3 py-[10px] text-sm" : "px-[14px] py-[10px] text-[15px]"}`}
    >
      {CURRENCIES.map((c) => (
        <option key={c} value={c}>
          {SYMBOLS[c]} {c}
        </option>
      ))}
    </select>
  );
}

/** Dil değişince aynı sayfanın o dildeki adresine gider (/ara → /en/search). */
export function LanguageSelect() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [pending, startTransition] = useTransition();

  const change = (next: Locale) => {
    const query = Object.fromEntries(
      new URLSearchParams(window.location.search),
    );
    const { locale: _current, ...rest } = params;
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- pathname ve params aynı sayfadan geldiği için birbiriyle uyumlu.
        { pathname, params: rest, query },
        { locale: next, scroll: false },
      );
    });
  };

  return (
    <select
      aria-label={t("language")}
      value={locale}
      disabled={pending}
      onChange={(e) => isLocale(e.target.value) && change(e.target.value)}
      className={`${selectBase} px-[14px] py-[10px] text-[15px]`}
    >
      {LOCALES.map((l) => (
        <option key={l} value={l} lang={l}>
          {LOCALE_LABELS[l]}
        </option>
      ))}
    </select>
  );
}

/**
 * Kiwi'deki gibi tek pencerede ülke, dil ve para birimi. Ülke ana sayfadaki kalkış yerini ve popüler rotaları
 * belirler; ülke değişince para birimi o ülkeninkine geçer (kaydetmeden önce değiştirilebilir).
 */
export function RegionSettings({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("common.region");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { cur, setCur, market, setMarket } = useCurrency();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const hintId = useId();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<{
    market: MarketId;
    locale: Locale;
    cur: Currency;
  }>({ market: "NL", locale: "tr", cur: "TRY" });
  const countries = useMemo(
    () => new Intl.DisplayNames([locale], { type: "region" }),
    [locale],
  );
  const currencyNames = useMemo(
    () => new Intl.DisplayNames([locale], { type: "currency" }),
    [locale],
  );

  const open = () => {
    setDraft({
      market: market ?? "NL",
      locale: isLocale(locale) ? locale : "tr",
      cur,
    });
    ref.current?.showModal();
  };

  const save = () => {
    ref.current?.close();
    setCur(draft.cur);
    const marketChanged = draft.market !== market;
    if (marketChanged) setMarket(draft.market);
    if (draft.locale !== locale) {
      const query = Object.fromEntries(
        new URLSearchParams(window.location.search),
      );
      const { locale: _current, ...rest } = params;
      startTransition(() => {
        router.replace(
          // @ts-expect-error -- pathname ve params aynı sayfadan geldiği için birbiriyle uyumlu.
          { pathname, params: rest, query },
          { locale: draft.locale, scroll: false },
        );
      });
    } else if (marketChanged) {
      // Ana sayfadaki kalkış yeri ve rotalar sunucuda ülkeye göre çizilir
      startTransition(() => router.refresh());
    }
  };

  const field = "flex flex-col gap-[6px] font-extrabold";
  const select =
    "min-h-[48px] w-full cursor-pointer rounded-[18px] border-2 border-solid border-line bg-field px-4 text-base font-bold text-ink";

  return (
    <>
      <button
        type="button"
        onClick={open}
        disabled={pending}
        aria-label={t("open")}
        className={`${selectBase} inline-flex items-center gap-2 whitespace-nowrap ${compact ? "px-3 py-[10px] text-sm" : "px-[14px] py-[10px] text-[15px]"}`}
      >
        {market && <span>{market}</span>}
        {market && (
          <span aria-hidden="true" className="text-muted">
            ·
          </span>
        )}
        {!compact && (
          <span>{LOCALE_LABELS[isLocale(locale) ? locale : "tr"]}</span>
        )}
        {!compact && (
          <span aria-hidden="true" className="text-muted">
            ·
          </span>
        )}
        <span>
          {SYMBOLS[cur]} {cur}
        </span>
      </button>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
        className="m-auto box-border w-[calc(100%-32px)] max-w-[440px] rounded-[28px] border-0 bg-white p-0 text-ink shadow-search backdrop:bg-ink/50"
      >
        {/* Form değil: başlık bir sayfa formunun içinde de kullanılabilir (iç içe form olmasın) */}
        <div className="flex flex-col gap-4 px-6 py-6">
          <h2 id={titleId} className="m-0 font-display text-2xl font-semibold">
            {t("title")}
          </h2>
          <div className="flex flex-col gap-[6px]">
            <label className={field}>
              {t("country")}
              <select aria-label={t("country")}
                aria-describedby={hintId}
                value={draft.market}
                onChange={(e) => {
                  const m = e.target.value;
                  if (isMarketId(m))
                    setDraft((d) => ({
                      ...d,
                      market: m,
                      cur: marketById(m).currency,
                    }));
                }}
                className={select}
              >
                {MARKETS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {countries.of(m.id)}
                  </option>
                ))}
              </select>
            </label>
            <span id={hintId} className="text-sm font-semibold text-muted">
              {t("countryHint")}
            </span>
          </div>
          <label className={field}>
            {t("language")}
            <select aria-label={t("language")}
              value={draft.locale}
              onChange={(e) =>
                isLocale(e.target.value) &&
                setDraft((d) => ({ ...d, locale: e.target.value as Locale }))
              }
              className={select}
            >
              {LOCALES.map((l) => (
                <option key={l} value={l} lang={l}>
                  {LOCALE_LABELS[l]}
                </option>
              ))}
            </select>
          </label>
          <label className={field}>
            {t("currency")}
            <select aria-label={t("currency")}
              value={draft.cur}
              onChange={(e) =>
                isCurrency(e.target.value) &&
                setDraft((d) => ({ ...d, cur: e.target.value as Currency }))
              }
              className={select}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {SYMBOLS[c]} {c} · {currencyNames.of(c)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="min-h-[48px] cursor-pointer rounded-pill border-0 bg-field px-6 font-display text-lg font-semibold text-ink"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={save}
              className="min-h-[48px] cursor-pointer rounded-pill border-0 bg-primary px-6 font-display text-lg font-semibold text-white"
            >
              {t("save")}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
