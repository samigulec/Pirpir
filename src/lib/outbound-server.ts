// Skyscanner ortaklık bağlantısı (Referrals, impact.com). Parametreler Skyscanner'ın resmî belgesine göre:
// https://developers.skyscanner.net/docs/referrals/flights-parameters
import "server-only";
import { expandCode } from "@/data/airports";
import type { MarketId } from "@/config/markets";
import { aviasalesRoute, type OutboundTrip } from "./outbound";
import { whiteLabelHost } from "@/config/affiliate";

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

// ---- Aviasales (Travelpayouts) ----
// Skyscanner kimliği gelene kadar "Fırsata git" Aviasales'e gider. Komisyonun yazılması için bağlantı Travelpayouts'un
// yönlendiricisinden (tp.media) geçer: marker = ortak kimliği, trs = proje, campaign_id 100 = Aviasales.
// Arama adresi biçimi (resmî belge, "Aviasales affiliate links"): /search/AMS2012IST2712 + sınıf + yetişkin/çocuk/bebek.
// Marker ve proje numarası gizli değildir (her ortaklık bağlantısında görünür).
export const travelpayoutsMarker = () => process.env.TRAVELPAYOUTS_MARKER?.trim() || "812756";
export const travelpayoutsProject = () => process.env.TRAVELPAYOUTS_PROJECT?.trim() || "607607";
const TP_AVIASALES = { campaign: "100", promo: "4114" };


/** Aviasales arama sonuçları adresi (ortak kimliği olmadan). */
export function aviasalesSearchUrl(t: OutboundTrip): string {
  return `https://www.aviasales.com/search/${aviasalesRoute(t)}`;
}

export function aviasalesUrl(t: OutboundTrip, ctx: { currency: string; subId?: string }): string {
  const target = new URL(aviasalesSearchUrl(t));
  // White Label: aynı arama kendi alan adımızda (/flights/…); ortak kimliği alan adına bağlıdır, yönlendirici gerekmez
  const wl = whiteLabelHost();
  if (wl) {
    const live = new URL(`https://${wl}${target.pathname.replace(/^\/search\//, "/flights/")}`);
    if (t.deep) new URL(t.deep, "https://www.aviasales.com").searchParams.forEach((v, k) => live.searchParams.set(k, v));
    live.searchParams.set("currency", ctx.currency.toLowerCase());
    const sub = ctx.subId?.replace(/[^a-z0-9_-]/gi, "").slice(0, 30);
    live.searchParams.set("marker", sub ? `${travelpayoutsMarker()}.${sub}` : travelpayoutsMarker());
    return live.toString();
  }
  // Sonuç kartından gelindiyse aynı bilet işaretli açılır: yolcu ve tarih bizim adresten, bilet kimliği (t=…) Aviasales'ten
  if (t.deep) new URL(t.deep, "https://www.aviasales.com").searchParams.forEach((v, k) => target.searchParams.set(k, v));
  target.searchParams.set("currency", ctx.currency.toLowerCase());
  const p = new URLSearchParams({
    marker: travelpayoutsMarker(),
    trs: travelpayoutsProject(),
    p: TP_AVIASALES.promo,
    campaign_id: TP_AVIASALES.campaign,
    u: target.toString(),
  });
  // Alt kimlik: raporlarda hangi sayfadan gelindiği ayrışır (results, deal, alert…)
  const sub = ctx.subId?.replace(/[^a-z0-9_-]/gi, "").slice(0, 30);
  if (sub) p.set("sub_id", sub);
  return `https://tp.media/r?${p}`;
}
