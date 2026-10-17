import { type NextRequest } from "next/server";
import { isLocale } from "@/i18n/config";
import { getBookingOrSample } from "@/lib/sample-booking";
import { serverCurrency } from "@/lib/currency-server";
import { logoPng } from "@/lib/pdf/logo";
import { planData } from "@/lib/pdf/plan-data";
import { renderPlanPdf } from "@/lib/pdf/TripPlanPdf";
import { planFileName } from "@/lib/trips";

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

  const data = await planData(booking, locale, cur);
  // Aynı logo bir kez çevrilir
  const logos = new Map<string, Promise<string | undefined>>();
  const png = (u?: string) => (u ? (logos.get(u) ?? logos.set(u, logoPng(u)).get(u)!) : Promise.resolve(undefined));
  data.legs = await Promise.all(data.legs.map(async (l) => ({ ...l, logo: await png(l.logo) })));
  const pdf = await renderPlanPdf(data);
  const name = planFileName(booking);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
