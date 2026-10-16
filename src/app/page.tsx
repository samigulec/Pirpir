import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeView } from "@/components/home/HomeView";
import { CharacterTips } from "@/components/home/CharacterTips";
import { PopularRoutes } from "@/components/home/PopularRoutes";
import { Steps } from "@/components/home/Steps";
import { PriceAlert } from "@/components/home/PriceAlert";
import { Faq } from "@/components/home/Faq";
import { MobileNav } from "@/components/home/MobileNav";
import { SiteFooter } from "@/components/SiteFooter";
import { getDefaultSearch, getPopularDestinations, getPopularRoutes } from "@/lib/flights";

export default function HomePage() {
  return (
    <div className="min-h-screen w-full bg-white pb-[84px] md:pb-0">
      <HomeHeader />
      <HomeView destinations={getPopularDestinations()} defaults={getDefaultSearch()} />
      <CharacterTips />
      <PopularRoutes routes={getPopularRoutes()} />
      <Steps />
      <PriceAlert />
      <Faq />
      <SiteFooter />
      <MobileNav />
    </div>
  );
}
