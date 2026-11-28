#!/usr/bin/env node
// Canlı site (https://www.flypirpir.nl) için tek komutluk gerçek tarayıcı duman testi.
// Kullanım: npm run verify:live   (isteğe bağlı: LIVE_URL=https://www.flypirpir.nl node scripts/verify-live.mjs)
// Bot tespiti atlatma yok; normal sistem Chrome'u ile Europe/Amsterdam saat diliminde koşar.

import { existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium, devices } = require("@playwright/test");

function detectChromium() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  for (const p of [
    "/opt/pw-browsers/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ]) {
    if (existsSync(p)) return p;
  }
  if (existsSync("/opt/pw-browsers")) {
    for (const entry of readdirSync("/opt/pw-browsers")) {
      if (!entry.startsWith("chromium")) continue;
      for (const rel of ["chrome-linux/chrome", "chrome-linux64/chrome"]) {
        const cand = path.join("/opt/pw-browsers", entry, rel);
        if (existsSync(cand)) return cand;
      }
    }
  }
  return undefined;
}

function futureDates() {
  const now = new Date();
  const dep = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 35));
  const ret = new Date(Date.UTC(dep.getUTCFullYear(), dep.getUTCMonth(), dep.getUTCDate() + 7));
  const iso = (d) => d.toISOString().slice(0, 10);
  const ddmm = (d) => iso(d).slice(8, 10) + iso(d).slice(5, 7);
  return { depIso: iso(dep), retIso: iso(ret), code: `AMS${ddmm(dep)}ADB${ddmm(ret)}1` };
}

async function waitForCards(page, timeoutMs = 28000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const n = await page.evaluate(() => document.getElementById("tpwl-tickets")?.shadowRoot?.querySelectorAll('[data-role="flight-card"]').length ?? 0);
      if (n > 0) {
        await page.waitForTimeout(2500);
        return n;
      }
    } catch {}
    await page.waitForTimeout(500);
  }
  return 0;
}

