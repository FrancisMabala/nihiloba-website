import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
 await page.route("**/*", route => new URL(route.request().url()).origin === "http://127.0.0.1:3013" ? route.continue() : route.abort());
});
for (const width of [390, 768, 1440]) test(`shared detail artwork and states ${width}`, async ({ page }) => {
 await page.setViewportSize({ width, height: 900 });
 let baseline: { width: number; height: number; x: number; y: number } | null = null;
 for (const [state, target] of [["populated", "RST-HOURS/menu"], ["empty", "RST-EMPTY/menu"], ["information", "RST-HOURS"]]) {
  await page.goto(`/fr/shida/restaurants/${target}?back=city%3DKinshasa%26page%3D2&page=1`);
  const art = page.locator(".restaurant-header-art img");
  await expect(art).toHaveCount(1); await expect(art).toHaveAttribute("alt", "");
  await expect.poll(() => art.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0)).toBe(true);
  const box = (await art.boundingBox())!;
  if (baseline) expect(box).toEqual(baseline); else baseline = box;
  expect(box.width / box.height).toBeCloseTo(1983 / 793, 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  console.log(JSON.stringify({ width, state, art: await art.evaluate((e: HTMLImageElement) => ({ src: e.currentSrc, bytes: performance.getEntriesByName(e.currentSrc).map(r => ({ transfer: (r as PerformanceResourceTiming).transferSize, encoded: (r as PerformanceResourceTiming).encodedBodySize })) })) }));
  if (state === "empty") { await expect(page.getByRole("heading", { name: "Menu non publié" })).toBeVisible(); await expect(page.locator(".restaurant-pagination")).toHaveCount(0); }
  if (state === "populated") {
   await expect(page.locator("#item-ITM-UNIT")).toContainText("5.00 USD");
   await expect(page.locator("#item-ITM-AMOUNT")).toContainText("2500.00 CDF");
   await expect(page.locator("#item-ITM-UNKNOWN")).toContainText("Prix non précisé");
   expect((await page.locator(".restaurant-menu-panel").boundingBox())!.y).toBeLessThan(650);
  }
  if (state === "information") {
   const summary = page.locator(".restaurant-hours-disclosure summary"); await summary.focus(); await page.keyboard.press("Enter");
   await expect(page.locator(".restaurant-hours-disclosure")).toHaveAttribute("open");
   await expect(page.locator(".restaurant-hours")).toContainText("jour suivant");
   await expect(page.locator(".restaurant-hours")).toContainText("Fermetures exceptionnelles");
   await page.evaluate(() => window.scrollTo(0, 0));
   expect(await art.boundingBox()).toEqual(baseline);
   await expect(page.getByText("Entreprise propriétaire", { exact: true })).toHaveCount(0);
  }
  await page.screenshot({ path: `.s3a-local/detail-${state}-${width}.png`, fullPage: true });
 }
});
test("tabs, language, pagination, errors and eligible continuations preserve targets", async ({ page }) => {
 await page.goto("/fr/shida/restaurants/RST-PAGED/menu?back=city%3DKinshasa%26page%3D2&page=2");
 await page.locator(".restaurant-detail-tabs").getByRole("link", { name: "L’établissement" }).click();
 await expect(page).toHaveURL(/RST-PAGED\/?\?back=.*&page=2/);
 await page.getByRole("link", { name: "Lingala", exact: true }).click();
 await expect(page).toHaveURL(/\/ln\/.*page=2/); await expect(page.locator(".restaurant-header-art img")).toBeVisible();
 await page.locator(".restaurant-detail-tabs").getByRole("link", { name: "Menu", exact: true }).click();
 await page.locator(".restaurant-pagination a").click(); await expect(page).toHaveURL(/page=1/);
 await page.goto("/fr/shida/restaurants/RST-ERROR/menu?back=city%3DKinshasa&page=2");
 await expect(page.locator(".restaurant-menu-empty")).toContainText("temporairement indisponible");
 const url = page.url(); await page.getByRole("button", { name: "Réessayer" }).click(); expect(page.url()).toBe(url);
 await expect(page.getByText("Menu non publié", { exact: true })).toHaveCount(0);
 await page.goto("/fr/shida/restaurants/RST-WITHDRAWN/menu"); await expect(page.locator(".restaurant-detail-header")).toHaveCount(0);
 await page.goto("/shida/restaurants/RST-TEST1/menu");
 for (const [label, token] of [["Save in SHIDA", "TEST_SAVE"], ["Follow in SHIDA", "TEST_FOLLOW"], ["Open this establishment on WhatsApp", "TEST_DETAIL"]]) {
  const link = page.getByRole("link", { name: label, exact: true }); await expect(link).toHaveAttribute("href", `https://api.nihiloba.com/go/${token}`); await expect(link).toHaveAttribute("rel", "noopener noreferrer");
 }
 await expect(page.locator(".restaurant-practical")).toContainText("select Report");
 for (const language of ["Français", "Lingala", "Kiswahili", "English"]) { await page.getByRole("link", { name: language, exact: true }).click(); await expect(page.locator(".restaurant-header-art img")).toHaveAttribute("src", "/images/restaurants/restaurant-table-header-480.webp"); }
});
