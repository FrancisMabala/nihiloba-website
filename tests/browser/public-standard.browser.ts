import {test,expect,type Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
const markets=['wenze','restaurants','services','emplois','appartements','hotels','transport','meda'];
const baseline=process.env.PUBLIC_STANDARD_BASELINE==='1';
const evidence=process.env.PUBLIC_STANDARD_EVIDENCE??'docs/evidence/public-marketplace-standard-20261118';
async function ready(page:Page){
 await expect(page.locator('.market-language')).toBeEnabled();
 // Do not mistake the hydrated shared header for completed streamed page content.
 await expect.poll(()=>page.locator('.illustrated-marketplace-hero h1').evaluateAll(es=>({count:es.length,visible:es.filter(e=>e.getBoundingClientRect().height>0).length}))).toEqual({count:1,visible:1});
}
async function account(page:Page,signedIn=false){
 await page.route('**/api/**',route=>{
  const path=new URL(route.request().url()).pathname;
  if(path.includes('/employment/session'))return route.fulfill(signedIn?{json:{binding:'a'.repeat(64),user:{display_name:'Camille Locale'}}}:{status:401,json:{}});
  if(path.includes('/security/navigation'))return route.fulfill({json:{can_manage:true,markets:['wenze'],organization_management:false}});
  if(path.includes('/notifications'))return route.fulfill({json:{items:[],unread_count:0,total:0}});
  if(path.includes('/registration-reference'))return route.fulfill({json:{items:[]}});
  if(path.includes('/personal/meda/discovery'))return route.fulfill({json:{items:[],page:1,has_more:false}});
  return route.fulfill({status:401,json:{}});
 });
}
async function fits(page:Page){const layout=await page.evaluate(()=>({url:location.href,width:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,12).map(e=>({class:e.className,text:e.textContent?.slice(0,70),width:e.getBoundingClientRect().width}))}));expect(layout.width,JSON.stringify(layout)).toBeLessThanOrEqual((await page.viewportSize())!.width+1);}
for(const market of markets)test(`public contract ${market}`,async({context})=>{
 mkdirSync(evidence,{recursive:true});
 for(const width of (baseline?[390,1440]:[320,375,390,430,767,768,820,1023,1024,1440])){
  const page=await context.newPage();await account(page);
  await page.setViewportSize({width,height:900});await page.goto(`/fr/shida/${market}/`);
  await ready(page);await expect(page.locator('.illustrated-marketplace-hero h1')).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);await fits(page);
  if([390,1440].includes(width))await page.screenshot({path:join(evidence,`${baseline?'before':'after'}-${market}-${width}.png`)});
  if(baseline){await page.close();continue;}
  await expect(page.locator('[data-public-marketplace]')).toHaveAttribute('data-public-marketplace',market);
  const hero=page.locator('.illustrated-marketplace-hero'),nav=page.locator('.shida-navigation');
  expect(await hero.evaluate(e=>getComputedStyle(e).backgroundImage)).toBe('none');
  await expect(hero.locator('h1')).toHaveCSS('font-family','Georgia, serif');
  if(width<768){
   await expect(hero).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
   await expect(hero.locator('h1')).toHaveCSS('font-size','28px');
   await expect(hero.locator('.marketplace-permanent-slogan')).toHaveCSS('font-size','15px');
   await expect(hero.locator('.marketplace-permanent-slogan')).toHaveCSS('font-family','Arial, sans-serif');
   await expect(hero.locator('.marketplace-hero-art')).toBeHidden();
  }else await expect(hero).toHaveCSS('background-color','rgb(250, 245, 239)');
  if(width<1024){await expect(nav).toBeVisible();await expect(nav.locator('[aria-current]')).toContainText('Marchés');await expect(nav.locator('[aria-current]')).toHaveCSS('background-color','rgb(224, 235, 209)');}
  else await expect(nav).toBeHidden();
  await page.close();
 }
});
for(const locale of ['en','fr','ln','sw'])test(`public translations and enlarged text ${locale}`,async({page})=>{
 test.skip(baseline);await account(page);await page.setViewportSize({width:320,height:900});
 for(const market of markets){await page.goto(`${locale==='en'?'':'/'+locale}/shida/${market}/`);await ready(page);await page.addStyleTag({content:'html{font-size:200%}'});await fits(page);await expect(page.locator('.illustrated-marketplace-hero h1')).toBeVisible();}
});
test('Meda public controls preserve filters, access boundary and canonical creation',async({page})=>{
 test.skip(baseline);await account(page,true);await page.setViewportSize({width:390,height:900});await page.goto('/fr/shida/meda/');
 const form=page.locator('.meda-search');await expect(form).toBeVisible();
 await form.locator('input').nth(0).fill('Paris');await form.locator('input').nth(1).fill('Kinshasa');await form.locator('.meda-route-search button').click();
 await expect(page).toHaveURL(/origin=Paris/);await expect(page).toHaveURL(/destination=Kinshasa/);
 await form.locator('.meda-categories button').nth(1).click();await expect(page).toHaveURL(/category=luggage/);
 await form.locator('.meda-sides button').nth(1).click();await expect(page).toHaveURL(/side=request/);
 await form.locator('summary').click();await form.locator('input[type=date]').fill('2027-02-20');await form.locator('details button').click();await expect(page).toHaveURL(/after=2027-02-20/);
 await page.reload();await expect(form.locator('input').nth(0)).toHaveValue('Paris');await expect(form.locator('.meda-categories [aria-pressed=true]')).toContainText('Bagages');
 await expect(page.locator('.meda-invitation a').first()).toHaveAttribute('href',/view=listings&tab=meda&meda_view=create/);
 await page.keyboard.press('Tab');expect(await page.locator(':focus').evaluate(e=>getComputedStyle(e).outlineStyle)).toBe('solid');
 await page.locator('.market-footer a').last().scrollIntoViewIfNeeded();const last=await page.locator('.market-footer a').last().boundingBox(),bar=await page.locator('.shida-navigation').boundingBox();expect(last!.y+last!.height).toBeLessThanOrEqual(bar!.y);
});
test('public chrome navigation, keyboard clearance and excluded routes',async({page})=>{
 test.skip(baseline);await account(page);await page.setViewportSize({width:820,height:900});
 await page.goto('/fr/shida/meda/');await expect(page.locator('.market-language')).toBeEnabled();
 await expect(page.locator('.meda-search')).toHaveCount(0);
 await page.locator('.market-primary-nav').getByRole('link',{name:'Wenze',exact:true}).click();await expect(page.locator('.wz-public-tabs')).toBeVisible();
 await page.goBack();await expect(page.locator('.meda-access')).toBeVisible();await expect(page.locator('[data-public-marketplace]')).toHaveAttribute('data-public-marketplace','meda');
 await page.evaluate(()=>{Object.defineProperty(window.visualViewport,'height',{configurable:true,value:450});window.visualViewport!.dispatchEvent(new Event('resize'));});await expect(page.locator('.shida-navigation')).toBeHidden();
 await page.evaluate(()=>{Reflect.deleteProperty(window.visualViewport!,'height');window.visualViewport!.dispatchEvent(new Event('resize'));});await expect(page.locator('.shida-navigation')).toBeVisible();
 for(const route of ['/fr/shida/space/?view=listings&tab=meda','/fr/shida/register/']){await page.goto(route);await expect(page.locator('[data-public-marketplace]')).toHaveCount(0);}
});
