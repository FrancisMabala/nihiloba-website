import {test, expect} from "@playwright/test";
import {requestWords} from "../../app/lib/services-request-copy";
import {comparisonWords} from "../../app/lib/services-comparison-copy";
test("Closed requests remain reachable with customer-only original documents", async ({page}) => {
  const t=requestWords("en"), c=comparisonWords("en");
  const summary={category:"cleaning",language:"en",description:"Clean two rooms",commune:"Gombe",timing:"Wednesday"};
  const posted={posted_ref:"SPR_one",brief_ref:"SCB_one",revision:2,status:"AWARDED",summary,
    brief_revision_ref:"SCV_one",expires_at:"2026-12-01T20:00:00Z",created_at:"2026-11-29T20:00:00Z",
    booking:{reservation_ref:"RSV_one",request_ref:"SWR_one",quote_ref:"SQT_one"}};
  await page.route("**/api/shida/**",async route=>{
    const path=new URL(route.request().url()).pathname.replace(/\/$/,""),action=path.split("/service-requests/")[1];
    if(path.endsWith("/employment/session"))return route.fulfill({json:{binding:"a".repeat(64),user:{display_name:"Customer"}}});
    if(action==="briefs")return route.fulfill({json:{briefs:[],has_more:false}});
    if(action==="postings")return route.fulfill({json:{requests:[posted],next_ref:null}});
    if(action==="postings/SPR_one/proposals")return route.fulfill({json:{request:posted,proposals:[],next_ref:null}});
    if(action==="briefs/SCB_one")return route.fulfill({json:{brief_ref:"SCB_one",revision:4,status:"CLOSED",content:summary,summary,summary_digest:"a".repeat(64),
      edited_at:posted.created_at,expires_at:posted.expires_at,posted_ref:"SPR_one"}});
    if(action==="briefs/SCB_one/documents")return route.fulfill({json:{documents:[{document_ref:"SCD_one",revision:2,status:"READY",has_original:true}]}});
    return route.fulfill({status:404,json:{detail:"unavailable"}});
  });
  await page.goto("/shida/service-requests");
  await page.getByRole("button",{name:t.follow,exact:true}).click();
  await expect(page.getByRole("button",{name:c.booking,exact:true})).toBeVisible();
  await page.getByRole("button",{name:t.requests,exact:true}).click();
  await page.getByRole("button",{name:t.original,exact:true}).click();
  await expect(page.getByRole("button",{name:t.download,exact:true})).toBeVisible();
  await expect(page.getByText(t.retention,{exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:t.publish,exact:true})).toHaveCount(0);
  await page.getByRole("button",{name:t.follow,exact:true}).click();
  await expect(page.getByRole("button",{name:c.booking,exact:true})).toBeVisible();
});
