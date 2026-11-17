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

await page.locator('label.segment').nth(5).click();
await page.waitForTimeout(500);
await page.getByLabel('Choose an algorithm').selectOption('merge');
await page.waitForTimeout(300);

await page.locator('input[type="range"]').evaluate((element) => {
  element.value = '6';
  element.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForTimeout(200);

await page.getByRole('button', { name: /start sorting/i }).click();
await page.waitForFunction(() => document.body.innerText.includes('COMPLETE'), {
  timeout: 30000,
});
await page.waitForTimeout(500);
await page.screenshot({ path: '.impeccable/review/desktop-complete.png', fullPage: true });

const debug = await page.evaluate(() => {
  const app = window.__pixelSort;
  const permutation = app.permutation;
  let sorted = true;
  for (let i = 0; i < permutation.length; i += 1) {
    if (permutation[i] !== i) {
      sorted = false;
      break;
    }
  }
  const canvas = document.querySelector('.main-canvas');
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
    first: Array.from(permutation.slice(0, 20)),
    pixels: points.map(([x, y]) => Array.from(context.getImageData(x, y, 1, 1).data)),
    dataUrl: canvas.toDataURL('image/png'),
  };
});

const { writeFileSync } = await import('node:fs');
writeFileSync(
  '.impeccable/review/main-canvas.png',
  Buffer.from(debug.dataUrl.split(',')[1], 'base64'),
);
delete debug.dataUrl;

await page.evaluate(() => window.__pixelSort.forceRender());
await page.waitForTimeout(100);
const forcedDataUrl = await page.evaluate(() =>
  document.querySelector('.main-canvas').toDataURL('image/png'),
);
writeFileSync(
  '.impeccable/review/main-canvas-forced.png',
  Buffer.from(forcedDataUrl.split(',')[1], 'base64'),
);
const rendererDebug = await page.evaluate(() => window.__pixelSort.debugState());
console.log(JSON.stringify({ rendererDebug }, null, 2));

await page.getByRole('button', { name: /how it works/i }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: '.impeccable/review/desktop-guide.png', fullPage: true });

console.log(JSON.stringify({ errors, debug }, null, 2));
await browser.close();
