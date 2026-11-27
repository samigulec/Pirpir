import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { brand } from "@/config/brand";
import { isAffiliate } from "@/config/affiliate";
import { routeHref } from "@/lib/search";

/** Ana sayfanın geniş altbilgisi. */
export async function SiteFooter() {
  const t = await getTranslations("common.footer");
  const link = "text-muted";
  return (
    <footer className="mt-24 bg-field">
      <div className="mx-auto grid max-w-page grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-7 px-4 pb-10 pt-12 md:px-6 text-[15px]">
        <div className="flex flex-col gap-[10px]">
          <span className="font-display text-[26px] font-bold">{brand.name}</span>
          <span className="text-muted">{t("tagline")}</span>
        </div>
        <nav aria-label={t("company")} className="flex flex-col gap-2">
          <span className="font-extrabold">{brand.name}</span>
          <a href="#" className={link}>{t("about")}</a>
          <a href="#" className={link}>{t("careers")}</a>
          <a href="#" className={link}>{t("press")}</a>
        </nav>
        <nav aria-label={t("help")} className="flex flex-col gap-2">
          <span className="font-extrabold">{t("help")}</span>
          <Link href={{ pathname: "/", hash: "sss" }} className={link}>{t("helpCenter")}</Link>
          <Link href={{ pathname: "/", hash: "sss-bags" }} className={link}>{t("baggage")}</Link>
          <Link href={{ pathname: "/", hash: "sss-cancel" }} className={link}>{t("cancel")}</Link>
        </nav>
        <nav aria-label={t("popular")} className="flex flex-col gap-2">
          <span className="font-extrabold">{t("popular")}</span>
          <Link href={routeHref({ from: "amsterdam", to: "istanbul" })} className={link}>{t("istanbul")}</Link>
          <Link href={routeHref({ from: "amsterdam", to: "antalya" })} className={link}>{t("antalya")}</Link>
          <Link href={routeHref({ from: "amsterdam", to: "izmir" })} className={link}>{t("izmir")}</Link>
        </nav>
      </div>
      <div className="mx-auto flex max-w-page flex-wrap justify-between gap-3 border-0 border-t border-solid border-line px-6 pb-10 pt-[18px] text-sm text-muted">
        <span>© {brand.name}</span>
        <span className="flex gap-5">
          <Link href="/gizlilik" className={link}>{t("privacy")}</Link>
          <Link href="/kosullar" className={link}>{t("terms")}</Link>
          <Link href={{ pathname: "/gizlilik", hash: "cerezler" }} className={link}>{t("cookies")}</Link>
        </span>
      </div>
      <AffiliateDisclosure />
    </footer>
  );
}

/** Diğer sayfaların sade altbilgisi (Destination.dc.html). */
export async function SimpleFooter() {
  const t = await getTranslations("common");
  return (
    <footer className="bg-field">
      <div className="mx-auto flex max-w-page flex-wrap justify-between gap-3 px-4 pb-10 pt-7 md:px-6 text-sm text-muted">
        <span>© {brand.name}</span>
        <span className="flex gap-5">
          <Link href={{ pathname: "/", hash: "sss" }} className="text-muted">{t("footer.help")}</Link>
          <Link href="/gizlilik" className="text-muted">{t("footer.privacy")}</Link>
          <Link href="/kosullar" className="text-muted">{t("footer.terms")}</Link>
        </span>
      </div>
      <AffiliateDisclosure />
    </footer>
  );
}

/** Ortaklık beyanı: "Fırsata git" bağlantılarından komisyon alındığı açıkça yazılır (reklam kuralları gereği). */
async function AffiliateDisclosure() {
  if (!isAffiliate()) return null;
  const t = await getTranslations("common");
  return (
    <p className="mx-auto m-0 max-w-page px-4 pb-8 text-[13px] text-muted md:px-6">{t("affiliateDisclosure", { brand: brand.name })}</p>
  );
}
