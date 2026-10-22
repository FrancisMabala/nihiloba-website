import {test,expect} from '@playwright/test';
test.beforeEach(async({page,browserName})=>{
 await page.route('**/_next/image**',r=>r.fulfill({path:'public/NIHILOBA_logo.png',contentType:'image/png'}));
 if(browserName!=='webkit')return;
 // The isolated fixture server is HTTP. WebKit upgrades its subresources to
 // HTTPS under the production CSP; adapt only fixture document responses.
 await page.route('http://127.0.0.1:3044/**',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const response=await route.fetch(),headers=response.headers();
  headers['content-security-policy']=headers['content-security-policy']?.replace(/;?\s*upgrade-insecure-requests/g,'')||'';
  await route.fulfill({response,headers});
 });
});
const markets=['','wenze','restaurants','services','emplois','appartements','hotels','transport'];
test('restaurant mobile basket remains above global navigation',async({page})=>{
 await page.setViewportSize({width:390,height:900});await page.route('**/api/shida/**',r=>r.fulfill({status:401,json:{}}));
 await page.goto('/shida/restaurants/test-malewa');
 await page.locator('[data-restaurant-item-selection="ITM-UNIT"]').click();
 const basket=page.locator('.rst-sticky-basket'),nav=page.locator('.shida-navigation');await expect(basket).toBeVisible();
 const b=(await basket.boundingBox())!,n=(await nav.boundingBox())!;expect(b.y+b.height).toBeLessThanOrEqual(n.y+1);
 await basket.click();await expect(page.locator('#basket-review')).toBeInViewport();
 await page.screenshot({path:'docs/evidence/refinement/restaurant-basket-390.png'});
});
for(const locale of ['en','fr','ln','sw'])for(const width of [390,820,1440])test(`public refinement ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.route('**/api/shida/**',r=>r.fulfill({status:401,json:{}}));
 for(const market of markets){
  const response=await page.goto(`${locale==='en'?'':`/${locale}`}/shida/${market}`);expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveCount(1);await expect(page.locator('.shida-navigation')).toHaveCount(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.locator('.shida-navigation').evaluate(el=>getComputedStyle(el).position)).toBe(width<=700?'fixed':'static');
  await expect(page.locator('.market-footer')).not.toContainText(/Roots|Racines/);
  await expect(page.locator('.market-language span')).toHaveCount(0);
  await expect(page.locator('.shida-navigation [aria-current=page]')).toHaveCount(1);
  if(market&&market!=='transport'){
   await expect(page.locator(market==='emplois'?'.job-result':market==='restaurants'?'.rd-card':'.marketplace-card').first()).toBeVisible();
   const form=page.locator('.marketplace-public form').first();await expect(form).toBeVisible();
   await form.locator('[name=query]').fill('empty');await Promise.all([page.waitForURL(url=>url.searchParams.get('query')==='empty'),form.locator('button[type=submit],button:not([type])').first().click()]);await expect(form.locator('[name=query]')).toHaveValue('empty');
   const bottom=await page.locator('.market-footer').evaluate(el=>el.getBoundingClientRect().bottom+scrollY);expect(bottom).toBeGreaterThanOrEqual(width<=700?820:899);
  }
  if(locale==='fr'&&width!==820)await page.screenshot({path:`docs/evidence/refinement/${market||'home'}-${width}.png`,fullPage:true});
 }
});
for(const width of [320,390,820,1440])test(`Wenze equal cards and search ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.route('**/_next/image**',r=>r.fulfill({path:'public/NIHILOBA_logo.png',contentType:'image/png'}));await page.goto('/shida/wenze');const cards=page.locator('.wenze-product-card');await expect(cards).toHaveCount(5);await page.locator('img[alt="Fixture image"]').scrollIntoViewIfNeeded();await expect(page.locator('img[alt="Fixture image"]')).toBeVisible();await page.evaluate(()=>scrollTo(0,0));
 const boxes=await cards.evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect(),image=el.querySelector('.marketplace-card-image')!.getBoundingClientRect(),title=el.querySelector('h2')!.getBoundingClientRect(),price=el.querySelector('.wenze-card-price')!.getBoundingClientRect();return {w:r.width,h:r.height,ratio:image.width/image.height,title:title.y-r.y,price:price.y-r.y};}));
 for(const key of ['w','h','ratio','title','price'] as const)expect(Math.max(...boxes.map(b=>b[key]))-Math.min(...boxes.map(b=>b[key])),key+JSON.stringify(boxes)).toBeLessThan(2);
 await page.screenshot({path:`docs/evidence/refinement/wenze-populated-${width}.png`,fullPage:true});
 await page.goto('/shida/wenze?query=few');await expect(cards).toHaveCount(1);expect((await cards.first().boundingBox())!.width).toBeLessThan(width>700?410:width*.55);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('navigation menu, keyboard, language, canonical links and workspace boundaries',async({page})=>{
 await page.setViewportSize({width:390,height:900});await page.route('**/api/shida/**',r=>r.fulfill({status:401,json:{}}));await page.goto('/fr/shida');
 const nav=page.locator('.shida-navigation'),menu=nav.getByRole('button',{name:'Menu',exact:true});await menu.focus();await page.keyboard.press('Enter');await expect(page.locator('#shida-menu')).toBeVisible();
 await expect(page.locator('#shida-menu a[href="https://business.nihiloba.com/"]')).toBeVisible();await page.keyboard.press('Escape');await expect(menu).toBeFocused();
 await expect(page.locator('.discovery-account-note a')).toHaveAttribute('href','https://wa.me/46769709059?text=Bonjour');await expect(page.locator('.discovery-story-link a')).toHaveAttribute('href',/\/fr\/about\/shida\/?$/);await expect(page.locator('.discovery-entries p')).toHaveCount(0);
 await page.locator('.market-language').click();await page.getByRole('button',{name:'English',exact:true}).click();await expect(page).toHaveURL(/\/shida\/?$/);
 await nav.getByRole('link',{name:'Explore',exact:true}).click();await expect(page).toHaveURL(/#explore$/);await expect(nav.locator('[aria-current=page]')).toHaveText('Explore');
 for(const market of ['wenze','restaurants','services']){await page.goto(`/shida/seller/${market}`);await expect(page.locator('.shida-navigation')).toHaveCount(0);await expect(page.locator('.space-bottom')).toHaveCount(0);}
 await page.goto('/shida/wenze');await expect(nav).toBeVisible();await page.locator('input[name=query]').focus();await expect(nav).toHaveAttribute('data-keyboard','true');await page.setViewportSize({width:390,height:900});await page.locator('input[name=query]').blur();await expect(nav).toBeVisible();
 await page.goto('/shida/space?view=management');await expect(page.locator('.shida-navigation [aria-current=page]')).toHaveText('Manage');await expect(page.locator('.space-bottom')).toHaveCount(0);
});
