"use client";

import { useEffect, useRef, useState } from "react";
import { preconnect, preloadModule } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { readInitial as readInitialCurrency, useCurrency } from "../CurrencyProvider";
import { Pirpir } from "../characters";
import { useRouter } from "@/i18n/navigation";
import { liveWidgetSrc } from "@/config/affiliate";
import { readWidgetBags, saveWidgetBags } from "@/lib/live-widget-bags";
import { computeTabSummaries, readCardMetrics, type WidgetTabSummaries } from "@/lib/live-widget-summary";
import { cleanWidgetUrl, syncWidgetCookies, widgetSyncQuery } from "@/lib/live-widget-url";
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
 * Widget kartlarını ve sol filtre sütununu açık gölge DOM'a (shadow root) çizer.
 * 10. tur düzeni: masaüstünde (>= 1024 px) Kiwi yerleşiminden ilham alan iki sütun (solda 260 px yapışkan filtreler,
 * sağda iki bölmeli pirpir kartları — sol uçuşlar, sağ fiyat+Seç); telefonda (< 1024 px) tek sütun + mobil filtre modalı.
 * Yalnızca kararlı sınıf ön ekleri (`-module__ad___`) hedeflenir.
 */
const SHADOW_CSS = `
*, *::before, *::after { box-sizing: border-box; }
:host { display: block; width: 100%; max-width: 100%; color: #1e2a44; font-family: var(--font-nunito), system-ui, sans-serif; }
button:focus-visible, a:focus-visible, input:focus-visible { outline: 3px solid #2f5bd3 !important; outline-offset: 2px !important; }

/* Varsayılan (mobil / tablet < 1024 px): tek sütun, sol filtre gizli (display:none) */
[class*="TicketsWidget-module__root___"] {
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
}
[class*="TicketsWidget-module__wrapper___"] {
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  gap: 16px !important;
}
[class*="FlightFilters-module__filerContainer___"] { display: none !important; }
:host([data-filters="open"]) [class*="FlightFilters-module__filerContainer___"] {
  display: block !important;
  width: 100% !important;
  margin: 0 0 20px 0 !important;
}

/* 10.3 Masaüstü (>= 1024 px): 1120 px içinde 260 px yapışkan sol filtre + sağda sonuç kartları */
@media (min-width: 1024px) {
  [class*="TicketsWidget-module__root___"] {
    display: grid !important;
    grid-template-columns: 260px minmax(0, 1fr) !important;
    gap: 0 24px !important;
    align-items: start !important;
  }
  [class*="FlightFilters-module__filerContainer___"] {
    display: block !important;
    grid-column: 1 !important;
    grid-row: 1 / span 12 !important;
    position: sticky !important;
    top: 16px !important;
    max-height: calc(100vh - 32px) !important;
    overflow-y: auto !important;
    width: 260px !important;
    margin: 0 !important;
    padding: 0 !important;
    scrollbar-width: thin;
  }
  [class*="TicketsWidget-module__progressBar___"],
  [class*="TicketsWidget-module__wrapper___"],
  [class*="FlightMatrixDesktop-module__root___"] {
    grid-column: 2 !important;
  }
}

/* Sol filtre sütunu stili: beyaz zemin, #E3E8F2 ince çizgiler, Fredoka 600 17px başlık, Nunito 15px seçenekler */
[class*="FlightFiltersContent-module__root___"],
[class*="FlightFilters-module__contentDesktop___"] {
  display: flex !important;
  flex-direction: column !important;
  gap: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  padding: 8px 18px 14px !important;
  background: #ffffff !important;
  border: 2px solid #e3e8f2 !important;
  border-radius: 24px !important;
  box-shadow: none !important;
}
[class*="FlightFiltersContent-module__root___"] > * {
  border-bottom: 1px solid #e3e8f2 !important;
  padding: 10px 0 !important;
  margin: 0 !important;
}
[class*="FlightFiltersContent-module__root___"] > *:last-child {
  border-bottom: 0 !important;
}
[class*="FlightFiltersContent-module__filterHeader___"],
[class*="Expandable-module__header___"] {
  font-family: var(--font-fredoka), var(--font-baloo), sans-serif !important;
  font-weight: 600 !important;
  font-size: 17px !important;
  color: #1e2a44 !important;
  min-height: 44px !important;
  align-items: center !important;
}
[class*="Checklist-module__option___"],
[class*="Radiolist-module__option___"],
[class*="Convenience-module__toggle___"],
[class*="Layovers-module__label___"] {
  font-family: var(--font-nunito), system-ui, sans-serif !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  color: #1e2a44 !important;
  min-height: 44px !important;
  align-items: center !important;
}
[class*="FlightFiltersContent-module__root___"] input[type="checkbox"],
[class*="FlightFiltersContent-module__root___"] input[type="radio"] {
  accent-color: #2f5bd3 !important;
}
[class*="Toggle-module__root___"] input:checked + span { background: #2f5bd3 !important; }
[class*="SelectAllBtn-module__root___"],
[class*="Convenience-module__toggleAll___"] {
  color: #2f5bd3 !important;
  font-weight: 800 !important;
  font-size: 13px !important;
}

/* 10.2 Boş tarih şeridi (fiyat yerine "-" veya ikon varsa) tamamen gizlenir; fiyat gelince görünür */
[class*="FlightMatrixDesktop-module__root___"][data-pirpir-empty="1"],
[class*="FlightMatrixMobile-module__flightMatrixMobile___"][data-pirpir-empty="1"] {
  display: none !important;
}
[class*="FlightMatrixDesktop-module__root___"],
[class*="FlightMatrixMobile-module__flightMatrixMobile___"] {
  border: 2px solid #e3e8f2 !important;
  border-radius: 24px !important;
  background: #ffffff !important;
  box-shadow: none !important;
  margin-bottom: 16px !important;
}
[class*="FlightMatrixDesktop-module__dateCellCurrent___"] {
  background: #eaf3ff !important;
  color: #1e2a44 !important;
  border-radius: 16px !important;
}

/* Gürültü öğeleri tamamen gizlenir (display:none; opacity:0 kullanılmaz) */
[class*="FlightFiltersMobileMenu-module__root___"],
[class*="FlightCard-module__share___"],
[class*="FlightCard-module__cardTopRight___"],
[class*="DirectFlights-module__root___"],
[class*="DirectFlightsItem-module__"] { display: none !important; }

/* Yükleme çubuğu: pirpir renkleri, 999px köşe */
[class*="SearchProgressbar-module__searchProgressbar___"] {
  border: 2px solid #e3e8f2 !important;
  border-radius: 999px !important;
  background: #f5f8fd !important;
  color: #1e2a44 !important;
  font-weight: 700 !important;
  box-shadow: none !important;
  overflow: hidden !important;
  margin: 0 0 16px 0 !important;
}
[class*="SearchProgressbar-module__searchProgressbarWrap___"] {
  background: #e3e8f2 !important;
  border-radius: 999px !important;
}
[class*="SearchProgressbar-module__progressInner___"] {
  background: #2f5bd3 !important;
  border-radius: 999px !important;
}

/* 9.1 & 10.3 Uçuş kartı: beyaz zemin, 2px #E3E8F2, 28px köşe, gölge yok */
[class*="FlightCard-module__card___"] {
  background: #ffffff !important;
  border: 2px solid #e3e8f2 !important;
  border-radius: 28px !important;
  padding: 20px 24px !important;
  box-shadow: none !important;
  width: 100% !important;
  max-width: 100% !important;
  margin-bottom: 16px !important;
}
[class*="FlightCard-module__card___"]:hover {
  border-color: #c8d6ef !important;
  box-shadow: none !important;
}
[class*="FlightCard-module__cardBlockFlight___"] {
  border-color: #e3e8f2 !important;
  background: transparent !important;
}

/* 10.3 Kiwi'den ilham: masaüstünde solda uçuş satırları (cardRight), sağda dikey çizgiyle ayrılmış fiyat+Seç (cardLeft) */
@media (min-width: 641px) {
  [class*="FlightCard-module__card___"] {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) 232px !important;
    align-items: stretch !important;
    gap: 0 24px !important;
  }
  [class*="FlightCard-module__cardRight___"] {
    grid-column: 1 !important;
    grid-row: 1 !important;
    background: transparent !important;
    padding: 0 !important;
  }
  [class*="FlightCard-module__cardLeft___"] {
    grid-column: 2 !important;
    grid-row: 1 !important;
    background: transparent !important;
    box-shadow: none !important;
    border-right: 0 !important;
    border-left: 2px solid #e3e8f2 !important;
    padding: 4px 0 4px 24px !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: stretch !important;
    gap: 10px !important;
  }
}

/* Rozetler: Fredoka 600 14px, 4px 12px, 999px; En ucuz #FFD166, En hızlı/diğerleri #CFE0FF */
[class*="FlightCard-module__cardBadges___"] {
  background: #ffd166 !important;
  color: #1e2a44 !important;
  font-family: var(--font-fredoka), var(--font-baloo), sans-serif !important;
  font-weight: 600 !important;
  font-size: 14px !important;
  line-height: 1.2 !important;
  padding: 4px 12px !important;
  border-radius: 999px !important;
  box-shadow: none !important;
}
[class*="FlightCard-module__cardBadges___"][data-pirpir-badge="fast"] {
  background: #cfe0ff !important;
  color: #1e2a44 !important;
}

/* Kalkış / varış saatleri: Fredoka 600, 28px, satır yüksekliği 1 */
[class*="Flight-module__cardFlightTime___"] {
  font-family: var(--font-fredoka), var(--font-baloo), sans-serif !important;
  font-weight: 600 !important;
  font-size: 28px !important;
  line-height: 1 !important;
  color: #1e2a44 !important;
}
[class*="Flight-module__cardFlightCity___"],
[class*="Flight-module__cardFlightDay___"] {
  color: #56607a !important;
  font-weight: 600 !important;
}
[class*="Flight-module__cardFlightTravelTime___"] {
  font-size: 13px !important;
  font-weight: 700 !important;
  color: #56607a !important;
}
[class*="Flight-module__cardFlightTravelLineTop___"] {
  background: transparent !important;
  border-top: 3px dotted #9cc3ff !important;
  height: 0 !important;
  align-items: center !important;
}
[class*="Flight-module__cardFlightTravelLineTopFlight___"] {
  background: transparent !important;
  height: 0 !important;
}
[class*="Flight-module__cardFlightTravelLineTopTransfer___"] {
  background: #ff8a65 !important;
  border-radius: 999px !important;
  height: 6px !important;
}
[class*="Flight-module__airportCode___"],
[class*="Flight-module__cardFlightAirport___"] {
  font-size: 13px !important;
  font-weight: 800 !important;
  color: #1e2a44 !important;
}

/* Havayolu satırı: 15px, 600, #56607A */
[class*="AirCompany-module__cardAirCompanyWrap___"],
[class*="FlightCard-module__airCompany___"] {
  font-size: 15px !important;
  font-weight: 600 !important;
  color: #56607a !important;
}

/* Bilgi hapları: bagaj #F5F8FD, aktarma #FFE8E0 (13px, 800, 999px) */
[class*="FlightCard-module__cardLeftBaggage___"] {
  background: #f5f8fd !important;
  color: #1e2a44 !important;
  border: 0 !important;
  border-radius: 999px !important;
  padding: 5px 12px !important;
  font-size: 13px !important;
  font-weight: 800 !important;
  box-shadow: none !important;
}
[class*="FlightCard-module__cardLeftBaggageLeftMobile___"] {
  background: #f5f8fd !important;
  color: #1e2a44 !important;
  border-radius: 999px !important;
  padding: 3px 10px !important;
  font-size: 13px !important;
  font-weight: 800 !important;
}
[class*="FlightCard-module__priceDiff___"] {
  color: #2f5bd3 !important;
  font-weight: 800 !important;
}
[class*="FlightCard-module__cardChips___"] > *,
[class*="Flight-module__cardFlightTravelDetailMobile___"] {
  background: #ffe8e0 !important;
  color: #1e2a44 !important;
  border-radius: 999px !important;
  padding: 3px 10px !important;
  font-size: 13px !important;
  font-weight: 800 !important;
  border: 0 !important;
}

/* Fiyat: Fredoka 700, 30px, #1E2A44 */
[class*="FlightCard-module__cardLeftPrice___"] {
  font-family: var(--font-fredoka), var(--font-baloo), sans-serif !important;
  font-weight: 700 !important;
  font-size: 30px !important;
  line-height: 1.1 !important;
  color: #1e2a44 !important;
}

/* Seç butonu: #2F5BD3, beyaz Fredoka 600 19px, 12px 26px, 999px, min 48px */
[class*="Button-module__root___"] {
  border-radius: 999px !important;
  font-family: var(--font-fredoka), var(--font-baloo), sans-serif !important;
  font-weight: 600 !important;
  box-shadow: none !important;
}
[class*="Button-module__primary___"] {
  background: #2f5bd3 !important;
  color: #ffffff !important;
  border: 0 !important;
  font-size: 19px !important;
  padding: 12px 26px !important;
  min-height: 48px !important;
}
[class*="Button-module__primary___"]:hover { background: #1e3f9e !important; }

/* Daha fazla uçuş göster */
[class*="TicketsWidget-module__moreTickets___"] {
  border-radius: 999px !important;
  border: 2px solid #e3e8f2 !important;
  background: #ffffff !important;
  color: #1e2a44 !important;
  font-family: var(--font-fredoka), var(--font-baloo), sans-serif !important;
  font-weight: 600 !important;
  font-size: 17px !important;
  min-height: 48px !important;
  box-shadow: none !important;
}
[class*="TicketsWidget-module__moreTickets___"]:hover { border-color: #2f5bd3 !important; }

/* Filtre içi haplar ve iskelet kartlar */
[class*="ClearableParameter-module__root___"] {
  border-radius: 999px !important;
  font-family: var(--font-fredoka), var(--font-baloo), sans-serif !important;
  font-weight: 600 !important;
  background: #f5f8fd !important;
  color: #1e2a44 !important;
  min-height: 40px !important;
  padding: 6px 14px !important;
}
[class*="ClearableParameter-module__valueChanged___"] {
  background: #1e2a44 !important;
  color: #ffffff !important;
}
[class*="SkeletonCard-module__root___"] { border-radius: 28px !important; border: 2px solid #e3e8f2 !important; box-shadow: none !important; }

/* 10.4 Mobil (<= 640 px — design/Mobile.dc.html dili) */
@media (max-width: 640px) {
  [class*="FlightCard-module__card___"] {
    padding: 16px !important;
    gap: 12px !important;
    border-radius: 24px !important;
  }
  [class*="FlightCard-module__cardLeft___"] {
    padding: 0 !important;
    border: 0 !important;
  }
  [class*="Flight-module__cardFlightTime___"] {
    font-size: 22px !important;
  }
  [class*="FlightCard-module__cardLeftPrice___"] {
    font-size: 26px !important;
  }
  [class*="Button-module__primary___"] {
    font-size: 16px !important;
    padding: 10px 20px !important;
    min-height: 44px !important;
  }
}
`;

