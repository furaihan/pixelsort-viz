import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

mkdirSync('.impeccable/review', { recursive: true });

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});

const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});

const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
await page.screenshot({ path: '.impeccable/review/desktop-empty.png', fullPage: true });

await page.getByRole('button', { name: /try a sample/i }).click();
await page.waitForTimeout(1800);
await page.screenshot({ path: '.impeccable/review/desktop-loaded.png', fullPage: true });

await page.getByRole('button', { name: /start sorting/i }).click();
await page.waitForTimeout(1400);
await page.screenshot({ path: '.impeccable/review/desktop-running.png', fullPage: true });

await page.getByRole('button', { name: /^pause$/i }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: '.impeccable/review/desktop-paused.png', fullPage: true });

await page.getByRole('button', { name: /^step$/i }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: '.impeccable/review/desktop-step.png', fullPage: true });

await page.getByRole('button', { name: /how it works/i }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: '.impeccable/review/desktop-guide.png', fullPage: true });
await page.getByRole('button', { name: /close guide/i }).click();

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(600);
await page.screenshot({ path: '.impeccable/review/mobile.png', fullPage: true });

console.log(JSON.stringify({ errors }, null, 2));
await browser.close();
