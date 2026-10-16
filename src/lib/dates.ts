// Tarih biçimleri (tr-TR). ISO "YYYY-MM-DD" girişlerini UTC olarak okur.
const parse = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("tr-TR", { timeZone: "UTC", ...opts }).format(parse(iso));

/** "Eki" (tasarımdaki 3 harfli kısaltma) */
const shortMonth = (iso: string) => fmt(iso, { month: "long" }).slice(0, 3);

/** 24 – 31 Ekim  |  28 Eki – 5 Kas  |  24 Ekim */
export function formatRange(date: string, returnDate?: string): string {
  const d1 = parse(date);
  if (!returnDate) return fmt(date, { day: "numeric", month: "long" });
  const d2 = parse(returnDate);
  if (d1.getUTCMonth() === d2.getUTCMonth()) {
    return `${d1.getUTCDate()} – ${fmt(returnDate, { day: "numeric", month: "long" })}`;
  }
  return `${d1.getUTCDate()} ${shortMonth(date)} – ${d2.getUTCDate()} ${shortMonth(returnDate)}`;
}

/** 31 Eki */
export function formatDayShort(iso: string): string {
  return `${parse(iso).getUTCDate()} ${shortMonth(iso)}`;
}

/** Cmt 24 Eki */
export function formatDayWithWeekday(iso: string): string {
  const wd = fmt(iso, { weekday: "short" });
  return `${wd} ${formatDayShort(iso)}`;
}

/** Pazartesi 26 Ekim */
export function formatDayLong(iso: string): string {
  return `${fmt(iso, { weekday: "long" })} ${fmt(iso, { day: "numeric", month: "long" })}`;
}
