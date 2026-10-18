import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { Pirpir } from "@/components/characters";

export default async function Loading() {
  const t = await getTranslations("results");
  return (
    <div className="min-h-screen w-full bg-white">
      <SiteHeader width="results" />
      <main className="mx-auto flex max-w-results flex-col items-center gap-4 px-4 md:px-6 pb-20 pt-16 text-center">
        <Pirpir aria-hidden trail width={200} height={140} className="animate-bounce [animation-duration:2s]" />
        <p role="status" className="m-0 font-display text-xl font-semibold">{t("loading")}</p>
      </main>
    </div>
  );
}
