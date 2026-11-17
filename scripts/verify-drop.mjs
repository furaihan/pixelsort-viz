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

const dropped = await page.evaluate(async () => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  context.fillStyle = '#C6FF00';
  context.fillRect(0, 0, 64, 64);
  context.fillStyle = '#FF1493';
  context.fillRect(16, 16, 32, 32);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  const file = new File([blob], 'drop-test.png', { type: 'image/png' });
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  const dropzone = document.querySelector('[role="button"][aria-label^="Upload an image"]');
  dropzone.dispatchEvent(
    new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer }),
  );
  dropzone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }));
  return true;
});

await page.waitForTimeout(1500);
const result = await page.evaluate(() => {
  const app = window.__pixelSort;
  return {
    status: app.status,
    fileName: app.imageInfo?.fileName,
    width: app.imageInfo?.width,
    height: app.imageInfo?.height,
    elements: app.gridInfo?.elementCount,
  };
});

console.log(JSON.stringify({ errors, dropped, result }, null, 2));
await browser.close();
