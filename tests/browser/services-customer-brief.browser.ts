import {test, expect} from "@playwright/test";
import {requestWords} from "../../app/lib/services-request-copy";
import {servicesAccountCopy} from "../../app/lib/services-account-navigation";

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
  await expect(page.getByRole("button", {name: t.publish, exact: true})).toBeEnabled();
  await expect(page.getByRole("textbox", {name: t.needDescription, exact: true})).toHaveValue("Keep my written request");
  expect(uploads).toBe(1);
});

for (const [locale, width] of [["en", 320], ["fr", 390], ["ln", 430], ["sw", 1280]] as const) {
  test(`Marketplace publishes latest edits and retries once ${locale}`, async ({page}) => {
    const t = requestWords(locale);
    let brief: CustomerBrief | null = null;
    const writes: string[] = [], publications: string[] = [];
    await page.setViewportSize({width,height:900});
    await page.route("**/api/shida/**", async route => {
      const req=route.request(), path=new URL(req.url()).pathname.replace(/\/$/,"");
      if (path.endsWith("/employment/session")) return route.fulfill({json:{binding:"a".repeat(64),user:{display_name:"Customer"}}});
      if (path.endsWith("/registration-reference")) return route.fulfill({json:{kinshasa_communes:["Lemba","Gombe"]}});
      const action=path.split("/service-requests/")[1];
      if (action==="postings") return route.fulfill({json:{requests:[],next_ref:null}});
      if (action==="briefs" && req.method()==="GET") return route.fulfill({json:{briefs:brief?[brief]:[],has_more:false}});
      if (action==="briefs/preview") return route.fulfill({json:{summary:req.postDataJSON()}});
      if (action==="briefs/SCB_one/documents") return route.fulfill({json:{documents:[]}});
      if (action==="briefs/SCB_one") return route.fulfill({json:brief});
      if (action==="briefs" || action==="briefs/SCB_one/save") {
        const {content}=req.postDataJSON(); writes.push("save");
        brief={brief_ref:"SCB_one",revision:(brief?.revision??0)+1,status:"DRAFT",content,summary:content,summary_digest:"b".repeat(64),edited_at:"2026-10-20T12:00:00Z",expires_at:"2026-11-19T12:00:00Z"};
        return route.fulfill({json:brief});
      }
      if (action==="briefs/SCB_one/review") {
        writes.push("review"); expect(req.postDataJSON().summary_digest).toBe(brief!.summary_digest);
        brief={...brief!,status:"REVIEWED",revision:brief!.revision+1};
        return route.fulfill({json:brief});
      }
      if (action==="briefs/SCB_one/publish") {
        publications.push(req.postData()!);
        return publications.length===1 ? route.abort("failed") : route.fulfill({json:{posted_ref:"SPR_one"}});
      }
      return route.fulfill({status:404,json:{detail:"service_brief_unavailable"}});
    });
    await page.goto(`${locale==="en"?"":"/"+locale}/shida/services`);
    await page.getByRole("link",{name:servicesAccountCopy[locale].describe,exact:true}).first().click();
    const editor=page.getByRole("region",{name:t.needHeading,exact:true});
    const button=(name:string)=>editor.getByRole("button",{name,exact:true});
    await button(t.publish).click();
    await expect(editor.locator('[name="category"]')).toBeFocused();
    await editor.locator('[name="description"]').fill("Restore lighting");
    if (locale==="fr") {
      await button(t.save).click();
      await expect(editor.getByRole("status").filter({hasText:t.saved})).toContainText("30");
      expect(writes).toEqual(["save"]); expect(publications).toHaveLength(0);
      await page.reload();
      await expect(editor.locator('[name="description"]')).toHaveValue("Restore lighting");
    }
    await editor.locator('[name="category"]').selectOption("repair_maintenance");
    await editor.locator('[name="city"]').fill("Kinshasa");
    await editor.locator('[name="commune"]').selectOption("Lemba");
    await editor.locator('[name="timing"]').fill("Saturday morning");
    await editor.locator('[name="description"]').fill("Replace two sockets");
    if (width>760) {
      await editor.getByLabel(t.budget,{exact:true}).fill("25000");
      await expect(editor.locator("#svc-preview-body")).toContainText("Replace two sockets");
      await expect(editor.locator("#svc-preview-body")).toContainText("CDF");
      await editor.getByLabel(t.budget,{exact:true}).fill("");
      await expect(editor.locator("#svc-preview-body")).toContainText("Lemba, Kinshasa");
      await expect(editor.locator("#svc-preview-body")).not.toContainText("CDF");
    } else {
      await expect(button(t.providerPreview)).toHaveAttribute("aria-expanded","false");
      await expect(editor.locator("#svc-preview-body")).toBeHidden();
    }
    await button(t.publish).dblclick();
    await expect(editor.getByText(t.uncertain,{exact:true})).toBeVisible();
    await expect(editor.locator('[name="description"]')).toHaveValue("Replace two sockets");
    await button(t.retry).click();
    await expect(page.getByRole("heading",{name:t.postedSuccess})).toBeVisible();
    await expect(page.getByRole("link",{name:t.track})).toHaveAttribute("href","?request=SPR_one");
    expect(publications).toHaveLength(2); expect(publications[0]).toBe(publications[1]);
    expect(writes).toEqual(locale==="fr"?["save","save","review"]:["save","review"]);
    expect(brief!.content.description).toBe("Replace two sockets");
    expect(brief!.content).not.toHaveProperty("budget_amount");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
}

test("Customer sees only reviewed summary, keeps original private and recovers stale edits", async ({page}) => {
  const t = requestWords("en");
  let failSave = true;
  const row: CustomerBrief = {brief_ref: "SCB_pdf", revision: 3, status: "DRAFT",
    content: {category: "cleaning", language: "en", description: "Clean the kitchen", city:"Kinshasa", commune:"Gombe", preferred_date:"2026-12-08", preferred_start_time:"09:00"},
    summary: {category: "cleaning", language: "en", description: "Clean the kitchen", city:"Kinshasa", commune:"Gombe", preferred_date:"2026-12-08", preferred_start_time:"09:00"},
    summary_digest: "b".repeat(64), edited_at: "2026-10-20T12:00:00Z", expires_at: "2026-11-19T12:00:00Z"};
  await page.route("**/api/shida/**", async route => {
    const req = route.request(), path = new URL(req.url()).pathname.replace(/\/$/, "");
    if (path.endsWith("/employment/session")) return route.fulfill({json: {binding: "a".repeat(64), user: {display_name: "Customer"}}});
    const action = path.split("/service-requests/")[1];
      if (action === "postings") return route.fulfill({json: {requests: [], next_ref: null}});
    if (action === "briefs") return route.fulfill({json: {briefs: [row], has_more: false}});
    if (path.endsWith("/registration-reference")) return route.fulfill({json:{kinshasa_communes:["Gombe","Limete"]}});
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
  const providerPreview = page.locator("#svc-preview-body");
  await expect(providerPreview).not.toContainText("Original private attachment text");
  await expect(providerPreview).toContainText("Clean the kitchen");
  await expect(page.locator('[name="timing"]')).toHaveValue("2026-12-08 · 09:00");
  await page.locator('[name="commune"]').selectOption("Limete");
  await page.getByRole("button", {name: t.save, exact: true}).click();
  await expect(page.getByText(t.stale, {exact: true})).toBeVisible();
  await expect(page.getByRole("button", {name: t.publish, exact: true})).toBeDisabled();

  await page.getByRole("button", {name: t.reload, exact: true}).click();
  await page.getByRole("dialog").getByRole("button", {name:t.reload,exact:true}).click();
  await expect(page.locator('[name="commune"]')).toHaveValue("Gombe");
});
