import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /try a sample/i }).click();
await page.waitForTimeout(1500);
await page.getByRole('button', { name: /start sorting/i }).click();
await page.waitForTimeout(500);
await page.getByRole('button', { name: /^pause$/i }).click();
await page.waitForTimeout(300);

const audit = await page.evaluate(() => {
  function parseColor(value) {
    const match = value.match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const parts = match[1].split(',').map((part) => Number(part.trim()));
    return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
  }

  function luminance(color) {
    const channel = (value) => {
      const normalized = value / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
  }

  function backgroundOf(element) {
    let current = element;
    while (current) {
      const style = getComputedStyle(current);
      const color = parseColor(style.backgroundColor);
      if (color && color.a > 0.95) return color;
      current = current.parentElement;
    }
    return { r: 17, g: 17, b: 17, a: 1 };
  }

  function contrastOf(element) {
    const foreground = parseColor(getComputedStyle(element).color);
    if (!foreground) return null;
    const background = backgroundOf(element);
    const light = Math.max(luminance(foreground), luminance(background));
    const dark = Math.min(luminance(foreground), luminance(background));
    return Number(((light + 0.05) / (dark + 0.05)).toFixed(2));
  }

  const selectors = [
    '.panel-note',
    '.label',
    'section[aria-labelledby="stats-title"] .bg-ink-3 .label',
    '.definitions dd',
    '.algo-notes li',
    '.now-copy span',
    '.proof-label',
    '.proof-meta',
    '.status-pill',
    '.footer',
    '.mode-note',
    '.shortcut-hint',
    '.canvas-note',
    '.image-dims',
    '.privacy-line',
  ];

  const contrasts = [];
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (!element) continue;
    const style = getComputedStyle(element);
    contrasts.push({
      selector,
      fontSize: style.fontSize,
      color: style.color,
      contrast: contrastOf(element),
      text: (element.textContent ?? '').trim().slice(0, 40),
    });
  }

  const buttonsWithoutNames = [];
  for (const button of document.querySelectorAll('button')) {
    const name = (button.getAttribute('aria-label') ?? button.textContent ?? '').trim();
    if (!name) {
      buttonsWithoutNames.push(button.className);
    }
  }

  const fieldsWithoutLabels = [];
  for (const field of document.querySelectorAll('input, select')) {
    if (field.type === 'file') continue;
    const id = field.id;
    const labelled =
      (id && document.querySelector(`label[for="${id}"]`)) ||
      field.closest('label') ||
      field.getAttribute('aria-label') ||
      field.getAttribute('aria-labelledby');
    if (!labelled) fieldsWithoutLabels.push(field.outerHTML.slice(0, 120));
  }

  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4')).map((heading) => ({
    level: heading.tagName,
    text: (heading.textContent ?? '').trim().slice(0, 60),
  }));

  return {
    lang: document.documentElement.lang,
    contrasts,
    buttonsWithoutNames,
    fieldsWithoutLabels,
    headings,
  };
});

await page.emulateMedia({ reducedMotion: 'reduce' });
await page.waitForTimeout(200);
const reducedMotion = await page.evaluate(() => {
  const element =
    document.querySelector('[aria-label="Image workspace"] .animate-pulse-soft') ??
    document.querySelector('header [role="status"] span');
  if (!element) return null;
  const style = getComputedStyle(element);
  return {
    animationDuration: style.animationDuration,
    animationName: style.animationName,
  };
});

console.log(JSON.stringify({ audit, reducedMotion }, null, 2));
await browser.close();
