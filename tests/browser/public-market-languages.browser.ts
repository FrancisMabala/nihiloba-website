import {test,expect} from "@playwright/test";
import {marketName,type PublicMarket} from "../../app/lib/public-markets";
import {registrationLanguages} from "../../app/lib/registration/profile-copy";
import {storefrontCopy} from "../../app/lib/professional-storefront";
import {restaurantDiscoveryFinalCopy} from "../../app/lib/restaurant-discovery-final-copy";
const markets:PublicMarket[]=["wenze","services","restaurants","emplois","appartements","hotels","transport"];
for(const width of [390,1440])for(const {code:locale,name} of registrationLanguages)test(`${locale} public journey at ${width}px`,async({page},info)=>{
 await page.setViewportSize({width,height:900});
 await page.route("**/api/shida/**",r=>r.fulfill({status:401,json:{}}));
 await page.goto("/fr/shida/wenze/?view=shops&city=Kinshasa");
 const trigger=page.locator(".market-header .market-language");
 await trigger.click();
 const menu=page.locator(".market-header .market-menu button");
 await expect(menu).toHaveText(["Français","English","Lingala","Kiswahili"]);
 await menu.getByText(name,{exact:true}).click();
 await expect(trigger).toHaveText(locale.toUpperCase());
 await expect(page.locator('input[name="city"]')).toHaveValue("Kinshasa");
 expect(new URL(page.url()).searchParams.get("view")).toBe("shops");
 const prefix=locale==="en"?"":"/"+locale;
 for(const market of markets){
   await page.locator(".market-primary-nav").getByRole("link",{name:marketName(locale,market),exact:true}).click();
   await expect(page.locator("main h1")).toHaveText(marketName(locale,market));
   await expect(trigger).toHaveText(locale.toUpperCase());
   await expect(page.locator(".market-footer")).toHaveAttribute("lang",locale);
   await expect(page.locator(".marketplace-permanent-slogan")).toHaveAttribute("lang","ln");
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),market).toBe(true);
   if(market==="services"){
     await page.locator(".svc-professional-card h2 a").first().click();
     await expect(page).toHaveURL(new RegExp(prefix+"/shida/services/providers/"));
     await expect(page.locator(".professional-return")).toContainText(storefrontCopy[locale].back);
   }
   if(market==="restaurants"){
     await page.reload();await expect(trigger).toHaveText(locale.toUpperCase());
     await expect(page.locator(".market-welcome")).toContainText(restaurantDiscoveryFinalCopy[locale].malewa);
   }
   if((width===390&&locale==="sw"&&market==="restaurants")||(width===1440&&locale==="fr"&&market==="wenze")){
     if(market==="wenze")await trigger.click();
     await page.screenshot({path:info.outputPath(market+".png"),fullPage:true});
     if(market==="wenze")await trigger.click();
   }
 }
 await page.goto("/shida/wenze/");await expect(trigger).toHaveText(locale.toUpperCase());
});
test("failed search retries in place, and clear returns to the empty catalogue",async({page})=>{
 await page.goto("/sw/shida/restaurants/?query=retry");
 await expect(page.locator(".market-welcome")).toHaveCount(0);
 await page.getByRole("button",{name:"Jaribu tena"}).click();
 await expect(page.locator(".rd-card")).toHaveCount(1);
 await expect(page.locator(".rd-dish-card")).toHaveCount(0);
 await page.goto("/sw/shida/restaurants/?city=missing");
 await expect(page.locator(".market-welcome")).toHaveCount(0);
 await page.locator(".rd-empty a").click();
 await expect(page.locator(".welcome-restaurants")).toBeVisible();
});

test("the initial Kiswahili jobs response never streams a French placeholder",async({request})=>{
 const response=await request.get("/sw/shida/emplois/");
 expect(response.ok()).toBe(true);
 const html=await response.text();
 expect(html).toContain("Inapakia nafasi za kazi");expect(html).not.toContain("Chargement des offres");
});
