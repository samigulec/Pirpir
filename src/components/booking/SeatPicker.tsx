"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCurrency } from "../CurrencyProvider";
import type { Seat, SeatChoice, SeatMap } from "@/lib/providers/types";

/**
 * Koltuk seçimi: uçuş bacağı sekmeleri, yolcu seçimi ve koltuk haritası.
 * Her yolcu her bacakta en fazla bir koltuk seçer; aynı koltuk iki kez seçilemez.
 */
export function SeatPicker({
  maps,
  passengers,
  cityNames,
  value,
  onChange,
}: {
  maps: SeatMap[];
  /** Ödeyen yolcuların etiketleri (bebekler koltuk almaz) */
  passengers: string[];
  cityNames: Record<string, string>;
  value: SeatChoice[];
  onChange: (v: SeatChoice[]) => void;
}) {
  const t = useTranslations("booking.seats");
  const { fmt } = useCurrency();
  const [segment, setSegment] = useState(maps[0]?.segment ?? 0);
  const [pax, setPax] = useState(0);
  const map = maps.find((m) => m.segment === segment) ?? maps[0];
  const city = (code: string) => cityNames[code] ?? code;

  const pickedBy = (designator: string) => value.find((v) => v.segment === map.segment && v.designator === designator)?.pax;
  const mine = (p: number) => value.find((v) => v.segment === map.segment && v.pax === p);

  const choose = (seat: Seat) => {
    const owner = pickedBy(seat.designator);
    const rest = value.filter((v) => !(v.segment === map.segment && (v.pax === pax || v.designator === seat.designator)));
    // Kendi koltuğuna yeniden basınca seçim kalkar
    onChange(owner === pax ? rest : [...rest, { segment: map.segment, pax, designator: seat.designator }]);
    // Sonraki koltuksuz yolcuya geç
    if (owner !== pax && passengers.length > 1) {
      const next = passengers.findIndex((_, i) => i !== pax && !value.some((v) => v.segment === map.segment && v.pax === i));
      if (next >= 0) setPax(next);
    }
  };

  const tab = (on: boolean) =>
    `min-h-[44px] cursor-pointer rounded-pill border-0 px-4 py-2 font-display text-base font-semibold leading-[normal] ${on ? "bg-ink text-white" : "bg-field text-ink"}`;

  return (
    <div className="flex flex-col gap-3">
      {maps.length > 1 && (
        <div role="tablist" aria-label={t("title")} className="flex flex-wrap gap-2">
          {maps.map((m) => (
            <button key={m.segment} type="button" role="tab" aria-selected={m.segment === map.segment} onClick={() => setSegment(m.segment)} className={tab(m.segment === map.segment)}>
              {t("flight", { from: city(m.fromCode), to: city(m.toCode) })}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {passengers.map((label, i) => {
          const s = mine(i);
          const on = i === pax;
          return (
            <button
              key={i}
              type="button"
              aria-pressed={on}
              onClick={() => setPax(i)}
              className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-[14px] border-2 border-solid px-3 py-2 text-left text-sm font-extrabold text-ink ${on ? "border-primary bg-sky" : "border-line bg-white"}`}
            >
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary text-[12px] text-white">{i + 1}</span>
              {s ? t("picked", { pax: label, seat: s.designator }) : t("notPicked", { pax: label })}
            </button>
          );
        })}
      </div>

      <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[13px] font-bold text-muted">
        <li className="flex items-center gap-[6px]"><span className="h-4 w-4 rounded-[5px] border-2 border-solid border-green bg-green-soft" />{t("legendFree")}</li>
        <li className="flex items-center gap-[6px]"><span className="h-4 w-4 rounded-[5px] border-2 border-solid border-blue-soft bg-sky" />{t("legendPaid")}</li>
        <li className="flex items-center gap-[6px]"><span className="h-4 w-4 rounded-[5px] border-2 border-solid border-sun bg-sun-soft" />{t("legendLegroom")}</li>
        <li className="flex items-center gap-[6px]"><span className="h-4 w-4 rounded-[5px] bg-line" />{t("legendTaken")}</li>
        <li className="flex items-center gap-[6px]"><span className="h-4 w-4 rounded-[5px] bg-primary" />{t("legendSelected")}</li>
      </ul>

      {/* Geniş gövdeli uçakta harita telefondan geniş olabilir: yalnızca harita kayar, sayfa değil */}
      <div className="max-h-[560px] overflow-auto rounded-[24px] border-2 border-solid border-line bg-white px-3 py-4">
        <div className="mx-auto flex w-max flex-col items-center gap-[6px]">
          <div className="flex gap-[6px]" aria-hidden="true">
            <span className="w-7" />
            {map.columns.map((c, i) => (
              <span key={i} className={`${c ? "w-11" : "w-5"} text-center text-[13px] font-extrabold text-muted`}>{c}</span>
            ))}
          </div>
          {map.rows.map((row) => (
            <div key={row.number} className="flex flex-col items-center gap-[6px]">
              {row.exit && <span className="text-[11px] font-extrabold uppercase text-muted">{t("exit")}</span>}
              <div className="flex items-center gap-[6px]">
                <span className="w-7 text-right text-[13px] font-extrabold text-muted" aria-hidden="true">{row.number}</span>
                {row.seats.map((seat, i) => {
                  if (!map.columns[i]) return <span key={i} className="w-5" />;
                  if (!seat) return <span key={i} className="w-11" />;
                  const owner = pickedBy(seat.designator);
                  const selected = owner !== undefined;
                  const tone = !seat.available
                    ? "border-transparent bg-line text-muted"
                    : selected
                      ? "border-primary bg-primary text-white"
                      : seat.legroom
                        ? "border-sun bg-sun-soft text-ink"
                        : seat.price === 0
                          ? "border-green bg-green-soft text-ink"
                          : "border-blue-soft bg-sky text-ink";
                  const price = seat.price === 0 ? t("free") : fmt(seat.price);
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={!seat.available}
                      aria-pressed={selected}
                      aria-label={seat.available ? t("seat", { seat: seat.designator, price }) : t("seatTaken", { seat: seat.designator })}
                      title={seat.available ? `${seat.designator} · ${price}` : undefined}
                      onClick={() => choose(seat)}
                      className={`flex h-11 w-11 flex-none cursor-pointer flex-col items-center justify-center rounded-[10px] border-2 border-solid p-0 text-[10px] font-extrabold leading-[1.1] disabled:cursor-not-allowed ${tone}`}
                    >
                      {selected ? <span className="text-[14px]">{owner + 1}</span> : seat.available ? <span>{seat.price === 0 ? "✓" : fmt(seat.price).replace(/\s/g, "")}</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