const CARD = '[data-role="flight-card"]';
const priceOf = (card: Element) =>
  Number((card.querySelector('[data-testid^="flight-card-price"]')?.textContent ?? "").replace(/[^\d]/g, "")) || 1e9;

const CHEAP_BADGE_RE = /en ucuz|cheapest|goedkoopst|günstigst|moins cher|más barato|più economico/i;

function styleBadges(root: ShadowRoot) {
  root.querySelectorAll<HTMLElement>('[data-role="flight-card-badge"], [class*="FlightCard-module__cardBadges___"]').forEach((badge) => {
    const kind = CHEAP_BADGE_RE.test(badge.textContent ?? "") ? "cheap" : "fast";
    if (badge.dataset.pirpirBadge !== kind) badge.dataset.pirpirBadge = kind;
  });
}

/** 10.2 Tarih şeridi (FlightMatrix) hücrelerinde hiç fiyat rakamı yoksa gizler; fiyat gelince gösterir. */
function syncMatrixVisibility(root: ShadowRoot) {
  const boxes = root.querySelectorAll<HTMLElement>(
    '[class*="FlightMatrixDesktop-module__root___"], [class*="FlightMatrixMobile-module__flightMatrixMobile___"]',
  );
  boxes.forEach((box) => {
    const cells = [...box.querySelectorAll('[class*="dateCellPrice___"]')];
    const hasPrice = cells.some((c) => /\d/.test(c.textContent ?? ""));
    if (hasPrice) box.removeAttribute("data-pirpir-empty");
    else box.setAttribute("data-pirpir-empty", "1");
  });
}

