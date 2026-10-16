"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useCurrency } from "./CurrencyProvider";
import { CURRENCIES, SYMBOLS, isCurrency } from "@/lib/currency";
import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, LOCALE_LABELS, type Locale } from "@/i18n/config";

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

const LOCALE_STORAGE_KEY = "rotala.locale";

// Şimdilik yalnızca seçimi hatırlar; çeviriler eklenince sayfa diline bağlanacak.
export function LanguageSelect() {
  const t = useTranslations("common");
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored && (LOCALES as readonly string[]).includes(stored)) setLocale(stored as Locale);
    } catch {}
  }, []);

  const change = (l: Locale) => {
    setLocale(l);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, l);
    } catch {}
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <select
      aria-label={t("language")}
      value={locale}
      onChange={(e) => change(e.target.value as Locale)}
      className={`${selectBase} px-[14px] py-[10px] text-[15px]`}
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>
          {LOCALE_LABELS[l]}
        </option>
      ))}
    </select>
  );
}
