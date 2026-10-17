"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { addDays } from "@/lib/search";
import { formatDayWithWeekday } from "@/lib/dates";
import { intlLocale } from "@/lib/intl";

/** YYYY-MM-DD ayın ilk günü */
const monthStart = (iso: string) => iso.slice(0, 8) + "01";
const addMonths = (iso: string, n: number) => {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + n, 1);
  return d.toISOString().slice(0, 10);
};
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

/**
 * Kiwi tarzı takvim: masaüstünde yan yana iki ay, telefonda tek ay.
 * Gidiş-dönüşte önce gidiş, sonra dönüş seçilir; aradaki günler boyanır.
 */
export function DateRangePicker({
  mode,
  start,
  end,
  min,
  onChange,
  onDone,
}: {
  mode: "range" | "single";
  start: string;
  end?: string;
  min: string;
  onChange: (start: string, end?: string) => void;
  onDone: () => void;
}) {
  const t = useTranslations("home.search");
  const locale = useLocale();
  const loc = intlLocale(locale);
  const [view, setView] = useState(monthStart(start));
  // Hangi tarih seçiliyor: gidiş mi dönüş mü
  const [picking, setPicking] = useState<"start" | "end">("start");
  const [hover, setHover] = useState<string | null>(null);

  const weekdays = useMemo(
    () =>
      // 2024-01-01 bir pazartesi
      Array.from({ length: 7 }, (_, i) =>
        new Intl.DateTimeFormat(loc, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 1 + i))).replace(/\.$/, ""),
      ),
    [loc],
  );

  const pick = (day: string) => {
    if (mode === "single") {
      onChange(day);
      return;
    }
    if (picking === "start" || (end && day < start) || day < start) {
      onChange(day, undefined);
      setPicking("end");
    } else {
      onChange(start, day);
      setPicking("start");
    }
  };

  const rangeEnd = mode === "range" ? (end ?? (picking === "end" && hover && hover >= start ? hover : undefined)) : undefined;
  const nights = mode === "range" && end ? daysBetween(start, end) : null;
  const canPrev = view > monthStart(min);

  const Month = ({ first, className }: { first: string; className?: string }) => {
    const title = new Intl.DateTimeFormat(loc, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(first + "T00:00:00Z"));
    const lead = (new Date(first + "T00:00:00Z").getUTCDay() + 6) % 7; // pazartesi = 0
    const count = daysBetween(first, addMonths(first, 1));
    return (
      <div className={`flex flex-col gap-2 ${className ?? ""}`}>
        <span className="text-center font-display text-lg font-semibold capitalize">{title}</span>
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {weekdays.map((w) => (
            <span key={w} className="pb-1 text-[12px] font-extrabold uppercase text-muted">{w}</span>
          ))}
          {Array.from({ length: lead }, (_, i) => <span key={"e" + i} />)}
          {Array.from({ length: count }, (_, i) => {
            const day = addDays(first, i);
            const disabled = day < min;
            const isStart = day === start;
            const isEnd = mode === "range" && day === rangeEnd;
            const inRange = mode === "range" && rangeEnd !== undefined && day > start && day < rangeEnd;
            const edge = isStart || isEnd;
            return (
              <div
                key={day}
                className={`flex justify-center ${inRange ? "bg-sky" : ""} ${isStart && rangeEnd && rangeEnd !== start ? "bg-gradient-to-r from-transparent from-50% to-sky to-50%" : ""} ${isEnd && rangeEnd !== start ? "bg-gradient-to-r from-sky from-50% to-transparent to-50%" : ""}`}
              >
                <button
                  type="button"
                  disabled={disabled}
                  aria-pressed={edge}
                  aria-label={formatDayWithWeekday(day, loc)}
                  onClick={() => pick(day)}
                  onMouseEnter={() => setHover(day)}
                  className={`h-10 w-10 cursor-pointer rounded-full border-0 text-[15px] font-bold leading-[normal] disabled:cursor-not-allowed disabled:text-line ${
                    edge ? "bg-primary text-white" : inRange ? "bg-transparent text-ink" : "bg-transparent text-ink hover:bg-field"
                  }`}
                >
                  {i + 1}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const nav =
    "flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-0 bg-field text-ink disabled:cursor-not-allowed disabled:opacity-40";
  const tab = (active: boolean) =>
    `flex flex-1 cursor-pointer flex-col items-start rounded-[16px] border-2 border-solid px-4 py-2 text-left ${active ? "border-primary bg-sky" : "border-line bg-white"}`;

  return (
    <div className="flex flex-col gap-4 md:w-[640px]" onMouseLeave={() => setHover(null)}>
      <div className="flex gap-2">
        <button type="button" onClick={() => setPicking("start")} className={tab(mode === "single" || picking === "start")}>
          <span className="text-[12px] font-extrabold text-muted">{t("departDate")}</span>
          <span className="font-extrabold">{formatDayWithWeekday(start, loc)}</span>
        </button>
        {mode === "range" && (
          <button type="button" onClick={() => setPicking("end")} className={tab(picking === "end")}>
            <span className="text-[12px] font-extrabold text-muted">{t("returnDate")}</span>
            <span className="font-extrabold">{end ? formatDayWithWeekday(end, loc) : t("pickReturn")}</span>
          </button>
        )}
      </div>

      <div className="relative">
        <div className="absolute left-0 right-0 top-0 flex justify-between">
          <button type="button" aria-label={t("prevMonth")} disabled={!canPrev} onClick={() => setView(addMonths(view, -1))} className={nav}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <button type="button" aria-label={t("nextMonth")} onClick={() => setView(addMonths(view, 1))} className={nav}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-1 gap-8 pt-2 md:grid-cols-2">
          <Month first={view} />
          <Month first={addMonths(view, 1)} className="hidden md:flex" />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-0 border-t border-solid border-line pt-3">
        <span className="text-[15px] font-bold text-muted">
          {mode === "range" ? (nights !== null ? t("nights", { n: nights }) : t("pickReturnHint")) : t("oneWayHint")}
        </span>
        <button
          type="button"
          onClick={onDone}
          disabled={mode === "range" && !end}
          className="min-h-[48px] cursor-pointer rounded-pill border-0 bg-primary px-7 font-display text-[17px] font-semibold leading-[normal] text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("done")}
        </button>
      </div>
    </div>
  );
}
