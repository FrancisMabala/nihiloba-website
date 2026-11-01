import {test,expect} from '@playwright/test';
import {resolve} from 'node:path';
test.beforeEach(async({page})=>{await page.route('**/_next/image**',route=>route.fulfill({path:resolve('public/shida/shida-services-braiding.png'),contentType:'image/png'}));});
for(const kind of ['beauty','legal','repairs','education','mixed'])for(const width of [360,390,768,1024,1440])test(`${kind} professional storefront at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto(`/fr/shida/services/providers/professional-${kind}`);
 await expect(page.locator('.professional-service-row')).toHaveCount(3);
 await expect(page.locator('.professional-identity:visible>.professional-art')).toHaveAttribute('data-category',({beauty:'beauty_wellness',legal:'professional_services',repairs:'repair_maintenance',education:'education_training',mixed:'general'})[kind]!);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await expect(page.locator('.professional-base:visible')).not.toContainText('Limete, Lemba, Matete');
 await expect(page.getByRole('heading',{level:1})).not.toContainText('Verified');
 await page.locator('.professional-actions>a:visible').click();await expect(page).toHaveURL(/#professional-services$/);
 await page.screenshot({path:`test-results/professional-${kind}-${width}.png`,fullPage:true});
 await page.getByRole('link',{name:'À propos',exact:true}).click();await expect(page.locator('#professional-about:visible')).toBeVisible();
});
test('single and empty profiles have useful honest states',async({page})=>{
 await page.goto('/shida/services/providers/professional-single');await expect(page.locator('.professional-service-row')).toHaveCount(1);await expect(page.locator('.professional-base:visible')).toHaveCount(0);await expect(page.getByText('No public description yet.')).toBeVisible();await page.screenshot({path:'test-results/professional-single.png',fullPage:true});
 await page.goto('/shida/services/providers/professional-empty');await expect(page.locator('.professional-actions>a:visible')).toHaveCount(0);await expect(page.getByText('No public services are available from this provider.')).toBeVisible();
 await page.goto('/shida/services/providers/professional-error');await expect(page.getByText('Services are temporarily unavailable. Please try again shortly.')).toBeVisible();await page.screenshot({path:'test-results/professional-error.png',fullPage:true});
});
test('each offering keeps its own booking or quotation destination',async({page})=>{
 await page.goto('/shida/services/providers/professional-mixed');await expect(page.locator('.professional-service-action').nth(0)).toHaveText(/Book an appointment/);await expect(page.locator('.professional-service-action').nth(1)).toHaveText(/Request a quotation/);await expect(page.locator('.professional-service-action').nth(2)).toHaveText(/View service/);
 await page.locator('.professional-service-action').nth(0).click();await expect(page).toHaveURL(/\/appointments\/#booking|\/appointments#booking/);await expect(page.locator('.service-availability:visible')).toBeVisible();
});
for(const locale of ['en','fr','ln','sw'])test(`public sharing and navigation ${locale}`,async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(navigator,'share',{value:undefined,configurable:true});Object.defineProperty(navigator,'clipboard',{value:{writeText:async(text:string)=>{document.documentElement.dataset.shared=text;}},configurable:true});});
 const prefix=locale==='en'?'':`/${locale}`;await page.goto(`${prefix}/shida/services/providers/professional-legal`);await page.locator('.professional-share button').click();await expect(page.locator('.professional-share [role=status]')).toBeVisible();expect(await page.locator('html').getAttribute('data-shared')).toContain(`${prefix}/shida/services/providers/professional-legal`);
 await expect(page.locator('.professional-service-action').first()).toHaveAttribute('href',`${prefix}/shida/services/home-repair/#booking`);
});

test('genuine reviews remain anonymous and visible',async({page})=>{await page.goto('/shida/services/providers/professional-reviews');await expect(page.getByText('A clear and helpful consultation. Controlled review fixture.').filter({visible:true})).toBeVisible();await expect(page.locator('#professional-reviews:visible')).toContainText('Verified customer');await page.screenshot({path:'test-results/professional-reviews.png',fullPage:true});});

test('profile streams an accessible loading state',async({page})=>{await page.goto('/shida/services/providers/professional-loading',{waitUntil:'commit'});await expect(page.locator('.marketplace-loading[aria-busy=true]')).toBeVisible();await page.screenshot({path:'test-results/professional-loading.png',fullPage:true});await expect(page.locator('.professional-hero')).toBeVisible();});
