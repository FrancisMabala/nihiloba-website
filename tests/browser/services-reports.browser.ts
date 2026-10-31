import {test,expect} from "@playwright/test";
import {reportHelp} from "../../app/lib/service-report-period";

const show={en:"Show report",fr:"Afficher le rapport",ln:"Lakisa lapolo",sw:"Onyesha ripoti"};
for(const {locale,money} of [...(["en","fr","ln","sw"] as const).map(locale=>({locale,money:true})),{locale:"en" as const,money:false}])test(`inclusive report recovery and download ${locale} money=${money}`,async({page})=>{
 await page.setViewportSize({width:320,height:900});
 await page.clock.setFixedTime(new Date("2026-10-20T12:00:00Z"));
 let failed=true;
 const queries:string[]=[];
 const offering={public_ref:"SVC_one",provider_ref:"SVI_one",name:"Provider",service_name:"Repair service",category:"repair_maintenance",description:"Repairs",service_duration_minutes:60,commune:"Gombe",service_location_type:"public_place",home_service_available:"no",booking_mode:"flexible",availability:"Weekdays",publication_origin:"pilot",visible_to_customers:true,requests_enabled:true,is_active:"yes",revision:1,missing_fields:[],packages:[],rating:{average:null,count:0}};
 await page.route("**/api/shida/**",async route=>{
  const url=new URL(route.request().url()),path=url.pathname.replace(/\/$/,"");
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith("/employment/session"))return reply({binding:"a".repeat(64),user:{display_name:"Provider"}});
  if(path.endsWith("/services/capabilities"))return reply({capabilities:["profile","operational_reports",...(money?["financial_reports"]:[])],access_policy:"pilot"});
  if(path.endsWith("/services"))return reply({profiles:[offering]});
  if(path.endsWith("/reviews"))return reply({reviews:[]});
  if(path.includes("/reports/")){
   queries.push(url.search);
   if(failed)return reply({},503);
   if(path.endsWith(".csv"))return route.fulfill({body:"start_date,end_date_exclusive\n2026-10-20,2026-10-21",contentType:"text/csv"});
   if(path.endsWith("/operational"))return reply({as_of:"2026-10-20T12:00:00Z",published_offerings:1,requests_created:3,bookings_created:2,booking_statuses:{confirmed:2},offerings:[],unavailable:["quote_conversion"]});
   const bucket={billed:"100.00",declared_received:"70.00",outstanding:"30.00",recorded_expenses:"20.00",declared_surplus:"50.00"};
   return reply({as_of:"2026-10-20T12:00:00Z",currencies:{USD:bucket,CDF:bucket},expense_categories:{USD:{},CDF:{}}});
  }
  return reply({},404);
 });
 await page.goto(`${locale==="en"?"":`/${locale}`}/shida/seller/services?view=reports`);
 const panel=page.locator(".services-reports"),help=reportHelp[locale];
 await panel.getByRole("button",{name:help.week,exact:true}).click();
 await expect(panel.locator('input[type="date"]').first()).toHaveValue("2026-10-19");
 await panel.getByRole("button",{name:help.month,exact:true}).click();
 await expect(panel.locator('input[type="date"]').first()).toHaveValue("2026-10-01");
 await panel.locator('input[type="date"]').first().fill("2026-10-20");
 await panel.locator('input[type="date"]').last().fill("2026-10-20");
 await panel.getByRole("button",{name:show[locale],exact:true}).click();
 await expect(panel.getByRole("alert")).toBeVisible();
 failed=false;
 await panel.getByRole("button",{name:show[locale],exact:true}).click();
 await expect(panel.locator("time").first()).toContainText("Kinshasa");
 await expect(panel.getByText(help.counts)).not.toBeVisible();
 await panel.locator("summary").first().click();
 await expect(panel.getByText(help.counts)).toBeVisible();
 const download=page.waitForEvent("download");
 await panel.getByRole("button",{name:/CSV/}).click();
 await download;
 for(const query of queries){
  expect(new URLSearchParams(query).get("start_date")).toBe("2026-10-20");
  expect(new URLSearchParams(query).get("end_date")).toBe("2026-10-21");
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(panel.getByRole("tab")).toHaveCount(money?2:1);
 if(money){await panel.getByRole("tab").nth(1).click();await expect(panel.locator(".svc-currency-card")).toHaveCount(0);await expect(panel.getByText("50 CDF",{exact:true})).toBeVisible();}
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:`test-results/reports-${locale}.png`,fullPage:true});
});
