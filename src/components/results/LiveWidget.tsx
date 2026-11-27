"use client";

import { useEffect, useRef } from "react";
import { preconnect, preloadModule } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { readInitial as readInitialCurrency, useCurrency } from "../CurrencyProvider";
import { useRouter } from "@/i18n/navigation";
import { liveWidgetSrc } from "@/config/affiliate";
import { readWidgetBags, saveWidgetBags } from "@/lib/live-widget-bags";
import { cleanWidgetUrl, widgetSyncQuery } from "@/lib/live-widget-url";
import { aviasalesRoute, parseAviasalesRoute } from "@/lib/outbound";
import type { MultiQuery } from "@/lib/search";

const SCRIPT_ID = "tpwl-main";
const STYLE_ID = "pirpir-tpwl";

type W = typeof window & {
  __tpwlBox?: HTMLElement | null;
  __tpwlRoute?: string;
  __tpwlLang?: string;
  __tpwlCur?: string;
  TPWL_CONFIGURATION?: Record<string, unknown>;
};

/** Widget'ın desteklediği diller ve para birimleri (Travelpayouts panelindeki White Label ayarı) */
const WIDGET_LANGS = ["tr", "en", "nl", "de"];
const WIDGET_CURRENCIES = ["EUR", "TRY", "USD"];
const widgetLangFor = (l: string) => (WIDGET_LANGS.includes(l) ? l : "en").toUpperCase();
const widgetCurFor = (c: string) => (WIDGET_CURRENCIES.includes(c) ? c : "EUR");

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
    const cards = [...root.querySelectorAll<HTMLElement>(CARD)];
    if (!cards.length) return;
    // Kartlar birden çok kapsayıcıda (ör. öne çıkan kart + ana liste) olabilir; her kapsayıcıyı kendi içinde sırala
    const byParent = new Map<HTMLElement, HTMLElement[]>();
    for (const c of cards) {
      const p = c.parentElement;
      if (!p) continue;
      const list = byParent.get(p);
      if (list) list.push(c);
      else byParent.set(p, [c]);
    }
    for (const [parent, group] of byParent) {
      if (group.length < 2) continue;
      if (getComputedStyle(parent).display !== "flex") {
        parent.style.display = "flex";
        parent.style.flexDirection = "column";
      }
      for (const c of group) c.style.order = String(priceOf(c));
      // Kart dışındaki öğeler (ör. "Daha fazla uçuş göster") en sonda kalsın
      for (const el of [...parent.children]) {
        if (!el.matches(CARD)) (el as HTMLElement).style.order = "2000000000";
      }
    }
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
    observer.observe(root, { childList: true, subtree: true, characterData: true });
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

const isVisible = (el: Element | null): el is HTMLElement => {
  if (!(el instanceof HTMLElement)) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
};

/**
 * Widget'taki "Bagaj dahil" filtre çipini bulur:
 * - Masaüstünde "Popüler filtreler" içindeki `[data-testid="baggage-included-filter"]`
 * - Telefonda (masaüstü yan paneli gizliyken) mobil filtre çubuğunun ilk çipi (her dilde bagaj dahil)
 */
function findBaggageChip(root: ShadowRoot): HTMLElement | null {
  const desktop = root.querySelector<HTMLElement>('[data-testid="baggage-included-filter"]');
  if (isVisible(desktop)) return desktop;
  const mobile = root.querySelector<HTMLElement>(
    '[class*="FlightFiltersMobileMenu-module__list"] [class*="ClearableParameter-module__root"]',
  );
  if (isVisible(mobile)) return mobile;
  return desktop;
}

const isBaggageActive = (el: HTMLElement) => /valueChanged/.test(el.className);

/**
 * Arama kutusunda kontrol edilen bagaj seçildiyse (veya `sessionStorage`'da bu rota için kayıtlıysa)
 * widget'ın "Bagaj dahil" filtresini açar ve `valueChanged` sınıfıyla etkinleştiğini doğrular.
 * Kullanıcı çipi kendisi kapatırsa `sessionStorage` güncellenir ve bir daha zorla açılmaz.
 */
