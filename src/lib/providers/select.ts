import "server-only";
import { demoProvider } from "./demo";
import { duffelProvider } from "./duffel";
import type { FlightProvider, Offer } from "./types";

/** Teklifi ya da rezervasyonu üreten sağlayıcı (örnek teklif her modda örnek sağlayıcıda kalır). */
export function getProviderForOffer(offer: Pick<Offer, "provider">): FlightProvider {
  return offer.provider === "duffel" ? duffelProvider : demoProvider;
}
