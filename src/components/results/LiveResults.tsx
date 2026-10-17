"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DateStrip } from "./DateStrip";
import { ResultsView, type ResultsTip } from "./ResultsView";
import type { Offer } from "@/lib/providers/types";
import type { MultiQuery, searchHref } from "@/lib/search";

export type LiveChunk = {
  offers: Offer[];
  cityNames: Record<string, string>;
  /** Son halka: tüm havayolları yanıt verdi, liste kesinleşti. */
  done: boolean;
  /** Seçilen günün en ucuz kişi başı fiyatı (esnek aramada liste başka günleri de içerir) */
  dayPrice?: number | null;
  next?: Promise<LiveChunk>;
};

/**
 * Sunucudan halka halka gelen sonuçları gösterir. Liste kesinleşene kadar "En ucuz / En hızlı" rozetleri ve
 * tarih şeridi gösterilmez: yarım listeye göre verilen bir "en ucuz" bilgisi yanlış olabilir.
 */
export function LiveResults({
  first,
  q,
  oneWay,
  tip,
  note,
  retryHref,
  initialBags,
}: {
  /** Arama kutusunda seçilen bagaj: bagaj filtresinin başlangıcı */
  initialBags?: { cabin: number; checked: number };
  first: LiveChunk;
  q: MultiQuery;
  oneWay: boolean;
  tip: ResultsTip;
  note?: string;
  retryHref: ReturnType<typeof searchHref>;
}) {
  const t = useTranslations("results");
  const [chunk, setChunk] = useState(first);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setChunk(first);
    setFailed(false);
    (async () => {
      let next = first.next;
      while (next) {
        const c = await next;
        if (!alive) return;
        setChunk(c);
        next = c.next;
      }
    })().catch((e) => {
      console.error(e);
      if (alive) setFailed(true);
    });
    return () => {
      alive = false;
    };
  }, [first]);

  const cheapest = chunk.dayPrice !== undefined ? chunk.dayPrice : (chunk.offers.length ? Math.min(...chunk.offers.map((o) => o.price)) : null);
  return (
    <>
      {chunk.done && <DateStrip q={q} current={cheapest} />}
      {!chunk.done && !failed && (
        <p role="status" className="m-0 flex items-center gap-3 rounded-[20px] bg-sky px-5 py-3 font-bold">
          <span aria-hidden="true" className="h-4 w-4 flex-none animate-spin rounded-full border-[3px] border-solid border-primary border-t-transparent" />
          {t("live.searching")}
        </p>
      )}
      {failed && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-[20px] bg-coral-soft px-5 py-3 font-bold">
          {t("live.incomplete")}
          <Link href={retryHref} className="font-extrabold">{t("failed.retry")}</Link>
        </div>
      )}
      <ResultsView
        offers={chunk.offers}
        oneWay={oneWay}
        tip={chunk.done ? tip : null}
        note={note}
        cityNames={chunk.cityNames}
        settled={chunk.done}
        initialBags={initialBags}
      />
    </>
  );
}
