// Veri erişim katmanı. Sayfalar uçuş verisini yalnızca buradan alır.
// DUFFEL_ACCESS_TOKEN tanımlıysa Duffel, değilse örnek veri sağlayıcısı kullanılır.
import "server-only";
import { unstable_cache } from "next/cache";
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
export async function searchFlights(q: MultiQuery, opts?: { timeoutMs?: number }): Promise<Offer[]> {
  const combos = expandCombos(q);
  const p = provider();
  const settled = await Promise.allSettled(combos.map((c) => p.search(c, opts)));
  const ok = settled.filter((r): r is PromiseFulfilledResult<Offer[]> => r.status === "fulfilled");
  if (!ok.length && settled.length) throw (settled[0] as PromiseRejectedResult).reason;
  settled.forEach((r, i) => r.status === "rejected" && console.error("Arama ikilisi başarısız:", combos[i].from, combos[i].to, r.reason));
  return ok
    .flatMap((r) => r.value)
    .sort((a, b) => a.price - b.price)
    .slice(0, MAX_RESULTS);
}

/** Aynı arama bu süre boyunca sağlayıcıya yeniden gitmez (teklifler genelde daha uzun geçerlidir). */
const SEARCH_TTL = 10 * 60;

/** Önbellek anahtarı aynı arama için hep aynı olsun: sıralı kodlar, sabit alan sırası. */
function canonical(q: MultiQuery): MultiQuery {
  return {
    from: [...q.from].sort(),
    to: [...q.to].sort(),
    date: q.date,
    returnDate: q.returnDate || undefined,
    pax: { adults: q.pax.adults, children: q.pax.children, infants: q.pax.infants },
    cabin: q.cabin ?? "economy",
  };
}

// unstable_cache anahtarına fonksiyonun kaynak metnini de katar; bu metin sonuç sayfası ile API rotası gibi
// ayrı paketlerde farklı derlenir ve önbellek paylaşılmaz. `bind` ile oluşan fonksiyonun metni her yerde aynıdır.
const cachedSearch = unstable_cache(
  ((q: MultiQuery, _mode: DataMode) => searchFlights(q)).bind(null),
  ["search-v1"],
  { revalidate: SEARCH_TTL },
);

/**
 * Sonuç sayfası, esnek tarih şeridi ve ana sayfa fırsatları aynı aramayı bununla yapar:
 * hepsi aynı teklifleri görür (fiyatlar birbirini tutar) ve tekrar eden arama anında döner.
 * Hata önbelleğe yazılmaz.
 */
export function searchFlightsCached(q: MultiQuery): Promise<Offer[]> {
  const c = canonical(q);
  const mode = dataMode();
  // Aynı arama aynı anda iki kez istenirse (ör. sonuç sayfası ve tarih şeridi) sağlayıcıya tek istek gider;
  // aksi halde ikisi de önbelleği boş bulur ve test modunda farklı fiyatlar döner.
  const key = JSON.stringify([c, mode]);
  let p = inFlight.get(key);
  if (!p) {
    p = cachedSearch(c, mode)
      .then((list) => {
        // Önbellekteki teklif süresi dolmuşsa satın alınamaz: onları gösterme, hepsi dolmuşsa yeniden ara.
        const fresh = list.filter((o) => !o.expiresAt || Date.parse(o.expiresAt) > Date.now() + 60_000);
        return fresh.length || !list.length ? fresh : searchFlights(c);
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, p);
  }
  return p;
}

const inFlight = new Map<string, Promise<Offer[]>>();

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
