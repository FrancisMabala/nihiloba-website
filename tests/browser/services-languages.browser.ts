import {test,expect} from "@playwright/test";

for(const [locale,title,category] of [
 ["en","Services","Repair & maintenance"],
 ["fr","Services","Réparation & entretien"],
 ["ln","Ba services","Bobongisi"],
 ["sw","Huduma","Matengenezo"]
] as const)test(`Services public language, small screen and exact destination ${locale}`,async({page})=>{
 await page.route("**/api/shida/employment/session/**",r=>r.fulfill({status:401,json:{}}));
 await page.setViewportSize({width:360,height:900});
 const prefix=locale==="en"?"":`/${locale}`;
 await page.goto(`${prefix}/shida/services?category=repair_maintenance&commune=Gombe`);
 await expect(page.getByRole("heading",{name:title})).toBeVisible();

 await expect(page.locator(".market-language")).toHaveText(locale.toUpperCase());
 await expect(page.locator(".service-card .service-category")).toHaveText(category);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator(".service-card h2 a").click();
 await expect(page).toHaveURL(new RegExp(`${prefix}/shida/services/home-repair`));
 await expect(page.locator(".market-language")).toHaveText(locale.toUpperCase());
 await page.locator(".market-language").click();await page.getByRole("button",{name:"Kiswahili",exact:true}).click();
 await expect(page).toHaveURL(/\/sw\/shida\/services\/home-repair/);
 await expect(page.getByRole("heading",{name:"Kuhusu huduma hii"})).toBeVisible();
 await page.locator(".service-detail-provider a").click();
 await expect(page).toHaveURL(/\/sw\/shida\/services\/providers\/atelier-kin/);
 await expect(page.getByRole("heading",{name:"Huduma za mtoa huduma huyu"})).toBeVisible();
});
