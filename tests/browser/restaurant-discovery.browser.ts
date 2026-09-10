import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
 await page.route("**/*", route => new URL(route.request().url()).origin === "http://127.0.0.1:3013" ? route.continue() : route.abort());
});
for (const width of [390, 768, 1440]) test(`editorial discovery at ${width}px`, async ({ page }) => {
 await page.setViewportSize({ width, height: 900 }); await page.goto("/fr/shida/restaurants/?city=Kinshasa");
 await expect(page.locator(".rd-card")).toHaveCount(1);
 await expect(page.getByRole("heading", { level: 1 })).toHaveText("Trouvez votre prochaine bonne adresse.");
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 const card = await page.locator(".rd-card").boundingBox(); expect(card!.y).toBeLessThan(850); if (width === 1440) expect(card!.width).toBeLessThan(450);
 await expect(page.getByText("Horaires à confirmer", { exact: true })).toBeVisible();
 for (const selector of [".rd-submit", ".rd-menu", ".rd-chip span", ".rd-language select", ".rd-advanced summary", ".rd-card h3 a", ".rd-top a"]) for (const control of await page.locator(selector).all()) if (await control.isVisible()) expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
 await page.screenshot({ path: `.s3a-local/discovery-${width}.png`, fullPage: true });
});
test("explicit search, hidden values, native keyboard filters and type chips", async ({ page }) => {
 await page.goto("/fr/shida/restaurants/?name=Test&area=Gombe&dish=pondu&service_mode=Sur+place&food_type=catering&page=2");
 const before = page.url(); await page.getByRole("textbox", { name: "Ville", exact: true }).fill("Kinshasa"); expect(page.url()).toBe(before);
 await page.locator("summary").focus(); await page.keyboard.press("Enter"); await expect(page.getByRole("textbox", { name: "Plat ou composant" })).toHaveValue("pondu");
 await page.keyboard.press("Enter"); await expect(page.locator("details")).not.toHaveAttribute("open");
 await page.getByRole("radio", { name: "Malewa", exact: true }).check({ force: true });
 await page.getByRole("button", { name: "Rechercher", exact: true }).click();
 const q = new URL(page.url()).searchParams; for (const [key, value] of Object.entries({ name: "Test", area: "Gombe", dish: "pondu", service_mode: "Sur place", city: "Kinshasa", food_type: "malewa" })) expect(q.get(key)).toBe(value);
 expect(q.has("page")).toBe(false);
});
test("menu, details and back retain result context; language selector retains query", async ({ page }) => {
 await page.goto("/fr/shida/restaurants/?city=Kinshasa&page=2");
 await page.getByRole("combobox", { name: "Langue des restaurants" }).selectOption("sw"); await expect(page).toHaveURL(/\/sw\/shida\/restaurants\/?.*city=Kinshasa.*page=2/);
 await page.locator(".rd-menu").click(); await expect(page.locator("#item-ITM-UNIT:visible").getByText("5.00 USD", { exact: false })).toBeVisible();
 await page.getByRole("link", { name: "Rudi kwenye matokeo" }).click(); await expect(page).toHaveURL(/city=Kinshasa&page=2#restaurant-RST-TEST1/);
 await page.locator(".rd-card h3 a").click(); await expect(page.getByRole("heading", { name: "Biashara inayomiliki" })).toBeVisible();
});
test("multiple, empty and error states; exact retry", async ({ page }) => {
 await page.goto("/fr/shida/restaurants/?query=multiple"); await expect(page.locator(".rd-card")).toHaveCount(3);
 await expect(page.locator(".rd-status-open")).toHaveText("Ouvert"); await expect(page.locator(".rd-status-closed")).toHaveText("Fermé"); await expect(page.locator(".rd-status-unknown")).toHaveText("Horaires à confirmer");
 await expect(page.getByText("Éléments du menu indisponibles actuellement")).toBeVisible();
 await page.goto("/fr/shida/restaurants/?query=empty"); await expect(page.locator(".rd-card")).toHaveCount(0); await expect(page.locator(".rd-empty")).toContainText("Aucun établissement");
 await page.goto("/fr/shida/restaurants/?query=failure&city=Kinshasa&page=2"); const url = page.url(); await page.getByRole("button", { name: "Réessayer" }).click(); await expect(page.locator(".rd-empty")).toContainText("temporairement indisponibles"); expect(page.url()).toBe(url); await expect(page.getByRole("textbox", { name: "Ville", exact: true })).toHaveValue("Kinshasa");
});
test("pagination preserves filters and unavailable direct targets do not expose fixtures", async ({ page }) => {
 await page.goto("/fr/shida/restaurants/?city=Kinshasa&dish=pondu");
 await page.getByRole("link", { name: "Suivant", exact: true }).click(); await expect(page.locator(".rd-card h3")).toHaveText("Test Malewa page two");
 expect(new URL(page.url()).searchParams.get("dish")).toBe("pondu");
 await page.getByRole("link", { name: "Précédent", exact: true }).click(); await expect(page.locator(".rd-card h3")).toHaveText("Test Malewa");
 await page.goto("/fr/shida/restaurants/RST-UNAVAILABLE/"); await expect(page.locator("body")).not.toContainText("Test Malewa");
});
for (const locale of ["en", "fr", "ln", "sw"]) test(`discovery language ${locale}`, async ({ page }) => {
 await page.goto(`${locale === "en" ? "" : `/${locale}`}/shida/restaurants/?city=Kinshasa`);
 await expect(page.locator(".restaurant-discovery")).toHaveAttribute("lang", locale);
 await expect(page.locator(".rd-language select")).toHaveValue(locale);
 await expect(page.locator(".rd-card")).toHaveCount(1);
 await expect(page.locator(".site-header .language-switcher")).toBeHidden();
});
test("consistent cold/warm resource measurements without decorative image requests", async ({ page }) => {
 await page.setViewportSize({ width: 390, height: 900 });
 const cdp = await page.context().newCDPSession(page); await cdp.send("Network.enable"); await cdp.send("Network.clearBrowserCache");
 for (const kind of ["cold", "warm"]) {
  let bytes = 0, requests = 0; const images: string[] = [];
  const done = (event: { encodedDataLength: number }) => { bytes += event.encodedDataLength; };
  const sent = (event: { type?: string; request: { url: string } }) => { requests++; if (event.type === "Image") images.push(new URL(event.request.url).pathname); };
  cdp.on("Network.loadingFinished", done); cdp.on("Network.requestWillBeSent", sent);
  const started = Date.now(); await page.goto("/fr/shida/restaurants/?city=Kinshasa"); await page.waitForLoadState("networkidle"); await expect(page.locator(".rd-card:visible")).toBeVisible();
  console.log(JSON.stringify({ kind, bytes, requests, duration_ms: Date.now() - started, images }));
  expect(images.some(path => /editorial|hero|food/i.test(path))).toBe(false);
  cdp.off("Network.loadingFinished", done); cdp.off("Network.requestWillBeSent", sent);
 }
});
