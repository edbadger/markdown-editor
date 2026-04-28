/**
 * Generates README screenshots from the demo-content folder using a headless
 * Chrome instance. Maintainer-only — not part of the standard install.
 *
 *   npm install --save-dev puppeteer-core   # one-time
 *   npm run dev                             # in another terminal
 *   npx tsx scripts/take-screenshots.ts
 *
 * Outputs to docs/screenshots/. Restores the dev server's previously-active
 * folder when finished.
 */
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const CHROME_PATH =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const APP_URL = process.env.APP_URL ?? 'http://localhost:5173';
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..');
const DEMO_FOLDER = path.join(PROJECT_ROOT, 'demo-content');
const OUT_DIR = path.join(PROJECT_ROOT, 'docs', 'screenshots');

async function getRoot(): Promise<string | null> {
  try {
    const res = await fetch(`${APP_URL.replace('5173', '47821')}/api/root`);
    const json = (await res.json()) as { path: string | null };
    return json.path;
  } catch {
    return null;
  }
}

async function setRoot(p: string) {
  await fetch(`${APP_URL.replace('5173', '47821')}/api/root`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: p }),
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const priorRoot = await getRoot();

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1400, height: 900, deviceScaleFactor: 2 },
  });

  try {
    // Set the server's active root + open file via API before loading the page,
    // and seed localStorage so the app skips the folder picker.
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();

    await page.evaluateOnNewDocument(
      ({ folder, openFile }) => {
        try {
          localStorage.setItem('mdeditor.folder', folder);
          localStorage.setItem('mdeditor.openFile', openFile);
        } catch {}
      },
      { folder: DEMO_FOLDER, openFile: 'welcome.md' }
    );

    // Hero — formatted view of welcome.md.
    await page.goto(APP_URL, { waitUntil: 'load' });
    await page.waitForSelector('.milkdown .ProseMirror', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1500)); // let editor settle
    await page.screenshot({
      path: path.join(OUT_DIR, 'hero.png') as `${string}.png`,
      type: 'png',
    });
    console.log('✓ hero.png');

    // Selection toolbar — drag-select a phrase in welcome.md using a real
    // mouse interaction so ProseMirror's selection observer picks it up.
    const dragRange = await page.evaluate(() => {
      const editor = document.querySelector('.milkdown .ProseMirror');
      const para = editor?.querySelector('p');
      const textNode = para?.firstChild as Text | null;
      if (!textNode) return null;
      const r1 = document.createRange();
      r1.setStart(textNode, 14);
      r1.setEnd(textNode, 15);
      const r2 = document.createRange();
      r2.setStart(textNode, 24);
      r2.setEnd(textNode, 25);
      const a = r1.getBoundingClientRect();
      const b = r2.getBoundingClientRect();
      return {
        startX: a.left,
        startY: a.top + a.height / 2,
        endX: b.right,
        endY: b.top + b.height / 2,
      };
    });
    if (dragRange) {
      await page.mouse.move(dragRange.startX, dragRange.startY);
      await page.mouse.down();
      await page.mouse.move(dragRange.endX, dragRange.endY, { steps: 8 });
      await page.mouse.up();
    }
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({
      path: path.join(OUT_DIR, 'toolbar.png') as `${string}.png`,
      type: 'png',
    });
    console.log('✓ toolbar.png');

    // Source view — flip with Cmd+/.
    await page.evaluate(() => {
      const sourceBtn = [...document.querySelectorAll('button')].find(
        (b) => b.textContent?.trim() === 'Source'
      );
      sourceBtn?.click();
    });
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({
      path: path.join(OUT_DIR, 'source.png') as `${string}.png`,
      type: 'png',
    });
    console.log('✓ source.png');

    // Cheatsheet view — switch back to formatted, open the cheatsheet.
    await page.evaluate(() => {
      const fmtBtn = [...document.querySelectorAll('button')].find(
        (b) => b.textContent?.trim() === 'Formatted'
      );
      fmtBtn?.click();
    });
    await new Promise((r) => setTimeout(r, 300));
    await page.evaluate(() => {
      // Find file in sidebar
      const span = [...document.querySelectorAll('aside button span')].find(
        (s) => s.textContent === 'markdown-cheatsheet'
      );
      (span?.closest('button') as HTMLButtonElement | null)?.click();
    });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({
      path: path.join(OUT_DIR, 'features.png') as `${string}.png`,
      type: 'png',
    });
    console.log('✓ features.png');
  } finally {
    await browser.close();
    if (priorRoot && priorRoot !== DEMO_FOLDER) {
      await setRoot(priorRoot);
      console.log(`✓ restored root → ${priorRoot}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
