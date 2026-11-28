import { test, expect, type Page } from "@playwright/test";
import { cleanWidgetUrl, widgetSyncQuery } from "../../src/lib/live-widget-url";
import { cleanDurationText, computeTabSummaries, formatTotalMins, parseDurationMins } from "../../src/lib/live-widget-summary";

/**
 * Gerçek Travelpayouts White Label widget'ının (`tpwgt.com/wl_web/main.js`) davranışını ve sınıf yapısını
 * taklit eden sahte betik (8.1–12.8):
 * - 8.1: `flightSearch` + `adults`/`depart_date` varsa UTC+ saat dilimi hatasını (-1 gün + replace) simüle eder.
 * - 10.1: `qX()` / `BX()` dil & para birimi önceliğini simüle eder (URL > tpwl_locale çerezi > defaultLanguage).
 * - 11.x & 12.x: `FlightMatrixDesktop`, sol filtreler (`Layovers-module__price`), 2 ve 3 aktarmalı kartlarda
 *   oransal `%2` dar havalimanı kodları ("SAWDB" senaryosu), mobil 12s/24s kart satırları, kırık logo, çok
 *   havayollu kart (`CD`+`TK`) ve Travelpayouts'un İngilizce/bozuk TR metinlerini çizer.
 */
const MOCK_WIDGET_SCRIPT = `
(() => {
  const url = new URL(window.location.href);
  const p = url.searchParams;
  const fs = p.get("flightSearch") || "";
  const legacyKeys = ["origin","origin_iata","destination","destination_iata","depart_date","return_date","adults","children","infants","trip_class"];
  const hasLegacy = legacyKeys.some((k) => p.has(k));

  if (fs && hasLegacy) {
    const m = /^([A-Z]{3})(\\d{2})(\\d{2})([A-Z]{3})(?:(\\d{2})(\\d{2}))?(.*)$/.exec(fs);
    if (m) {
      const shift = (dd, mm) => {
        const d = new Date(2027, Number(mm) - 1, Number(dd));
        const iso = d.toISOString().slice(0, 10);
        return iso.slice(8, 10) + iso.slice(5, 7);
      };
      const shifted = m[1] + shift(m[2], m[3]) + m[4] + (m[5] && m[6] ? shift(m[5], m[6]) : "") + m[7];
      if (shifted !== fs) {
        window.location.replace(url.pathname + "?flightSearch=" + shifted);
        return;
      }
    }
  }

  const readCookie = (name) => {
    const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return m ? decodeURIComponent(m[2]) : null;
  };
  const resolvedLang = (p.get("language") || p.get("locale") || readCookie("tpwl_locale") || window.TPWL_CONFIGURATION?.defaultLanguage || "en").toUpperCase();
  const resolvedCur = (p.get("currency") || readCookie("tpwl_currency") || window.TPWL_CONFIGURATION?.defaultCurrency || "EUR").toUpperCase();
  document.cookie = "tpwl_locale=" + resolvedLang.toLowerCase() + "; path=/";
  document.cookie = "tpwl_currency=" + resolvedCur + "; path=/";
  if (p.has("language") || p.has("locale") || p.has("currency")) {
    p.delete("language");
    p.delete("locale");
    p.delete("currency");
    window.history.replaceState(window.history.state, "", url.pathname + "?" + p.toString());
  }

  window.__mockWidgetLoads = (window.__mockWidgetLoads || 0) + 1;
  window.__mockWidgetLastConfig = {
    flightSearch: fs,
    search: window.location.search,
    lang: resolvedLang,
    cur: resolvedCur,
  };
  window.__mockState = {
    bagOn: false,
    directOn: false,
    sortIndex: 0,
    sortOpen: false,
    transfersOpen: false,
    airlinesOpen: false,
    matrixPrices: false,
    showMoreButton: true,
    showMoreCount: 0,
    selectedCard: null,
  };

  const host = document.getElementById("tpwl-tickets");
  if (!host) return;
  const sr = host.shadowRoot || host.attachShadow({ mode: "open" });

  // Gerçek widget CSS'inin sorunlu varsayılanlarını simüle eder
  const baseStyle = document.createElement("style");
  baseStyle.textContent = \`
    .FlightMatrixDesktop-module__root___mock { display: flex; margin-top: -20px; overflow: hidden; }
    .FlightMatrixDesktop-module__dateCellList___mock { display: flex; }
    .Flight-module__cardFlight___mock { display: flex; align-items: center; width: 100%; }
    .Flight-module__cardFlightInfo___mock { width: 70px; flex: none; }
    .Flight-module__cardFlightTravel___mock { flex: 1; min-width: 0; }
    .Flight-module__cardFlightTravelLineAirport___mock { display: flex; width: 100%; }
  \`;
  sr.appendChild(baseStyle);

  // Best sırası: c1 (direkt, €291) 1. sırada, c2 (en ucuz 2 aktarmalı, €267) 2. sırada, c3 (3 aktarmalı SAWDB testi, €284) 3. sırada
  const allCards = [
    {
      id: "c1",
      badge: resolvedLang === "NL" ? "The only direct flight" : "Tek direkt uçuş",
      base: 291,
      bag: 312,
      mins: 205,
      dep: resolvedLang === "EN" ? "03:55 pm" : "15:55",
      arr: resolvedLang === "EN" ? "09:25 pm" : "21:25",
      mobileStop: resolvedLang === "EN" ? "Direct flight" : "Direkt uçuş",
      dur: resolvedLang === "EN" ? "3h 30min" : "3s 25dk",
      direct: true,
      brokenLogo: false,
      airlines: ["CD", "TK"],
      codes: [{ code: "AMS", cls: "Origin", w: 50 }, { code: "ADB", cls: "Destination", w: 50 }],
    },
    {
      id: "c2",
      badge: resolvedLang === "NL" ? "Cheapest" : "En ucuz bilet",
      base: 267,
      bag: 318,
      mins: 370,
      dep: resolvedLang === "EN" ? "12:55 pm" : "12:55",
      arr: resolvedLang === "EN" ? "06:40 pm" : "18:40",
      mobileStop: resolvedLang === "TR" ? "1 konaklama" : "1 layover",
      dur: resolvedLang === "EN" ? "6h 10min" : "6s 10dk",
      direct: false,
      brokenLogo: true,
      airlines: ["PC"],
      codes: [
        { code: "AMS", cls: "Origin", w: 30 },
        { code: "WAW", cls: "Transfer", w: 20 },
        { code: "", cls: "Flight", w: 30 },
        { code: "SAW", cls: "Transfer", w: 15 },
        { code: "ADB", cls: "Destination", w: 5 },
      ],
    },
    {
      id: "c3",
      badge: resolvedLang === "NL" ? "May be of interest" : "",
      base: 284,
      bag: 336,
      mins: 2880,
      dep: "19:45",
      arr: "21:50",
      mobileStop: resolvedLang === "TR" ? "3 konaklama" : "3 layovers",
      dur: "2d",
      direct: false,
      brokenLogo: false,
      airlines: ["LO", "VF"],
      codes: [
        { code: "AMS", cls: "Origin", w: 12 },
        { code: "WAW", cls: "Transfer", w: 24 },
        { code: "", cls: "Flight", w: 16 },
        { code: "TIA", cls: "Transfer", w: 42 },
        { code: "", cls: "Flight", w: 2 },
        { code: "SAW", cls: "Transfer", w: 2 },
        { code: "ADB", cls: "Destination", w: 2 },
      ],
    },
  ];

  const render = () => {
    const curFs = new URLSearchParams(window.location.search).get("flightSearch") || fs;
    const st = window.__mockState;
    const relaxed = st.bagOn && st.directOn;
    const filtered = relaxed ? allCards : allCards.filter((c) => !st.directOn || c.direct);
    const list = filtered.slice().sort((a, b) => {
      if (st.sortIndex === 1) return (st.bagOn ? a.bag : a.base) - (st.bagOn ? b.bag : b.base);
      if (st.sortIndex === 5) return a.mins - b.mins;
      return 0;
    });

    let rootWrap = sr.getElementById("mock-root");
    if (!rootWrap) {
      rootWrap = document.createElement("div");
      rootWrap.id = "mock-root";
      rootWrap.className = "TicketsWidget-module__root___mock";
      sr.appendChild(rootWrap);
    }

    rootWrap.innerHTML = \`
      <div class="SearchProgressbar-module__searchProgressbar___mock TicketsWidget-module__progressBar___mock">
        <div class="SearchProgressbar-module__searchProgressbarWrap___mock">
          <div class="SearchProgressbar-module__progressInner___mock" style="width: 60%"></div>
        </div>
      </div>
      <div class="FlightMatrixDesktop-module__root___mock">
        <div class="FlightMatrixDesktop-module__flightMatrixButton___mock">Yakın tarihlerin fiyatları</div>
        <div class="FlightMatrixDesktop-module__dateCellList___mock">
          <div class="FlightMatrixDesktop-module__dateCell___mock">
            <div class="FlightMatrixDesktop-module__dateCellPrice___mock">\${st.matrixPrices ? '<svg class="FlightMatrixDesktop-module__noPriceIcon___mock" width="16" height="16"></svg>' : "-"}</div>
            <div class="FlightMatrixDesktop-module__dateCellDay___mock">Oca, 1 - 8</div>
          </div>
          <div class="FlightMatrixDesktop-module__dateCell___mock FlightMatrixDesktop-module__dateCellCurrent___mock">
            <div class="FlightMatrixDesktop-module__dateCellPrice___mock">\${st.matrixPrices ? "€ 267" : "-"}</div>
            <div class="FlightMatrixDesktop-module__dateCellDay___mock">Oca, 2 - 9</div>
          </div>
        </div>
        <div class="FlightMatrixDesktop-module__buttonBox___mock">
          <button type="button" class="FlightMatrixDesktop-module__showButton___mock">Show</button>
        </div>
      </div>
      <div class="FlightFiltersMobileMenu-module__root___mock">
        <div class="FlightFiltersMobileMenu-module__list___mock">
          <button type="button" class="ClearableParameter-module__root___mock \${st.bagOn ? "ClearableParameter-module__valueChanged___mock" : ""}" data-mock-bag="mobile">Bagaj dahil</button>
          <button type="button" class="ClearableParameter-module__root___mock \${st.directOn ? "ClearableParameter-module__valueChanged___mock" : ""}" data-mock-direct="mobile">Aktarmasız</button>
        </div>
      </div>
      <div class="FlightFilters-module__filerContainer___mock">
        <div class="FlightFiltersContent-module__root___mock FlightFilters-module__contentDesktop___mock">
          <div class="Popular-module__root___mock">
            <div class="Popular-module__header___mock">Popüler filtreler</div>
            <div class="Popular-module__body___mock">
              <button type="button" data-testid="baggage-included-filter" class="ClearableParameter-module__root___mock \${st.bagOn ? "ClearableParameter-module__valueChanged___mock" : ""}" data-mock-bag="desktop">Bagaj dahil</button>
              <button type="button" class="ClearableParameter-module__root___mock \${st.directOn ? "ClearableParameter-module__valueChanged___mock" : ""}" data-mock-direct="desktop">Aktarmasız</button>
            </div>
          </div>
          <div class="Layovers-module__root___mock">
            <button type="button" class="Expandable-module__header___mock \${st.transfersOpen ? "Expandable-module__isOpen___mock" : ""}" data-mock-transfers-sec="1">Aktarmalar</button>
            \${st.transfersOpen ? \`
              <label class="Checklist-module__option___mock">
                <input type="checkbox" \${st.directOn ? "checked" : ""} data-mock-direct-chk="1" />
                <div class="Layovers-module__label___mock">
                  <span>Direkt</span>
                  <span class="Layovers-module__price___mock" data-mock-layover-price="1">€ 186</span>
                </div>
              </label>
            \` : ""}
          </div>
          <div class="BaggageFilter-module__root___mock">
            <button type="button" class="Expandable-module__header___mock">Bagaj</button>
            <label class="Checklist-module__option___mock">
              <input type="checkbox" \${st.bagOn ? "checked" : ""} data-mock-bag-chk="1" />
              <span>Bagaj dahil</span>
            </label>
          </div>
          <div data-testid="expandable-alliances-filter">
            <button type="button" class="Expandable-module__header___mock \${st.airlinesOpen ? "Expandable-module__isOpen___mock" : ""}" data-mock-airlines="1">Havayolları</button>
          </div>
          <div data-testid="expandable-sort-filter">
            <button type="button" data-mock-sort-toggle="1">Göre sırala</button>
            \${st.sortOpen ? \`
              <div class="Radiolist-module__root___mock">
                \${["Önerilen", "Önce en ucuz", "Gidiş", "Varış", "Bekleme", "Yolculuk süresi", "Puanlama"].map((lbl, idx) => \`
                  <label class="Radiolist-module__option___mock">
                    <input type="radio" name="sort" value="\${idx}" \${st.sortIndex === idx ? "checked" : ""} data-mock-sort="\${idx}" />
                    <span>\${lbl}</span>
                  </label>
                \`).join("")}
              </div>
            \` : ""}
          </div>
        </div>
      </div>
      <div class="TicketsWidget-module__wrapper___mock">
        \${relaxed ? '<div class="SoftTicketsNotice-module__root___mock" data-testid="soft-tickets-notice"><p class="SoftTicketsNotice-module__text___mock">No tickets matching your parameters. We removed some filters and found a few available options that may be of interest</p></div>' : ""}
        \${list.map((x) => \`
          <div data-role="flight-card" data-card="\${x.id}" class="FlightCard-module__card___mock">
            \${x.badge ? \`<div data-role="flight-card-badge" class="FlightCard-module__cardBadges___mock" style="background-color: #cccccc">\${x.badge}</div>\` : ""}
            <div class="FlightCard-module__cardLeft___mock">
              <div data-testid="flight-card-price-\${x.id}" class="FlightCard-module__cardLeftPrice___mock">\${st.bagOn ? "€ " + x.bag : "€ " + x.base}</div>
              <div class="FlightCard-module__cardLeftBaggage___mock" data-testid="flight-card-bag">\${st.bagOn ? "Bagaj dahil" : "Bagaj +€"}</div>
              <div class="FlightCard-module__cardLeftButton___mock">
                <button type="button" class="Button-module__root___mock Button-module__primary___mock" data-mock-select="\${x.id}">\${resolvedLang === "EN" ? "Select ticket" : resolvedLang === "NL" ? "Selecteer ticket" : "Seçme bilet"}</button>
              </div>
            </div>
            <div class="FlightCard-module__cardRight___mock">
              <div class="FlightCard-module__cardTopLeft___mock">
                \${x.airlines.map((code) => \`
                  <div class="AirCompany-module__cardAirCompanyWrap___mock" data-role="flight-card-air-company" data-mock-airline="\${x.id}-\${code}">
                    <picture data-mock-logo="\${x.id}-\${code}">
                      <img src="\${x.brokenLogo ? "data:image/png;base64,invalid" : "https://img.avs.io/pics/al_square/" + code + "@avif?rs=fit:128:128"}" alt="" />
                    </picture>
                    \${x.airlines.length === 1 ? "Pegasus" : ""}
                  </div>
                \`).join("")}
              </div>
              <div class="FlightCard-module__cardTopRight___mock">
                <button type="button" class="FlightCard-module__share___mock">Paylaş</button>
              </div>
              <div class="FlightCard-module__cardBlockFlight___mock">
                <div class="Flight-module__cardFlight___mock" data-mock-flight-row="\${x.id}">
                  <div class="Flight-module__cardFlightInfo___mock">
                    <div class="Flight-module__cardFlightTime___mock" data-role="flight-departure-time">\${x.dep}</div>
                    <div class="Flight-module__cardFlightAirport___mock">AMS</div>
                  </div>
                  <div class="Flight-module__cardFlightTravel___mock">
                    <div class="Flight-module__cardFlightTravelTop___mock">
                      <div class="Flight-module__cardFlightTravelTime___mock">
                        <div class="Flight-module__cardFlightTravelMobile___mock" data-mock-mobile-stop="\${x.id}">\${x.mobileStop}</div>
                        <span>\${x.dur}</span>
                      </div>
                    </div>
                    <div class="Flight-module__cardFlightTravelLine___mock">
                      <div class="Flight-module__cardFlightTravelLineTop___mock">
                        \${x.direct ? "" : '<div class="Flight-module__cardFlightTravelLineTopTransfer___mock"></div>'}
                      </div>
                      <div class="Flight-module__cardFlightTravelLineAirport___mock" data-mock-airports="\${x.id}">
                        \${x.codes.map((c) => c.code ? \`
                          <div class="Flight-module__cardFlightTravelLine\${c.cls}___mock \${c.cls === "Origin" || c.cls === "Destination" ? "Flight-module__cardFlightTravelLineFlight___mock" : ""}" style="width: \${c.w}%">
                            <span class="Flight-module__airportCode___mock" data-role="flight-airport-code">\${c.code}</span>
                          </div>
                        \` : \`<div class="Flight-module__cardFlightTravelLineFlight___mock" style="width: \${c.w}%"></div>\`).join("")}
                      </div>
                    </div>
                  </div>
                  <div class="Flight-module__cardFlightInfo___mock">
                    <div class="Flight-module__cardFlightTime___mock" data-role="flight-arrival-time">\${x.arr}</div>
                    <div class="Flight-module__cardFlightAirport___mock">ADB</div>
                  </div>
                </div>
              </div>
              <span data-testid="flight-card-route">\${curFs}</span>
            </div>
          </div>
        \`).join("")}
        \${st.showMoreButton ? '<button type="button" class="TicketsWidget-module__moreTickets___mock" data-mock-more-tickets="1">Show more options</button>' : ""}
      </div>
    \`;

    rootWrap.querySelectorAll("[data-mock-bag], [data-mock-bag-chk]").forEach((btn) => {
      btn.addEventListener("click", () => {
        st.bagOn = !st.bagOn;
        render();
      });
    });
    rootWrap.querySelectorAll("[data-mock-direct], [data-mock-direct-chk]").forEach((btn) => {
      btn.addEventListener("click", () => {
        st.directOn = !st.directOn;
        render();
      });
    });
    rootWrap.querySelector("[data-mock-transfers-sec]")?.addEventListener("click", () => {
      st.transfersOpen = !st.transfersOpen;
      render();
    });
    rootWrap.querySelector("[data-mock-airlines]")?.addEventListener("click", () => {
      st.airlinesOpen = !st.airlinesOpen;
      render();
    });
    rootWrap.querySelector("[data-mock-sort-toggle]")?.addEventListener("click", () => {
      st.sortOpen = !st.sortOpen;
      render();
    });
    rootWrap.querySelectorAll("[data-mock-sort]").forEach((inp) => {
      inp.addEventListener("click", () => {
        st.sortIndex = Number(inp.getAttribute("data-mock-sort"));
        render();
      });
    });
    rootWrap.querySelector("[data-mock-more-tickets]")?.addEventListener("click", () => {
      st.showMoreCount++;
    });
    rootWrap.querySelectorAll("[data-mock-select]").forEach((btn) => {
      btn.addEventListener("click", () => {
        st.selectedCard = btn.getAttribute("data-mock-select");
      });
    });
  };
  window.__mockFillMatrix = () => {
    window.__mockState.matrixPrices = true;
    render();
  };
  render();
})();
`;

