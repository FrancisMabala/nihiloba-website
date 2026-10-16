import {test,expect} from '@playwright/test';

for(const locale of ['en','fr'])test(`${locale} landing image, seller links and filters work on desktop and mobile`,async({page})=>{
 await page.route('**/api/**',route=>route.fulfill({status:401,json:{}}));
 const path=locale==='fr'?'/fr/shida/wenze':'/shida/wenze';
 await page.setViewportSize({width:1440,height:1000});await page.goto(path);
 await expect(page.locator('.wzp-landing-hero h1')).toContainText(locale==='fr'?'Trouvez votre bonheur':'Find something you love');
 await expect.poll(()=>page.locator('.wzp-landing-art img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
 await expect(page.locator('.wzp-seller-invitation a')).toHaveAttribute('href',locale==='fr'?'/fr/shida/seller/wenze/':'/shida/seller/wenze/');
 await page.screenshot({path:`docs/evidence/wenze-landing/${locale}-desktop.png`,fullPage:true});
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect((await page.locator('.wzp-filters').boundingBox())!.y).toBeLessThan(800);
 await page.screenshot({path:`docs/evidence/wenze-landing/${locale}-mobile.png`,fullPage:true});
 await page.locator('input[name="query"]').fill('boutique');await page.locator('.wzp-filters button').click();await expect(page).toHaveURL(/query=boutique/);
 await page.locator('.wzp-categories a').nth(1).click();await expect(page).toHaveURL(/category=fashion_clothing/);await expect(page).toHaveURL(/query=boutique/);
});
