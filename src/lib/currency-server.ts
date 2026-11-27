import "server-only";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { MARKET_COOKIE, MARKET_GUESS_COOKIE, isMarketId, marketById } from "@/config/markets";
import { CURRENCIES, CURRENCY_COOKIE, RATES, isCurrency, type Currency, type Rates } from "./currency";

const ECB_URL = () => process.env.ECB_RATES_URL?.trim() || "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
/** ECB günlük kurları günde bir güncellenir (cron gerekmez, istekte yenilenir). */
const RATES_TTL = 24 * 3600;
/** AED, USD'ye sabit kurdan bağlıdır (ECB listesinde yok). */
const AED_PER_USD = 3.6725;

/** ECB eurofxref-daily.xml içinden TRY bazlı kurları (`1 TRY = x birim`) çıkarır; geçersizse null. */
export function parseEcbXml(xml: string): Rates | null {
  const perEur: Record<string, number> = { EUR: 1 };
  for (const m of xml.matchAll(/currency=["']([A-Z]{3})["']\s+rate=["']([0-9.]+)["']/g)) {
    const v = Number(m[2]);
    if (Number.isFinite(v) && v > 0) perEur[m[1]] = v;
  }
  const tryPerEur = perEur.TRY;
  if (!tryPerEur || tryPerEur <= 1 || tryPerEur >= 10_000) return null;
  if (perEur.USD && !perEur.AED) perEur.AED = perEur.USD * AED_PER_USD;
  const out = { ...RATES };
  for (const c of CURRENCIES) {
    if (c === "TRY") out.TRY = 1;
    else if (perEur[c]) out[c] = perEur[c] / tryPerEur;
  }
  return out;
}

async function fetchEcbRates(): Promise<Rates> {
  const res = await fetch(ECB_URL(), { signal: AbortSignal.timeout(8_000), cache: "no-store" });
  if (!res.ok) throw new Error(`ECB ${res.status}`);
  const parsed = parseEcbXml(await res.text());
  if (!parsed) throw new Error("ECB XML ayrıştırılamadı");
  return parsed;
}

const cachedRates = unstable_cache(fetchEcbRates.bind(null), ["ecb-rates-v1"], { revalidate: RATES_TTL });
let ratesInFlight: Promise<Rates> | null = null;

/** Güncel ECB kurları (günde bir önbellekte yenilenir); ağ/ayrıştırma hatasında örnek kurlara düşer. */
export async function getRates(): Promise<Rates> {
  if (!ratesInFlight) {
    ratesInFlight = cachedRates()
      .catch((e) => {
        console.warn("Döviz kurları alınamadı, yedek kurlar kullanılıyor:", e instanceof Error ? e.message : e);
        return RATES;
      })
      .finally(() => {
        ratesInFlight = null;
      });
  }
  return ratesInFlight;
}

/** Sunucuda çizilen belgeler için para birimi: bağlantıdaki ?cur → çerez → ülkenin para birimi → TRY. */
export async function serverCurrency(fromUrl?: string | null): Promise<Currency> {
  const jar = await cookies();
  const picked = [fromUrl, jar.get(CURRENCY_COOKIE)?.value].find(isCurrency);
  if (picked) return picked;
  const market = jar.get(MARKET_COOKIE)?.value ?? jar.get(MARKET_GUESS_COOKIE)?.value;
  return isMarketId(market) ? marketById(market).currency : "TRY";
}
