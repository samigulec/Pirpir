import { NextResponse, type NextRequest } from "next/server";
import { scanDeals } from "@/lib/deal-scanner";

// Vercel Cron her sabah 06:00 UTC'de çağırır (vercel.json). CRON_SECRET ile korunur.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const summary = await scanDeals();
  console.log("Fırsat taraması tamamlandı:", JSON.stringify(summary));
  return NextResponse.json(summary);
}
