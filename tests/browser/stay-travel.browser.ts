import {test,expect} from '@playwright/test';
for(const locale of ['en','fr','ln','sw'])for(const width of [360,390,768,1024,1440])test(`stay/travel discovery ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});
 for(const path of ['appartements','hotels','transport']){
  await page.goto(`${locale==='en'?'':`/${locale}`}/shida/${path}`);
  const main=page.locator('#main-content');await expect(main.locator('.st-hero')).toBeVisible();await expect(main.locator('.st-slogan')).toHaveAttribute('lang','ln');await expect(main.locator('.st-invitation')).toBeVisible();
  await expect(main.locator('.st-art')).toBeVisible();expect(await main.locator('.st-art').evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  if(path==='hotels')await expect(main.locator('.st-empty')).toBeVisible();
  if(path==='appartements')await expect(main.locator('.marketplace-card')).toHaveCount(1);
  if(path==='transport'){await expect(main.locator('a[href*="text=wewa"]')).toHaveCount(locale==='en'?2:1);expect(await main.locator('.transport-request a').getAttribute('href')).toContain('text=wewa');}
  if(locale==='fr'&&[390,1440].includes(width))await page.screenshot({path:`test-results/stay-${path}-${width}.png`,fullPage:true});
 }
});
test('hotel populated, filtered-empty and error remain distinct',async({page})=>{
 await page.goto('/fr/shida/hotels?query=populated');await expect(page.locator('#main-content .marketplace-card')).toHaveCount(1);await expect(page.locator('#main-content .hotel-prices')).toContainText('nuit');await page.screenshot({path:'test-results/stay-hotels-populated.png',fullPage:true});
 await page.goto('/fr/shida/hotels?query=missing');await expect(page.locator('#main-content')).toContainText('Aucun hôtel ne correspond');await expect(page.locator('#main-content .st-empty')).toHaveCount(0);
 await page.goto('/fr/shida/hotels?query=failure');await expect(page.locator('#main-content .st-retry')).toBeVisible();await expect(page.locator('#main-content .st-empty')).toHaveCount(0);
});
test('property search preserves filter context and recoverable errors',async({page})=>{
 await page.goto('/shida/appartements');await page.locator('#main-content input[name="query"]').fill('empty');await page.locator('#main-content input[name="city"]').fill('Goma');await page.locator('#main-content button[type="submit"]').first().click();await expect(page).toHaveURL(/city=Goma/);await expect(page.locator('#main-content .marketplace-card')).toHaveCount(0);
 await page.goto('/shida/appartements?query=failure');await expect(page.locator('#main-content .st-retry')).toBeVisible();
});
