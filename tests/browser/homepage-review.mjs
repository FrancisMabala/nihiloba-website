import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

// Run against a local Next server: node tests/browser/homepage-review.mjs
(async () => {
  const base = process.env.HOME_TEST_URL || 'http://127.0.0.1:3022';
  const output = 'docs/evidence/homepage';
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];
  try {
    for (const locale of ['en', 'fr']) {
      for (const width of [1440, 1024, 768, 390]) {
        const page = await browser.newPage({ viewport: { width, height: 1000 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const response = await page.goto(`${base}/${locale}/`, { waitUntil: 'networkidle' });
        await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
        assert.equal(response.status(), 200);
        assert.equal(await page.locator('h1').count(), 1);
        assert.equal(await page.locator('.home-markets li').count(), 7);
        assert.equal(await page.locator('html').getAttribute('lang'), locale);
        assert.ok(await page.locator('meta[name="description"]').getAttribute('content'));
        assert.ok(await page.locator('meta[property="og:title"]').getAttribute('content'));
        assert.equal(new URL(await page.locator('link[rel="canonical"]').getAttribute('href')).pathname.replace(/\/$/, ''), `/${locale}`);
        for (const img of await page.locator('.home-editorial img').all()) {
          await img.scrollIntoViewIfNeeded();
          await img.evaluate(el => el.decode());
          assert.ok(await img.getAttribute('alt'));
          assert.ok(await img.getAttribute('sizes'));
        }
        assert.equal(await page.locator('.home-editorial img').count(), 12);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        assert.equal(overflow, false, `${locale} ${width}: horizontal overflow`);
        const links = await page.locator('.home-editorial a').evaluateAll(els => els.map(el => el.getAttribute('href')));
        assert.ok(links.every(href => href && !href.includes('undefined')));
        const switcher = page.locator('.language-switcher a');
        if (width < 940) {
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.locator('.menu-button').click();
          assert.equal(await page.locator('.menu-button').getAttribute('aria-expanded'), 'true');
        }
        assert.ok(await switcher.isVisible());
        assert.equal(await switcher.getAttribute('href'), locale === 'en' ? '/fr/' : '/en/');
        assert.equal(await page.locator('.primary-nav .nav-link').count(), 6);
        assert.ok(await page.locator('.header-cart-link').isVisible());
        if (width < 940) await page.locator('.menu-button').click();
        await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 0); });
        await page.waitForFunction(() => window.scrollY === 0);
        await page.screenshot({ path: `${output}/${locale}-${width}.png`, fullPage: true });
        assert.deepEqual(errors, []);
        results.push({ locale, width, images: 12, overflow, links, errors });
        await page.close();
      }
    }
    const page = await browser.newPage();
    for (const name of await fs.readdir('public/home')) {
      assert.equal((await page.request.get(`${base}/home/${name}`)).status(), 200);
    }
    await page.goto(`${base}/en/`);
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('.skip-link').evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => location.hash), '#main-content');
    for (const path of [...new Set(results.flatMap(result => result.links))].filter(path => path.startsWith('/'))) {
      const response = await page.request.get(`${base}${path}`);
      assert.equal(response.status(), 200, `CTA ${path}`);
    }
    await fs.writeFile(`${output}/verification.json`, JSON.stringify(results, null, 2));
    console.log('Passed: EN/FR at 1440, 1024, 768, 390; images, CTAs, metadata, navigation, cart, skip link, and no runtime errors.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
