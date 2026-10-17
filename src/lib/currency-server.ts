import "server-only";
import { cookies } from "next/headers";
import { MARKET_COOKIE, MARKET_GUESS_COOKIE, isMarketId, marketById } from "@/config/markets";
import { CURRENCY_COOKIE, isCurrency, type Currency } from "./currency";

/** Sunucuda çizilen belgeler için para birimi: bağlantıdaki ?cur → çerez → ülkenin para birimi → TRY. */
export async function serverCurrency(fromUrl?: string | null): Promise<Currency> {
  const jar = await cookies();
  const picked = [fromUrl, jar.get(CURRENCY_COOKIE)?.value].find(isCurrency);
  if (picked) return picked;
  const market = jar.get(MARKET_COOKIE)?.value ?? jar.get(MARKET_GUESS_COOKIE)?.value;
  return isMarketId(market) ? marketById(market).currency : "TRY";
}
