import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { Pirpir } from "@/components/characters";

// "Devam et"e basınca sayfa hemen değişir; teklif Duffel'dan gelene kadar bu görünür.
export default async function Loading() {
  const t = await getTranslations("booking");
  return (
    <div className="min-h-screen w-full bg-white">
      <SiteHeader width="form" />
      <main className="mx-auto flex max-w-form flex-col items-center gap-4 px-4 pb-20 pt-16 text-center md:px-6">
        <Pirpir aria-hidden trail width={200} height={140} className="animate-bounce [animation-duration:2s]" />
        <p role="status" className="m-0 font-display text-xl font-semibold">{t("loadingPage")}</p>
      </main>
    </div>
  );
}
