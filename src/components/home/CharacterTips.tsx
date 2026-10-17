import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Biletcik, Bulut, Gunes, Pasi, Pirpir, Valiz } from "../characters";
import { Price } from "../Price";
import { confirmHref, searchHref } from "@/lib/search";
import { SAMPLE_BOOKING_ID } from "@/data/mock/booking";
import type { Deal, DealMap } from "@/lib/deals";

/** Bulut ve Güneş'in fiyatları popüler uçuş kartlarıyla aynı fırsatlardan gelir. */
export async function CharacterTips({ deals }: { deals: DealMap }) {
  const t = await getTranslations("home.tips");
  const tc = await getTranslations("common.characters");
  const price = (amount: number) => () => <Price amount={amount} />;
  const dealHref = (to: string, d: Deal | null | undefined) => searchHref({ to, ...(d && { date: d.date, returnDate: d.returnDate }) });
  const quote = (key: "bulut" | "gunes", d: Deal | null | undefined) =>
    d ? t.rich(`${key}.quote`, { price: price(d.price) }) : t(`${key}.quoteNoPrice`);

  const tips = [
    { key: "bulut", href: dealHref("city:ROM", deals.fco), bg: "bg-sun-soft", name: "text-sun-text", art: <Bulut aria-label={tc("bulut")} highlights={false} width={100} height={70} className="flex-none" />, quote: quote("bulut", deals.fco) },
    { key: "valiz", href: searchHref(), bg: "bg-coral-soft", name: "text-coral-text", art: <Valiz aria-label={tc("valiz")} stripe={false} highlights={false} width={64} height={80} className="flex-none" />, quote: t("valiz.quote") },
    { key: "pirpir", href: { pathname: "/" as const, hash: "alarm" }, bg: "bg-sky", name: "text-primary-dark", art: <Pirpir aria-label={tc("pirpir")} windows={false} highlights={false} blades={false} width={100} height={70} className="flex-none" />, quote: t("pirpir.quote") },
    { key: "pasi", href: { pathname: "/" as const, hash: "sss" }, bg: "bg-pink-soft", name: "text-plum-text", art: <Pasi aria-label={tc("pasi")} width={64} height={80} className="flex-none" />, quote: t("pasi.quote") },
    { key: "biletcik", href: confirmHref(SAMPLE_BOOKING_ID), bg: "bg-green-soft", name: "text-green-text", art: <Biletcik aria-label={tc("biletcik")} width={100} height={65} className="flex-none" />, quote: t("biletcik.quote") },
    { key: "gunes", href: dealHref("AYT", deals.ayt), bg: "bg-sun-softer", name: "text-sun-text", art: <Gunes aria-label={tc("gunes")} width={80} height={80} className="flex-none" />, quote: quote("gunes", deals.ayt) },
  ];

  return (
    <section className="mx-auto flex max-w-page flex-col gap-6 px-6 pt-[88px]">
      <div className="flex flex-col items-center gap-1 text-center">
        <h2 className="m-0 font-display text-[40px] font-bold">{t("title")}</h2>
        <p className="m-0 text-muted">{t("subtitle")}</p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-4">
        {tips.map((tip) => (
          <Link key={tip.key} href={tip.href} className={`flex items-center gap-[18px] rounded-[28px] px-[22px] py-5 text-ink no-underline ${tip.bg}`}>
            {tip.art}
            <span className="flex flex-col gap-[2px]">
              <span className={`text-sm font-extrabold ${tip.name}`}>{t(`${tip.key}.name`)}</span>
              <span className="font-display text-[21px] font-semibold leading-[1.25]">{tip.quote}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
