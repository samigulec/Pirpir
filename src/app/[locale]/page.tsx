import { setRequestLocale } from "next-intl/server";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeView } from "@/components/home/HomeView";
import { CharacterTips } from "@/components/home/CharacterTips";
import { PopularRoutes } from "@/components/home/PopularRoutes";
import { Steps } from "@/components/home/Steps";
import { PriceAlert } from "@/components/home/PriceAlert";
import { Faq } from "@/components/home/Faq";
import { MobileNav } from "@/components/home/MobileNav";
import { SiteFooter } from "@/components/SiteFooter";
import { dataMode, getPopularDestinations } from "@/lib/flights";
import { getMarket } from "@/lib/market-server";
import { getDestinationDeals, getRouteDates } from "@/lib/deals";
import { todayIso } from "@/lib/search";


export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Kalkış yeri ziyaretçinin ülkesine göre (Kiwi'deki gibi); sayfa bu yüzden her istekte çizilir.
  // Fiyatlar paylaşılan arama önbelleğinden gelir; hazır olmayanları tarayıcı tamamlar.
  const market = await getMarket(locale);
  const [deals, routeDates] = await Promise.all([getDestinationDeals([market.from], 2500), getRouteDates(market.routes)]);
  const live = dataMode() === "live";
  return (
    <div className="min-h-screen w-full bg-white pb-[84px] md:pb-0">
      <HomeHeader />
      <HomeView
        key={market.id}
        destinations={getPopularDestinations()}
        deals={deals}
        live={live}
        defaults={{ today: todayIso() }}
        defaultFrom={market.from}
      />
      <CharacterTips deals={deals} from={market.from} />
      <PopularRoutes routes={market.routes} dates={routeDates} />
      <Steps />
      <PriceAlert />
      <Faq />
      <SiteFooter />
      <MobileNav />
    </div>
  );
}
