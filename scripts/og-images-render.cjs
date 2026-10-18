// scripts/og-images.py'nin ürettiği HTML'i sitenin yazı tipleriyle çizer ve public/og/ altına kaydeder.
// Playwright gerekir (npx playwright veya PLAYWRIGHT_PATH ile yolu verilebilir).
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const path = require('path');
const H = require('./.og-html.json');
const OUT = path.join(__dirname, '..', 'public', 'og');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await p.goto(process.env.SITE || 'http://localhost:3000/'); await p.waitForTimeout(800);
  for (const l of Object.keys(H)) {
    await p.evaluate((h) => { document.body.innerHTML = h; }, H[l]);
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(250);
    await p.locator('#cap').screenshot({ path: path.join(OUT, `home-${l}.png`) });
  }
  await b.close();
})();