async function interceptWidget(page: Page) {
  await page.route("https://tpwgt.com/wl_web/main.js*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript; charset=utf-8",
      body: MOCK_WIDGET_SCRIPT,
    }),
  );
  // Gerçek ağa çıkmadan sahte logoları 1x1 SVG döndür (CD/TK/LO/VF broken sanılmasın)
  await page.route("https://img.avs.io/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "image/svg+xml",
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><rect width="36" height="36" fill="#2F5BD3"/></svg>`,
    }),
  );
}

test.describe("Canlı widget (8.1–12.8)", () => {
  test("Yardımcılar: cleanWidgetUrl (language/currency), widgetSyncQuery ve süre/özet hesaplama", async () => {
    const cleaned = cleanWidgetUrl(
      "https://www.flypirpir.nl/ara?from=AMS&to=ADB&date=2027-01-02&return=2027-01-09&adults=1&checkedBags=1&marker=812756",
      "AMS0201ADB09011",
      { language: "en", currency: "EUR" },
    );
    expect(cleaned).toBe("https://www.flypirpir.nl/ara?flightSearch=AMS0201ADB09011&marker=812756&language=en&currency=EUR");

    const synced = widgetSyncQuery("AMS1501ADB22011", "?flightSearch=AMS0201ADB09011&adults=1&currency=EUR");
    expect(synced).toEqual({ flightSearch: "AMS1501ADB22011", currency: "EUR" });

    expect(parseDurationMins("Direkt uçuş Seyahat süresi: 3s 25dk")).toBe(205);
    expect(parseDurationMins("Seyahat süresi: 1g 1s")).toBe(1500);
    expect(parseDurationMins("Travel time: 1d 2h 10min")).toBe(1570);
    expect(parseDurationMins("Travel time: 6h 10min")).toBe(370);
    expect(cleanDurationText("Seyahat süresi: 3s 25dk")).toBe("3s 25dk");
    expect(cleanDurationText("Seyahat süresi: 1g 1s")).toBe("1g 1s");
    expect(formatTotalMins(690, "nl")).toBe("11u 30min");
    expect(formatTotalMins(205, "tr")).toBe("3s 25dk");
    const sum = computeTabSummaries(
      [
        { price: 291, priceText: "€ 291", totalMins: 205, durText: "3s 25dk", direct: true },
        { price: 267, priceText: "€ 267", totalMins: 370, durText: "6s 10dk", direct: false },
        { price: 274, priceText: "€ 274", totalMins: 1500, durText: "25s", direct: false },
      ],
      "tr",
    );
    expect(sum).toEqual({
      best: { priceText: "€ 291", durText: "3s 25dk" },
      cheap: { priceText: "€ 267", durText: "6s 10dk" },
      fast: { priceText: "€ 291", durText: "3s 25dk" },
    });
  });

  test("8.1 Europe/Amsterdam saat diliminde 2–9 Ocak seçimi 1–8 Ocak'a kaymaz (ana sayfa → sonuç → yenileme → üst çubuk → urlchange)", async ({ page }) => {
    await interceptWidget(page);

    await page.goto("/", { waitUntil: "networkidle" });
    const fromInput = page.getByLabel("Nereden").first();
    await fromInput.click();
    await fromInput.fill("Amsterdam");
    const fromOpt = page.locator('[role="listbox"] [role="option"]').first();
    await expect(fromOpt).toBeVisible();
    await fromOpt.click();

    const toInput = page.getByLabel("Nereye").first();
    await toInput.click();
    await toInput.fill("İzmir");
    const opt = page.locator('[role="listbox"] [role="option"]').first();
    await expect(opt).toBeVisible();
    await opt.click();

    await page.locator("form button").filter({ hasText: /Ne zaman|Tarih seç|en ucuz/i }).first().click();
    for (let i = 0; i < 12; i++) {
      if ((await page.locator("span").filter({ hasText: /^ocak 202\d$/i }).count()) > 0) break;
      await page.getByRole("button", { name: /Sonraki ay/i }).click();
    }
    await page.locator('button[aria-label*="2 Oca"]').first().click();
    await page.locator('button[aria-label*="9 Oca"]').first().click();
    await page.getByRole("button", { name: "Tamam" }).click();
    await page.getByRole("button", { name: "Bilet bul" }).click();

    await page.waitForURL(/flightSearch=AMS0201ADB09011/, { timeout: 15_000 });
    expect(new URL(page.url()).searchParams.has("adults")).toBe(false);
    await expect(page.locator("#results-search")).toContainText("2 – 9 Oca");

    await page.reload({ waitUntil: "networkidle" });
    expect(page.url()).toContain("flightSearch=AMS0201ADB09011");
    await expect(page.locator("#results-search")).toContainText("2 – 9 Oca");

    await page.locator("#results-search button").filter({ hasText: /2 – 9 Oca/i }).first().click();
    await page.locator('button[aria-label*="12 Oca"]').first().click();
    await page.locator('button[aria-label*="19 Oca"]').first().click();
    await page.getByRole("button", { name: "Tamam" }).click();
    await Promise.all([
      page.waitForURL(/flightSearch=AMS1201ADB19011/, { timeout: 15_000 }),
      page.locator("#results-search button[type='submit']").click(),
    ]);
    await page.waitForLoadState("networkidle");
    expect(new URL(page.url()).searchParams.has("adults")).toBe(false);
    await expect(page.locator("#results-search")).toContainText("12 – 19 Oca");

    await page.evaluate(() => {
      window.history.replaceState(null, "", "/ara?flightSearch=AMS1501ADB22011");
      window.dispatchEvent(new CustomEvent("urlchange"));
    });
    await expect(page.locator("#results-search")).toContainText("15 – 22 Oca", { timeout: 10_000 });
    expect(new URL(page.url()).searchParams.has("adults")).toBe(false);
    await page.reload({ waitUntil: "networkidle" });
    expect(page.url()).toContain("flightSearch=AMS1501ADB22011");
    await expect(page.locator("#results-search")).toContainText("15 – 22 Oca");
  });

  test("11.2 & 12.5 Masaüstü bagaj eşitleme + bagaj seçiliyken sol sütun fiyatları gizlenir", async ({ page }) => {
    await interceptWidget(page);
    await page.goto("/ara?from=AMS&to=ADB&date=2027-01-02&return=2027-01-09&adults=1&checkedBags=1", { waitUntil: "networkidle" });
    await page.waitForURL(/flightSearch=AMS0201ADB09011/);

    const bagBox = page.getByTestId("live-baggage-desktop");
    await expect(bagBox.getByTestId("bag-checked-val")).toHaveText("1");
    await expect(page.locator('#results-search [aria-label*="1 kontrol edilen bagaj"]')).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __mockState?: { bagOn?: boolean } }).__mockState?.bagOn)).toBe(true);

    // 12.5 Bagaj 1 iken sol sütundaki bagajsız aktarma fiyatı gizlidir
    await expect.poll(() =>
      page.evaluate(() => {
        const p = document.getElementById("tpwl-tickets")?.shadowRoot?.querySelector<HTMLElement>('[data-mock-layover-price="1"]');
        return p ? getComputedStyle(p).display : "";
      }),
    ).toBe("none");

    // Yenilemede bagaj korunur
    await page.reload({ waitUntil: "networkidle" });
    await expect(bagBox.getByTestId("bag-checked-val")).toHaveText("1");
    await expect(page.locator('#results-search [aria-label*="1 kontrol edilen bagaj"]')).toBeVisible();

    // Sol sütundan 1 → 0 yapınca hem widget hem üst arama kutusu eşitlenir ve sol sütun fiyatları geri gelir
    await bagBox.getByTestId("bag-checked-dec").click();
    await expect(bagBox.getByTestId("bag-checked-val")).toHaveText("0");
    await expect(page.locator('#results-search [aria-label*="0 kontrol edilen bagaj"]')).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __mockState?: { bagOn?: boolean } }).__mockState?.bagOn)).toBe(false);
    await expect.poll(() =>
      page.evaluate(() => {
        const p = document.getElementById("tpwl-tickets")?.shadowRoot?.querySelector<HTMLElement>('[data-mock-layover-price="1"]');
        return p ? getComputedStyle(p).display : "";
      }),
    ).not.toBe("none");

    // Yenilemede 0 olarak kalır
    await page.reload({ waitUntil: "networkidle" });
    await expect(bagBox.getByTestId("bag-checked-val")).toHaveText("0");

    // Sol sütundan 0 → 1 + üst arama kutusunu yeniden gönderme flightSearch'ü bozmaz
    await bagBox.getByTestId("bag-checked-inc").click();
    await expect(bagBox.getByTestId("bag-checked-val")).toHaveText("1");
    await page.locator('#results-search button[type="submit"]').click();
    await page.waitForTimeout(200);
    expect(page.url()).toContain("flightSearch=AMS0201ADB09011");
  });

  test("10.1 & 12.7 TR/EN/NL/DE/FR dil eşitlemesi + widget rozet/Seç/Daha fazla/1 aktarma yerelleştirmesi", async ({ page }) => {
    await interceptWidget(page);

    await page.goto("/ara?flightSearch=AMS0201ADB09011", { waitUntil: "networkidle" });
    const trL10n = await page.evaluate(() => {
      const sr = document.getElementById("tpwl-tickets")?.shadowRoot;
      const btn = sr?.querySelector<HTMLElement>('[data-role="flight-card"] button[class*="Button-module__primary"]');
      const more = sr?.querySelector<HTMLElement>('[class*="TicketsWidget-module__moreTickets"]');
      const stop = sr?.querySelector<HTMLElement>('[data-mock-mobile-stop="c2"]');
      return {
        lang: (window as unknown as { __mockWidgetLastConfig?: { lang?: string } }).__mockWidgetLastConfig?.lang,
        rawBtn: btn?.textContent?.trim(),
        l10nBtn: btn?.dataset.pirpirL10n,
        l10nMore: more?.dataset.pirpirL10n,
        rawStop: stop?.textContent?.trim(),
        l10nStop: stop?.dataset.pirpirL10n,
      };
    });
    expect(trL10n).toEqual({
      lang: "TR",
      rawBtn: "Seçme bilet",
      l10nBtn: "Bileti seç",
      l10nMore: "Daha fazla uçuş göster",
      rawStop: "1 konaklama",
      l10nStop: "1 aktarma",
    });

    await page.goto("/nl/zoeken?flightSearch=AMS0201ADB09011", { waitUntil: "networkidle" });
    const nlL10n = await page.evaluate(() => {
      const sr = document.getElementById("tpwl-tickets")?.shadowRoot;
      const badges = [...(sr?.querySelectorAll<HTMLElement>('[data-role="flight-card-badge"]') ?? [])].map((b) => b.dataset.pirpirL10n);
      const btn = sr?.querySelector<HTMLElement>('[data-role="flight-card"] button[class*="Button-module__primary"]');
      const more = sr?.querySelector<HTMLElement>('[class*="TicketsWidget-module__moreTickets"]');
      return {
        lang: (window as unknown as { __mockWidgetLastConfig?: { lang?: string } }).__mockWidgetLastConfig?.lang,
        badges,
        l10nBtn: btn?.dataset.pirpirL10n,
        l10nMore: more?.dataset.pirpirL10n,
      };
    });
    expect(nlL10n).toEqual({
      lang: "NL",
      badges: ["Enige directe vlucht", "Goedkoopst", "Ook interessant"],
      l10nBtn: "Kies ticket",
      l10nMore: "Meer vluchten tonen",
    });

    await page.goto("/en/search?flightSearch=AMS0201ADB09011", { waitUntil: "networkidle" });
    expect(await page.evaluate(() => (window as unknown as { __mockWidgetLastConfig?: { lang?: string } }).__mockWidgetLastConfig?.lang)).toBe("EN");

    await page.goto("/de/suche?flightSearch=AMS0201ADB09011", { waitUntil: "networkidle" });
    expect(await page.evaluate(() => (window as unknown as { __mockWidgetLastConfig?: { lang?: string } }).__mockWidgetLastConfig?.lang)).toBe("DE");

    await page.goto("/fr/recherche?flightSearch=AMS0201ADB09011", { waitUntil: "networkidle" });
    expect(await page.evaluate(() => (window as unknown as { __mockWidgetLastConfig?: { lang?: string } }).__mockWidgetLastConfig?.lang)).toBe("EN");
  });

  test("12.1–12.8 Masaüstü (1440px): 'En iyi' sırası korunur, 2/3 aktarma kodları çakışmaz, çoklu yolcu notu, Corendon adı, tarih şeridi notu", async ({ page }) => {
    await interceptWidget(page);
    await page.goto("/ara?flightSearch=AMS0201ADB09011", { waitUntil: "networkidle" });

    // 1. Kullanıcı kararı: varsayılan "En iyi", direkt kart (c1, €291) 1. sırada, en ucuz (c2, €267) 2. sırada (en ucuza yeniden sıralanmaz!)
    const tablist = page.getByRole("tablist", { name: "Sıralama" });
    await expect(tablist.getByRole("tab")).toHaveCount(3);
    await expect(tablist.getByRole("tab", { selected: true })).toHaveCount(1);
    await expect(tablist.getByRole("tab", { name: /En iyi/i })).toHaveAttribute("aria-selected", "true");
    await expect(page.locator('[data-testid^="tab-summary-"]')).toHaveCount(0);

    const bestOrder = await page.evaluate(() =>
      [...(document.getElementById("tpwl-tickets")?.shadowRoot?.querySelectorAll('[data-role="flight-card"]') ?? [])].map((c) => c.getAttribute("data-card")),
    );
    expect(bestOrder).toEqual(["c1", "c2", "c3"]);

    // 2. 12.1 Çok aktarmalı uçuşlarda (2 aktarmalı c2 ve 3 aktarmalı c3) havalimanı kodları üst üste binmez ("SAWDB" yok)
    const codeCheck = await page.evaluate(() => {
      const sr = document.getElementById("tpwl-tickets")?.shadowRoot;
      const checkCard = (id: string) => {
        const codes = [...(sr?.querySelectorAll(`[data-mock-airports="${id}"] [data-role="flight-airport-code"]`) ?? [])];
        const rects = codes.map((c) => ({ text: c.textContent?.trim(), rect: c.getBoundingClientRect() }));
        let overlaps = 0;
        for (let i = 1; i < rects.length; i++) {
          if (rects[i].rect.left < rects[i - 1].rect.right + 1) overlaps++;
        }
        return { count: rects.length, overlaps };
      };
      return { c2: checkCard("c2"), c3: checkCard("c3") };
    });
    expect(codeCheck).toEqual({ c2: { count: 4, overlaps: 0 }, c3: { count: 5, overlaps: 0 } });

    // 3. 12.8 Çok havayollu kartta (CD + TK) logonun yanında havayolu adı etiketlenir, kırık logo gizlenir
    await expect.poll(() =>
      page.evaluate(() => {
        const sr = document.getElementById("tpwl-tickets")?.shadowRoot;
        const cd = sr?.querySelector<HTMLElement>('[data-mock-airline="c1-CD"]');
        const tk = sr?.querySelector<HTMLElement>('[data-mock-airline="c1-TK"]');
        const broken = sr?.querySelector<HTMLElement>('[data-mock-logo="c2-PC"]');
        const filters = sr?.querySelector<HTMLElement>('[class*="FlightFilters-module__filerContainer"]');
        const popWrap = sr?.querySelector<HTMLElement>('[class*="Popular-module__body___"]')?.parentElement;
        const widgetBag = sr?.querySelector<HTMLElement>('[class*="BaggageFilter-module__root___"]');
        const host = document.getElementById("tpwl-tickets");
        return {
          cdName: cd?.dataset.pirpirAirline,
          tkName: tk?.dataset.pirpirAirline,
          brokenHidden: broken ? getComputedStyle(broken).display === "none" : false,
          filtersNoScroll: filters ? getComputedStyle(filters).overflowY === "visible" && filters.scrollHeight <= filters.clientHeight + 2 : false,
          popularHidden: popWrap ? getComputedStyle(popWrap).display === "none" : false,
          widgetBagHidden: widgetBag ? getComputedStyle(widgetBag).display === "none" : false,
          singlePaxNoAttr: !host?.hasAttribute("data-multi-pax"),
          matrixNoteSet: host?.style.getPropertyValue("--pirpir-matrix-note")?.includes("Yaklaşık fiyat") ?? false,
        };
      }),
    ).toEqual({
      cdName: "Corendon Dutch Airlines",
      tkName: "Turkish Airlines",
      brokenHidden: true,
      filtersNoScroll: true,
      popularHidden: true,
      widgetBagHidden: true,
      singlePaxNoAttr: true,
      matrixNoteSet: true,
    });

    // 4. Tarih şeridi açılınca çakışma yok + "Show" ve "noPriceIcon" gizli
    await page.evaluate(() => (window as unknown as { __mockFillMatrix?: () => void }).__mockFillMatrix?.());
    const rects = await page.evaluate(() => {
      const tabRect = document.querySelector('[role="tablist"]')?.getBoundingClientRect();
      const bagRect = document.querySelector('[data-testid="live-baggage-desktop"]')?.getBoundingClientRect();
      const sr = document.getElementById("tpwl-tickets")?.shadowRoot;
      const matrixRect = sr?.querySelector<HTMLElement>('[class*="FlightMatrixDesktop-module__root"]')?.getBoundingClientRect();
      const filtersRect = sr?.querySelector<HTMLElement>('[class*="FlightFilters-module__filerContainer"]')?.getBoundingClientRect();
      const cardRect = sr?.querySelector<HTMLElement>('[data-role="flight-card"]')?.getBoundingClientRect();
      return {
        tabBottom: tabRect?.bottom ?? 0,
        matrixTop: matrixRect?.top ?? 0,
        matrixBottom: matrixRect?.bottom ?? 0,
        cardTop: cardRect?.top ?? 0,
        bagBottom: bagRect?.bottom ?? 0,
        filtersTop: filtersRect?.top ?? 0,
      };
    });
    expect(rects.matrixTop - rects.tabBottom).toBeGreaterThanOrEqual(14);
    expect(rects.cardTop).toBeGreaterThanOrEqual(rects.matrixBottom);
    expect(rects.filtersTop - rects.bagBottom).toBeGreaterThanOrEqual(12);

    // 5. Bagaj + Direkt → gevşetilmiş filtre uyarısı görünür ve temizlenir
    await page.getByTestId("live-baggage-desktop").getByTestId("bag-checked-inc").click();
    await page.locator("#tpwl-tickets").locator('[data-mock-direct-chk="1"]').click();
    const relaxedNotice = page.getByTestId("live-relaxed-notice");
    await expect(relaxedNotice).toBeVisible();
    await relaxedNotice.getByRole("button", { name: "Filtreleri temizle" }).click();
    await expect(relaxedNotice).toHaveCount(0);

    // 6. Sekme değiştirme (En ucuz → index 1, En hızlı → index 5) ve kart tıklamaları
    await tablist.getByRole("tab", { name: /En ucuz/i }).click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __mockState?: { sortIndex?: number } }).__mockState?.sortIndex)).toBe(1);
    await tablist.getByRole("tab", { name: /En hızlı/i }).click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __mockState?: { sortIndex?: number } }).__mockState?.sortIndex)).toBe(5);
    await page.locator("#tpwl-tickets").locator('[data-mock-more-tickets="1"]').click();
    await page.locator("#tpwl-tickets").locator('[data-mock-select="c1"]').click();
    const clickState = await page.evaluate(() => (window as unknown as { __mockState?: { showMoreCount?: number; selectedCard?: string | null } }).__mockState);
    expect(clickState?.showMoreCount).toBe(1);
    expect(clickState?.selectedCard).toBe("c1");
  });

  test("12.2 & 12.6 Mobil (360, 375, 390 px, TR 24s & EN 12s, 2 yetişkin): saat/süre çakışmaz, kenar boşluğu >= 12px, '2 kişi toplam' notu görünür", async ({ page }) => {
    await interceptWidget(page);

    for (const width of [360, 375, 390]) {
      await page.setViewportSize({ width, height: 844 });
      for (const path of [
        "/ara?from=AMS&to=ADB&date=2027-01-02&return=2027-01-09&adults=2",
        "/en/search?from=AMS&to=ADB&date=2027-01-02&return=2027-01-09&adults=2",
      ]) {
        await page.context().clearCookies();
        await page.goto(path, { waitUntil: "networkidle" });
        const m = await page.evaluate(() => {
          const host = document.getElementById("tpwl-tickets");
          const sr = host?.shadowRoot;
          const card = sr?.querySelector<HTMLElement>('[data-role="flight-card"]');
          const dep = card?.querySelector<HTMLElement>('[data-role="flight-departure-time"]')?.getBoundingClientRect();
          const arr = card?.querySelector<HTMLElement>('[data-role="flight-arrival-time"]')?.getBoundingClientRect();
          const travel = card?.querySelector<HTMLElement>('[class*="Flight-module__cardFlightTravelTime___"]')?.getBoundingClientRect();
          const cardRect = card?.getBoundingClientRect();
          return {
            overflow: document.documentElement.scrollWidth > window.innerWidth,
            multiPaxAttr: host?.getAttribute("data-multi-pax"),
            paxNote: host?.style.getPropertyValue("--pirpir-pax-note") ?? "",
            depArrGap: dep && arr ? Math.round(arr.left - dep.right) : -1,
            travelBelowTimes: dep && arr && travel ? travel.top >= Math.max(dep.bottom, arr.bottom) - 1 : false,
            leftPad: dep && cardRect ? Math.round(dep.left - cardRect.left) : -1,
            rightPad: arr && cardRect ? Math.round(cardRect.right - arr.right) : -1,
          };
        });
        expect(m.overflow).toBe(false);
        expect(m.multiPaxAttr).toBe("1");
        expect(m.paxNote).toMatch(/2 kişi toplam|Total for 2 travellers/);
        expect(m.depArrGap).toBeGreaterThanOrEqual(8);
        expect(m.travelBelowTimes).toBe(true);
        expect(m.leftPad).toBeGreaterThanOrEqual(12);
        expect(m.rightPad).toBeGreaterThanOrEqual(12);
      }
    }

    // Mobil Filtreler (1) açılınca üstte Bagaj sayacı + 1 → 0 eşitlemesi
    await page.setViewportSize({ width: 390, height: 844 });
    await page.context().clearCookies();
    await page.goto("/ara?from=AMS&to=ADB&date=2027-01-02&return=2027-01-09&adults=1&checkedBags=1", { waitUntil: "networkidle" });
    const filtersBtn = page.getByRole("button", { name: "Filtreler (1)" });
    await expect(filtersBtn).toBeVisible();
    await filtersBtn.click();
    const mobileBags = page.getByTestId("live-baggage-mobile");
    await expect(mobileBags.getByTestId("bag-checked-val")).toHaveText("1");
    await mobileBags.getByTestId("bag-checked-dec").click();
    await expect(mobileBags.getByTestId("bag-checked-val")).toHaveText("0");
    await expect.poll(() => page.evaluate(() => (window as unknown as { __mockState?: { bagOn?: boolean } }).__mockState?.bagOn)).toBe(false);
  });
});
