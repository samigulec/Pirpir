import { getLocale, getTranslations } from "next-intl/server";
import { isAffiliate } from "@/config/affiliate";
import { cityByCode, countryName, findAirport } from "@/data/airports";
import { pick, type CharacterKey } from "@/data/mock/routes";
import { Link } from "@/i18n/navigation";
import { formatDayShort, formatRange, minsParts } from "@/lib/dates";
import { intlLocale } from "@/lib/intl";
import { goHref } from "@/lib/outbound";
import type { RoutePageView } from "@/lib/route-data";
import { searchHref } from "@/lib/search";
import { ablative, locative } from "@/lib/tr-suffix";
import { Biletcik, Bulut, Gunes, Marti, Pasi, Pirpir, Valiz } from "../characters";
import { Building, Clock, Globe, Plane } from "../icons";
import { Price } from "../Price";

const h2 = "m-0 font-display text-[36px] font-bold";

export async function QuickFacts({ route }: { route: RoutePageView }) {
  const t = await getTranslations("route.facts");
  const locale = await getLocale();

  const durationText = route.isEstimatedDuration
    ? t("durationApprox", minsParts(route.directMins, true))
    : t("durationValue", minsParts(route.directMins, true));

  let timeDiffText: string;
  if (route.timeDiff.kind === "custom") {
    timeDiffText = pick(route.timeDiff.label, locale);
  } else if (route.timeDiff.kind === "same") {
    timeDiffText = t("timeDiffSame");
  } else if (route.timeDiff.kind === "fixed") {
    timeDiffText = t("timeDiffFixed", { diff: route.timeDiff.diff });
  } else {
    timeDiffText = t("timeDiffSeasonal", { summer: route.timeDiff.summer, winter: route.timeDiff.winter });
  }

  const facts = [
    { bg: "bg-sky", icon: <Clock size={28} className="text-primary" />, label: t("duration"), value: durationText },
    { bg: "bg-sun-soft", icon: <Building className="text-sun-text" />, label: t("airports"), value: route.airportsShort },
    ...(route.airlines
      ? [{ bg: "bg-coral-soft", icon: <Plane className="text-coral-text" />, label: t("airlines"), value: route.airlines }]
      : []),
    { bg: "bg-green-soft", icon: <Globe className="text-green-text" />, label: t("timeDiff"), value: timeDiffText },
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

export async function CheapestDates({ route }: { route: RoutePageView }) {
  const t = await getTranslations("route.deals");
  const tr = await getTranslations("route");
  const tc = await getTranslations("common");
  const locale = await getLocale();
  const loc = intlLocale(locale);
  const affiliate = isAffiliate();
  const chip = "rounded-pill bg-field px-[10px] py-[3px] text-[13px] font-extrabold";

  const stopsText = (n: number | null) =>
    n === null ? null : n === 0 ? tc("direct") : n === 1 ? tc("oneStop") : tc("stops", { n });

  return (
    <section className="flex flex-col gap-[14px]">
      <h2 className={h2}>{t("title")}</h2>
      {route.deals.length === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border-2 border-solid border-line bg-field px-6 py-5">
          <p className="m-0 max-w-[560px] font-semibold text-muted">{t("empty")}</p>
          <Link
            href={searchHref({ from: route.from.searchCode, to: route.to.searchCode })}
            className="inline-flex min-h-[48px] items-center justify-center rounded-pill bg-primary px-6 font-display text-[17px] font-semibold text-white no-underline"
          >
            {t("searchLive")}
          </Link>
        </div>
      ) : (
        route.deals.map((d) => {
          const href = searchHref({
            from: route.from.searchCode,
            to: route.to.searchCode,
            date: d.date,
            returnDate: d.returnDate,
          });
          const outboundHref =
            affiliate && route.live
              ? goHref(
                  {
                    from: route.from.searchCode,
                    to: route.to.searchCode,
                    date: d.date,
                    returnDate: d.returnDate,
                    adults: 1,
                    children: 0,
                    infants: 0,
                    cabin: "economy",
                    deep: d.deep ?? undefined,
                  },
                  `route:${route.slug}`,
                  locale,
                )
              : null;
          const nightsStr = d.nightsLabel ? pick(d.nightsLabel, locale) : t("nights", { n: d.nightsCount });
          const stopStr = d.stopsLabel ? pick(d.stopsLabel, locale) : stopsText(d.transfers);

          if (!outboundHref) {
            return (
              <Link
                key={`${d.date}_${d.returnDate}`}
                href={href}
                className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[24px] border-2 border-solid border-line px-5 py-4 text-ink no-underline"
              >
                <span className="flex min-w-[180px] flex-col">
                  <span className="font-display text-xl font-semibold">{formatRange(d.date, d.returnDate, loc)}</span>
                  <span className="text-sm font-bold text-muted">{nightsStr}</span>
                </span>
                <span className="flex flex-1 flex-wrap gap-[6px]">
                  {d.airline && <span className={chip}>{d.airline}</span>}
                  {stopStr && <span className={chip}>{stopStr}</span>}
                </span>
                <span className="font-display text-2xl font-bold"><Price amount={d.price} /></span>
                <span className="rounded-pill bg-primary px-[22px] py-[10px] font-display text-[17px] font-semibold text-white">
                  {t("select")}
                </span>
              </Link>
            );
          }

          return (
            <div
              key={`${d.date}_${d.returnDate}`}
              className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[24px] border-2 border-solid border-line px-5 py-4 text-ink"
            >
              <Link href={href} className="flex min-w-[180px] flex-col text-ink no-underline hover:underline">
                <span className="font-display text-xl font-semibold">{formatRange(d.date, d.returnDate, loc)}</span>
                <span className="text-sm font-bold text-muted">
                  {nightsStr}
                  {d.seenAt ? ` · ${tr("seenOn", { date: formatDayShort(d.seenAt, loc) })}` : ""}
                </span>
              </Link>
              <span className="flex flex-1 flex-wrap gap-[6px]">
                {d.airline && <span className={chip}>{d.airline}</span>}
                {stopStr && <span className={chip}>{stopStr}</span>}
              </span>
              <span className="font-display text-2xl font-bold"><Price amount={d.price} /></span>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={href}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-pill bg-primary px-[22px] py-[10px] font-display text-[17px] font-semibold text-white no-underline"
                >
                  {t("select")}
                </Link>
                <a
                  href={outboundHref}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-pill bg-field px-4 py-[10px] text-sm font-extrabold text-ink no-underline hover:bg-sky"
                >
                  {t("goDeal")}
                </a>
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}

export async function Airports({ route }: { route: RoutePageView }) {
  const t = await getTranslations("route.airports");
  const locale = await getLocale();
  if (!route.airports.length) return null;
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
            {a.facts.length > 0 && (
              <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-ink">
                {a.facts.map((f) => (
                  <li key={f.tr}>{pick(f, locale)}</li>
                ))}
              </ul>
            )}
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

export async function RouteTips({ route }: { route: RoutePageView }) {
  const t = await getTranslations("route.tips");
  const tc = await getTranslations("common.characters");
  const locale = await getLocale();
  if (!route.tips.length) return null;
  return (
    <section className="flex flex-col gap-[14px]">
      <h2 className={h2}>{t("title", { city: cityByCode(route.to.searchCode, locale) })}</h2>
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

export async function OtherCities({ route }: { route: RoutePageView }) {
  const t = await getTranslations("route.others");
  const locale = await getLocale();
  if (!route.others.length) return null;
  const country = findAirport(route.to.airportCode)?.country ?? "";
  const fromCity = cityByCode(route.from.searchCode, locale);
  const title = route.othersSameCountry
    ? t("title", { country: countryName(country, locale), countryLoc: locative(countryName(country, "tr")) })
    : t("titleOrigin", { from: fromCity, fromAbl: ablative(fromCity) });

  return (
    <section className="flex flex-col gap-[14px]">
      <h2 className={h2}>{title}</h2>
      <div className="flex flex-wrap gap-[10px]">
        {route.others.map((o) => {
          const href = o.hasRoutePage
            ? ({ pathname: "/ucuslar/[nereden]/[nereye]", params: { nereden: route.from.slug, nereye: o.slug } } as const)
            : searchHref({ from: route.from.searchCode, to: o.code });
          return (
            <Link
              key={o.code}
              href={href}
              className="box-border inline-flex min-h-[48px] items-center gap-[10px] rounded-pill bg-field px-5 py-3 font-extrabold text-ink no-underline hover:bg-sky"
            >
              {cityByCode(o.code, locale)}
              {o.price !== null && (
                <span className="font-display font-semibold text-primary">
                  <Price amount={o.price} />
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
