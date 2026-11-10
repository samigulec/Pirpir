// usage: node render.mjs out.mp4 [fps] [start] [end]   |  node render.mjs --stills t1,t2,...
import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox', '--allow-file-access-from-files', '--disable-web-security', '--font-render-hinting=none', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await page.goto('file://' + path.join(here, 'ad.html'), { waitUntil: 'load' });
await page.evaluate(() => window.ready);
page.on('console', m => console.log('page:', m.text()));
page.on('pageerror', e => console.log('ERR', e.message));

if (args[0] === '--stills') {
  fs.mkdirSync('stills', { recursive: true });
  for (const t of args[1].split(',').map(Number)) {
    await page.evaluate(t => setT(t), t);
    await page.screenshot({ path: `stills/t${t.toFixed(2)}.png` });
  }
} else {
  const out = args[0], fps = +(args[1] || 30), t0 = +(args[2] || 0), t1 = +(args[3] || 24.8);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round((t1 - t0) * fps);
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => setT(t), t0 + i / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 96 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0) console.log('frame', i, '/', n);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await browser.close();
