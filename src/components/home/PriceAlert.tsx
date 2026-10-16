"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Pirpir } from "../characters";

export function PriceAlert() {
  const t = useTranslations("home.alert");
  const [done, setDone] = useState(false);
  return (
    <section id="alarm" className="mx-auto max-w-page px-6 pt-[88px]">
      <div className="flex flex-wrap items-center gap-7 rounded-[40px] bg-ink px-11 py-10 text-white">
        <Pirpir aria-label="Pırpır karakteri" outline="#FFFFFF" highlights={false} blades={false} width={170} height={119} className="flex-none" />
        <div className="flex flex-[1_1_340px] flex-col gap-[14px]">
          <h2 className="m-0 font-display text-[34px] font-bold leading-[1.15]">{t("title")}</h2>
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
              <label className="flex flex-[1_1_240px]">
                <span className="sr-only">{t("email")}</span>
                <input
                  type="email"
                  placeholder={t("email")}
                  className="box-border min-h-[52px] min-w-0 flex-1 rounded-pill border-0 bg-white px-5 py-[14px] font-semibold text-ink"
                />
              </label>
              <button
                type="submit"
                className="min-h-[52px] cursor-pointer rounded-pill border-0 bg-sun px-7 py-3 font-display text-[19px] font-semibold text-ink"
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
