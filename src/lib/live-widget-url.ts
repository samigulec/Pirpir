// Canlı widget (`tpwgt.com/wl_web/main.js`) için güvenli URL ve çerez yardımcıları.
// 1) Widget `adults`/`children`/`infants`/`depart_date`/`return_date` gibi parametreleri `flightSearch` ile birlikte
//    görünce yerel gece yarısına `.toISOString()` uyguladığı için UTC+ saat dilimlerinde tarihleri 1 gün geri kaydırır.
// 2) Widget dil/para birimi seçiminde `tpwl_locale` / `tpwl_currency` çerezlerini `TPWL_CONFIGURATION.defaultLanguage`
//    üzerinde önceliklendirir; yalnızca URL `?language=` / `?currency=` (ve güncel çerez) eski çerezi ezer.

const WIDGET_SAFE_PARAMS = [
  "ticketId",
  "destination_airports",
  "origin_airports",
  "open_datepicker",
  "marker",
  "language",
  "locale",
  "currency",
] as const;

export type CleanWidgetOpts = {
  /** Widget'a zorlanacak dil (küçük harf, ör. "en", "tr", "nl", "de") */
  language?: string;
  /** Widget'a zorlanacak para birimi (ör. "EUR", "TRY", "USD") */
  currency?: string;
};

/** Verilen adresin sorgusunu yalnızca `flightSearch` ve widget'ın izin verdiği zararsız parametrelere indirger. */
export function cleanWidgetUrl(href: string, route: string, opts?: CleanWidgetOpts): string {
  const u = new URL(href);
  const next = new URLSearchParams();
  next.set("flightSearch", route);
  for (const key of WIDGET_SAFE_PARAMS) {
    const val = u.searchParams.get(key);
    if (val) next.set(key, val);
  }
  if (opts?.language) {
    next.set("language", opts.language.toLowerCase());
    next.delete("locale");
  }
  if (opts?.currency) {
    next.set("currency", opts.currency.toUpperCase());
  }
  return `${u.origin}${u.pathname}?${next.toString()}${u.hash}`;
}

/** `urlchange` olayında `router.replace` için `adults` vb. çakışan parametreleri geri eklemeyen sorgu nesnesi. */
export function widgetSyncQuery(code: string, currentSearch: string): Record<string, string> {
  const prev = new URLSearchParams(currentSearch);
  const query: Record<string, string> = { flightSearch: code };
  for (const key of WIDGET_SAFE_PARAMS) {
    const val = prev.get(key);
    if (val) query[key] = val;
  }
  return query;
}

/**
 * Travelpayouts widget'ının kendi `tpwl_locale` ve `tpwl_currency` çerezlerini güncel sayfa seçimiyle eşitler.
 * (Widget bu çerezleri `.flypirpir.nl` kök alan adına yazar; önceki Türkçe ziyaret `/en/search`'ü Türkçe bırakmasın.)
 */
export function syncWidgetCookies(language: string, currency: string): void {
  if (typeof document === "undefined") return;
  const lang = language.toLowerCase();
  const cur = currency.toUpperCase();
  const maxAge = 24 * 60 * 60;
  const parts = window.location.hostname.split(".");
  const rootDomain = parts.length > 3 ? `.${parts.slice(-3).join(".")}` : parts.length > 1 ? `.${parts.slice(-2).join(".")}` : "";
  for (const [k, v] of [
    ["tpwl_locale", lang],
    ["tpwl_currency", cur],
  ] as const) {
    document.cookie = `${k}=${encodeURIComponent(v)}; path=/; max-age=${maxAge}; samesite=lax`;
    if (rootDomain) {
      document.cookie = `${k}=${encodeURIComponent(v)}; path=/; domain=${rootDomain}; max-age=${maxAge}; samesite=lax`;
    }
  }
}
