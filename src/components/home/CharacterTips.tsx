import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Biletcik, Bulut, Gunes, Pasi, Pirpir, Valiz } from "../characters";
import { Price } from "../Price";
import { ArrowRight } from "../icons";
import { searchHref } from "@/lib/search";
import type { Deal, DealMap } from "@/lib/deals";

/**
 * Karakter ipuçları. Her kart konusuyla ilgili yere götürür ve altında nereye gideceği yazar: fırsatlar aramaya,
 * bagaj ve belge ipuçları SSS'deki ilgili soruya, fiyat bekçisi alarm formuna, check-in rehberi biletlere.
 * Bulut ve Güneş'in fiyatları popüler uçuş kartlarıyla aynı fırsatlardan gelir.
 */
export async function CharacterTips({ deals, from }: { deals: DealMap; from: string }) {
  const t = await getTranslations("home.tips");
  const tc = await getTranslations("common.characters");
  const price = (amount: number) => () => <Price amount={amount} />;
  const dealHref = (to: string, d: Deal | null | undefined) => searchHref({ from, to, ...(d && { date: d.date, returnDate: d.returnDate }) });
  const quote = (key: "bulut" | "gunes", d: Deal | null | undefined) =>
    d ? t.rich(`${key}.quote`, { price: price(d.price) }) : t(`${key}.quoteNoPrice`);

  const tips: { key: string; href?: ComponentProps<typeof Link>["href"]; anchor?: string; bg: string; name: string; art: React.ReactNode; quote: React.ReactNode }[] = [
    { key: "bulut", href: dealHref("city:ROM", deals.fco), bg: "bg-sun-soft", name: "text-sun-text", art: <Bulut aria-label={tc("bulut")} highlights={false} width={100} height={70} className="flex-none" />, quote: quote("bulut", deals.fco) },
    { key: "valiz", anchor: "sss-bags", bg: "bg-coral-soft", name: "text-coral-text", art: <Valiz aria-label={tc("valiz")} stripe={false} highlights={false} width={64} height={80} className="flex-none" />, quote: t("valiz.quote") },
    { key: "pirpir", anchor: "alarm", bg: "bg-sky", name: "text-primary-dark", art: <Pirpir aria-label={tc("pirpir")} windows={false} highlights={false} blades={false} width={100} height={70} className="flex-none" />, quote: t("pirpir.quote") },
    { key: "pasi", anchor: "sss-docs", bg: "bg-pink-soft", name: "text-plum-text", art: <Pasi aria-label={tc("pasi")} width={64} height={80} className="flex-none" />, quote: t("pasi.quote") },
    { key: "biletcik", href: "/biletlerim" as const, bg: "bg-green-soft", name: "text-green-text", art: <Biletcik aria-label={tc("biletcik")} width={100} height={65} className="flex-none" />, quote: t("biletcik.quote") },
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
          (() => {
            const className = `group flex items-center gap-[18px] rounded-[28px] px-[22px] py-5 text-ink no-underline ${tip.bg}`;
            const body = (
              <>
                {tip.art}
                <span className="flex flex-col gap-[2px]">
                  <span className={`text-sm font-extrabold ${tip.name}`}>{t(`${tip.key}.name`)}</span>
                  <span className="font-display text-[21px] font-semibold leading-[1.25]">{tip.quote}</span>
                  <span className={`mt-1 inline-flex items-center gap-1 text-[15px] font-extrabold group-hover:underline ${tip.name}`}>
                    {t(`${tip.key}.cta`)} <ArrowRight />
                  </span>
                </span>
              </>
            );
            // Aynı sayfadaki bölümlere düz bağlantı: tarayıcı kaydırır ve SSS sorusu açılır
            return tip.anchor ? (
              <a key={tip.key} href={`#${tip.anchor}`} className={className}>{body}</a>
            ) : (
              <Link key={tip.key} href={tip.href!} className={className}>{body}</Link>
            );
          })()
        ))}
      </div>
    </section>
  );
}
