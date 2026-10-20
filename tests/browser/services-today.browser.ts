
import {test,expect} from "@playwright/test";

const todayLabel={en:"Today",fr:"Aujourd’hui",ln:"Lelo",sw:"Leo"} as const;
const refreshLabel={en:"Refresh",fr:"Actualiser",ln:"Zongisa",sw:"Sasisha"} as const;
for(const locale of ["en","fr","ln","sw"] as const)test(`Today exact task and offline recovery ${locale}`,async({page})=>{

 await page.setViewportSize({width:320,height:850});
 await page.addInitScript(language=>localStorage.setItem("shida-language",language),locale);
 let failed=true,denied=false;
 const offering={public_ref:"SVC_one",provider_ref:"SVI_one",name:"Provider",service_name:"Repair service",category:"repair_maintenance",description:"Repairs",service_duration_minutes:60,commune:"Gombe",service_location_type:"public_place",home_service_available:"no",booking_mode:"flexible",availability:"Weekdays",publication_origin:"pilot",requests_enabled:true,is_active:"yes",revision:1,missing_fields:[],packages:[],rating:{average:null,count:0}};
 const parent={request_ref:"SWR_older",offering:"Repair request",requester:"Customer",description:"Please repair the sink.",status:"SUBMITTED",revision:1,actions:["review","decline"],can_create_quote:true};
 const empty={items:[],has_more:false};
 await page.route("**/api/shida/**",async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path.endsWith("/employment/session/"))return route.fulfill({json:{binding:"a".repeat(64),user:{display_name:"Provider"}}});
  if(path.endsWith("/services/capabilities"))return route.fulfill({json:{capabilities:["profile","reservations","messages"],access_policy:"pilot",purchase_required:false}});
  if(path.endsWith("/services/today")){
   if(denied)return route.fulfill({status:403,json:{detail:"unavailable"}});
   if(failed)return route.fulfill({status:503,json:{detail:"unavailable"}});
   return route.fulfill({json:{date:"2026-10-20",timezone:"Africa/Kinshasa",requests:{items:[parent],has_more:true},pending:empty,upcoming:empty,messages:empty}});
  }
  if(path.endsWith("/services"))return route.fulfill({json:{profiles:[offering]}});
  if(path.endsWith("/reviews"))return route.fulfill({json:{reviews:[]}});
  if(path.endsWith("/requests/SWR_older"))return route.fulfill({json:parent});
  if(path.endsWith("/templates"))return route.fulfill({json:{templates:[]}});
  if(path.endsWith("/quotes"))return route.fulfill({json:{quotes:[],has_more:false}});
  if(path.endsWith("/transactions/requests"))return route.fulfill({json:{requests:[],has_more:false}});
  if(path.includes("/transactions/"))return route.fulfill({json:{requests:[],reservations:[],threads:[],has_more:false}});
  return route.fulfill({status:404,json:{detail:"unavailable"}});
 });
 await page.goto(`${locale==="en"?"":`/${locale}`}/shida/seller/services`);
 const today=page.locator(".svc-today");
 await expect(today.getByRole("alert")).toBeVisible();
 failed=false;
 await today.getByRole("button",{name:refreshLabel[locale],exact:true}).click();
 await expect(today.getByRole("button",{name:/Repair request/})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/today-${locale}.png`,fullPage:true});
 await today.getByRole("button",{name:/Repair request/}).click();
 await expect(page.locator(".services-transactions").getByRole("heading",{name:"Repair request",exact:true})).toBeVisible();
 await page.getByRole("navigation").getByRole("button",{name:todayLabel[locale],exact:true}).click();
 denied=true;
 await today.getByRole("button",{name:refreshLabel[locale],exact:true}).click();
 await expect(today).toHaveCount(0);
 await expect(page.getByRole("alert").first()).toBeVisible();
});
