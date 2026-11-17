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

const fileInput = page.locator('input[type="file"]').first();
await fileInput.setInputFiles('src/assets/hero.png');
await page.waitForTimeout(1500);
const loaded = await page.evaluate(() => {
  const app = window.__pixelSort;
  return {
    status: app.status,
    fileName: app.imageInfo?.fileName,
    width: app.imageInfo?.width,
    height: app.imageInfo?.height,
    elements: app.gridInfo?.elementCount,
  };
});

await fileInput.setInputFiles('test-invalid.txt');
await page.waitForTimeout(500);
const invalid = await page.evaluate(() => ({
  uploadError: window.__pixelSort.uploadError,
  status: window.__pixelSort.status,
  fileName: window.__pixelSort.imageInfo?.fileName,
}));

await page.getByRole('button', { name: /^remove$/i }).click();
await page.waitForTimeout(300);
const removed = await page.evaluate(() => ({
  status: window.__pixelSort.status,
  hasImage: window.__pixelSort.hasImage,
}));

console.log(JSON.stringify({ errors, loaded, invalid, removed }, null, 2));
await browser.close();
