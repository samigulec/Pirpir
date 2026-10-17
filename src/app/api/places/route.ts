import { NextResponse, type NextRequest } from "next/server";
import { suggestPlaces } from "@/data/airports";
import { isLocale } from "@/i18n/config";

// Arama kutusu önerileri: dünya listesi tarayıcıya gönderilmeden sunucuda aranır.
export function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").slice(0, 60);
  const lang = req.nextUrl.searchParams.get("lang");
  const items = suggestPlaces(q, isLocale(lang) ? lang : "tr", 10);
  return NextResponse.json(items, { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
