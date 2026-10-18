// Veri erişim katmanı. Sayfalar uçuş verisini yalnızca buradan alır.
// DUFFEL_ACCESS_TOKEN tanımlıysa Duffel, değilse örnek veri sağlayıcısı kullanılır.
import "server-only";
import { unstable_cache } from "next/cache";
import { popularDestinations } from "@/data/mock/home";
import { routes } from "@/data/mock/routes";
import { demoFlexibleTip, demoProvider } from "./providers/demo";
import { duffelProvider, isDuffelTestMode } from "./providers/duffel";
import { isBackground, isSkipped } from "./providers/rate-limit";
import type { FlightProvider, SearchOptions } from "./providers/types";
import type { MultiQuery } from "./search";
import { expandCombos } from "./search-server";
import { recordPrice } from "./price-calendar";
import type { Offer, SeatMap } from "./providers/types";
import { getProviderForOffer } from "./providers/select";

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
export async function searchFlights(q: MultiQuery, opts?: SearchOptions): Promise<Offer[]> {
  const combos = expandCombos(q);
  const p = provider();
  // Her ikilinin o ana kadarki teklifleri; biri ilerledikçe hepsinin birleşimi bildirilir.
  const partial: Offer[][] = combos.map(() => []);
  const onPartial = opts?.onPartial;
  const run = (i: number) =>
    p.search(combos[i], {
      timeoutMs: opts?.timeoutMs,
      onPartial:
        onPartial &&
        ((offers) => {
          partial[i] = offers;
          onPartial(merge(partial.flat()));
        }),
    });
  const settled = await Promise.allSettled(
    combos.map((_, i) => {
      const started = Date.now();
      // Geçici hata (istek sınırı, sağlayıcıda arıza, bağlantı) hızlı geldiyse bir kez daha denenir;
      // uzun süren bir aramadan sonra yeniden denemek sayfa süresini aşar
      return run(i).catch(async (e) => {
        if (!isTransient(e) || Date.now() - started > 15_000) throw e;
        // Arka plan araması istek sınırına takıldıysa yeniden denenmez: kalan pay ziyaretçinin aramasına kalsın
        if (isSkipped(e) || (isBackground() && (e as { status?: number }).status === 429)) throw e;
        console.error("Arama geçici hatayla kesildi, yeniden deneniyor:", combos[i].from, combos[i].to, e instanceof Error ? e.message : e);
        await new Promise((r) => setTimeout(r, 1500));
        return run(i);
      });
    }),
  );
  const ok = settled.filter((r): r is PromiseFulfilledResult<Offer[]> => r.status === "fulfilled");
  if (!ok.length && settled.length) throw (settled[0] as PromiseRejectedResult).reason;
  settled.forEach((r, i) => r.status === "rejected" && !isSkipped(r.reason) && console.error("Arama ikilisi başarısız:", combos[i].from, combos[i].to, r.reason));
  return merge(ok.flatMap((r) => r.value));
}

/** İstek sınırı (429), sağlayıcı tarafı hata (5xx) ya da durum kodu olmayan bağlantı/zaman aşımı hatası */
function isTransient(e: unknown): boolean {
  const status = (e as { status?: number } | null)?.status;
  return status === undefined || status === 429 || status >= 500;
}

const merge = (offers: Offer[]) => [...offers].sort((a, b) => a.price - b.price).slice(0, MAX_RESULTS);

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
  ((q: MultiQuery, mode: DataMode) => {
    // Parça parça arama yalnızca birisi sonuçları canlı izliyorsa (sonuç sayfası): daha çok istek yapar,
    // ana sayfa fırsatları ve tarih şeridi tek seferlik aramayla Duffel'ın istek sınırını zorlamaz.
    const key = searchKey(q, mode);
    return searchFlights(q, listeners.has(key) ? { onPartial: (offers) => emit(key, offers) } : undefined).then(async (offers) => {
      // Fiyatlı takvim için en düşük fiyat saklanır (yalnızca gerçek aramalar; önbellekten dönenler değil)
      await recordPrice(q, offers);
      return offers;
    });
  }).bind(null),
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
  const key = searchKey(c, mode);
  let p = inFlight.get(key);
  if (!p) {
    p = cachedSearch(c, mode)
      .then((list) => {
        // Önbellekteki teklif süresi dolmuşsa satın alınamaz: onları gösterme, hepsi dolmuşsa yeniden ara.
        const fresh = list.filter((o) => !o.expiresAt || Date.parse(o.expiresAt) > Date.now() + 60_000);
        return fresh.length || !list.length
          ? fresh
          : searchFlights(c, listeners.has(key) ? { onPartial: (offers) => emit(key, offers) } : undefined);
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, p);
  }
  // Aynı aramayı arka planda başlatılmış ve sınır yüzünden ertelenmiş bir istekle paylaştıysa ziyaretçi için yeniden dene
  return isBackground() ? p : p.catch((e) => (isSkipped(e) ? cachedSearch(c, mode) : Promise.reject(e)));
}

