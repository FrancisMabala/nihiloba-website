import {test,expect} from '@playwright/test';
import {fixture} from './restaurant-c1e-fixture';
import {managementNavigation} from './restaurant-management-navigation';
import {workText} from '../../app/lib/restaurant-work-copy';
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [360,820,1440])test(`receiving ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await fixture(page);
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/restaurants`);await page.locator('.rst-grid .rst-card button').first().click();await managementNavigation(page,workText(locale,'intake'));
 await expect(page.locator('.rst-work').first()).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`docs/evidence/restaurant-receiving-2026-10-15/${process.env.INTAKE_CAPTURE_PHASE??'after'}-${locale}-${width}.png`,fullPage:true});
});
