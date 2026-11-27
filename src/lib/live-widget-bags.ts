// Canlı widget (`tpwgt.com`) adresteki `checkedBags`/`cabinBags` parametrelerini saklamaz.
// Seçilen bagaj bilgisi rota kodu (`flightSearch`, ör. AMS0201ADB09011) anahtarıyla `sessionStorage`'da tutulur;
// sayfa yenilendiğinde veya widget içi tarih değişiminde bagaj seçimi ve "Bagaj dahil" filtresi korunur.

export type WidgetBags = { cabin: number; checked: number };

const PREFIX = "pirpir:bags:";

const clampInt = (v: unknown, max: number) =>
  typeof v === "number" && Number.isInteger(v) ? Math.min(max, Math.max(0, v)) : 0;

export function saveWidgetBags(route: string, bags?: WidgetBags | null): void {
  if (typeof window === "undefined" || !route) return;
  const key = PREFIX + route;
  try {
    const cabin = clampInt(bags?.cabin, 1);
    const checked = clampInt(bags?.checked, 3);
    if (!cabin && !checked) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, JSON.stringify({ cabin, checked }));
  } catch {
    // Gizli sekme veya depolama kısıtı varsa sessizce geç
  }
}

export function readWidgetBags(route: string): WidgetBags | null {
  if (typeof window === "undefined" || !route) return null;
  try {
    const raw = window.sessionStorage.getItem(PREFIX + route);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WidgetBags>;
    const cabin = clampInt(parsed?.cabin, 1);
    const checked = clampInt(parsed?.checked, 3);
    return cabin || checked ? { cabin, checked } : null;
  } catch {
    return null;
  }
}
