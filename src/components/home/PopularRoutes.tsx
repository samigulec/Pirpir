import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { cityByCode } from "@/data/airports";
import { ArrowRight } from "../icons";
import { Price } from "../Price";
import type { PopularRoute } from "@/data/mock/home";
import { routeKey, type DealMap } from "@/lib/deals";
import { searchHref } from "@/lib/search";
import { minsParts } from "@/lib/dates";

/** Fiyat, aktarma ve süre: rotanın önümüzdeki hafta sonlarındaki en ucuz gidiş-dönüş teklifi. */
export async function PopularRoutes({ routes, deals, live }: { routes: PopularRoute[]; deals: DealMap; live: boolean }) {
  const t = await getTranslations("home.routes");
  const tp = await getTranslations("home.popular");
  const tc = await getTranslations("common");
  const locale = await getLocale();
  const stopsLabel = (n: number) => (n === 0 ? tc("direct") : n === 1 ? tc("oneStop") : tc("stops", { n }));
  return (
    <section id="rotalar" className="mx-auto flex max-w-page flex-col gap-5 px-6 pt-[88px]">
      <h2 className="m-0 font-display text-[40px] font-bold">{t("title")}</h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-[10px]">
        {routes.map((r) => {
          const deal = deals[routeKey(r)];
          return (
            <Link
              key={routeKey(r)}
              href={searchHref({ from: r.fromCode, to: r.toCode, ...(deal && { date: deal.date, returnDate: deal.returnDate }) })}
              className="box-border flex min-h-[64px] items-center justify-between gap-3 rounded-[20px] bg-field px-[18px] py-[14px] text-ink no-underline"
            >
              <span className="flex flex-col">
                <span className="font-extrabold">{cityByCode(r.fromCode, locale)} → {cityByCode(r.toCode, locale)}</span>
                {deal && (
                  <span className="text-sm font-semibold text-muted">
                    {stopsLabel(deal.stops)} · {tc("duration", minsParts(deal.mins, true))}
                  </span>
                )}
              </span>
              <span className="flex items-center gap-[10px]">
                <span className="font-display text-xl font-semibold">{deal ? <Price amount={deal.price} /> : tp("seePrices")}</span>
                <ArrowRight />
              </span>
            </Link>
          );
        })}
      </div>
      <p className="m-0 text-sm font-semibold text-muted">{tp(live ? "noteLive" : "noteSample")}</p>
    </section>
  );
}
