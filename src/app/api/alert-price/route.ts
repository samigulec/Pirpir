import { NextResponse, type NextRequest } from "next/server";
import { getAlertPreviewPrice } from "@/lib/alert-price";
import { parseSearch, validateSearchServer } from "@/lib/search-server";

// Fiyat alarmı penceresi ("Neyi takip edelim?"): seçilen tarih/esneklik/aktarma için
// 10 dk önbellekli en düşük fiyatı ve görülme gününü döndürür.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (!sp.get("from") || !sp.get("to") || !sp.get("date")) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const q = parseSearch(Object.fromEntries(sp));
  if (validateSearchServer(q)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const flex: 0 | 3 = sp.get("flex") === "3" ? 3 : 0;
  const direct = sp.get("direct") === "1" || sp.get("direct") === "true";

  try {
    const result = await getAlertPreviewPrice(q, { flex, direct });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, max-age=600" },
    });
  } catch (e) {
    console.error("Alarm önizleme fiyatı alınamadı:", e instanceof Error ? e.message : e);
    return NextResponse.json({ best: null, source: "demo" }, { headers: { "Cache-Control": "no-store" } });
  }
}