/**
 * 10.3 Masaüstünde Bagaj, Aktarmalar ve Kalkış/varış saatleri açık başlasın;
 * Havayolları, Havalimanları, Uçak tipleri, Acenteler ve Sıralama kapalı kalsın.
 */
function openDefaultFilterSections(root: ShadowRoot): boolean {
  const panel = root.querySelector<HTMLElement>('[class*="FlightFiltersContent-module__root___"]');
  if (!panel) return false;
  const children = [...panel.children].filter((el): el is HTMLElement => el instanceof HTMLElement);
  if (children.length < 2) return false;
  let openedAny = false;
  for (const child of children) {
    const tid = child.getAttribute("data-testid") ?? "";
    const cls = child.className?.toString?.() ?? "";
    // Kapalı kalması gereken bölümler
    if (
      tid === "expandable-alliances-filter" ||
      tid === "expandable-connecting-airports-filter" ||
      tid.startsWith("expandable-airports-in-filter-") ||
      tid === "expandable-aircraft-types-filter" ||
      tid === "expandable-sort-filter" ||
      /Agencies-module|TravelTime-module|ConnectingAirports-module|AircraftTypes-module/.test(cls)
    ) {
      continue;
    }
    const header = child.querySelector<HTMLElement>('[class*="Expandable-module__header___"]');
    if (header && !/isOpen/.test(header.className)) {
      header.click();
      openedAny = true;
    }
  }
  return openedAny || children.length > 0;
}

