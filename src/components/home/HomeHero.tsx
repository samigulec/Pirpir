"use client";

import { useTranslations } from "next-intl";
import { Pirpir } from "../characters";
import { CloudShape, Check, Clock, Headset, Lock } from "../icons";
import { SearchForm } from "./SearchForm";
import type { AirportValue } from "./AirportField";

export function HomeHero({
  from,
  to,
  onFrom,
  onTo,
  defaults,
  afterHero,
}: {
  from: AirportValue;
  to: AirportValue;
  onFrom: (v: AirportValue) => void;
  onTo: (v: AirportValue) => void;
  defaults: { today: string };
  /** Hero kutusunun hemen altına (telefonda fırsat kartı). */
  afterHero?: React.ReactNode;
}) {
  const t = useTranslations("home");
  return (
    <section className="mx-auto max-w-page px-4 pt-4 md:px-6 md:pt-0">
      <div className="relative flex flex-col items-center gap-[14px] rounded-[32px] bg-sky px-4 pb-4 pt-5 md:gap-7 md:rounded-[40px] md:px-12 md:pb-12 md:pt-14">
        <CloudShape width={180} height={64} className="absolute left-[6%] top-10 hidden md:block" />
        <CloudShape width={130} height={48} className="absolute right-[8%] top-[120px] hidden md:block" />

        <Pirpir trail aria-label={t("hero.pirpirLabel")} width={200} height={140} className="relative hidden md:block" />
        <Pirpir highlights={false} aria-label={t("hero.pirpirLabel")} width={130} height={91} className="md:hidden" />

        <div className="relative flex flex-col items-center gap-[10px] text-center">
          <h1 className="m-0 font-display text-[30px] font-bold leading-[1.1] md:text-[clamp(38px,5.5vw,64px)] md:leading-[1.05] md:tracking-[-0.01em]">
            {t("hero.title")}
          </h1>
          <p className="m-0 hidden text-[19px] text-muted md:block">{t("hero.subtitle")}</p>
        </div>

        <SearchForm from={from} to={to} onFrom={onFrom} onTo={onTo} defaults={defaults} />
      </div>

      {afterHero}

      <ul
        aria-label={t("trust.label")}
        className="m-0 flex list-none flex-wrap justify-center gap-x-8 gap-y-[10px] px-2 pt-[22px] text-[15px] font-bold text-ink"
      >
        <li className="flex items-center gap-2"><Lock className="text-primary" />{t("trust.secure")}</li>
        <li className="flex items-center gap-2"><Check className="text-primary" />{t("trust.noFees")}</li>
        <li className="flex items-center gap-2"><Headset className="text-primary" />{t("trust.support")}</li>
        <li className="flex items-center gap-2"><Clock className="text-primary" />{t("trust.cancel")}</li>
      </ul>
    </section>
  );
}
