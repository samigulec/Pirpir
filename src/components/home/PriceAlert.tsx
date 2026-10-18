"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Pirpir } from "../characters";

export function PriceAlert() {
  const t = useTranslations("home.alert");
  const tc = useTranslations("common.characters");
  const [done, setDone] = useState(false);
  return (
    <section id="alarm" className="mx-auto max-w-page px-4 pt-14 md:px-6 md:pt-[88px]">
      <div className="flex flex-wrap items-center gap-5 rounded-[32px] bg-ink px-6 py-8 text-white md:gap-7 md:rounded-[40px] md:px-11 md:py-10">
        <Pirpir aria-label={tc("pirpir")} outline="#FFFFFF" highlights={false} blades={false} width={170} height={119} className="h-auto w-[130px] flex-none md:w-[170px]" />
        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-[14px]">
          <h2 className="m-0 font-display text-[28px] font-bold leading-[1.15] md:text-[34px]">{t("title")}</h2>
          {done ? (
            <span role="status" className="text-lg font-extrabold text-sun">{t("thanks")}</span>
          ) : (
            <form
              className="flex flex-wrap gap-[10px]"
              onSubmit={(e) => {
                e.preventDefault();
                setDone(true);
              }}
            >
              <label className="flex min-w-0 flex-[1_1_240px]">
                <span className="sr-only">{t("email")}</span>
                <input
                  type="email"
                  placeholder={t("email")}
                  className="box-border min-h-[52px] min-w-0 flex-1 rounded-pill border-0 bg-white px-5 py-[14px] font-semibold text-ink"
                />
              </label>
              <button
                type="submit"
                className="min-h-[52px] cursor-pointer rounded-pill border-0 bg-sun leading-[normal] px-7 py-3 font-display text-[19px] font-semibold text-ink"
              >
                {t("submit")}
              </button>
            </form>
          )}
          <span className="text-sm text-on-ink">{t("note")}</span>
        </div>
      </div>
    </section>
  );
}
