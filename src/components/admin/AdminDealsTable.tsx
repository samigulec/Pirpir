"use client";

import { useState, useTransition } from "react";
import { approveDeal, rejectDeal, restoreDeal, triggerDealScan } from "@/actions/admin-deals";
import type { DealRow, DealStatus } from "@/lib/deal-store";
import type { DealScanSummary } from "@/lib/deal-scanner";
import { formatDayWithWeekday, formatRange } from "@/lib/dates";
import { useCurrency } from "../CurrencyProvider";

type AdminDealItem = DealRow & {
  originCity: string;
  destinationCity: string;
  airlineLabel: string | null;
  priceTry: number;
  medianTry: number;
};

type Filter = "candidate" | "published" | "rejected" | "all";

const STATUS_BADGE: Record<DealStatus, { label: string; cls: string }> = {
  candidate: { label: "Aday", cls: "bg-sun-soft text-ink" },
  published: { label: "Yayında", cls: "bg-green-soft text-green-text" },
  rejected: { label: "Reddedildi", cls: "bg-coral-soft text-ink" },
};

export function AdminDealsTable({ initial }: { initial: AdminDealItem[] }) {
  const { fmt } = useCurrency();
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState<Filter>("candidate");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<DealScanSummary | null>(null);
  const [scanning, startScan] = useTransition();

  const counts = {
    candidate: rows.filter((r) => r.status === "candidate").length,
    published: rows.filter((r) => r.status === "published").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
    all: rows.length,
  };

  const visible = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  const act = async (id: string, next: DealStatus) => {
    setBusyId(id);
    setMsg(null);
    const fn = next === "published" ? approveDeal : next === "rejected" ? rejectDeal : restoreDeal;
    const res = await fn(id);
    setBusyId(null);
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: next, published_at: next === "published" ? new Date().toISOString() : null }
          : r,
      ),
    );
  };

  const runScan = () => {
    setMsg(null);
    startScan(async () => {
      const res = await triggerDealScan();
      if (!res.ok) {
        setMsg(res.error);
        return;
      }
      setScanResult(res.summary);
      window.location.reload();
    });
  };

  const tabCls = (active: boolean) =>
    `min-h-[44px] cursor-pointer rounded-pill border-2 border-solid px-4 font-display text-[15px] font-semibold ${
      active ? "border-primary bg-primary text-white" : "border-line bg-white text-ink hover:border-primary"
    }`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Fırsat durumu" className="flex flex-wrap gap-2">
          <button type="button" role="tab" aria-selected={filter === "candidate"} onClick={() => setFilter("candidate")} className={tabCls(filter === "candidate")}>
            Adaylar ({counts.candidate})
          </button>
          <button type="button" role="tab" aria-selected={filter === "published"} onClick={() => setFilter("published")} className={tabCls(filter === "published")}>
            Yayında ({counts.published})
          </button>
          <button type="button" role="tab" aria-selected={filter === "rejected"} onClick={() => setFilter("rejected")} className={tabCls(filter === "rejected")}>
            Reddedilen ({counts.rejected})
          </button>
          <button type="button" role="tab" aria-selected={filter === "all"} onClick={() => setFilter("all")} className={tabCls(filter === "all")}>
            Tümü ({counts.all})
          </button>
        </div>

        <button
          type="button"
          disabled={scanning}
          onClick={runScan}
          className="min-h-[44px] cursor-pointer rounded-pill border-0 bg-sun px-5 font-display text-[15px] font-semibold text-ink disabled:opacity-60"
        >
          {scanning ? "Taranıyor…" : "Şimdi tara"}
        </button>
      </div>

      {msg && (
        <p role="alert" className="m-0 rounded-[18px] bg-coral-soft px-4 py-3 text-sm font-bold text-ink">
          {msg}
        </p>
      )}

      {scanResult && (
        <p role="status" className="m-0 rounded-[18px] bg-green-soft px-4 py-3 text-sm font-bold text-green-text">
          Tarama bitti: {scanResult.routesScanned}/{scanResult.routesTotal} rota, {scanResult.candidatesFound} aday ({scanResult.inserted} yeni, {scanResult.updated} güncel).
        </p>
      )}

      {visible.length === 0 ? (
        <div className="rounded-[28px] border-2 border-solid border-line bg-field px-6 py-8 text-center">
          <p className="m-0 font-display text-xl font-semibold text-ink">Bu sekmede fırsat yok</p>
          <p className="m-0 mt-1 text-sm font-semibold text-muted">
            Günlük tarama her sabah 06:00 UTC&apos;de çalışır; isterseniz yukarıdan &ldquo;Şimdi tara&rdquo; ile tetikleyebilirsiniz.
          </p>
        </div>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {visible.map((d) => {
            const pct = d.median_eur > 0 ? Math.round(((d.median_eur - d.price_eur) / d.median_eur) * 100) : 0;
            const saveEur = Math.round(d.median_eur - d.price_eur);
            const badge = STATUS_BADGE[d.status];
            const busy = busyId === d.id;
            return (
              <li
                key={d.id}
                className="flex flex-col gap-4 rounded-[24px] border-2 border-solid border-line bg-white px-5 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-pill px-3 py-0.5 text-xs font-extrabold ${badge.cls}`}>{badge.label}</span>
                    <span className="font-display text-xl font-bold text-ink">
                      {d.originCity} → {d.destinationCity}
                    </span>
                    <span className="text-xs font-extrabold text-muted">
                      {d.origin} → {d.destination}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold text-muted">
                    <span>{formatRange(d.depart, d.return_date ?? undefined, "tr-TR")}</span>
                    {d.airlineLabel && <span>· {d.airlineLabel}</span>}
                    {d.transfers !== null && (
                      <span>· {d.transfers === 0 ? "Direkt" : `${d.transfers} aktarma`}</span>
                    )}
                    {d.seen_at && <span>· Görüldü: {formatDayWithWeekday(d.seen_at, "tr-TR")}</span>}
                  </div>

                  <div className="mt-1 flex flex-wrap items-baseline gap-3">
                    <span className="font-display text-2xl font-bold text-ink">
                      €{Math.round(d.price_eur)} <span className="text-base font-semibold text-muted">({fmt(d.priceTry)})</span>
                    </span>
                    <span className="text-sm font-bold text-muted line-through">
                      €{Math.round(d.median_eur)}
                    </span>
                    <span className="rounded-pill bg-green-soft px-3 py-0.5 text-xs font-extrabold text-green-text">
                      -%{pct} · €{saveEur} tasarruf
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {d.status !== "published" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => act(d.id, "published")}
                      className="min-h-[44px] cursor-pointer rounded-pill border-0 bg-primary px-5 font-display text-[15px] font-semibold text-white disabled:opacity-60"
                    >
                      Yayınla
                    </button>
                  )}
                  {d.status === "published" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => act(d.id, "candidate")}
                      className="min-h-[44px] cursor-pointer rounded-pill border-2 border-solid border-line bg-white px-4 font-display text-[15px] font-semibold text-ink disabled:opacity-60"
                    >
                      Adaya al
                    </button>
                  )}
                  {d.status !== "rejected" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => act(d.id, "rejected")}
                      className="min-h-[44px] cursor-pointer rounded-pill border-0 bg-coral-soft px-4 font-display text-[15px] font-semibold text-ink disabled:opacity-60"
                    >
                      Reddet
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
