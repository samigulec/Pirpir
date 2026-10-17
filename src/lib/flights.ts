// Veri erişim katmanı. Sayfalar uçuş verisini yalnızca buradan alır.
// DUFFEL_ACCESS_TOKEN tanımlıysa Duffel, değilse örnek veri sağlayıcısı kullanılır.
import "server-only";
import { popularDestinations, popularRoutes } from "@/data/mock/home";
import { routes } from "@/data/mock/routes";
import { demoFlexibleTip, demoProvider } from "./providers/demo";
import { duffelProvider, isDuffelTestMode } from "./providers/duffel";
import type { FlightProvider } from "./providers/types";
import type { MultiQuery } from "./search";
import { expandCombos } from "./search-server";
import type { Offer } from "./providers/types";

export type DataMode = "demo" | "test" | "live";

export function dataMode(): DataMode {
  if (!process.env.DUFFEL_ACCESS_TOKEN) return "demo";
  return isDuffelTestMode() ? "test" : "live";
}

function provider(): FlightProvider {
  return dataMode() === "demo" ? demoProvider : duffelProvider;
}

const MAX_RESULTS = 60;

/**
 * Birden fazla kalkış/varış: her ikili paralel aranır, sonuçlar fiyata göre birleştirilir.
 * Bazı ikililer hata verse de diğerleri gösterilir; hepsi başarısızsa hata fırlatılır.
 */
export async function searchFlights(q: MultiQuery): Promise<Offer[]> {
  const combos = expandCombos(q);
  const p = provider();
  const settled = await Promise.allSettled(combos.map((c) => p.search(c)));
  const ok = settled.filter((r): r is PromiseFulfilledResult<Offer[]> => r.status === "fulfilled");
  if (!ok.length && settled.length) throw (settled[0] as PromiseRejectedResult).reason;
  settled.forEach((r, i) => r.status === "rejected" && console.error("Arama ikilisi başarısız:", combos[i].from, combos[i].to, r.reason));
  return ok
    .flatMap((r) => r.value)
    .sort((a, b) => a.price - b.price)
    .slice(0, MAX_RESULTS);
}

export async function getOffer(id: string) {
  // Örnek teklif kimlikleri her modda açılabilir (eski bağlantılar bozulmasın).
  if (id.startsWith("demo_")) return demoProvider.getOffer(id);
  return provider().getOffer(id);
}

/** "İki gün sonra uçarsan … daha ucuz" ipucu. Gerçek API'de ek arama maliyeti olduğu için yalnızca örnek modda. */
export async function getFlexibleDateTip(q: MultiQuery) {
  // Yalnızca tek kalkış–varış seçiliyse anlamlı
  const combos = expandCombos(q);
  return dataMode() === "demo" && combos.length === 1 ? demoFlexibleTip(combos[0]) : null;
}

export { provider as getProvider };

export function getPopularDestinations() {
  return popularDestinations;
}

export function getPopularRoutes() {
  return popularRoutes;
}

export function getRouteSlugs() {
  return routes.map((r) => ({ nereden: r.from.slug, nereye: r.to.slug }));
}

export function getRoute(from: string, to: string) {
  return routes.find((r) => r.from.slug === from && r.to.slug === to) ?? null;
}
