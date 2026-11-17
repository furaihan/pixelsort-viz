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

const readPixel = () =>
  page.evaluate(() => {
    const canvas = document.querySelector('.main-canvas');
    const context = canvas.getContext('2d');
    return Array.from(context.getImageData(930, 300, 1, 1).data);
  });

const before = await readPixel();
await page.getByRole('button', { name: /show original ghost/i }).click();
await page.waitForTimeout(300);
const ghosted = await readPixel();
await page.getByRole('button', { name: /hide original ghost/i }).click();
await page.waitForTimeout(300);
const after = await readPixel();

console.log(JSON.stringify({ errors, before, ghosted, after }, null, 2));
await browser.close();
