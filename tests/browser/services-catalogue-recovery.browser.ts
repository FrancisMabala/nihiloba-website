import {test,expect} from "@playwright/test";
import {servicesProviderOffering} from "./fixtures/services-provider";
import {professionalCopy} from "../../app/lib/services-professional-copy";
import {providerCopy} from "../../app/lib/services-provider-copy";

for(const locale of ["en","fr","ln","sw"] as const)test(`Personal catalogue keeps drafts through package retries and stale saves ${locale}`,async({page})=>{
 const t=providerCopy[locale],prefix=locale==="en"?"":`/${locale}`;
 let row={...servicesProviderOffering,revision:1,social_link:"https://example.com/profile",packages:[] as {public_ref:string;name:string;duration_minutes:number;price:string;currency:string;description:string}[]};
 const packageWrites:unknown[]=[];let rejectDetails=true,linkCleared=false;
 await page.route("**/api/shida/**",async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.replace(/\/$/,"");
  if(path.endsWith("/employment/session"))return route.fulfill({json:{binding:"a".repeat(64),user:{display_name:"Provider"}}});
  if(path.endsWith("/capabilities"))return route.fulfill({json:{capabilities:["profile","packages"]}});
  if(path.endsWith("/reviews"))return route.fulfill({json:{reviews:[]}});
  if(path.endsWith("/services")&&req.method()==="GET")return route.fulfill({json:{profiles:[row]}});
  if(req.method()!=="GET"){
   const body=req.postDataJSON();
   if(path.endsWith("/packages")){
    packageWrites.push(body);
    if(packageWrites.length===1){expect(body.price).toBe("12.50");row={...row,revision:2,packages:[{...body,public_ref:"SPK_one"}]};return route.abort("failed");}
    expect(body).toEqual(packageWrites[0]);return route.fulfill({json:row});
   }
   if(path.endsWith("/details")&&rejectDetails){rejectDetails=false;row={...row,revision:3,description:"Saved elsewhere"};return route.fulfill({status:409,json:{detail:"changed"}});}
   if(path.endsWith("/professional-profile")){expect(body.social_link).toBe("");linkCleared=true;row={...row,revision:4,social_link:""};return route.fulfill({json:row});}
  }
  return route.fulfill({status:404,json:{detail:"unavailable"}});
 });
 await page.setViewportSize({width:390,height:900});
 await page.goto(`${prefix}/shida/seller/services?view=services&offering=SVC_one`);
 await expect(page.getByRole("link",{name:"SHIDA Services",exact:true})).toHaveAttribute("href",`${prefix}/shida/services`);
 const description=page.locator("#svc-field-description");
 await description.fill("My unsaved description");
 await page.locator(".svc-editor-steps button").nth(2).click();await page.getByRole("button",{name:t.packageNew,exact:true}).click();
 const packageForm=page.locator(".svc-packages form");
 await packageForm.locator("input").nth(0).fill("Visit");
 await packageForm.locator("input").nth(1).fill("30");
 await packageForm.locator('input[inputmode="decimal"]').fill("12,50");
 await packageForm.locator("button").first().click();
 await expect(page.getByText(t.uncertain,{exact:true})).toBeVisible();
 await expect(description).toBeDisabled();
 await page.getByRole("button",{name:t.retry,exact:true}).click();
 await expect(page.getByText(t.saved,{exact:true})).toBeVisible();
 await expect(description).toHaveValue("My unsaved description");
 await expect(description).toBeEnabled();
 expect(packageWrites).toHaveLength(2);
 await page.locator(".svc-editor-steps button").nth(1).click();await page.locator("#svc-details-save").click();
 await expect(description).toBeDisabled();
 await expect(description).toHaveValue("My unsaved description");
 page.once("dialog",dialog=>dialog.dismiss());await page.locator(".svc-refresh").click();
 await expect(description).toHaveValue("My unsaved description");
 page.once("dialog",dialog=>dialog.accept());await page.locator(".svc-refresh").click();
 await expect(description).toHaveValue("Saved elsewhere");await expect(description).toBeEnabled();
 await page.locator(".svc-editor-back").click();await page.getByRole("button",{name:professionalCopy[locale].edit,exact:true}).click();await page.locator(".svc-profile-form input[type=url]").fill("");await page.getByRole("button",{name:professionalCopy[locale].save,exact:true}).click();
 await expect.poll(()=>linkCleared).toBe(true);
 await page.getByRole("button",{name:professionalCopy[locale].edit,exact:true}).click();await expect(page.locator(".svc-profile-form input[type=url]")).toHaveValue("");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
