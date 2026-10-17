// Tarih biçimleri. ISO "YYYY-MM-DD" girişlerini UTC olarak okur; dil Intl yerel ayarıdır (tr-TR, en-GB, nl-NL).
const parse = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

const fmt = (iso: string, loc: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(loc, { timeZone: "UTC", ...opts }).format(parse(iso)).replace(/\.$/, "");

const monthLong = (iso: string, loc: string) => fmt(iso, loc, { month: "long" });

/** "Eki" · "Oct" · "okt" */
export const monthShort = (iso: string, loc = "tr-TR") => fmt(iso, loc, { month: "short" });

/** 24 – 31 Ekim  |  28 Eki – 5 Kas  |  24 Ekim */
export function formatRange(date: string, returnDate?: string, loc = "tr-TR"): string {
  const d1 = parse(date);
  if (!returnDate) return `${d1.getUTCDate()} ${monthLong(date, loc)}`;
  const d2 = parse(returnDate);
  if (d1.getUTCMonth() === d2.getUTCMonth() && d1.getUTCFullYear() === d2.getUTCFullYear()) {
    return `${d1.getUTCDate()} – ${d2.getUTCDate()} ${monthLong(returnDate, loc)}`;
  }
  return `${formatDayShort(date, loc)} – ${formatDayShort(returnDate, loc)}`;
}

/** 31 Eki */
export function formatDayShort(iso: string, loc = "tr-TR"): string {
  return `${parse(iso).getUTCDate()} ${monthShort(iso, loc)}`;
}

/** Cmt 24 Eki · Sat 24 Oct · za 24 okt */
export function formatDayWithWeekday(iso: string, loc = "tr-TR"): string {
  return `${fmt(iso, loc, { weekday: "short" })} ${formatDayShort(iso, loc)}`;
}

/** Pazartesi 26 Ekim · Monday 26 October · maandag 26 oktober */
export function formatDayLong(iso: string, loc = "tr-TR"): string {
  return `${fmt(iso, loc, { weekday: "long" })} ${parse(iso).getUTCDate()} ${monthLong(iso, loc)}`;
}

/** Arama kutusu için kısa: 24 – 31 Eki  |  28 Eki – 5 Kas  |  24 Eki */
export function formatRangeShort(date: string, returnDate?: string, loc = "tr-TR"): string {
  const d1 = parse(date);
  if (!returnDate) return formatDayShort(date, loc);
  const d2 = parse(returnDate);
  if (d1.getUTCMonth() === d2.getUTCMonth() && d1.getUTCFullYear() === d2.getUTCFullYear()) {
    return `${d1.getUTCDate()} – ${formatDayShort(returnDate, loc)}`;
  }
  return `${formatDayShort(date, loc)} – ${formatDayShort(returnDate, loc)}`;
}

/** Ay adları (Ocak…Aralık / January…) */
export function monthNames(loc = "tr-TR", style: "long" | "short" = "long"): string[] {
  return Array.from({ length: 12 }, (_, i) => fmt(`2026-${String(i + 1).padStart(2, "0")}-15`, loc, { month: style }));
}

/** 3 sa 40 dk için { h, m } */
export function minsParts(mins: number, pad = false) {
  const m = mins % 60;
  return { h: Math.floor(mins / 60), m: pad ? String(m).padStart(2, "0") : String(m) };
}

/**
 * Son ödeme gibi tam zaman damgaları: "Pzt 20 Eki 23:00 GMT+2".
 * Sunucu ve tarayıcı aynı metni üretsin diye sabit saat dilimi (Amsterdam) ve kısaltması gösterilir.
 */
export function formatDateTime(isoDateTime: string, loc = "tr-TR"): string {
  return new Intl.DateTimeFormat(loc, {
    timeZone: "Europe/Amsterdam",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(isoDateTime));
}
