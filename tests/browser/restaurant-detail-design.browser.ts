import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
 await page.route("**/*", route => new URL(route.request().url()).origin === "http://127.0.0.1:3013" ? route.continue() : route.abort());
});
for (const width of [390, 768, 1440]) test(`detail layout and states ${width}`, async ({ page }) => {
 await page.setViewportSize({ width, height: 900 });
 for (const [state, target] of [["populated", "RST-HOURS/menu"], ["empty", "RST-EMPTY/menu"], ["information", "RST-HOURS"]]) {
  await page.goto(`/fr/shida/restaurants/${target}?back=city%3DKinshasa%26page%3D2&page=1`);
  await expect(page.locator(".restaurant-header-art")).toHaveCount(0);
  await expect(page.locator(".restaurant-detail-header .restaurant-hours:visible")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (state === "empty") { await expect(page.getByRole("heading", { name: "Menu non publié" })).toBeVisible(); await expect(page.locator(".restaurant-pagination")).toHaveCount(0); }
  if (state === "populated") {
   await expect(page.locator("#item-ITM-UNIT")).toContainText("5 USD");
   await expect(page.locator("#item-ITM-AMOUNT")).toContainText("2\u202f500 CDF");
   await expect(page.locator("#item-ITM-UNKNOWN")).toContainText("Prix non précisé");
   expect((await page.locator(".rst-public-menu").boundingBox())!.y).toBeLessThan(800);
  }
  if (state === "information") {
   await expect(page.locator(".restaurant-detail-header .restaurant-hours:visible")).toContainText("jour suivant");
   await expect(page.locator(".restaurant-detail-header .restaurant-hours:visible")).toContainText("Fermetures exceptionnelles");
   // Global smooth scrolling otherwise makes the immediate geometry assertion
   // race the return to the top, especially on a longer guest-enabled page.
   await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
   await expect(page.getByText("Entreprise propriétaire", { exact: true })).toHaveCount(0);
  }
  await page.screenshot({ path: `.s3a-local/detail-${state}-${width}.png`, fullPage: true });
 }
});
test("food can be selected while ordering is closed without submitting it", async ({ page }) => {
 await page.setViewportSize({ width: 390, height: 900 });
 await page.goto("/fr/shida/restaurants/RST-HOURS/menu");
 await page.locator("#item-ITM-UNIT").getByRole("button", { name: "Ajouter" }).click();
 await expect(page.locator(".rst-sticky-basket")).toContainText("1");
 await expect(page.locator(".rst-basket-review")).toContainText("Poulet");
 await expect(page.locator(".rst-basket-review").getByRole("button", { name: "Retirer" })).toBeEnabled();
 await expect(page.getByRole("button", { name: "Continuer la commande" })).toHaveCount(0);
});

test("tabs, language, pagination, errors and eligible continuations preserve targets", async ({ page }) => {
 await page.goto("/fr/shida/restaurants/RST-PAGED/menu?back=city%3DKinshasa%26page%3D2&page=2");
 await page.locator(".restaurant-detail-tabs").getByRole("link", { name: "L’établissement" }).click();
 await expect(page).toHaveURL(/RST-PAGED\/?\?back=.*&page=2/);
 await page.getByRole("link", { name: "Lingala", exact: true }).click();
 await expect(page).toHaveURL(/\/ln\/.*page=2/); await expect(page.locator(".restaurant-header-art")).toHaveCount(0);
 await page.locator(".restaurant-detail-tabs").getByRole("link", { name: "Menu", exact: true }).click();
 await page.locator(".rst-menu-pages button").click(); await expect(page.locator(".rst-menu-card")).toHaveCount(4);
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
 for (const language of ["Français", "Lingala", "Kiswahili", "English"]) { await page.getByRole("link", { name: language, exact: true }).click(); await expect(page.locator(".restaurant-header-art")).toHaveCount(0); }
});