/** 10.5 Aktif filtre sayısını okur (Popüler çipler + sol sütundaki işaretli onay kutuları/anahtarlar). */
function countActiveFilters(root: ShadowRoot): number {
  const panel = root.querySelector('[class*="FlightFiltersContent-module__root___"]');
  if (!panel) {
    return root.querySelectorAll('[class*="FlightFiltersMobileMenu-module__list"] [class*="ClearableParameter-module__valueChanged___"]').length;
  }
  const activeChips = panel.querySelectorAll('[class*="Popular-module__body___"] [class*="ClearableParameter-module__valueChanged___"]').length;
  const checkedInputs = panel.querySelectorAll('input[type="checkbox"]:checked').length;
  return activeChips + checkedInputs;
}

const isBaggageActive = (el: HTMLElement) => /valueChanged/.test(el.className);

function findBaggageChip(root: ShadowRoot): HTMLElement | null {
  return (
    root.querySelector<HTMLElement>('[data-testid="baggage-included-filter"]') ??
    root.querySelector<HTMLElement>('[class*="FlightFiltersMobileMenu-module__list"] [class*="ClearableParameter-module__root"]')
  );
}

function findDirectChip(root: ShadowRoot): HTMLElement | null {
  const popular = root.querySelectorAll<HTMLElement>('[class*="Popular-module__body___"] [class*="ClearableParameter-module__root"]');
  if (popular[1]) return popular[1];
  const mobile = root.querySelectorAll<HTMLElement>('[class*="FlightFiltersMobileMenu-module__list"] [class*="ClearableParameter-module__root"]');
  return mobile[1] ?? null;
}

