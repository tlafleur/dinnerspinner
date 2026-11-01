// Renders icons/icon.svg to the PNG sizes iOS and the manifest want. Needs Playwright's Chromium.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || 'playwright');
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const svg = readFileSync(resolve('icons/icon.svg'), 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();
const out = [['icon-512.png', 512, 0], ['icon-192.png', 192, 0], ['apple-touch-icon.png', 180, 0], ['icon-maskable-512.png', 512, 0.1]];
for (const [name, size, pad] of out) {
  const inner = Math.round(size * (1 - 2 * pad));
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:#FFE9C2;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center"><div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body></html>`);
  await page.screenshot({ path: resolve('icons', name), clip: { x: 0, y: 0, width: size, height: size }, omitBackground: pad === 0 });
  console.log('wrote', name);
}
await browser.close();
