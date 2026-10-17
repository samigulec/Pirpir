import { type NextRequest } from "next/server";
import { cityByCode } from "@/data/airports";
import { brand } from "@/config/brand";
import { getBookingOrSample } from "@/lib/sample-booking";
import { isLocale } from "@/i18n/config";
import { addDays } from "@/lib/search";
import type { Leg } from "@/lib/providers/types";

// Takvime ekle: rezervasyonun uçuşlarını .ics dosyası olarak verir.
// Saatler havalimanının yerel saatidir; saat dilimi bilinmediği için "yüzen" saat olarak yazılır.
const T = {
  tr: { flight: "Uçuş", pnr: "Rezervasyon kodu", local: "Saatler yerel saattir." },
  en: { flight: "Flight", pnr: "Booking reference", local: "Times are local times." },
  nl: { flight: "Vlucht", pnr: "Boekingscode", local: "Tijden zijn lokale tijden." },
};

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
const stamp = (date: string, hhmm: string) => `${date.replace(/-/g, "")}T${hhmm.replace(":", "")}00`;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBookingOrSample(decodeURIComponent(id));
  if (!booking || booking.cancelled) return new Response("Not found", { status: 404 });
  const langParam = req.nextUrl.searchParams.get("lang");
  const lang = isLocale(langParam) ? langParam : "tr";
  const t = T[lang];
  const city = (c: string) => cityByCode(c, lang);

  const event = (leg: Leg, i: number) => [
    "BEGIN:VEVENT",
    `UID:${booking.id}-${i}@${brand.name}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART:${stamp(leg.date, leg.dep)}`,
    `DTEND:${stamp(addDays(leg.date, leg.arrDayOffset), leg.arr)}`,
    `SUMMARY:${esc(`${t.flight} ${city(leg.fromCode)} → ${city(leg.toCode)} · ${leg.airline}`)}`,
    `LOCATION:${esc(`${city(leg.fromCode)} (${leg.fromCode})`)}`,
    `DESCRIPTION:${esc(`${leg.fromCode} ${leg.dep} → ${leg.toCode} ${leg.arr}\n${booking.pnr ? `${t.pnr}: ${booking.pnr}\n` : ""}${t.local}`)}`,
    "END:VEVENT",
  ];
  const legs = [booking.offer.outbound, ...(booking.offer.inbound ? [booking.offer.inbound] : [])];
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//${brand.name}//TR`, "CALSCALE:GREGORIAN", ...legs.flatMap(event), "END:VCALENDAR"].join("\r\n");
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${brand.name}-${booking.pnr ?? "ucus"}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
