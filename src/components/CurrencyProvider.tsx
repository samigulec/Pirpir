"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { INTL_LOCALE, isLocale } from "@/i18n/config";
import { MARKET_COOKIE, MARKET_GUESS_COOKIE, isMarketId, marketById, type MarketId } from "@/config/markets";
import {
  CURRENCY_COOKIE,
  CURRENCY_STORAGE_KEY,
  formatPrice,
  formatShort,
  isCurrency,
  type Currency,
} from "@/lib/currency";

type CurrencyContextValue = {
  cur: Currency;
  setCur: (c: Currency) => void;
  /** Ziyaretçinin ülkesi (seçilmediyse tahmin); ilk çizimde henüz bilinmez */
  market: MarketId | null;
  /** Ülkeyi kaydeder; para birimi o ülkeninkine geçer (sonra ayrıca değiştirilebilir) */
  setMarket: (m: MarketId) => void;
  fmt: (amountTry: number) => string;
  fmtShort: (amountTry: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

function readMarket(): MarketId | null {
  const m = readCookie(MARKET_COOKIE) ?? readCookie(MARKET_GUESS_COOKIE);
  return isMarketId(m) ? m : null;
}

// Öncelik: URL (?cur=EUR) → localStorage → çerez → ülkenin para birimi → TRY
function readInitial(): Currency | null {
  const fromUrl = new URLSearchParams(window.location.search).get("cur");
  if (isCurrency(fromUrl)) return fromUrl;
  try {
    const stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (isCurrency(stored)) return stored;
  } catch {}
  const cookie = readCookie(CURRENCY_COOKIE);
  if (isCurrency(cookie)) return cookie;
  const market = readMarket();
  return market ? marketById(market).currency : null;
}

function persist(c: Currency) {
  try {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, c);
  } catch {}
  document.cookie = `${CURRENCY_COOKIE}=${c}; path=/; max-age=31536000; samesite=lax`;
  const url = new URL(window.location.href);
  if (url.searchParams.has("cur")) {
    url.searchParams.set("cur", c);
    window.history.replaceState(window.history.state, "", url);
  }
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [cur, setCurState] = useState<Currency>("TRY");
  const [market, setMarketState] = useState<MarketId | null>(null);
  const locale = useLocale();
  const intl = INTL_LOCALE[isLocale(locale) ? locale : "tr"];

  useEffect(() => {
    setMarketState(readMarket());
    const initial = readInitial();
    if (initial) {
      setCurState(initial);
      persist(initial);
    }
  }, []);

  const setCur = useCallback((c: Currency) => {
    setCurState(c);
    persist(c);
  }, []);

  const setMarket = useCallback((m: MarketId) => {
    document.cookie = `${MARKET_COOKIE}=${m}; path=/; max-age=31536000; samesite=lax`;
    setMarketState(m);
  }, []);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      cur,
      setCur,
      market,
      setMarket,
      fmt: (n) => formatPrice(n, cur, intl),
      fmtShort: (n) => formatShort(n, cur, intl),
    }),
    [cur, setCur, market, setMarket, intl],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency, CurrencyProvider içinde kullanılmalı");
  return ctx;
}
