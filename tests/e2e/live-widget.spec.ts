import { test, expect, type Page } from "@playwright/test";
import { cleanWidgetUrl, widgetSyncQuery } from "../../src/lib/live-widget-url";

/**
 * Gerçek Travelpayouts White Label widget'ının (`tpwgt.com/wl_web/main.js`) davranışını taklit eden sahte betik:
 * - Adreste `flightSearch` ile birlikte `adults`/`children`/`infants`/`depart_date`/`return_date` varsa, gerçek
 *   widget'ın UTC+ saat dilimlerindeki hatasını (yerel gece yarısı + `.toISOString()` → -1 gün kayma + `location.replace`)
 *   aynen uygular; böylece gerileme testi bu hatayı anında yakalar.
 * - Temiz `flightSearch` geldiğinde `#tpwl-tickets` içine açık shadow root kurar, kartları çizer ve bagaj çiplerini sunar.
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
        const d = new Date(2027, Number(mm) - 1, Number(dd)); // yerel gece yarısı
        const iso = d.toISOString().slice(0, 10); // UTC+1'de 1 gün geri!
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

  const host = document.getElementById("tpwl-tickets");
  if (!host) return;
  const sr = host.shadowRoot || host.attachShadow({ mode: "open" });

  const render = () => {
    const curFs = new URLSearchParams(window.location.search).get("flightSearch") || fs;
    const bagOn = !!window.__mockBagOn;
    const isMobile = window.innerWidth < 768;
    const basePrices = [
      { id: "c1", base: 291, bag: 312 },
      { id: "c2", base: 267, bag: 318 },
      { id: "c3", base: 284, bag: 336 },
    ];
    sr.innerHTML = \`
      <style>
        .desktop-only { display: \${isMobile ? "none" : "block"}; }
        .mobile-only { display: \${isMobile ? "flex" : "none"}; gap: 8px; }
      </style>
      <div class="mobile-only FlightFiltersMobileMenu-module__root___m">
        <div class="FlightFiltersMobileMenu-module__list___m">
          <button type="button" class="ClearableParameter-module__root___r FlightFiltersMobileMenu-module__chip___c \${bagOn ? "ClearableParameter-module__valueChanged___v" : ""}" data-mock-bag="mobile">Bagaj dahil</button>
          <button type="button" class="ClearableParameter-module__root___r FlightFiltersMobileMenu-module__chip___c">Aktarmasız</button>
        </div>
      </div>
      <div class="desktop-only">
        <button type="button" data-testid="baggage-included-filter" class="ClearableParameter-module__root___r \${bagOn ? "ClearableParameter-module__valueChanged___v" : ""}" data-mock-bag="desktop">Bagaj dahil</button>
      </div>
      <div class="cards-wrap">
        \${basePrices.map((x) => \`
          <div data-role="flight-card" data-card="\${x.id}">
            <span data-testid="flight-card-price">\${bagOn ? "€ " + x.bag : "€ " + x.base}</span>
            <span data-testid="flight-card-route">\${curFs}</span>
            <span data-testid="flight-card-bag">\${bagOn ? "Bagaj dahil" : "Bagaj +€"}</span>
          </div>
        \`).join("")}
      </div>
    \`;
    sr.querySelectorAll("[data-mock-bag]").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.__mockBagOn = !window.__mockBagOn;
        render();
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

test.describe("Canlı widget (8.1 tarih kayması ve URL koruması)", () => {
  test("cleanWidgetUrl ve widgetSyncQuery çakışan parametreleri (adults/date/return) temizler", async () => {
    const cleaned = cleanWidgetUrl(
      "https://www.flypirpir.nl/ara?from=AMS&to=ADB&date=2027-01-02&return=2027-01-09&adults=1&checkedBags=1&marker=812756",
      "AMS0201ADB09011",
    );
    expect(cleaned).toBe("https://www.flypirpir.nl/ara?flightSearch=AMS0201ADB09011&marker=812756");

    const synced = widgetSyncQuery("AMS1501ADB22011", "?flightSearch=AMS0201ADB09011&adults=1&currency=EUR");
    expect(synced).toEqual({ flightSearch: "AMS1501ADB22011", currency: "EUR" });
  });

  test("Europe/Amsterdam saat diliminde 2–9 Ocak seçimi 1–8 Ocak'a kaymaz (ana sayfa → sonuç → yenileme → üst çubuk → urlchange)", async ({ page }) => {
    await interceptWidget(page);

    // 1. Ana sayfada Amsterdam → İzmir, 2–9 Ocak seç (varsa 'en ucuz' önerisinin üzerine seçerek)
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

    // 2. Sonuç sayfasında adres yalnızca flightSearch=AMS0201ADB09011 olmalı (adults yok, kayma yok!)
    await page.waitForURL(/flightSearch=AMS0201ADB09011/, { timeout: 15_000 });
    expect(new URL(page.url()).searchParams.has("adults")).toBe(false);
    await expect(page.locator("#results-search")).toContainText("2 – 9 Oca");

    const cardRoute = await page.evaluate(() =>
      document.getElementById("tpwl-tickets")?.shadowRoot?.querySelector('[data-testid="flight-card-route"]')?.textContent?.trim(),
    );
    expect(cardRoute).toBe("AMS0201ADB09011");

    // 3. Sayfa yenilenince de tarih 2–9 Ocak olarak kalır
    await page.reload({ waitUntil: "networkidle" });
    expect(page.url()).toContain("flightSearch=AMS0201ADB09011");
    await expect(page.locator("#results-search")).toContainText("2 – 9 Oca");

    // 4. Üst arama çubuğundan 12–19 Ocak seçilince yeni arama 12–19 Ocak olarak yüklenir (11–18 değil)
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

    // 5. Widget kendi tarih değişimini (`urlchange`) yayınlayınca üst çubuk eşitlenir ve `adults` geri eklenmez
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
});
