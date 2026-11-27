// Canlı widget (`tpwgt.com/wl_web/main.js`) için güvenli URL yardımcıları.
// Widget, `adults`/`children`/`infants`/`depart_date`/`return_date` gibi parametreleri `flightSearch` ile birlikte
// görünce `flightSearch`'ü yeniden kurar ve yerel gece yarısına `.toISOString()` uyguladığı için UTC+ saat dilimlerinde
// (Europe/Amsterdam, Europe/Istanbul) tarihleri 1 gün geri kaydırıp `window.location.replace` yapar.
// Yalnızca `flightSearch` ve widget'ın tanıdığı zararsız parametreler bırakıldığında tarih kayması yaşanmaz.

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

/** Verilen adresin sorgusunu yalnızca `flightSearch` ve widget'ın izin verdiği zararsız parametrelere indirger. */
export function cleanWidgetUrl(href: string, route: string): string {
  const u = new URL(href);
  const next = new URLSearchParams();
  next.set("flightSearch", route);
  for (const key of WIDGET_SAFE_PARAMS) {
    const val = u.searchParams.get(key);
    if (val) next.set(key, val);
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
