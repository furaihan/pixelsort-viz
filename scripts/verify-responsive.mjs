import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

mkdirSync('.impeccable/review', { recursive: true });

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /try a sample/i }).click();
await page.waitForTimeout(1500);
await page.getByRole('button', { name: /start sorting/i }).click();
await page.waitForTimeout(500);
await page.getByRole('button', { name: /^pause$/i }).click();
await page.waitForTimeout(300);

const widths = [320, 390, 768, 1024, 1440];
const checks = [];
for (const width of widths) {
  await page.setViewportSize({ width, height: 900 });
  await page.waitForTimeout(400);
  const check = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  checks.push({ width, ...check, overflow: check.scrollWidth > check.innerWidth + 1 });
  if (width === 320 || width === 768) {
    await page.screenshot({ path: `.impeccable/review/width-${width}.png`, fullPage: true });
  }
}

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(300);
await page.getByRole('button', { name: /how it works/i }).click();
await page.waitForTimeout(400);
const dialogCheck = await page.evaluate(() => {
  const dialog = document.querySelector('dialog');
  const rect = dialog.getBoundingClientRect();
  return {
    open: dialog.open,
    left: rect.left,
    right: rect.right,
    width: rect.width,
    viewport: window.innerWidth,
    fits: rect.left >= 0 && rect.right <= window.innerWidth + 1,
  };
});
await page.screenshot({ path: '.impeccable/review/mobile-guide.png', fullPage: true });

console.log(JSON.stringify({ errors, checks, dialogCheck }, null, 2));
await browser.close();
