import {test, expect} from "@playwright/test";
import {comparisonWords} from "../../app/lib/services-comparison-copy";
import {requestWords} from "../../app/lib/services-request-copy";
import {revisionWords} from "../../app/lib/services-revision-copy";
import {serviceCategoryExperience} from "../../app/lib/services-category-experience";
for (const locale of ["en", "fr", "ln", "sw"] as const) test(`Published request changes require reviewed summary ${locale}`, async ({page}) => {
  await page.setViewportSize({width: 390, height: 900});
  const t=requestWords(locale), r=revisionWords(locale), c=comparisonWords(locale);
  const content={category:"cleaning",language:locale,description:"Clean one room",commune:"Gombe",timing:"Tuesday"};
  let revised=false, lost=true; const writes:string[]=[];
  const request={posted_ref:"SPR_one",brief_ref:"SCB_one",revision:1,status:"OPEN",summary:content,brief_revision_ref:"SCV_one",expires_at:"2026-12-01T20:00:00Z",created_at:"2026-11-29T20:00:00Z"};
  const proposal={proposal_ref:"SPF_one",posted_ref:"SPR_one",revision:2,status:"SUBMITTED",request_status:"OPEN",can_review_acceptance:true,
    current:{version_ref:"SPV_one",number:1,brief_revision_ref:"SCV_one",content:{amount:"100",currency:"CDF",duration_minutes:60},answers_current_brief:true},
    provider:{provider_ref:"SVI_one",offering_ref:"SVC_one",name:"Provider",service_name:"Cleaning",rating:{average:null,count:0},reviews:[],customer_branches:[],branch_coverage_specified:false}};
  await page.route("**/api/shida/**",async route=>{
    const req=route.request(),path=new URL(req.url()).pathname.replace(/\/$/,""),action=path.split("/service-requests/")[1];
    if(path.endsWith("/employment/session"))return route.fulfill({json:{binding:"a".repeat(64),user:{display_name:"Customer"}}});
    if(action==="briefs")return route.fulfill({json:{briefs:[],has_more:false}});
    if(action==="postings")return route.fulfill({json:{requests:[],next_ref:null}});
    if(action==="postings/SPR_one/proposals")return route.fulfill({json:{request:{...request,revision:revised?2:1,summary:revised?{...content,description:"Clean two rooms"}:content},
      proposals:[{...proposal,can_review_acceptance:!revised,current:{...proposal.current,answers_current_brief:!revised}}],next_ref:null}});
    if(action==="briefs/SCB_one")return route.fulfill({json:{brief_ref:"SCB_one",posted_ref:"SPR_one",status:"PUBLISHED",content}});
    if(action==="postings/SPR_one/revision-preview"){
      expect(writes).toHaveLength(0);
      const payload=req.postDataJSON();
      expect(payload.revision).toBe(1);
      expect(payload.content.description).toContain("+243");
      return route.fulfill({json:{posted_ref:"SPR_one",revision:1,content:payload.content,summary:{...payload.content,description:"Clean two rooms"},summary_digest:"b".repeat(64)}});
    }
    if(action==="postings/SPR_one/revise"){
      writes.push(req.postData()!);revised=true;
      if(lost){lost=false;return route.abort("failed");}
      return route.fulfill({json:{...request,revision:2}});
    }
    return route.fulfill({status:404,json:{detail:"unavailable"}});
  });
  await page.goto(`${locale==="en"?"":`/${locale}`}/shida/service-requests?request=SPR_one`);
  await page.getByRole("button",{name:r.edit,exact:true}).click();
  const editor=page.getByRole("region",{name:r.title,exact:true});
  await editor.getByRole("textbox",{name:serviceCategoryExperience("cleaning",locale)!.request,exact:true}).fill("Clean two rooms +243 812 345 678");
  await editor.getByRole("button",{name:t.review,exact:true}).click();
  await expect(editor.getByText("Clean two rooms",{exact:true})).toBeVisible();
  await expect(editor.getByText(r.warning,{exact:true})).toBeVisible();
  await expect(editor.getByText(/243 812/)).toHaveCount(0);
  expect(writes).toHaveLength(0);
  await editor.getByRole("button",{name:r.confirm,exact:true}).click();
  await expect(editor.getByText(t.uncertain,{exact:true})).toBeVisible();
  await editor.getByRole("button",{name:t.retry,exact:true}).click();
  await expect(page.getByText(c.olderBrief,{exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:c.review,exact:true})).toHaveCount(0);
  expect(writes).toHaveLength(2);expect(writes[0]).toBe(writes[1]);
  expect(JSON.parse(writes[0])).toMatchObject({revision:1,summary_digest:"b".repeat(64)});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
