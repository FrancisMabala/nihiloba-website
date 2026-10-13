import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { checkoutCopy } from "../../app/lib/restaurant-checkout-copy";

test.skip(process.env.RESTAURANT_GUEST_BACKEND !== "1", "Uses the isolated Restaurant Backend fixture");

test("search, menu, basket and quote across customer widths", async ({ page, request }) => {
  const backend = "https://localhost:3443";
  const seeded = await request.post(`${backend}/__guest/seed`);
  expect(seeded.ok()).toBe(true);
  const { ref } = await seeded.json() as { ref: string };
  const evidence = "docs/evidence/restaurants-customer-redesign";
  mkdirSync(evidence, { recursive: true });

  await page.goto(`/shida/restaurants/${ref}/menu/`);
  const name = await page.locator(".restaurant-detail-header h1").innerText();
  for (const [width, label] of [[390, "phone"], [820, "tablet"], [1440, "desktop"]] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/shida/restaurants/?name=${encodeURIComponent(name)}`);
    await expect(page.locator(".rd-card")).toHaveCount(1);
    await expect(page.locator(".rd-painted-band")).toHaveCount(0);
    await expect(page.locator(".rd-card .restaurant-photo-illustration")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `${evidence}/marketplace-${label}.png`, fullPage: true });

    await page.locator(".rd-menu").click();
    await expect(page.locator(".rst-menu-card")).toHaveCount(2);
    await expect(page.locator(".restaurant-categories a")).toHaveCount(1);
    await expect(page.locator(".rst-choice-fallback")).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `${evidence}/menu-${label}.png`, fullPage: true });
  }

  await page.setViewportSize({ width: 390, height: 900 });
  await page.getByRole("button", { name: "Start a private visit" }).click();
  await expect(page.getByRole("heading", { name: "Basket", exact: true })).toBeVisible();
  await page.locator(".rst-menu-card").filter({ has: page.getByRole("heading", { name: "Fufu" }) }).getByRole("button", { name: "Add" }).click();
  await page.locator(".rst-menu-card").filter({ has: page.getByRole("heading", { name: "Pondu" }) }).getByRole("button", { name: "Add" }).click();
  await expect(page.locator(".rst-sticky-basket")).toContainText("2");
  await page.getByRole("combobox", { name: checkoutCopy.en.window }).selectOption({ index: 1 });
  await page.getByRole("button", { name: checkoutCopy.en.quote }).click();
  await expect(page.locator(".rst-sticky-basket")).toContainText("CDF");
  await page.screenshot({ path: `${evidence}/basket-quote-phone.png`, fullPage: true });
  await page.getByRole("button", { name: "Confirm order" }).click();
  await expect(page.locator(".rst-guest-round")).toHaveCount(1);
  await page.screenshot({ path: `${evidence}/visit-summary-phone.png`, fullPage: true });
});
