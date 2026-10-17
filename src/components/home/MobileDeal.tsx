"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCurrency } from "../CurrencyProvider";
import { Bulut } from "../characters";
import { ArrowRight } from "../icons";
import { searchHref } from "@/lib/search";
import type { Deal } from "@/lib/deals";

/** Yalnızca telefonda: Mobile.dc.html'deki Bulut fırsat kartı. Fiyat, varsayılan kalkıştan Roma fırsatı. */
export function MobileDeal({ deal, from }: { deal: Deal | null; from: string[] }) {
  const t = useTranslations("home.mobileDeal");
  const tc = useTranslations("common.characters");
  const { fmt } = useCurrency();
  return (
    <div className="mt-4 flex items-center gap-3 rounded-[24px] bg-sun-soft px-4 py-[14px] md:hidden">
      <Bulut aria-label={tc("bulut")} bold highlights={false} width={64} height={44} className="flex-none" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="font-display text-[17px] font-semibold leading-[1.25]">{t("title")}</span>
        <span className="text-sm font-bold text-muted">{deal ? t.rich("price", { price: () => fmt(deal.price) }) : t("noPrice")}</span>
      </div>
      <Link
        href={searchHref({ from, to: "city:ROM", ...(deal && { date: deal.date, returnDate: deal.returnDate }) })}
        aria-label={t("cta")}
        className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white text-ink"
      >
        <ArrowRight />
      </Link>
    </div>
  );
}
