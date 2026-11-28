"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { preconnect, preloadModule } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { readInitial as readInitialCurrency, useCurrency } from "../CurrencyProvider";
import { Pirpir } from "../characters";
import { CabinBagIcon, CheckedBagIcon } from "./BagIcons";
import { useRouter } from "@/i18n/navigation";
import { liveWidgetSrc } from "@/config/affiliate";
import { knownAirlineName } from "@/lib/airlines";
import {
  normalizeWidgetBags,
  readWidgetBags,
  saveWidgetBags,
  subscribeWidgetBags,
  type WidgetBags,
} from "@/lib/live-widget-bags";
import { cleanWidgetUrl, syncWidgetCookies, widgetSyncQuery } from "@/lib/live-widget-url";
import { aviasalesRoute, parseAviasalesRoute } from "@/lib/outbound";
import { MAX_SEARCH_BAGS, paxTotal, type MultiQuery } from "@/lib/search";

const SCRIPT_ID = "tpwl-main";
const STYLE_ID = "pirpir-tpwl";

type SortMode = "best" | "cheap" | "fast";

const SORT_INDEX: Record<SortMode, number> = {
  best: 0,
  cheap: 1,
  fast: 5,
};

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

/** CSS `content` özelliği için güvenli çift tırnaklı dize */
const cssString = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

/**
 * Widget kartlarını ve sol filtre sütununu açık gölge DOM'a (shadow root) çizer.
 * 12. tur güncellemeleri:
 * - 12.1 Çok aktarmalı uçuşlarda havalimanı kodları eşit aralıklı flex satırda (çakışma yok, "SAWDB" bitti);
 * - 12.2 Telefonda (360–390 px) 2 satırlı saat/süre düzeni (12s/24s biçimde çakışma yok, >=12 px kenar boşluğu);
 * - 12.3 Tarih şeridinde 7 dilde yaklaşık fiyat notu;
 * - 12.5 Bagaj seçiliyken sol sütundaki bagajsız fiyatlar gizlenir;
 * - 12.6 2+ yolcuda kart fiyatının altında "X kişi toplam" notu;
 * - 12.7 Seç butonu, rozetler, "Daha fazla" ve "1 konaklama" metinleri Preact DOM'unu bozmadan CSS ::after ile yerelleştirilir;
 * - 12.8 Çok havayollu kartlarda masaüstünde logonun yanında havayolu adı gösterilir (logolara dokunulmaz).
 */
