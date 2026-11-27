"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { liveWidgetSrc } from "@/config/affiliate";
import { aviasalesRoute } from "@/lib/outbound";
import type { MultiQuery } from "@/lib/search";

const SCRIPT_ID = "tpwl-main";

/**
 * Canlı sonuçlar (Travelpayouts White Label, Widget türü): Aviasales'in canlı aramasını sonuç sayfasının içinde gösterir.
 * Önbellekte kayıt az ya da yokken kullanılır. Arama, adresteki `flightSearch` parametresiyle başlar
 * (White Label'ın kendi biçimi, ör. AMS2712ADB1); betik sayfaya bir kez eklenir.
 */
export function LiveWidget({ q }: { q: MultiQuery }) {
  const t = useTranslations("results");
  const src = liveWidgetSrc();
  const box = useRef<HTMLDivElement>(null);
  const route = aviasalesRoute({
    from: q.from[0],
    to: q.to[0],
    date: q.date,
    returnDate: q.returnDate || undefined,
    adults: q.pax.adults,
    children: q.pax.children,
    infants: q.pax.infants,
    cabin: q.cabin ?? "economy",
  });

  useEffect(() => {
    if (!src) return;
    // Widget aramayı adresten okur: sayfa yeniden yüklenmeden parametre eklenir
    const u = new URL(window.location.href);
    if (u.searchParams.get("flightSearch") !== route) {
      u.searchParams.set("flightSearch", route);
      window.history.replaceState(window.history.state, "", u);
    }
    // Widget bir ES modülü: aynı sayfada ikinci kez çalışmaz ve aramayı yalnızca açılışta okur. Sayfa içi geçişle
    // (tarih şeridi, arama kutusu) başka bir aramaya gelindiyse sayfa yeniden yüklenir; widget yeni aramayla başlar.
    // Aynı arama tekrar açılsa da sonuç alanı yeni bir öğedir; widget onu doldurmaz. Aynı öğe için (React'in
    // geliştirme modundaki çift çalıştırması) yeniden yükleme yapılmaz.
    const w = window as typeof window & { __tpwlBox?: HTMLElement | null };
    if (document.getElementById(SCRIPT_ID)) {
      if (w.__tpwlBox !== box.current) window.location.reload();
      return;
    }
    w.__tpwlBox = box.current;
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.async = true;
    s.type = "module";
    s.src = src;
    document.head.appendChild(s);
  }, [src, route]);

  if (!src || q.from.length !== 1 || q.to.length !== 1) return null;
  return (
    <section aria-labelledby="live-title" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 id="live-title" className="m-0 font-display text-[24px] font-bold">{t("liveTitle")}</h2>
        <p className="m-0 text-[15px] font-semibold text-muted">{t("liveText")}</p>
      </div>
      {/* Widget arama formunu ve sonuçlarını bu alanlara yerleştirir */}
      <div ref={box} className="min-h-[120px] overflow-hidden rounded-[28px] border-2 border-solid border-line bg-white p-2 md:p-4">
        <div id="tpwl-search" className="hidden" aria-hidden="true" />
        <div id="tpwl-tickets" />
      </div>
    </section>
  );
}
