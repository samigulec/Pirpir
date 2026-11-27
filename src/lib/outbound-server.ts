// Skyscanner ortaklık bağlantısı (Referrals, impact.com). Parametreler Skyscanner'ın resmî belgesine göre:
// https://developers.skyscanner.net/docs/referrals/flights-parameters
import "server-only";
import { expandCode } from "@/data/airports";
import type { MarketId } from "@/config/markets";
import type { OutboundTrip } from "./outbound";

/** Ortaklık kimliği (impact.com'daki Skyscanner programından). Yoksa bağlantı yine çalışır ama komisyon kazanılmaz. */
export const skyscannerPartnerId = () => process.env.SKYSCANNER_MEDIA_PARTNER_ID?.trim() || null;

// Şehir grupları için Skyscanner'ın "tüm havalimanları" kodları; listede olmayan grupta en büyük havalimanı kullanılır.
const SKYSCANNER_CITY: Record<string, string> = { LON: "LOND", PAR: "PARI", ROM: "ROME", MIL: "MILA", IST: "ISTA", NYC: "NYCA", STO: "STOC" };

function place(code: string): string {
  if (!code.startsWith("city:")) return code;
  const metro = code.slice(5);
  return SKYSCANNER_CITY[metro] ?? expandCode(code, 1)[0] ?? metro;
}

const LOCALES: Record<string, string> = { tr: "tr-TR", en: "en-GB", nl: "nl-NL", de: "de-DE", fr: "fr-FR", es: "es-ES", it: "it-IT" };
const CABIN: Record<OutboundTrip["cabin"], string> = { economy: "economy", premium_economy: "premiumeconomy", business: "business", first: "first" };

export function skyscannerUrl(t: OutboundTrip, ctx: { market: MarketId; locale: string; currency: string; utmTerm?: string }): string {
  const p = new URLSearchParams({
    origin: place(t.from),
    destination: place(t.to),
    outboundDate: t.date,
    adultsv2: String(t.adults),
    cabinclass: CABIN[t.cabin],
    // Skyscanner Birleşik Krallık için "UK" kullanır
    market: ctx.market === "GB" ? "UK" : ctx.market,
    locale: LOCALES[ctx.locale] ?? "en-GB",
    currency: ctx.currency,
  });
  if (t.returnDate) p.set("inboundDate", t.returnDate);
  // Çocuk ve bebekler yaşlarıyla gönderilir (yaşı bilinmiyor: çocuk 8, bebek 1 varsayılır; fiyat sınıfı aynı kalır)
  const ages = [...Array(t.children).fill("8"), ...Array(t.infants).fill("1")];
  if (ages.length) p.set("childrenv2", ages.join("|"));
  if (ctx.utmTerm) p.set("utm_term", ctx.utmTerm);
  const id = skyscannerPartnerId();
  if (id) p.set("mediaPartnerId", id);
  return `https://www.skyscanner.net/g/referrals/v1/flights/day-view?${p}`;
}
