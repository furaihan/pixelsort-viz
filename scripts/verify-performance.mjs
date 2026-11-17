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
await page.getByRole('button', { name: /try a sample/i }).click();
await page.waitForTimeout(1500);

// 8x8 blocks: 40,000 elements. Bubble Sort should be blocked by the O(n^2) guard.
await page.locator('section[aria-labelledby="granularity-title"] label').nth(1).click();
await page.waitForTimeout(500);
await page.getByLabel('Choose an algorithm').selectOption('bubble');
await page.waitForTimeout(300);
const bubbleBlocked = await page.getByRole('button', { name: /start sorting/i }).isDisabled();
const bubbleWarning = await page.locator('.alert').first().innerText();

// Merge Sort should be allowed, and the mode should auto-select Performance.
await page.getByLabel('Choose an algorithm').selectOption('merge');
await page.waitForTimeout(300);
const performancePressed = await page
  .getByRole('button', { name: 'Performance' })
  .getAttribute('aria-pressed');

await page.locator('input[type="range"]').evaluate((element) => {
  element.value = '6';
  element.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForTimeout(200);
await page.getByRole('button', { name: /start sorting/i }).click();
await page.waitForFunction(() => document.body.innerText.includes('COMPLETE'), {
  timeout: 120000,
});
await page.waitForTimeout(500);
await page.screenshot({ path: '.impeccable/review/desktop-8px-complete.png', fullPage: true });

const eightPx = await page.evaluate(() => {
  const app = window.__pixelSort;
  const permutation = app.permutation;
  let sorted = true;
  for (let i = 0; i < permutation.length; i += 1) {
    if (permutation[i] !== i) {
      sorted = false;
      break;
    }
  }
  return { status: app.status, length: permutation.length, sorted, mode: app.mode };
});

// Pixel mode: 1,024,000 elements. Performance mode should handle it.
await page.locator('section[aria-labelledby="granularity-title"] label').nth(0).click();
await page.waitForTimeout(800);
const pixelMode = await page.evaluate(() => {
  const app = window.__pixelSort;
  return { mode: app.mode, elements: app.gridInfo?.elementCount, status: app.status };
});

await page.getByLabel('Choose an algorithm').selectOption('merge');
await page.waitForTimeout(300);
await page.locator('input[type="range"]').evaluate((element) => {
  element.value = '6';
  element.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForTimeout(200);
await page.getByRole('button', { name: /start sorting/i }).click();
await page.waitForFunction(() => document.body.innerText.includes('COMPLETE'), {
  timeout: 120000,
});
await page.waitForTimeout(800);
await page.screenshot({ path: '.impeccable/review/desktop-pixel-complete.png', fullPage: true });

const pixelResult = await page.evaluate(() => {
  const app = window.__pixelSort;
  const permutation = app.permutation;
  let sorted = true;
  for (let i = 0; i < permutation.length; i += 1) {
    if (permutation[i] !== i) {
      sorted = false;
      break;
    }
  }
  const canvas = document.querySelector('[role="img"] canvas');
  const context = canvas.getContext('2d');
  const points = [
    [930, 300],
    [300, 300],
    [100, 100],
    [640, 400],
  ];
  return {
    status: app.status,
    length: permutation.length,
    sorted,
    mode: app.mode,
    pixels: points.map(([x, y]) => Array.from(context.getImageData(x, y, 1, 1).data)),
  };
});

console.log(
  JSON.stringify(
    { errors, bubbleBlocked, bubbleWarning, performancePressed, eightPx, pixelMode, pixelResult },
    null,
    2,
  ),
);
await browser.close();
