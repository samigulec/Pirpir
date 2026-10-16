// Veri erişim katmanı. Sayfalar uçuş verisini yalnızca buradan alır.
// DUFFEL_ACCESS_TOKEN tanımlıysa Duffel, değilse örnek veri sağlayıcısı kullanılır.
import "server-only";
import { popularDestinations, popularRoutes } from "@/data/mock/home";
import { routes } from "@/data/mock/routes";
import { demoFlexibleTip, demoProvider } from "./providers/demo";
import { duffelProvider, isDuffelTestMode } from "./providers/duffel";
import type { FlightProvider } from "./providers/types";
import type { SearchQuery } from "./search";

export type DataMode = "demo" | "test" | "live";

export function dataMode(): DataMode {
  if (!process.env.DUFFEL_ACCESS_TOKEN) return "demo";
  return isDuffelTestMode() ? "test" : "live";
}

function provider(): FlightProvider {
  return dataMode() === "demo" ? demoProvider : duffelProvider;
}

export function searchFlights(q: SearchQuery) {
  return provider().search(q);
}

export async function getOffer(id: string) {
  // Örnek teklif kimlikleri her modda açılabilir (eski bağlantılar bozulmasın).
  if (id.startsWith("demo_")) return demoProvider.getOffer(id);
  return provider().getOffer(id);
}

/** "İki gün sonra uçarsan … daha ucuz" ipucu. Gerçek API'de ek arama maliyeti olduğu için yalnızca örnek modda. */
export async function getFlexibleDateTip(q: SearchQuery) {
  return dataMode() === "demo" ? demoFlexibleTip(q) : null;
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
