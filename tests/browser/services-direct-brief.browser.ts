import {test,expect} from "@playwright/test";
import {requestWords} from "../../app/lib/services-request-copy";
import {comparisonWords} from "../../app/lib/services-comparison-copy";
import {serviceCategoryExperience} from "../../app/lib/services-category-experience";
import type {CustomerBrief} from "../../app/lib/services-request-browser";

for(const locale of ["en","fr","ln","sw"] as const)test(`Public direct quotation preserves provider and branch ${locale}`,async({page})=>{
  await page.setViewportSize({width:390,height:900});
  const t=requestWords(locale),c=comparisonWords(locale),prefix=locale==="en"?"":`/${locale}`;
  let brief:CustomerBrief|null=null; const submissions:unknown[]=[];
  await page.route("**/api/shida/**",async route=>{
    const req=route.request(),path=new URL(req.url()).pathname.replace(/\/$/,"");
    if(path.endsWith("/employment/session"))return route.fulfill({json:{binding:"a".repeat(64),user:{display_name:"Customer"}}});
    const action=path.split("/service-requests/")[1];
    if(action==="briefs"&&req.method()==="GET")return route.fulfill({json:{briefs:[],has_more:false}});
    if(action==="postings")return route.fulfill({json:{requests:[],next_ref:null}});
    if(action==="destinations/SVC_fixture")return route.fulfill({json:{offering_ref:"SVC_fixture",category:"repair_maintenance",name:"Home repair",
      branch_coverage_specified:true,customer_branches:[{branch_ref:"SBR_one",name:"Gombe reception",broad_area:"Gombe",revision:3,coverage_revision:6}]}});
    if(action==="briefs"&&req.method()==="POST"){
      const payload=req.postDataJSON();
      expect(payload.content.direct_offering_ref).toBe("SVC_fixture");
      expect(payload.content.category).toBe("repair_maintenance");
      brief={brief_ref:"SCB_one",revision:1,status:"DRAFT",content:payload.content,summary:payload.content,
        summary_digest:"a".repeat(64),edited_at:"2026-10-20T12:00:00Z",expires_at:"2026-11-19T12:00:00Z"};
      return route.fulfill({json:brief});
    }
    if(action==="briefs/SCB_one/review"){brief={...brief!,revision:2,status:"REVIEWED"};return route.fulfill({json:brief});}
    if(action==="briefs/SCB_one/send"){submissions.push(req.postDataJSON());return route.fulfill({json:{request_ref:"SWR_one"}});}
    if(action==="requests/SWR_one")return route.fulfill({json:{request_ref:"SWR_one",status:"SUBMITTED",role:"requester",revision:1,
      offering:"Home repair",description:"Repair the sink",reviewed_brief:{summary:brief!.summary}}});
    return route.fulfill({status:404,json:{detail:"unavailable"}});
  });
  await page.goto(`${prefix}/shida/services/home-repair`);
  await page.getByRole("link",{name:t.askQuote,exact:true}).click();
  await expect(page).toHaveURL(/service=SVC_fixture/);
  const editor=page.getByRole("region",{name:t.title,exact:true});
  await expect(editor.getByRole("combobox",{name:t.category,exact:true})).toHaveValue("repair_maintenance");
  await expect(editor.getByRole("combobox",{name:t.category,exact:true})).toBeDisabled();
  await editor.getByRole("textbox",{name:serviceCategoryExperience("repair_maintenance",locale)!.request,exact:true}).fill("Repair the sink");
  await editor.getByRole("textbox",{name:t.commune,exact:true}).fill("Gombe");
  await editor.getByRole("textbox",{name:t.timing,exact:true}).fill("Tuesday morning");
  await editor.getByRole("button",{name:t.save,exact:true}).click();
  await expect(editor.getByText(t.saved,{exact:true})).toBeVisible();
  await editor.getByRole("button",{name:t.review,exact:true}).click();
  await editor.getByRole("button",{name:t.confirm,exact:true}).click();
  await expect(editor.getByRole("button",{name:t.send,exact:true})).toBeDisabled();
  await editor.getByRole("combobox",{name:c.branch,exact:true}).selectOption("SBR_one");
  await editor.getByRole("button",{name:t.send,exact:true}).click();
  await expect(page).toHaveURL(/request=SWR_one/);
  expect(submissions).toHaveLength(1);
  expect(submissions[0]).toMatchObject({revision:2,selected_branch_ref:"SBR_one",selected_branch_revision:3,selected_coverage_revision:6});
  await page.getByText(t.summary,{exact:true}).click();
  await expect(page.getByText("Tuesday morning",{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
