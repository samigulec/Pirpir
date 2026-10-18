import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { Pirpir } from "@/components/characters";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("common.notFound");
  return (
    <div className="min-h-screen w-full bg-white">
      <SiteHeader width="form" />
      <main className="mx-auto flex max-w-form flex-col items-center gap-4 px-4 md:px-6 pb-20 pt-10 text-center">
        <Pirpir aria-hidden width={170} height={119} />
        <h1 className="m-0 font-display text-[44px] font-bold leading-[1.1]">{t("title")}</h1>
        <p className="m-0 text-muted">{t("text")}</p>
        <Link href="/" className="box-border inline-flex min-h-[48px] items-center rounded-pill bg-primary px-6 py-3 font-display text-lg font-semibold text-white no-underline">
          {t("cta")}
        </Link>
      </main>
    </div>
  );
}
