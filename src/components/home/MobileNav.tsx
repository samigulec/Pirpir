import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Bell, Help, Search, Ticket } from "../icons";
import { isAffiliate } from "@/config/affiliate";

/** Telefonda sabit alt gezinme (Mobile.dc.html). */
export async function MobileNav() {
  const t = await getTranslations("common.bottomNav");
  const item = "flex min-h-[44px] flex-col items-center gap-[2px] py-2 text-[13px] no-underline";
  return (
    <nav
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-3 border-0 border-t border-solid border-line bg-white px-2 pb-5 pt-[6px] md:hidden"
    >
      <Link href="/" className={`${item} font-extrabold text-primary`}><Search />{t("search")}</Link>
      {/* Ortaklık modunda bilet satılmaz: "Biletlerim" yerine fiyat alarmları */}
      {isAffiliate() ? (
        <Link href={{ pathname: "/hesap", hash: "alarmlar" }} className={`${item} font-bold text-muted`}><Bell />{t("alerts")}</Link>
      ) : (
        <Link href="/biletlerim" className={`${item} font-bold text-muted`}><Ticket />{t("tickets")}</Link>
      )}
      <a href="#sss" className={`${item} font-bold text-muted`}><Help />{t("help")}</a>
    </nav>
  );
}
