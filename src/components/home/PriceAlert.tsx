"use client";

import { useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { coreCityByCode } from "@/data/airports-core";
import { addDays, searchHref, todayIso } from "@/lib/search";
import { Pirpir } from "../characters";
import { AirportField, type AirportValue } from "./AirportField";

const field = "flex min-w-0 flex-col rounded-[18px] bg-white px-4 py-[10px]";
const fieldLabel = "text-[12px] font-extrabold text-muted";
const fieldInput = "min-w-0 border-0 bg-transparent p-0 text-base font-extrabold text-ink outline-none";

/**
 * Ana sayfadaki fiyat alarmı: rota ve tarih seçilir, "Alarm kur" o aramayı açar ve alarm orada kurulur
 * (`alarm=1`; giriş yapılmamışsa giriş penceresi açılır). E-posta yalnızca hesabın doğrulanmış adresine gider,
 * böylece formdan başkasının adresine alarm kurulamaz.
 */
export function PriceAlert({ defaultFrom }: { defaultFrom: string }) {
  const t = useTranslations("home.alert");
  const ts = useTranslations("home.search");
  const tc = useTranslations("common.characters");
  const locale = useLocale();
  const router = useRouter();
  const id = useId();
  const today = todayIso();
  // Varsayılan: sonuç sayfasının önerdiği hafta sonu (iki hafta sonrası)
  const dflt = searchHref({}).query;
  const [from, setFrom] = useState<AirportValue>([{ code: defaultFrom, label: coreCityByCode(defaultFrom, locale) }]);
  const [to, setTo] = useState<AirportValue>([]);
  const [date, setDate] = useState(dflt.date);
  const [returnDate, setReturnDate] = useState(dflt.return ?? "");
  const [error, setError] = useState<"route" | "date" | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from.length || !to.length) return setError("route");
    if (!date || date < today) return setError("date");
    const ret = returnDate && returnDate >= date ? returnDate : "";
    const q = searchHref({ from: from.map((p) => p.code), to: to.map((p) => p.code), date, returnDate: ret }).query;
    router.push({ pathname: "/ara", query: { ...q, alarm: "1" } });
  };

  return (
    <section id="alarm" className="mx-auto max-w-page px-4 pt-14 md:px-6 md:pt-[88px]">
      <div className="flex flex-wrap items-center gap-5 rounded-[32px] bg-ink px-6 py-8 text-white md:gap-7 md:rounded-[40px] md:px-11 md:py-10">
        <Pirpir aria-label={tc("pirpir")} outline="#FFFFFF" highlights={false} blades={false} width={170} height={119} className="h-auto w-[130px] flex-none md:w-[170px]" />
        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-[14px]">
          <h2 id={`${id}-title`} className="m-0 font-display text-[28px] font-bold leading-[1.15] md:text-[34px]">{t("title")}</h2>
          <form aria-labelledby={`${id}-title`} noValidate onSubmit={submit} className="grid grid-cols-2 gap-[10px] lg:grid-cols-6">
            {/* Üstte rota, altta tarihler ve düğme (telefonda tarihler yan yana) */}
            <div className="col-span-2 lg:col-span-3">
              <AirportField
                label={ts("from")}
                value={from}
                onChange={(v) => {
                  setFrom(v);
                  setError(null);
                }}
                invalid={error === "route" && !from.length}
                className={field}
                labelClassName={fieldLabel}
                inputClassName={fieldInput}
              />
            </div>
            <div className="col-span-2 lg:col-span-3">
              <AirportField
                label={ts("to")}
                tone="coral"
                value={to}
                onChange={(v) => {
                  setTo(v);
                  setError(null);
                }}
                invalid={error === "route" && !to.length}
                className={field}
                labelClassName={fieldLabel}
                inputClassName={fieldInput}
              />
            </div>
            <label className={`${field} lg:col-span-2`}>
              <span className={fieldLabel}>{ts("departDate")}</span>
              <input
                type="date"
                required
                min={today}
                value={date}
                aria-invalid={error === "date" || undefined}
                onChange={(e) => {
                  setDate(e.target.value);
                  setError(null);
                  if (returnDate && e.target.value && returnDate < e.target.value) setReturnDate(addDays(e.target.value, 3));
                }}
                className={fieldInput}
              />
            </label>
            <label className={`${field} lg:col-span-2`}>
              <span className={fieldLabel}>{t("returnOptional")}</span>
              <input type="date" min={date || today} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className={fieldInput} />
            </label>
            <button
              type="submit"
              className="min-h-[56px] cursor-pointer rounded-pill border-0 bg-sun px-7 py-3 font-display text-[19px] font-semibold leading-[normal] text-ink col-span-2"
            >
              {t("submit")}
            </button>
          </form>
          {error && (
            <span role="alert" className="text-[15px] font-bold text-sun">
              {t(error === "route" ? "needRoute" : "needDate")}
            </span>
          )}
          <span className="text-sm text-on-ink">{t("note")}</span>
        </div>
      </div>
    </section>
  );
}