const SHADOW_CSS = `
*, *::before, *::after { box-sizing: border-box; }
:host { display: block; width: 100%; max-width: 100%; color: #1e2a44; font-family: var(--font-nunito), system-ui, sans-serif; }
button:focus-visible, a:focus-visible, input:focus-visible { outline: 3px solid #2f5bd3 !important; outline-offset: 2px !important; }

/* Varsayılan (mobil / tablet < 1024 px): tek sütun, sol filtre varsayılan gizli (data-filters="open" ile açılır) */
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
[class*="FlightFilters-module__filerContainer___"] {
  display: none !important;
  position: static !important;
  max-height: none !important;
  overflow: visible !important;
}
:host([data-filters="open"]) [class*="FlightFilters-module__filerContainer___"] {
  display: block !important;
  width: 100% !important;
  margin: 0 0 20px 0 !important;
  position: static !important;
  max-height: none !important;
  overflow: visible !important;
}

/* 11.4 Masaüstü (>= 1024 px): 1120 px içinde 260 px sol filtre (iç kaydırmasız) + sağda sonuç kartları */
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
    position: static !important;
    max-height: none !important;
    overflow: visible !important;
    width: 260px !important;
    margin: var(--pirpir-bags-offset, 0px) 0 0 0 !important;
    padding: 0 !important;
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
  overflow: visible !important;
}
[class*="FlightFiltersContent-module__root___"] > * {
  border-bottom: 1px solid #e3e8f2 !important;
  padding: 10px 0 !important;
  margin: 0 !important;
}
[class*="FlightFiltersContent-module__root___"] > *:last-child,
[class*="FlightFiltersContent-module__root___"] > [data-pirpir-last-visible="1"] {
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

/* 12.5 Bagaj seçiliyken sol sütundaki bagajsız filtre fiyatları kafa karıştırmasın diye gizlenir */
:host([data-baggage="1"]) [class*="Layovers-module__price___"],
:host([data-baggage="1"]) [class*="Alliances-module__price___"],
:host([data-baggage="1"]) [class*="Agencies-module__price___"],
:host([data-baggage="1"]) [class*="AirportsIn-module__price___"],
:host([data-baggage="1"]) [class*="ConnectingAirports-module__price___"],
:host([data-baggage="1"]) [class*="AircraftTypes-module__price___"],
:host([data-baggage="1"]) [class*="FlightSchedule-module__price___"] {
  display: none !important;
}

/* 11.4 & 12.3 Tarih şeridi (FlightMatrix): negatif üst kenar boşluğu sıfırlanır, yaklaşık fiyat notu eklenir */
[class*="FlightMatrixDesktop-module__root___"][data-pirpir-empty="1"],
[class*="FlightMatrixMobile-module__flightMatrixMobile___"][data-pirpir-empty="1"] {
  display: none !important;
}
[class*="FlightMatrixDesktop-module__root___"] {
  display: flex !important;
  flex-direction: column !important;
  align-items: stretch !important;
  gap: 10px !important;
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 0 16px 0 !important;
  padding: 14px 16px !important;
  border: 2px solid #e3e8f2 !important;
  border-radius: 24px !important;
  background: #ffffff !important;
  box-shadow: none !important;
  overflow: visible !important;
}
[class*="FlightMatrixMobile-module__flightMatrixMobile___"] {
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 0 16px 0 !important;
  border: 2px solid #e3e8f2 !important;
  border-radius: 20px !important;
  background: #ffffff !important;
  box-shadow: none !important;
  overflow-x: auto !important;
}
[class*="FlightMatrixDesktop-module__flightMatrixButton___"] {
  display: flex !important;
  flex-wrap: wrap !important;
  align-items: center !important;
  width: 100% !important;
  min-width: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  border: 0 !important;
  background: transparent !important;
  font-family: var(--font-fredoka), var(--font-baloo), sans-serif !important;
  font-weight: 600 !important;
  font-size: 15px !important;
  color: #1e2a44 !important;
  gap: 4px 10px !important;
}
[class*="FlightMatrixDesktop-module__flightMatrixButton___"]::after {
  content: var(--pirpir-matrix-note, "");
  margin-left: auto;
  font-family: var(--font-nunito), system-ui, sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #56607a;
}
[class*="FlightMatrixDesktop-module__dateCellList___"] {
  display: grid !important;
  grid-template-columns: repeat(7, minmax(92px, 1fr)) !important;
  gap: 6px !important;
  width: 100% !important;
  max-width: 100% !important;
  overflow-x: auto !important;
  padding-bottom: 2px !important;
}
[class*="FlightMatrixDesktop-module__dateCell___"] {
  width: auto !important;
  min-width: 0 !important;
  height: auto !important;
  padding: 10px 6px !important;
  margin: 0 !important;
  border: 1px solid #e3e8f2 !important;
  border-radius: 14px !important;
  background: #f5f8fd !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 2px !important;
  text-align: center !important;
}
[class*="FlightMatrixDesktop-module__dateCell___"]:hover {
  border-color: #2f5bd3 !important;
}
[class*="FlightMatrixDesktop-module__dateCellCurrent___"] {
  background: #eaf3ff !important;
  border: 2px solid #2f5bd3 !important;
  color: #1e2a44 !important;
  border-radius: 14px !important;
}
[class*="FlightMatrixDesktop-module__dateCellPrice___"] {
  font-family: var(--font-fredoka), var(--font-baloo), sans-serif !important;
  font-weight: 700 !important;
  font-size: 15px !important;
  line-height: 1.2 !important;
  color: #1e2a44 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  min-height: 20px !important;
}
[class*="FlightMatrixDesktop-module__dateCellPrice___"][data-pirpir-noprice="1"]::after {
  content: "—";
  color: #56607a;
  font-weight: 700;
}
[class*="FlightMatrixDesktop-module__dateCellDay___"] {
  font-family: var(--font-nunito), system-ui, sans-serif !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  color: #56607a !important;
  white-space: nowrap !important;
}

/* 11.1–11.5 Çift kontroller, İngilizce uyarı, Show düğmesi, kırık logolar ve gürültü gizlenir (DOM'da kalır) */
[data-pirpir-hide="1"],
[class*="BaggageFilter-module__root___"],
[data-testid="expandable-sort-filter"],
[data-testid="soft-tickets-notice"],
[class*="SoftTicketsNotice-module__root___"],
[class*="FlightMatrixDesktop-module__buttonBox___"],
[class*="FlightMatrixDesktop-module__noPriceIcon___"],
[class*="FlightFiltersMobileMenu-module__root___"],
[class*="FlightCard-module__share___"],
[class*="FlightCard-module__cardTopRight___"],
[class*="DirectFlights-module__root___"],
[class*="DirectFlightsItem-module__"],
[data-pirpir-broken-logo="1"] {
  display: none !important;
}

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

/* 10.3 & 12.8 Masaüstü kart: solda uçuşlar + çok havayollu kartlarda havayolu adları; sağda fiyat+Seç */
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
  [class*="FlightCard-module__cardTopLeft___"] {
    display: flex !important;
    flex-wrap: wrap !important;
    align-items: center !important;
    gap: 4px 10px !important;
  }
  [data-role="flight-card-air-company"][data-pirpir-airline] {
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
  }
  [data-role="flight-card-air-company"][data-pirpir-airline]::after {
    content: attr(data-pirpir-airline);
    font-family: var(--font-nunito), system-ui, sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: #56607a;
    white-space: nowrap;
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

/* 12.1 Çok aktarmalı uçuşta havalimanı kodları oransal dar genişlikten kurtulup eşit aralıklı dizilir ("SAWDB" bitti) */
[class*="Flight-module__cardFlightTravelLineAirport___"] {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 6px !important;
  width: 100% !important;
  flex-wrap: nowrap !important;
  margin-top: 4px !important;
}
[class*="Flight-module__cardFlightTravelLineAirport___"] > * {
  width: auto !important;
  min-width: 0 !important;
  flex: 0 0 auto !important;
}
[class*="Flight-module__cardFlightTravelLineFlight___"]:not([class*="Origin"]):not([class*="Destination"]) {
  display: none !important;
}
[class*="Flight-module__airportCode___"],
[class*="Flight-module__differentAirportsText___"],
[class*="Flight-module__cardFlightAirport___"] {
  font-size: 12px !important;
  font-weight: 800 !important;
  color: #1e2a44 !important;
  white-space: nowrap !important;
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

/* Fiyat: Fredoka 700, 30px, #1E2A44 + 12.6 birden çok yolcuda toplam notu */
[class*="FlightCard-module__cardLeftPrice___"] {
  font-family: var(--font-fredoka), var(--font-baloo), sans-serif !important;
  font-weight: 700 !important;
  font-size: 30px !important;
  line-height: 1.1 !important;
  color: #1e2a44 !important;
}
:host([data-multi-pax="1"]) [class*="FlightCard-module__cardLeftPrice___"]::after {
  content: var(--pirpir-pax-note, "");
  display: block;
  font-family: var(--font-nunito), system-ui, sans-serif;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.25;
  color: #56607a;
  margin-top: 2px;
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

/* 12.7 Preact metin düğümüne dokunmadan yerelleştirme (CSS ::before; widget ::after katmanlarıyla çakışmaz) */
[data-pirpir-l10n] {
  font-size: 0 !important;
  line-height: 0 !important;
}
[data-pirpir-l10n] > * {
  display: none !important;
}
[data-pirpir-l10n]::before {
  content: attr(data-pirpir-l10n) !important;
  display: inline !important;
  position: static !important;
  opacity: 1 !important;
  visibility: visible !important;
  line-height: 1.2 !important;
}
[data-role="flight-card"] button[class*="Button-module__primary___"][data-pirpir-l10n]::before {
  font-size: 19px !important;
  color: #ffffff !important;
}
[class*="FlightCard-module__cardBadges___"][data-pirpir-l10n]::before {
  font-size: 14px !important;
}
[class*="TicketsWidget-module__moreTickets___"][data-pirpir-l10n]::before {
  font-size: 17px !important;
}
[class*="Flight-module__cardFlightTravelMobile___"][data-pirpir-l10n]::before {
  font-size: 13px !important;
}

/* Filtre sıfırlama uyarısı ve iskelet kartlar */
[class*="FlightFiltersReset-module__root___"] {
  background: #fff4d6 !important;
  border: 2px solid #e3e8f2 !important;
  border-radius: 20px !important;
  color: #1e2a44 !important;
  margin-bottom: 12px !important;
}
[class*="SkeletonCard-module__root___"] { border-radius: 28px !important; border: 2px solid #e3e8f2 !important; box-shadow: none !important; }

/* 10.4 & 12.2 Mobil (<= 640 px — 360/375/390 px, 12s & 24s biçimde sıfır sıkışma, >= 12px kenar boşluğu) */
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
  [class*="FlightCard-module__cardLeftPrice___"] {
    font-size: 26px !important;
  }
  [class*="Button-module__primary___"] {
    font-size: 16px !important;
    padding: 10px 20px !important;
    min-height: 44px !important;
  }
  [data-role="flight-card"] button[class*="Button-module__primary___"][data-pirpir-l10n]::before {
    font-size: 16px !important;
    color: #ffffff !important;
  }
  [class*="FlightCard-module__cardBlockFlight___"] {
    gap: 10px !important;
    align-items: flex-start !important;
  }
  [class*="FlightCard-module__cardBlockFlightAirCompany___"] img {
    width: 28px !important;
    height: 28px !important;
  }
  [class*="Flight-module__cardFlight___"] {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
    gap: 4px 12px !important;
    align-items: start !important;
    width: 100% !important;
    min-width: 0 !important;
  }
  [class*="Flight-module__cardFlightInfo___"] {
    grid-column: 1 !important;
    grid-row: 1 !important;
    width: auto !important;
    min-width: 0 !important;
    flex: none !important;
    text-align: left !important;
  }
  [class*="Flight-module__cardFlightTravel___"] + [class*="Flight-module__cardFlightInfo___"] {
    grid-column: 2 !important;
    grid-row: 1 !important;
    text-align: right !important;
  }
  [class*="Flight-module__cardFlightTime___"] {
    font-size: 18px !important;
    line-height: 1.15 !important;
    white-space: nowrap !important;
  }
  [class*="Flight-module__cardFlightTravel___"] {
    grid-column: 1 / -1 !important;
    grid-row: 2 !important;
    width: 100% !important;
    max-width: 100% !important;
    margin: 2px 0 0 0 !important;
    padding: 0 !important;
  }
  [class*="Flight-module__cardFlightTravelTop___"] {
    justify-content: flex-start !important;
    width: 100% !important;
  }
  [class*="Flight-module__cardFlightTravelTime___"] {
    display: flex !important;
    flex-wrap: wrap !important;
    align-items: center !important;
    gap: 2px 8px !important;
    font-size: 13px !important;
    text-align: left !important;
    width: 100% !important;
  }
  [class*="Flight-module__cardFlightTravelLine___"] {
    display: none !important;
  }
  [class*="Flight-module__cardFlightTravelDetailMobile___"] {
    grid-column: 1 / -1 !important;
    grid-row: 3 !important;
    margin-top: 4px !important;
  }
}
`;

