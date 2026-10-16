import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "../icons";
import { Price } from "../Price";
import type { PopularRoute } from "@/data/mock/home";
import { routeHref, searchHref } from "@/lib/flights";
import { splitDuration } from "@/lib/format";

export async function PopularRoutes({ routes }: { routes: PopularRoute[] }) {
  const t = await getTranslations("home.routes");
  const tc = await getTranslations("common");
  return (
    <section id="rotalar" className="mx-auto flex max-w-page flex-col gap-5 px-6 pt-[88px]">
      <h2 className="m-0 font-display text-[40px] font-bold">{t("title")}</h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-[10px]">
        {routes.map((r) => (
          <Link
            key={`${r.from}-${r.to}`}
            href={r.routeSlug ? routeHref(r.routeSlug) : searchHref({ from: r.from, to: r.to })}
            className="box-border flex min-h-[64px] items-center justify-between gap-3 rounded-[20px] bg-field px-[18px] py-[14px] text-ink no-underline"
          >
            <span className="flex flex-col">
              <span className="font-extrabold">{r.from} → {r.to}</span>
              <span className="text-sm font-semibold text-muted">
                {r.stops === 0 ? tc("direct") : tc("oneStop")} · {tc("duration", splitDuration(r.mins, true))}
              </span>
            </span>
            <span className="flex items-center gap-[10px]">
              <span className="font-display text-xl font-semibold"><Price amount={r.price} /></span>
              <ArrowRight />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
