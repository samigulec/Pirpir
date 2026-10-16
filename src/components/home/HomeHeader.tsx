import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "../Logo";
import { CurrencySelect, LanguageSelect } from "../HeaderControls";
import { PillLink } from "../SiteHeader";
import { User } from "../icons";

export async function HomeHeader() {
  const t = await getTranslations("common");
  return (
    <>
      {/* Masaüstü (Main.dc.html) */}
      <header className="mx-auto hidden max-w-page flex-wrap items-center justify-between gap-4 px-6 py-[22px] md:flex">
        <Logo tight />
        <nav aria-label={t("mainNav")} className="flex flex-wrap gap-x-[22px] gap-y-1 font-bold">
          <a href="#populer" className="py-[10px] text-ink no-underline">{t("nav.popular")}</a>
          <a href="#rotalar" className="py-[10px] text-ink no-underline">{t("nav.routes")}</a>
          <a href="#sss" className="py-[10px] text-ink no-underline">{t("nav.help")}</a>
        </nav>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <LanguageSelect />
          <CurrencySelect />
          <Link href="#" className="box-border inline-flex min-h-[44px] items-center px-[14px] py-[10px] font-bold text-ink no-underline">
            {t("myTickets")}
          </Link>
          <PillLink href="#">{t("signIn")}</PillLink>
        </div>
      </header>

      {/* Telefon (Mobile.dc.html) */}
      <header className="flex items-center justify-between px-5 pt-5 md:hidden">
        <Logo compact />
        <span className="flex items-center gap-[6px]">
          <CurrencySelect compact />
          <button
            type="button"
            aria-label={t("profile")}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-0 bg-sky text-ink"
          >
            <User />
          </button>
        </span>
      </header>
    </>
  );
}
