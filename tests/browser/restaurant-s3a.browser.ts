import { test, expect, request, type BrowserContext, type Page } from "@playwright/test";

test.skip(process.env.RESTAURANT_ACTUAL_BACKEND !== "1", "Requires the isolated PostgreSQL/actual Backend harness; not a mock.");
const upstream = "https://127.0.0.1:3443";
test.beforeEach(async ({ page }) => {
 page.on("response", r => { if (r.url().includes("/api/") && r.status() >= 400) console.log("S3A API status", new URL(r.url()).pathname, r.status()); });
 page.on("requestfailed", r => console.log("S3A request failed", new URL(r.url()).pathname, r.failure()?.errorText));
});
async function session(context: BrowserContext, label = "personal", legacy = false) {
 const api = await request.newContext({ baseURL: upstream, ignoreHTTPSErrors: true });
 const response = await api.post(`/__s3a/session/${label}`); expect(response.ok()).toBeTruthy();
 const { token } = await response.json();
 await context.addCookies([{ name: legacy ? "shida_dashboard_session" : "nihiloba_personal_session", value: token, domain: "localhost", path: legacy ? "/api/shida/employment" : "/api/shida", httpOnly: true, sameSite: "Lax", secure: true }]);
 return api;
}
async function edit(page: Page) { await page.getByRole("button", { name: "Edit", exact: true }).click(); }

