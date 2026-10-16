import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Biletcik, Bulut, Gunes, Marti, Pasi, Pirpir, Valiz } from "../characters";
import { Building, Clock, Globe, Plane } from "../icons";
import { Price } from "../Price";
import { cityByCode, countryName, findAirport } from "@/data/airports";
import { pick, type CharacterKey, type RouteData } from "@/data/mock/routes";
import { formatRange, minsParts } from "@/lib/dates";
import { intlLocale } from "@/lib/intl";
import { searchHref } from "@/lib/search";
import { locative } from "@/lib/tr-suffix";

const h2 = "m-0 font-display text-[36px] font-bold";

export async function QuickFacts({ route }: { route: RouteData }) {
  const t = await getTranslations("route.facts");
  const locale = await getLocale();
  const facts = [
    { bg: "bg-sky", icon: <Clock size={28} className="text-primary" />, label: t("duration"), value: t("durationValue", minsParts(route.directMins, true)) },
    { bg: "bg-sun-soft", icon: <Building className="text-sun-text" />, label: t("airports"), value: route.airportsShort },
    { bg: "bg-coral-soft", icon: <Plane className="text-coral-text" />, label: t("airlines"), value: route.airlines },
    { bg: "bg-green-soft", icon: <Globe className="text-green-text" />, label: t("timeDiff"), value: pick(route.timeDiff, locale) },
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
  const locale = await getLocale();
  const loc = intlLocale(locale);
  const chip = "rounded-pill bg-field px-[10px] py-[3px] text-[13px] font-extrabold";
  return (
    <section className="flex flex-col gap-[14px]">
      <h2 className={h2}>{t("title")}</h2>
      {route.deals.map((d) => (
        <Link
          key={d.date}
          href={searchHref({ from: route.from.code, to: route.to.code, date: d.date, returnDate: d.returnDate })}
          className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[24px] border-2 border-solid border-line px-5 py-4 text-ink no-underline"
        >
          <span className="flex min-w-[180px] flex-col">
            <span className="font-display text-xl font-semibold">{formatRange(d.date, d.returnDate, loc)}</span>
            <span className="text-sm font-bold text-muted">{pick(d.nights, locale)}</span>
          </span>
          <span className="flex flex-1 flex-wrap gap-[6px]">
            <span className={chip}>{d.airline}</span>
            <span className={chip}>{pick(d.stops, locale)}</span>
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
  const locale = await getLocale();
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
                <span className="font-display text-[22px] font-semibold">{pick(a.name, locale)}</span>
                <span className="text-[15px] font-bold text-muted">{pick(a.side, locale)}</span>
              </span>
            </div>
            <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-ink">
              {a.facts.map((f) => (
                <li key={f.tr}>{pick(f, locale)}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

const TIP_STYLE: Record<CharacterKey, { bg: string; name: string; art: (label: string) => React.ReactNode }> = {
  marti: { bg: "bg-sky", name: "text-primary-dark", art: (l) => <Marti aria-label={l} width={96} height={77} className="flex-none" /> },
  gunes: { bg: "bg-sun-softer", name: "text-sun-text", art: (l) => <Gunes aria-label={l} width={76} height={76} className="flex-none" /> },
  pasi: { bg: "bg-pink-soft", name: "text-plum-text", art: (l) => <Pasi aria-label={l} width={60} height={75} className="flex-none" /> },
  bulut: { bg: "bg-sun-soft", name: "text-sun-text", art: (l) => <Bulut aria-label={l} highlights={false} width={96} height={66} className="flex-none" /> },
  valiz: { bg: "bg-coral-soft", name: "text-coral-text", art: (l) => <Valiz aria-label={l} stripe={false} highlights={false} width={60} height={75} className="flex-none" /> },
  pirpir: { bg: "bg-sky", name: "text-primary-dark", art: (l) => <Pirpir aria-label={l} highlights={false} width={96} height={67} className="flex-none" /> },
  biletcik: { bg: "bg-green-soft", name: "text-green-text", art: (l) => <Biletcik aria-label={l} width={96} height={62} className="flex-none" /> },
};

export async function RouteTips({ route }: { route: RouteData }) {
  const t = await getTranslations("route.tips");
  const tc = await getTranslations("common.characters");
  const locale = await getLocale();
  return (
    <section className="flex flex-col gap-[14px]">
      <h2 className={h2}>{t("title", { city: cityByCode(route.to.code, locale) })}</h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4">
        {route.tips.map((tip) => {
          const s = TIP_STYLE[tip.character];
          return (
            <div key={tip.character} className={`flex items-center gap-4 rounded-[28px] px-[22px] py-5 ${s.bg}`}>
              {s.art(tc(tip.character))}
              <span className="flex flex-col gap-[2px]">
                <span className={`text-sm font-extrabold ${s.name}`}>{pick(tip.role, locale)}</span>
                <span className="font-display text-xl font-semibold leading-[1.25]">{pick(tip.quote, locale)}</span>
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
  const locale = await getLocale();
  const country = findAirport(route.to.code)?.country ?? "";
  return (
    <section className="flex flex-col gap-[14px]">
      <h2 className={h2}>{t("title", { country: countryName(country, locale), countryLoc: locative(country) })}</h2>
      <div className="flex flex-wrap gap-[10px]">
        {route.others.map((o) => (
          <Link
            key={o.code}
            href={searchHref({ from: route.from.code, to: o.code })}
            className="box-border inline-flex min-h-[48px] items-center gap-[10px] rounded-pill bg-field px-5 py-3 font-extrabold text-ink no-underline"
          >
            {cityByCode(o.code, locale)} <span className="font-display font-semibold text-primary"><Price amount={o.price} /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
