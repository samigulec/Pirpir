import { type NextRequest } from "next/server";
import { brand } from "@/config/brand";
import { isLocale } from "@/i18n/config";
import { getBookingOrSample } from "@/lib/sample-booking";
import { serverCurrency } from "@/lib/currency-server";
import { planData } from "@/lib/pdf/plan-data";
import { renderPlanPdf } from "@/lib/pdf/TripPlanPdf";

export const runtime = "nodejs";

// Seyahat planı PDF olarak (indirilen dosya). Tarayıcının yazdırma penceresine gerek kalmaz;
// Türkçe harfler için yazı tipi PDF'e gömülüdür. E-bilet değildir, belgenin üzerinde de yazar.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBookingOrSample(decodeURIComponent(id));
  if (!booking) return new Response("Not found", { status: 404 });
  const sp = req.nextUrl.searchParams;
  const lang = sp.get("lang");
  const locale = isLocale(lang) ? lang : "tr";
  // Sayfadaki seçimle aynı para birimi
  const cur = await serverCurrency(sp.get("cur"));

  const pdf = await renderPlanPdf(await planData(booking, locale, cur));
  const name = `${brand.name}-${booking.pnr ?? booking.offer.outbound.fromCode + "-" + booking.offer.outbound.toCode + "-" + booking.offer.outbound.date}.pdf`;
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
