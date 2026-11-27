import { getTranslations } from "next-intl/server";
import { brand } from "@/config/brand";
import { OpenFromHash } from "./OpenFromHash";
import { isAffiliate, outboundPartner } from "@/config/affiliate";
import { safeJsonLd } from "@/lib/seo";

const ITEMS = ["when", "cancel", "change", "bags", "transfer", "docs", "payment"] as const;
/** Ortaklık modu: bilet ve ödeme satıcıda; bağlantılar aynı kimliği (sss-bags, sss-docs) korur */
const AFF_ITEMS = [["buy", "buy"], ["pay", "pay"], ["cancel", "cancelAff"], ["bags", "bagsAff"], ["transfer", "transferAff"], ["checkin", "checkin"], ["docs", "docs"]] as const;

export async function Faq() {
  const t = await getTranslations("home.faq");
  const partner = outboundPartner();
  const entries = (isAffiliate() ? AFF_ITEMS : ITEMS.map((k) => [k, k] as const)).map(([id, k]) => ({
    id,
    q: t(`items.${k}.q`),
    a: t(`items.${k}.a`, { partner, brand: brand.name }),
  }));
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((e) => ({
      "@type": "Question",
      name: e.q,
      acceptedAnswer: { "@type": "Answer", text: e.a },
    })),
  };
  return (
    <section id="sss" className="mx-auto flex max-w-faq flex-col gap-[14px] px-4 pt-14 md:px-6 md:pt-[88px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqSchema) }} />
      <h2 className="m-0 mb-2 text-center font-display text-[40px] font-bold">{t("title")}</h2>
      {entries.map((e) => (
        <details key={e.id} id={`sss-${e.id}`} className="scroll-mt-6 rounded-[22px] bg-field px-[22px] py-[18px]">
          <summary className="flex justify-between gap-3 font-display text-xl font-semibold">
            {e.q} <span aria-hidden="true">+</span>
          </summary>
          <p className="m-0 mt-[10px] text-muted">{e.a}</p>
        </details>
      ))}
      <OpenFromHash />
    </section>
  );
}
