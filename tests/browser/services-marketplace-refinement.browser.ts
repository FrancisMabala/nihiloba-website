import {test,expect} from '@playwright/test';
import {resolve} from 'node:path';
test.beforeEach(async({page})=>{await page.route('**/_next/image**',route=>route.fulfill({path:resolve('public/shida/shida-services-braiding.png'),contentType:'image/png'}));});
for(const width of [360,390,768,1024,1440])test(`discovery and shared storefront at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:960});await page.goto('/shida/services');
 await expect(page.getByRole('heading',{name:'Services',exact:true})).toBeVisible();
 await expect(page.locator('.service-card')).toHaveCount(3);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.screenshot({path:`test-results/marketplace-discovery-${width}.png`,fullPage:true});
 await page.getByRole('link',{name:'View all professionals →',exact:true}).click();await expect(page.locator('.svc-professional-card')).toHaveCount(1);
 await page.getByRole('link',{name:'View professional profile',exact:true}).click();await expect(page.locator('#professional-services .service-card')).toHaveCount(3);
 await page.getByRole('link',{name:'About',exact:true}).click();await expect(page.locator('#professional-about')).toBeVisible();
 await page.screenshot({path:`test-results/marketplace-professional-${width}.png`,fullPage:true});
 await page.goto('/shida/services/home-repair');await expect(page.locator('#booking')).toBeVisible();
 await expect(page.getByRole('link',{name:'Request a quotation',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.screenshot({path:`test-results/marketplace-detail-${width}.png`,fullPage:true});
});
for(const lang of ['fr','ln','sw'])test(`localized discovery ${lang}`,async({page})=>{await page.goto(`/${lang}/shida/services?mode=professionals`);await expect(page.locator('.svc-professional-card')).toHaveCount(1);await expect(page.locator('.illustrated-services .svc-brand-slogan:visible')).toHaveText('Mosala na yo, na maboko ya bato ya mayele!');});
test('empty and error are distinct',async({page})=>{await page.goto('/shida/services?mode=professionals&query=empty');await expect(page.getByText('No professionals match your search.')).toBeVisible();await page.goto('/shida/services?query=failure');await expect(page.getByText('Services are temporarily unavailable. Please try again shortly.')).toBeVisible();});

test('public appointment selection creates one WhatsApp handoff and handles a stale time',async({page})=>{
 const calls:string[]=[];
 await page.route('**/api/shida/services/booking-link?**',route=>{calls.push(route.request().url());return calls.length===1?route.fulfill({status:409,json:{detail:'time_unavailable'}}):route.fulfill({json:{booking_url:'https://wa.me/243812345678?text=START%20opaque'}});});
 await page.goto('/shida/services/appointments');
 // A cold streamed response may retain a hidden server panel during hydration.
 const panel=page.locator('.service-availability:visible');await expect(panel).toHaveCount(1);await expect(panel.getByText('Kinshasa time')).toBeVisible();expect(calls).toHaveLength(0);
 await panel.locator('.service-date-grid button:not([disabled])').first().click();await panel.getByRole('button',{name:'09:00–09:30',exact:true}).click();
 await expect(panel.getByRole('status')).toContainText('no longer available');await expect(panel.getByRole('link',{name:'Continue on WhatsApp'})).toHaveCount(0);
 await panel.getByRole('button',{name:'09:30–10:00',exact:true}).click();await expect(panel.getByRole('link',{name:'Continue on WhatsApp'})).toHaveAttribute('href',/START%20opaque/);expect(calls).toHaveLength(2);
 await expect(panel).toContainText('confirmed when you finish booking');
});

for(const kind of ['beauty','legal'])test(`category storefront ${kind}`,async({page})=>{await page.goto(`/shida/services/providers/professional-${kind}`);await expect(page.locator('.service-card')).toHaveCount(3);await expect(page.locator('.service-provider-header')).not.toContainText('Verified');await page.screenshot({path:`test-results/marketplace-${kind}.png`,fullPage:true});});

for(const width of [390,1440])test(`real package references and photo layout ${width}`,async({page})=>{await page.setViewportSize({width,height:960});await page.goto('/shida/services/beauty-packages');await expect(page.locator('.service-option')).toHaveCount(2);await page.getByRole('button',{name:/Hair treatment/}).click();await expect(page).toHaveURL(/option=SPK_care/);await expect(page.locator('.service-selection-summary')).toContainText('35 USD');await expect(page.locator('.service-selection-summary')).toContainText('1 h');await expect(page.locator('.service-gallery-section img').first()).toBeVisible();await expect.poll(()=>page.locator('.service-gallery-section img').first().evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);await page.screenshot({path:`test-results/marketplace-packages-${width}.png`,fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);});
