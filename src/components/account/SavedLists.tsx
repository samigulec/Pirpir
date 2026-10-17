"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCurrency } from "../CurrencyProvider";
import { removeAlert, removeFavorite, type AlertView } from "@/actions/user";
import { formatRange } from "@/lib/dates";
import { intlLocale } from "@/lib/intl";
import { searchHref } from "@/lib/search";
import type { Favorite, Saved } from "@/lib/user-types";

const row = "flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-field px-5 py-3";
const small = "min-h-[44px] cursor-pointer rounded-pill border-0 bg-white px-5 font-display text-base font-semibold no-underline";

/** Fiyat alarmları: kurulduğu andaki ve bilinen güncel fiyat (son 24 saatte bulunan) yan yana. */
export function SavedAlerts({ initial, names }: { initial: AlertView[]; names: Record<string, string> }) {
  const t = useTranslations("account.alerts");
  const { fmt } = useCurrency();
  const loc = intlLocale(useLocale());
  const [list, setList] = useState(initial);
  const [pending, start] = useTransition();
  const place = (codes: string[]) => codes.map((c) => names[c] ?? c).join(", ");

  if (!list.length) return <p className="m-0 text-muted">{t("empty")}</p>;
  return (
    <div className="flex flex-col gap-3">
      {list.map((a) => {
        const d = a.data;
        const diff = a.now !== null && d.priceAt !== null ? a.now - d.priceAt : null;
        return (
          <div key={a.id} className={row}>
            <span className="flex min-w-0 flex-col">
              <span className="font-extrabold">{place(d.from)} → {place(d.to)}</span>
              <span className="text-sm font-semibold text-muted">{formatRange(d.date, d.returnDate, loc)}</span>
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
            </span>
            <span className="flex gap-2">
              {!a.past && (
                <Link href={searchHref({ ...d, returnDate: d.returnDate ?? "" })} className={`${small} inline-flex items-center text-ink`}>
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
      <p className="m-0 text-sm text-muted">{t("note")}</p>
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
