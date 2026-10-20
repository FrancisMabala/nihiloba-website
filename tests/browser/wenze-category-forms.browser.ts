import {test,expect} from "@playwright/test";
import {wenzeCopy} from "../../app/lib/wenze-copy";
import {wenzeDesignText} from "../../app/lib/wenze-design-copy";
for(const locale of ["en","fr","ln","sw"] as const)test(`category guidance preserves draft ${locale}`,async({page})=>{
 const t=(key:string)=>wenzeCopy[locale][key as keyof typeof wenzeCopy.en];
 const shop={public_ref:"WNZ_fixture",name:"Boutique",category:"fashion_clothing",revision:1,status:"active",visible:"true",catalog_ready:true};
 const categories=[{code:"fashion_clothing",labels:{en:"Clothing",fr:"Vêtements",ln:"Bilamba",sw:"Nguo"}},{code:"shoes_accessories",labels:{en:"Shoes",fr:"Chaussures",ln:"Sapato",sw:"Viatu"}},{code:"phones_electronics",labels:{en:"Electronics",fr:"Électronique",ln:"Électronique",sw:"Elektroniki"}},{code:"other",labels:{en:"Other",fr:"Autre",ln:"Mosusu",sw:"Nyingine"}}];
 await page.route("**/api/**",route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,"");
  if(path.endsWith("/employment/session"))return route.fulfill({json:{binding:"a".repeat(64),user:{display_name:"Seller"}}});
  if(path.endsWith("/stores"))return route.fulfill({json:{stores:[shop],categories,currencies:["CDF","USD"]}});
  if(path.endsWith("/WNZ_fixture"))return route.fulfill({json:shop});
  if(path.endsWith("/products"))return route.fulfill({json:{products:[],total:0}});
  if(path.endsWith("/drafts"))return route.fulfill({json:{draft_ref:"WFW_fixture",revision:1}});
  return route.fulfill({json:{}});
 });
 await page.setViewportSize({width:390,height:844});
 await page.goto(`${locale==="en"?"":"/"+locale}/shida/seller/wenze/?view=catalog&store=WNZ_fixture`);
 await page.getByRole("button",{name:wenzeDesignText(locale,"addProduct"),exact:true}).click();
 await page.getByRole("button",{name:wenzeDesignText(locale,"moreDetails"),exact:true}).click();
 const editor=page.locator(".wz-editor");
 await editor.getByRole("textbox",{name:t("description"),exact:true}).fill("Original description — cotton, blue");
 await editor.getByRole("combobox",{name:t("variant_type"),exact:true}).selectOption("size");
 await editor.getByRole("button",{name:t("add"),exact:true}).click();
 await editor.getByRole("textbox",{name:t("label"),exact:true}).fill("M");
 await editor.locator('fieldset input[type=number]').fill("7");
 for(const category of ["phones_electronics","shoes_accessories","other","fashion_clothing"]){
  await editor.getByRole("combobox",{name:t("category"),exact:true}).selectOption(category);
  await expect(editor.getByRole("textbox",{name:t("description"),exact:true})).toHaveValue("Original description — cotton, blue");
  await expect(editor.getByRole("combobox",{name:t("variant_type"),exact:true})).toHaveValue("size");
  await expect(editor.getByRole("textbox",{name:t("label"),exact:true})).toHaveValue("M");
  await expect(editor.locator('fieldset input[type=number]')).toHaveValue("7");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await editor.getByRole("heading").click();
 await page.screenshot({path:`docs/evidence/wenze-categories/${locale}-mobile.png`,fullPage:true});
});
