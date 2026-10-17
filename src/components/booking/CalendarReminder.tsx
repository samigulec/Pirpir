"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Valiz } from "../characters";
import { Calendar } from "../icons";
import { ALARM_CHOICES, type AlarmChoice } from "@/lib/calendar";

/**
 * Hatırlatıcı: uçuşlar takvime eklenir, seçilen zamanlarda takvim uygulaması hatırlatır (.ics alarmı).
 * Bizim tarafımızda bildirim gönderilmez; söz verilen şey takvimin kendi hatırlatmasıdır.
 */
export function CalendarReminder({ bookingId, google }: { bookingId: string; google: { label: string; url: string }[] }) {
  const t = useTranslations("confirm.remind");
  const tc = useTranslations("common.characters");
  const locale = useLocale();
  const [alarms, setAlarms] = useState<AlarmChoice[]>([1440, 180]);
  const toggle = (m: AlarmChoice) => setAlarms((a) => (a.includes(m) ? a.filter((x) => x !== m) : [...a, m]));
  const ics = `/api/takvim/${encodeURIComponent(bookingId)}?lang=${locale}${alarms.length ? `&alarms=${alarms.join(",")}` : ""}`;
  const pill = "inline-flex min-h-[44px] items-center gap-2 rounded-pill px-5 py-2 font-display text-[16px] font-semibold no-underline";

  return (
    <section aria-labelledby="remind-title" className="flex flex-col gap-4 rounded-[28px] bg-coral-soft px-6 py-5">
      <div className="flex items-center gap-4">
        <Valiz aria-label={tc("valiz")} happy stripe={false} tag={false} width={40} height={50} className="flex-none" />
        <div className="flex flex-col">
          <h2 id="remind-title" className="m-0 font-display text-xl font-semibold">{t("title")}</h2>
          <span className="text-[15px] text-muted">{t("text")}</span>
        </div>
      </div>
      <fieldset className="m-0 flex flex-wrap gap-2 border-0 p-0">
        <legend className="mb-2 p-0 text-[13px] font-extrabold text-muted">{t("when")}</legend>
        {ALARM_CHOICES.map((m) => {
          const on = alarms.includes(m);
          return (
            <button
              key={m}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(m)}
              className={`min-h-[44px] cursor-pointer rounded-pill border-2 border-solid px-4 py-2 text-[15px] font-extrabold ${
                on ? "border-ink bg-ink text-white" : "border-white bg-white text-ink"
              }`}
            >
              {on ? "✓ " : ""}
              {t(`a${m}`)}
            </button>
          );
        })}
      </fieldset>
      <div className="flex flex-wrap items-center gap-2">
        <a href={ics} download className={`${pill} bg-primary text-white`} title={t("icsHint")}>
          <Calendar size={18} />
          {t("ics")}
        </a>
        {google.map((g) => (
          <a key={g.url} href={g.url} target="_blank" rel="noopener noreferrer" className={`${pill} bg-white text-ink`}>
            {google.length > 1 ? t("googleLeg", { leg: g.label }) : t("google")}
          </a>
        ))}
      </div>
      <span className="text-[13px] font-semibold text-muted">
        {t("icsHint")} · {t("googleNote")}
      </span>
    </section>
  );
}
