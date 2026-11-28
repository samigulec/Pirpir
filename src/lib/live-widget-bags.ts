// Canlı widget (`tpwgt.com`) adresteki `checkedBags`/`cabinBags` parametrelerini saklamaz.
// Seçilen bagaj bilgisi rota kodu (`flightSearch`, ör. AMS0201ADB09011) anahtarıyla `sessionStorage`'da tutulur
// ve `pirpir:bags` özel olayıyla üst arama kutusu (`SearchForm`) ile sol sütun sayaçları (`LiveWidget`) anında eşitlenir.

export type WidgetBags = { cabin: number; checked: number };

export const WIDGET_BAGS_EVENT = "pirpir:bags";

const PREFIX = "pirpir:bags:";

const clampInt = (v: unknown, max: number) =>
  typeof v === "number" && Number.isInteger(v) ? Math.min(max, Math.max(0, v)) : 0;

export function normalizeWidgetBags(bags?: Partial<WidgetBags> | null): WidgetBags {
  return {
    cabin: clampInt(bags?.cabin, 1),
    checked: clampInt(bags?.checked, 3),
  };
}

export function saveWidgetBags(route: string, bags?: Partial<WidgetBags> | null): WidgetBags {
  const next = normalizeWidgetBags(bags);
  if (typeof window === "undefined" || !route) return next;
  const key = PREFIX + route;
  try {
    if (!next.cabin && !next.checked) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Gizli sekme veya depolama kısıtı varsa sessizce geç
  }
  window.dispatchEvent(new CustomEvent<{ route: string; bags: WidgetBags }>(WIDGET_BAGS_EVENT, { detail: { route, bags: next } }));
  return next;
}

export function readWidgetBags(route: string): WidgetBags | null {
  if (typeof window === "undefined" || !route) return null;
  try {
    const raw = window.sessionStorage.getItem(PREFIX + route);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WidgetBags>;
    const next = normalizeWidgetBags(parsed);
    return next.cabin || next.checked ? next : null;
  } catch {
    return null;
  }
}

export function subscribeWidgetBags(route: string, onChange: (bags: WidgetBags) => void): () => void {
  if (typeof window === "undefined" || !route) return () => {};
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<{ route: string; bags: WidgetBags }>).detail;
    if (detail && detail.route === route) onChange(normalizeWidgetBags(detail.bags));
  };
  window.addEventListener(WIDGET_BAGS_EVENT, handler);
  return () => window.removeEventListener(WIDGET_BAGS_EVENT, handler);
}
