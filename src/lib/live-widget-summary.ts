// Canlı widget kartlarından sıralama sekmeleri (En iyi / En ucuz / En hızlı) için özet fiyat ve toplam süre çıkarır.
// Saf yardımcı modül: okunamayan veya kısmi listeden güvenilemeyen değerler asla uydurulmaz (`undefined` döner).

export type TabSummary = {
  priceText: string;
  durText?: string;
};

export type WidgetTabSummaries = {
  best?: TabSummary;
  cheap?: TabSummary;
  fast?: TabSummary;
};

export type CardMetrics = {
  price: number;
  priceText: string;
  totalMins: number;
  durText?: string;
  direct: boolean;
};

const BIDI_RE = /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;
const STOP_WORD_RE = /\b(aktarma|konaklama|stop|stops|layover|layovers|tussenstop|zwischenstopp|escale|escala|scalo)\b/i;

const UNIT_LABELS: Record<string, [string, string]> = {
  tr: ["s", "dk"],
  nl: ["u", "min"],
  de: ["Std", "Min"],
  fr: ["h", "min"],
  es: ["h", "min"],
  it: ["h", "min"],
  en: ["h", "m"],
};

/** Toplam dakikayı yerel kısa süre biçimine çevirir ("3s 25dk", "11u 30min", "6h 10m"). */
export function formatTotalMins(totalMins: number, locale = "tr"): string | undefined {
  if (!Number.isFinite(totalMins) || totalMins <= 0) return undefined;
  const mins = Math.round(totalMins);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const [hu, mu] = UNIT_LABELS[locale.slice(0, 2).toLowerCase()] ?? UNIT_LABELS.en;
  if (h && m) return `${h}${hu} ${m}${mu}`;
  if (h) return `${h}${hu}`;
  return `${m}${mu}`;
}

/** "Seyahat süresi: 3s 25dk", "1g 1s 20dk", "Travel time: 1d 6h 10min", "4 s", "3u 25m" → toplam dakika (okunamazsa 0). */
export function parseDurationMins(raw: string): number {
  const s = raw.replace(BIDI_RE, " ").replace(/\u00a0/g, " ");
  const d = /(\d+)\s*(?:gün|Tage?|g|j)\b/i.exec(s) ?? /(\d+)\s*d\b(?=\s*\d+\s*(?:h|u|Std))/i.exec(s);
  const h = /(\d+)\s*(?:sa|Std\.?|h|u|s)\b/i.exec(s);
  const m = /(\d+)\s*(?:dk|min\.?|m)\b/i.exec(s);
  const days = d ? Number(d[1]) : 0;
  const hours = h ? Number(h[1]) : 0;
  const mins = m ? Number(m[1]) : 0;
  return days * 1440 + hours * 60 + mins;
}

/** "Direkt uçuşSeyahat süresi: 3s 25dk" → "3s 25dk", "Seyahat süresi: 1g 1s" → "1g 1s" (okunamazsa undefined). */
export function cleanDurationText(raw: string): string | undefined {
  const s = raw.replace(BIDI_RE, " ").replace(/\u00a0/g, " ").trim();
  const m = /((?:\d+\s*(?:gün|Tage?|g|j|d(?!k))\s*)?\d+\s*(?:sa|Std\.?|h|u|s)(?:\s*\d+\s*(?:dk|min\.?|m))?|\d+\s*(?:dk|min\.?|m))/i.exec(s);
  return m ? m[1].replace(/\s+/g, " ").trim() : undefined;
}

/**
 * Tüm biletler DOM'da yüklüyken (kısmi liste değilken) En iyi / En ucuz / En hızlı özetlerini hesaplar.
 * Çok bacaklı gidiş-dönüşlerde toplam süreyi kullanır (yalnızca ilk bacağı göstermez).
 */
export function computeTabSummaries(cards: CardMetrics[], locale = "tr"): WidgetTabSummaries {
  const valid = cards.filter((c) => c.price > 0 && c.price < 1e9 && c.priceText.length > 0);
  if (!valid.length) return {};

  const toSummary = (c?: CardMetrics): TabSummary | undefined =>
    c ? { priceText: c.priceText, durText: c.durText ?? formatTotalMins(c.totalMins, locale) } : undefined;

  const best = valid[0];
  const cheapest = [...valid].sort((a, b) => a.price - b.price || a.totalMins - b.totalMins)[0];
  const withDur = valid.filter((c) => c.totalMins > 0);
  const fastest = withDur.length ? [...withDur].sort((a, b) => a.totalMins - b.totalMins || a.price - b.price)[0] : undefined;

  return {
    best: toSummary(best),
    cheap: toSummary(cheapest),
    fast: toSummary(fastest),
  };
}

/** Tek bir shadow DOM uçuş kartından fiyat, toplam süre ve direkt bilgisini okur. */
export function readCardMetrics(card: Element, locale = "tr"): CardMetrics {
  const rawPrice = (card.querySelector('[data-testid^="flight-card-price"]')?.textContent ?? "").replace(BIDI_RE, "").trim();
  const price = Number(rawPrice.replace(/[^\d]/g, "")) || 1e9;
  const priceText = rawPrice.replace(/\s+/g, " ");

  const durEls = [...card.querySelectorAll('[class*="Flight-module__cardFlightTravelTime___"]')];
  let totalMins = 0;
  let legCount = 0;
  let singleDurText: string | undefined;
  let hasStopWord = false;
  for (const el of durEls) {
    const txt = el.textContent ?? "";
    const mins = parseDurationMins(txt);
    if (mins > 0) {
      totalMins += mins;
      legCount++;
    }
    if (!singleDurText) singleDurText = cleanDurationText(txt);
    if (STOP_WORD_RE.test(txt)) hasStopWord = true;
  }

  const durText = legCount > 1 ? formatTotalMins(totalMins, locale) : singleDurText ?? formatTotalMins(totalMins, locale);
  const hasTransferSeg =
    card.querySelector('[class*="cardFlightTravelLineTopTransfer___"], [class*="cardFlightTravelDetailMobile___"]') !== null;
  const direct = !hasTransferSeg && !hasStopWord;

  return { price, priceText, totalMins, durText, direct };
}
