import "server-only";
import { demoProvider } from "./demo";
import { duffelProvider } from "./duffel";
import { travelpayoutsProvider } from "./travelpayouts";
import type { FlightProvider, Offer } from "./types";

/** Teklifi ya da rezervasyonu üreten sağlayıcı (örnek teklif her modda örnek sağlayıcıda kalır). */
export function getProviderForOffer(offer: Pick<Offer, "provider">): FlightProvider {
  if (offer.provider === "travelpayouts") return travelpayoutsProvider;
  return offer.provider === "duffel" ? duffelProvider : demoProvider;
}
