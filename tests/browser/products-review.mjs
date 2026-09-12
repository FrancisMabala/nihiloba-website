import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

// Start a production server, then run: node tests/browser/products-review.mjs
const base = process.env.PRODUCTS_TEST_URL || 'http://127.0.0.1:3033';
const output = 'test-results/products';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
  for (const locale of ['en', 'fr']) {
    for (const width of [1440, 1024, 768, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      page.setDefaultTimeout(15000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto(`${base}/${locale}/products/`, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      assert.equal(await page.locator('html').getAttribute('lang'), locale);
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('.products-editorial section').count(), 6);
      assert.equal(await page.locator('.products-markets li').count(), 7);
      assert.equal(await page.locator('.products-process li').count(), 4);
      assert.ok((await page.locator('.products-education').innerText()).includes(locale === 'en' ? 'planned nonprofit initiative' : 'initiative à but non lucratif en préparation'));
      assert.ok((await page.locator('meta[name="description"]').getAttribute('content')).includes('Education'));
      assert.ok(await page.locator('meta[property="og:title"]').getAttribute('content'));
      assert.equal(new URL(await page.locator('link[rel="canonical"]').getAttribute('href')).pathname.replace(/\/$/, ''), `/${locale}/products`);
      assert.equal((await page.locator('link[hreflang="fr"]').getAttribute('href')).replace(/\/$/, ''), 'https://nihiloba.com/fr/products');
      const images = page.locator('.products-editorial img');
      assert.equal(await images.count(), 8);
      for (const img of await images.all()) {
        await img.scrollIntoViewIfNeeded();
        await img.evaluate(el => el.decode());
        assert.ok(await img.getAttribute('alt'));
        assert.ok(await img.getAttribute('sizes'));
        assert.ok(await img.evaluate(el => el.naturalWidth > 0));
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${locale} ${width}: overflow`);
      if (width === 390) {
        const strip = page.locator('.products-market-images');
        await strip.evaluate(el => { el.scrollLeft = 0; });
        await strip.focus();
        await page.keyboard.press('ArrowRight');
        await page.waitForFunction(() => document.querySelector('.products-market-images').scrollLeft > 0);
      }
      await page.locator('.products-market-images').evaluate(el => { el.scrollLeft = 0; });
      const links = await page.locator('.products-editorial a').evaluateAll(els => els.map(el => el.getAttribute('href').replace(/\/$/, '')));
      assert.deepEqual(links, ['#shida', `/${locale}/contact`, locale === 'en' ? '/shida' : '/fr/shida', 'https://wa.me/46769709059?text=Bonjour', `/${locale}/education`, `/${locale}/contact`]);
      const whatsapp = page.locator('.products-editorial a[href*="wa.me"]');
      assert.equal(await whatsapp.getAttribute('target'), '_blank');
      assert.ok((await whatsapp.getAttribute('rel')).includes('noopener'));
      await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.locator('.products-hero a[href="#shida"]').click();
      await page.waitForURL('**/#shida');
      await page.waitForFunction(() => { const top = document.querySelector('#shida').getBoundingClientRect().top; return top >= 80 && top <= 120; });
      assert.equal(await page.evaluate(() => location.hash), '#shida');
      const shidaTop = await page.locator('#shida').evaluate(el => el.getBoundingClientRect().top);
      assert.ok(shidaTop >= 80 && shidaTop <= 120, `Anchor offset: ${shidaTop}`);
      await page.evaluate(() => window.scrollTo(0, 0));
      if (width < 940) {
        await page.locator('.menu-button').click();
        assert.equal(await page.locator('.menu-button').getAttribute('aria-expanded'), 'true');
      }
      assert.equal(await page.locator('.primary-nav .nav-link').count(), 6);
      assert.ok(await page.locator('.header-cart-link').isVisible());
      assert.equal(await page.locator('.primary-nav [aria-current="page"]').getAttribute('href'), `/${locale}/products/`);
      assert.equal(await page.locator('.language-switcher a').getAttribute('href'), `/${locale === 'en' ? 'fr' : 'en'}/products/`);
      assert.equal(await page.locator('.site-footer .footer-column').count(), 3);
      if (width < 940) await page.locator('.menu-button').click();
      for (const link of await page.locator('.products-editorial a').all()) {
        assert.ok((await link.boundingBox()).height >= 44);
      }
      await page.screenshot({ path: `${output}/${locale}-${width}.png`, fullPage: true });
      assert.deepEqual(errors, []);
      results.push({ locale, width, images: 8, links, errors });
      await page.close();
    }
  }
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  for (const name of await fs.readdir('public/product')) {
    assert.equal((await page.request.get(`${base}/product/${name}`)).status(), 200, name);
  }
  for (const path of new Set(results.flatMap(result => result.links).filter(path => path.startsWith('/')))) {
    assert.equal((await page.request.get(`${base}${path}/`)).status(), 200, `CTA ${path}`);
  }
  await page.goto(`${base}/en/products/`);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('.skip-link').evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => location.hash), '#main-content');
  const discover = page.locator('.products-hero a').first();
  await discover.focus();
  assert.equal(await discover.evaluate(el => getComputedStyle(el).outlineStyle), 'solid');
  // Navigate across routes in the same browser to catch persistent CSS affecting shared pages.
  for (const locale of ['en', 'fr']) {
    if (await page.locator('html').getAttribute('lang') !== locale) {
      await page.locator('.language-switcher a').click();
      await page.waitForURL(url => url.pathname.startsWith(`/${locale}/`));
    }
    for (const path of ['', '/about']) {
      await page.locator(`.primary-nav a[href="/${locale}${path}/"]`).click();
      await page.waitForURL(`${base}/${locale}${path}/`);
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('.site-header').count(), 1);
      assert.equal(await page.locator('.site-footer').count(), 1);
      assert.equal(await page.locator('.products-editorial').count(), 0);
    }
  }
  await fs.writeFile(`${output}/verification.json`, JSON.stringify(results, null, 2));
  console.log('Passed: Products EN/FR at 1440, 1024, 768, 390; eight images, links, metadata, navigation, footer, focus, skip link, no overflow or runtime errors. Home/About smoke checks passed.');
} finally {
  await browser.close();
}
