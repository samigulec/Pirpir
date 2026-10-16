export const LOCALES = ["tr", "en", "nl"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "tr";
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_LABELS: Record<Locale, string> = { tr: "Türkçe", en: "English", nl: "Nederlands" };
