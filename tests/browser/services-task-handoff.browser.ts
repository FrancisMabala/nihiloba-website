import {test,expect} from "@playwright/test";
for(const locale of ["en","fr","ln","sw"] as const)test(`Exact saved quotation handoff ${locale}`,async({page})=>{
 await page.setViewportSize({width:390,height:900});
 const writes:string[]=[];
 await page.route("**/api/shida/**",async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.replace(/\/$/,"");
  if(req.method()!=="GET")writes.push(path);
  if(path.endsWith("/employment/session"))return route.fulfill({json:{binding:"a".repeat(64),user:{display_name:"Provider"}}});
  if(path.endsWith("/services/capabilities"))return route.fulfill({json:{capabilities:["profile","reservations","messages"],access_policy:"pilot"}});
  if(path.endsWith("/services"))return route.fulfill({json:{profiles:[{public_ref:"SVC_one",provider_ref:"SVI_one",name:"Provider",service_name:"Repairs",category:"repair_maintenance",description:"Repairs",service_duration_minutes:60,commune:"Gombe",service_location_type:"public_place",home_service_available:"no",booking_mode:"flexible",availability:"Weekdays",publication_origin:"pilot",visible_to_customers:true,requests_enabled:true,is_active:"yes",revision:1,missing_fields:[],packages:[],rating:{average:null,count:0}}]}});
  if(path.endsWith("/reviews"))return route.fulfill({json:{reviews:[]}});
  if(path.endsWith("/transactions/requests"))return route.fulfill({json:{requests:[],has_more:false}});
  if(path.endsWith("/requests/SWR_exact"))return route.fulfill({json:{request_ref:"SWR_exact",offering:"Exact saved repair",requester:"Customer",description:"Repair the sink",status:"QUOTED",revision:2,actions:[],can_create_quote:false}});
  if(path.endsWith("/requests/SWR_exact/quotes"))return route.fulfill({json:{quotes:[],has_more:false}});
  if(path.endsWith("/quotes/SQT_exact"))return route.fulfill({json:{request_ref:"SWR_exact",quote_ref:"SQT_exact",revision:1,status:"SENT",amount:"123.45",currency:"USD",pricing_description:"Saved quotation scope",terms:"Materials included",actions:[]}});
  return route.fulfill({status:404,json:{detail:"unavailable"}});
 });
 await page.goto(`${locale==="en"?"":`/${locale}`}/shida/seller/services?view=work&request=SWR_exact&quote=SQT_exact`);
 await expect(page.locator(".services-transactions").getByRole("heading",{name:"Exact saved repair",exact:true})).toBeVisible();
 await expect(page.locator(".services-transactions").getByText("Saved quotation scope",{exact:true})).toBeVisible();
 for(const language of ["en","fr","ln","sw"]){
  const destination=`${language==="en"?"":`/${language}`}/shida/seller/services/?view=work&request=SWR_exact&quote=SQT_exact`;
  await expect(page.locator(`.rst-dropdown a[hreflang="${language}"]`)).toHaveAttribute("href",destination);
 }
 expect(writes).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