const CARD = '[data-role="flight-card"]';

type WidgetL10n = {
  select: string;
  showMore: string;
  stopsCount: (n: number) => string;
  badges: {
    onlyDirect: string;
    cheapBag: string;
    cheapLayover: string;
    cheap: string;
    fast: string;
    optimal: string;
    interest: string;
  };
};

function classifyBadge(raw: string): { kind: "cheap" | "fast"; key?: keyof WidgetL10n["badges"] } {
  const s = raw.trim();
  if (/only direct|tek direkt|enige directe|einziger direkt|seul vol direct/i.test(s)) return { kind: "fast", key: "onlyDirect" };
  if (/(cheapest|en ucuz|goedkoopst|günstigst|moins cher|más barato|più economico).*(baggage|bagaj|bagage|gepäck)|bagajlı en ucuz/i.test(s)) {
    return { kind: "cheap", key: "cheapBag" };
  }
  if (/convenient layover|rahat aktarma|korte overstap|gutem umstieg|kurzem stopp/i.test(s)) return { kind: "cheap", key: "cheapLayover" };
  if (/cheapest|en ucuz|goedkoopst|günstigst|moins cher|más barato|più economico/i.test(s)) return { kind: "cheap", key: "cheap" };
  if (/fastest|en hızlı|snelst|schnellst|plus rapide|más rápido|più veloce/i.test(s)) return { kind: "fast", key: "fast" };
  if (/optimal|en uygun|beste keuze|beste wahl/i.test(s)) return { kind: "fast", key: "optimal" };
  if (/may be of interest|ilginizi çekebilir|ook interessant|auch interessant/i.test(s)) return { kind: "fast", key: "interest" };
  return { kind: "fast" };
}

