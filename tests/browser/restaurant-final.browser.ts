import {test,expect} from '@playwright/test';
const slogan='Oza na nzala? Luka bilei ya elengi na SHIDA!';
for(const locale of ['en','fr','ln','sw'])for(const width of [360,390,768,1024,1440])test(`combined restaurant discovery ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:920});await page.goto(`${locale==='en'?'':`/${locale}`}/shida/restaurants/`);
 await expect(page.locator('.rd-dish-card:visible')).toHaveCount(6);await expect(page.locator('.rd-card:visible')).toHaveCount(2);
 await expect(page.locator('.rd-hero h2:visible')).toHaveText(slogan);await expect(page.locator('.rd-hero h2:visible')).toHaveAttribute('lang','ln');
 await expect(page.locator('.rd-top')).toHaveCount(0);await expect(page.locator('.rd-meal-art:visible')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect((await page.locator('.rd-hero:visible').boundingBox())!.height).toBeLessThan(width<650?290:230);
 await expect(page.locator('.rd-owner-invite a:visible').first()).toHaveAttribute('href',/create=restaurant/);await expect(page.locator('.rd-owner-invite a:visible').last()).toHaveAttribute('href',/create=malewa/);
 await page.screenshot({path:`test-results/restaurant-final/${locale}-${width}.png`,fullPage:true});
});
test('dish search, correct parent, plate choice, quantities and no cross-restaurant basket',async({page})=>{
 await page.goto('/shida/restaurants/?query=Pondu&city=Kinshasa');
 await expect(page.locator('.rd-dish-card:visible')).toHaveCount(2);
 await page.locator('.rd-dish-choose:visible').first().click();await expect(page).toHaveURL(/RST-TEST1\/menu\/?.*item=ITM-AMOUNT/);
 await expect(page.getByRole('dialog')).toBeVisible();await page.screenshot({path:'test-results/restaurant-final/plate-choice.png'});
 await page.getByRole('dialog').getByRole('button',{name:'Add',exact:true}).click();
 await expect(page.locator('.rst-basket-review')).toContainText('Plate 1');
 await page.goto('/shida/restaurants/?query=Ntaba');await page.locator('.rd-dish-choose:visible').click();
 await expect(page).toHaveURL(/RST-SECOND\/menu\/?.*item=ITM-SECOND/);await expect(page.getByRole('dialog')).toBeVisible();
 await page.getByRole('dialog').getByRole('button',{name:'Increase quantity'}).click();await page.getByRole('dialog').getByRole('button',{name:'Add',exact:true}).click();
 await expect(page.locator('.rst-basket-review')).toContainText('Ntaba');await expect(page.locator('.rst-basket-review')).not.toContainText('Pondu');await expect(page.locator('.rst-basket-review>section')).toHaveCount(0);
 await page.screenshot({path:'test-results/restaurant-final/second-restaurant-basket.png',fullPage:true});
});
test('filters, language, partial failures and no results remain usable',async({page})=>{
 await page.goto('/fr/shida/restaurants/');await page.locator('input[name=query]:visible').fill('Pondu');await page.locator('input[name=city]:visible').fill('Kinshasa');await page.locator('.rd-chip:visible input[value=malewa]').check({force:true});await page.locator('.rd-submit:visible').click();
 await expect(page.locator('.rd-dish-card:visible')).toHaveCount(1);await expect(page).toHaveURL(/food_type=malewa/);
 await page.getByRole('button',{name:'Langue',exact:true}).click();await page.getByRole('button',{name:'Swahili',exact:true}).click();await expect(page).toHaveURL(/\/sw\/.*query=Pondu.*city=Kinshasa/);await expect(page.locator('.rd-hero h2:visible')).toHaveText(slogan);
 await page.goto('/shida/restaurants/?query=partial');await expect(page.locator('.rd-card:visible')).toHaveCount(2);await expect(page.locator('#dishes:visible')).toContainText('could not be loaded');await page.screenshot({path:'test-results/restaurant-final/partial-error.png',fullPage:true});
 await page.goto('/shida/restaurants/?query=empty');await expect(page.locator('.rd-dish-card:visible')).toHaveCount(0);await expect(page.locator('.rd-card:visible')).toHaveCount(0);await expect(page.getByText('No matching dishes to show.',{exact:false})).toBeVisible();await page.screenshot({path:'test-results/restaurant-final/empty.png',fullPage:true});
 await page.goto('/shida/restaurants/?query=failure');await expect(page.getByRole('button',{name:'Try again'})).toHaveCount(2);await page.screenshot({path:'test-results/restaurant-final/error.png',fullPage:true});
});

for(const kind of ['restaurant','malewa'])test(`seller invitation opens authorized ${kind} form`,async({page})=>{
 await page.route('**/api/shida/employment/session/**',route=>route.fulfill({json:{user:{display_name:'Controlled seller'},binding:'a'.repeat(64)}}));
 await page.route('**/api/shida/personal/restaurants**',route=>route.fulfill({json:{items:[],total:0,page:1,page_size:20,actions:['create']}}));
 await page.goto(`/shida/seller/restaurants?create=${kind}`);
 await expect(page.locator('.rst-editor select').first()).toHaveValue(kind);
});
test('creation invitation cannot grant management permission',async({page})=>{
 await page.route('**/api/shida/employment/session/**',route=>route.fulfill({json:{user:{display_name:'Controlled account'},binding:'a'.repeat(64)}}));
 await page.route('**/api/shida/personal/restaurants**',route=>route.fulfill({json:{items:[],total:0,page:1,page_size:20,actions:[]}}));
 await page.goto('/shida/seller/restaurants?create=malewa');
 await expect(page.locator('.rst-editor')).toHaveCount(0);
 await expect(page.getByRole('alert').filter({hasText:'unavailable for your current access'})).toBeVisible();
});
