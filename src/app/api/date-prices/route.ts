import { NextResponse, type NextRequest } from "next/server";
import { getDatePrices } from "@/lib/deals";
import { parseSearch, validateSearchServer } from "@/lib/search-server";

// Esnek tarih şeridi: arama sayfası açıldıktan sonra ±3 günün en düşük fiyatları buradan gelir.
export async function GET(req: NextRequest) {
  const q = parseSearch(Object.fromEntries(req.nextUrl.searchParams));
  if (validateSearchServer(q)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const days = await getDatePrices(q);
  return NextResponse.json({ days }, { headers: { "Cache-Control": "private, max-age=600" } });
}
