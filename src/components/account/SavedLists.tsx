"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCurrency } from "../CurrencyProvider";
import { removeAlert, removeFavorite, type AlertView } from "@/actions/user";
import { formatDayWithWeekday, formatRange } from "@/lib/dates";
import { intlLocale } from "@/lib/intl";
import { searchHref } from "@/lib/search";
import type { Favorite, Saved } from "@/lib/user-types";

const row = "flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-field px-5 py-3";
const small = "min-h-[44px] cursor-pointer rounded-pill border-0 bg-white px-5 font-display text-base font-semibold no-underline";

/**
 * Fiyat alarmları: kurulduğu andaki ve bilinen güncel fiyat yan yana, son kontrol zamanı ve gönderilen e-posta.
 * `notice`: altta hangi açıklama (e-posta açık / henüz yok / örnek mod).
 */
export function SavedAlerts({ initial, names, notice }: { initial: AlertView[]; names: Record<string, string>; notice: "email" | "noEmail" | "demo" }) {
  const t = useTranslations("account.alerts");
  const tc = useTranslations("common");
  const { fmt } = useCurrency();
  const loc = intlLocale(useLocale());
  const stopsText = (n: number) => (n === 0 ? tc("direct") : n === 1 ? tc("oneStop") : tc("stops", { n }));
  const ago = (iso: string) => {
    const mins = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60000));
    const rtf = new Intl.RelativeTimeFormat(loc, { numeric: "auto" });
    return mins < 60 ? rtf.format(-mins, "minute") : mins < 48 * 60 ? rtf.format(-Math.round(mins / 60), "hour") : rtf.format(-Math.round(mins / 1440), "day");
  };
  const [list, setList] = useState(initial);
  const [pending, start] = useTransition();
  const place = (codes: string[]) => codes.map((c) => names[c] ?? c).join(", ");

  if (!list.length) return <p className="m-0 text-muted">{t("empty")}</p>;
  return (
    <div className="flex flex-col gap-3">
      {list.map((a) => {
        const d = a.data;
        const diff = a.now !== null && d.priceAt !== null ? a.now - d.priceAt : null;
        const reached = !a.past && d.targetTry != null && a.now !== null && a.now <= d.targetTry;
        const chips = [
          d.flex ? t("chipFlex") : null,
          d.direct ? t("chipDirect") : null,
          d.bags ? t("chipBags") : null,
          d.targetTry != null ? t("chipTarget", { price: fmt(d.targetTry) }) : null,
        ].filter((x): x is string => !!x);
        // Esnek alarmda "Ara", en ucuz bulunan güne gider
        const searchDates = d.flex && d.best ? { date: d.best.date, returnDate: d.returnDate ? (d.best.returnDate ?? d.returnDate) : "" } : { date: d.date, returnDate: d.returnDate ?? "" };
        return (
          <div key={a.id} className={row}>
            <span className="flex min-w-0 flex-col gap-[2px]">
              <span className="font-extrabold">{place(d.from)} → {place(d.to)}</span>
              <span className="text-sm font-semibold text-muted">{formatRange(d.date, d.returnDate, loc)}</span>
              {chips.length > 0 && (
                <span className="my-1 flex flex-wrap gap-[6px]">
                  {chips.map((c) => (
                    <span key={c} className="rounded-pill bg-white px-3 py-[2px] text-[12px] font-extrabold text-ink">{c}</span>
                  ))}
                  {reached && <span className="rounded-pill bg-green-soft px-3 py-[2px] text-[12px] font-extrabold text-green-text">✓ {t("targetReached")}</span>}
                </span>
              )}
              <span className="text-sm font-bold">
                {a.past
                  ? t("past")
                  : [
                      d.priceAt !== null && t("then", { price: fmt(d.priceAt) }),
                      a.now !== null ? t("now", { price: fmt(a.now) }) : t("nowUnknown"),
                    ].filter(Boolean).join(" · ")}
                {diff !== null && diff !== 0 && (
                  <span className={`ml-2 ${diff < 0 ? "text-green-text" : "text-coral-text"}`}>
                    {diff < 0 ? t("down", { price: fmt(-diff) }) : t("up", { price: fmt(diff) })}
                  </span>
                )}
              </span>
              {!a.past && d.best && (
                <span className="text-[13px] font-bold text-ink">
                  {t("best", { flight: [d.best.airline, stopsText(d.best.stops), `${formatDayWithWeekday(d.best.date, loc)} ${d.best.dep}`].join(" · ") })}
                </span>
              )}
              {!a.past && (d.history?.length ?? 0) >= 2 && <Sparkline points={d.history!.map((h) => h.price)} label={t("history", { n: d.history!.length })} />}
              {!a.past && (d.lastCheckedAt || d.notifiedPrice != null) && (
                <span suppressHydrationWarning className="text-[13px] font-semibold text-muted">
                  {[d.lastCheckedAt && t("checked", { time: ago(d.lastCheckedAt) }), d.notifiedPrice != null && t("notified", { price: fmt(d.notifiedPrice) })]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              )}
            </span>
            <span className="flex gap-2">
              {!a.past && (
                <Link href={searchHref({ from: d.from, to: d.to, pax: d.pax, cabin: d.cabin, bags: d.bags, ...searchDates })} className={`${small} inline-flex items-center text-ink`}>
                  {t("search")}
                </Link>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={() => start(async () => { if ((await removeAlert(a.id)).ok) setList((l) => l.filter((x) => x.id !== a.id)); })}
                className={`${small} text-coral-text`}
              >
                {t("remove")}
              </button>
            </span>
          </div>
        );
      })}
      <p className="m-0 text-sm text-muted">{t(notice === "email" ? "note" : notice === "noEmail" ? "noteNoEmail" : "noteDemo")}</p>
    </div>
  );
}

/** Favori uçuşlar: kaydedildiği andaki fiyatla; tıklayınca o gün yeniden aranır (güncel fiyat). */
export function SavedFavorites({ initial, names, today }: { initial: Saved<Favorite>[]; names: Record<string, string>; today: string }) {
  const t = useTranslations("account.favorites");
  const tc = useTranslations("common");
  const { fmt } = useCurrency();
  const loc = intlLocale(useLocale());
  const [list, setList] = useState(initial);
  const [pending, start] = useTransition();

  if (!list.length) return <p className="m-0 text-muted">{t("empty")}</p>;
  return (
    <div className="flex flex-col gap-3">
      {list.map((f) => {
        const d = f.data;
        const past = d.query.date < today;
        const leg = (l: Favorite["outbound"]) =>
          `${l.dep} ${l.fromCode} → ${l.arr}${l.arrDayOffset ? `+${l.arrDayOffset}` : ""} ${l.toCode} · ${l.stops === 0 ? tc("direct") : l.stops === 1 ? tc("oneStop") : tc("stops", { n: l.stops })}`;
        return (
          <div key={f.id} className={row}>
            <span className="flex min-w-0 flex-col">
              <span className="font-extrabold">
                {names[d.outbound.fromCode] ?? d.outbound.fromCode} → {names[d.outbound.toCode] ?? d.outbound.toCode} · {d.airline}
              </span>
              <span className="text-sm font-semibold text-muted">
                {formatRange(d.query.date, d.query.returnDate, loc)} · {leg(d.outbound)}
                {d.inbound && ` / ${leg(d.inbound)}`}
              </span>
              <span className="text-sm font-bold">{past ? t("past") : t("savedAt", { price: fmt(d.price) })}</span>
            </span>
            <span className="flex gap-2">
              {!past && (
                <Link href={searchHref({ ...d.query, returnDate: d.query.returnDate ?? "" })} className={`${small} inline-flex items-center text-ink`}>
                  {t("search")}
                </Link>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={() => start(async () => { if ((await removeFavorite(f.id)).ok) setList((l) => l.filter((x) => x.id !== f.id)); })}
                className={`${small} text-coral-text`}
              >
                {t("remove")}
              </button>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Son kontrollerin fiyatı: küçük çizgi grafik (en düşük nokta yeşil). */
function Sparkline({ points, label }: { points: number[]; label: string }) {
  const w = 120;
  const h = 28;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const x = (i: number) => (i / (points.length - 1)) * (w - 6) + 3;
  const y = (v: number) => (max === min ? h / 2 : h - 4 - ((v - min) / (max - min)) * (h - 8));
  const d = points.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const low = points.lastIndexOf(min);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} className="mt-1">
      <path d={d} fill="none" stroke="#2F5BD3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(low)} cy={y(min)} r="3.5" fill="#2E7A4D" />
      <circle cx={x(points.length - 1)} cy={y(points[points.length - 1])} r="3" fill="#1E2A44" />
    </svg>
  );
}
