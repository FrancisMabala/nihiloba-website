import {test, expect} from "@playwright/test";
import {requestWords} from "../../app/lib/services-request-copy";
import {comparisonWords} from "../../app/lib/services-comparison-copy";
import {serviceCategoryExperience} from "../../app/lib/services-category-experience";
import type {CustomerBrief} from "../../app/lib/services-request-browser";

test("An open editor removes PDF intake when the backend disables it", async ({page}) => {
  const t = requestWords("en"); let uploads = 0;
  const row: CustomerBrief = {brief_ref: "SCB_paused", revision: 1, status: "DRAFT", pdf_uploads_enabled: true,
    content: {category: "cleaning", language: "en", description: "Keep my written request", commune: "Gombe", timing: "Tuesday"},
    summary: {category: "cleaning", language: "en", description: "Keep my written request", commune: "Gombe", timing: "Tuesday"},
    summary_digest: "a".repeat(64), edited_at: "2026-10-21T12:00:00Z", expires_at: "2026-11-20T12:00:00Z"};
  await page.route("**/api/shida/**", async route => {
    const path = new URL(route.request().url()).pathname.replace(/\/$/, "");
    if (path.endsWith("/employment/session")) return route.fulfill({json: {binding: "a".repeat(64), user: {display_name: "Customer"}}});
    const action = path.split("/service-requests/")[1];
    if (action === "postings") return route.fulfill({json: {requests: [], next_ref: null}});
    if (action === "briefs") return route.fulfill({json: {briefs: [row], has_more: false}});
    if (action === "briefs/SCB_paused") return route.fulfill({json: row});
    if (action === "briefs/SCB_paused/documents") return route.fulfill({json: {documents: []}});
    if (action === "briefs/SCB_paused/document-upload") {
      uploads++; return route.fulfill({status: 422, json: {detail: "service_brief_pdf_uploads_disabled"}});
    }
    return route.fulfill({status: 404, json: {detail: "service_brief_unavailable"}});
  });
  await page.goto("/shida/service-requests?brief=SCB_paused");
  await page.locator('input[type="file"]').setInputFiles({name: "request.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-test")});
  await page.getByRole("button", {name: t.upload, exact: true}).click();
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await expect(page.getByText(t.pdfDisabled, {exact: true}).first()).toBeVisible();
  await expect(page.getByRole("button", {name: t.review, exact: true})).toBeEnabled();
  await expect(page.getByRole("textbox", {name: serviceCategoryExperience("cleaning", "en")!.request, exact: true})).toHaveValue("Keep my written request");
  expect(uploads).toBe(1);
});

