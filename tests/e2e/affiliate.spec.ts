import { test, expect, type Page } from "@playwright/test";
import { pickDealCandidates } from "../../src/lib/deal-rules";

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });
  return errors;
}

function nextMonthDay(day: number): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, day));
  return d.toISOString().slice(0, 10);
}

test.describe("Ortaklık modu (sahte Travelpayouts sunucusu)", () => {
  test("Rota sayfası gerçek aylık grafik, veri olmayan ayda 'Fiyata bak' ve en ucuz tarihleri gösterir", async ({ page }) => {
    const errors = trackErrors(page);
    // Viyana → İstanbul derlemede statik üretilmediği için ortaklık sunucusunda ISR ile sahte Travelpayouts'tan dolar
    await page.goto("/ucuslar/viyana/istanbul", { waitUntil: "networkidle" });

    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByText(/Aviasales önbelleğinde/i)).toBeVisible();

    // 12 ay grafiğinde 4 ayda fiyat, kalan aylarda '—' / 'Fiyata bak' olmalı
    const group = page.getByRole("radiogroup", { name: /Ay seçimi/i });
    await expect(group).toBeVisible();
    const emptyMonth = group.getByRole("radio", { name: /Fiyata bak/i }).first();
    await expect(emptyMonth).toBeVisible();
    await emptyMonth.click();
    await expect(page.getByText("Bu ay için kayıtlı fiyat yok")).toBeVisible();

    // En ucuz tarihlerde görülme günü, Seç (searchHref) ve Fırsata git (goHref, src=route:viyana-istanbul) bulunur
    await expect(page.getByText(/tarihinde görüldü/i).first()).toBeVisible();
    const goLink = page.locator("a[href^='/git?']").first();
    await expect(goLink).toBeVisible();
    const href = (await goLink.getAttribute("href")) ?? "";
    expect(href).toContain("src=route%3Aviyana-istanbul");

    expect(errors).toEqual([]);
  });

  test("Ana sayfa popüler uçuşlar 60 günlük groupedPrices ile dolar ve kategori filtresi çalışır", async ({ page, request }) => {
    const errors = trackErrors(page);

    const api = await request.get("/api/deals?from=AMS");
    expect(api.status()).toBe(200);
    const body = (await api.json()) as { deals: Record<string, { price: number; seenDate?: string } | null> };
    const filled = Object.entries(body.deals).filter(([id, v]) => id !== "ams" && v && v.price > 0);
    expect(filled.length).toBeGreaterThanOrEqual(15);
    expect(body.deals.fco?.seenDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(body.deals.ayt?.seenDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("#populer")).toBeVisible();
    await expect(page.locator("#populer").getByText(/tarihinde görüldü/i).first()).toBeVisible();
    await expect(page.locator("#populer").getByText(/’dan/i).first()).toBeVisible();

    // Kategori filtresi gerçek veriyle çalışır
    for (const label of ["Türkiye", "Avrupa", "Deniz & güneş", "Şehir turu", "Tümü"]) {
      const tab = page.getByRole("tab", { name: label });
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");
      await expect(page.locator("#populer a").first()).toBeVisible();
    }

    expect(errors).toEqual([]);
  });

  test("/api/date-prices?strip=1 ±3 günü tek istekte döndürür, kayıtsız günler null kalır", async ({ request }) => {
    // Sahte sunucu her ayda 5, 11, 15, 21, 22, 24 günlerini döndürür; 19 ve 20 kayıtlı değil (null)
    const dep = nextMonthDay(22);
    const ret = nextMonthDay(29);
    const res = await request.get(`/api/date-prices?from=AMS&to=IST&date=${dep}&return=${ret}&strip=1`);
    expect(res.status()).toBe(200);
    const json = (await res.json()) as { prices: Record<string, number | null>; failed: boolean };
    expect(json.failed).toBe(false);

    const d19 = nextMonthDay(19);
    const d21 = nextMonthDay(21);
    const d22 = nextMonthDay(22);
    expect(json.prices[d19]).toBeNull();
    expect(typeof json.prices[d21]).toBe("number");
    expect((json.prices[d21] ?? 0) > 0).toBe(true);
    expect(typeof json.prices[d22]).toBe("number");
    expect((json.prices[d22] ?? 0) > 0).toBe(true);
  });

  test("Fırsat tarayıcısı (pickDealCandidates): %75 / 30 € / 3 gün / max 3 kurallarını uygular", async () => {
    const today = "2027-01-10";
    const mk = (day: number, price: number, foundAt = "2027-01-09T10:00:00Z") => ({
      origin: "AMS",
      destination: "IST",
      price,
      airline: "PC",
      departure_at: `2027-02-${String(day).padStart(2, "0")}T10:00:00+01:00`,
      return_at: `2027-02-${String(day + 5).padStart(2, "0")}T14:00:00+03:00`,
      transfers: 0,
      found_at: foundAt,
      link: `/search/AMS${String(day).padStart(2, "0")}02IST${String(day + 5).padStart(2, "0")}021?search_date=09012027`,
    });

    // Ortanca = 200 € (6 normal gün: 200, 200, 210, 220, 230, 240; 4 ucuz gün <= 150 € ve >= 30 € tasarruf + 1 eski seen_at)
    const items = [
      mk(1, 200), mk(2, 200), mk(3, 210), mk(4, 220), mk(5, 230), mk(6, 240),
      mk(7, 110), // aday 1 (en ucuz)
      mk(8, 120), // aday 2
      mk(9, 130), // aday 3
      mk(10, 140), // 4. ucuz -> max 3 sınırı nedeniyle dışarıda
      mk(11, 100, "2027-01-01T10:00:00Z"), // 9 gün önce görülmüş -> reddedilmeli
      mk(12, 160), // %80 -> %75 eşiğinin üstünde -> reddedilmeli
    ];

    const picked = pickDealCandidates("AMS", "IST", items, today);
    expect(picked).toHaveLength(3);
    expect(picked.map((x) => x.price_eur)).toEqual([110, 120, 130]);
    expect(picked.every((x) => x.seen_at === "2027-01-09")).toBe(true);

    // 6 günden az veri varsa ortanca anlamsız -> boş dizi
    expect(pickDealCandidates("AMS", "IST", [mk(1, 200), mk(2, 90)], today)).toEqual([]);
  });

  test("Fiyat alarmı penceresi /api/alert-price ile önbellek fiyatını ve görülme gününü gösterir", async ({ page, request }) => {
    const errors = trackErrors(page);
    const dep = nextMonthDay(22);
    const ret = nextMonthDay(29);

    // 1. /api/alert-price doğrudan doğrulama (tam tarih, esnek ±3, direkt, geçersiz -> 400)
    const bad = await request.get("/api/alert-price?from=AMS");
    expect(bad.status()).toBe(400);

    const exactRes = await request.get(`/api/alert-price?from=AMS&to=IST&date=${dep}&return=${ret}&adults=1&flex=0&direct=0`);
    expect(exactRes.status()).toBe(200);
    const exactJson = (await exactRes.json()) as { best: { price: number; seenAt?: string } | null; source: string };
    expect(exactJson.source).toBe("travelpayouts");
    expect(exactJson.best?.price ?? 0).toBeGreaterThan(0);
    expect(exactJson.best?.seenAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const flexRes = await request.get(`/api/alert-price?from=AMS&to=IST&date=${dep}&return=${ret}&adults=1&flex=3&direct=1`);
    expect(flexRes.status()).toBe(200);
    const flexJson = (await flexRes.json()) as { best: { price: number; stops: number; seenAt?: string } | null };
    expect(flexJson.best?.price ?? 0).toBeGreaterThan(0);
    expect(flexJson.best?.stops).toBe(0);

    // 2. Sonuç sayfasında alarm penceresi açılır, önbellekli fiyat + "1 gün önce görülen fiyat" görünür, Alarmı kur etkindir
    await page.goto(`/ara?from=AMS&to=IST&date=${dep}&return=${ret}&adults=1`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Fiyat alarmı kur" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/gün önce görülen fiyat|Bugün görülen fiyat/i)).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByRole("button", { name: "Alarmı kur" })).toBeEnabled();

    // ± 3 gün esnek ve Sadece direkt seçimi yeni fiyat isteğiyle sorunsuz güncellenir
    await dialog.getByText("± 3 gün esnek").click();
    await dialog.getByText("Sadece direkt").click();
    await expect(dialog.getByText(/gün önce görülen fiyat|Bugün görülen fiyat|Şu an kayıtlı fiyat yok/i)).toBeVisible({ timeout: 10_000 });

    expect(errors).toEqual([]);
  });
});
