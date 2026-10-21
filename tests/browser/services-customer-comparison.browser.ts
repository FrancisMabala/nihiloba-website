import {test, expect} from "@playwright/test";
import {comparisonWords} from "../../app/lib/services-comparison-copy";
import {requestWords} from "../../app/lib/services-request-copy";
for (const [locale, width] of [["en", 320], ["fr", 390], ["ln", 430], ["sw", 768]] as const) test(`Customer selects exact quote version and recovers booking ${locale}`, async ({page}) => {
  await page.setViewportSize({width, height: 900});
  const t = comparisonWords(locale), common = requestWords(locale);
  const terms = {amount: "75.50", currency: "USD", pricing_description: "Two rooms", duration_minutes: 60,
    proposed_start: "2026-12-02T08:00:00Z", proposed_end: "2026-12-02T09:00:00Z", terms: "Cleaning products included"};
  const request = {posted_ref: "SPR_one", revision: 4, status: "OPEN", summary: {description: "Clean two rooms", commune: "Gombe", timing: "Wednesday"},
    brief_revision_ref: "SCV_two", expires_at: "2026-12-01T20:00:00Z", created_at: "2026-11-29T20:00:00Z"};
  const proposal = {proposal_ref: "SPF_one", posted_ref: "SPR_one", revision: 3, status: "SUBMITTED", request_status: "OPEN",
    current: {version_ref: "SPV_exact", number: 2, brief_revision_ref: "SCV_two", content: terms,
      expires_at: "2026-12-01T20:00:00Z", submitted_at: "2026-11-30T20:00:00Z", answers_current_brief: true, expired: false},
    provider: {provider_ref: "SVI_one", offering_ref: "SVC_one", name: "Studio Gombe", service_name: "Cleaning", category: "cleaning",
      rating: {average: null, count: 0}, reviews: [], branch_coverage_specified: true,
      customer_branches: [{branch_ref: "SBR_one", name: "Gombe reception", broad_area: "Gombe", revision: 5, coverage_revision: 2}]},
    clarifications: [], can_review_acceptance: true};
  const calls: string[] = []; let lost = true;
  await page.route("**/api/shida/**", async route => {
    const req = route.request(), path = new URL(req.url()).pathname.replace(/\/$/, "");
    if (path.endsWith("/employment/session")) return route.fulfill({json: {binding: "a".repeat(64), user: {display_name: "Customer"}}});
    const action = path.split("/service-requests/")[1];
      if (action === "postings") return route.fulfill({json: {requests: [], next_ref: null}});
    if (action === "briefs") return route.fulfill({json: {briefs: [], has_more: false}});
    if (action === "postings/SPR_one/proposals") return route.fulfill({json: {request, proposals: [proposal], next_ref: null}});
    if (action === "postings/SPR_one/accept") {
      calls.push(req.postData()!);
      if (lost) {lost = false; return route.abort("failed");}
      return route.fulfill({json: {status: "AWARDED", reservation_ref: "RSV_one"}});
    }
    if (action === "bookings/RSV_one") return route.fulfill({json: {reservation_ref: "RSV_one", revision: 1, status: "confirmed",
      role: "requester", service_name: "Cleaning visit", accepted_quote: terms}});
    return route.fulfill({status: 404, json: {detail: "service_brief_unavailable"}});
  });
  await page.goto(`${locale === "en" ? "" : `/${locale}`}/shida/service-requests?request=SPR_one`);
  await expect(page.getByRole("button", {name: t.accept, exact: true})).toHaveCount(0);
  await page.getByRole("button", {name: t.review, exact: true}).click();
  const review = page.getByRole("region", {name: t.review, exact: true});
  await expect(review.getByRole("button", {name: t.accept, exact: true})).toBeDisabled();
  await review.getByRole("combobox", {name: t.branch, exact: true}).selectOption("SBR_one");
  await review.getByRole("button", {name: t.accept, exact: true}).click();
  await expect(page.getByText(common.uncertain, {exact: true})).toBeVisible();
  await page.getByRole("button", {name: common.retry, exact: true}).click();
  expect(calls).toHaveLength(2); expect(calls[0]).toBe(calls[1]);
  expect(JSON.parse(calls[0])).toMatchObject({revision: 4, version_ref: "SPV_exact", selected_branch_ref: "SBR_one",
    selected_branch_revision: 5, selected_coverage_revision: 2});
  await expect(page.getByRole("heading", {name: "Cleaning visit", exact: true})).toBeVisible();
  await expect(page).toHaveURL(/booking=RSV_one/);
  await page.reload();
  await expect(page.getByRole("heading", {name: "Cleaning visit", exact: true})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
