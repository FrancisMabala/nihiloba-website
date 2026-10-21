import {test,expect} from "@playwright/test";
import {marketplaceEntryCopy} from "../../app/lib/marketplace-entry-copy";
import {serviceCategoryExperience} from "../../app/lib/services-category-experience";
for(const [locale,width] of [["en",1440],["fr",390],["ln",820],["sw",320]] as const)test(`Personal first-service examples and deliberate creation ${locale}`,async({page})=>{
 const t=marketplaceEntryCopy[locale].services,posts:string[]=[];
 await page.setViewportSize({width,height:900});
 await page.route("**/api/shida/**",route=>{
  const path=new URL(route.request().url()).pathname;
  if(path.endsWith("/employment/session/"))return route.fulfill({json:{binding:"a".repeat(64),user:{display_name:"Sample provider"}}});
  if(path.endsWith("/services/capabilities"))return route.fulfill({json:{capabilities:["profile"]}});
  if(path.endsWith("/personal/services")){if(route.request().method()==="POST"){posts.push(route.request().postData()!);return route.fulfill({status:503,json:{detail:"unavailable"}});}return route.fulfill({json:{profiles:[]}});}
  return route.fulfill({status:404,json:{detail:"unavailable"}});
 });
 await page.goto(`${locale==="en"?"":`/${locale}`}/shida/seller/services`);
 await expect(page.getByRole("heading",{name:t.title,exact:true})).toBeVisible();expect(posts).toHaveLength(0);
 await expect(page.locator("#svc-new-provider")).toHaveCount(0);
 await page.getByRole("button",{name:t.create,exact:true}).click();
 await expect(page.locator("#svc-new-provider")).toBeFocused();
 await expect(page.getByText(t.providerHint,{exact:true})).toBeVisible();
 await expect(page.getByText(t.serviceHint,{exact:true})).toBeVisible();
 await expect(page.getByText(t.privateNote,{exact:true})).toBeVisible();
 const categories=["beauty_wellness","home_housing","repair_maintenance","education_training","photo_video","professional_services","cleaning"];
 await expect(page.locator("#svc-new-category option")).toHaveCount(8);
 for(const category of categories){
  await page.locator("#svc-new-category").selectOption(category);
  const example=serviceCategoryExperience(category,locale)!;
  await expect(page.locator("#svc-new-name")).toHaveAttribute("placeholder",example.service);
  await expect(page.getByText(example.description,{exact:true})).toBeVisible();
 }
 expect(posts).toHaveLength(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/services-setup-category-${locale}.png`,fullPage:true});
 await page.locator("#svc-new-provider").fill("Sample provider");
 await page.locator("#svc-new-name").fill("Home cleaning");
 await page.getByRole("button",{name:t.submit,exact:true}).click();
 await expect(page.locator("#svc-new-name")).toBeDisabled();
 await expect.poll(()=>posts.length).toBe(1);
 expect(JSON.parse(posts[0])).toEqual({name:"Sample provider",service_name:"Home cleaning",category:"cleaning",description:""});
});
