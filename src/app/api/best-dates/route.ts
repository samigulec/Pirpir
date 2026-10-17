import { NextResponse, type NextRequest } from "next/server";
import { isKnownPlace } from "@/data/airports";
import { getBestDates } from "@/lib/deals";

const codes = (v: string | null) =>
  [...new Set((v ?? "").split(",").map((s) => s.trim()))].filter((c) => c && isKnownPlace(c)).slice(0, 3);

// Arama kutusu: rota seçilince bilinen en ucuz tarih (?from=AMS&to=ADB). Bilinmiyorsa { best: null }.
export async function GET(req: NextRequest) {
  const from = codes(req.nextUrl.searchParams.get("from"));
  const to = codes(req.nextUrl.searchParams.get("to"));
  if (!from.length || !to.length) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const best = await getBestDates(from, to);
  return NextResponse.json({ best }, { headers: { "Cache-Control": "private, max-age=300" } });
}
