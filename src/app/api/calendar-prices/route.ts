import { NextResponse, type NextRequest } from "next/server";
import { isKnownPlace } from "@/data/airports";
import { getCalendarPrices } from "@/lib/price-calendar";
import { CABINS } from "@/lib/search";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const codes = (v: string | null) =>
  [...new Set((v ?? "").split(",").map((s) => s.trim()))].filter((c) => c && isKnownPlace(c)).slice(0, 3);

// Takvimdeki gün fiyatları: ?from=AMS&to=ADB&cabin=economy&first=2026-11-01&days=62&nights=7[&depart=2026-11-14]
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const from = codes(p.get("from"));
  const to = codes(p.get("to"));
  const cabin = p.get("cabin") ?? "economy";
  const first = p.get("first") ?? "";
  const days = Math.min(Number(p.get("days")) || 62, 62);
  const nights = Number(p.get("nights"));
  const depart = p.get("depart") ?? undefined;
  const valid =
    from.length > 0 &&
    to.length > 0 &&
    ISO.test(first) &&
    Number.isInteger(nights) &&
    nights >= -1 &&
    nights <= 60 &&
    (CABINS as string[]).includes(cabin) &&
    (!depart || ISO.test(depart));
  if (!valid) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const prices = await getCalendarPrices({ from, to, cabin }, first, days, nights, depart);
  return NextResponse.json(prices, { headers: { "Cache-Control": "private, max-age=120" } });
}
