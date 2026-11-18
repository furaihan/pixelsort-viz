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
const english = await page.evaluate(() => ({
  lang: document.documentElement.lang,
  title: document.title,
  heading: document.querySelector('h2')?.textContent?.trim(),
  start: document.querySelector('.primary')?.textContent?.trim(),
}));

await page.selectOption('#language-select', 'id');
await page.waitForTimeout(400);
const indonesian = await page.evaluate(() => ({
  lang: document.documentElement.lang,
  title: document.title,
  heading: document.querySelector('h2')?.textContent?.trim(),
  start: document.querySelector('.primary')?.textContent?.trim(),
}));

await page.selectOption('#language-select', 'en');
await page.waitForTimeout(400);
const backToEnglish = await page.evaluate(() => ({
  lang: document.documentElement.lang,
  title: document.title,
  heading: document.querySelector('h2')?.textContent?.trim(),
  start: document.querySelector('.primary')?.textContent?.trim(),
}));

console.log(JSON.stringify({ errors, english, indonesian, backToEnglish }, null, 2));
await browser.close();
