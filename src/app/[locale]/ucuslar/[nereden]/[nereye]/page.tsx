import type { Metadata } from "next";
import type { SVGProps } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SimpleFooter } from "@/components/SiteFooter";
import { Price } from "@/components/Price";
import {
  Amsterdam,
  Ankara,
  Antalya,
  Barselona,
  Bodrum,
  Dubai,
  Gaziantep,
  IstanbulHero,
  Izmir,
  Kayseri,
  Lizbon,
  Londra,
  NewYork,
  Paris,
  Roma,
  Trabzon,
} from "@/components/cities";
import { MonthlyPrices } from "@/components/route/MonthlyPrices";
import { Airports, CheapestDates, OtherCities, QuickFacts, RouteTips } from "@/components/route/RouteSections";
import { cityByCode, countryName, findAirport } from "@/data/airports";
import type { HeroArtKey } from "@/data/route-guides";
import { Link } from "@/i18n/navigation";
import { formatDayShort } from "@/lib/dates";
import { intlLocale } from "@/lib/intl";
import { getRoutePageData, getStaticRouteSlugs, resolveRoute } from "@/lib/route-data";
import { searchHref } from "@/lib/search";
import { absoluteUrl, alternatesFor, safeJsonLd } from "@/lib/seo";
import { ablative, dative } from "@/lib/tr-suffix";

type Params = { locale: string; nereden: string; nereye: string };

// Öncelikli pazar rotaları derlemede statik üretilir; diğer katalog rotaları istekle ISR (6 saat) ile üretilir,
// katalogda olmayan adresler 404 döner.
export const dynamicParams = true;
export const revalidate = 21600;

export function generateStaticParams() {
  return getStaticRouteSlugs();
}

