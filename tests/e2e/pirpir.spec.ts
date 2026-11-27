import { expect, test, type Page } from "@playwright/test";

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });
  return errors;
}

function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

test.describe("Ana sayfalar ve gezinme", () => {
  test("Ana sayfa (TR ve EN) hatasız açılır", async ({ page }) => {
    const errors = trackErrors(page);

    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("#populer")).toBeVisible();

    // Kategori filtresi: Tümü / Türkiye / Avrupa / Deniz & güneş / Şehir turu
    for (const label of ["Türkiye", "Avrupa", "Deniz & güneş", "Şehir turu", "Tümü"]) {
      const tab = page.getByRole("tab", { name: label });
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");
      await expect(page.locator("#populer a").first()).toBeVisible();
    }

    await page.goto("/en", { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    expect(errors).toEqual([]);
  });

  test("Arama kutusundan sonuç sayfasına tam akış (şehir → öneri → takvim → Bilet bul)", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/", { waitUntil: "networkidle" });

    // Nereye alanına şehir yaz ve öneriden seç
    const toInput = page.getByLabel("Nereye", { exact: true }).first();
    await toInput.click();
    await toInput.fill("Barselona");
    const option = page.getByRole("option", { name: /Barselona|Barcelona|BCN/i }).first();
    await expect(option).toBeVisible();
    await option.click();

    // Tarih alanını aç, ileri aydan gidiş ve dönüş seç, Tamam'a bas
    await page.getByRole("button", { name: /Ne zaman/i }).first().click();
    const nextMonth = page.getByRole("button", { name: /Sonraki ay/i });
    await nextMonth.click();
    // Takvim gün düğmelerinden 10 ve 15'i seç
    const cal10 = page.getByRole("button", { name: /^\S+ 10 / }).first();
    const cal15 = page.getByRole("button", { name: /^\S+ 15 / }).first();
    await expect(cal10).toBeVisible();
    await cal10.click();
    await cal15.click();
    await page.getByRole("button", { name: "Tamam" }).click();

    // Aramayı başlat
    await page.getByRole("button", { name: "Bilet bul" }).click();
    await expect(page).toHaveURL(/\/ara\?/);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("article, [data-offer], a[href^='/git?']").first()).toBeVisible({ timeout: 15_000 });

    expect(errors).toEqual([]);
  });
});

test.describe("Sonuç sayfası etkileşimleri", () => {
  test("Filtre, sıralama ve tarih şeridi çalışır", async ({ page }) => {
    const errors = trackErrors(page);
    const d1 = futureDate(21);
    const d2 = futureDate(28);
    await page.goto(`/ara?from=AMS&to=IST&date=${d1}&return=${d2}&adults=1`, { waitUntil: "networkidle" });

    // Sonuç kartları ve tarih şeridi görünür
    await expect(page.locator("a[href^='/git?']").first()).toBeVisible({ timeout: 15_000 });
    const strip = page.locator("nav[aria-label]").filter({ has: page.locator("a[aria-current='date']") });
    await expect(strip).toBeVisible({ timeout: 10_000 });

    // Sıralama sekmeleri (En ucuz / En hızlı)
    const fastestTab = page.getByRole("tab", { name: /En hızlı/i });
    await expect(fastestTab).toBeVisible();
    await fastestTab.click();
    await expect(fastestTab).toHaveAttribute("aria-selected", "true");

    // Aktarmasız / Direkt filtresi
    const directFilter = page.getByRole("radio", { name: /Direkt|Aktarmasız/i }).first();
    if (await directFilter.isVisible()) {
      await directFilter.click({ force: true });
    }

    expect(errors).toEqual([]);
  });
});

test.describe("İçerik, yönlendirme ve güvenlik kontrolleri", () => {
  test("/git ortaklık yönlendirmesi (302 ve parametreler)", async ({ request }) => {
    const d1 = futureDate(30);
    const d2 = futureDate(35);
    const res = await request.get(`/git?from=AMS&to=IST&d=${d1}&r=${d2}&a=1&l=tr&src=results`, {
      maxRedirects: 0,
    });
    expect(res.status()).toBe(302);
    expect(res.headers()["x-robots-tag"]).toContain("noindex");
    const loc = res.headers()["location"] ?? "";
    expect(loc).toMatch(/tp\.media|aviasales|skyscanner|ucus\.flypirpir\.nl/i);
    expect(loc).toContain("results");
  });

  test("/firsatlar ve /en/deals hatasız açılır", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/firsatlar", { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toBeVisible();

    await page.goto("/en/deals", { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("Rota sayfaları (editöryal + pazar rotası) hatasız açılır, bilinmeyen rota 404 döner", async ({ page, request }) => {
    const errors = trackErrors(page);
    await page.goto("/ucuslar/amsterdam/istanbul", { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: /Ay seçimi/i })).toBeVisible();

    await page.goto("/ucuslar/amsterdam/barselona", { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toBeVisible();

    const bad = await request.get("/ucuslar/mars/jupiter");
    expect(bad.status()).toBe(404);
    expect(errors).toEqual([]);
  });

  test("Gizlilik sayfası 7 dilde 200 döner", async ({ request }) => {
    const routes = [
      "/gizlilik",
      "/en/privacy",
      "/nl/privacy",
      "/de/datenschutz",
      "/fr/confidentialite",
      "/es/privacidad",
      "/it/privacy",
    ];
    for (const r of routes) {
      const res = await request.get(r);
      expect(res.status(), `${r} durum kodu`).toBe(200);
      const body = await res.text();
      expect(body).toContain("Travelpayouts");
      expect(body).toContain("tpwgt.com");
    }
  });

  test("/yonetim/* girişsiz 307 yönlendirir", async ({ request }) => {
    for (const path of ["/yonetim/firsatlar", "/yonetim/tiklamalar"]) {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status(), `${path} durum kodu`).toBe(307);
      expect(res.headers()["location"] ?? "").toContain("/giris");
    }
  });

  test("/api/cron/* anahtarsız 401 döner", async ({ request }) => {
    for (const path of ["/api/cron/price-alerts", "/api/cron/deals"]) {
      const res = await request.get(path);
      expect(res.status(), `${path} durum kodu`).toBe(401);
    }
  });
});
