import { test, expect, type Page } from "@playwright/test";
import { cleanWidgetUrl, widgetSyncQuery } from "../../src/lib/live-widget-url";
import { cleanDurationText, computeTabSummaries, parseDurationMins } from "../../src/lib/live-widget-summary";

/**
 * Gerçek Travelpayouts White Label widget'ının (`tpwgt.com/wl_web/main.js`) davranışını ve sınıf yapısını
 * taklit eden sahte betik:
 * - 8.1: `flightSearch` + `adults`/`depart_date` varsa UTC+ saat dilimi hatasını (-1 gün + replace) simüle eder.
 * - 10.1: `qX()` / `BX()` önceliğini simüle eder: URL `?language=` → `tpwl_locale` çerezi → `defaultLanguage`;
 *   okuduktan sonra `language` ve `currency` parametrelerini adresten siler (`Fc()`).
 * - 10.2–10.6: gerçek sınıf ön ekleriyle `FlightMatrixDesktop`, sol filtre sütunu, açılır bölümler, kartlar ve
 *   süre/aktarma bilgilerini çizer.
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

  // Gerçek qX() / BX() dil & para birimi çözümlemesi (URL > tpwl_locale çerezi > defaultLanguage)
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
    sortIndex: 1,
    sortOpen: false,
    bagSectionOpen: false,
    airlinesOpen: false,
    matrixPrices: false,
    showMoreCount: 0,
    selectedCard: null,
    mobileFiltersOpened: false,
  };

  const host = document.getElementById("tpwl-tickets");
  if (!host) return;
  const sr = host.shadowRoot || host.attachShadow({ mode: "open" });

  const allCards = [
    { id: "c1", badge: "Tek direkt uçuş", base: 291, bag: 312, mins: 205, dur: "Direkt uçuş Seyahat süresi: 3s 25dk", direct: true },
    { id: "c2", badge: "En ucuz bilet", base: 267, bag: 318, mins: 370, dur: "Seyahat süresi: 6s 10dk", direct: false },
    { id: "c3", badge: "", base: 284, bag: 336, mins: 410, dur: "Seyahat süresi: 6s 50dk", direct: false },
  ];

  const render = () => {
    const curFs = new URLSearchParams(window.location.search).get("flightSearch") || fs;
    const st = window.__mockState;
    const list = allCards
      .filter((c) => !st.directOn || c.direct)
      .slice()
      .sort((a, b) => (st.sortIndex === 5 ? a.mins - b.mins : 0));

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
        <div class="FlightMatrixDesktop-module__dateCell___mock">
          <div class="FlightMatrixDesktop-module__dateCellDay___mock">Oca, 1 - 8</div>
          <div class="FlightMatrixDesktop-module__dateCellPrice___mock">\${st.matrixPrices ? "€ 255" : "-"}</div>
        </div>
        <div class="FlightMatrixDesktop-module__dateCell___mock">
          <div class="FlightMatrixDesktop-module__dateCellDay___mock">Oca, 2 - 9</div>
          <div class="FlightMatrixDesktop-module__dateCellPrice___mock">\${st.matrixPrices ? "€ 267" : "-"}</div>
        </div>
      </div>
      <div class="FlightFiltersMobileMenu-module__root___mock">
        <div class="FlightFiltersMobileMenu-module__list___mock">
          <button type="button" class="ClearableParameter-module__root___mock FlightFiltersMobileMenu-module__chip___mock \${st.bagOn ? "ClearableParameter-module__valueChanged___mock" : ""}" data-mock-bag="mobile">Bagaj dahil</button>
          <button type="button" class="ClearableParameter-module__root___mock FlightFiltersMobileMenu-module__chip___mock \${st.directOn ? "ClearableParameter-module__valueChanged___mock" : ""}" data-mock-direct="mobile">Aktarmasız</button>
          <button type="button" class="FlightFiltersMobileMenu-module__chip___mock" data-mock-more-filters="1">Daha fazla</button>
        </div>
      </div>
      <div class="FlightFilters-module__filerContainer___mock">
        <div class="FlightFiltersContent-module__root___mock FlightFilters-module__contentDesktop___mock">
          <div class="Popular-module__body___mock">
            <button type="button" data-testid="baggage-included-filter" class="ClearableParameter-module__root___mock \${st.bagOn ? "ClearableParameter-module__valueChanged___mock" : ""}" data-mock-bag="desktop">Bagaj dahil</button>
            <button type="button" class="ClearableParameter-module__root___mock \${st.directOn ? "ClearableParameter-module__valueChanged___mock" : ""}" data-mock-direct="desktop">Aktarmasız</button>
          </div>
          <div class="BaggageFilter-module__root___mock">
            <button type="button" class="Expandable-module__header___mock \${st.bagSectionOpen ? "Expandable-module__isOpen___mock" : ""}" data-mock-bag-sec="1">Bagaj</button>
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
        <button type="button" class="TicketsWidget-module__moreTickets___mock" data-mock-more-tickets="1">Daha fazla uçuş göster</button>
      </div>
    \`;

    rootWrap.querySelectorAll("[data-mock-bag]").forEach((btn) => {
      btn.addEventListener("click", () => {
        st.bagOn = !st.bagOn;
        render();
      });
    });
    rootWrap.querySelectorAll("[data-mock-direct]").forEach((btn) => {
      btn.addEventListener("click", () => {
        st.directOn = !st.directOn;
        render();
      });
    });
    rootWrap.querySelector("[data-mock-bag-sec]")?.addEventListener("click", () => {
      st.bagSectionOpen = !st.bagSectionOpen;
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
    rootWrap.querySelector("[data-mock-more-filters]")?.addEventListener("click", () => {
      st.mobileFiltersOpened = true;
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
}

test.describe("Canlı widget (8.1–8.3, 9.1–9.5 ve 10.1–10.6)", () => {
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
    expect(parseDurationMins("Travel time: 6h 10min")).toBe(370);
    expect(cleanDurationText("Seyahat süresi: 3s 25dk")).toBe("3s 25dk");
    const sum = computeTabSummaries([
      { price: 291, priceText: "€ 291", totalMins: 205, durText: "3s 25dk", direct: true },
      { price: 267, priceText: "€ 267", totalMins: 370, durText: "6s 10dk", direct: false },
    ]);
    expect(sum).toEqual({
      cheap: { priceText: "€ 267", durText: "6s 10dk" },
      fast: { priceText: "€ 291", durText: "3s 25dk" },
      direct: { priceText: "€ 291", durText: "3s 25dk" },
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

  test("8.2 Masaüstünde checkedBags=1 'Bagaj dahil' filtresini açar, yenilemede korur, kullanıcı kapatınca tekrar açmaz", async ({ page }) => {
    await interceptWidget(page);
    await page.goto("/ara?from=AMS&to=ADB&date=2027-01-02&return=2027-01-09&adults=1&checkedBags=1", { waitUntil: "networkidle" });
    await page.waitForURL(/flightSearch=AMS0201ADB09011/);

    const bagPill = page.getByRole("toolbar").getByRole("button", { name: "Bagaj dahil" });
    await expect(bagPill).toHaveAttribute("aria-pressed", "true");

    await page.reload({ waitUntil: "networkidle" });
    await expect(bagPill).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('#results-search [aria-label*="1 kontrol edilen bagaj"]')).toBeVisible();

    await bagPill.click();
    await expect(bagPill).toHaveAttribute("aria-pressed", "false");
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await expect(bagPill).toHaveAttribute("aria-pressed", "false");
  });

  test("10.1 TR ziyaretinden sonra aynı oturumda EN, NL, DE ve FR (→ EN) sayfalarında widget dili sayfa diliyle aynı olur", async ({ page }) => {
    await interceptWidget(page);

    // 1. Önce Türkçe ziyaret → tpwl_locale=tr çerezi oluşur
    await page.goto("/ara?flightSearch=AMS0201ADB09011", { waitUntil: "networkidle" });
    const trCfg = await page.evaluate(() => (window as unknown as { __mockWidgetLastConfig?: { lang?: string } }).__mockWidgetLastConfig);
    expect(trCfg?.lang).toBe("TR");

    // 2. Aynı oturumda /en/search → eski tpwl_locale=tr çerezi ezilir, widget EN olur
    await page.goto("/en/search?flightSearch=AMS0201ADB09011", { waitUntil: "networkidle" });
    const enState = await page.evaluate(() => ({
      lang: (window as unknown as { __mockWidgetLastConfig?: { lang?: string } }).__mockWidgetLastConfig?.lang,
      btn: document.getElementById("tpwl-tickets")?.shadowRoot?.querySelector('[class*="Button-module__primary"]')?.textContent?.trim(),
    }));
    expect(enState).toEqual({ lang: "EN", btn: "Select ticket" });

    // 3. NL ve DE → kendi dilleri; FR → widget'ta desteklenmediği için EN
    await page.goto("/nl/zoeken?flightSearch=AMS0201ADB09011", { waitUntil: "networkidle" });
    expect(await page.evaluate(() => (window as unknown as { __mockWidgetLastConfig?: { lang?: string } }).__mockWidgetLastConfig?.lang)).toBe("NL");

    await page.goto("/de/suche?flightSearch=AMS0201ADB09011", { waitUntil: "networkidle" });
    expect(await page.evaluate(() => (window as unknown as { __mockWidgetLastConfig?: { lang?: string } }).__mockWidgetLastConfig?.lang)).toBe("DE");

    await page.goto("/fr/recherche?flightSearch=AMS0201ADB09011", { waitUntil: "networkidle" });
    expect(await page.evaluate(() => (window as unknown as { __mockWidgetLastConfig?: { lang?: string } }).__mockWidgetLastConfig?.lang)).toBe("EN");
  });

  test("10.2–10.6 Masaüstü (1440px): yapışkan sol filtre sütunu, özetli sekmeler, fiyatsız tarih şeridi gizli, Fiyat trendleri/alarmı yok", async ({ page }) => {
    await interceptWidget(page);
    await page.goto("/ara?flightSearch=AMS0201ADB09011", { waitUntil: "networkidle" });

    // 1. robots noindex + Fiyat trendleri ve Fiyat alarmı kur yok (8.4/10.6)
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots ?? "").toContain("noindex");
    await expect(page.getByRole("button", { name: /Fiyat trendleri/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Fiyat alarmı kur/i })).toHaveCount(0);

    // 2. Masaüstünde sol filtre sütunu görünür ve yapışkan (sticky), "Filtreler" hapı toolbar'da gizli
    await expect(page.getByRole("toolbar").getByRole("button", { name: /Filtreler/i })).toBeHidden();
    await expect.poll(async () =>
      page.evaluate(() => {
        const sr = document.getElementById("tpwl-tickets")?.shadowRoot;
        const card = sr?.querySelector<HTMLElement>('[data-role="flight-card"]');
        const filters = sr?.querySelector<HTMLElement>('[class*="FlightFilters-module__filerContainer"]');
        const matrix = sr?.querySelector<HTMLElement>('[class*="FlightMatrixDesktop-module__root"]');
        const share = sr?.querySelector<HTMLElement>('[class*="FlightCard-module__share"]');
        const bagSec = sr?.querySelector<HTMLElement>('[data-mock-bag-sec="1"]');
        const airlinesSec = sr?.querySelector<HTMLElement>('[data-mock-airlines="1"]');
        if (!card || !filters || !matrix || !share) return null;
        return {
          cardRadius: getComputedStyle(card).borderRadius,
          cardShadow: getComputedStyle(card).boxShadow,
          filtersDisplay: getComputedStyle(filters).display,
          filtersPosition: getComputedStyle(filters).position,
          matrixDisplayWhenEmpty: getComputedStyle(matrix).display,
          shareDisplay: getComputedStyle(share).display,
          bagSecOpen: /isOpen/.test(bagSec?.className ?? ""),
          airlinesClosed: !/isOpen/.test(airlinesSec?.className ?? ""),
        };
      }),
    ).toEqual({
      cardRadius: "28px",
      cardShadow: "none",
      filtersDisplay: "block",
      filtersPosition: "sticky",
      matrixDisplayWhenEmpty: "none",
      shareDisplay: "none",
      bagSecOpen: true,
      airlinesClosed: true,
    });

    // 3. Tarih şeridine fiyat sonradan gelince görünür (10.2)
    await page.evaluate(() => (window as unknown as { __mockFillMatrix?: () => void }).__mockFillMatrix?.());
    await expect.poll(async () =>
      page.evaluate(() => {
        const sr = document.getElementById("tpwl-tickets")?.shadowRoot;
        const m = sr?.querySelector<HTMLElement>('[class*="FlightMatrixDesktop-module__root"]');
        return m ? getComputedStyle(m).display : "";
      }),
    ).not.toBe("none");

    // 4. Özetli sıralama sekmeleri kartlardaki en düşük fiyat ve süreyi gösterir (10.3/10.6)
    await expect(page.getByTestId("tab-summary-cheap")).toContainText("€ 267");
    await expect(page.getByTestId("tab-summary-fast")).toContainText("€ 291");
    await expect(page.getByTestId("tab-summary-fast")).toContainText("3s 25dk");
    await expect(page.getByTestId("tab-summary-direct")).toContainText("€ 291");

    // 5. Sıralama, Sadece direkt, Temizle ve kart aksiyonları çalışır
    const toolbar = page.getByRole("toolbar");
    await toolbar.getByRole("button", { name: /En hızlı/i }).click();
    await expect.poll(async () =>
      page.evaluate(() => (window as unknown as { __mockState?: { sortIndex?: number } }).__mockState?.sortIndex),
    ).toBe(5);

    await toolbar.getByRole("button", { name: /Sadece direkt/i }).click();
    await expect(page.getByRole("button", { name: "Filtreleri temizle" })).toBeVisible();
    await page.getByRole("button", { name: "Filtreleri temizle" }).click();
    await expect(page.getByRole("button", { name: "Filtreleri temizle" })).toHaveCount(0);

    await page.locator("#tpwl-tickets").locator('[data-mock-more-tickets="1"]').click();
    await page.locator("#tpwl-tickets").locator('[data-mock-select="c1"]').click();
    const clickState = await page.evaluate(() => (window as unknown as { __mockState?: { showMoreCount?: number; selectedCard?: string | null } }).__mockState);
    expect(clickState?.showMoreCount).toBe(1);
    expect(clickState?.selectedCard).toBe("c1");
  });

  test("10.4–10.6 Mobil (390px): sol sütun gizli, 'Filtreler (1)' aktif sayacıyla mobil pencereyi açar, taşma yok", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await interceptWidget(page);
    await page.goto("/ara?from=AMS&to=ADB&date=2027-01-02&return=2027-01-09&adults=1&checkedBags=1", { waitUntil: "networkidle" });
    await page.waitForURL(/flightSearch=AMS0201ADB09011/);

    const toolbar = page.getByRole("toolbar");
    const bagPill = toolbar.getByRole("button", { name: "Bagaj dahil" });
    await expect(bagPill).toHaveAttribute("aria-pressed", "true");

    // Mobilde sekme özet satırı gizlidir, yalnızca etiket görünür
    await expect(page.getByTestId("tab-summary-cheap")).toBeHidden();

    // Sol sütun mobilde display:none, "Filtreler (1)" aktif sayacıyla görünür ve tıklanınca mobil modal açılır
    const filtersBtn = toolbar.getByRole("button", { name: "Filtreler (1)" });
    await expect(filtersBtn).toBeVisible();
    const metrics = await page.evaluate(() => {
      const sr = document.getElementById("tpwl-tickets")?.shadowRoot;
      const filters = sr?.querySelector<HTMLElement>('[class*="FlightFilters-module__filerContainer"]');
      const selectBtn = sr?.querySelector<HTMLElement>('[class*="Button-module__primary"]');
      return {
        filtersDisplay: filters ? getComputedStyle(filters).display : "",
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        selectBtnHeight: selectBtn ? Math.round(selectBtn.getBoundingClientRect().height) : 0,
      };
    });
    expect(metrics.filtersDisplay).toBe("none");
    expect(metrics.overflow).toBe(false);
    expect(metrics.selectBtnHeight).toBeGreaterThanOrEqual(44);

    await filtersBtn.click();
    const mobOpened = await page.evaluate(() => (window as unknown as { __mockState?: { mobileFiltersOpened?: boolean } }).__mockState?.mobileFiltersOpened);
    expect(mobOpened).toBe(true);
  });
});
