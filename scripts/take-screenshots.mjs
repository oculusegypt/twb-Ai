import { chromium } from 'playwright-core';
import { mkdir } from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const BASE_URL = 'http://localhost:20251';
const SCREENSHOTS_DIR = path.resolve('screenshots');

const SCREENS = [
  { name: '01-home',          path: '/',              title: 'الرئيسية - Home' },
  { name: '02-covenant',      path: '/covenant',      title: 'العهد - Covenant' },
  { name: '03-sos',           path: '/sos',           title: 'طوارئ - SOS Emergency' },
  { name: '04-dhikr',         path: '/dhikr',         title: 'الذكر - Dhikr' },
  { name: '05-habits',        path: '/habits',        title: 'العادات - Habits' },
  { name: '06-zakiy',         path: '/zakiy',         title: 'زكي AI - Zakiy AI' },
  { name: '07-progress',      path: '/progress',      title: 'التقدم - Progress' },
  { name: '08-journey',       path: '/journey',       title: 'الرحلة - 30-Day Journey' },
  { name: '09-dhikr-rooms',   path: '/dhikr-rooms',   title: 'غرف الذكر - Dhikr Rooms' },
  { name: '10-prayer-times',  path: '/prayer-times',  title: 'أوقات الصلاة - Prayer Times' },
  { name: '11-journal',       path: '/journal',       title: 'المذكرة - Journal' },
  { name: '12-rajaa',         path: '/rajaa',         title: 'الرجاء - Hope & Mercy' },
];

// Phone dimensions — matches iPhone 14 Pro / Google Play standard
const MOBILE_VIEWPORT  = { width: 390, height: 844 };
// Desktop for GitHub banner
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

// Use the nix-installed chromium
const CHROMIUM_PATH = execSync('which chromium', { encoding: 'utf8' }).trim();
console.log(`Using chromium at: ${CHROMIUM_PATH}`);

async function takeScreenshots() {
  await mkdir(SCREENSHOTS_DIR, { recursive: true });
  await mkdir(`${SCREENSHOTS_DIR}/mobile`, { recursive: true });
  await mkdir(`${SCREENSHOTS_DIR}/desktop`, { recursive: true });

  const browser = await chromium.launch({
    executablePath: CHROMIUM_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  for (const screen of SCREENS) {
    console.log(`\n📸 Capturing: ${screen.title}`);

    for (const [type, viewport] of [['mobile', MOBILE_VIEWPORT], ['desktop', DESKTOP_VIEWPORT]]) {
      const context = await browser.newContext({
        viewport,
        deviceScaleFactor: 2,
        locale: 'ar-SA',
        colorScheme: 'light',
      });
      const page = await context.newPage();

      try {
        await page.goto(`${BASE_URL}${screen.path}`, {
          waitUntil: 'networkidle',
          timeout: 15000,
        });

        await page.waitForTimeout(2500);

        const filePath = `${SCREENSHOTS_DIR}/${type}/${screen.name}.png`;
        await page.screenshot({ path: filePath, fullPage: false });
        console.log(`  ✅ ${type}: ${filePath}`);
      } catch (err) {
        console.error(`  ❌ Failed ${type}/${screen.name}: ${err.message}`);
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();
  console.log('\n🎉 All screenshots saved to ./screenshots/');
}

takeScreenshots().catch(console.error);
