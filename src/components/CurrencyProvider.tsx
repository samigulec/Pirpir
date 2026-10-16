"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { INTL_LOCALE, isLocale } from "@/i18n/config";
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
  fmt: (amountTry: number) => string;
  fmtShort: (amountTry: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

// Öncelik: URL (?cur=EUR) → localStorage → çerez → TRY
function readInitial(): Currency | null {
  const fromUrl = new URLSearchParams(window.location.search).get("cur");
  if (isCurrency(fromUrl)) return fromUrl;
  try {
    const stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (isCurrency(stored)) return stored;
  } catch {}
  const cookie = readCookie(CURRENCY_COOKIE);
  return isCurrency(cookie) ? cookie : null;
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
  const locale = useLocale();
  const intl = INTL_LOCALE[isLocale(locale) ? locale : "tr"];

  useEffect(() => {
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

  const value = useMemo<CurrencyContextValue>(
    () => ({
      cur,
      setCur,
      fmt: (n) => formatPrice(n, cur, intl),
      fmtShort: (n) => formatShort(n, cur, intl),
    }),
    [cur, setCur, intl],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency, CurrencyProvider içinde kullanılmalı");
  return ctx;
}