test("actual Backend: Personal lifecycle, exact menu, stale reconciliation, sharing and session isolation", async ({ page, context }) => {
 test.setTimeout(120000);
 const api = await session(context, "personal", true);
 await page.goto("/shida/seller/restaurants");
 await expect(page.getByRole("button", { name: "Add another", exact: true })).toBeVisible();
 expect((await context.cookies()).some(c => c.name === "nihiloba_personal_session")).toBeTruthy();
 expect((await context.cookies()).some(c => c.name === "shida_dashboard_session")).toBeFalsy();
 await page.getByRole("button", { name: "Add another", exact: true }).click();
 const name = "S3A synthetic kitchen";
 await page.getByLabel("Name", { exact: true }).fill(name);
 await page.getByRole("button", { name: "Create private draft", exact: true }).click();
 await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
 await edit(page);
 for (const [label, value] of [["Description", "Isolated synthetic meals"], ["City", "Kinshasa"], ["Commune", "Gombe"], ["District", "Centre"], ["Timezone", "Africa/Kinshasa"]]) await page.getByLabel(label, { exact: true }).fill(value);
 await page.getByRole("checkbox", { name: /confirm.*location/i }).check();
 await page.getByRole("button", { name: "Save changes", exact: true }).click();
 await page.getByRole("button", { name: "Publish", exact: true }).click(); await page.getByLabel("I confirm these changes", { exact: true }).check();
 const published = page.waitForResponse(r => r.url().includes("/lifecycle/publish") && r.request().method() === "POST");
 await page.getByRole("button", { name: "Save changes", exact: true }).click(); const dto = await (await published).json(); const ref = dto.public_ref; expect(ref).toMatch(/^RST_/);
 expect((await api.get(`/api/public/shida/restaurants/${ref}`)).status()).toBe(200);
 await page.getByRole("button", { name: "Prepare menu link & QR", exact: true }).click(); await expect(page.getByRole("img", { name: "Menu QR code" })).toBeVisible();
 const link = page.getByRole("region", { name: "Restaurants & Malewa" }).getByRole("link", { name: "Open on WhatsApp" });
 const href = await link.getAttribute("href"); expect(href).toMatch(/^https:\/\/api.nihiloba.com\/go\//);
 const redirect = await api.get(new URL(href!).pathname, { maxRedirects: 0 }); expect(redirect.status()).toBe(302); expect(redirect.headers().location).toContain("https://wa.me/243000000000");
 await page.getByRole("button", { name: "Categories", exact: true }).click(); await page.getByRole("button", { name: "Add another", exact: true }).click(); await page.getByLabel("Name", { exact: true }).fill("Synthetic dishes"); await page.getByRole("button", { name: "Save changes", exact: true }).click();
 await page.getByRole("button", { name: "Dishes & components", exact: true }).click();
 for (const model of ["UNIT_PRICED", "AMOUNT_PRICED", "UNKNOWN"]) {
  await page.getByRole("button", { name: "Add another", exact: true }).click(); await page.getByLabel("Name", { exact: true }).fill(`Synthetic ${model}`);
  await page.getByRole("combobox", { name: "Category", exact: true }).selectOption({ label: "Synthetic dishes" }); await page.getByRole("combobox", { name: "Pricing", exact: true }).selectOption(model);
  if (model === "UNIT_PRICED") { await page.getByLabel("Local sale-unit label", { exact: true }).fill("plate"); await page.getByLabel("Price per unit", { exact: true }).fill("1250.50"); }
  if (model === "AMOUNT_PRICED") await page.getByLabel("Allowed amounts", { exact: true }).fill("1000;2500.50");
  const saved = page.waitForResponse(r => r.url().includes("/menu/items") && r.request().method() === "POST"); await page.getByRole("button", { name: "Save changes", exact: true }).click(); expect((await saved).status()).toBe(200);
 }
 await page.getByRole("button", { name: "Dated offerings", exact: true }).click(); await page.getByRole("button", { name: "Add another", exact: true }).click();
 await page.getByRole("combobox", { name: "Dish or component", exact: true }).selectOption({ label: "Synthetic UNIT_PRICED" }); await page.getByLabel("Starts at", { exact: true }).fill("2027-01-04 10:00"); await page.getByLabel("Ends at", { exact: true }).fill("2027-01-04 15:00"); await page.getByLabel("I confirm these changes", { exact: true }).check();
 const offering = page.waitForResponse(r => r.url().includes("/menu/offerings") && r.request().method() === "POST"); await page.getByRole("button", { name: "Save changes", exact: true }).click(); expect((await offering).status()).toBe(200);
 await page.getByRole("button", { name: "Hours & closures", exact: true }).click(); await expect(page.getByText("Unknown · Africa/Kinshasa", { exact: true })).toBeVisible();
 await edit(page); await page.getByLabel("Known schedule", { exact: true }).check(); await page.getByLabel("I confirm these changes", { exact: true }).check(); await page.getByRole("button", { name: "Save changes", exact: true }).click();
 await page.getByRole("button", { name: "Profile", exact: true }).click();
 await edit(page); await page.getByLabel("Name", { exact: true }).fill(`${name} reconciled`);
 expect((await api.post(`/__s3a/cross-channel/${ref}`)).ok()).toBeTruthy();
 await page.getByRole("button", { name: "Save changes", exact: true }).click(); await expect(page.getByLabel("Name", { exact: true })).toBeDisabled();
 await page.getByRole("button", { name: "Load current values", exact: true }).click(); await page.getByRole("button", { name: "Keep my changes against these current values", exact: true }).click(); await page.getByRole("button", { name: "Save changes", exact: true }).click();
 await page.getByRole("button", { name: "Unpublish", exact: true }).click(); await page.getByLabel("I confirm these changes", { exact: true }).check(); await page.getByRole("button", { name: "Save changes", exact: true }).click();
 await expect(page.getByRole("button", { name: "Publish", exact: true })).toBeVisible(); expect((await api.get(`/api/public/shida/restaurants/${ref}`)).status()).toBe(404); expect((await api.get(new URL(href!).pathname, { maxRedirects: 0 })).status()).toBe(404);
 const applications = page.waitForResponse(r => r.url().includes("/api/shida/employment/applications") && r.status() === 200);
 await page.goto("/shida/my-applications/"); await applications;
 await page.goto("/shida/seller/restaurants/"); await expect(page.getByRole("button", { name: "Add another", exact: true })).toBeVisible();
 await page.getByRole("button", { name: "Sign out / change account", exact: true }).click(); await expect(page.getByRole("heading", { name: "Sign in to SHIDA", exact: true })).toBeVisible();
 await expect.poll(async () => (await context.cookies()).some(c => ["nihiloba_personal_session", "shida_dashboard_session"].includes(c.name))).toBeFalsy();
 await page.reload();
 await session(context, "other"); await page.evaluate(() => window.dispatchEvent(new Event("shida-personal-session-changed")));
 await expect(page.getByRole("heading", { name: `${name} reconciled`, exact: true })).toHaveCount(0);
 const binding = await (await context.request.get("/api/shida/employment/session")).json();
 expect((await context.request.get(`/api/shida/personal/restaurants/${ref}`, { headers: { "X-Shida-Session": binding.binding } })).status()).toBe(404);
 await api.post("/__s3a/expire"); await page.evaluate(() => window.dispatchEvent(new Event("focus")));
 await expect(page.getByRole("heading", { name: "Sign in to SHIDA", exact: true })).toBeVisible();
 await api.dispose();
});

test("actual Backend: constrained cold/warm loading, idle polling and offline same-tab recovery", async ({ page, context }, testInfo) => {
 test.setTimeout(210000); await session(context);
 await page.setViewportSize({ width: 390, height: 844 });
 const cdp = await context.newCDPSession(page); await cdp.send("Network.enable");
 const conditions = { offline: false, latency: 150, downloadThroughput: 50000, uploadThroughput: 25000 };
 await cdp.send("Network.emulateNetworkConditions", conditions);
 let bytes = 0, requests = 0, polls = 0;
 cdp.on("Network.loadingFinished", e => { bytes += e.encodedDataLength; });
 cdp.on("Network.requestWillBeSent", e => { requests++; if (e.request.url.includes("/employment/session")) polls++; });
 const results: Record<string, unknown>[] = [];
 async function measure(label: string, action: () => Promise<void>) { bytes = 0; requests = 0; polls = 0; const start = Date.now(); await action(); const result = { label, bytes, requests, polls, milliseconds: Date.now() - start }; results.push(result); console.log("S3A phase", JSON.stringify(result)); }
 await measure("cold", async () => { await page.goto("/shida/seller/restaurants"); await expect(page.getByRole("button", { name: "Add another", exact: true })).toBeVisible({ timeout: 60000 }); await page.waitForLoadState("networkidle"); });
 await measure("warm", async () => { await page.reload(); await expect(page.getByRole("button", { name: "Add another", exact: true })).toBeVisible(); await page.waitForLoadState("networkidle"); });
 await measure("idle-visible-65s", async () => { await page.waitForTimeout(65000); });
 await page.getByRole("button", { name: "Add another", exact: true }).click(); await page.getByLabel("Name", { exact: true }).fill("Unsaved synthetic offline draft");
 await measure("offline-65s", async () => { await cdp.send("Network.emulateNetworkConditions", { ...conditions, offline: true }); await expect(page.getByText(/Connection interrupted/)).toBeVisible(); await page.waitForTimeout(65000); });
 await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Unsaved synthetic offline draft");
 await measure("reconnect", async () => { await cdp.send("Network.emulateNetworkConditions", conditions); await expect(page.getByLabel("Name", { exact: true })).toBeEnabled(); await page.waitForLoadState("networkidle"); });
 await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Unsaved synthetic offline draft");
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
 await testInfo.attach("network-measurements", { body: JSON.stringify(results, null, 2), contentType: "application/json" });
 console.log("S3A measurements", JSON.stringify(results));
 await page.screenshot({ path: testInfo.outputPath("phone.png"), fullPage: true });
 await page.setViewportSize({ width: 1440, height: 1000 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy(); await page.screenshot({ path: testInfo.outputPath("desktop.png"), fullPage: true });
});
