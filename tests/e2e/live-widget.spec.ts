import { test, expect, type Page } from "@playwright/test";
import { cleanWidgetUrl, widgetSyncQuery } from "../../src/lib/live-widget-url";

/**
 * Gerçek Travelpayouts White Label widget'ının (`tpwgt.com/wl_web/main.js`) davranışını ve sınıf yapısını
 * taklit eden sahte betik:
 * - Adreste `flightSearch` ile birlikte `adults`/`children`/`infants`/`depart_date`/`return_date` varsa, gerçek
 *   widget'ın UTC+ saat dilimlerindeki hatasını (yerel gece yarısı + `.toISOString()` → -1 gün kayma + `location.replace`)
 *   aynen uygular; böylece 8.1 gerileme testi bu hatayı anında yakalar.
 * - Temiz `flightSearch` geldiğinde `#tpwl-tickets` içine açık shadow root kurar, gerçek sınıf ön ekleriyle kartları,
 *   rozetleri, paylaşım düğmesini, açılır filtre panelini, sıralama radyolarını ve mobil menüyü çizer.
 */
const MOCK_WIDGET_SCRIPT = `
(() => {
  const url = new URL(window.location.href);
  const p = url.searchParams;
  const fs = p.get("flightSearch") || "";
  const legacyKeys = ["origin","origin_iata","destination","destination_iata","depart_date","return_date","adults","children","infants","trip_class"];
  const hasLegacy = legacyKeys.some((k) => p.has(k));

  // Gerçek widget'ın Vl() -> Fq() saat dilimi hatasını aynen simüle et
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

  window.__mockWidgetLoads = (window.__mockWidgetLoads || 0) + 1;
  window.__mockWidgetLastConfig = {
    flightSearch: fs,
    search: window.location.search,
    lang: window.TPWL_CONFIGURATION?.defaultLanguage,
    cur: window.TPWL_CONFIGURATION?.defaultCurrency,
  };
  window.__mockState = {
    bagOn: false,
    directOn: false,
    sortIndex: 1,
    sortOpen: false,
    showMoreCount: 0,
    selectedCard: null,
    mobileFiltersOpened: false,
  };

  const host = document.getElementById("tpwl-tickets");
  if (!host) return;
  const sr = host.shadowRoot || host.attachShadow({ mode: "open" });

  const allCards = [
    { id: "c1", badge: "Tek direkt uçuş", base: 291, bag: 312, mins: 205, direct: true },
    { id: "c2", badge: "En ucuz bilet", base: 267, bag: 318, mins: 370, direct: false },
    { id: "c3", badge: "", base: 284, bag: 336, mins: 410, direct: false },
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
      <div class="SearchProgressbar-module__searchProgressbar___mock">
        <div class="SearchProgressbar-module__searchProgressbarWrap___mock">
          <div class="SearchProgressbar-module__progressInner___mock" style="width: 60%"></div>
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
                <button type="button" class="Button-module__root___mock Button-module__primary___mock" data-mock-select="\${x.id}">Seçme bilet</button>
              </div>
            </div>
            <div class="FlightCard-module__cardRight___mock">
              <div class="FlightCard-module__cardTopRight___mock">
                <button type="button" class="FlightCard-module__share___mock">Paylaş</button>
              </div>
              <div class="Flight-module__cardFlightTime___mock">13:40</div>
              <div class="Flight-module__cardFlightTravelLineTop___mock"></div>
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

test.describe("Canlı widget (8.1–8.3 ve 9.1–9.5)", () => {
  test("cleanWidgetUrl ve widgetSyncQuery çakışan parametreleri (adults/date/return) temizler", async () => {
    const cleaned = cleanWidgetUrl(
      "https://www.flypirpir.nl/ara?from=AMS&to=ADB&date=2027-01-02&return=2027-01-09&adults=1&checkedBags=1&marker=812756",
      "AMS0201ADB09011",
    );
    expect(cleaned).toBe("https://www.flypirpir.nl/ara?flightSearch=AMS0201ADB09011&marker=812756");

    const synced = widgetSyncQuery("AMS1501ADB22011", "?flightSearch=AMS0201ADB09011&adults=1&currency=EUR");
    expect(synced).toEqual({ flightSearch: "AMS1501ADB22011", currency: "EUR" });
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

    const cardRoute = await page.evaluate(() =>
      document.getElementById("tpwl-tickets")?.shadowRoot?.querySelector('[data-testid="flight-card-route"]')?.textContent?.trim(),
    );
    expect(cardRoute).toBe("AMS0201ADB09011");

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

    await expect.poll(async () =>
      page.evaluate(() => {
        const sr = document.getElementById("tpwl-tickets")?.shadowRoot;
        const chip = sr?.querySelector('[data-testid="baggage-included-filter"]');
        const price = sr?.querySelector('[data-testid^="flight-card-price"]')?.textContent?.trim();
        return { active: /valueChanged/.test(chip?.className ?? ""), price };
      }),
    ).toEqual({ active: true, price: "€ 312" });

    // Üst hap çubuğundaki "Bagaj dahil" düğmesi de aktif görünür
    const bagPill = page.getByRole("toolbar").getByRole("button", { name: "Bagaj dahil" });
    await expect(bagPill).toHaveAttribute("aria-pressed", "true");

    // Sayfa yenilenince bagaj filtresi ve üst çubuktaki seçim korunur
    await page.reload({ waitUntil: "networkidle" });
    await expect(bagPill).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('#results-search [aria-label*="1 kontrol edilen bagaj"]')).toBeVisible();

    // Kullanıcı üstteki "Bagaj dahil" hapından kapatınca yenilemede tekrar zorla açılmaz
    await bagPill.click();
    await expect(bagPill).toHaveAttribute("aria-pressed", "false");
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await expect(bagPill).toHaveAttribute("aria-pressed", "false");
  });

  test("8.2 & 9.3 Mobil (390px): bagaj filtresi açılır, yenilemede korunur, yatay taşma yok ve düğmeler >= 44px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await interceptWidget(page);
    await page.goto("/ara?from=AMS&to=ADB&date=2027-01-02&return=2027-01-09&adults=1&checkedBags=1", { waitUntil: "networkidle" });
    await page.waitForURL(/flightSearch=AMS0201ADB09011/);

    const bagPill = page.getByRole("toolbar").getByRole("button", { name: "Bagaj dahil" });
    await expect(bagPill).toHaveAttribute("aria-pressed", "true");

    const metrics = await page.evaluate(() => {
      const sr = document.getElementById("tpwl-tickets")?.shadowRoot;
      const selectBtn = sr?.querySelector<HTMLElement>('[class*="Button-module__primary"]');
      const price = sr?.querySelector('[data-testid^="flight-card-price"]')?.textContent?.trim();
      return {
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        selectBtnHeight: selectBtn ? Math.round(selectBtn.getBoundingClientRect().height) : 0,
        price,
      };
    });
    expect(metrics.overflow).toBe(false);
    expect(metrics.selectBtnHeight).toBeGreaterThanOrEqual(44);
    expect(metrics.price).toBe("€ 312");

    // Mobilde "Filtreler" düğmesi widget'ın mobil filtre penceresini tetikler
    await page.getByRole("toolbar").getByRole("button", { name: /Filtreler/i }).click();
    const mobOpened = await page.evaluate(() => (window as unknown as { __mockState?: { mobileFiltersOpened?: boolean } }).__mockState?.mobileFiltersOpened);
    expect(mobOpened).toBe(true);

    // Yenilemede bagaj seçimi korunur
    await page.reload({ waitUntil: "networkidle" });
    await expect(bagPill).toHaveAttribute("aria-pressed", "true");
  });

  test("8.3 & 9.1–9.5 Kart tasarımı (28px, gölge yok, rozet renkleri), sade haplar, açılır filtreler, gürültü gizli, para birimi/dil yenileme", async ({ page }) => {
    await interceptWidget(page);
    await page.goto("/ara?flightSearch=AMS0201ADB09011", { waitUntil: "networkidle" });

    // 1. robots noindex meta etiketi
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots ?? "").toContain("noindex");

    // 2. 9.1 Kart ve rozet stilleri + 9.2/9.4 gürültü ve kapalı filtre paneli display:none
    await expect.poll(async () =>
      page.evaluate(() => {
        const sr = document.getElementById("tpwl-tickets")?.shadowRoot;
        const card = sr?.querySelector<HTMLElement>('[data-role="flight-card"]');
        const badges = [...(sr?.querySelectorAll<HTMLElement>('[data-role="flight-card-badge"]') ?? [])];
        const share = sr?.querySelector<HTMLElement>('[class*="FlightCard-module__share"]');
        const filters = sr?.querySelector<HTMLElement>('[class*="FlightFilters-module__filerContainer"]');
        const selectBtn = sr?.querySelector<HTMLElement>('[class*="Button-module__primary"]');
        const moreBtn = sr?.querySelector<HTMLElement>('[class*="TicketsWidget-module__moreTickets"]');
        if (!card || !share || !filters || !selectBtn || !moreBtn) return null;
        const csCard = getComputedStyle(card);
        const csShare = getComputedStyle(share);
        const csFilters = getComputedStyle(filters);
        return {
          radius: csCard.borderRadius,
          borderColor: csCard.borderTopColor,
          shadow: csCard.boxShadow,
          shareDisplay: csShare.display,
          filtersDisplay: csFilters.display,
          badgeColors: badges.map((b) => ({ text: b.textContent?.trim(), bg: getComputedStyle(b).backgroundColor })),
          selectVisible: selectBtn.getBoundingClientRect().height >= 48,
          moreVisible: moreBtn.getBoundingClientRect().height >= 48,
        };
      }),
    ).toEqual({
      radius: "28px",
      borderColor: "rgb(227, 232, 242)",
      shadow: "none",
      shareDisplay: "none",
      filtersDisplay: "none",
      badgeColors: [
        { text: "Tek direkt uçuş", bg: "rgb(207, 224, 255)" },
        { text: "En ucuz bilet", bg: "rgb(255, 209, 102)" },
      ],
      selectVisible: true,
      moreVisible: true,
    });

    // 3. "Filtreler" hapı masaüstü panelini açıp kapatır
    const toolbar = page.getByRole("toolbar");
    const filtersBtn = toolbar.getByRole("button", { name: /Filtreler/i });
    await filtersBtn.click();
    await expect(filtersBtn).toHaveAttribute("aria-expanded", "true");
    const openDisplay = await page.evaluate(() => {
      const sr = document.getElementById("tpwl-tickets")?.shadowRoot;
      const f = sr?.querySelector<HTMLElement>('[class*="FlightFilters-module__filerContainer"]');
      return f ? getComputedStyle(f).display : "";
    });
    expect(openDisplay).toBe("block");
    await filtersBtn.click();
    await expect(filtersBtn).toHaveAttribute("aria-expanded", "false");

    // 4. Sıralama ve "Sadece direkt" hapları + "Seçme bilet" ve "Daha fazla" tıklanabilir
    await expect.poll(async () =>
      page.evaluate(() => {
        const sr = document.getElementById("tpwl-tickets")?.shadowRoot;
        return [...(sr?.querySelectorAll<HTMLElement>('[data-role="flight-card"]') ?? [])].map((c) => c.style.order);
      }),
    ).toEqual(["291", "267", "284"]);

    await toolbar.getByRole("button", { name: "En hızlı" }).click();
    await expect(toolbar.getByRole("button", { name: "En hızlı" })).toHaveAttribute("aria-pressed", "true");
    await expect.poll(async () =>
      page.evaluate(() => (window as unknown as { __mockState?: { sortIndex?: number } }).__mockState?.sortIndex),
    ).toBe(5);

    await toolbar.getByRole("button", { name: "Sadece direkt" }).click();
    await expect(toolbar.getByRole("button", { name: "Sadece direkt" })).toHaveAttribute("aria-pressed", "true");
    await expect.poll(async () =>
      page.evaluate(() => document.getElementById("tpwl-tickets")?.shadowRoot?.querySelectorAll('[data-role="flight-card"]').length ?? 0),
    ).toBe(1);
    await toolbar.getByRole("button", { name: "Sadece direkt" }).click();

    await page.locator("#tpwl-tickets").locator('[data-mock-more-tickets="1"]').click();
    await page.locator("#tpwl-tickets").locator('[data-mock-select="c1"]').click();
    const clickState = await page.evaluate(() => (window as unknown as { __mockState?: { showMoreCount?: number; selectedCard?: string | null } }).__mockState);
    expect(clickState?.showMoreCount).toBe(1);
    expect(clickState?.selectedCard).toBe("c1");

    // 5. Para birimi TRY → EUR ve dil TR → EN değişiminde widget temiz adresle yeniden yüklenir
    await page.locator("header button[title]").first().click();
    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /Para birimi|TRY/i }).first().click();
    await dialog.getByRole("option", { name: /EUR/i }).first().click();
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle" }),
      dialog.getByRole("button", { name: "Kaydet" }).click(),
    ]);
    const cfgAfterCur = await page.evaluate(() => (window as unknown as { __mockWidgetLastConfig?: { cur?: string; flightSearch?: string } }).__mockWidgetLastConfig);
    expect(cfgAfterCur?.cur).toBe("EUR");
    expect(cfgAfterCur?.flightSearch).toBe("AMS0201ADB09011");

    await page.locator("header button[title]").first().click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /Dil|Türkçe/i }).first().click();
    await dialog.getByRole("option", { name: /English/i }).first().click();
    await dialog.getByRole("button", { name: "Kaydet" }).click();
    await page.waitForURL(/\/en\/search\?flightSearch=AMS0201ADB09011/, { timeout: 15_000 });
    await expect.poll(async () =>
      page.evaluate(() => (window as unknown as { __mockWidgetLastConfig?: { lang?: string } }).__mockWidgetLastConfig?.lang),
    ).toBe("EN");
  });
});
