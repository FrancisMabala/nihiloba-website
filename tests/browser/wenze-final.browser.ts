import {assertSearchLayout} from './shared-search-layout';
import {test,expect} from '@playwright/test';

const slogan='Teka, somba, solola prix, nyonso na Wenze!';
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [360,390,768,1024,1440])test(`shared Wenze ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:950});const root=`${locale==='en'?'':'/'+locale}/shida/wenze/`;let heroHeight=0;
 for(const shops of [false,true]){
 await page.goto(root+(shops?'?view=shops':''));const hero=page.locator('.illustrated-shop:visible');await expect(hero).toContainText(slogan);await expect(hero.locator('.marketplace-permanent-slogan')).toHaveAttribute('lang','ln');
 await expect(page.locator('.wz-public-tabs a')).toHaveCount(2);await expect(page.locator('.wz-public-tabs a[aria-current=page]')).toHaveCount(1);
 await expect(page.locator(shops?'.wenze-store-card':'.wenze-product-card')).toHaveCount(shops?2:4);
 const height=(await hero.boundingBox())!.height;if(!shops)heroHeight=height;else expect(height).toBe(heroHeight);
 expect((await page.locator('.wz-category-browser .mp-chips:visible').first().boundingBox())!.height).toBeLessThan(80);
 await assertSearchLayout(page,width); expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/wenze-final/${locale}-${width}-${shops?'shops':'products'}.png`,fullPage:true});
 }
});
test('search, actual categories, price modes, missing images and distinct empty/error states',async({page})=>{
 await page.goto('/shida/wenze/');await expect(page.locator('.wz-subcategories:visible')).toHaveCount(0);
 const fixed=page.locator('.wenze-product-card:visible').filter({hasText:'Cotton shirt'}),neg=page.locator('.wenze-product-card:visible').filter({hasText:'Everyday bag'});
 await expect(fixed).toContainText('Fixed price');await expect(neg).toContainText('Negotiable');await expect(neg.getByRole('button',{name:'Add to cart'})).toHaveCount(0);
 await page.locator('input[name=query]:visible').fill('missing');await page.locator('input[name=city]:visible').fill('Kinshasa');await page.locator('.mp-search-primary button:visible').click();await expect(page.locator('.wz-results-state:visible')).toBeVisible();expect(new URL(page.url()).searchParams.get('city')).toBe('Kinshasa');
 for(const view of ['', '&view=shops']){await page.goto('/shida/wenze/?query=missing'+view);await expect(page.locator('.wz-results-state:visible')).toBeVisible();await expect(page.locator('.wz-results-state[role=alert]:visible')).toHaveCount(0);await page.goto('/shida/wenze/?query=failure'+view);await expect(page.locator('.wz-results-state[role=alert]:visible')).toContainText('Try again');}
 await page.goto('/shida/wenze/?category=phones_electronics');await expect(page.locator('.wenze-product-card:visible')).toHaveCount(2);await expect(page.locator('.wz-subcategories:visible')).toBeVisible();
 await page.goto('/shida/wenze/?view=shops');await expect(page.locator('.wenze-store-card:visible').filter({hasText:'Controlled Online Shop'})).toContainText('Online');await expect(page.locator('.wenze-store-card:visible').filter({hasText:'Controlled Boutique'})).toContainText('Online and physical');
 await page.locator('.wenze-store-card:visible').filter({hasText:'Controlled Boutique'}).getByRole('link',{name:'View shop',exact:true}).click();await expect(page.locator('h1')).toHaveText('Controlled Boutique');
});
test('compact loading state while real listing request is pending',async({page})=>{await page.goto('/shida/wenze/?query=slow',{waitUntil:'commit'});await expect(page.locator('.wz-loading')).toBeVisible();await expect(page.locator('.wenze-product-card:visible')).toHaveCount(4);});
