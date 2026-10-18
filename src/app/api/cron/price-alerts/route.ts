import { NextResponse, type NextRequest } from "next/server";
import { checkPriceAlerts } from "@/lib/price-alerts";

// Vercel Cron her sabah çağırır (vercel.json). CRON_SECRET tanımlıysa Vercel isteğe
// "Authorization: Bearer <CRON_SECRET>" ekler; anahtarsız ya da yanlış anahtarlı istek reddedilir.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const summary = await checkPriceAlerts();
  console.log("Fiyat alarmları kontrol edildi:", JSON.stringify(summary));
  return NextResponse.json(summary);
}