for (const [locale, width] of [["en", 320], ["fr", 390], ["ln", 430], ["sw", 768]] as const) {
  test(`Customer reviewed text brief and exact retry ${locale}`, async ({page}) => {
    await page.setViewportSize({width, height: 900});
    const t = requestWords(locale), bodies: string[] = [];
    let brief: CustomerBrief | null = null, uncertain = true;
    const writes: string[] = [];
    await page.route("**/api/shida/**", async route => {
      const request = route.request(), path = new URL(request.url()).pathname.replace(/\/$/, "");
      if (path.endsWith("/employment/session")) return route.fulfill({json: {binding: "a".repeat(64), user: {display_name: "Customer"}}});
      const action = path.split("/service-requests/")[1];
      if (action === "postings") return route.fulfill({json: {requests: [], next_ref: null}});
      if (action === "briefs" && request.method() === "GET") return route.fulfill({json: {briefs: [], has_more: false}});
      if (action === "briefs" && request.method() === "POST") {
        bodies.push(request.postData()!);
        const payload = request.postDataJSON();
        brief = {brief_ref: "SCB_one", revision: 1, status: "DRAFT", content: payload.content, summary: payload.content,
          summary_digest: "b".repeat(64), edited_at: "2026-10-20T12:00:00Z", expires_at: "2026-11-19T12:00:00Z"};
        if (uncertain) {uncertain = false; return route.abort("failed");}
        return route.fulfill({json: brief});
      }
      if (action === "briefs/SCB_one/review") {
        writes.push("review");
        expect(request.postDataJSON().summary_digest).toBe("b".repeat(64));
        brief = {...brief!, status: "REVIEWED", revision: 2};
        return route.fulfill({json: brief});
      }
      if (action === "briefs/SCB_one/publish") {
        writes.push("publish");
        expect(request.postDataJSON().revision).toBe(2);
        return route.fulfill({json: {posted_ref: "SPR_one", revision: 1, status: "OPEN"}});
      }
      if (action === "postings/SPR_one/proposals") return route.fulfill({json: {request: {
        posted_ref: "SPR_one", revision: 1, status: "OPEN", summary: brief!.summary,
        brief_revision_ref: "SCV_one", created_at: "2026-10-20T12:00:00Z", expires_at: "2026-10-22T12:00:00Z",
      }, proposals: [], next_ref: null}});
      return route.fulfill({status: 404, json: {detail: "service_brief_unavailable"}});
    });
    await page.goto(`${locale === "en" ? "" : `/${locale}`}/shida/service-requests?new=1`);
    const editor = page.getByRole("region", {name: t.title, exact: true});
    await expect(editor.getByText(t.pdfDisabled, {exact: true})).toBeVisible();
    await expect(editor.locator('input[type="file"]')).toHaveCount(0);
    await editor.getByRole("combobox", {name: t.category, exact: true}).selectOption("cleaning");
    await editor.getByLabel(serviceCategoryExperience("cleaning", locale)!.request, {exact: true}).fill("Clean two rooms; customer supplies products.");
    await editor.getByLabel(t.commune, {exact: true}).fill("Gombe");
    await editor.getByLabel(t.timing, {exact: true}).fill("Next Tuesday morning");
    await editor.getByLabel(t.budget, {exact: true}).fill("75,50");
    await editor.getByRole("button", {name: t.save, exact: true}).click();
    await expect(editor.getByText(t.uncertain, {exact: true})).toBeVisible();
    await expect(editor.getByLabel(t.commune, {exact: true})).toBeDisabled();
    await editor.getByRole("button", {name: t.retry, exact: true}).click();
    expect(bodies).toHaveLength(2); expect(bodies[0]).toBe(bodies[1]);
    await expect(editor.getByText(t.pdfDisabled, {exact: true})).toBeVisible();
    await expect(editor.locator('input[type="file"]')).toHaveCount(0);
    await editor.getByRole("button", {name: t.review, exact: true}).click();
    await expect(editor.getByRole("button", {name: t.publish, exact: true})).toHaveCount(0);
    await expect(editor.getByText(t.audience, {exact: true})).toBeVisible();
    await editor.getByRole("button", {name: t.confirm, exact: true}).click();
    await editor.getByRole("button", {name: t.publish, exact: true}).click();
    await expect(page.getByRole("heading", {name: comparisonWords(locale).title, exact: true})).toBeVisible();
    expect(writes).toEqual(["review", "publish"]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("Customer sees only reviewed summary, keeps original private and recovers stale edits", async ({page}) => {
  const t = requestWords("en");
  let failSave = true;
  const row: CustomerBrief = {brief_ref: "SCB_pdf", revision: 3, status: "DRAFT",
    content: {category: "cleaning", language: "en", description: "Clean the kitchen", commune: "Gombe", timing: "Tuesday"},
    summary: {category: "cleaning", language: "en", description: "Clean the kitchen", commune: "Gombe", timing: "Tuesday"},
    summary_digest: "b".repeat(64), edited_at: "2026-10-20T12:00:00Z", expires_at: "2026-11-19T12:00:00Z"};
  await page.route("**/api/shida/**", async route => {
    const req = route.request(), path = new URL(req.url()).pathname.replace(/\/$/, "");
    if (path.endsWith("/employment/session")) return route.fulfill({json: {binding: "a".repeat(64), user: {display_name: "Customer"}}});
    const action = path.split("/service-requests/")[1];
      if (action === "postings") return route.fulfill({json: {requests: [], next_ref: null}});
    if (action === "briefs") return route.fulfill({json: {briefs: [row], has_more: false}});
    if (action === "briefs/SCB_pdf/documents") return route.fulfill({json: {documents: [{
      document_ref: "SCD_one", revision: 1, status: "READY", has_original: true, preview: "Original private attachment text",
      error: null, truncated: true, page_count: 2,
    }]}});
    if (action === "briefs/SCB_pdf/save" && failSave) {failSave = false; return route.fulfill({status: 409, json: {detail: "service_brief_stale"}});}
    if (action === "briefs/SCB_pdf") return route.fulfill({json: row});
    return route.fulfill({status: 404, json: {detail: "service_brief_unavailable"}});
  });
  await page.goto("/shida/service-requests?brief=SCB_pdf");
  await expect(page.getByText(t.pdfDisabled, {exact: true})).toBeVisible();
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await page.getByText(t.preview, {exact: true}).click();
  await expect(page.getByText("Original private attachment text", {exact: true})).toBeVisible();
  await page.getByRole("button", {name: t.review, exact: true}).click();
  await expect(page.getByText("Original private attachment text", {exact: true})).toHaveCount(0);
  await expect(page.getByText("Clean the kitchen", {exact: true})).toBeVisible();
  await page.getByRole("button", {name: t.edit, exact: true}).click();
  await page.getByLabel(t.commune, {exact: true}).fill("Limete");
  await page.getByRole("button", {name: t.save, exact: true}).click();
  await expect(page.getByText(t.stale, {exact: true})).toBeVisible();
  await expect(page.getByRole("button", {name: t.review, exact: true})).toBeDisabled();
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", {name: t.reload, exact: true}).click();
  await expect(page.getByLabel(t.commune, {exact: true})).toHaveValue("Gombe");
});
