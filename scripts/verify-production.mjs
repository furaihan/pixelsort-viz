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

await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
const debugGlobal = await page.evaluate(() => typeof window.__pixelSort);

await page.getByRole('button', { name: /try a sample/i }).click();
await page.waitForTimeout(1500);
await page.locator('section[aria-labelledby="granularity-title"] label').nth(5).click();
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

const result = await page.evaluate(() => {
  const canvas = document.querySelector('[role="img"] canvas');
  const context = canvas.getContext('2d');
  const points = [
    [930, 300],
    [300, 300],
    [100, 100],
    [640, 400],
  ];
  const stats = Array.from(
    document.querySelectorAll('section[aria-labelledby="stats-title"] .bg-ink-3'),
  ).map((metric) => ({
    label: metric.querySelector('.label')?.textContent?.trim(),
    value: metric.querySelector('strong')?.textContent?.trim(),
  }));
  return {
    status: document.querySelector('header [role="status"]')?.textContent?.trim(),
    completeText: document.body.innerText.includes('Complete — original arrangement restored.'),
    stats,
    pixels: points.map(([x, y]) => Array.from(context.getImageData(x, y, 1, 1).data)),
  };
});

console.log(JSON.stringify({ errors, debugGlobal, result }, null, 2));
await browser.close();
