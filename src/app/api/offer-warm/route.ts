import { NextResponse, type NextRequest } from "next/server";
import { getBookingData } from "@/lib/flights";
import { inBackground } from "@/lib/providers/rate-limit";

// Paket penceresi açılınca: rezervasyon sayfasının verisini önceden önbelleğe alır. Arka plan önceliğinde
// (ziyaretçinin aramasından pay almaz); sınır darsa hiçbir şey yapmaz, sayfa açılınca yine alınır.
export async function POST(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!/^off_[A-Za-z0-9]+$/.test(id)) return NextResponse.json({ ok: false }, { status: 400 });
  const ok = await inBackground(() => getBookingData(id))
    .then(() => true)
    .catch(() => false);
  return NextResponse.json({ ok });
}