/** Widget'ın kendi sıralama menüsündeki seçeneği tıklar (index 1 = Önce en ucuz, index 5 = Yolculuk süresi / En hızlı). */
function clickWidgetSort(root: ShadowRoot, index: number): void {
  const pick = () => {
    const sec = root.querySelector<HTMLElement>('[data-testid="expandable-sort-filter"]');
    const target = sec?.querySelectorAll<HTMLInputElement>('input[type="radio"]')[index];
    if (target) {
      target.click();
      return true;
    }
    return false;
  };
  if (pick()) return;
  root.querySelector<HTMLElement>('[data-testid="expandable-sort-filter"] button')?.click();
  requestAnimationFrame(() => {
    if (!pick()) window.setTimeout(pick, 60);
  });
}

type WidgetUiState = {
  ready: boolean;
  direct: boolean;
  baggage: boolean;
  activeFilters: number;
  summaries: WidgetTabSummaries;
};

type EnhanceController = {
  setSort: (mode: "cheap" | "fast") => void;
  toggleDirect: () => void;
  toggleBaggage: (route: string) => void;
  clearFilters: (route: string) => void;
  openMobileFilters: () => boolean;
};

/**
 * Gölge köke pirpir stilini ekler, rozetleri boyar, boş tarih şeridini gizler, kartları en ucuzdan sıralar
 * ve üstteki özetli sekmeler ile aktif filtre sayacını widget'ın gerçek Preact durumuyla eşitler.
 */
