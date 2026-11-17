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

const seed1 = await page.evaluate(() => window.__pixelSort.seed);
await page.getByRole('button', { name: /start sorting/i }).click();
await page.waitForTimeout(600);
await page.getByRole('button', { name: /^reset$/i }).click();
await page.waitForTimeout(400);
const afterReset = await page.evaluate(() => ({
  status: window.__pixelSort.status,
  comparisons: window.__pixelSort.counters.comparisons,
  seed: window.__pixelSort.seed,
}));

await page.getByRole('button', { name: /start sorting/i }).click();
await page.waitForTimeout(600);
await page.getByRole('button', { name: /^shuffle$/i }).click();
await page.waitForTimeout(400);
const afterShuffle = await page.evaluate(() => ({
  status: window.__pixelSort.status,
  comparisons: window.__pixelSort.counters.comparisons,
  seed: window.__pixelSort.seed,
}));

await page.getByRole('button', { name: /start sorting/i }).click();
await page.waitForTimeout(600);
await page.getByRole('button', { name: /^restore$/i }).click();
await page.waitForTimeout(400);
const afterRestore = await page.evaluate(() => {
  const app = window.__pixelSort;
  const permutation = app.permutation;
  let sorted = true;
  for (let i = 0; i < permutation.length; i += 1) {
    if (permutation[i] !== i) {
      sorted = false;
      break;
    }
  }
  return { status: app.status, sorted, comparisons: app.counters.comparisons };
});

console.log(
  JSON.stringify(
    {
      errors,
      seed1,
      afterReset,
      afterShuffle,
      afterRestore,
      resetKeptShuffle: seed1 === afterReset.seed,
      shuffleChanged: seed1 !== afterShuffle.seed,
    },
    null,
    2,
  ),
);
await browser.close();
