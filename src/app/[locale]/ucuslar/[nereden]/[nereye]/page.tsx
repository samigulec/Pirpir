import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SimpleFooter } from "@/components/SiteFooter";
import { Price } from "@/components/Price";
import { IstanbulHero } from "@/components/cities";
import { MonthlyPrices } from "@/components/route/MonthlyPrices";
import { Airports, CheapestDates, OtherCities, QuickFacts, RouteTips } from "@/components/route/RouteSections";
import { cityByCode, countryName, findAirport } from "@/data/airports";
import type { RouteData } from "@/data/mock/routes";
import { Link } from "@/i18n/navigation";
import { getRoute, getRouteSlugs } from "@/lib/flights";
import { searchHref } from "@/lib/search";
import { ablative, dative } from "@/lib/tr-suffix";

type Params = { locale: string; nereden: string; nereye: string };

// SEO için her rota derleme anında her dilde statik üretilir; listede olmayan rota 404 olur.
export const dynamicParams = false;

export function generateStaticParams() {
  return getRouteSlugs();
}

function names(route: RouteData, locale: string) {
  const from = cityByCode(route.from.code, locale);
  const to = cityByCode(route.to.code, locale);
  // Türkçe ekler Türkçe adlara göre (İstanbul'a); diğer diller ek kullanmaz.
  return { from, to, fromAbl: ablative(from), toDat: dative(to) };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, nereden, nereye } = await params;
  const route = getRoute(nereden, nereye);
  if (!route) return {};
  const t = await getTranslations({ locale, namespace: "route" });
  return { title: t("metaTitle", names(route, locale)) };
}

const HERO_ART = { istanbul: IstanbulHero };

export default async function RoutePage({ params }: { params: Promise<Params> }) {
  const { locale, nereden, nereye } = await params;
  setRequestLocale(locale);
  const route = getRoute(nereden, nereye);
  if (!route) notFound();
  const t = await getTranslations("route");
  const Hero = HERO_ART[route.to.illustration];
  const min = Math.min(...route.monthly);
  const n = names(route, locale);
  const country = countryName(findAirport(route.to.code)?.country ?? "", locale);

  return (
    <div className="min-h-screen w-full bg-white">
      <SiteHeader />

      <main className="mx-auto flex max-w-page flex-col gap-14 px-6 pb-20">
        <div className="flex flex-col gap-[14px]">
          <nav aria-label={t("breadcrumb")} className="flex flex-wrap gap-2 text-[15px] font-bold text-muted">
            <Link href="/">{t("home")}</Link>
            <span aria-hidden="true">›</span>
            <Link href="/">{country}</Link>
            <span aria-hidden="true">›</span>
            <span>{n.to}</span>
          </nav>
          <div className="relative overflow-hidden rounded-[40px] bg-[#FFD9C7]">
            <Hero className="block h-[340px] w-full" />
            <div className="absolute bottom-8 left-8 right-8 flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col rounded-[28px] bg-white px-6 py-[18px] shadow-float">
                <span className="text-[15px] font-extrabold text-muted">{t("heroFrom", n)}</span>
                <h1 className="m-0 font-display text-[46px] font-bold leading-[1.05]">{t("heroTitle", n)}</h1>
                <span className="font-bold text-muted">
                  {t.rich("fromPrice", {
                    price: () => (
                      <strong className="font-display text-2xl text-ink"><Price amount={min} /></strong>
                    ),
                  })}
                </span>
              </div>
              <Link
                href={searchHref({ from: route.from.code, to: route.to.code })}
                className="box-border inline-flex min-h-[60px] items-center rounded-pill bg-primary px-[34px] py-4 font-display text-[21px] font-semibold text-white no-underline shadow-float-strong"
              >
                {t("cta")}
              </Link>
            </div>
          </div>
        </div>

        <QuickFacts route={route} />
        <MonthlyPrices values={route.monthly} defaultMonth={route.defaultMonth} />
        <CheapestDates route={route} />
        <Airports route={route} />
        <RouteTips route={route} />
        <OtherCities route={route} />
      </main>

      <SimpleFooter />
    </div>
  );
}
