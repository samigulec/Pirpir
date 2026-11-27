import { getTranslations } from "next-intl/server";
import { OpenFromHash } from "./OpenFromHash";
import { isAffiliate } from "@/config/affiliate";

const ITEMS = ["when", "cancel", "change", "bags", "transfer", "docs", "payment"] as const;
/** Ortaklık modu: bilet ve ödeme satıcıda; bağlantılar aynı kimliği (sss-bags, sss-docs) korur */
const AFF_ITEMS = [["buy", "buy"], ["pay", "pay"], ["cancel", "cancelAff"], ["bags", "bagsAff"], ["transfer", "transfer"], ["checkin", "checkin"], ["docs", "docs"]] as const;

export async function Faq() {
  const t = await getTranslations("home.faq");
  return (
    <section id="sss" className="mx-auto flex max-w-faq flex-col gap-[14px] px-4 pt-14 md:px-6 md:pt-[88px]">
      <h2 className="m-0 mb-2 text-center font-display text-[40px] font-bold">{t("title")}</h2>
      {(isAffiliate() ? AFF_ITEMS : ITEMS.map((k) => [k, k] as const)).map(([id, k]) => (
        <details key={id} id={`sss-${id}`} className="scroll-mt-6 rounded-[22px] bg-field px-[22px] py-[18px]">
          <summary className="flex justify-between gap-3 font-display text-xl font-semibold">
            {t(`items.${k}.q`)} <span aria-hidden="true">+</span>
          </summary>
          <p className="m-0 mt-[10px] text-muted">{t(`items.${k}.a`)}</p>
        </details>
      ))}
      <OpenFromHash />
    </section>
  );
}
