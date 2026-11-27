"use client";

import { useEffect, useRef } from "react";
import { preconnect, preloadModule } from "react-dom";
import { useTranslations } from "next-intl";
import { liveWidgetSrc } from "@/config/affiliate";
import { aviasalesRoute } from "@/lib/outbound";
import type { MultiQuery } from "@/lib/search";

const SCRIPT_ID = "tpwl-main";
const STYLE_ID = "pirpir-tpwl";

/**
 * Widget kartlarını gölge DOM'a (shadow root) çizer: sayfanın CSS'i içeri girmez, yalnızca değişkenler (globals.css)
 * geçer. Kart, rozet, düğme ve fiyat görünümü bu stil gölge köke eklenerek pirpir tasarımına uydurulur.
 * Sınıf adları "Bileşen-module__ad___karma" biçiminde; yalnızca kararlı ön ek hedeflenir.
 */
const SHADOW_CSS = `
[class*="FlightCard-module__card___"] { border: 2px solid #e3e8f2 !important; border-radius: 28px !important; box-shadow: none !important; }
[class*="FlightCard-module__cardBadges___"] { background: #ffd166 !important; color: #1e2a44 !important; font-family: var(--font-fredoka), var(--font-baloo), sans-serif !important; font-weight: 600 !important; padding: 0.15rem 0.75rem !important; }
[class*="FlightCard-module__cardLeftPrice___"] { font-family: var(--font-fredoka), var(--font-baloo), sans-serif !important; font-weight: 700 !important; font-size: 1.875rem !important; color: #1e2a44 !important; }
[class*="Flight-module__cardFlightTime___"] { font-family: var(--font-fredoka), var(--font-baloo), sans-serif !important; font-weight: 600 !important; }
[class*="Button-module__root___"] { border-radius: 999px !important; font-family: var(--font-fredoka), var(--font-baloo), sans-serif !important; font-weight: 600 !important; }
[class*="Button-module__primary___"] { background: #2f5bd3 !important; color: #fff !important; }
[class*="Button-module__primary___"]:hover { background: #1e3f9e !important; }
[class*="TicketsWidget-module__moreTickets___"] { border-radius: 999px !important; border: 2px solid #e3e8f2 !important; background: #fff !important; color: #1e2a44 !important; font-family: var(--font-fredoka), var(--font-baloo), sans-serif !important; font-weight: 600 !important; min-height: 48px; }
[class*="ClearableParameter-module__root___"] { border-radius: 999px !important; font-weight: 700 !important; }
[class*="FlightFiltersContent-module__root___"] { background: #f5f8fd !important; border: 0 !important; border-radius: 28px !important; }
[class*="SearchProgressbar-module__progressInner___"] { background: #2f5bd3 !important; }
[class*="Toggle-module__root___"] input:checked + span { background: #2f5bd3 !important; }
`;

/** Gölge köke stil ekler; widget kökü yeniden kurarsa tekrar ekler */
function styleShadow(host: HTMLElement | null): () => void {
  if (!host) return () => {};
  const apply = () => {
    const root = host.shadowRoot;
    if (!root || root.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = SHADOW_CSS;
    root.appendChild(style);
  };
  apply();
  // Gölge kök betik yüklenince açılır: kısa aralıkla bakılır (en fazla ~30 sn), sonra içerik değiştikçe
  let tries = 0;
  const timer = window.setInterval(() => {
    apply();
    if (++tries > 120) window.clearInterval(timer);
  }, 250);
  return () => window.clearInterval(timer);
}

/**
 * Canlı sonuçlar (Travelpayouts White Label, Widget türü): Aviasales'in canlı aramasını sonuç sayfasının içinde gösterir.
 * Ortaklık modunda sonuç sayfasının ana listesidir. Arama, adresteki `flightSearch` parametresiyle başlar
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

  // Kart görünümü: widget'ın gölge DOM'una pirpir stili
  useEffect(() => styleShadow(document.getElementById("tpwl-tickets")), []);

  if (!src || q.from.length !== 1 || q.to.length !== 1) return null;
  // Hız: betik sayfa açılır açılmaz indirilir (çalıştırılmaz) ve sunucularına bağlantı önceden kurulur
  preloadModule(src, { as: "script" });
  for (const host of ["https://tpwgt.com", "https://img.avs.io"]) preconnect(host, { crossOrigin: "anonymous" });
  return (
    <section aria-labelledby="live-title" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 id="live-title" className="m-0 font-display text-[24px] font-bold">{t("liveTitle")}</h2>
        <p className="m-0 text-[15px] font-semibold text-muted">{t("liveText")}</p>
      </div>
      {/* Widget arama formunu ve sonuçlarını bu alanlara yerleştirir */}
      <div ref={box} className="min-h-[480px]">
        <div id="tpwl-search" className="hidden" aria-hidden="true" />
        <div id="tpwl-tickets" />
      </div>
    </section>
  );
}
