import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { cityByCode } from "@/data/airports";
import { ArrowRight } from "../icons";
import { searchHref } from "@/lib/search";

/** Yalnızca rota bağlantıları: tıklayınca o rota bilinen en ucuz tarihle (yoksa iki hafta sonraki hafta sonu) aranır. */
export async function PopularRoutes({ routes, dates }: { routes: [string, string][]; dates: Record<string, { date: string; returnDate: string }> }) {
  const t = await getTranslations("home.routes");
  const locale = await getLocale();
  return (
    <section id="rotalar" className="mx-auto flex max-w-page flex-col gap-5 px-4 pt-14 md:px-6 md:pt-[88px]">
      <h2 className="m-0 font-display text-[40px] font-bold">{t("title")}</h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-[10px]">
        {routes.map(([from, to]) => (
          <Link
            key={`${from}-${to}`}
            href={searchHref({ from, to, ...dates[`${from}>${to}`] })}
            className="box-border flex min-h-[64px] items-center justify-between gap-3 rounded-[20px] bg-field px-[18px] py-[14px] text-ink no-underline"
          >
            <span className="font-extrabold">{cityByCode(from, locale)} → {cityByCode(to, locale)}</span>
            <ArrowRight />
          </Link>
        ))}
      </div>
    </section>
  );
}
