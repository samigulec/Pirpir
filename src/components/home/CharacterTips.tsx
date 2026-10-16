import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Biletcik, Bulut, Gunes, Pasi, Pirpir, Valiz } from "../characters";
import { Price } from "../Price";
import { searchHref } from "@/lib/flights";
import { DEMO_BOOKING_ID, DEMO_OFFER_ID } from "@/data/mock/booking";

export async function CharacterTips() {
  const t = await getTranslations("home.tips");
  const price = (amount: number) => () => <Price amount={amount} />;

  const tips = [
    { key: "bulut", href: searchHref({ to: "Roma" }), bg: "bg-sun-soft", name: "text-sun-text", art: <Bulut highlights={false} width={100} height={70} className="flex-none" />, quote: t.rich("bulut.quote", { price: price(1890) }) },
    { key: "valiz", href: `/rezervasyon/${DEMO_OFFER_ID}`, bg: "bg-coral-soft", name: "text-coral-text", art: <Valiz stripe={false} highlights={false} width={64} height={80} className="flex-none" />, quote: t("valiz.quote") },
    { key: "pirpir", href: "#alarm", bg: "bg-sky", name: "text-primary-dark", art: <Pirpir aria-label="Pırpır karakteri" windows={false} highlights={false} blades={false} width={100} height={70} className="flex-none" />, quote: t("pirpir.quote") },
    { key: "pasi", href: "#sss", bg: "bg-pink-soft", name: "text-plum-text", art: <Pasi width={64} height={80} className="flex-none" />, quote: t("pasi.quote") },
    { key: "biletcik", href: `/rezervasyon/${DEMO_BOOKING_ID}/onay`, bg: "bg-green-soft", name: "text-green-text", art: <Biletcik width={100} height={65} className="flex-none" />, quote: t("biletcik.quote") },
    { key: "gunes", href: searchHref({ to: "Antalya" }), bg: "bg-sun-softer", name: "text-sun-text", art: <Gunes width={80} height={80} className="flex-none" />, quote: t.rich("gunes.quote", { price: price(3090) }) },
  ] as const;

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
