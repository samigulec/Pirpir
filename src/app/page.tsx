import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeView } from "@/components/home/HomeView";
import { CharacterTips } from "@/components/home/CharacterTips";
import { PopularRoutes } from "@/components/home/PopularRoutes";
import { Steps } from "@/components/home/Steps";
import { PriceAlert } from "@/components/home/PriceAlert";
import { Faq } from "@/components/home/Faq";
import { MobileNav } from "@/components/home/MobileNav";
import { SiteFooter } from "@/components/SiteFooter";
import { getPopularDestinations, getPopularRoutes } from "@/lib/flights";
import { defaultDates, todayIso } from "@/lib/search";

// Varsayılan tarihler ve "bugün" sınırı güncel kalsın diye sayfa saatte bir yenilenir.
export const revalidate = 3600;

export default function HomePage() {
  return (
    <div className="min-h-screen w-full bg-white pb-[84px] md:pb-0">
      <HomeHeader />
      <HomeView destinations={getPopularDestinations()} defaults={{ ...defaultDates(), today: todayIso() }} />
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
