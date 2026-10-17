import type { Leg } from "./providers/types";
import { addDays } from "./search";

/** Takvim hatırlatma seçenekleri (dakika, kalkıştan önce): 1 gün (check-in), 3 saat, 1 saat */
export const ALARM_CHOICES = [1440, 180, 60] as const;
export type AlarmChoice = (typeof ALARM_CHOICES)[number];

const stamp = (date: string, hhmm: string) => `${date.replace(/-/g, "")}T${hhmm.replace(":", "")}00`;

/** Saatler yerel saattir (havalimanının saat dilimi bilinmiyor; "yüzen" saat). */
export const legStart = (l: Leg) => stamp(l.date, l.dep);
export const legEnd = (l: Leg) => stamp(addDays(l.date, l.arrDayOffset), l.arr);

/** Google Takvim'de etkinlik oluşturma bağlantısı (hatırlatmayı Google'ın kendi ayarı belirler). */
export function googleCalendarUrl(leg: Leg, title: string, details: string, location: string): string {
  const q = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${legStart(leg)}/${legEnd(leg)}`, details, location });
  return `https://calendar.google.com/calendar/render?${q}`;
}
