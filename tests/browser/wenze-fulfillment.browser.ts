import {test,expect} from "@playwright/test";
import {wenzeCopy,type WenzeLocale} from "../../app/lib/wenze-copy";
for(const locale of ["en","fr","ln","sw"] as WenzeLocale[])test(`fulfillment estimates mobile ${locale}`,async({page})=>{
 const t=wenzeCopy[locale];
 let shop={public_ref:"WNZ_fixture",name:"Boutique du Fleuve",revision:1,category:"fashion_clothing",status:"active",visible:"true",catalog_ready:true,fulfillment_mode:"delivery",delivery_fee_type:"free",delivery_areas:["Gombe"],preparation_estimate:"",delivery_estimate:""};
 let saved=false;
 await page.route("**/api/**",route=>{
  const req=route.request(),path=new URL(req.url()).pathname.replace(/\/$/,"");
  const reply=(json:unknown)=>route.fulfill({json});
  if(path.endsWith("/employment/session"))return reply({binding:"a".repeat(64),user:{display_name:"Test seller"}});
  if(path.endsWith("/stores"))return reply({stores:[shop],categories:[],currencies:["CDF","USD"]});
  if(path.endsWith("/WNZ_fixture"))return reply(shop);
  if(path.endsWith("/products"))return reply({products:[],total:0});
  if(path.endsWith("/fulfillment")){
   const payload=req.postDataJSON();
   expect(payload.expected_revision).toBe(1);
   expect(payload.fields.preparation_estimate).toBe("2 hours");
   expect(payload.fields.delivery_estimate).toBe("1–2 days");
   shop={...shop,...payload.fields,revision:2};saved=true;return reply(shop);
  }
  return reply({});
 });
 await page.setViewportSize({width:390,height:844});
 await page.goto(`${locale==="en"?"":"/"+locale}/shida/seller/wenze/?view=catalog`);
 await page.locator(".wz-shop-tabs").getByRole("button",{name:t.fulfillment,exact:true}).click();
 await page.getByLabel(t.preparation_estimate,{exact:true}).fill("2 hours");
 await page.getByLabel(t.delivery_estimate,{exact:true}).fill("1–2 days");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`docs/evidence/wenze-fulfillment/${locale}-mobile.png`,fullPage:true});
 await page.getByRole("button",{name:t.save,exact:true}).click();
 await expect.poll(()=>saved).toBe(true);
});
