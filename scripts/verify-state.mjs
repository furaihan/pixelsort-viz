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
await page.waitForTimeout(1000);
await page.getByRole('button', { name: /^pause$/i }).click();
await page.waitForTimeout(300);
const paused = await page.evaluate(() => ({
  status: window.__pixelSort.status,
  comparisons: window.__pixelSort.counters.comparisons,
}));

await page.getByRole('button', { name: /^reset$/i }).click();
await page.waitForTimeout(300);
const afterReset = await page.evaluate(() => {
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
    seed: app.seed,
    status: app.status,
    comparisons: app.counters.comparisons,
    sorted,
  };
});

await page.getByRole('button', { name: /^shuffle$/i }).click();
await page.waitForTimeout(300);
const seed2 = await page.evaluate(() => window.__pixelSort.seed);

await page.getByRole('button', { name: /^restore$/i }).click();
await page.waitForTimeout(300);
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
  return { status: app.status, sorted };
});

await page.getByLabel('Choose an algorithm').selectOption('quick');
await page.waitForTimeout(300);
const afterAlgorithm = await page.evaluate(() => ({
  seed: window.__pixelSort.seed,
  status: window.__pixelSort.status,
}));

await page.locator('section[aria-labelledby="granularity-title"] label').nth(2).click();
await page.waitForTimeout(300);
const seed3 = await page.evaluate(() => window.__pixelSort.seed);

console.log(
  JSON.stringify(
    {
      errors,
      seed1,
      paused,
      afterReset,
      seed2,
      afterRestore,
      afterAlgorithm,
      seed3,
      resetKeptShuffle: seed1 === afterReset.seed,
      shuffleChanged: seed1 !== seed2,
      algorithmKeptShuffle: seed2 === afterAlgorithm.seed,
      blockSizeChangedShuffle: seed2 !== seed3,
    },
    null,
    2,
  ),
);
await browser.close();
