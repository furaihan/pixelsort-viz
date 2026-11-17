import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

mkdirSync('.impeccable/review', { recursive: true });

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

// Stage fit at the target desktop viewport.
await page.getByRole('button', { name: /try a sample/i }).click();
await page.waitForTimeout(1500);
const desktopStage = await page.evaluate(() => {
  const stage = document.querySelector('section[aria-label="Visualization and playback"]');
  const playback = document.querySelector('section[aria-label="Playback controls"]');
  return {
    viewportHeight: window.innerHeight,
    stageHeight: Math.round(stage.getBoundingClientRect().height),
    stageBottom: Math.round(stage.getBoundingClientRect().bottom),
    playbackBottom: Math.round(playback.getBoundingClientRect().bottom),
    position: getComputedStyle(stage).position,
  };
});

// Short laptop viewport: the sticky trap must be gone.
await page.setViewportSize({ width: 1366, height: 768 });
await page.waitForTimeout(400);
const laptopStage = await page.evaluate(() => {
  const stage = document.querySelector('section[aria-label="Visualization and playback"]');
  const playback = document.querySelector('section[aria-label="Playback controls"]');
  playback.scrollIntoView({ block: 'center' });
  return {
    viewportHeight: window.innerHeight,
    stageHeight: Math.round(stage.getBoundingClientRect().height),
    stagePosition: getComputedStyle(stage).position,
    playbackVisible: playback.getBoundingClientRect().top < window.innerHeight,
  };
});
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(300);

// Duplicate upload error: with no image, only the stage uploader should show it.
await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
await page.evaluate(() => {
  window.__pixelSort.uploadError = 'Simulated upload failure. Try another image.';
});
await page.waitForTimeout(300);
const uploadErrorCount = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.alert')).filter((element) =>
    (element.textContent ?? '').includes('Simulated upload failure'),
  ).length;
});

// Notice rendering.
await page.getByRole('button', { name: /try a sample/i }).click();
await page.waitForTimeout(1500);
await page.evaluate(() => {
  window.__pixelSort.notice =
    'Large image: 12.0 MP. Rendering may be slower; a larger block size keeps the run responsive.';
});
await page.waitForTimeout(300);
const notice = await page.evaluate(() => {
  const element = document.querySelector('section[aria-labelledby="image-panel-title"] [role="status"]');
  return { visible: Boolean(element), text: (element?.textContent ?? '').trim().slice(0, 80) };
});
await page.screenshot({ path: '.impeccable/review/desktop-notice.png', fullPage: true });

// Error state rendering.
await page.evaluate(() => {
  const app = window.__pixelSort;
  app.notice = null;
  app.status = 'error';
  app.error = 'Simulated worker failure. Reset and try again.';
  app.currentEvent = null;
  app.currentLabel = 'Run stopped.';
  app.currentDetail = 'The sorting worker reported an error. Reset and try again.';
});
await page.waitForTimeout(400);
const errorState = await page.evaluate(() => {
  const app = window.__pixelSort;
  const alerts = Array.from(document.querySelectorAll('.alert')).map((element) =>
    (element.textContent ?? '').trim().slice(0, 80),
  );
  return {
    status: app.status,
    error: app.error,
    statusPill: document.querySelector('header [role="status"]')?.textContent?.trim(),
    primary: document.querySelector('.btn-primary')?.textContent?.trim(),
    inspectorBadge: document
      .querySelector('#inspector-title')
      ?.closest('.panel')
      ?.querySelector('.panel-head .chip')
      ?.textContent?.trim(),
    nowLabel: document.querySelector('[aria-label="Image workspace"] [aria-live] strong')?.textContent?.trim(),
    alerts,
  };
});
await page.screenshot({ path: '.impeccable/review/desktop-error.png', fullPage: true });

// Validation failure tone: pink, not lime.
await page.evaluate(() => {
  const app = window.__pixelSort;
  app.status = 'error';
  app.error = 'The final permutation did not validate. Reset and try again.';
  app.currentEvent = {
    type: 'complete',
    counters: { ...app.counters },
    elapsedMs: app.activeMs,
    validated: false,
  };
  app.currentLabel = 'Validation failed.';
  app.currentDetail = 'The final permutation is not the original arrangement. Reset and try again.';
});
await page.waitForTimeout(400);
const validationTone = await page.evaluate(() => ({
  nowTone: document.querySelector('[aria-label="Image workspace"] [data-tone]')?.getAttribute('data-tone'),
  nowStamp: document.querySelector('[aria-label="Image workspace"] [data-tone]')?.textContent?.trim(),
  inspectorTone: document.querySelector('section[aria-labelledby="inspector-title"] [data-tone]')?.getAttribute('data-tone'),
}));
await page.screenshot({
  path: '.impeccable/review/desktop-validation-failed.png',
  fullPage: true,
});

// Large-workload blocker from the real UI.
await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /try a sample/i }).click();
await page.waitForTimeout(1500);
await page.locator('section[aria-labelledby="granularity-title"] label').nth(0).click();
await page.waitForTimeout(500);
await page.getByLabel('Choose an algorithm').selectOption('bubble');
await page.waitForTimeout(300);
const blocker = await page.evaluate(() => ({
  disabled: document.querySelector('.btn-primary')?.disabled,
  warning: document.querySelector('.alert')?.textContent?.trim().slice(0, 120),
}));
await page.screenshot({ path: '.impeccable/review/desktop-large-blocker.png', fullPage: true });

console.log(
  JSON.stringify(
    {
      errors,
      desktopStage,
      laptopStage,
      uploadErrorCount,
      notice,
      errorState,
      validationTone,
      blocker,
    },
    null,
    2,
  ),
);
await browser.close();
