import { test, expect, type Page } from "@playwright/test";
import { personalLoginCopy } from "../../app/lib/personal-login-copy";

async function fixture(page: Page) {
  const state = { status: "pending", reason: "", loggedIn: false, exchanges: 0, polls: 0, starts: 0, uncertain: false };
  await page.addInitScript(() => { window.open = () => null; }); // Never navigate/send to real WhatsApp.
  await page.route("**/*", async route => {
    const url = new URL(route.request().url()), path = url.pathname.replace(/\/$/, "");
    if (url.origin !== "http://127.0.0.1:3013") return route.abort();
    if (!path.startsWith("/api/")) return route.continue();
    const reply = (json: unknown, status = 200) => route.fulfill({ json, status });
    if (path.endsWith("/employment/session")) return state.loggedIn ? reply({ user: { display_name: "Synthetic Personal" }, binding: "a".repeat(64) }) : reply({}, 401);
    if (path.endsWith("/employment/logout")) { state.loggedIn = false; return reply({ authenticated: false }); }
    if (path.endsWith("/employment/applications")) return reply({ applications: [] });
    if (path === "/api/shida/personal/restaurants") return reply({ items: [], total: 0, page: 1, page_size: 20, actions: ["create"] });
    if (path === "/api/shida/personal/auth/whatsapp") {
      if (route.request().method() === "DELETE") return reply({ status: "cancelled" });
      state.starts++;
      return reply({ challenge_ref: `DWC_fixture_${state.starts}`, expires_at: new Date(Date.now() + 300000).toISOString(), whatsapp_url: "https://wa.me/243000000000?text=synthetic-not-sent" }, 201);
    }
    if (path.includes("/personal/auth/whatsapp/DWC_")) {
      if (path.endsWith("/session")) { state.exchanges++; state.loggedIn = true; return state.uncertain ? route.abort() : reply({ authenticated: true }); }
      state.polls++; return reply({ status: state.status, reason: state.reason });
    }
    return reply({}, 404);
  });
  return state;
}

for (const locale of ["en", "fr", "ln", "sw"] as const) for (const width of [390, 1366]) {
  test(`${locale} ${width}: shared login, exact link, message required, foreground return and destination`, async ({ page }) => {
    const s = await fixture(page), t = personalLoginCopy[locale]; await page.setViewportSize({ width, height: 850 });
    const path = `${locale === "en" ? "" : `/${locale}`}/shida/seller/restaurants/?return=kept`;
    await page.goto(path); await page.getByRole("button", { name: t.start, exact: true }).click();
    await expect(page.getByRole("link", { name: t.open })).toHaveAttribute("href", "https://wa.me/243000000000?text=synthetic-not-sent");
    await expect(page.getByText(t.help, { exact: true })).toBeVisible();
    if (locale === "en") await page.screenshot({ path: `.s3a-local/personal-login-${width}.png`, fullPage: true });
    await page.getByRole("link", { name: t.open }).focus(); await page.keyboard.press("Tab"); await expect(page.getByRole("button", { name: t.cancel })).toBeFocused();
    expect(s.exchanges).toBe(0); expect(await page.locator('input[autocomplete="one-time-code"]').count()).toBe(0);
    await expect.poll(() => s.polls).toBeGreaterThan(0);
    s.status = "verified"; await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page.getByText("Synthetic Personal", { exact: false })).toBeVisible(); expect(s.exchanges).toBe(1); expect(page.url()).toContain(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.evaluate(() => Object.values(localStorage).some(v => v.includes("synthetic-not-sent") || v.includes("DWC_")))).toBe(false);
  });
}
test("Employment uses the same flow and preserves intended application URL", async ({ page }) => {
  const s = await fixture(page); await page.goto("/shida/my-applications/?from=jobs");
  await page.getByRole("button", { name: "Continue with WhatsApp" }).click();
  s.status = "verified"; await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByText("You have no applications yet.")).toBeVisible(); expect(page.url()).toContain("/shida/my-applications/?from=jobs");
});
for (const status of ["expired", "cancelled", "onboarding_required"] as const) test(`${status} is truthful and never exchanges`, async ({ page }) => {
  const s = await fixture(page); s.status = status === "onboarding_required" ? "cancelled" : status; s.reason = status;
  await page.goto("/shida/seller/restaurants/"); await page.getByRole("button", { name: "Continue with WhatsApp" }).click();
  await expect(page.getByText(personalLoginCopy.en[status], { exact: true })).toBeVisible(); expect(s.exchanges).toBe(0);
});
test("cancel and cross-tab supersession stop old polls", async ({ page }) => {
  const s = await fixture(page); await page.goto("/shida/seller/restaurants/"); await page.getByRole("button", { name: "Continue with WhatsApp" }).click();
  await page.getByRole("button", { name: "Cancel sign-in" }).click(); s.status = "verified";
  await page.evaluate(() => window.dispatchEvent(new Event("focus"))); expect(s.exchanges).toBe(0);
  await page.getByRole("button", { name: "Try again" }).click();
  await page.evaluate(() => window.dispatchEvent(new StorageEvent("storage", { key: "shida-personal-login-attempt", newValue: "new-attempt" })));
  await expect(page.getByText(personalLoginCopy.en.cancelled, { exact: true })).toBeVisible(); expect(s.exchanges).toBe(0);
});
test("uncertain exchange signs out instead of retrying or adopting a session", async ({ page }) => {
  const s = await fixture(page); s.status = "verified"; s.uncertain = true;
  await page.goto("/shida/seller/restaurants/"); await page.getByRole("button", { name: "Continue with WhatsApp" }).click();
  await expect(page.getByText(personalLoginCopy.en.uncertain, { exact: true })).toBeVisible(); expect(s.exchanges).toBe(1); expect(s.loggedIn).toBe(false);
  await page.getByRole("button", { name: "Sign out and retry" }).click(); await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});