/** 12.7 Rozet, Seç butonu, Daha fazla ve mobil "1 konaklama" metinlerini Preact DOM düğümüne dokunmadan yerelleştirir. */
function localizeWidgetTexts(root: ShadowRoot, l10n: WidgetL10n) {
  root.querySelectorAll<HTMLElement>('[data-role="flight-card-badge"], [class*="FlightCard-module__cardBadges___"]').forEach((badge) => {
    const { kind, key } = classifyBadge(badge.textContent ?? "");
    if (badge.dataset.pirpirBadge !== kind) badge.dataset.pirpirBadge = kind;
    if (key) {
      const label = l10n.badges[key];
      if (badge.dataset.pirpirL10n !== label) badge.dataset.pirpirL10n = label;
    } else if (badge.dataset.pirpirL10n) {
      delete badge.dataset.pirpirL10n;
    }
  });

  root.querySelectorAll<HTMLButtonElement>('[data-role="flight-card"] button[class*="Button-module__primary___"]').forEach((btn) => {
    if (btn.dataset.pirpirL10n !== l10n.select) {
      btn.dataset.pirpirL10n = l10n.select;
      btn.setAttribute("aria-label", l10n.select);
    }
  });

  root.querySelectorAll<HTMLButtonElement>('[class*="TicketsWidget-module__moreTickets___"]').forEach((btn) => {
    // "Update search" durumunda içinde alt <span> vardır; yalnızca normal "Show more options" yerelleştirilir
    if (btn.childElementCount > 0) {
      if (btn.dataset.pirpirL10n) delete btn.dataset.pirpirL10n;
      return;
    }
    if (btn.dataset.pirpirL10n !== l10n.showMore) {
      btn.dataset.pirpirL10n = l10n.showMore;
      btn.setAttribute("aria-label", l10n.showMore);
    }
  });

  root.querySelectorAll<HTMLElement>('[class*="Flight-module__cardFlightTravelMobile___"]').forEach((el) => {
    if (el.childElementCount > 0) return;
    const m = /^\s*(\d+)\s+(?:konaklama|layover|layovers|tussenstop|tussenstops|zwischenstopp|zwischenstopps|stop|stops|escale|escales|escala|escalas|scalo|scali)\s*$/i.exec(
      el.textContent ?? "",
    );
    if (m) {
      const label = l10n.stopsCount(Number(m[1]));
      if (el.dataset.pirpirL10n !== label) el.dataset.pirpirL10n = label;
    } else if (el.dataset.pirpirL10n) {
      delete el.dataset.pirpirL10n;
    }
  });
}

/** 11.4 Tarih şeridi: fiyatsız hücrelerde büyüteci "—" ile değiştirir; tüm hücreler boşsa şeridi gizler. */
function syncMatrixVisibility(root: ShadowRoot) {
  const boxes = root.querySelectorAll<HTMLElement>(
    '[class*="FlightMatrixDesktop-module__root___"], [class*="FlightMatrixMobile-module__flightMatrixMobile___"]',
  );
  boxes.forEach((box) => {
    const cells = [...box.querySelectorAll<HTMLElement>('[class*="dateCellPrice___"]')];
    let hasPrice = false;
    for (const c of cells) {
      const hasDigit = /\d/.test(c.textContent ?? "");
      if (hasDigit) {
        hasPrice = true;
        c.removeAttribute("data-pirpir-noprice");
      } else {
        c.setAttribute("data-pirpir-noprice", "1");
      }
    }
    if (hasPrice) box.removeAttribute("data-pirpir-empty");
    else box.setAttribute("data-pirpir-empty", "1");
  });
}

/** 11.1 Çift kontrol oluşturan Popüler filtreler kutusunu gizler ve son görünür bölümün alt çizgisini kaldırır. */
function hideDuplicateFilterBlocks(root: ShadowRoot) {
  const panel = root.querySelector<HTMLElement>('[class*="FlightFiltersContent-module__root___"]');
  if (!panel) return;
  const popBody = panel.querySelector<HTMLElement>('[class*="Popular-module__body___"]');
  const popWrap = popBody?.parentElement;
  if (popWrap && popWrap.parentElement === panel && popWrap.dataset.pirpirHide !== "1") {
    popWrap.dataset.pirpirHide = "1";
  }

  const children = [...panel.children].filter((el): el is HTMLElement => el instanceof HTMLElement);
  let lastVisible: HTMLElement | null = null;
  for (const child of children) {
    child.removeAttribute("data-pirpir-last-visible");
    const cls = child.className?.toString?.() ?? "";
    const tid = child.getAttribute("data-testid") ?? "";
    const hidden =
      child.dataset.pirpirHide === "1" ||
      tid === "expandable-sort-filter" ||
      /BaggageFilter-module__root___/.test(cls);
    if (!hidden) lastVisible = child;
  }
  if (lastVisible) lastVisible.dataset.pirpirLastVisible = "1";
}

/** 11.5 & 12.8 Kırık logoları gizler; çok havayollu kartlarda (logoya dokunmadan) bilinen havayolu adını yanına etiketler. */
function enhanceAirlineLogos(root: ShadowRoot) {
  root.querySelectorAll<HTMLElement>('[data-role="flight-card-air-company"]').forEach((wrap) => {
    const img = wrap.querySelector<HTMLImageElement>("img");
    if (!img) return;
    const target = img.closest("picture") ?? img;
    if (img.complete && img.naturalWidth === 0) {
      target.setAttribute("data-pirpir-broken-logo", "1");
    }
    if (!img.dataset.pirpirLogoBound) {
      img.dataset.pirpirLogoBound = "1";
      img.addEventListener("error", () => {
        target.setAttribute("data-pirpir-broken-logo", "1");
      });
    }
    // 12.8 Çok havayollu kartta widget metin koymamışsa IATA kodundan bilinen havayolu adını data özniteliğine ekle
    if ((wrap.textContent ?? "").trim() === "") {
      const src = img.getAttribute("src") ?? img.currentSrc ?? "";
      const codeMatch = /\/al_square\/([A-Z0-9]{2})@/i.exec(src);
      const name = codeMatch ? knownAirlineName(codeMatch[1]) : undefined;
      if (name && wrap.dataset.pirpirAirline !== name) {
        wrap.dataset.pirpirAirline = name;
      }
    } else if (wrap.dataset.pirpirAirline) {
      delete wrap.dataset.pirpirAirline;
    }
  });
}

