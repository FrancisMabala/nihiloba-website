import { test, expect } from "@playwright/test";

// Actual local Backend/PostgreSQL through the production Next gateway. No API
// response mocking, no inbound message simulation and no external navigation.
test.skip(process.env.RESTAURANT_ACTUAL_BACKEND !== "1", "Requires isolated HTTPS Backend and production website");
for (const width of [390, 1366]) test(`actual Backend challenge remains pending without a message / ${width}`, async ({ page, context }) => {
  await page.setViewportSize({ width, height: 900 });
  await context.route("**/*", route => new URL(route.request().url()).origin === "https://localhost:3014" ? route.continue() : route.abort());
  await page.addInitScript(() => { window.open = () => null; });
  await page.goto("/fr/shida/seller/restaurants/");
  const created = page.waitForResponse(r => r.url().endsWith("/api/shida/personal/auth/whatsapp/") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Continuer avec WhatsApp", exact: true }).click();
  expect((await created).status()).toBe(201);
  await expect(page.getByText("En attente de l’envoi du message…", { exact: true })).toBeVisible();
  const link = page.getByRole("link", { name: "Ouvrir SHIDA sur WhatsApp" });
  // Assert boolean only, keeping the actual challenge URL out of failure output.
  expect((await link.getAttribute("href"))?.startsWith("https://wa.me/243000000000?")).toBe(true);
  const status = await page.waitForResponse(r => r.url().includes("/api/shida/personal/auth/whatsapp/DWC_") && r.request().method() === "GET");
  expect((await status.json()).status).toBe("pending");
  const cookies = await context.cookies();
  expect(cookies.some(c => c.name === "nihiloba_personal_challenge" && c.httpOnly && c.secure && c.sameSite === "Lax")).toBe(true);
  expect(cookies.some(c => c.name === "nihiloba_personal_session")).toBe(false);
  await page.getByRole("button", { name: "Annuler la connexion", exact: true }).click();
  await expect(page.getByRole("button", { name: "Réessayer", exact: true })).toBeVisible();
  expect((await context.cookies()).some(c => c.name === "nihiloba_personal_challenge")).toBe(false);
});
