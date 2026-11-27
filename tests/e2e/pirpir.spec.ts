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

  test("Rota sayfaları (editöryal + pazar + TR koridorları), iç bağlantılar ve rehbersiz bölüm gizleme", async ({ page, request }) => {
    const errors = trackErrors(page);
    await page.goto("/ucuslar/amsterdam/istanbul", { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: /Ay seçimi/i })).toBeVisible();

    // "Türkiye'de başka nereler?" bölümündeki tüm bağlantılar rota sayfalarına (/ucuslar/amsterdam/...) gitmeli
    const othersHeading = page.getByRole("heading", { name: /başka nereler/i });
    const othersSection = othersHeading.locator("..");
    const otherLinks = othersSection.locator("a");
    const otherCount = await otherLinks.count();
    expect(otherCount).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < otherCount; i++) {
      const href = (await otherLinks.nth(i).getAttribute("href")) ?? "";
      expect(href, `iç bağlantı #${i}`).toMatch(/^\/ucuslar\/amsterdam\//);
    }

    // Rehberi olmayan TR rota sayfası (Amsterdam → Ankara): açılır ama havalimanı/ipucu uydurmaz (bölümler gizli)
    await page.goto("/ucuslar/amsterdam/ankara", { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toContainText(/Ankara/i);
    await expect(page.getByRole("heading", { name: /Hangi havalimanı/i })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /için ipuçları/i })).toHaveCount(0);

    // Ana sayfadaki Popüler rotalar iç bağlantıları rota sayfalarına gider
    await page.goto("/", { waitUntil: "networkidle" });
    const routeLinks = page.locator("#rotalar a");
    expect(await routeLinks.count()).toBeGreaterThanOrEqual(5);
    const firstHref = (await routeLinks.first().getAttribute("href")) ?? "";
    expect(firstHref).toMatch(/^\/ucuslar\//);

    // Sitemap TR koridorlarını içerir; bilinmeyen rota 404 döner
    const sm = await (await request.get("/sitemap.xml")).text();
    expect(sm).toContain("/ucuslar/amsterdam/ankara");
    expect(sm).toContain("/ucuslar/amsterdam/trabzon");

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

  test("Ortaklık modunda /biletlerim → /hesap, /rezervasyon/* → / yönlenir ve /kosullar satış iddiası taşımaz", async ({ page, request }) => {
    const trips = await request.get("/biletlerim", { maxRedirects: 0 });
    expect(trips.status()).toBe(307);
    expect(trips.headers()["location"] ?? "").toContain("/hesap");

    const enTrips = await request.get("/en/my-trips", { maxRedirects: 0 });
    expect(enTrips.status()).toBe(307);
    expect(enTrips.headers()["location"] ?? "").toContain("/en/account");

    for (const p of ["/rezervasyon/demo_1", "/rezervasyon/demo_1/onay", "/rezervasyon/demo_1/plan", "/en/booking/demo_1/confirmation"]) {
      const res = await request.get(p, { maxRedirects: 0 });
      expect(res.status(), `${p} yönlendirme`).toBe(307);
      const loc = res.headers()["location"] ?? "";
      expect(loc === "/" || /\/(tr|en)?$/.test(loc)).toBe(true);
    }

    await page.goto("/kosullar", { waitUntil: "networkidle" });
    await expect(page.locator("main")).toContainText("doğrudan bilet satmaz");
    await expect(page.locator("main")).not.toContainText("24 saat içinde ücretsiz iptal");

    await page.goto("/en/terms", { waitUntil: "networkidle" });
    await expect(page.locator("main")).toContainText("does not sell tickets directly");
    await expect(page.locator("main")).not.toContainText("cancel for free within 24 hours");
  });

  test("SEO temelleri: canonical, 7 dil hreflang + x-default, FAQPage, BreadcrumbList (Offer yok) ve rota OG PNG", async ({ page, request }) => {
    // 1. Ana sayfa: canonical, 7 dil + x-default, FAQPage JSON-LD (Offer yok)
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /.+/);
    for (const lang of ["tr", "en", "nl", "de", "fr", "es", "it", "x-default"]) {
      await expect(page.locator(`link[rel="alternate"][hreflang="${lang}"]`), `home hreflang ${lang}`).toHaveCount(1);
    }
    const homeLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(homeLd.length).toBeGreaterThanOrEqual(1);
    const faqObj = homeLd.map((s) => JSON.parse(s)).find((o) => o["@type"] === "FAQPage");
    expect(faqObj).toBeTruthy();
    expect(Array.isArray(faqObj.mainEntity) && faqObj.mainEntity.length).toBeGreaterThanOrEqual(5);
    expect(homeLd.join("")).not.toContain('"@type":"Offer"');

    // 2. Rota sayfası: canonical, 7 dil + x-default, özgün meta description, BreadcrumbList (Offer yok)
    await page.goto("/ucuslar/amsterdam/istanbul", { waitUntil: "networkidle" });
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/ucuslar\/amsterdam\/istanbul$/);
    for (const lang of ["tr", "en", "nl", "de", "fr", "es", "it", "x-default"]) {
      await expect(page.locator(`link[rel="alternate"][hreflang="${lang}"]`), `route hreflang ${lang}`).toHaveCount(1);
    }
    const desc = (await page.locator('meta[name="description"]').getAttribute("content")) ?? "";
    expect(desc).toContain("Amsterdam");
    expect(desc).toContain("İstanbul");

    const routeLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    const bcObj = routeLd.map((s) => JSON.parse(s)).find((o) => o["@type"] === "BreadcrumbList");
    expect(bcObj).toBeTruthy();
    expect(bcObj.itemListElement).toHaveLength(3);
    expect(routeLd.join("")).not.toContain('"@type":"Offer"');

    // 3. Rota OpenGraph görseli: geçerli PNG
    const ogUrl = await page.locator('meta[property="og:image"]').first().getAttribute("content");
    expect(ogUrl).toContain("/opengraph-image");
    const ogRes = await request.get(new URL(ogUrl!).pathname);
    expect(ogRes.status()).toBe(200);
    expect(ogRes.headers()["content-type"]).toContain("image/png");
    const png = await ogRes.body();
    expect(png.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))).toBe(true);
  });
});
