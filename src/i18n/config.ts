export const LOCALES = ["tr", "en", "nl", "de"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "tr";
export const LOCALE_LABELS: Record<Locale, string> = { tr: "Türkçe", en: "English", nl: "Nederlands", de: "Deutsch" };
/** Intl biçimlendirme dili (tarih, sayı). */
export const INTL_LOCALE: Record<Locale, string> = { tr: "tr-TR", en: "en-GB", nl: "nl-NL", de: "de-DE" };

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}
