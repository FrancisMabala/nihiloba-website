import {test,expect,type Page} from '@playwright/test';
const markets=['emplois','wenze','restaurants','services','appartements','hotels','transport'];
async function account(page:Page,signedIn=true){
 await page.route('**/api/**',route=>{
  const path=new URL(route.request().url()).pathname;
  if(signedIn&&path.includes('/employment/session'))return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Camille Locale'}}});
  if(signedIn&&path.includes('/security/navigation'))return route.fulfill({json:{can_manage:true,markets:['wenze'],organization_management:false}});
  if(signedIn&&path.includes('/wenze-buyer/relations/'))return route.fulfill({json:{saved:false,following:false}});
  if(path.includes('/notifications'))return route.fulfill({json:{items:[],unread_count:0,total:0}});
  return route.fulfill({status:401,json:{}});
 });
}
async function ready(page:Page){await expect(page.locator('.market-language')).toBeEnabled();}
async function noOverflow(page:Page){
 const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1&&getComputedStyle(e).position!=='absolute').slice(0,6).map(e=>e.className)}));
 expect(layout.scroll,JSON.stringify(layout)).toBeLessThanOrEqual(layout.width+1);
}
for(const width of [320,375,390,430,768,1440])test(`seven marketplaces: usable controls and results ${width}`,async({page})=>{
 await account(page);await page.setViewportSize({width,height:844});
 for(const market of markets){
  await page.goto('/fr/shida/'+market+'/');await ready(page);
  await expect(page.locator('.marketplace-permanent-slogan:visible')).toHaveAttribute('lang','ln');
  await expect(page.locator('.market-primary-nav a')).toHaveCount(7);await noOverflow(page);
  if(width<=760){
   await expect(page.locator('.shida-navigation [aria-current]')).toContainText('Marchés');
   const nav=await page.locator('.market-primary-nav').boundingBox(),active=await page.locator('.market-primary-nav [aria-current]').boundingBox();
   expect(active!.x).toBeGreaterThanOrEqual(nav!.x-1);expect(active!.x+active!.width).toBeLessThanOrEqual(nav!.x+nav!.width+1);
   const form=page.locator('.mp-search').first();
   if(await form.count()){
    const query=await form.locator('[name=query]').boundingBox(),bounds=await form.boundingBox(),city=await form.locator('[name=city]').boundingBox(),filters=await form.locator('details:not(.mp-inventory-help)>summary').first().boundingBox();
    expect(query!.width).toBeGreaterThanOrEqual(bounds!.width-2);
    expect(Math.abs(city!.y-filters!.y)).toBeLessThanOrEqual(2);
    expect(city!.x+city!.width).toBeLessThanOrEqual(filters!.x-7);
    expect(Math.abs(city!.height-filters!.height)).toBeLessThanOrEqual(2);
   }
  }
  if(width===390&&['wenze','emplois'].includes(market)){
   const card=page.locator(market==='wenze'?'.wenze-product-card':'.job-result').first();await expect(card).toBeVisible();
   const rect=await card.boundingBox(),nav=await page.locator('.shida-navigation').boundingBox();expect(rect!.y+rect!.height).toBeLessThanOrEqual(nav!.y);
  }
  if(process.env.SHIDA_EVIDENCE)await page.screenshot({path:`${process.env.SHIDA_EVIDENCE}/${market}-${width}.png`});
 }
});
test('200 percent text, uninterrupted titles, keyboard viewport and bottom content remain reachable',async({page})=>{
 await account(page);await page.setViewportSize({width:320,height:844});
 for(const market of ['emplois','wenze']){
  await page.goto('/fr/shida/'+market+'/');await ready(page);await page.addStyleTag({content:'html{font-size:200%}'});
  await page.locator(market==='emplois'?'.job-result h3 a':'.wenze-product-card h2 a').first().evaluate(e=>{e.textContent='TitreSansEspace'.repeat(12);});
  await noOverflow(page);
  await page.locator('.mp-search details>summary').first().tap();await noOverflow(page);
 }
 await page.goto('/fr/shida/emplois/');await ready(page);await page.locator('.mp-search [name=query]').focus();
 // Browser simulation of a reduced visual viewport, not a real iOS keyboard.
 await page.evaluate(()=>{Object.defineProperty(window.visualViewport!,'height',{configurable:true,get:()=>window.innerHeight-300});window.visualViewport!.dispatchEvent(new Event('resize'));});
 await expect(page.locator('.shida-navigation')).toBeHidden();
 await page.evaluate(()=>{Reflect.deleteProperty(window.visualViewport!,'height');window.visualViewport!.dispatchEvent(new Event('resize'));});
 await expect(page.locator('.shida-navigation')).toBeVisible();
 const last=page.locator('.marketplace-public a').last();await last.scrollIntoViewIfNeeded();const rect=await last.boundingBox(),bar=await page.locator('.shida-navigation').boundingBox();expect(rect!.y+rect!.height).toBeLessThanOrEqual(bar!.y);
});
test('Jobs search, category filters, type tabs, refresh and back preserve real destination state',async({page})=>{
 await account(page,false);await page.setViewportSize({width:390,height:844});await page.goto('/fr/shida/emplois/');await ready(page);
 await expect(page.locator('.job-result')).toHaveCount(3);
 const search=page.locator('.mp-search');await search.locator('[name=query]').fill('support');await search.locator('[name=city]').fill('Lubumbashi');await search.locator('summary').tap();
 await search.locator('[name=category]').selectOption('it_telecommunications');await search.locator('[name=contract]').selectOption('cdi');await search.locator('.marketplace-search-submit').tap();
 await expect(search.locator('[name=city]')).toHaveValue('Lubumbashi');await expect(search.locator('[name=category]')).toHaveValue('it_telecommunications');
 await page.locator('.job-offer-tabs').getByRole('link',{name:'Particuliers',exact:true}).tap();await expect(page.locator('.job-result')).toHaveCount(1);await expect(page.locator('.job-result')).toContainText('Aide à domicile');
 await page.locator('.job-offer-tabs').getByRole('link',{name:'Professionnelles',exact:true}).tap();await expect(page.locator('.job-result')).toHaveCount(2);await expect(page.locator('.job-result').first()).toContainText('Assistant support');
 await page.reload();await expect(page.locator('.job-offer-tabs [aria-current]')).toHaveText('Professionnelles');await page.goBack();await expect(page.locator('.job-result')).toHaveCount(1);
 await page.locator('.job-offer-tabs').getByRole('link',{name:'Tout',exact:true}).tap();await expect(page.locator('.job-result')).toHaveCount(3);
 await page.locator('.job-card-save').first().tap();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('dialog').getByRole('button',{name:'Fermer',exact:true}).tap();await expect(search.locator('[name=query]')).toHaveValue('support');
 await page.locator('.job-result h3 a').first().tap();await expect(page.getByRole('dialog').getByRole('button',{name:'Se connecter',exact:true})).toBeVisible();
});
test('Wenze categories, shops/products, native search and empty/error recovery',async({page})=>{
 await account(page,false);await page.setViewportSize({width:390,height:844});await page.goto('/fr/shida/wenze/');await ready(page);
 await page.locator('.wz-category-browser summary').tap();await page.locator('.wz-all-categories').getByRole('link',{name:'Maison & équipement',exact:true}).tap();await expect(page).toHaveURL(/category=home_equipment/);
 await page.locator('.wz-public-tabs').getByRole('link',{name:'Boutiques',exact:true}).tap();await expect(page.locator('.wenze-store-card')).toHaveCount(1);
 await page.locator('.wz-public-tabs').getByRole('link',{name:'Produits',exact:true}).tap();await expect(page.locator('.wenze-product-card')).toHaveCount(4);
 await page.locator('.mp-search [name=city]').fill('Goma');await page.locator('.mp-search [name=query]').fill('fixture-empty');await page.locator('.mp-search [name=query]').press('Enter');await expect(page).toHaveURL(/query=fixture-empty/);await expect(page.locator('.mp-search [name=query]')).toHaveValue('fixture-empty');await expect(page.locator('.wenze-product-card')).toHaveCount(0);await expect(page.locator('.wz-results-state')).toContainText('Aucun');
 await page.locator('.mp-search [name=query]').fill('fixture-error');await page.locator('.marketplace-search-submit').tap();await expect(page).toHaveURL(/query=fixture-error/);await expect(page.locator('.wz-results-state[role=alert]')).toBeVisible();await expect(page.locator('.wz-results-state').getByRole('link',{name:'Réessayer'})).toHaveAttribute('href',/fixture-error/);
 await page.goto('/fr/shida/wenze/');await expect(page.locator('.wenze-product-card')).toHaveCount(4);
 const link=page.locator('.wenze-product-card h2 a').first(),href=await link.getAttribute('href');await link.tap();await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));await page.goBack();await expect(page.locator('.wenze-product-card')).toHaveCount(4);
});
test('other market searches and Transport handoff preserve their canonical semantics',async({page})=>{
 await account(page,false);await page.setViewportSize({width:390,height:844});
 for(const market of ['restaurants','services','appartements','hotels']){
  await page.goto('/fr/shida/'+market+'/');await ready(page);const form=page.locator('.mp-search').first();
  await form.locator('[name=query]').fill('Exemple');await form.locator('[name=city]').fill('Goma');await form.locator('.marketplace-search-submit').tap();
  await expect(form.locator('[name=city]')).toHaveValue('Goma');expect(new URL(page.url()).searchParams.get('query')).toBe('Exemple');
  await form.locator('details:not(.mp-inventory-help)>summary').first().tap();await noOverflow(page);
 }
 await page.goto('/fr/shida/transport/');await ready(page);await expect(page.locator('.st-steps')).not.toHaveAttribute('open','');await page.locator('.st-steps summary').tap();await expect(page.locator('.st-steps li')).toHaveCount(3);
 const action=page.locator('.transport-request a');expect(new URL((await action.getAttribute('href'))!).searchParams.get('text')).toBe('wewa');await expect(page.locator('.transport-request')).toContainText('Envoyez le message préparé');
});
for(const locale of ['fr','en','ln','sw'])test(`long labels and enlarged text ${locale}`,async({page})=>{
 await account(page,false);await page.setViewportSize({width:320,height:844});
 for(const market of markets){await page.goto((locale==='en'?'':'/'+locale)+'/shida/'+market+'/');await ready(page);await page.addStyleTag({content:'html{font-size:125%}'});await noOverflow(page);}
});
