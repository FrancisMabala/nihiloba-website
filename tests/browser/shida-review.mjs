import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.SHIDA_TEST_URL || 'http://127.0.0.1:3034';
const output = 'test-results/shida';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
  for (const locale of ['en', 'fr']) {
    for (const width of [1440, 1024, 768, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const path = locale === 'en' ? '/shida/' : '/fr/shida/';
      const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      assert.equal(await page.locator('html').getAttribute('lang'), locale);
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('.shida-story').count(), 8);
      assert.equal(await page.locator('.shida-story-journey li').count(), 32);
      assert.ok(await page.locator('meta[property="og:title"]').getAttribute('content'));
      assert.equal(new URL(await page.locator('link[rel="canonical"]').getAttribute('href')).pathname.replace(/\/$/, ''), path.replace(/\/$/, ''));
      const images = page.locator('.shida-editorial img');
      assert.equal(await images.count(), 10);
      for (const img of await images.all()) {
        await img.scrollIntoViewIfNeeded();
        await img.evaluate(el => el.decode());
        assert.ok(await img.getAttribute('alt'));
        assert.ok(await img.getAttribute('sizes'));
        assert.ok(await img.evaluate(el => el.naturalWidth > 0));
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${locale} ${width}: overflow`);
      for (const link of await page.locator('.shida-editorial a').all()) {
        assert.ok((await link.boundingBox()).height >= 44);
        const href = await link.getAttribute('href');
        if (href.startsWith('https:')) assert.equal(href, 'https://wa.me/46769709059?text=Bonjour');
        if (href.startsWith('#')) assert.equal(await page.locator(href).count(), 1);
      }
      const links = await page.locator('.shida-story-link').evaluateAll(els => els.map(el => el.getAttribute('href')));
      const prefix = locale === 'en' ? '' : '/fr';
      assert.deepEqual(links.slice(0, 6).map(p => p.replace(/\/$/, '')), ['emplois', 'services', 'wenze', 'appartements', 'hotels', 'restaurants'].map(p => `${prefix}/shida/${p}`));
      const start = page.locator('.shida-story-hero a').first();
      await start.click();
      await page.waitForTimeout(400);
      assert.equal(new URL(page.url()).hash, '#stories');
      await page.keyboard.press('Tab');
      await start.focus();
      assert.equal(await start.evaluate(el => getComputedStyle(el).outlineStyle), 'solid');
      if (width < 940) {
        await page.locator('.menu-button').click();
        assert.equal(await page.locator('.menu-button').getAttribute('aria-expanded'), 'true');
        await page.locator('.menu-button').click();
      }
      assert.equal(await page.locator('.header-cart-link').count(), 1);
      assert.equal(await page.locator('.site-footer .footer-column').count(), 3);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `${output}/${locale}-${width}.png`, fullPage: true });
      assert.deepEqual(errors, []);
      results.push({ locale, width, images: 10, links, errors });
      await page.close();
    }
  }
  const page = await browser.newPage();
  for (const path of new Set(results.flatMap(r => r.links).filter(p => p.startsWith('/')))) {
    assert.equal((await page.request.get(`${base}${path}`)).status(), 200, path);
  }
  for (const path of ['/en/shida/', '/en/', '/fr/', '/en/about/', '/fr/about/', '/en/products/', '/fr/products/']) {
    assert.equal((await page.goto(`${base}${path}`)).status(), 200, path);
    assert.equal(await page.locator('h1').count(), 1);
  }
  await fs.writeFile(`${output}/verification.json`, JSON.stringify(results, null, 2));
  console.log(`Passed ${results.length} SHIDA viewport/locale reviews, marketplace links and shared-page smoke checks.`);
} finally { await browser.close(); }

