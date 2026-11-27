// Fırsat yayınlandığında isteğe bağlı Telegram kanalına kısa mesaj + OG görseli gönderir.
// Kapalı özellik: TELEGRAM_BOT_TOKEN veya TELEGRAM_CHANNEL_ID boşsa hiçbir şey yapmaz.
import { siteUrl } from "../config/brand";
import { coreCityByCode } from "../data/airports-core";
import type { DealRow } from "./deal-store";
import { formatDayWithWeekday, formatRange } from "./dates";

export type TelegramDealInput = Pick<
  DealRow,
  "id" | "origin" | "destination" | "depart" | "return_date" | "price_eur" | "median_eur" | "seen_at"
> & {
  fromCity?: string;
  toCity?: string;
};

export type TelegramPostOptions = {
  token?: string;
  channelId?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

export type TelegramPostResult =
  | { sent: true }
  | { sent: false; reason: "unconfigured" | "error"; status?: number };

function resolveConfig(opts: Pick<TelegramPostOptions, "token" | "channelId"> = {}) {
  const token = ("token" in opts ? opts.token : process.env.TELEGRAM_BOT_TOKEN)?.trim() ?? "";
  const channelId = ("channelId" in opts ? opts.channelId : process.env.TELEGRAM_CHANNEL_ID)?.trim() ?? "";
  return { token, channelId };
}

/** Telegram fırsat kanalı ortam değişkenlerinin ikisi de tanımlı mı? */
export function isTelegramConfigured(opts: Pick<TelegramPostOptions, "token" | "channelId"> = {}): boolean {
  const { token, channelId } = resolveConfig(opts);
  return Boolean(token && channelId);
}

/** Fırsat için Telegram `sendPhoto` gövdesi (OG görseli + kısa Türkçe açıklama). */
export function buildDealTelegramPayload(deal: TelegramDealInput, baseUrl?: string): { photo: string; caption: string } {
  const base = (baseUrl ?? siteUrl()).replace(/\/$/, "");
  const dealUrl = `${base}/firsatlar/${deal.id}`;
  const photo = `${dealUrl}/opengraph-image`;

  const fromCity = deal.fromCity || coreCityByCode(deal.origin, "tr");
  const toCity = deal.toCity || coreCityByCode(deal.destination, "tr");
  const trip = deal.return_date ? "Gidiş-dönüş" : "Tek yön";
  const dates = formatRange(deal.depart, deal.return_date ?? undefined, "tr-TR");
  const priceEur = Math.round(deal.price_eur);
  const normalEur = Math.round(deal.median_eur);
  const pct = deal.median_eur > 0 ? Math.round(((deal.median_eur - deal.price_eur) / deal.median_eur) * 100) : 0;

  const priceLine =
    pct > 0 && normalEur > priceEur
      ? `€${priceEur} · ${trip} (normalde €${normalEur}, %${pct} daha ucuz)`
      : `€${priceEur} · ${trip}`;

  const lines = [
    `${fromCity} → ${toCity} (${deal.origin} → ${deal.destination})`,
    priceLine,
    `Tarih: ${dates}`,
  ];
  if (deal.seen_at) {
    lines.push(`Fiyat ${formatDayWithWeekday(deal.seen_at, "tr-TR")} tarihinde görüldü`);
  }
  lines.push("", dealUrl);

  return { photo, caption: lines.join("\n") };
}

/**
 * Yayınlanan fırsatı Telegram kanalına gönderir.
 * Değişkenler eksikse sessizce atlar; ağ veya API hatasında asla hata fırlatmaz.
 */
export async function postDealToTelegram(
  deal: TelegramDealInput,
  opts: TelegramPostOptions = {},
): Promise<TelegramPostResult> {
  const { token, channelId } = resolveConfig(opts);
  if (!token || !channelId) return { sent: false, reason: "unconfigured" };

  const { photo, caption } = buildDealTelegramPayload(deal, opts.baseUrl);
  const fetchFn = opts.fetchImpl ?? fetch;

  try {
    const res = await fetchFn(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: channelId, photo, caption }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      console.error("Telegram fırsat gönderimi başarısız:", res.status);
      return { sent: false, reason: "error", status: res.status };
    }
    return { sent: true };
  } catch (e) {
    const msg = (e instanceof Error ? e.message : "bilinmeyen hata").replaceAll(token, "[redacted]");
    console.error("Telegram fırsat gönderimi hatası:", msg);
    return { sent: false, reason: "error" };
  }
}