function names(fromCode: string, toCode: string, locale: string) {
  const from = cityByCode(fromCode, locale);
  const to = cityByCode(toCode, locale);
  // Türkçe ekler Türkçe adlara göre (İstanbul'a); diğer diller ek kullanmaz.
  return { from, to, fromAbl: ablative(from), toDat: dative(to) };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, nereden, nereye } = await params;
  const entry = resolveRoute(nereden, nereye);
  if (!entry) return {};
  const t = await getTranslations({ locale, namespace: "route" });
  const n = names(entry.from.searchCode, entry.to.searchCode, locale);
  const title = t("metaTitle", n);
  const description = t("metaDescription", n);
  return {
    title,
    description,
    alternates: alternatesFor({ pathname: "/ucuslar/[nereden]/[nereye]", params: { nereden, nereye } }, locale),
    openGraph: { title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

function SkyHero(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 340" preserveAspectRatio="xMidYMid slice" aria-hidden="true" {...props}>
      <rect width="960" height="340" fill="#D7ECFF" />
      <circle cx="760" cy="96" r="52" fill="#FFD166" />
      <g fill="#FFFFFF" opacity="0.92">
        <ellipse cx="180" cy="108" rx="68" ry="26" />
        <ellipse cx="220" cy="96" rx="46" ry="24" />
        <ellipse cx="520" cy="84" rx="74" ry="26" />
        <ellipse cx="566" cy="74" rx="44" ry="22" />
      </g>
      <path d="M0 264 Q 240 220 480 256 T 960 244 V 340 H 0 Z" fill="#BFE3FF" />
      <path d="M0 292 Q 300 262 620 288 T 960 278 V 340 H 0 Z" fill="#9CC3FF" />
    </svg>
  );
}

const HERO_ART: Record<HeroArtKey, (props: SVGProps<SVGSVGElement>) => React.JSX.Element> = {
  istanbul: IstanbulHero,
  antalya: Antalya,
  izmir: Izmir,
  ankara: Ankara,
  bodrum: Bodrum,
  gaziantep: Gaziantep,
  trabzon: Trabzon,
  kayseri: Kayseri,
  londra: Londra,
  barselona: Barselona,
  roma: Roma,
  lizbon: Lizbon,
  paris: Paris,
  amsterdam: Amsterdam,
  dubai: Dubai,
  "new-york": NewYork,
  sky: SkyHero,
};

export default async function RoutePage({ params }: { params: Promise<Params> }) {
  const { locale, nereden, nereye } = await params;
  setRequestLocale(locale);
  const route = await getRoutePageData(nereden, nereye);
  if (!route) notFound();
  const t = await getTranslations("route");
  const Hero = HERO_ART[route.to.illustration] ?? SkyHero;
  const n = names(route.from.searchCode, route.to.searchCode, locale);
  const country = countryName(findAirport(route.to.airportCode)?.country ?? "", locale);
  const loc = intlLocale(locale);
  const homeUrl = absoluteUrl("/", locale);
  const selfUrl = absoluteUrl({ pathname: "/ucuslar/[nereden]/[nereye]", params: { nereden, nereye } }, locale);
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t("home"), item: homeUrl },
      { "@type": "ListItem", position: 2, name: country, item: homeUrl },
      { "@type": "ListItem", position: 3, name: n.to, item: selfUrl },
    ],
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }} />
      <SiteHeader />

      <main className="mx-auto flex max-w-page flex-col gap-10 px-4 pb-20 md:gap-14 md:px-6">
        <div className="flex flex-col gap-[14px]">
          <nav aria-label={t("breadcrumb")} className="flex flex-wrap gap-2 text-[15px] font-bold text-muted">
            <Link href="/">{t("home")}</Link>
            <span aria-hidden="true">›</span>
            <Link href="/">{country}</Link>
            <span aria-hidden="true">›</span>
            <span>{n.to}</span>
          </nav>
          <div className="relative overflow-hidden rounded-[32px] md:rounded-[40px]" style={{ background: route.to.heroBg }}>
            <Hero className="block h-[200px] w-full md:h-[340px]" />
            {/* Telefonda kart çizimin altında akar (çizimi kapatmasın); geniş ekranda üstüne biner */}
            <div className="flex flex-col gap-3 p-3 md:absolute md:bottom-8 md:left-8 md:right-8 md:flex-row md:flex-wrap md:items-end md:justify-between md:gap-4 md:p-0">
              <div className="flex flex-col rounded-[24px] bg-white px-5 py-4 md:rounded-[28px] md:px-6 md:py-[18px] md:shadow-float">
                <span className="text-[15px] font-extrabold text-muted">{t("heroFrom", n)}</span>
                <h1 className="m-0 font-display text-[34px] font-bold leading-[1.05] md:text-[46px]">{t("heroTitle", n)}</h1>
                {route.minPrice !== null ? (
                  <span className="font-bold text-muted">
                    {t.rich("fromPrice", {
                      price: () => (
                        <strong className="font-display text-2xl text-ink"><Price amount={route.minPrice!} /></strong>
                      ),
                    })}
                  </span>
                ) : (
                  <span className="font-bold text-muted">{t("noPriceHero")}</span>
                )}
                {route.live && route.latestSeenAt && (
                  <span className="mt-[2px] text-xs font-semibold text-muted">
                    {t("seenOn", { date: formatDayShort(route.latestSeenAt, loc) })}
                  </span>
                )}
              </div>
              <Link
                href={searchHref({ from: route.from.searchCode, to: route.to.searchCode })}
                className="box-border inline-flex min-h-[56px] items-center justify-center rounded-pill bg-primary px-[34px] py-4 font-display text-[19px] font-semibold text-white no-underline md:min-h-[60px] md:text-[21px] md:shadow-float-strong"
              >
                {t("cta")}
              </Link>
            </div>
          </div>
        </div>

        <QuickFacts route={route} />
        <MonthlyPrices
          months={route.months}
          defaultMonth={route.defaultMonth}
          fromCode={route.from.searchCode}
          toCode={route.to.searchCode}
          live={route.live}
        />
        <CheapestDates route={route} />
        <Airports route={route} />
        <RouteTips route={route} />
        <OtherCities route={route} />
      </main>

      <SimpleFooter />
    </div>
  );
}
