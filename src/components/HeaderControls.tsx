"use client";

import { useTransition } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCurrency } from "./CurrencyProvider";
import { CURRENCIES, SYMBOLS, isCurrency } from "@/lib/currency";
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
    const query = Object.fromEntries(new URLSearchParams(window.location.search));
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