/**
 * 11.4 Sol sütunda yalnızca Aktarmalar ve Kalkış/varış saatleri açık başlasın;
 * Havayolları, Havalimanları, Uçak tipleri, Acenteler ve Seyahat süresi kapalı kalsın.
 * Gizli Sıralama bölümü de programatik sekme geçişi hızlı olsun diye bir kez açılır.
 */
function openDefaultFilterSections(root: ShadowRoot): boolean {
  const panel = root.querySelector<HTMLElement>('[class*="FlightFiltersContent-module__root___"]');
  if (!panel) return false;
  const children = [...panel.children].filter((el): el is HTMLElement => el instanceof HTMLElement);
  if (children.length < 2) return false;
  for (const child of children) {
    const tid = child.getAttribute("data-testid") ?? "";
    const cls = child.className?.toString?.() ?? "";
    if (tid === "expandable-sort-filter") {
      if (!child.querySelector('input[type="radio"]')) {
        child.querySelector<HTMLElement>("button")?.click();
      }
      continue;
    }
    if (
      child.dataset.pirpirHide === "1" ||
      /BaggageFilter-module__root___/.test(cls) ||
      tid === "expandable-alliances-filter" ||
      tid === "expandable-connecting-airports-filter" ||
      tid.startsWith("expandable-airports-in-filter-") ||
      tid === "expandable-aircraft-types-filter" ||
      /Agencies-module|TravelTime-module|ConnectingAirports-module|AircraftTypes-module|Airlines-module|PriceFilter-module/.test(cls)
    ) {
      continue;
    }
    const header = child.querySelector<HTMLElement>('[class*="Expandable-module__header___"]');
    if (header && !/isOpen/.test(header.className)) {
      header.click();
    }
  }
  return true;
}

/** 11.1 Aktif widget filtresi sayısını çift saymadan okur (Bagaj hariç — bagaj dış sayaçtan eklenir). */
function countWidgetNonBagFilters(root: ShadowRoot): number {
  const panel = root.querySelector('[class*="FlightFiltersContent-module__root___"]');
  if (!panel) {
    const mobileChips = [...root.querySelectorAll('[class*="FlightFiltersMobileMenu-module__list"] [class*="ClearableParameter-module__valueChanged___"]')];
    return mobileChips.filter((_, idx) => idx > 0).length;
  }
  let count = 0;
  panel.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked').forEach((inp) => {
    if (inp.closest('[class*="BaggageFilter-module__root___"]')) return;
    count++;
  });
  return count;
}

const isBaggageActive = (el: HTMLElement) => /valueChanged/.test(el.className);

function findBaggageChip(root: ShadowRoot): HTMLElement | null {
  return (
    root.querySelector<HTMLElement>('[data-testid="baggage-included-filter"]') ??
    root.querySelector<HTMLElement>('[class*="FlightFiltersMobileMenu-module__list"] [class*="ClearableParameter-module__root"]')
  );
}

/** Widget'ın kendi sıralama menüsündeki seçeneği tıklar (0 = En iyi, 1 = En ucuz, 5 = En hızlı). */
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
  widgetFilters: number;
  softNotice: boolean;
};

type EnhanceController = {
  setSort: (mode: SortMode) => void;
  setBaggage: (wantOn: boolean) => boolean;
  clearFilters: () => void;
};

/**
 * Gölge köke pirpir stilini ekler; çift filtreleri, kırık logoları, havayolu adlarını, tarih şeridini,
 * İngilizce/bozuk metin yerelleştirmesini ve yumuşak filtre uyarısını yönetir.
 * Kullanıcı kararı: "En iyi" sekmesinde kart sırasına asla müdahale edilmez.
 */
function enhanceShadow(
  host: HTMLElement | null,
  l10n: WidgetL10n,
  onState: (s: WidgetUiState) => void,
  ctrlRef: React.MutableRefObject<EnhanceController | null>,
): () => void {
  if (!host) return () => {};
  let observer: MutationObserver | null = null;
  let defaultSectionsOpened = false;

  const processDom = (root: ShadowRoot) => {
    localizeWidgetTexts(root, l10n);
    syncMatrixVisibility(root);
    hideDuplicateFilterBlocks(root);
    enhanceAirlineLogos(root);
    if (!defaultSectionsOpened) {
      if (openDefaultFilterSections(root)) defaultSectionsOpened = true;
    }
  };

  const syncUi = (root: ShadowRoot) => {
    const ready = root.querySelector(CARD) !== null;
    const softNotice = root.querySelector('[data-testid="soft-tickets-notice"], [class*="SoftTicketsNotice-module__root___"]') !== null;
    onState({
      ready,
      widgetFilters: countWidgetNonBagFilters(root),
      softNotice,
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
        clickWidgetSort(root, SORT_INDEX[mode]);
      },
      setBaggage: (wantOn) => {
        const chip = findBaggageChip(root);
        if (!chip) return false;
        if (isBaggageActive(chip) !== wantOn) chip.click();
        return true;
      },
      clearFilters: () => {
        const bag = findBaggageChip(root);
        if (bag && isBaggageActive(bag)) bag.click();
        const panel = root.querySelector('[class*="FlightFiltersContent-module__root___"]');
        if (panel) {
          let unchecked = 0;
          panel.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked').forEach((inp) => {
            if (inp.closest('[class*="BaggageFilter-module__root___"]')) return;
            inp.click();
            unchecked++;
          });
          if (unchecked === 0) {
            panel
              .querySelectorAll<HTMLElement>('[class*="Popular-module__body___"] [class*="ClearableParameter-module__valueChanged___"]')
              .forEach((chip) => {
                if (chip.getAttribute("data-testid") !== "baggage-included-filter") chip.click();
              });
          }
          window.setTimeout(() => syncUi(root), 120);
        } else {
          root
            .querySelectorAll<HTMLElement>('[class*="FlightFiltersMobileMenu-module__list"] [class*="ClearableParameter-module__valueChanged___"]')
            .forEach((chip) => chip.click());
          window.setTimeout(() => syncUi(root), 120);
        }
      },
    };

    let raf = 0;
    observer = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        processDom(root);
        syncUi(root);
      });
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class", "checked"] });
    processDom(root);
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

