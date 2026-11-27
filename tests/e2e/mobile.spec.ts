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

test.describe("Telefon görünümü (iPhone 13)", () => {
  test("Ana sayfa yatay taşma ve JS hatası olmadan açılır", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByRole("button", { name: "Bilet bul" })).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    expect(errors).toEqual([]);
  });

  test("Sonuç sayfası telefon boyutunda hatasız açılır", async ({ page }) => {
    const errors = trackErrors(page);
    const d1 = futureDate(21);
    const d2 = futureDate(28);
    await page.goto(`/ara?from=AMS&to=IST&date=${d1}&return=${d2}&adults=1`, { waitUntil: "networkidle" });

    await expect(page.locator("a[href^='/git?']").first()).toBeVisible({ timeout: 15_000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    expect(errors).toEqual([]);
  });
});
