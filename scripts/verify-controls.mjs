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

// Step from the scrambled state should start paused and apply one event.
await page.getByRole('button', { name: /^step$/i }).click();
await page.waitForTimeout(500);
const afterStep = await page.evaluate(() => ({
  status: window.__pixelSort.status,
  comparisons: window.__pixelSort.counters.comparisons,
  event: window.__pixelSort.currentEvent?.type ?? null,
}));

// Keyboard: Space should resume, ArrowRight should step, R should reset.
await page.locator('.footer').click({ position: { x: 10, y: 10 } });
await page.keyboard.press('Space');
await page.waitForTimeout(500);
const afterSpace = await page.evaluate(() => window.__pixelSort.status);
await page.keyboard.press('Space');
await page.waitForTimeout(300);
const afterSpacePause = await page.evaluate(() => window.__pixelSort.status);
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(300);
const afterArrow = await page.evaluate(() => ({
  status: window.__pixelSort.status,
  comparisons: window.__pixelSort.counters.comparisons,
}));
await page.keyboard.press('r');
await page.waitForTimeout(300);
const afterR = await page.evaluate(() => ({
  status: window.__pixelSort.status,
  comparisons: window.__pixelSort.counters.comparisons,
}));

// Replay from a completed run.
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
await page.waitForTimeout(300);
const completed = await page.evaluate(() => window.__pixelSort.status);
await page.locator('input[type="range"]').evaluate((element) => {
  element.value = '1';
  element.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForTimeout(200);
await page.getByRole('button', { name: /^replay$/i }).click();
await page.waitForTimeout(500);
const afterReplay = await page.evaluate(() => ({
  status: window.__pixelSort.status,
  comparisons: window.__pixelSort.counters.comparisons,
}));
if (afterReplay.status === 'running') {
  await page.getByRole('button', { name: /^pause$/i }).click();
}

console.log(
  JSON.stringify(
    { errors, afterStep, afterSpace, afterSpacePause, afterArrow, afterR, completed, afterReplay },
    null,
    2,
  ),
);
await browser.close();
