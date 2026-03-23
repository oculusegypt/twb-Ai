import { chromium } from 'playwright-core';
import { mkdir } from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const BASE_URL = 'http://localhost:20251';
const SCREENSHOTS_DIR = path.resolve('screenshots');

const SCREENS = [
  { name: '11-journal', path: '/journal', title: 'المذكرة - Journal' },
  { name: '12-rajaa',   path: '/rajaa',   title: 'الرجاء - Hope & Mercy' },
];

const MOBILE_VIEWPORT  = { width: 390, height: 844 };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const CHROMIUM_PATH = execSync('which chromium', { encoding: 'utf8' }).trim();

async function run() {
  await mkdir(`${SCREENSHOTS_DIR}/mobile`, { recursive: true });
  await mkdir(`${SCREENSHOTS_DIR}/desktop`, { recursive: true });

  const browser = await chromium.launch({
    executablePath: CHROMIUM_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  for (const screen of SCREENS) {
    console.log(`📸 ${screen.title}`);
    for (const [type, viewport] of [['mobile', MOBILE_VIEWPORT], ['desktop', DESKTOP_VIEWPORT]]) {
      const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, locale: 'ar-SA' });
      const page = await ctx.newPage();
      try {
        await page.goto(`${BASE_URL}${screen.path}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(3000);
        const fp = `${SCREENSHOTS_DIR}/${type}/${screen.name}.png`;
        await page.screenshot({ path: fp });
        console.log(`  ✅ ${type}: ${fp}`);
      } catch(e) { console.error(`  ❌ ${e.message}`); }
      finally { await ctx.close(); }
    }
  }
  await browser.close();
  console.log('Done!');
}
run().catch(console.error);