/** 11.2 Kiwi tarzı bagaj kartı: masaüstünde sol sütunun en üstünde, telefonda Filtreler açılınca en üstte. */
function BaggageCard({
  bags,
  onChange,
  compact = false,
}: {
  bags: WidgetBags;
  onChange: (next: WidgetBags) => void;
  compact?: boolean;
}) {
  const t = useTranslations("results");
  const btnCls = `${compact ? "h-8 w-8 text-base" : "h-11 w-11 text-lg"} flex flex-none cursor-pointer items-center justify-center rounded-full border-2 border-solid border-primary bg-white font-display font-semibold leading-none text-primary disabled:cursor-not-allowed disabled:border-line disabled:text-muted focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-primary`;

  const row = (
    id: "cabin" | "checked",
    label: string,
    icon: React.ReactNode,
    value: number,
    max: number,
  ) => (
    <div className="flex items-center justify-between gap-2">
      <span className={`flex min-w-0 flex-1 items-center gap-1.5 font-bold leading-snug text-ink ${compact ? "text-[14px]" : "text-[15px]"}`}>
        <span className="flex-none">{icon}</span>
        <span className="min-w-0 break-words">{label}</span>
      </span>
      <span className={`flex flex-none items-center ${compact ? "gap-1.5" : "gap-2"}`}>
        <button
          type="button"
          data-testid={`bag-${id}-dec`}
          aria-label={t("filters.remove", { label })}
          disabled={value <= 0}
          onClick={() => onChange({ ...bags, [id]: Math.max(0, value - 1) })}
          className={btnCls}
        >
          −
        </button>
        <span data-testid={`bag-${id}-val`} aria-live="polite" className={`${compact ? "w-4 text-base" : "w-5 text-lg"} text-center font-display font-semibold text-ink`}>
          {value}
        </span>
        <button
          type="button"
          data-testid={`bag-${id}-inc`}
          aria-label={t("filters.add", { label })}
          disabled={value >= max}
          onClick={() => onChange({ ...bags, [id]: Math.min(max, value + 1) })}
          className={btnCls}
        >
          +
        </button>
      </span>
    </div>
  );

  return (
    <section
      aria-label={t("filters.bagsTitle")}
      data-testid={compact ? "live-baggage-desktop" : "live-baggage-mobile"}
      className={`flex flex-col gap-3 rounded-[24px] border-2 border-solid border-line bg-white ${compact ? "px-4 py-4" : "px-[18px] py-4"}`}
    >
      <h3 className="m-0 font-display text-[17px] font-semibold text-ink">{t("filters.bagsTitle")}</h3>
      {row("cabin", t("filters.cabinBag"), <CabinBagIcon />, bags.cabin, MAX_SEARCH_BAGS.cabin)}
      {row("checked", t("filters.checkedBag"), <CheckedBagIcon />, bags.checked, MAX_SEARCH_BAGS.checked)}
      <p className="m-0 text-[13px] font-semibold leading-snug text-muted">{t("liveCabinNote")}</p>
    </section>
  );
}

/**
 * Canlı uçuşlar (Travelpayouts White Label, Widget türü): sonuç sayfasının ana listesi.
 * Varsayılan sıralama kullanıcı kararıyla "En iyi" kalır (direkt + en ucuz ilk iki sırada).
 */
