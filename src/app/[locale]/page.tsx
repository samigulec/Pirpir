import { setRequestLocale } from "next-intl/server";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeView } from "@/components/home/HomeView";
import { DEFAULT_FROM } from "@/data/mock/home";
import { CharacterTips } from "@/components/home/CharacterTips";
import { PopularRoutes } from "@/components/home/PopularRoutes";
import { Steps } from "@/components/home/Steps";
import { PriceAlert } from "@/components/home/PriceAlert";
import { Faq } from "@/components/home/Faq";
import { MobileNav } from "@/components/home/MobileNav";
import { SiteFooter } from "@/components/SiteFooter";
import { dataMode, getPopularDestinations, getPopularRoutes } from "@/lib/flights";
import { getDestinationDeals, getRouteDeals } from "@/lib/deals";
import { defaultDates, todayIso } from "@/lib/search";

// Varsayılan tarihler, "bugün" sınırı ve fırsat fiyatları güncel kalsın diye sayfa arama önbelleğiyle aynı sürede
// (10 dakika) yenilenir.
export const revalidate = 600;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [deals, routeDeals] = await Promise.all([getDestinationDeals([DEFAULT_FROM]), getRouteDeals()]);
  const live = dataMode() === "live";
  return (
    <div className="min-h-screen w-full bg-white pb-[84px] md:pb-0">
      <HomeHeader />
      <HomeView destinations={getPopularDestinations()} deals={deals} live={live} defaults={{ ...defaultDates(), today: todayIso() }} />
      <CharacterTips deals={deals} />
      <PopularRoutes routes={getPopularRoutes()} deals={routeDeals} live={live} />
      <Steps />
      <PriceAlert />
      <Faq />
      <SiteFooter />
      <MobileNav />
    </div>
  );
}
