import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { Link, redirect } from "@/i18n/navigation";
import { cityByCode } from "@/data/airports";
import { getAdminUser } from "@/lib/auth/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { getClickReport } from "@/lib/click-report";
import { formatDateTime, formatRange } from "@/lib/dates";
import { asLocale } from "@/lib/intl";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tıklama Raporu",
  robots: { index: false, follow: false },
};

type Query = Record<string, string | string[] | undefined>;

export default async function AdminClicksPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Query>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) redirect({ href: { pathname: "/giris", query: { next: "/yonetim/tiklamalar" } }, locale: asLocale(locale) });
  const admin = await getAdminUser();
  if (!admin) notFound();

  const sp = await searchParams;
  const rawDays = Array.isArray(sp.gun) ? sp.gun[0] : sp.gun;
  const days: 7 | 30 = rawDays === "30" ? 30 : 7;
  const report = await getClickReport(days);

  const tabCls = (active: boolean) =>
    `inline-flex min-h-[44px] items-center rounded-pill border-2 border-solid px-5 font-display text-[15px] font-semibold no-underline ${
      active ? "border-primary bg-primary text-white" : "border-line bg-white text-ink hover:border-primary"
    }`;
  const card = "flex flex-col gap-3 rounded-[28px] border-2 border-solid border-line bg-white p-6";
  const maxDay = Math.max(1, ...report.byDay.map((d) => d.count));
  const maxRoute = Math.max(1, ...report.topRoutes.map((r) => r.count));
  const maxSrc = Math.max(1, ...report.bySource.map((s) => s.count));

  return (
    <div className="min-h-screen w-full bg-white">
      <SiteHeader width="page" />
      <main className="mx-auto flex max-w-page flex-col gap-6 px-4 pb-20 pt-2 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[32px] bg-sky px-7 py-6">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-extrabold text-muted">Yönetim · Salt okunur</span>
            <h1 className="m-0 font-display text-[34px] font-bold leading-tight text-ink">Tıklama raporu</h1>
            <p className="m-0 text-[15px] font-semibold text-muted">
              &ldquo;Fırsata git&rdquo; (/git) üzerinden ortaklara yönlendirilen tıklamaların özeti.
            </p>
          </div>
          <Link
            href="/yonetim/firsatlar"
            className="inline-flex min-h-[44px] items-center rounded-pill bg-white px-5 font-display text-[15px] font-semibold text-ink no-underline"
          >
            Fırsat adayları →
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Link href={{ pathname: "/yonetim/tiklamalar", query: { gun: "7" } }} className={tabCls(days === 7)}>
              Son 7 gün ({report.total7})
            </Link>
            <Link href={{ pathname: "/yonetim/tiklamalar", query: { gun: "30" } }} className={tabCls(days === 30)}>
              Son 30 gün ({report.total30})
            </Link>
          </div>
          {report.truncated && (
            <span className="text-xs font-bold text-muted">Son 10.000 kayıt üzerinden özetlendi.</span>
          )}
        </div>

        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-[24px] bg-field px-5 py-4">
            <span className="block text-xs font-extrabold text-muted">Son {days} gün</span>
            <span className="font-display text-3xl font-bold text-ink">{report.total}</span>
          </div>
          <div className="rounded-[24px] bg-field px-5 py-4">
            <span className="block text-xs font-extrabold text-muted">Benzersiz rota</span>
            <span className="font-display text-3xl font-bold text-ink">{report.uniqueRoutes}</span>
          </div>
          <div className="rounded-[24px] bg-field px-5 py-4">
            <span className="block text-xs font-extrabold text-muted">En çok kaynak</span>
            <span className="font-display text-xl font-bold text-ink">{report.bySource[0]?.key ?? "—"}</span>
          </div>
          <div className="rounded-[24px] bg-field px-5 py-4">
            <span className="block text-xs font-extrabold text-muted">Ana ortak</span>
            <span className="font-display text-xl font-bold text-ink">{report.byPartner[0]?.key ?? "—"}</span>
          </div>
        </section>

        <section className={card}>
          <h2 className="m-0 font-display text-xl font-bold text-ink">Günlük dağılım</h2>
          <div className="flex h-[130px] items-end gap-1 overflow-x-auto pt-4">
            {report.byDay.map((d) => (
              <div key={d.key} className="flex min-w-[18px] flex-1 flex-col items-center gap-1" title={`${d.key}: ${d.count}`}>
                <span className="text-[11px] font-bold text-muted">{d.count > 0 ? d.count : ""}</span>
                <div
                  className="w-full max-w-[28px] rounded-t-[6px] bg-primary"
                  style={{ height: `${Math.max(d.count > 0 ? 8 : 2, Math.round((d.count / maxDay) * 86))}px` }}
                />
                <span className="text-[10px] font-bold text-muted">{d.key.slice(8)}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className={card}>
            <h2 className="m-0 font-display text-xl font-bold text-ink">En çok tıklanan rotalar</h2>
            {report.topRoutes.length === 0 ? (
              <p className="m-0 text-sm font-semibold text-muted">Bu dönemde kayıtlı tıklama yok.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {report.topRoutes.map((r) => (
                  <li key={`${r.origin}>${r.destination}`} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2 text-sm font-bold">
                      <span className="text-ink">
                        {cityByCode(r.origin, locale)} → {cityByCode(r.destination, locale)}{" "}
                        <span className="text-xs font-extrabold text-muted">
                          ({r.origin} → {r.destination})
                        </span>
                      </span>
                      <span className="font-display text-base font-bold text-ink">{r.count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-field">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((r.count / maxRoute) * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={card}>
            <h2 className="m-0 font-display text-xl font-bold text-ink">Kaynaklar (src)</h2>
            {report.bySource.length === 0 ? (
              <p className="m-0 text-sm font-semibold text-muted">Bu dönemde kayıtlı tıklama yok.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {report.bySource.map((s) => (
                  <li key={s.key} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2 text-sm font-bold">
                      <code className="rounded bg-field px-2 py-0.5 text-xs font-extrabold text-ink">{s.key}</code>
                      <span className="font-display text-base font-bold text-ink">{s.count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-field">
                      <div className="h-full rounded-full bg-green" style={{ width: `${Math.round((s.count / maxSrc) * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {report.byPartner.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 border-0 border-t border-solid border-line pt-3">
                {report.byPartner.map((p) => (
                  <span key={p.key} className="rounded-pill bg-sky px-3 py-1 text-xs font-extrabold text-ink">
                    {p.key}: {p.count}
                  </span>
                ))}
                {report.byMarket.map((m) => (
                  <span key={m.key} className="rounded-pill bg-field px-3 py-1 text-xs font-extrabold text-muted">
                    {m.key}: {m.count}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>

        {report.recent.length > 0 && (
          <section className={card}>
            <h2 className="m-0 font-display text-xl font-bold text-ink">Son tıklamalar</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-0 border-b border-solid border-line text-xs font-extrabold text-muted">
                    <th className="py-2 pr-4">Zaman</th>
                    <th className="py-2 pr-4">Rota</th>
                    <th className="py-2 pr-4">Tarih</th>
                    <th className="py-2 pr-4">Kaynak</th>
                    <th className="py-2 pr-4">Ortak</th>
                    <th className="py-2">Pazar</th>
                  </tr>
                </thead>
                <tbody>
                  {report.recent.map((r) => (
                    <tr key={r.id} className="border-0 border-t border-solid border-line font-semibold">
                      <td className="whitespace-nowrap py-2 pr-4 text-muted">{formatDateTime(r.created_at, "tr-TR")}</td>
                      <td className="whitespace-nowrap py-2 pr-4 font-bold text-ink">
                        {r.origin} → {r.destination}
                      </td>
                      <td className="whitespace-nowrap py-2 pr-4 text-muted">
                        {formatRange(r.depart, r.return_date ?? undefined, "tr-TR")}
                      </td>
                      <td className="py-2 pr-4">
                        <code className="rounded bg-field px-2 py-0.5 text-xs">{r.src || "—"}</code>
                      </td>
                      <td className="py-2 pr-4 text-muted">{r.partner}</td>
                      <td className="py-2 text-muted">{r.market || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