test("late verified response after cancellation cannot exchange", async ({ page }) => {
  const s = await fixture(page); let release!: () => void;
  const delayed = new Promise<void>(resolve => { release = resolve; });
  let seen = false;
  await page.route("**/personal/auth/whatsapp/DWC_fixture_1/", async route => { seen = true; await delayed; await route.fulfill({ json: { status: "verified" } }).catch(() => {}); });
  await page.goto("/shida/seller/restaurants/"); await page.getByRole("button", { name: "Continue with WhatsApp" }).click();
  await expect.poll(() => seen).toBe(true); await page.getByRole("button", { name: "Cancel sign-in" }).click(); release();
  await expect(page.getByText(personalLoginCopy.en.cancelled, { exact: true })).toBeVisible(); expect(s.exchanges).toBe(0);
});
test("rate limit is localized, retryable and does not poll", async ({ page }) => {
  const s = await fixture(page);
  await page.route("**/personal/auth/whatsapp/", route => route.fulfill({ status: 429, json: { error: { code: "rate_limited" } } }));
  await page.goto("/fr/shida/seller/restaurants/"); await page.getByRole("button", { name: personalLoginCopy.fr.start }).click();
  await expect(page.getByText(personalLoginCopy.fr.rate_limited, { exact: true })).toBeVisible(); expect(s.polls).toBe(0);
});
test("lost exchange and failed cleanup cannot restore an uncertain account on focus or reload", async ({ page }) => {
  const s = await fixture(page); s.status = "verified"; s.uncertain = true;
  await page.route("**/employment/logout/", route => route.abort());
  await page.goto("/shida/seller/restaurants/"); await page.getByRole("button", { name: "Continue with WhatsApp" }).click();
  await expect(page.getByText(personalLoginCopy.en.uncertain, { exact: true })).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("focus"))); await expect(page.getByText("Synthetic Personal")).toHaveCount(0);
  await page.reload(); await expect(page.getByRole("button", { name: "Continue with WhatsApp" })).toBeVisible(); await expect(page.getByText("Synthetic Personal")).toHaveCount(0);
});
