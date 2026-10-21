import {test,expect} from '@playwright/test';
for(const width of [390,820,1366])for(const market of ['services','restaurants','wenze','emplois','appartements','hotels','wenze/catalog'])test(`${market} shared public journey ${width}`,async({page})=>{
 await page.setViewportSize({width,height:950});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/shida/**',route=>route.fulfill({status:401,json:{}}));
 await page.goto(`/fr/shida/${market}`);
 await expect(page.getByRole('heading',{level:1})).toBeVisible();
 await expect(page.locator('.market-header .market-space')).toHaveText('Mon espace↗');
 await expect(page.locator('.market-header .market-cart')).toBeAttached();
 const search=page.locator('.mp-search-primary').filter({visible:true});await expect(search).toBeVisible();
 await search.locator('[name=query]').fill('Kin');await search.locator('[name=city]').fill('Kinshasa');
 await search.getByRole('button').click();
 await expect(search.locator('[name=query]')).toHaveValue('Kin');await expect(search.locator('[name=city]')).toHaveValue('Kinshasa');
 expect(new URL(page.url()).searchParams.get('query')).toBe('Kin');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`docs/evidence/shared-public/${market.replace('/','-')}-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:'Langue',exact:true}).click();await page.getByRole('button',{name:'English',exact:true}).click();
 await expect(search.locator('[name=query]')).toHaveValue('Kin');expect(new URL(page.url()).searchParams.get('city')).toBe('Kinshasa');
 expect(errors).toEqual([]);
});
for(const width of [390,820,1366])test(`details and public entry surfaces ${width}`,async({page})=>{
 await page.setViewportSize({width,height:950});await page.route('**/api/shida/**',r=>r.fulfill({status:401,json:{}}));
 for(const path of ['services/home-repair','appartements/bright-flat','hotels/hotel-kin','wenze/atelier-kin','transport','ecole']){
  await page.goto(`/fr/shida/${path}`);await expect(page.locator('.market-surface')).toBeVisible();await expect(page.getByRole('heading',{level:1})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path).toBe(true);
  await page.screenshot({path:`docs/evidence/shared-public/${path.replace('/','-')}-${width}.png`,fullPage:true});
 }
});
