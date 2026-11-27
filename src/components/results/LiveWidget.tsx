"use client";

import { useEffect, useRef } from "react";
import { preconnect, preloadModule } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { readInitial as readInitialCurrency, useCurrency } from "../CurrencyProvider";
import { useRouter } from "@/i18n/navigation";
import { liveWidgetSrc } from "@/config/affiliate";
import { aviasalesRoute, parseAviasalesRoute } from "@/lib/outbound";
import { searchHref, type MultiQuery } from "@/lib/search";

const SCRIPT_ID = "tpwl-main";
const STYLE_ID = "pirpir-tpwl";

type W = typeof window & { __tpwlBox?: HTMLElement | null; __tpwlRoute?: string; TPWL_CONFIGURATION?: Record<string, unknown> };

/** Widget'ın desteklediği diller ve para birimleri (Travelpayouts panelindeki White Label ayarı) */
const WIDGET_LANGS = ["tr", "en", "nl", "de"];
const WIDGET_CURRENCIES = ["EUR", "TRY", "USD"];

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
/* "Direkt uçuşlar" kutusu (havayolu başına tarih/saat listesi) gizlenir: kullanıcı istemedi, liste zaten kartlarda */
[class*="DirectFlights-module__root___"], [class*="DirectFlightsItem-module__"] { display: none !important; }
[class*="FlightMatrix"] { border-radius: 24px !important; font-family: var(--font-fredoka), var(--font-baloo), sans-serif !important; }
[class*="SearchProgressbar-module__progressInner___"] { background: #2f5bd3 !important; }
[class*="Toggle-module__root___"] input:checked + span { background: #2f5bd3 !important; }
`;

const CARD = '[data-role="flight-card"]';
const priceOf = (card: Element) => Number((card.querySelector('[data-testid^="flight-card-price"]')?.textContent ?? "").replace(/[^\d]/g, "")) || 1e9;

/**
 * Gölge köke stil ekler ve kartları en ucuzdan pahalıya dizer (yalnızca görsel sıra, CSS `order`). Kullanıcı widget'ın
 * kendi sıralama menüsünden bir seçenek seçerse (Radiolist) bizim sıralamamız kaldırılır, onunki geçerli olur.
 */
function enhanceShadow(host: HTMLElement | null): () => void {
  if (!host) return () => {};
  let observer: MutationObserver | null = null;
  let userSorted = false;
  const sortCards = (root: ShadowRoot) => {
    if (userSorted) return;
    const cards = [...root.querySelectorAll(CARD)];
    const parent = cards[0]?.parentElement;
    if (!parent) return;
    if (getComputedStyle(parent).display !== "flex") {
      parent.style.display = "flex";
      parent.style.flexDirection = "column";
    }
    for (const c of cards) if (c.parentElement === parent) (c as HTMLElement).style.order = String(priceOf(c));
    // Kart dışındaki öğeler (ör. "Daha fazla uçuş göster") en sonda kalsın
    for (const el of [...parent.children]) if (!el.matches(CARD)) (el as HTMLElement).style.order = "2000000000";
  };
  const attach = () => {
    const root = host.shadowRoot;
    if (!root || observer) return;
    if (!root.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = SHADOW_CSS;
      root.appendChild(style);
    }
    root.addEventListener(
      "click",
      (e) => {
        const path = e.composedPath() as Element[];
        if (path.some((n) => n instanceof Element && /Radiolist-module/.test(n.className?.toString?.() ?? ""))) {
          userSorted = true;
          root.querySelectorAll<HTMLElement>(CARD).forEach((c) => (c.style.order = ""));
        }
      },
      true,
    );
    let raf = 0;
    observer = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => sortCards(root));
    });
    observer.observe(root, { childList: true, subtree: true });
    sortCards(root);
  };
  attach();
  // Gölge kök betik yüklenince açılır: kısa aralıkla bakılır (en fazla ~30 sn)
  let tries = 0;
  const timer = window.setInterval(() => {
    attach();
    if (observer || ++tries > 120) window.clearInterval(timer);
  }, 250);
  return () => {
    window.clearInterval(timer);
    observer?.disconnect();
  };
}

/**
 * Arama kutusunda bagaj seçildiyse widget'ın kendi "Bagaj dahil" filtresi açılır (widget bunu adresten okumaz).
 * Çip ilk sonuçlarla belirir; bir kez tıklanır. Kullanıcı sonra widget'ta kaldırabilir.
 */
function applyBaggageFilter(host: HTMLElement | null): () => void {
  if (!host) return () => {};
  let tries = 0;
  const timer = window.setInterval(() => {
    const root = host.shadowRoot;
    const chip = root?.querySelector<HTMLElement>('[data-testid="baggage-included-filter"]');
    if (chip && root?.querySelector(CARD)) {
      chip.click();
      window.clearInterval(timer);
    } else if (++tries > 240) window.clearInterval(timer); // ~60 sn
  }, 250);
  return () => window.clearInterval(timer);
}

/**
 * Canlı uçuşlar (Travelpayouts White Label, Widget türü): sonuç sayfasının ana listesi.
 * Arama adresteki `flightSearch` koduyla başlar (ör. AMS2712ADB1). Tarih widget'ın kendi canlı şeridinden seçilir;
 * widget başka güne geçince sayfanın adresi ve arama kutusu da o güne güncellenir (widget yeniden yüklenmez).
 * Arama kutusundan başka bir aramaya geçilince sayfa yeniden yüklenir (widget aramayı yalnızca açılışta okur).
 */
export function LiveWidget({ q }: { q: MultiQuery }) {
  const t = useTranslations("results");
  const router = useRouter();
  const locale = useLocale();
  const { cur } = useCurrency();
  const src = liveWidgetSrc();
  const box = useRef<HTMLDivElement>(null);
  // Widget adresi kendi biçimine çevirince bagaj bilgisi düşer; eşitlemede korunur
  const bagsRef = useRef(q.bags);
  bagsRef.current = q.bags;
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
    const w = window as W;
    if (document.getElementById(SCRIPT_ID)) {
      // Widget zaten bu aramayı gösteriyor (kendi şeridinden geçildi) → bir şey yapma; başka arama ya da yeni öğe → yükle
      if (w.__tpwlBox !== box.current || w.__tpwlRoute !== route) window.location.reload();
      return;
    }
    // Widget aramayı adresten okur: sayfa yeniden yüklenmeden parametre eklenir
    const u = new URL(window.location.href);
    if (u.searchParams.get("flightSearch") !== route) {
      u.searchParams.set("flightSearch", route);
      window.history.replaceState(window.history.state, "", u);
    }
    w.__tpwlBox = box.current;
    w.__tpwlRoute = route;
    // Dil ve para birimi sitenin seçimini izler (widget'ın desteklemediğinde İngilizce / EUR)
    w.TPWL_CONFIGURATION = {
      ...(w.TPWL_CONFIGURATION ?? {}),
      defaultLanguage: (WIDGET_LANGS.includes(locale) ? locale : "en").toUpperCase(),
      // Sağlayıcının ilk değeri henüz yerine oturmamış olabilir (bu etki ondan önce çalışır): kaynağından okunur
      defaultCurrency: ((c) => (WIDGET_CURRENCIES.includes(c) ? c : "EUR"))(readInitialCurrency() ?? cur),
    };
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.async = true;
    s.type = "module";
    s.src = src;
    document.head.appendChild(s);
    // Dil/para birimi yalnızca açılışta okunur; değişince yeni arama gibi sayfa yeniden yüklenir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, route]);

  // Widget kendi şeridinden (ya da kendi formundan) başka aramaya geçince `urlchange` olayı yayınlar: sayfanın adresi
  // ve arama kutusu o aramaya eşitlenir, widget yerinde kalır. (Açılıştaki adres düzeltmesi bu olayı yayınlamaz.)
  useEffect(() => {
    if (!src) return;
    const onChange = () => {
      const w = window as W;
      const code = new URLSearchParams(window.location.search).get("flightSearch");
      const p = code ? parseAviasalesRoute(code) : null;
      if (!code || !p) return;
      const next = aviasalesRoute(p);
      if (next === w.__tpwlRoute) return;
      w.__tpwlRoute = next;
      const href = searchHref({ from: p.from, to: p.to, date: p.date, returnDate: p.returnDate ?? "", pax: { adults: p.adults, children: p.children, infants: p.infants }, cabin: p.cabin, bags: bagsRef.current });
      router.replace({ pathname: "/ara", query: { ...href.query, flightSearch: code } }, { scroll: false });
    };
    window.addEventListener("urlchange", onChange);
    return () => window.removeEventListener("urlchange", onChange);
  }, [src, router]);

  // Kart görünümü ve en ucuzdan sıralama: widget'ın gölge DOM'u
  useEffect(() => enhanceShadow(document.getElementById("tpwl-tickets")), []);

  // Bagaj seçimi widget'ın "Bagaj dahil" filtresine aktarılır (yeni aramada ve bagaj değişince)
  const checked = q.bags?.checked ?? 0;
  useEffect(() => (checked > 0 ? applyBaggageFilter(document.getElementById("tpwl-tickets")) : undefined), [checked, route]);

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