function enhanceShadow(
  host: HTMLElement | null,
  onState: (s: WidgetUiState) => void,
  ctrlRef: React.MutableRefObject<EnhanceController | null>,
): () => void {
  if (!host) return () => {};
  let observer: MutationObserver | null = null;
  let userSorted = false;
  let defaultSectionsOpened = false;

  const sortCards = (root: ShadowRoot) => {
    styleBadges(root);
    syncMatrixVisibility(root);
    if (!defaultSectionsOpened && window.innerWidth >= 1024) {
      if (openDefaultFilterSections(root)) defaultSectionsOpened = true;
    }
    if (userSorted) return;
    const cards = [...root.querySelectorAll<HTMLElement>(CARD)];
    if (!cards.length) return;
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
      for (const el of [...parent.children]) {
        if (!el.matches(CARD)) (el as HTMLElement).style.order = "2000000000";
      }
    }
  };

  const syncUi = (root: ShadowRoot) => {
    const bag = findBaggageChip(root);
    const dir = findDirectChip(root);
    const cards = [...root.querySelectorAll(CARD)];
    const ready = cards.length > 0;
    const summaries = ready ? computeTabSummaries(cards.map(readCardMetrics)) : {};
    onState({
      ready,
      direct: dir ? isBaggageActive(dir) : false,
      baggage: bag ? isBaggageActive(bag) : false,
      activeFilters: countActiveFilters(root),
      summaries,
    });
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

    ctrlRef.current = {
      setSort: (mode) => {
        if (mode === "cheap") {
          userSorted = false;
          clickWidgetSort(root, 1);
          sortCards(root);
        } else {
          userSorted = true;
          root.querySelectorAll<HTMLElement>(CARD).forEach((c) => (c.style.order = ""));
          clickWidgetSort(root, 5);
        }
      },
      toggleDirect: () => {
        findDirectChip(root)?.click();
        window.setTimeout(() => syncUi(root), 60);
      },
      toggleBaggage: (route) => {
        const chip = findBaggageChip(root);
        if (!chip) return;
        const willBeOn = !isBaggageActive(chip);
        chip.click();
        const prev = readWidgetBags(route);
        saveWidgetBags(route, { cabin: prev?.cabin ?? 0, checked: willBeOn ? Math.max(1, prev?.checked ?? 1) : 0 });
        window.setTimeout(() => syncUi(root), 60);
      },
      clearFilters: (route) => {
        const panel = root.querySelector('[class*="FlightFiltersContent-module__root___"]');
        if (panel) {
          panel
            .querySelectorAll<HTMLElement>('[class*="Popular-module__body___"] [class*="ClearableParameter-module__valueChanged___"]')
            .forEach((chip) => chip.click());
          panel.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked').forEach((inp) => inp.click());
        } else {
          root
            .querySelectorAll<HTMLElement>('[class*="FlightFiltersMobileMenu-module__list"] [class*="ClearableParameter-module__valueChanged___"]')
            .forEach((chip) => chip.click());
        }
        saveWidgetBags(route, null);
        window.setTimeout(() => syncUi(root), 80);
      },
      openMobileFilters: () => {
        const btn = root.querySelector<HTMLElement>('[class*="FlightFiltersMobileMenu-module__list"] > button:last-child');
        if (!btn) return false;
        btn.click();
        return true;
      },
    };

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
      raf = requestAnimationFrame(() => {
        sortCards(root);
        syncUi(root);
      });
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class", "checked"] });
    sortCards(root);
    syncUi(root);
  };

  attach();
  let tries = 0;
  const timer = window.setInterval(() => {
    attach();
    if (observer || ++tries > 120) window.clearInterval(timer);
  }, 250);
  return () => {
    window.clearInterval(timer);
    observer?.disconnect();
    ctrlRef.current = null;
  };
}

/**
 * Arama kutusunda kontrol edilen bagaj seçildiyse (veya `sessionStorage`'da bu rota için kayıtlıysa)
 * widget'ın "Bagaj dahil" filtresini açar ve `valueChanged` sınıfıyla etkinleştiğini doğrular.
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
    if (++tries > 240) window.clearInterval(timer);
  }, 250);

  return () => {
    window.clearInterval(timer);
    attachedRoot?.removeEventListener("click", onUserClick, true);
  };
}

/**
 * Canlı uçuşlar (Travelpayouts White Label, Widget türü): sonuç sayfasının ana listesi.
 * Masaüstünde (>= 1024 px, 1120 px genişlik): solda yapışkan 260 px filtre sütunu, sağda özetli sıralama sekmeleri +
 * iki bölmeli pirpir uçuş kartları. Telefonda (< 1024 px): üstte haplar + mobil filtre modalı + tek sütun kartlar.
 */
