import { NextResponse, type NextRequest } from "next/server";
import { getDayPrice } from "@/lib/deals";
import { parseSearch, validateSearchServer } from "@/lib/search-server";

// Esnek tarih şeridi: her gün için ayrı istek; şerit günleri paralel ister ve geldikçe doldurur.
export async function GET(req: NextRequest) {
  const q = parseSearch(Object.fromEntries(req.nextUrl.searchParams));
  if (validateSearchServer(q)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { price, busy, retryMs, failed } = await getDayPrice(q);
  // busy: istek sınırı yüzünden henüz aranmadı; tarayıcı saklamasın, şerit kısa süre sonra yeniden sorar
  return NextResponse.json(
    { date: q.date, returnDate: q.returnDate, price, busy, retryMs, failed },
    { headers: { "Cache-Control": busy || failed ? "no-store" : "private, max-age=600" } },
  );
}
