import { chromium } from 'playwright-core';

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
await page.locator('section[aria-labelledby="granularity-title"] label').nth(5).click();
await page.waitForTimeout(500);
await page.locator('input[type="range"]').evaluate((element) => {
  element.value = '6';
  element.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForTimeout(200);

const ids = [
  'bubble',
  'selection',
  'insertion',
  'merge',
  'quick',
  'shell',
  'heap',
  'counting',
  'radix',
  'bucket',
];
const results = [];

for (const id of ids) {
  await page.getByLabel('Choose an algorithm').selectOption(id);
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /start sorting/i }).click();
  await page.waitForFunction(() => window.__pixelSort.status === 'completed', {
    timeout: 30000,
  });
  await page.waitForTimeout(200);
  const result = await page.evaluate(() => {
    const app = window.__pixelSort;
    const permutation = app.permutation;
    let sorted = true;
    for (let i = 0; i < permutation.length; i += 1) {
      if (permutation[i] !== i) {
        sorted = false;
        break;
      }
    }
    return {
      status: app.status,
      sorted,
      comparisons: app.counters.comparisons,
      swaps: app.counters.swaps,
      writes: app.counters.writes,
      reads: app.counters.reads,
      auxWrites: app.counters.auxWrites,
      passes: app.counters.passes,
      maxDepth: app.counters.maxDepth,
      activeMs: app.activeMs,
    };
  });
  results.push({ id, ...result });
}

console.log(JSON.stringify({ errors, results }, null, 2));
await browser.close();
