import {test,expect} from "@playwright/test";
import {progressText} from "../../app/components/shida/wenze-order-timeline";
for(const locale of ["en","fr"] as const)test(`buyer tracking mobile ${locale}`,async({page})=>{
 await page.route("**/api/**",route=>{
  const path=new URL(route.request().url()).pathname;
  if(path.includes("/employment/session"))return route.fulfill({json:{binding:"a".repeat(64),user:{display_name:"Buyer"}}});
  if(path.includes("/wenze-buyer/orders"))return route.fulfill({json:{total:1,orders:[{reference:"SO_fixture",store_name:"Boutique du Fleuve",total:"15000",currency:"CDF",items:[{name:"Chemise blanche",quantity:1,variant:"M"}],timeline:{current:"preparing",steps:["processing","preparing","ready","collected"]},estimates:{preparation:"2 heures",delivery:null}}]}});
  return route.fulfill({json:{}});
 });
 await page.setViewportSize({width:390,height:844});
 await page.goto(`${locale==="fr"?"/fr":""}/shida/wenze/orders/`);
 await expect(page.getByRole("status")).toContainText(progressText(locale,"preparing"));
 await expect(page.locator('[aria-current="step"]')).toHaveText(progressText(locale,"preparing"));
 await expect(page.getByText("Chemise blanche M × 1")).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`docs/evidence/wenze-tracking/${locale}-buyer-mobile.png`,fullPage:true});
});
for(const locale of ["en","fr","ln","sw"] as const)test(`seller preparing mobile ${locale}`,async({page})=>{
 const order={reference:"SO_fixture",source:"fixed",shop_name:"Boutique du Fleuve",buyer_name:"Test buyer",status_label:"Order received",total:"15000",currency:"CDF",fulfillment_method:"pickup",payment_verified:false,created_at:"2026-10-20T10:00:00Z",updated_at:"2026-10-20T10:00:00Z",items:[{name:"Chemise blanche",quantity:1,unit_price:"15000"}],allowed_actions:["preparing","ready"],action_revision:"WOR_fixture",timeline:{current:"processing",steps:["processing","preparing","ready","collected"]}};
 await page.route("**/api/**",route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,"");
  if(path.endsWith("/employment/session"))return route.fulfill({json:{binding:"a".repeat(64),user:{display_name:"Seller"}}});
  const shop={public_ref:"WNZ_fixture",name:"Boutique du Fleuve",status:"active"};
  if(path.endsWith("/stores")||path.endsWith("/catalog-imports/options"))return route.fulfill({json:{stores:[shop],categories:[],currencies:["CDF","USD"]}});
  if(path.endsWith("/WNZ_fixture"))return route.fulfill({json:shop});
  if(path.endsWith("/products"))return route.fulfill({json:{products:[],total:0}});
  if(path.endsWith("/orders"))return route.fulfill({json:{orders:[order],total:1,counts:{all:1,action_required:1}}});
  if(path.endsWith("/SO_fixture"))return route.fulfill({json:order});
  return route.fulfill({json:{}});
 });
 await page.setViewportSize({width:390,height:844});
 await page.goto(`${locale==="en"?"":"/"+locale}/shida/seller/wenze/?view=orders&store=WNZ_fixture`);
 await page.getByRole("button",{name:/Chemise blanche/}).click();
 await expect(page.getByRole("button",{name:progressText(locale,"preparing"),exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`docs/evidence/wenze-tracking/${locale}-seller-mobile.png`,fullPage:true});
});