const searchKey = (q: MultiQuery, mode: DataMode) => JSON.stringify([canonical(q), mode]);

type Listener = (offers: Offer[]) => void;
const listeners = new Map<string, Set<Listener>>();
const emit = (key: string, offers: Offer[]) => listeners.get(key)?.forEach((fn) => fn(offers));

/**
 * Sonuç sayfası için: aynı önbellekli arama, ek olarak havayolları yanıt verdikçe o ana kadarki teklifler.
 * Önbellekte varsa ara sonuç olmaz, sonuç hemen gelir. `stop` dinlemeyi bırakır.
 */
export function watchSearch(q: MultiQuery, onPartial: Listener): { result: Promise<Offer[]>; stop: () => void } {
  const key = searchKey(q, dataMode());
  const set = listeners.get(key) ?? new Set<Listener>();
  set.add(onPartial);
  listeners.set(key, set);
  const stop = () => {
    set.delete(onPartial);
    if (!set.size && listeners.get(key) === set) listeners.delete(key);
  };
  const result = searchFlightsCached(q);
  result.then(stop, stop);
  return { result, stop };
}

const inFlight = new Map<string, Promise<Offer[]>>();

export async function getOffer(id: string) {
  // Örnek teklif kimlikleri her modda açılabilir (eski bağlantılar bozulmasın).
  if (id.startsWith("demo_")) return demoProvider.getOffer(id);
  return provider().getOffer(id);
}

async function loadBookingData(id: string): Promise<{ offer: Offer | null; seatMaps: SeatMap[] }> {
  const offer = await getOffer(id);
  if (!offer) return { offer: null, seatMaps: [] };
  // Koltuk haritası alınamazsa (havayolu sunmuyorsa) koltuk seçimi gösterilmez, rezervasyon sürer.
  const seatMaps = await getProviderForOffer(offer)
    .seatMaps(offer)
    .catch((e) => {
      if (!isSkipped(e)) console.error("Koltuk haritası alınamadı:", e);
      return [] as SeatMap[];
    });
  return { offer, seatMaps };
}

/** Rezervasyon sayfası kısa süre bunu yeniden kullanır; ödeme anında teklif her zaman Duffel'dan yeniden alınır. */
const BOOKING_TTL = 2 * 60;
const cachedBookingData = unstable_cache(loadBookingData.bind(null), ["booking-data-v1"], { revalidate: BOOKING_TTL });
const bookingInFlight = new Map<string, Promise<{ offer: Offer | null; seatMaps: SeatMap[] }>>();

/**
 * Rezervasyon sayfasının verisi: teklif ve koltuk haritası. Teklifin fiyatı kimliğine bağlıdır (değişmez), bu yüzden
 * iki dakikalık önbellek fiyatı eskitmez. Paket penceresi açılınca önceden hazırlanır (/api/offer-warm).
 */
export function getBookingData(id: string) {
  if (id.startsWith("demo_")) return loadBookingData(id);
  let p = bookingInFlight.get(id);
  if (!p) {
    p = cachedBookingData(id).finally(() => bookingInFlight.delete(id));
    bookingInFlight.set(id, p);
  }
  // Önceden hazırlama sınır yüzünden ertelendiyse ziyaretçi için yeniden dene
  return isBackground() ? p : p.catch((e) => (isSkipped(e) ? cachedBookingData(id) : Promise.reject(e)));
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

export function getRouteSlugs() {
  return routes.map((r) => ({ nereden: r.from.slug, nereye: r.to.slug }));
}

export function getRoute(from: string, to: string) {
  return routes.find((r) => r.from.slug === from && r.to.slug === to) ?? null;
}
