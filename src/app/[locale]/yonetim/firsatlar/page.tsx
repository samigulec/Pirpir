import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { AdminDealsTable } from "@/components/admin/AdminDealsTable";
import { redirect } from "@/i18n/navigation";
import { cityByCode } from "@/data/airports";
import { getAdminUser } from "@/lib/auth/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { toTry } from "@/lib/currency";
import { getRates } from "@/lib/currency-server";
import { listDeals } from "@/lib/deal-store";
import { asLocale } from "@/lib/intl";
import { airlineName } from "@/lib/providers/travelpayouts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fırsat Yönetimi",
  robots: { index: false, follow: false },
};

export default async function AdminDealsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) redirect({ href: { pathname: "/giris", query: { next: "/yonetim/firsatlar" } }, locale: asLocale(locale) });
  const admin = await getAdminUser();
  if (!admin) notFound();

  const [deals, rates] = await Promise.all([listDeals(undefined, 200), getRates()]);
  const enriched = deals.map((d) => ({
    ...d,
    originCity: cityByCode(d.origin, locale),
    destinationCity: cityByCode(d.destination, locale),
    airlineLabel: d.airline ? airlineName(d.airline) : null,
    priceTry: toTry(d.price_eur, "EUR", rates),
    medianTry: toTry(d.median_eur, "EUR", rates),
  }));

  return (
    <div className="min-h-screen w-full bg-white">
      <SiteHeader width="page" />
      <main className="mx-auto flex max-w-page flex-col gap-6 px-4 pb-20 pt-2 md:px-6">
        <div className="flex flex-col gap-1 rounded-[32px] bg-sky px-7 py-6">
          <span className="text-sm font-extrabold text-muted">Yönetim</span>
          <h1 className="m-0 font-display text-[34px] font-bold leading-tight text-ink">Fırsat adayları</h1>
          <p className="m-0 text-[15px] font-semibold text-muted">
            Günlük taramada normal ortancasının %75&apos;i veya altında, en az 30 € tasarruflu bulunan uçuşlar burada listelenir.
          </p>
        </div>

        <AdminDealsTable initial={enriched} />
      </main>
    </div>
  );
}