export function LiveWidget({ q, widgetId }: { q: MultiQuery; widgetId?: string | null }) {
  const t = useTranslations("results");
  const router = useRouter();
  const locale = useLocale();
  const { cur } = useCurrency();
  const src = liveWidgetSrc(widgetId);
  const box = useRef<HTMLDivElement>(null);
  const ctrlRef = useRef<EnhanceController | null>(null);
  const [sortMode, setSortMode] = useState<"cheap" | "fast">("cheap");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [ui, setUi] = useState<WidgetUiState>({ ready: false, direct: false, baggage: false, activeFilters: 0, summaries: {} });

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
    if (sp.has("from")) saveWidgetBags(route, q.bags ?? null);
    const initialLang = widgetLangFor(locale);
    const initialCur = widgetCurFor(readInitialCurrency() ?? cur);
    // 10.1 Widget dil/para birimi seçiminde `tpwl_locale` / `tpwl_currency` çerezlerini `defaultLanguage`'den önce okur;
    // çerezler + URL `?language=&currency=` birlikte yazılarak önceki ziyaretin dili kesin olarak ezilir
    syncWidgetCookies(initialLang, initialCur);
    const clean = cleanWidgetUrl(window.location.href, route, { language: initialLang, currency: initialCur });
    if (document.getElementById(SCRIPT_ID)) {
      if (w.__tpwlBox !== box.current || w.__tpwlRoute !== route) window.location.replace(clean);
      return;
    }
    if (window.location.href !== clean) {
      window.history.replaceState(window.history.state, "", clean);
    }
    w.__tpwlBox = box.current;
    w.__tpwlRoute = route;
    w.__tpwlLang = initialLang;
    w.__tpwlCur = initialCur;
    w.TPWL_CONFIGURATION = {
      ...(w.TPWL_CONFIGURATION ?? {}),
      defaultLanguage: initialLang,
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

  // Dil veya para birimi sonradan değişirse çerez + URL parametreleriyle temiz yeniden yükleme yapılır
  useEffect(() => {
    if (!src || !document.getElementById(SCRIPT_ID)) return;
    const w = window as W;
    const nextLang = widgetLangFor(locale);
    const stored = readInitialCurrency();
    const nextCur = widgetCurFor(stored ?? cur);
    if ((w.__tpwlLang && nextLang !== w.__tpwlLang) || (w.__tpwlCur && stored && nextCur !== w.__tpwlCur)) {
      syncWidgetCookies(nextLang, nextCur);
      window.location.replace(cleanWidgetUrl(window.location.href, route, { language: nextLang, currency: nextCur }));
    }
  }, [src, locale, cur, route]);

  // Widget içi tarih/rota değişiminde (`urlchange`) üst çubuğu eşitler; `adults` vb. geri eklenmez
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

  useEffect(() => enhanceShadow(document.getElementById("tpwl-tickets"), setUi, ctrlRef), []);

  useEffect(() => {
    const el = document.getElementById("tpwl-tickets");
    if (!el) return;
    if (filtersOpen) el.setAttribute("data-filters", "open");
    else el.removeAttribute("data-filters");
  }, [filtersOpen]);

  const checked = q.bags?.checked ?? 0;
  useEffect(() => {
    if (!src) return;
    const wantOn = checked > 0 || (readWidgetBags(route)?.checked ?? 0) > 0;
    return applyBaggageFilter(document.getElementById("tpwl-tickets"), route, wantOn);
  }, [src, checked, route]);

  if (!src || q.from.length !== 1 || q.to.length !== 1) return null;
  preloadModule(src, { as: "script" });
  for (const host of ["https://tpwgt.com", "https://img.avs.io"]) preconnect(host, { crossOrigin: "anonymous" });

  const pill = (active: boolean) =>
    `flex min-h-[44px] cursor-pointer flex-col items-start justify-center rounded-pill border-0 px-4 py-2 text-left font-display text-[15px] font-semibold leading-tight transition-colors lg:rounded-[20px] lg:px-5 lg:py-[10px] lg:text-[17px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-primary ${
      active ? "bg-ink text-white" : "bg-field text-ink hover:bg-sky"
    }`;

  const subText = (active: boolean) =>
    `hidden font-sans text-[13px] font-bold leading-tight lg:block ${active ? "text-white/80" : "text-muted"}`;

  const formatSummary = (s?: { priceText: string; durText?: string }) =>
    s ? [s.priceText, s.durText].filter(Boolean).join(" · ") : null;

  const onToggleFilters = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024 && ctrlRef.current?.openMobileFilters()) {
      return;
    }
    setFiltersOpen((v) => !v);
  };

  return (
    <section aria-labelledby="live-title" className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 id="live-title" className="m-0 font-display text-[24px] font-bold text-ink">{t("liveTitle")}</h2>
        <p className="m-0 text-[15px] font-semibold text-muted">{t("liveText")}</p>
      </div>

      {/* 10.3 Masaüstü (>= 1024 px): solda 260 px filtre başlığı + Temizle; sağda özetli sıralama sekmeleri */}
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-center lg:gap-6">
        <div className="hidden items-center justify-between px-1 lg:flex">
          <span className="font-display text-[18px] font-semibold text-ink">{t("filters.title")}</span>
          {ui.activeFilters > 0 && (
            <button
              type="button"
              onClick={() => ctrlRef.current?.clearFilters(route)}
              className="min-h-[36px] cursor-pointer rounded-pill border-0 bg-transparent px-2 text-[14px] font-extrabold text-primary hover:underline focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-primary"
            >
              {t("filters.reset")}
            </button>
          )}
        </div>

        <div role="toolbar" aria-label={t("sortLabel")} className="flex flex-wrap items-stretch gap-2">
          <button
            type="button"
            aria-pressed={sortMode === "cheap"}
            onClick={() => {
              setSortMode("cheap");
              ctrlRef.current?.setSort("cheap");
            }}
            className={pill(sortMode === "cheap")}
          >
            <span>{t("sort.cheap")}</span>
            {formatSummary(ui.summaries.cheap) && (
              <span data-testid="tab-summary-cheap" className={subText(sortMode === "cheap")}>
                {formatSummary(ui.summaries.cheap)}
              </span>
            )}
          </button>

          <button
            type="button"
            aria-pressed={sortMode === "fast"}
            onClick={() => {
              setSortMode("fast");
              ctrlRef.current?.setSort("fast");
            }}
            className={pill(sortMode === "fast")}
          >
            <span>{t("sort.fast")}</span>
            {formatSummary(ui.summaries.fast) && (
              <span data-testid="tab-summary-fast" className={subText(sortMode === "fast")}>
                {formatSummary(ui.summaries.fast)}
              </span>
            )}
          </button>

          <button
            type="button"
            aria-pressed={ui.direct}
            onClick={() => ctrlRef.current?.toggleDirect()}
            className={pill(ui.direct)}
          >
            <span>{t("sort.direct")}</span>
            {formatSummary(ui.summaries.direct) && (
              <span data-testid="tab-summary-direct" className={subText(ui.direct)}>
                {formatSummary(ui.summaries.direct)}
              </span>
            )}
          </button>

          <button
            type="button"
            aria-pressed={ui.baggage}
            onClick={() => ctrlRef.current?.toggleBaggage(route)}
            className={`${pill(ui.baggage)} lg:self-center lg:rounded-pill`}
          >
            <span>{t("liveBaggage")}</span>
          </button>

          {/* Mobilde (< 1024 px) filtre modalını açan hap (aktif filtre sayısıyla); masaüstünde filtreler solda açık */}
          <button
            type="button"
            aria-expanded={filtersOpen}
            onClick={onToggleFilters}
            className={`${pill(filtersOpen || ui.activeFilters > 0)} inline-flex flex-row items-center gap-2 lg:hidden`}
          >
            <span>{ui.activeFilters > 0 ? t("filters.active", { n: ui.activeFilters }) : t("filters.show")}</span>
          </button>
        </div>
      </div>

      {/* 10.5 İlk kart gelene kadar (4–6 sn) küçük Pırpır ve kısa durum metni */}
      {!ui.ready && (
        <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6">
          <div className="hidden lg:block" />
          <div
            role="status"
            data-testid="live-loading-pirpir"
            className="flex items-center gap-3 rounded-[20px] bg-sky px-4 py-3 text-[15px] font-bold text-ink"
          >
            <Pirpir aria-hidden width={52} height={36} className="flex-none" />
            <span>{t("liveLoading")}</span>
          </div>
        </div>
      )}

      {/* Widget arama formunu (gizli) ve sonuçlarını bu alanlara yerleştirir */}
      <div ref={box} className="min-h-[480px] w-full">
        <div id="tpwl-search" className="hidden" aria-hidden="true" />
        <div id="tpwl-tickets" />
      </div>
    </section>
  );
}