const BASE = (process.env.LIVE_URL || "https://www.flypirpir.nl").replace(/\/$/, "");
const { depIso, retIso, code } = futureDates();
const executablePath = detectChromium();
const checks = [];
const record = (name, ok, detail) => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${name} — ${detail}`);
};

const browser = await chromium.launch({
  ...(executablePath ? { executablePath } : {}),
  headless: true,
  args: ["--no-sandbox"],
});

try {
  // Tek tarayıcı oturumu: TR /ara (bagaj dahil), sonra EN /en/search (tpwl_locale çerezinin EN'yi bozmadığını da sınar)
  const ctx = await browser.newContext({
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 900 },
    locale: "tr-TR",
    timezoneId: "Europe/Amsterdam",
  });
  const page = await ctx.newPage();
  const pageErrors = [];
  let markerSeen = "";
  page.on("pageerror", (e) => pageErrors.push(`${page.url()} :: ${e.message}`));
  page.on("request", (req) => {
    if (req.url().includes("tickets-api.apistp.com/search/wl/start")) {
      try {
        const body = JSON.parse(req.postData() || "{}");
        if (body.marker) markerSeen = String(body.marker);
      } catch {}
    }
  });

  // 1. TR sonuç sayfası (checkedBags=1 ile bagaj senaryosu dahil)
  await page.goto(`${BASE}/ara?from=AMS&to=ADB&date=${depIso}&return=${retIso}&adults=1&checkedBags=1`, { waitUntil: "domcontentloaded" });
  const trCards = await waitForCards(page);
  const trUrl = page.url();
  const trFs = new URL(trUrl).searchParams.get("flightSearch") || "";
  record("TR sonuç kartları", trCards > 0, `${trCards} kart`);
  record("TR tarih kodu (kayma yok)", trFs === code, `beklenen=${code}, görülen=${trFs}`);

  const trCheck = await page.evaluate(() => {
    const sr = document.getElementById("tpwl-tickets")?.shadowRoot;
    const btn = sr?.querySelector('[data-role="flight-card"] button[class*="Button-module__primary"]')?.textContent?.trim() ?? "";
    const bagChip = sr?.querySelector('[data-testid="baggage-included-filter"]');
    const sidebar = sr?.querySelector('[class*="FlightFilters-module__filerContainer"]');
    const tabRect = document.querySelector('[role="tablist"]')?.getBoundingClientRect();
    const firstCardRect = sr?.querySelector('[data-role="flight-card"]')?.getBoundingClientRect();
    const bagVal = document.querySelector('[data-testid="live-baggage-desktop"] [data-testid="bag-checked-val"]')?.textContent?.trim() ?? "";
    const searchBagOk = !!document.querySelector('#results-search [aria-label*="1 kontrol edilen bagaj"]');
    return {
      btn,
      bagActive: bagChip ? /valueChanged/.test(bagChip.className) : false,
      bagVal,
      searchBagOk,
      noInnerScroll: sidebar ? getComputedStyle(sidebar).overflowY === "visible" : false,
      noOverlap: tabRect && firstCardRect ? firstCardRect.top >= tabRect.bottom : false,
    };
  });
  record("TR widget dili", /bilet|seç/i.test(trCheck.btn), `düğme="${trCheck.btn}"`);
  record("TR bagaj senaryosu (checkedBags=1 → sayaç+arama+widget eşit)", trCheck.bagActive && trCheck.bagVal === "1" && trCheck.searchBagOk, `widget=${trCheck.bagActive}, sayaç=${trCheck.bagVal}, arama=${trCheck.searchBagOk}`);
  record("Sol sütunda iç kaydırma ve çakışma yok", trCheck.noInnerScroll && trCheck.noOverlap, `içKaydırmaYok=${trCheck.noInnerScroll}, çakışmaYok=${trCheck.noOverlap}`);
  record("Arama oturumunda marker 812756", markerSeen.startsWith("812756"), `marker="${markerSeen || "(yok)"}"`);

  // Bagajı 1 → 0 yap ve eşitlendiğini doğrula
  await page.locator('[data-testid="live-baggage-desktop"] [data-testid="bag-checked-dec"]').click();
  await page.waitForTimeout(1200);
  const bagOffCheck = await page.evaluate(() => {
    const sr = document.getElementById("tpwl-tickets")?.shadowRoot;
    const bagChip = sr?.querySelector('[data-testid="baggage-included-filter"]');
    const bagVal = document.querySelector('[data-testid="live-baggage-desktop"] [data-testid="bag-checked-val"]')?.textContent?.trim() ?? "";
    const searchBagZero = !!document.querySelector('#results-search [aria-label*="0 kontrol edilen bagaj"]');
    return { bagActive: bagChip ? /valueChanged/.test(bagChip.className) : true, bagVal, searchBagZero };
  });
  record("Bagaj 1 → 0 eşitlemesi", !bagOffCheck.bagActive && bagOffCheck.bagVal === "0" && bagOffCheck.searchBagZero, `widget=${bagOffCheck.bagActive}, sayaç=${bagOffCheck.bagVal}, arama=${bagOffCheck.searchBagZero}`);

  // 2. "Seç" → satıcı yönlendirmesi
  await page.evaluate(() => {
    document.getElementById("tpwl-tickets")?.shadowRoot?.querySelector('[data-role="flight-card"] button[class*="Button-module__primary"]')?.click();
  });
  await page.waitForTimeout(2000);
  const buyHref = await page.evaluate(() =>
    document.getElementById("tpwl-modals")?.shadowRoot?.querySelector('a[href*="tpwgt.com/wl/redirect"]')?.getAttribute("href") ?? "",
  );
  record("Seç → satıcı yönlendirmesi", buyHref.includes("tpwgt.com/wl/redirect"), buyHref ? buyHref.slice(0, 90) : "(bağlantı bulunamadı)");

  // 3. Aynı oturumda EN sonuç sayfası (/en/search)
  await page.goto(`${BASE}/en/search?from=AMS&to=ADB&date=${depIso}&return=${retIso}&adults=1`, { waitUntil: "domcontentloaded" });
  const enCards = await waitForCards(page);
  const enFs = new URL(page.url()).searchParams.get("flightSearch") || "";
  const enBtn = await page.evaluate(() =>
    document.getElementById("tpwl-tickets")?.shadowRoot?.querySelector('[data-role="flight-card"] button[class*="Button-module__primary"]')?.textContent?.trim() ?? "",
  );
  record("EN sonuç kartları", enCards > 0, `${enCards} kart`);
  record("EN tarih kodu (kayma yok)", enFs === code, `beklenen=${code}, görülen=${enFs}`);
  record("EN widget dili (TR çerezi ezildi)", /select/i.test(enBtn) && !/seçme/i.test(enBtn), `düğme="${enBtn}"`);
  record("JS / React hatası yok", pageErrors.length === 0, pageErrors.length ? pageErrors.join(" | ") : "0 hata");

  await ctx.close();
} finally {
  await browser.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\nÖzet: ${checks.length - failed.length}/${checks.length} geçti.`);
if (failed.length) process.exit(1);
