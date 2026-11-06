import { test, expect } from '@playwright/test';

for (const locale of ['en', 'fr', 'ln', 'sw']) for (const width of [360, 390, 768, 1024, 1440]) {
  test(`school landing ${locale} ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${locale === 'en' ? '' : `/${locale}`}/shida/ecole/`);
    const main = page.locator('.school-entry');
    await expect(main.locator('h1')).toHaveText('Likita malamu ya kelasi na SHIDA.');
    await expect(main.locator('h1')).toHaveAttribute('lang', 'ln');
    await expect(main.locator('.school-illustration')).toBeVisible();
    await expect(main.locator('.school-entry-benefit')).toHaveCount(4);
    await expect(main.locator('.school-entry-launch')).toBeVisible();
    await expect(main.locator('.school-entry-directory')).not.toHaveAttribute('aria-busy', 'true');
    await expect(main.locator('a[href^="https://business.nihiloba.com"]')).toHaveCount(2);
    for (const link of await main.locator('a[href^="https://business.nihiloba.com"]').all()) await expect(link).toHaveAttribute('href', `https://business.nihiloba.com/?lang=${locale}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await main.locator('a[href="#discover-ecole"]').click();
    await expect(page).toHaveURL(/#discover-ecole$/);
    await main.locator('a[href="#schools"]').click();
    await expect(page).toHaveURL(/#schools$/);
    await page.locator('.school-entry h1').click();
    await page.screenshot({ path: `test-results/school-landing-${locale}-${width}.png`, fullPage: true });
  });
}
test('slow directory does not block hero or management links', async ({ page }) => {
  await page.goto('/fr/shida/ecole/?page=2', { waitUntil: 'commit' });
  await expect(page.locator('.school-entry h1')).toBeVisible({ timeout: 2500 });
  await expect(page.locator('.school-entry-hero-actions')).toBeVisible({ timeout: 2500 });
  await expect(page.locator('#schools')).toHaveAttribute('aria-busy', 'true');
  await page.screenshot({ path: 'test-results/school-landing-loading.png', fullPage: true });
  await expect(page.locator('#school-directory-title')).toContainText('Les écoles arrivent', { timeout: 10000 });
});
test('errors and unexpected private fields never become an empty or public record', async ({ page }) => {
  for (const value of [3, 4]) {
    await page.goto(`/shida/ecole/?page=${value}`);
    await expect(page.locator('#schools')).toContainText('temporarily unavailable');
    await expect(page.locator('body')).not.toContainText('PRIVATE_SENTINEL');
    await expect(page.locator('#schools')).not.toContainText('Schools are coming');
    await expect(page.locator('.school-entry-hero-actions')).toBeVisible();
  }
  await page.screenshot({ path: 'test-results/school-landing-unavailable.png', fullPage: true });
});
test('reviewed public projection links to existing school route', async ({ page }) => {
  await page.goto('/fr/shida/ecole/?page=5');
  await expect(page.locator('#schools[aria-labelledby]')).toContainText('Controlled test school');
  await expect(page.locator('#schools a[href="/fr/shida/ecole/SCH_TEST1234/"]')).toBeVisible();
  await page.screenshot({ path: 'test-results/school-landing-published.png', fullPage: true });
});
