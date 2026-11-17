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

await page.locator('label.segment').nth(0).click();
await page.waitForTimeout(500);
await page.getByLabel('Choose an algorithm').selectOption('bubble');
await page.waitForTimeout(300);

const bubbleDisabled = await page.getByRole('button', { name: /start sorting/i }).isDisabled();
const bubbleWarning = await page.locator('.alert').first().innerText();

await page.getByLabel('Choose an algorithm').selectOption('merge');
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Educational' }).click();
await page.waitForTimeout(300);

const educationalDisabled = await page.getByRole('button', { name: /start sorting/i }).isDisabled();
const educationalWarning = await page.locator('.alert').first().innerText();

await page.getByRole('button', { name: 'Performance' }).click();
await page.waitForTimeout(300);
const performanceEnabled = await page.getByRole('button', { name: /start sorting/i }).isEnabled();

console.log(
  JSON.stringify(
    {
      errors,
      bubbleDisabled,
      bubbleWarning,
      educationalDisabled,
      educationalWarning,
      performanceEnabled,
    },
    null,
    2,
  ),
);
await browser.close();
