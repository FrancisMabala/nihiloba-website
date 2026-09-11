import { test, expect, type Page } from "@playwright/test";
import QRCode from "qrcode";
const revision = "2026-09-10T10:00:00.123456+00:00";
const establishment = { public_ref: "RST_fixture", revision, status: "draft", profile: { name: "Isolated Malewa", description: "Synthetic fixture only", city: "Test city", commune: "Test commune", quartier: "Test district", food_business_type: "malewa", address_visibility: "broad", timezone_name: "Africa/Kinshasa" }, menu_currency: "CDF", location_confirmed: true, missing_publication_fields: [], actions: ["read", "edit", "preview", "menu", "hours", "publish", "links"], preview: { name: "Isolated Malewa", description: "Synthetic fixture only" } };
async function fixture(page: Page) {
 await page.addInitScript(() => { window.open = () => null; });
 const state = { establishment: structuredClone(establishment), writes: [] as { path: string; method: string; body: Record<string, unknown> | null }[], stale: false, fail: false, denied: false, session: true, binding: "a".repeat(64), items: [] as Record<string, unknown>[], offerings: [] as Record<string, unknown>[] };
 await page.route("**/*", async route => {
  const req = route.request(), url = new URL(req.url());
  url.pathname = url.pathname.replace(/\/$/, "");
  if (url.origin !== "http://127.0.0.1:3013") return route.abort();
  if (!url.pathname.startsWith("/api/")) return route.continue();
  const reply = (json: unknown, status = 200) => route.fulfill({ status, json });
  if (url.pathname.endsWith("/employment/session")) return state.session ? reply({ user: { display_name: "Synthetic seller" }, binding: state.binding }) : reply({}, 401);
  if (url.pathname.endsWith("/employment/logout")) { state.session = false; return reply({ authenticated: false }); }
  if (url.pathname === "/api/shida/personal/auth/whatsapp") return reply({ challenge_ref: "DWC_fixture_only", expires_at: new Date(Date.now()+300000).toISOString(), whatsapp_url: "https://wa.me/243000000000?text=fixture" });
  if (url.pathname === "/api/shida/personal/auth/whatsapp/DWC_fixture_only") return reply({ status: "verified" });
  if (url.pathname === "/api/shida/personal/auth/whatsapp/DWC_fixture_only/session") { state.session = true; return reply({ authenticated: true }); }
  if (url.pathname.endsWith("/auth/request-code")) return reply({ challenge_ref: "DLC_fixture_only" });
  if (url.pathname.endsWith("/auth/verify-code")) { state.session = true; return reply({ user: { display_name: "Synthetic seller" } }); }
  const path = url.pathname.replace("/api/shida/personal/restaurants", "");
  if (!url.pathname.startsWith("/api/shida/personal/restaurants")) return reply({}, 404);
  if (state.denied) return reply({ detail: "restaurant_unavailable" }, 404);
  const method = req.method(); const data = req.postData() ? req.postDataJSON() : null;
  if (method !== "GET") {
   state.writes.push({ path, method, body: data });
   if (state.fail) { state.fail = false; return route.abort(); }
   if (state.stale) { state.stale = false; state.establishment.revision = "2026-09-10T10:01:00.999999+00:00"; return reply({ detail: "restaurant_stale" }, 409); }
   if (path.includes("/links/")) { const destination = path.endsWith("/menu") ? "menu" : "restaurant"; return reply({ establishment_ref: "RST_fixture", destination, public_url: "https://api.nihiloba.com/go/fixture_only", qr_content: "https://api.nihiloba.com/go/menu_qr_fixture" }); }
   if (path === "") { state.establishment.profile.name = data.name; return reply(state.establishment); }
   if (path.endsWith("/lifecycle/publish")) { state.establishment.status = "active"; state.establishment.actions = ["read", "edit", "preview", "menu", "hours", "unpublish", "links"]; return reply(state.establishment); }
   if (path.endsWith("/lifecycle/unpublish")) { state.establishment.status = "inactive"; return reply(state.establishment); }
   if (path === "/RST_fixture") { Object.assign(state.establishment.profile, data.fields); return reply(state.establishment); }
   const result = { public_ref: path.includes("offerings") ? "RDO_fixture" : "RMI_fixture", ...data.fields };
   if (path.includes("offerings")) { state.offerings = [{ ...state.offerings[0], ...result, state: data.fields.confirm ? "scheduled" : "unconfirmed", item: { public_ref: "RMI_fixture", name: "Fixture dish" }, timezone_name: "Africa/Kinshasa" }]; }
   return reply({ revision: state.establishment.revision, result, currency: "CDF" });
  }
  if (path === "") return reply({ items: [state.establishment], page: Number(url.searchParams.get("page") ?? 1), page_size: 20, total: 21, actions: ["create"] });
  if (path.endsWith("/preview") || path === "/RST_fixture") return reply(state.establishment);
  if (path.endsWith("/hours")) return reply({ revision: state.establishment.revision, currency: "CDF", result: { schedule: null, exceptional_closures: [], status: "unknown", timezone_name: "Africa/Kinshasa" } });
  const kind = path.split("/")[3]; const rows = kind === "categories" ? [{ public_ref: "RMC_fixture", name: "Food", visible: true }] : kind === "items" ? state.items : state.offerings;
  if (path.split("/").length > 4) return reply({ revision: state.establishment.revision, currency: "CDF", result: rows[0] });
  return reply({ revision: state.establishment.revision, currency: "CDF", result: { items: rows, page: 1, page_size: 20, total: rows.length } });
 });
 return state;
}
async function open(page: Page) { await page.goto("/shida/seller/restaurants"); await page.getByRole("button", { name: "Edit", exact: true }).click(); await page.getByRole("button", { name: "My profile", exact: true }).click(); }
test("failed logout still clears this tab and focus cannot restore private content", async ({ page }) => {
 await fixture(page); await open(page);
 await page.route("**/api/shida/employment/logout/", route => route.abort());
 await page.getByRole("button", { name: "Sign out / change account", exact: true }).click();
 await page.evaluate(() => window.dispatchEvent(new Event("focus")));
 await expect(page.getByRole("heading", { name: "Sign in with SHIDA", exact: true })).toBeVisible();
 await expect(page.getByRole("heading", { name: "Isolated Malewa", exact: true })).toHaveCount(0);
 await page.route("**/api/shida/personal/auth/whatsapp/", route => route.fulfill({ status: 503, json: {} }));
 await page.getByRole("button", { name: "Continue with WhatsApp", exact: true }).click();
 await expect(page.getByText("Sign-in is unavailable. Please try again.", { exact: true })).toBeVisible();
 await page.evaluate(() => window.dispatchEvent(new Event("focus"))); await expect(page.getByRole("heading", { name: "Isolated Malewa", exact: true })).toHaveCount(0);
});
test("transient session failure preserves input, deduplicates checks and confirmed expiry clears it", async ({ page }) => {
 const s = await fixture(page); await open(page); await page.getByRole("button", { name: "Edit", exact: true }).click(); await page.getByLabel("Name", { exact: true }).fill("Same tab only");
 let calls = 0;
 await page.route("**/api/shida/employment/session/", async route => { calls++; await new Promise(resolve => setTimeout(resolve, 300)); await route.fulfill({ status: 503, json: {} }); });
 await page.evaluate(() => { for (let i = 0; i < 5; i++) window.dispatchEvent(new Event("focus")); });
 await expect(page.getByText(/Connection interrupted/)).toBeVisible(); expect(calls).toBe(1);
 await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Same tab only"); await expect(page.getByLabel("Name", { exact: true })).toBeDisabled();
 await page.unroute("**/api/shida/employment/session/"); await page.evaluate(() => window.dispatchEvent(new Event("online")));
 await expect(page.getByLabel("Name", { exact: true })).toBeEnabled(); await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Same tab only");
 s.session = false; await page.evaluate(() => window.dispatchEvent(new Event("focus")));
 await expect(page.getByRole("heading", { name: "Sign in with SHIDA", exact: true })).toBeVisible(); await expect(page.getByLabel("Name", { exact: true })).toHaveCount(0);
});
test("selection, pagination, private draft and changed-field profile edit", async ({ page }) => {
 const s = await fixture(page); await page.goto("/shida/seller/restaurants");
 await page.getByRole("button", { name: "Next page", exact: true }).click(); await page.getByRole("button", { name: "Previous page", exact: true }).click();
 await page.getByRole("button", { name: "Add another", exact: true }).click(); await page.getByLabel("Name", { exact: true }).fill("New private fixture"); await page.getByRole("button", { name: "Create private draft", exact: true }).click();
 expect(s.writes[0].body?.operation_key).toBeTruthy(); await page.getByRole("button", { name: "My profile", exact: true }).click();
 await page.getByRole("button", { name: "Edit", exact: true }).click(); await page.getByLabel("Name", { exact: true }).fill("Changed name"); await page.getByRole("button", { name: "Save changes", exact: true }).click();
 await expect(page.getByRole("heading", { name: "Changed name", exact: true })).toBeVisible();
 expect(s.writes.at(-1)?.body).toEqual({ expected_updated_at: revision, fields: { name: "Changed name" } });
});
test("uncertain retry is identical and stale edit requires reconciliation", async ({ page }) => {
 const s = await fixture(page); await open(page); await page.getByRole("button", { name: "Edit", exact: true }).click(); await page.getByLabel("Name", { exact: true }).fill("Keep this input"); s.fail = true;
 await page.getByRole("button", { name: "Save changes", exact: true }).click(); await page.getByRole("button", { name: "Retry the same operation", exact: true }).click(); await expect.poll(() => s.writes.length).toBe(2); expect(s.writes[0]).toEqual(s.writes[1]);
 await page.getByRole("button", { name: "Edit", exact: true }).click(); await page.getByLabel("Name", { exact: true }).fill("Reconciled"); s.stale = true; await page.getByRole("button", { name: "Save changes", exact: true }).click();
 await expect(page.getByLabel("Name", { exact: true })).toBeDisabled(); await page.getByRole("button", { name: "Load current values", exact: true }).click(); await page.getByRole("button", { name: "Keep my changes against these current values", exact: true }).click(); await page.getByRole("button", { name: "Save changes", exact: true }).click();
 expect(s.writes.at(-1)?.body?.expected_updated_at).toBe("2026-09-10T10:01:00.999999+00:00");
});
test("unit, configured amount and unknown pricing retain exact values", async ({ page }) => {
 const s = await fixture(page); await open(page); await page.getByRole("button", { name: "My menu", exact: true }).click();
 for (const model of ["UNIT_PRICED", "AMOUNT_PRICED", "UNKNOWN"]) {
  await page.getByRole("button", { name: "+ Add", exact: true }).click(); await page.getByLabel("Name", { exact: true }).fill("Fixture dish"); await page.getByRole("combobox", { name: "Category", exact: true }).selectOption("RMC_fixture"); await page.getByRole("radio", { name: model === "UNIT_PRICED" ? "Per unit" : model === "AMOUNT_PRICED" ? "By amount" : "Price not set", exact: true }).check();
  if (model === "UNIT_PRICED") { await page.getByLabel("Local sale-unit label", { exact: true }).fill("plate"); await page.getByLabel("Price per unit", { exact: true }).fill("9007199254740991.25"); }
  if (model === "AMOUNT_PRICED") { await page.getByLabel("Allowed amounts 1", { exact: true }).fill("1000"); await page.getByRole("button", { name: "Add an amount" }).click(); await page.getByLabel("Allowed amounts 2", { exact: true }).fill("2500.50"); }
  await page.getByRole("button", { name: "Save changes", exact: true }).click(); await expect(page.getByRole("button", { name: "+ Add", exact: true })).toBeVisible();
 }
 expect((s.writes[0].body?.fields as Record<string, unknown>).unit_price).toBe("9007199254740991.25"); expect((s.writes[1].body?.fields as Record<string, unknown>).allowed_amounts).toEqual(["1000", "2500.50"]); expect((s.writes[2].body?.fields as Record<string, unknown>).unit_price).toBeNull();
});
test("hours unknown versus closed, publication and exact QR destination", async ({ page }) => {
 const s = await fixture(page); await open(page); await page.getByRole("button", { name: "Hours", exact: true }).click(); await expect(page.getByText("Unknown · Africa/Kinshasa", { exact: true })).toBeVisible();
 await page.getByRole("button", { name: "Edit", exact: true }).click(); await page.getByLabel("Known schedule", { exact: true }).check(); await page.getByLabel("I confirm these changes", { exact: true }).check(); await page.getByRole("button", { name: "Save changes", exact: true }).click(); expect(s.writes[0].body?.fields).toEqual({ confirm: true, windows: [] });
 await page.getByRole("button", { name: "My profile", exact: true }).click(); await page.getByRole("button", { name: "Publish", exact: true }).click(); await page.getByLabel("I confirm these changes", { exact: true }).check(); await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByRole("button", { name: "QR & sharing", exact: true }).click(); await page.getByRole("button", { name: "Prepare menu link & QR", exact: true }).click(); await expect(page.getByRole("region", { name: "Restaurants & Malewa" }).getByRole("link", { name: "Open on WhatsApp" })).toHaveAttribute("href", "https://api.nihiloba.com/go/fixture_only"); await expect(page.getByRole("img", { name: "Menu QR code" })).toBeVisible();
  await expect(page.locator("canvas.rst-qr")).toHaveAttribute("width", "256");
  const symbol = QRCode.create("https://api.nihiloba.com/go/menu_qr_fixture", { errorCorrectionLevel: "M" });
  const pixels = await page.locator("canvas.rst-qr").evaluate((element, size) => {
   const canvas = element as HTMLCanvasElement, context = canvas.getContext("2d")!;
   return Array.from({ length: size * size }, (_, i) => { const x = Math.floor((i % size + 4.5) * canvas.width / (size + 8)); const y = Math.floor((Math.floor(i / size) + 4.5) * canvas.height / (size + 8)); return context.getImageData(x, y, 1, 1).data[0] < 128 ? 1 : 0; });
  }, symbol.modules.size);
  expect(pixels).toEqual(Array.from(symbol.modules.data));
});
test("expired offering copy stays unconfirmed until a separate confirmation", async ({ page }) => {
 const s = await fixture(page); s.items = [{ public_ref: "RMI_fixture", name: "Fixture dish", pricing_model: "UNKNOWN", presentation: "fixed_dish" }];
 s.offerings = [{ public_ref: "RDO_fixture", item: s.items[0], starts_at: "2025-01-01T10:00:00+00:00", ends_at: "2025-01-01T12:00:00+00:00", timezone_name: "Africa/Kinshasa", state: "expired", visible: true, availability: "sold_out" }];
 await open(page); await page.getByRole("button", { name: "Dated offerings", exact: true }).click(); await expect(page.getByText("Expired", { exact: true })).toBeVisible(); await expect(page.getByText("Sold out", { exact: true })).toBeVisible();
 await page.getByRole("button", { name: "Copy to new dates", exact: true }).click(); await page.getByLabel("Starts at", { exact: true }).fill("2027-01-01T10:00"); await page.getByLabel("Ends at", { exact: true }).fill("2027-01-01T12:00"); await page.getByRole("button", { name: "Save changes", exact: true }).click(); await expect(page.getByText("Awaiting confirmation", { exact: true })).toBeVisible();
 expect(s.writes[0].body?.fields).toEqual({ copy_from: "RDO_fixture", starts_at: "2027-01-01T10:00:00+01:00", ends_at: "2027-01-01T12:00:00+01:00" });
 await page.getByRole("button", { name: "Edit", exact: true }).click(); await page.getByLabel("I confirm these changes", { exact: true }).check(); await page.getByRole("button", { name: "Save changes", exact: true }).click(); expect(s.writes[1].body?.fields).toEqual({ confirm: true });
});
test("isolated WhatsApp challenge sign-in, shared session and logout", async ({ page }) => {
 const s = await fixture(page); s.session = false; await page.goto("/shida/seller/restaurants"); await page.getByRole("button", { name: "Continue with WhatsApp", exact: true }).click(); await expect(page.getByText("Isolated Malewa", { exact: true })).toBeVisible();
 await page.getByRole("button", { name: "Sign out / change account", exact: true }).click(); await expect(page.getByRole("button", { name: "Continue with WhatsApp", exact: true })).toBeVisible(); await expect(page.getByText("Isolated Malewa", { exact: true })).toHaveCount(0);
});
test("lost access and account switching clear editor values", async ({ page }) => {
 const s = await fixture(page); await open(page); s.denied = true; await page.getByRole("button", { name: "Edit", exact: true }).click(); await expect(page.getByText("Synthetic fixture only", { exact: true })).toHaveCount(0);
 s.denied = false; await page.reload(); await page.getByRole("button", { name: "Edit", exact: true }).click(); await page.getByRole("button", { name: "My profile", exact: true }).click(); await page.getByRole("button", { name: "Edit", exact: true }).click(); await page.getByLabel("Name", { exact: true }).fill("Private unsaved name");
 s.session = false; await page.evaluate(() => window.dispatchEvent(new Event("shida-personal-session-changed"))); await expect(page.getByRole("button", { name: "Continue with WhatsApp", exact: true })).toBeVisible(); await expect(page.locator('input[value="Private unsaved name"]')).toHaveCount(0);
});
for (const locale of ["en", "fr", "ln", "sw"]) test(`phone and desktop layout / ${locale}`, async ({ page }) => {
 await fixture(page); await page.setViewportSize({ width: 390, height: 844 }); await page.goto(`${locale === "en" ? "" : `/${locale}`}/shida/seller/restaurants`);
 await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible(); await expect(page.getByText("Isolated Malewa", { exact: true })).toBeVisible();
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
 await page.keyboard.press("Tab"); expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY");
 await page.setViewportSize({ width: 1440, height: 1000 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test("phone editor, long labels, focus and screenshot", async ({ page }) => {
 const s = await fixture(page); s.establishment.profile.name = "Isolated establishment with a deliberately long local name for mobile verification";
 await page.setViewportSize({ width: 390, height: 844 }); await open(page); await page.getByRole("button", { name: "Edit", exact: true }).click();
 await expect(page.getByRole("textbox", { name: "Name", exact: true })).toBeVisible(); await page.getByRole("textbox", { name: "Name", exact: true }).focus(); await page.keyboard.press("Tab"); await expect(page.getByRole("textbox", { name: "Description", exact: true })).toBeFocused();
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
 const editorBox = await page.getByRole("region", { name: "Restaurants & Malewa" }).boundingBox(); expect(editorBox!.x).toBeGreaterThan(0);
 await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
 await page.screenshot({ path: "test-results/restaurant-seller-phone.png", fullPage: true });
 await page.setViewportSize({ width: 1440, height: 1000 }); await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" })); await page.screenshot({ path: "test-results/restaurant-seller-desktop.png", fullPage: true });
});

for (const width of [390, 768, 1440]) {
 test(`v2 sign-in artwork and action / ${width}`, async ({ page, context }, testInfo) => {
  const s = await fixture(page); s.session = false;
  await page.setViewportSize({ width, height: 1000 });
  const images: string[] = []; page.on("request", req => { if (req.url().includes("malewa-comptoir")) images.push(req.url()); });
  const network = await context.newCDPSession(page); await network.send("Network.enable");
  let requests = 0, bytes = 0; const started = Date.now();
  network.on("Network.requestWillBeSent", () => requests++);
  network.on("Network.loadingFinished", event => { bytes += event.encodedDataLength; });
  await page.goto("/fr/shida/seller/restaurants/");
  await expect(page.getByRole("heading", { name: "Votre restaurant, votre espace." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continuer avec WhatsApp", exact: true })).toBeInViewport();
  if (width < 900) expect(images).toEqual([]);
  else { await expect.poll(() => images.length).toBe(1); expect(images[0]).toContain(".webp"); await page.locator(".rst-signin-art img").evaluate(image => (image as HTMLImageElement).decode()); }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/seller-v2-signin-${width}.png`, fullPage: true });
  const measurement = { width, requests, encodedBytes: bytes, durationMs: Date.now() - started, illustrationRequests: images.length, mode: "cold isolated fixture; routing disables cache" };
  console.log("seller-v2-network", JSON.stringify(measurement));
  await testInfo.attach("network", { body: JSON.stringify(measurement), contentType: "application/json" });
 });
 test(`v2 menu-first selection and focused portion editor / ${width}`, async ({ page }) => {
  const s = await fixture(page);
  s.establishment.profile.name = "Chez Ya Mado · isolated fixture";
  s.items = [
   { public_ref: "RMI_fixture", name: "Pondu", category: { public_ref: "RMC_fixture" }, pricing_model: "AMOUNT_PRICED", allowed_amounts: ["500", "1000"], currency: "CDF", presentation: "component", visible: true, availability: "available", permanent: true },
   { public_ref: "RMI_fufu", name: "Fufu", pricing_model: "UNIT_PRICED", unit_price: "1000", sale_unit_label: "boule", currency: "CDF", visible: true, availability: "sold_out" },
   { public_ref: "RMI_unknown", name: "Thomson", pricing_model: "UNKNOWN", visible: false, availability: "temporarily_unavailable" },
  ];
  await page.setViewportSize({ width, height: 1000 }); await page.goto("/fr/shida/seller/restaurants/");
  await page.getByRole("button", { name: "Modifier", exact: true }).click();
  await expect(page.getByRole("button", { name: "Mon menu", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("500; 1000 CDF", { exact: true })).toBeVisible();
  expect(s.writes).toHaveLength(0);
  await page.screenshot({ path: `test-results/seller-v2-menu-${width}.png`, fullPage: true });
  await page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Pondu", exact: true }) }).getByRole("button", { name: "Modifier", exact: true }).click();
  await expect(page.getByRole("radio", { name: "Au montant", exact: true })).toBeChecked();
  await page.getByLabel("Montants autorisés 2", { exact: true }).fill("1250.50");
  expect(s.writes).toHaveLength(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/seller-v2-portion-${width}.png`, fullPage: true });
  await page.getByRole("button", { name: "Annuler la modification", exact: true }).click();
  expect(s.writes).toHaveLength(0); await expect(page.getByText("500; 1000 CDF", { exact: true })).toBeVisible();
 });
}

test("menu pagination uses the server page and locale links remain reachable", async ({ page }) => {
 await fixture(page);
 const pages: string[] = [];
 await page.route("**/api/shida/personal/restaurants/RST_fixture/menu/items/**", route => {
  const url = new URL(route.request().url()); pages.push(url.searchParams.get("page") ?? "");
  return route.fulfill({ json: { revision, currency: "CDF", result: { items: [], total: 21, page: Number(url.searchParams.get("page")), page_size: 20 } } });
 });
 await page.goto("/shida/seller/restaurants/"); await page.getByRole("button", { name: "Edit", exact: true }).click();
 await page.getByRole("button", { name: "Next page", exact: true }).click();
 await expect(page.getByText("Page 2", { exact: true })).toBeVisible(); expect(pages).toEqual(["1", "2"]);
 await page.getByRole("navigation", { name: "Seller language" }).getByRole("link", { name: "SW", exact: true }).click();
 await expect(page).toHaveURL(/\/sw\/shida\/seller\/restaurants\//);
 await expect(page.getByRole("heading", { name: "Sehemu zako", exact: true })).toBeVisible();
});
