import "server-only";
import { demoProvider } from "./demo";
import { duffelProvider } from "./duffel";
import type { FlightProvider, Offer } from "./types";

/** Teklifi üreten sağlayıcı (örnek teklif her modda örnek sağlayıcıda kalır). */
export function getProviderForOffer(offer: Offer): FlightProvider {
  return offer.provider === "duffel" ? duffelProvider : demoProvider;
}