export function LiveWidget({ q, widgetId }: { q: MultiQuery; widgetId?: string | null }) {
  const t = useTranslations("results");
  const router = useRouter();
  const locale = useLocale();
  const { cur } = useCurrency();
  const src = liveWidgetSrc(widgetId);
  const gridWrapRef = useRef<HTMLDivElement>(null);
  const bagsBoxRef = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const ctrlRef = useRef<EnhanceController | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("best");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [bags, setBags] = useState<WidgetBags>(() => normalizeWidgetBags(q.bags));
  const [ui, setUi] = useState<WidgetUiState>({
    ready: false,
    widgetFilters: 0,
    softNotice: false,
  });

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
  const totalPax = paxTotal(q.pax);
  const matrixNote = t("liveMatrixNote");
  const paxNote = totalPax > 1 ? t("liveTotalFor", { count: totalPax }) : "";

  const l10n = useMemo<WidgetL10n>(
    () => ({
      select: t("liveSelect"),
      showMore: t("liveShowMore"),
      stopsCount: (count: number) => t("liveStopsCount", { count }),
      badges: {
        onlyDirect: t("liveBadge.onlyDirect"),
        cheapBag: t("liveBadge.cheapBag"),
        cheapLayover: t("liveBadge.cheapLayover"),
        cheap: t("liveBadge.cheap"),
        fast: t("liveBadge.fast"),
        optimal: t("liveBadge.optimal"),
        interest: t("liveBadge.interest"),
      },
    }),
    [t],
  );

  // Widget betiği yükleme, URL temizliği ve dil/para birimi çerez eşitlemesi
  useEffect(() => {
    if (!src) return;
    const w = window as W;
    const sp = new URLSearchParams(window.location.search);
    if (sp.has("from")) {
      const normalized = saveWidgetBags(route, q.bags ?? null);
      setBags(normalized);
    } else {
      const saved = readWidgetBags(route);
      if (saved) setBags(saved);
    }
    const initialLang = widgetLangFor(locale);
    const initialCur = widgetCurFor(readInitialCurrency() ?? cur);
    syncWidgetCookies(initialLang, initialCur);
    const clean = cleanWidgetUrl(window.location.href, route, { language: initialLang, currency: initialCur });
    if (document.getElementById(SCRIPT_ID)) {
      if (w.__tpwlBox !== box.current || w.__tpwlRoute !== route) {
        window.location.replace(clean);
      } else if (sp.has("from") || !sp.has("flightSearch")) {
        window.history.replaceState(window.history.state, "", clean);
      }
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

  // Widget içi tarih/rota değişiminde (`urlchange`) üst çubuğu ve bagajı eşitler; `adults` geri eklenmez
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

  // 11.2 Arama kutusu (`SearchForm`) ile çift yönlü bagaj eşitleme
  useEffect(() => {
    return subscribeWidgetBags(route, (next) => {
      setBags((prev) => (prev.cabin === next.cabin && prev.checked === next.checked ? prev : next));
    });
  }, [route]);

  // Gölge DOM gözlemcisi (aynı değerde gereksiz yeniden çizim önlenir)
  const updateUi = useCallback((next: WidgetUiState) => {
    setUi((prev) => {
      if (prev.ready === next.ready && prev.widgetFilters === next.widgetFilters && prev.softNotice === next.softNotice) {
        return prev;
      }
      return next;
    });
  }, []);
  useEffect(() => enhanceShadow(document.getElementById("tpwl-tickets"), l10n, updateUi, ctrlRef), [l10n, updateUi]);

  // 12.3, 12.5, 12.6 Host öznitelikleri ve CSS değişkenleri (tarih şeridi notu, bagaj gizleme, çoklu yolcu notu)
  const wantBagOn = bags.checked > 0;
  useEffect(() => {
    const el = document.getElementById("tpwl-tickets");
    if (!el) return;
    if (filtersOpen) el.setAttribute("data-filters", "open");
    else el.removeAttribute("data-filters");
    if (wantBagOn) el.setAttribute("data-baggage", "1");
    else el.removeAttribute("data-baggage");
    if (totalPax > 1) {
      el.setAttribute("data-multi-pax", "1");
      el.style.setProperty("--pirpir-pax-note", cssString(paxNote));
    } else {
      el.removeAttribute("data-multi-pax");
      el.style.removeProperty("--pirpir-pax-note");
    }
    el.style.setProperty("--pirpir-matrix-note", cssString(matrixNote));
  }, [filtersOpen, wantBagOn, totalPax, paxNote, matrixNote]);

  // 11.2 Kontrol edilen bagaj >= 1 ise widget'ın "Bagaj dahil" filtresi açılır, 0 ise kapanır
  useEffect(() => {
    if (!src) return;
    const host = document.getElementById("tpwl-tickets");
    if (!host) return;
    let tries = 0;
    let clicks = 0;
    const syncOnce = () => {
      const root = host.shadowRoot;
      if (!root) return false;
      const chip = findBaggageChip(root);
      if (!chip || !root.querySelector(CARD)) return false;
      const active = isBaggageActive(chip);
      if (active === wantBagOn) return true;
      if (clicks < 8) {
        chip.click();
        clicks++;
      }
      return false;
    };
    if (syncOnce()) return;
    const timer = window.setInterval(() => {
      if (syncOnce() || ++tries > 240) window.clearInterval(timer);
    }, 250);
    return () => window.clearInterval(timer);
  }, [src, wantBagOn, route]);

  // 11.2 & 11.4 Masaüstünde sol sütundaki Bagaj kartı ile widget filtreleri arasında tam 16 px boşluk (sıfır çakışma)
  const syncSidebarOffset = useCallback(() => {
    const wrap = gridWrapRef.current;
    const bagsBox = bagsBoxRef.current;
    const tickets = document.getElementById("tpwl-tickets");
    if (!wrap || !tickets) return;
    if (window.innerWidth < 1024 || !bagsBox) {
      tickets.style.setProperty("--pirpir-bags-offset", "0px");
      wrap.style.minHeight = "";
      return;
    }
    const bagsH = bagsBox.offsetHeight;
    const ticketsTop = box.current ? box.current.offsetTop : 0;
    const needed = Math.max(0, Math.ceil(bagsH + 16 - ticketsTop));
    tickets.style.setProperty("--pirpir-bags-offset", `${needed}px`);
    wrap.style.minHeight = `${bagsH + 24}px`;
  }, []);

  useEffect(() => {
    syncSidebarOffset();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(syncSidebarOffset) : null;
    if (ro) {
      if (bagsBoxRef.current) ro.observe(bagsBoxRef.current);
      if (gridWrapRef.current) ro.observe(gridWrapRef.current);
    }
    window.addEventListener("resize", syncSidebarOffset);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", syncSidebarOffset);
    };
  }, [syncSidebarOffset, ui.ready, ui.softNotice]);

  if (!src || q.from.length !== 1 || q.to.length !== 1) return null;
  preloadModule(src, { as: "script" });
  for (const host of ["https://tpwgt.com", "https://img.avs.io"]) preconnect(host, { crossOrigin: "anonymous" });

  const handleBagsChange = (next: WidgetBags) => {
    const normalized = saveWidgetBags(route, next);
    setBags(normalized);
    ctrlRef.current?.setBaggage(normalized.checked > 0);
  };

  const handleClearFilters = () => {
    const empty = saveWidgetBags(route, null);
    setBags(empty);
    ctrlRef.current?.clearFilters();
  };

  const bagFilterCount = (bags.checked > 0 ? 1 : 0) + (bags.cabin > 0 ? 1 : 0);
  const totalActiveFilters = ui.widgetFilters + bagFilterCount;

  const tabs: { id: SortMode; label: string }[] = [
    { id: "best", label: t("sort.best") },
    { id: "cheap", label: t("sort.cheap") },
    { id: "fast", label: t("sort.fast") },
  ];

  return (
    <section aria-labelledby="live-title" className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="live-title" className="m-0 font-display text-[24px] font-bold text-ink">{t("liveTitle")}</h2>
        <p className="m-0 text-[15px] font-semibold text-muted">{t("liveText")}</p>
      </div>

      {/* 11.1 & 12.4 Üst satır: solda Filtreler + Temizle; sağda sade tek parça sıralama sekme çubuğu (En iyi varsayılan) */}
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-center lg:gap-6">
        <div className="hidden items-center justify-between px-1 lg:flex">
          <span className="font-display text-[18px] font-semibold text-ink">{t("filters.title")}</span>
          {totalActiveFilters > 0 && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="min-h-[36px] cursor-pointer rounded-pill border-0 bg-transparent px-2 text-[14px] font-extrabold text-primary hover:underline focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-primary"
            >
              {t("filters.reset")}
            </button>
          )}
        </div>

        <div
          role="tablist"
          aria-label={t("sortLabel")}
          className="grid w-full grid-cols-3 divide-x divide-line overflow-hidden rounded-[20px] border-2 border-solid border-line bg-white"
        >
          {tabs.map((tab) => {
            const active = sortMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setSortMode(tab.id);
                  ctrlRef.current?.setSort(tab.id);
                }}
                className={`relative flex min-h-[52px] cursor-pointer items-center justify-center border-0 px-2 py-2.5 text-center font-display text-[15px] font-semibold leading-tight transition-colors lg:min-h-[56px] lg:px-4 lg:text-[17px] focus-visible:z-10 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[-3px] focus-visible:outline-primary ${
                  active ? "bg-white text-primary" : "bg-white text-ink hover:bg-field/70"
                }`}
              >
                <span className="max-w-full truncate">{tab.label}</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-x-0 bottom-0 h-[3px] transition-colors ${active ? "bg-primary" : "bg-transparent"}`}
                />
              </button>
            );
          })}
        </div>

        {/* 11.1 Mobilde (< 1024 px) sekme çubuğunun altında tek "Filtreler (N)" düğmesi */}
        <div className="flex items-center justify-between gap-2 lg:hidden">
          <button
            type="button"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((v) => !v)}
            className={`inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-pill border-2 border-solid px-5 py-2 font-display text-[15px] font-semibold transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-primary ${
              filtersOpen || totalActiveFilters > 0
                ? "border-primary bg-sky text-primary"
                : "border-line bg-white text-ink hover:border-primary"
            }`}
          >
            <span>{totalActiveFilters > 0 ? t("filters.active", { n: totalActiveFilters }) : t("filters.show")}</span>
          </button>
          {totalActiveFilters > 0 && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="min-h-[44px] cursor-pointer rounded-pill border-0 bg-transparent px-3 text-[14px] font-extrabold text-primary hover:underline focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-primary"
            >
              {t("filters.reset")}
            </button>
          )}
        </div>
      </div>

      {/* Ana içerik: solda Bagaj kartı + widget filtreleri; sağda durum uyarıları + tarih şeridi + uçuş kartları */}
      <div ref={gridWrapRef} className="relative flex w-full flex-col gap-4">
        {/* 11.2 Masaüstü sol sütun en üstü: Kiwi tarzı Bagaj sayaçları */}
        <div ref={bagsBoxRef} className="hidden lg:block lg:absolute lg:left-0 lg:top-0 lg:z-10 lg:w-[260px]">
          <BaggageCard bags={bags} onChange={handleBagsChange} compact />
        </div>

        {/* 11.2 Mobil Filtreler açılınca en üstte Bagaj sayaçları + Kapat başlığı */}
        {filtersOpen && (
          <div className="flex flex-col gap-3 lg:hidden">
            <div className="flex items-center justify-between px-1">
              <span className="font-display text-[18px] font-semibold text-ink">{t("filters.title")}</span>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="min-h-[40px] cursor-pointer rounded-pill border-2 border-solid border-line bg-white px-4 text-[14px] font-extrabold text-ink hover:border-primary"
              >
                {t("close")}
              </button>
            </div>
            <BaggageCard bags={bags} onChange={handleBagsChange} />
          </div>
        )}

        {/* 11.3 "Sonuç yok, filtreleri gevşettik" pirpir uyarı kutusu (#FFF4D6, 28px köşe, 7 dil) */}
        {ui.softNotice && (
          <div className="lg:ml-[284px]">
            <div
              role="status"
              data-testid="live-relaxed-notice"
              className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border-2 border-solid border-line bg-[#FFF4D6] px-5 py-4 text-[15px] font-bold text-ink"
            >
              <p className="m-0 min-w-0 flex-1 leading-snug">{t("liveRelaxed")}</p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="min-h-[44px] flex-none cursor-pointer rounded-pill border-2 border-solid border-line bg-white px-4 py-2 font-display text-[15px] font-semibold text-primary hover:border-primary focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {t("filters.reset")}
              </button>
            </div>
          </div>
        )}

        {/* 10.5 İlk kart gelene kadar (4–6 sn) küçük Pırpır ve kısa durum metni */}
        {!ui.ready && (
          <div className="lg:ml-[284px]">
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
      </div>
    </section>
  );
}
