import {test,expect} from "@playwright/test";
for(const locale of ["en","fr"])test(`mobile catalog filters and continuation ${locale}`,async({page})=>{
  await page.route("**/api/**",r=>r.fulfill({status:401,json:{}}));
  await page.setViewportSize({width:390,height:844});
  const path=(locale==="fr"?"/fr":"")+"/shida/wenze/catalog";
  await page.goto(path+"?currency=USD&min_price=10&variant_type=size&variant_option=M");
  await expect(page.getByRole("heading",{name:"Cotton shirt",exact:true})).toBeVisible();
  await expect(page.locator(".wzp-product-facts")).toContainText(locale==="fr"?"D’occasion":"Used");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`docs/evidence/wenze-discovery/${locale}-mobile.png`,fullPage:true});
  await page.getByRole("link",{name:locale==="fr"?"Produits suivants":"Next products"}).click();
  await expect(page.getByRole("heading",{name:"Second item",exact:true})).toBeVisible();
  const url=new URL(page.url());expect(url.searchParams.get("currency")).toBe("USD");
  expect(url.searchParams.get("variant_option")).toBe("M");
  await page.getByRole("button",{name:locale==="fr"?"Rechercher":"Search",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Cotton shirt",exact:true})).toBeVisible();
  expect(new URL(page.url()).searchParams.has("cursor")).toBe(false);
});