function applyBaggageFilter(host: HTMLElement | null, route: string, wantOn: boolean): () => void {
  if (!host) return () => {};
  let tries = 0;
  let clicks = 0;
  let userTouched = false;
  let attachedRoot: ShadowRoot | null = null;

  const onUserClick = (e: Event) => {
    if (!e.isTrusted) return;
    const path = e.composedPath() as Element[];
    const hit = path.some(
      (n) =>
        n instanceof HTMLElement &&
        (n.getAttribute("data-testid") === "baggage-included-filter" ||
          (n.matches('[class*="ClearableParameter-module__root"]') &&
            !!n.closest('[class*="FlightFiltersMobileMenu-module__list"]') &&
            n === n.closest('[class*="FlightFiltersMobileMenu-module__list"]')?.querySelector('[class*="ClearableParameter-module__root"]'))),
    );
    if (!hit) return;
    userTouched = true;
    // Tıklamadan sonraki durumu kaydet (kullanıcı kapattıysa yenilemede tekrar açılmasın)
    window.setTimeout(() => {
      const chip = attachedRoot ? findBaggageChip(attachedRoot) : null;
      if (!chip) return;
      const active = isBaggageActive(chip);
      const prev = readWidgetBags(route);
      saveWidgetBags(route, { cabin: prev?.cabin ?? 0, checked: active ? Math.max(1, prev?.checked ?? 1) : 0 });
    }, 50);
  };

  const attachListener = (root: ShadowRoot) => {
    if (attachedRoot === root) return;
    attachedRoot = root;
    root.addEventListener("click", onUserClick, true);
  };

  const timer = window.setInterval(() => {
    const root = host.shadowRoot;
    if (!root) {
      if (++tries > 240) window.clearInterval(timer);
      return;
    }
    attachListener(root);
    if (userTouched) {
      window.clearInterval(timer);
      return;
    }
    const chip = findBaggageChip(root);
    if (chip && root.querySelector(CARD)) {
      const active = isBaggageActive(chip);
      if (wantOn) {
        if (active) {
          window.clearInterval(timer);
          return;
        }
        if (clicks < 8 && tries % 2 === 0) {
          chip.click();
          clicks++;
        }
      } else {
        // Kullanıcı üst çubuktan bagajı 0'a çektiyse ve çip açıksa kapat
        if (!active) {
          window.clearInterval(timer);
          return;
        }
        if (clicks < 4) {
          chip.click();
          clicks++;
        }
      }
    }
    if (++tries > 240) window.clearInterval(timer); // ~60 sn
  }, 250);

  return () => {
    window.clearInterval(timer);
    attachedRoot?.removeEventListener("click", onUserClick, true);
  };
}

/**
 * Canlı uçuşlar (Travelpayouts White Label, Widget türü): sonuç sayfasının ana listesi.
 * Arama adresteki `flightSearch` koduyla başlar (ör. AMS2712ADB1). Tarih widget'ın kendi canlı şeridinden seçilir;
 * widget başka güne geçince sayfanın adresi ve arama kutusu da o güne güncellenir (widget yeniden yüklenmez).
 * Arama kutusundan başka bir aramaya geçilince sayfa yeniden yüklenir (widget aramayı yalnızca açılışta okur).
 */
