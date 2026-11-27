import { NextResponse, type NextRequest } from "next/server";
import { getDayPrice, getStripPrices } from "@/lib/deals";
import { priceSource } from "@/lib/flights";
import { parseSearch, validateSearchServer } from "@/lib/search-server";

// Esnek tarih şeridi: ortaklık (Travelpayouts) modunda `strip=1` tek istekte ±3 günü ay verisinden (`grouped_prices`)
// döndürür; Duffel/örnek modda her gün ayrı ve paralel istenir.
export async function GET(req: NextRequest) {
  const q = parseSearch(Object.fromEntries(req.nextUrl.searchParams));
  if (validateSearchServer(q)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (req.nextUrl.searchParams.get("strip") === "1" && priceSource() === "travelpayouts") {
    const { prices, failed } = await getStripPrices(q);
    return NextResponse.json(
      { prices, failed },
      { headers: { "Cache-Control": failed ? "no-store" : "private, max-age=600" } },
    );
  }
  const { price, busy, retryMs, failed } = await getDayPrice(q);
  // busy: istek sınırı yüzünden henüz aranmadı; tarayıcı saklamasın, şerit kısa süre sonra yeniden sorar
  return NextResponse.json(
    { date: q.date, returnDate: q.returnDate, price, busy, retryMs, failed },
    { headers: { "Cache-Control": busy || failed ? "no-store" : "private, max-age=600" } },
  );
}
