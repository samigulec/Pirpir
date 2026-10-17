import { NextResponse, type NextRequest } from "next/server";
import { isKnownPlace } from "@/data/airports";
import { getDestinationDeals } from "@/lib/deals";

// Kalkış yeri değişince popüler uçuş kartlarının fiyatları buradan yenilenir.
export async function GET(req: NextRequest) {
  const from = [...new Set((req.nextUrl.searchParams.get("from") ?? "").split(",").map((s) => s.trim()))]
    .filter((c) => c && isKnownPlace(c))
    .slice(0, 3);
  if (!from.length) return NextResponse.json({ error: "from" }, { status: 400 });
  const deals = await getDestinationDeals(from);
  return NextResponse.json({ from, deals }, { headers: { "Cache-Control": "public, max-age=600, s-maxage=3600" } });
}
