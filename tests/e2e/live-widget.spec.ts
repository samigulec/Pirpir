import { test, expect, type Page } from "@playwright/test";
import { cleanWidgetUrl, widgetSyncQuery } from "../../src/lib/live-widget-url";
import { cleanDurationText, computeTabSummaries, formatTotalMins, parseDurationMins } from "../../src/lib/live-widget-summary";

/**
 * Gerçek Travelpayouts White Label widget'ının (`tpwgt.com/wl_web/main.js`) davranışını ve sınıf yapısını
 * taklit eden sahte betik:
 * - 8.1: `flightSearch` + `adults`/`depart_date` varsa UTC+ saat dilimi hatasını (-1 gün + replace) simüle eder.
 * - 10.1: `qX()` / `BX()` dil & para birimi önceliğini simüle eder (URL > tpwl_locale çerezi > defaultLanguage).
 * - 11.x: gerçek sınıf ön ekleriyle `FlightMatrixDesktop` (negatif -20px üst boşluk + `noPriceIcon` + `Show` düğmesi),
 *   `Popular` çipleri, `BaggageFilter`, `Transfers` (Aktarmasız), `SoftTicketsNotice`, kırık havayolu logosu,
 *   açılır bölümler ve kartları çizer.
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
    showMoreButton: false,
    showMoreCount: 0,
    selectedCard: null,
  };

  const host = document.getElementById("tpwl-tickets");
  if (!host) return;
  const sr = host.shadowRoot || host.attachShadow({ mode: "open" });

  // Gerçek widget CSS'inin sorunlu varsayılanlarını simüle eder (FlightMatrixDesktop margin-top: -20px!)
  const baseStyle = document.createElement("style");
  baseStyle.textContent = \`
    .FlightMatrixDesktop-module__root___mock { display: flex; margin-top: -20px; overflow: hidden; }
    .FlightMatrixDesktop-module__dateCellList___mock { display: flex; }
  \`;
  sr.appendChild(baseStyle);

  const allCards = [
    { id: "c1", badge: "Tek direkt uçuş", base: 291, bag: 312, mins: 205, dur: "Direkt uçuş Seyahat süresi: 3s 25dk", direct: true, brokenLogo: false },
    { id: "c2", badge: "En ucuz bilet", base: 267, bag: 318, mins: 370, dur: "Seyahat süresi: 6s 10dk", direct: false, brokenLogo: true },
    { id: "c3", badge: "", base: 284, bag: 336, mins: 410, dur: "Seyahat süresi: 6s 50dk", direct: false, brokenLogo: false },
  ];

  const render = () => {
    const curFs = new URLSearchParams(window.location.search).get("flightSearch") || fs;
    const st = window.__mockState;
    // Bagaj + Direkt birlikte seçilince gerçek widget gibi gevşetilmiş sonuçlar + soft-tickets-notice göster
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
          <div class="Transfers-module__root___mock">
            <button type="button" class="Expandable-module__header___mock \${st.transfersOpen ? "Expandable-module__isOpen___mock" : ""}" data-mock-transfers-sec="1">Aktarmalar</button>
            \${st.transfersOpen ? \`
              <label class="Checklist-module__option___mock">
                <input type="checkbox" \${st.directOn ? "checked" : ""} data-mock-direct-chk="1" />
                <span>Direkt</span>
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
                <button type="button" class="Button-module__root___mock Button-module__primary___mock" data-mock-select="\${x.id}">\${resolvedLang === "EN" ? "Select ticket" : "Seçme bilet"}</button>
              </div>
            </div>
            <div class="FlightCard-module__cardRight___mock">
              <div class="AirCompany-module__cardAirCompanyWrap___mock" data-role="flight-card-air-company">
                <picture data-mock-logo="\${x.id}">
                  <img src="\${x.brokenLogo ? "data:image/png;base64,invalid" : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36'%3E%3Crect width='36' height='36' fill='%232F5BD3'/%3E%3C/svg%3E"}" alt="" />
                </picture>
                <span>Test Air</span>
              </div>
              <div class="FlightCard-module__cardTopRight___mock">
                <button type="button" class="FlightCard-module__share___mock">Paylaş</button>
              </div>
              <div class="Flight-module__cardFlightTime___mock">13:40</div>
              <div class="Flight-module__cardFlightTravelTime___mock">\${x.dur}</div>
              <div class="Flight-module__cardFlightTravelLineTop___mock">
                \${x.direct ? "" : '<div class="Flight-module__cardFlightTravelLineTopTransfer___mock"></div>'}
              </div>
              <span data-testid="flight-card-route">\${curFs}</span>
            </div>
          </div>
        \`).join("")}
        \${st.showMoreButton ? '<button type="button" class="TicketsWidget-module__moreTickets___mock" data-mock-more-tickets="1">Daha fazla uçuş göster</button>' : ""}
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
  window.__mockSetShowMore = (v) => {
    window.__mockState.showMoreButton = v;
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
}

test.describe("Canlı widget (8.1–8.3, 9.1–9.5, 10.1–10.6 ve 11.1–11.6)", () => {
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

  test("11.2 Masaüstü bagaj eşitleme: checkedBags=1, 0→1→0 sayaç, üst arama kutusu eşit, yeniden gönderme URL'yi bozmaz", async ({ page }) => {
    await interceptWidget(page);
    await page.goto("/ara?from=AMS&to=ADB&date=2027-01-02&return=2027-01-09&adults=1&checkedBags=1", { waitUntil: "networkidle" });
    await page.waitForURL(/flightSearch=AMS0201ADB09011/);

    const bagBox = page.getByTestId("live-baggage-desktop");
    await expect(bagBox.getByTestId("bag-checked-val")).toHaveText("1");
    await expect(page.locator('#results-search [aria-label*="1 kontrol edilen bagaj"]')).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __mockState?: { bagOn?: boolean } }).__mockState?.bagOn)).toBe(true);

    // Yenilemede bagaj korunur
    await page.reload({ waitUntil: "networkidle" });
    await expect(bagBox.getByTestId("bag-checked-val")).toHaveText("1");
    await expect(page.locator('#results-search [aria-label*="1 kontrol edilen bagaj"]')).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __mockState?: { bagOn?: boolean } }).__mockState?.bagOn)).toBe(true);

    // Sol sütundan 1 → 0 yapınca hem widget hem üst arama kutusu anında eşitlenir
    await bagBox.getByTestId("bag-checked-dec").click();
    await expect(bagBox.getByTestId("bag-checked-val")).toHaveText("0");
    await expect(page.locator('#results-search [aria-label*="0 kontrol edilen bagaj"]')).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __mockState?: { bagOn?: boolean } }).__mockState?.bagOn)).toBe(false);

    // Yenilemede 0 olarak kalır (tekrar açılmaz)
    await page.reload({ waitUntil: "networkidle" });
    await expect(bagBox.getByTestId("bag-checked-val")).toHaveText("0");
    await expect.poll(() => page.evaluate(() => (window as unknown as { __mockState?: { bagOn?: boolean } }).__mockState?.bagOn)).toBe(false);

    // Sol sütundan 0 → 1 yapınca widget fiyatı güncellenir ve arama kutusu yeniden gönderilse bile flightSearch korunur
    await bagBox.getByTestId("bag-checked-inc").click();
    await expect(bagBox.getByTestId("bag-checked-val")).toHaveText("1");
    await expect(page.locator('#results-search [aria-label*="1 kontrol edilen bagaj"]')).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __mockState?: { bagOn?: boolean } }).__mockState?.bagOn)).toBe(true);
    await page.locator('#results-search button[type="submit"]').click();
    await page.waitForTimeout(200);
    expect(page.url()).toContain("flightSearch=AMS0201ADB09011");
  });

  test("10.1 TR ziyaretinden sonra aynı oturumda EN, NL, DE ve FR (→ EN) sayfalarında widget dili sayfa diliyle aynı olur", async ({ page }) => {
    await interceptWidget(page);

    await page.goto("/ara?flightSearch=AMS0201ADB09011", { waitUntil: "networkidle" });
    expect(await page.evaluate(() => (window as unknown as { __mockWidgetLastConfig?: { lang?: string } }).__mockWidgetLastConfig?.lang)).toBe("TR");

    await page.goto("/en/search?flightSearch=AMS0201ADB09011", { waitUntil: "networkidle" });
    const enState = await page.evaluate(() => ({
      lang: (window as unknown as { __mockWidgetLastConfig?: { lang?: string } }).__mockWidgetLastConfig?.lang,
      btn: document.getElementById("tpwl-tickets")?.shadowRoot?.querySelector('[class*="Button-module__primary"]')?.textContent?.trim(),
    }));
    expect(enState).toEqual({ lang: "EN", btn: "Select ticket" });

    await page.goto("/nl/zoeken?flightSearch=AMS0201ADB09011", { waitUntil: "networkidle" });
    expect(await page.evaluate(() => (window as unknown as { __mockWidgetLastConfig?: { lang?: string } }).__mockWidgetLastConfig?.lang)).toBe("NL");

    await page.goto("/de/suche?flightSearch=AMS0201ADB09011", { waitUntil: "networkidle" });
    expect(await page.evaluate(() => (window as unknown as { __mockWidgetLastConfig?: { lang?: string } }).__mockWidgetLastConfig?.lang)).toBe("DE");

    await page.goto("/fr/recherche?flightSearch=AMS0201ADB09011", { waitUntil: "networkidle" });
    expect(await page.evaluate(() => (window as unknown as { __mockWidgetLastConfig?: { lang?: string } }).__mockWidgetLastConfig?.lang)).toBe("EN");
  });

  test("11.1–11.6 Masaüstü (1440px): tek seçimli sekme çubuğu, tek filtre kontrolü, iç kaydırmasız sol sütun, çakışma yok, gevşetilmiş filtre uyarısı", async ({ page }) => {
    await interceptWidget(page);
    await page.goto("/ara?flightSearch=AMS0201ADB09011", { waitUntil: "networkidle" });

    // 1. robots noindex + Fiyat trendleri ve Fiyat alarmı kur yok
    expect((await page.locator('meta[name="robots"]').getAttribute("content")) ?? "").toContain("noindex");
    await expect(page.getByRole("button", { name: /Fiyat trendleri/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Fiyat alarmı kur/i })).toHaveCount(0);

    // 2. Sıralama sekme çubuğu tek seçimli (role="tab"), üstte Sadece direkt / Bagaj dahil hapı yok
    const tablist = page.getByRole("tablist", { name: "Sıralama" });
    const tabs = tablist.getByRole("tab");
    await expect(tabs).toHaveCount(3);
    await expect(tablist.getByRole("tab", { selected: true })).toHaveCount(1);
    await expect(tablist.getByRole("tab", { name: /En iyi/i })).toHaveAttribute("aria-selected", "true");
    await expect(tablist.getByText(/Sadece direkt|Bagaj dahil/i)).toHaveCount(0);

    // Sekme değiştirince yine yalnızca 1 sekme seçili ve widget sıralaması güncellenir
    await tablist.getByRole("tab", { name: /En ucuz/i }).click();
    await expect(tablist.getByRole("tab", { selected: true })).toHaveCount(1);
    await expect(tablist.getByRole("tab", { name: /En ucuz/i })).toHaveAttribute("aria-selected", "true");
    await expect.poll(() => page.evaluate(() => (window as unknown as { __mockState?: { sortIndex?: number } }).__mockState?.sortIndex)).toBe(1);

    await tablist.getByRole("tab", { name: /En hızlı/i }).click();
    await expect(tablist.getByRole("tab", { selected: true })).toHaveCount(1);
    await expect(tablist.getByRole("tab", { name: /En hızlı/i })).toHaveAttribute("aria-selected", "true");
    await expect.poll(() => page.evaluate(() => (window as unknown as { __mockState?: { sortIndex?: number } }).__mockState?.sortIndex)).toBe(5);

    // 3. Tek filtre kontrolü + sol sütunda iç kaydırma yok + kırık logo gizli
    await expect.poll(async () =>
      page.evaluate(() => {
        const sr = document.getElementById("tpwl-tickets")?.shadowRoot;
        const card = sr?.querySelector<HTMLElement>('[data-role="flight-card"]');
        const filters = sr?.querySelector<HTMLElement>('[class*="FlightFilters-module__filerContainer"]');
        const popularWrap = sr?.querySelector<HTMLElement>('[class*="Popular-module__body___"]')?.parentElement;
        const widgetBagSec = sr?.querySelector<HTMLElement>('[class*="BaggageFilter-module__root___"]');
        const widgetSortSec = sr?.querySelector<HTMLElement>('[data-testid="expandable-sort-filter"]');
        const matrix = sr?.querySelector<HTMLElement>('[class*="FlightMatrixDesktop-module__root"]');
        const share = sr?.querySelector<HTMLElement>('[class*="FlightCard-module__share"]');
        const transfersSec = sr?.querySelector<HTMLElement>('[data-mock-transfers-sec="1"]');
        const airlinesSec = sr?.querySelector<HTMLElement>('[data-mock-airlines="1"]');
        const brokenLogo = sr?.querySelector<HTMLElement>('[data-mock-logo="c2"]');
        if (!card || !filters || !matrix || !share || !popularWrap || !widgetBagSec || !widgetSortSec || !brokenLogo) return null;
        return {
          cardRadius: getComputedStyle(card).borderRadius,
          cardShadow: getComputedStyle(card).boxShadow,
          filtersDisplay: getComputedStyle(filters).display,
          filtersOverflowY: getComputedStyle(filters).overflowY,
          filtersNoInnerScroll: filters.scrollHeight <= filters.clientHeight + 2,
          popularHidden: getComputedStyle(popularWrap).display === "none",
          widgetBagHidden: getComputedStyle(widgetBagSec).display === "none",
          widgetSortHidden: getComputedStyle(widgetSortSec).display === "none",
          matrixHiddenWhenEmpty: getComputedStyle(matrix).display === "none",
          shareHidden: getComputedStyle(share).display === "none",
          transfersOpen: /isOpen/.test(transfersSec?.className ?? ""),
          airlinesClosed: !/isOpen/.test(airlinesSec?.className ?? ""),
          brokenLogoHidden: getComputedStyle(brokenLogo).display === "none",
        };
      }),
    ).toEqual({
      cardRadius: "28px",
      cardShadow: "none",
      filtersDisplay: "block",
      filtersOverflowY: "visible",
      filtersNoInnerScroll: true,
      popularHidden: true,
      widgetBagHidden: true,
      widgetSortHidden: true,
      matrixHiddenWhenEmpty: true,
      shareHidden: true,
      transfersOpen: true,
      airlinesClosed: true,
      brokenLogoHidden: true,
    });

    // 4. Tarih şeridine fiyat gelince görünür, Show ve noPriceIcon gizlidir, öğeler üst üste binmez (>= 16px boşluk)
    await page.evaluate(() => (window as unknown as { __mockFillMatrix?: () => void }).__mockFillMatrix?.());
    await expect.poll(async () =>
      page.evaluate(() => {
        const sr = document.getElementById("tpwl-tickets")?.shadowRoot;
        const m = sr?.querySelector<HTMLElement>('[class*="FlightMatrixDesktop-module__root"]');
        return m ? getComputedStyle(m).display : "";
      }),
    ).not.toBe("none");

    const rects = await page.evaluate(() => {
      const tabRect = document.querySelector('[role="tablist"]')?.getBoundingClientRect();
      const bagRect = document.querySelector('[data-testid="live-baggage-desktop"]')?.getBoundingClientRect();
      const sr = document.getElementById("tpwl-tickets")?.shadowRoot;
      const matrix = sr?.querySelector<HTMLElement>('[class*="FlightMatrixDesktop-module__root"]');
      const matrixRect = matrix?.getBoundingClientRect();
      const filtersRect = sr?.querySelector<HTMLElement>('[class*="FlightFilters-module__filerContainer"]')?.getBoundingClientRect();
      const cardRect = sr?.querySelector<HTMLElement>('[data-role="flight-card"]')?.getBoundingClientRect();
      const showBox = sr?.querySelector<HTMLElement>('[class*="FlightMatrixDesktop-module__buttonBox___"]');
      const noPriceIcon = sr?.querySelector<HTMLElement>('[class*="FlightMatrixDesktop-module__noPriceIcon___"]');
      return {
        tabBottom: tabRect?.bottom ?? 0,
        matrixTop: matrixRect?.top ?? 0,
        matrixBottom: matrixRect?.bottom ?? 0,
        cardTop: cardRect?.top ?? 0,
        bagBottom: bagRect?.bottom ?? 0,
        filtersTop: filtersRect?.top ?? 0,
        showHidden: showBox ? getComputedStyle(showBox).display === "none" : false,
        noPriceIconHidden: noPriceIcon ? getComputedStyle(noPriceIcon).display === "none" : false,
      };
    });
    // Çakışma yok: sekme çubuğu → tarih şeridi (>= 14px), tarih şeridi → ilk kart, bagaj kartı → sol filtreler
    expect(rects.matrixTop - rects.tabBottom).toBeGreaterThanOrEqual(14);
    expect(rects.cardTop).toBeGreaterThanOrEqual(rects.matrixBottom);
    expect(rects.filtersTop - rects.bagBottom).toBeGreaterThanOrEqual(12);
    expect(rects.showHidden).toBe(true);
    expect(rects.noPriceIconHidden).toBe(true);

    // 5. Tüm kartlar DOM'dayken özetler görünür; kısmi listede ("Daha fazla" varsa) yanıltıcı özet gizlenir
    await expect(page.getByTestId("tab-summary-cheap")).toContainText("€ 267");
    await expect(page.getByTestId("tab-summary-fast")).toContainText("€ 291");
    await page.evaluate(() => (window as unknown as { __mockSetShowMore?: (v: boolean) => void }).__mockSetShowMore?.(true));
    await expect(page.getByTestId("tab-summary-cheap")).toHaveCount(0);
    await expect(page.getByTestId("tab-summary-fast")).toHaveCount(0);

    // 6. Bagaj + Direkt = sonuç yok → widget'ın İngilizce uyarısı gizli, pirpir'in #FFF4D6 uyarısı görünür ve temizlenir
    await page.getByTestId("live-baggage-desktop").getByTestId("bag-checked-inc").click();
    await page.locator("#tpwl-tickets").locator('[data-mock-direct-chk="1"]').click();
    const relaxedNotice = page.getByTestId("live-relaxed-notice");
    await expect(relaxedNotice).toBeVisible();
    await expect(relaxedNotice).toContainText("Seçtiğin filtrelere uyan uçuş yok");
    const rawNoticeHidden = await page.evaluate(() => {
      const n = document.getElementById("tpwl-tickets")?.shadowRoot?.querySelector<HTMLElement>('[data-testid="soft-tickets-notice"]');
      return n ? getComputedStyle(n).display === "none" : false;
    });
    expect(rawNoticeHidden).toBe(true);

    // Uyarı kutusu ile tarih şeridi / ilk kart üst üste binmez
    const noticeGeom = await page.evaluate(() => {
      const n = document.querySelector('[data-testid="live-relaxed-notice"]')?.getBoundingClientRect();
      const m = document.getElementById("tpwl-tickets")?.shadowRoot?.querySelector<HTMLElement>('[class*="FlightMatrixDesktop-module__root"]')?.getBoundingClientRect();
      return { noticeBottom: n?.bottom ?? 0, matrixTop: m?.top ?? 0 };
    });
    expect(noticeGeom.matrixTop).toBeGreaterThanOrEqual(noticeGeom.noticeBottom);

    // "Filtreleri temizle" hem bagajı hem direkti temizler, uyarı kapanır
    await relaxedNotice.getByRole("button", { name: "Filtreleri temizle" }).click();
    await expect(relaxedNotice).toHaveCount(0);
    await expect(page.getByTestId("live-baggage-desktop").getByTestId("bag-checked-val")).toHaveText("0");
    await expect(page.locator('#results-search [aria-label*="0 kontrol edilen bagaj"]')).toBeVisible();

    // 7. Kart aksiyonları çalışır
    await page.locator("#tpwl-tickets").locator('[data-mock-more-tickets="1"]').click();
    await page.locator("#tpwl-tickets").locator('[data-mock-select="c1"]').click();
    const clickState = await page.evaluate(() => (window as unknown as { __mockState?: { showMoreCount?: number; selectedCard?: string | null } }).__mockState);
    expect(clickState?.showMoreCount).toBe(1);
    expect(clickState?.selectedCard).toBe("c1");
  });

  test("11.1–11.6 Mobil (390px): tek parça sekme çubuğu, altında 'Filtreler (1)' düğmesi, açılınca üstte Bagaj sayaçları + taşma yok", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await interceptWidget(page);
    await page.goto("/ara?from=AMS&to=ADB&date=2027-01-02&return=2027-01-09&adults=1&checkedBags=1", { waitUntil: "networkidle" });
    await page.waitForURL(/flightSearch=AMS0201ADB09011/);

    const tablist = page.getByRole("tablist", { name: "Sıralama" });
    await expect(tablist.getByRole("tab")).toHaveCount(3);
    await expect(page.getByTestId("tab-summary-cheap")).toBeHidden();

    // "Filtreler (1)" görünür, sol sütun kapalı, yatay taşma yok
    const filtersBtn = page.getByRole("button", { name: "Filtreler (1)" });
    await expect(filtersBtn).toBeVisible();
    const closedMetrics = await page.evaluate(() => {
      const sr = document.getElementById("tpwl-tickets")?.shadowRoot;
      const filters = sr?.querySelector<HTMLElement>('[class*="FlightFilters-module__filerContainer"]');
      const selectBtn = sr?.querySelector<HTMLElement>('[class*="Button-module__primary"]');
      return {
        filtersDisplay: filters ? getComputedStyle(filters).display : "",
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        selectBtnHeight: selectBtn ? Math.round(selectBtn.getBoundingClientRect().height) : 0,
      };
    });
    expect(closedMetrics.filtersDisplay).toBe("none");
    expect(closedMetrics.overflow).toBe(false);
    expect(closedMetrics.selectBtnHeight).toBeGreaterThanOrEqual(44);

    // "Filtreler (1)" açılınca en üstte Bagaj sayaçları + hemen altında widget filtreleri açılır
    await filtersBtn.click();
    const mobileBags = page.getByTestId("live-baggage-mobile");
    await expect(mobileBags).toBeVisible();
    await expect(mobileBags.getByTestId("bag-checked-val")).toHaveText("1");
    const openMetrics = await page.evaluate(() => {
      const sr = document.getElementById("tpwl-tickets")?.shadowRoot;
      const filters = sr?.querySelector<HTMLElement>('[class*="FlightFilters-module__filerContainer"]');
      const bagRect = document.querySelector('[data-testid="live-baggage-mobile"]')?.getBoundingClientRect();
      const filtersRect = filters?.getBoundingClientRect();
      return {
        filtersDisplay: filters ? getComputedStyle(filters).display : "",
        bagBottom: bagRect?.bottom ?? 0,
        filtersTop: filtersRect?.top ?? 0,
        overflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    });
    expect(openMetrics.filtersDisplay).toBe("block");
    expect(openMetrics.filtersTop).toBeGreaterThanOrEqual(openMetrics.bagBottom);
    expect(openMetrics.overflow).toBe(false);

    // Mobilde bagajı 1 → 0 yapınca sayaç 0 olur ve widget güncellenir
    await mobileBags.getByTestId("bag-checked-dec").click();
    await expect(mobileBags.getByTestId("bag-checked-val")).toHaveText("0");
    await expect.poll(() => page.evaluate(() => (window as unknown as { __mockState?: { bagOn?: boolean } }).__mockState?.bagOn)).toBe(false);
  });
});
