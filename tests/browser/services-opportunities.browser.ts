import {test, expect} from "@playwright/test";
import {opportunityWords} from "../../app/lib/services-opportunity-copy";
import {comparisonWords} from "../../app/lib/services-comparison-copy";
import {requestWords} from "../../app/lib/services-request-copy";
import {requestSupportCopy} from "../../app/lib/services-request-support-copy";

for (const [locale, width] of [["en", 320], ["fr", 390], ["ln", 820], ["sw", 1440]] as const)
test(`Provider private quotation review, exact retry and history ${locale}`, async ({page}) => {
  await page.setViewportSize({width, height: 950});
  await page.addInitScript(language => localStorage.setItem("shida-language", language), locale);
  const t = opportunityWords(locale), c = comparisonWords(locale), common = requestWords(locale);
  const offering = {public_ref:"SVC_one",provider_ref:"SVI_one",name:"Provider",service_name:"Cleaning",category:"cleaning",description:"Cleaning",
    service_duration_minutes:60,commune:"Gombe",service_location_type:"public_place",home_service_available:"no",booking_mode:"flexible",
    availability:"Weekdays",publication_origin:"pilot",visible_to_customers:true,requests_enabled:true,is_active:"yes",revision:1,missing_fields:[],packages:[],rating:{average:null,count:0}};
  const posted = {posted_ref: "SPR_one", revision: 1, status: "OPEN", brief_revision_ref: "SCV_one",
    support_url:"https://wa.me/243811000000?text=support",
    summary: {category: "cleaning", description: "Clean two rooms", commune: "Gombe", timing: "Wednesday"},
    expires_at: "2026-12-01T20:00:00Z", created_at: "2026-11-29T20:00:00Z"};
  let proposal = {proposal_ref: "SPF_one", posted_ref: "SPR_one", offering_ref: "SVC_one", revision: 1,
    status: "DRAFT", request_status: "OPEN", request: posted, draft: {}, draft_digest: "a".repeat(64),
    draft_answers_current_brief: true, current: null as null | object, clarifications: []};
  const saves: string[] = [], submits: string[] = []; let lost = true, denied = false;
  await page.route("**/api/shida/**", async route => {
    const req = route.request(), path = new URL(req.url()).pathname.replace(/\/$/, "");
    if (path.endsWith("/employment/session")) return route.fulfill({json:{binding:"a".repeat(64),user:{display_name:"Provider"}}});
    if (path.endsWith("/services/capabilities")) return route.fulfill({json:{capabilities:["profile","requests_quotes"],access_policy:"pilot"}});
    if (path.endsWith("/services")) return route.fulfill({json:{profiles:[offering]}});
    if (path.endsWith("/reviews")) return route.fulfill({json:{reviews:[]}});
    const action = path.split("/competition/")[1];
    if (action === "postings/available") return route.fulfill({json:{requests:[posted],next_cursor:null}});
    if (action === "postings/SPR_one/proposals") return route.fulfill({json:proposal});
    if (action === "proposals/SPF_one/save") {
      saves.push(req.postData()!);
      proposal = {...proposal, revision:2, draft:JSON.parse(req.postData()!).content};
      if (lost) {lost=false; return route.abort("failed");}
      return route.fulfill({json:proposal});
    }
    if (action === "proposals/SPF_one/submit") {
      submits.push(req.postData()!);
      proposal = {...proposal, revision:3, status:"SUBMITTED", current:{version_ref:"SPV_one",number:1,
        brief_revision_ref:"SCV_one",brief_summary:posted.summary,content:proposal.draft,expires_at:posted.expires_at,submitted_at:posted.created_at}};
      return route.fulfill({json:proposal});
    }
    if (action === "proposals/SPF_one/history") return route.fulfill({json:{versions:[proposal.current],next_ref:null}});
    if (action === "proposals/SPF_one") return route.fulfill(denied ? {status:403,json:{detail:"unavailable"}} : {json:proposal});
    return route.fulfill({status:404,json:{detail:"unavailable"}});
  });
  await page.goto(`${locale==="en"?"":`/${locale}`}/shida/seller/services?view=available`);
  const panel = page.locator(".svc-request");
  const support=requestSupportCopy(locale);
  await panel.getByText(support.report,{exact:true}).click();
  await expect(panel.getByLabel(support.reference,{exact:true})).toHaveValue("SPR_one");
  await expect(panel.getByRole("link",{name:support.open,exact:false})).toHaveAttribute("href",posted.support_url);
  await expect(panel.getByText(support.help,{exact:true})).toBeVisible();
  expect(saves).toHaveLength(0);expect(submits).toHaveLength(0);
  if(locale==="fr")await panel.screenshot({path:"test-results/services-request-report-fr.png"});
  await panel.getByRole("button", {name:t.prepare,exact:true}).click();
  await page.locator(".rst-dropdown").first().locator("summary").click();
  await expect(page.locator('a[hreflang="fr"]')).toHaveAttribute("href",/view=available.*request=SPR_one.*proposal=SPF_one/);
  await page.locator(".rst-dropdown").first().locator("summary").click();
  await panel.getByRole("textbox",{name:c.scope,exact:true}).fill("Two rooms including windows");
  await panel.getByRole("textbox",{name:c.amount,exact:true}).fill("75,50");
  await panel.getByRole("button",{name:t.save,exact:true}).click();
  await expect(panel.getByText(common.uncertain,{exact:true})).toBeVisible();
  await expect(panel.getByRole("textbox",{name:c.scope,exact:true})).toBeDisabled();
  await panel.getByRole("button",{name:common.retry,exact:true}).click();
  expect(saves).toHaveLength(2); expect(saves[0]).toBe(saves[1]);
  expect(JSON.parse(saves[0])).toMatchObject({revision:1,content:{amount:"75.50",currency:"CDF"}});
  expect(submits).toHaveLength(0);
  await panel.getByRole("button",{name:t.review,exact:true}).click();
  await expect(panel.getByText("Two rooms including windows",{exact:true})).toBeVisible();
  await expect(panel.getByRole("definition").last()).not.toHaveText("—");
  const reviewCard=panel.locator(".svc-brief-card").filter({has:page.getByRole("button",{name:t.submit,exact:true})});
  expect(await reviewCard.evaluate(node=>getComputedStyle(node).display)).not.toBe("flex");
  expect(await reviewCard.getByRole("definition").first().evaluate(node=>node.getBoundingClientRect().width)).toBeGreaterThan(150);
  await page.screenshot({path:`test-results/proposal-review-${locale}.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await panel.getByRole("button",{name:t.submit,exact:true}).click();
  await expect(panel.getByText(t.sent,{exact:true})).toBeVisible();
  expect(submits).toHaveLength(1);
  expect(JSON.parse(submits[0])).toMatchObject({revision:2,reviewed_digest:"a".repeat(64)});
  await panel.getByRole("button",{name:c.history,exact:true}).click();
  await expect(panel.locator("details")).toHaveCount(2);
  await expect(page).toHaveURL(/proposal=SPF_one/);
  await page.reload();
  await expect(panel.getByText(t.sentVersion,{exact:false})).toBeVisible();
  denied=true;
  await page.reload();
  await expect(page.getByText("Two rooms including windows",{exact:true})).toHaveCount(0);
});
