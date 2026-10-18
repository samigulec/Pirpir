import { type NextRequest } from "next/server";
import { cityByCode } from "@/data/airports";
import { brand } from "@/config/brand";
import { getBookingOrSample } from "@/lib/sample-booking";
import { isLocale } from "@/i18n/config";
import { ALARM_CHOICES, legEnd, legStart, type AlarmChoice } from "@/lib/calendar";
import type { Leg } from "@/lib/providers/types";

// Takvime ekle: rezervasyonun uçuşlarını .ics dosyası olarak verir.
// Saatler havalimanının yerel saatidir; saat dilimi bilinmediği için "yüzen" saat olarak yazılır.
const T = {
  tr: { flight: "Uçuş", pnr: "Rezervasyon kodu", local: "Saatler yerel saattir.", day: "Yarın uçuşun var: online check-in'i kontrol et", hours: (h: number) => `${h} saat sonra uçuşun var` },
  en: { flight: "Flight", pnr: "Booking reference", local: "Times are local times.", day: "Your flight is tomorrow: check online check-in", hours: (h: number) => `Your flight leaves in ${h} hours` },
  nl: { flight: "Vlucht", pnr: "Boekingscode", local: "Tijden zijn lokale tijden.", day: "Morgen vlieg je: check online inchecken", hours: (h: number) => `Over ${h} uur vertrekt je vlucht` },
  de: { flight: "Flug", pnr: "Buchungscode", local: "Alle Zeiten sind Ortszeiten.", day: "Morgen fliegst du: denk an den Online-Check-in", hours: (h: number) => `Dein Flug geht in ${h} Stunden` },
  fr: { flight: "Vol", pnr: "Code de réservation", local: "Les heures sont en heure locale.", day: "Tu voles demain : pense à l'enregistrement en ligne", hours: (h: number) => `Ton vol part dans ${h} heures` },
  es: { flight: "Vuelo", pnr: "Código de reserva", local: "Las horas son locales.", day: "Mañana vuelas: revisa el check-in online", hours: (h: number) => `Tu vuelo sale en ${h} horas` },
  it: { flight: "Volo", pnr: "Codice di prenotazione", local: "Gli orari sono locali.", day: "Domani voli: controlla il check-in online", hours: (h: number) => `Il tuo volo parte tra ${h} ore` },
};

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBookingOrSample(decodeURIComponent(id));
  if (!booking || booking.cancelled) return new Response("Not found", { status: 404 });
  const langParam = req.nextUrl.searchParams.get("lang");
  const lang = isLocale(langParam) ? langParam : "tr";
  const t = T[lang];
  const city = (c: string) => cityByCode(c, lang);
  // ?alarms=1440,180 → takvim uygulaması kalkıştan o kadar önce hatırlatır
  const alarms = (req.nextUrl.searchParams.get("alarms") ?? "")
    .split(",")
    .map(Number)
    .filter((m): m is AlarmChoice => (ALARM_CHOICES as readonly number[]).includes(m));
  const alarm = (m: number) => [
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(m >= 1440 ? t.day : t.hours(m / 60))}`,
    `TRIGGER:-PT${m}M`,
    "END:VALARM",
  ];

  const event = (leg: Leg, i: number) => [
    "BEGIN:VEVENT",
    `UID:${booking.id}-${i}@${brand.name}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART:${legStart(leg)}`,
    `DTEND:${legEnd(leg)}`,
    `SUMMARY:${esc(`${t.flight} ${city(leg.fromCode)} → ${city(leg.toCode)} · ${leg.airline}`)}`,
    `LOCATION:${esc(`${city(leg.fromCode)} (${leg.fromCode})`)}`,
    `DESCRIPTION:${esc(`${leg.fromCode} ${leg.dep} → ${leg.toCode} ${leg.arr}\n${booking.pnr ? `${t.pnr}: ${booking.pnr}\n` : ""}${t.local}`)}`,
    ...[...new Set(alarms)].flatMap(alarm),
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
