import { getTranslations } from "next-intl/server";

const ITEMS = ["when", "cancel", "bags", "transfer", "payment"] as const;

export async function Faq() {
  const t = await getTranslations("home.faq");
  return (
    <section id="sss" className="mx-auto flex max-w-faq flex-col gap-[14px] px-6 pt-[88px]">
      <h2 className="m-0 mb-2 text-center font-display text-[40px] font-bold">{t("title")}</h2>
      {ITEMS.map((k) => (
        <details key={k} className="rounded-[22px] bg-field px-[22px] py-[18px]">
          <summary className="flex justify-between gap-3 font-display text-xl font-semibold">
            {t(`items.${k}.q`)} <span aria-hidden="true">+</span>
          </summary>
          <p className="m-0 mt-[10px] text-muted">{t(`items.${k}.a`)}</p>
        </details>
      ))}
    </section>
  );
}
