import {test,expect} from "@playwright/test";
import {paymentText} from "../../app/lib/wenze-payment-copy";
import {wenzeDesignText} from "../../app/lib/wenze-design-copy";
for(const locale of ["en","fr","ln","sw"])test(`payment preferences mobile ${locale}`,async({page})=>{
 const t=(k:string)=>paymentText(locale,k);
 const shop={public_ref:"WNZ_fixture",name:"Boutique du Fleuve",revision:1,category:"fashion_clothing",status:"active",visible:"true",catalog_ready:true};
 let selected:string[]=[];
 await page.route("**/api/**",route=>{
  const req=route.request(),path=new URL(req.url()).pathname.replace(/\/$/,"");
  const reply=(json:unknown)=>route.fulfill({json});
  if(path.endsWith("/employment/session"))return reply({binding:"a".repeat(64),user:{display_name:"Test seller"}});
  if(path.endsWith("/stores"))return reply({stores:[shop],categories:[],currencies:["CDF","USD"]});
  if(path.endsWith("/WNZ_fixture"))return reply(shop);
  if(path.endsWith("/products"))return reply({products:[],total:0});
  if(path.endsWith("/plan"))return reply({plan:"pro",source:"personal_pilot",active_products:0,active_product_limit:1000});
  if(path.endsWith("/share"))return reply({url:"https://nihiloba.com/shida/wenze/WNZ_fixture/",visible:true});
  if(path.endsWith("/payment-preferences")){
   if(req.method()==="PUT"){expect(req.postDataJSON().expected_revision).toBe(1);selected=req.postDataJSON().methods;}
   return reply({revision:selected.length?2:1,selected,available:["cash","mobile_money","other"],coming_soon:["card","paypal"],online_collection_enabled:false});
  }
  return reply({});
 });
 await page.setViewportSize({width:390,height:844});
 await page.goto(`${locale==="en"?"":"/"+locale}/shida/seller/wenze/?view=catalog`);
 await page.locator(".wz-shop-tabs").getByRole("button",{name:wenzeDesignText(locale as "en","settings"),exact:true}).click();
 const panel=page.getByRole("region",{name:t("title")});
 await expect(panel.getByLabel(`${t("card")} · ${t("soon")}`)).toBeDisabled();
 await panel.getByLabel(t("cash"),{exact:true}).check();
 await panel.getByRole("button",{name:t("save")}).click();
 await expect(panel.getByText(t("saved"),{exact:true})).toBeVisible();
 expect(selected).toEqual(["cash"]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`docs/evidence/wenze-payment/${locale}-mobile.png`,fullPage:true});
});
