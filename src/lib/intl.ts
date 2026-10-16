// Sunucu ve istemci bileşenleri için dil yardımcıları.
import { INTL_LOCALE, isLocale, type Locale } from "@/i18n/config";

export function intlLocale(locale: string): string {
  return INTL_LOCALE[isLocale(locale) ? locale : "tr"];
}

export function asLocale(locale: string): Locale {
  return isLocale(locale) ? locale : "tr";
}