export function LiveWidget({ q, widgetId }: { q: MultiQuery; widgetId?: string | null }) {
  const t = useTranslations("results");
  const router = useRouter();
  const locale = useLocale();
  const { cur } = useCurrency();
  const src = liveWidgetSrc(widgetId);
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
    const w = window as W;
    const sp = new URLSearchParams(window.location.search);
    // Açık arama adresi (`?from=...`) geldiyse bagaj seçimi `sessionStorage`'a yazılır (yenilemede korunsun)
    if (sp.has("from")) saveWidgetBags(route, q.bags ?? null);
    const clean = cleanWidgetUrl(window.location.href, route);
    if (document.getElementById(SCRIPT_ID)) {
      // Widget zaten bu aramayı gösteriyor (kendi şeridinden geçildi) → bir şey yapma; başka arama ya da yeni öğe → temiz adresle yükle
      if (w.__tpwlBox !== box.current || w.__tpwlRoute !== route) window.location.replace(clean);
      return;
    }
    // Widget `adults`/`children`/`infants` ile `flightSearch`'ü bir arada görünce yerel gece yarısına `.toISOString()`
    // uygulayıp UTC+ saat dilimlerinde tarihi 1 gün geri kaydırıyor; betik yüklenmeden adres yalnızca `flightSearch`'e indirgenir
    if (window.location.href !== clean) {
      window.history.replaceState(window.history.state, "", clean);
    }
    w.__tpwlBox = box.current;
    w.__tpwlRoute = route;
    const initialLang = widgetLangFor(locale);
    const initialCur = widgetCurFor(readInitialCurrency() ?? cur);
    w.__tpwlLang = initialLang;
    w.__tpwlCur = initialCur;
    // Dil ve para birimi sitenin seçimini izler (widget'ın desteklemediğinde İngilizce / EUR)
    w.TPWL_CONFIGURATION = {
      ...(w.TPWL_CONFIGURATION ?? {}),
      defaultLanguage: initialLang,
      // Sağlayıcının ilk değeri henüz yerine oturmamış olabilir (bu etki ondan önce çalışır): kaynağından okunur
      defaultCurrency: initialCur,
    };
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.async = true;
    s.type = "module";
    s.src = src;
    document.head.appendChild(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, route]);

  // Dil veya para birimi sonradan değişirse widget yalnızca açılışta okuduğu için temiz adresle yeniden yüklenir
  useEffect(() => {
    if (!src || !document.getElementById(SCRIPT_ID)) return;
    const w = window as W;
    const nextLang = widgetLangFor(locale);
    const stored = readInitialCurrency();
    const nextCur = widgetCurFor(stored ?? cur);
    if ((w.__tpwlLang && nextLang !== w.__tpwlLang) || (w.__tpwlCur && stored && nextCur !== w.__tpwlCur)) {
      window.location.replace(cleanWidgetUrl(window.location.href, route));
    }
  }, [src, locale, cur, route]);

  // Widget kendi şeridinden (ya da kendi formundan) başka aramaya geçince `urlchange` olayı yayınlar: sayfanın adresi
  // ve arama kutusu o aramaya eşitlenir, widget yerinde kalır. `adults` vb. parametreler geri eklenmez (yenilemede tarih kaymasın).
  useEffect(() => {
    if (!src) return;
    const onChange = () => {
      const w = window as W;
      const code = new URLSearchParams(window.location.search).get("flightSearch");
      const p = code ? parseAviasalesRoute(code) : null;
      if (!code || !p) return;
      const next = aviasalesRoute(p);
      if (next === w.__tpwlRoute) return;
      const prevBags = w.__tpwlRoute ? readWidgetBags(w.__tpwlRoute) : null;
      if (prevBags) saveWidgetBags(next, prevBags);
      w.__tpwlRoute = next;
      router.replace({ pathname: "/ara", query: widgetSyncQuery(code, window.location.search) }, { scroll: false });
    };
    window.addEventListener("urlchange", onChange);
    return () => window.removeEventListener("urlchange", onChange);
  }, [src, router]);

  // Kart görünümü ve en ucuzdan sıralama: widget'ın gölge DOM'u
  useEffect(() => enhanceShadow(document.getElementById("tpwl-tickets")), []);

  // Bagaj seçimi widget'ın "Bagaj dahil" filtresine aktarılır (URL'den veya yenilemede `sessionStorage`'dan)
  const checked = q.bags?.checked ?? 0;
  useEffect(() => {
    if (!src) return;
    const wantOn = checked > 0 || (readWidgetBags(route)?.checked ?? 0) > 0;
    return applyBaggageFilter(document.getElementById("tpwl-tickets"), route, wantOn);
  }, [src, checked, route]);

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
