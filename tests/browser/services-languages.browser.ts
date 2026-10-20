import {test,expect} from "@playwright/test";

for(const [locale,title,category] of [
 ["en","Find the right hands for the job.","Repair & maintenance"],
 ["fr","La bonne personne pour votre prochain projet.","Réparation & entretien"],
 ["ln","Zwa moto abongi mpo na mosala na yo.","Bobongisi"],
 ["sw","Pata mtu anayefaa kwa kazi yako.","Matengenezo"]
] as const)test(`Services public language, small screen and exact destination ${locale}`,async({page})=>{
 await page.setViewportSize({width:360,height:900});
 const prefix=locale==="en"?"":`/${locale}`;
 await page.goto(`${prefix}/shida/services?category=repair_maintenance&commune=Gombe`);
 await expect(page.getByRole("heading",{name:title})).toBeVisible();
 await expect(page.locator(".svc-language-nav a")).toHaveCount(4);
 await expect(page.locator(".svc-language-nav a[aria-current=page]")).toHaveAttribute("lang",locale);
 await expect(page.locator(".service-card .service-category")).toHaveText(category);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator(".service-card h2 a").click();
 await expect(page).toHaveURL(new RegExp(`${prefix}/shida/services/home-repair`));
 await expect(page.locator(".svc-language-nav a[aria-current=page]")).toHaveAttribute("lang",locale);
 await page.locator(".svc-language-nav").getByRole("link",{name:"Kiswahili",exact:true}).click();
 await expect(page).toHaveURL(/\/sw\/shida\/services\/home-repair/);
 await expect(page.getByRole("heading",{name:"Kuhusu huduma hii"})).toBeVisible();
 await page.locator(".service-detail-provider a").click();
 await expect(page).toHaveURL(/\/sw\/shida\/services\/providers\/atelier-kin/);
 await expect(page.getByRole("heading",{name:"Huduma za mtoa huduma huyu"})).toBeVisible();
});
