import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Biletcik, Bulut, Gunes, Marti, Pasi, Pirpir, Valiz } from "../characters";
import { Building, Clock, Globe, Plane } from "../icons";
import { Price } from "../Price";
import type { CharacterKey, RouteData } from "@/data/mock/routes";
import { searchHref } from "@/lib/flights";
import { splitDuration } from "@/lib/format";

const h2 = "m-0 font-display text-[36px] font-bold";

export async function QuickFacts({ route }: { route: RouteData }) {
  const t = await getTranslations("route.facts");
  const facts = [
    { bg: "bg-sky", icon: <Clock size={28} className="text-primary" />, label: t("duration"), value: t("durationValue", splitDuration(route.directMins, true)) },
    { bg: "bg-sun-soft", icon: <Building className="text-sun-text" />, label: t("airports"), value: route.airportsShort },
    { bg: "bg-coral-soft", icon: <Plane className="text-coral-text" />, label: t("airlines"), value: route.airlines },
    { bg: "bg-green-soft", icon: <Globe className="text-green-text" />, label: t("timeDiff"), value: route.timeDiff },
  ];
  return (
    <section aria-label={t("label")} className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[14px]">
      {facts.map((f) => (
        <div key={f.label} className={`flex flex-col gap-1 rounded-[26px] px-[22px] py-5 ${f.bg}`}>
          {f.icon}
          <span className="text-sm font-extrabold text-muted">{f.label}</span>
          <span className="font-display text-[22px] font-semibold">{f.value}</span>
        </div>
      ))}
    </section>
  );
}

export async function CheapestDates({ route }: { route: RouteData }) {
  const t = await getTranslations("route.deals");
  const chip = "rounded-pill bg-field px-[10px] py-[3px] text-[13px] font-extrabold";
  return (
    <section className="flex flex-col gap-[14px]">
      <h2 className={h2}>{t("title")}</h2>
      {route.deals.map((d) => (
        <Link
          key={d.dates}
          href={searchHref({ from: route.from.city, to: route.to.city })}
          className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[24px] border-2 border-solid border-line px-5 py-4 text-ink no-underline"
        >
          <span className="flex min-w-[180px] flex-col">
            <span className="font-display text-xl font-semibold">{d.dates}</span>
            <span className="text-sm font-bold text-muted">{d.nights}</span>
          </span>
          <span className="flex flex-1 flex-wrap gap-[6px]">
            <span className={chip}>{d.airline}</span>
            <span className={chip}>{d.stops}</span>
          </span>
          <span className="font-display text-2xl font-bold"><Price amount={d.price} /></span>
          <span className="rounded-pill bg-primary px-[22px] py-[10px] font-display text-[17px] font-semibold text-white">{t("select")}</span>
        </Link>
      ))}
    </section>
  );
}

export async function Airports({ route }: { route: RouteData }) {
  const t = await getTranslations("route.airports");
  return (
    <section className="flex flex-col gap-[14px]">
      <h2 className={h2}>{t("title")}</h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4">
        {route.airports.map((a) => (
          <div key={a.code} className="flex flex-col gap-[10px] rounded-[28px] bg-field p-6">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-[18px] font-display text-lg font-bold ${
                  a.tone === "ink" ? "bg-ink text-white" : "bg-coral text-ink"
                }`}
              >
                {a.code}
              </span>
              <span className="flex flex-col">
                <span className="font-display text-[22px] font-semibold">{a.name}</span>
                <span className="text-[15px] font-bold text-muted">{a.side}</span>
              </span>
            </div>
            <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-ink">
              {a.facts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

const TIP_STYLE: Record<CharacterKey, { bg: string; name: string; art: React.ReactNode }> = {
  marti: { bg: "bg-sky", name: "text-primary-dark", art: <Marti width={96} height={77} className="flex-none" /> },
  gunes: { bg: "bg-sun-softer", name: "text-sun-text", art: <Gunes aria-label="Güneş karakteri" width={76} height={76} className="flex-none" /> },
  pasi: { bg: "bg-pink-soft", name: "text-plum-text", art: <Pasi width={60} height={75} className="flex-none" /> },
  bulut: { bg: "bg-sun-soft", name: "text-sun-text", art: <Bulut highlights={false} width={96} height={66} className="flex-none" /> },
  valiz: { bg: "bg-coral-soft", name: "text-coral-text", art: <Valiz stripe={false} highlights={false} width={60} height={75} className="flex-none" /> },
  pirpir: { bg: "bg-sky", name: "text-primary-dark", art: <Pirpir highlights={false} width={96} height={67} className="flex-none" /> },
  biletcik: { bg: "bg-green-soft", name: "text-green-text", art: <Biletcik width={96} height={62} className="flex-none" /> },
};

export async function RouteTips({ route }: { route: RouteData }) {
  const t = await getTranslations("route.tips");
  return (
    <section className="flex flex-col gap-[14px]">
      <h2 className={h2}>{t("title", { city: route.to.city })}</h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4">
        {route.tips.map((tip) => {
          const s = TIP_STYLE[tip.character];
          return (
            <div key={tip.character} className={`flex items-center gap-4 rounded-[28px] px-[22px] py-5 ${s.bg}`}>
              {s.art}
              <span className="flex flex-col gap-[2px]">
                <span className={`text-sm font-extrabold ${s.name}`}>{tip.name}</span>
                <span className="font-display text-xl font-semibold leading-[1.25]">{tip.quote}</span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export async function OtherCities({ route }: { route: RouteData }) {
  const t = await getTranslations("route.others");
  return (
    <section className="flex flex-col gap-[14px]">
      <h2 className={h2}>{t("title", { country: route.to.countryLocative })}</h2>
      <div className="flex flex-wrap gap-[10px]">
        {route.others.map((o) => (
          <Link
            key={o.city}
            href={searchHref({ from: route.from.city, to: o.city })}
            className="box-border inline-flex min-h-[48px] items-center gap-[10px] rounded-pill bg-field px-5 py-3 font-extrabold text-ink no-underline"
          >
            {o.city} <span className="font-display font-semibold text-primary"><Price amount={o.price} /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
