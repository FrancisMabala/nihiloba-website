import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {productFixture} from './wenze-products-fixture';
import {productText} from '../../app/lib/wenze-products-copy';
import {creationText} from '../../app/lib/wenze-creation';
import {wenzeCopy} from '../../app/lib/wenze-copy';
import {wenzeUX} from '../../app/lib/wenze-ux-copy';
const evidence=process.env.SHIDA_MOBILE_EVIDENCE_DIR||'test-results/mobile-form-space';
const widths=[320,375,390,430,820,1440];
for(const width of widths)test(`product footer all steps ${width}`,async({page})=>{
 const f=await productFixture(page,{locale:'fr'});await page.setViewportSize({width,height:844});await page.goto(f.url);
 await page.getByRole('button',{name:productText('fr','add'),exact:true}).click();const w=page.locator('.wp-wizard'),footer=w.locator('.product-action-footer');
 const clear=async()=>{expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);if(width<1024){await expect(page.locator('.management-mobile-nav')).toBeHidden();const rect=await footer.boundingBox();expect(Math.abs(rect!.y+rect!.height-844)).toBeLessThan(2);expect(await w.evaluate(el=>parseFloat(getComputedStyle(el).paddingBottom))).toBeGreaterThan(rect!.height);}};
 await footer.locator('.seller-primary').click();await expect(w.locator('input:invalid:focus')).toHaveCount(1);await clear();
 await w.getByLabel(creationText('fr','name'),{exact:true}).fill('Lampe rechargeable avec une longue description pour contrôler la mise en page');
 await w.getByLabel(creationText('fr','sale'),{exact:true}).fill('25000');await w.locator('details').first().locator('summary').click();await clear();
 await w.getByLabel(creationText('fr','sale'),{exact:true}).focus();
 // Emulate a keyboard-reduced visual viewport without claiming a real device check.
 if(width===390){await page.evaluate(()=>{Object.defineProperty(visualViewport!,'height',{configurable:true,value:480});visualViewport!.dispatchEvent(new Event('resize'));});await expect.poll(async()=>Math.round((await footer.boundingBox())!.y+(await footer.boundingBox())!.height)).toBe(480);await page.evaluate(()=>{delete (visualViewport as unknown as Record<string,unknown>).height;visualViewport!.dispatchEvent(new Event('resize'));});}
 await page.screenshot({path:`${evidence}/product-info-${width}.png`,fullPage:true});
 await footer.getByRole('button',{name:wenzeCopy.fr.cancel,exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(w).toBeVisible();
 await footer.locator('.seller-primary').click();await clear();await expect(footer.locator('.seller-primary')).toBeDisabled();
 await w.locator('input[type=file]').setInputFiles({name:'test.webp',mimeType:'image/webp',buffer:readFileSync('public/images/wenze-boutique-market.webp')});await expect(w.locator('.wp-photo-grid img')).toHaveCount(1);
 await footer.locator('.seller-primary').click();await clear();await footer.locator('.seller-primary').click();await clear();await page.screenshot({path:`${evidence}/product-review-${width}.png`,fullPage:true});
 await footer.locator('.seller-primary').click();await expect(w).toHaveCount(0);await expect(page.locator('.wp-created')).toBeVisible();if(width<1024)await expect(page.locator('.management-mobile-nav')).toBeVisible();
 expect(f.writes.filter(row=>row.path.endsWith('/products'))).toHaveLength(1);expect(f.errors).toEqual([]);
});
for(const locale of ['en','ln','sw'] as const)test(`localized footer cancel ${locale}`,async({page})=>{
 const f=await productFixture(page,{locale});await page.setViewportSize({width:320,height:844});await page.goto(f.url);await page.getByRole('button',{name:productText(locale,'add'),exact:true}).click();const w=page.locator('.wp-wizard');await w.getByLabel(creationText(locale,'name'),{exact:true}).fill('Unsaved');await w.getByRole('button',{name:wenzeCopy[locale].cancel,exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:wenzeUX(locale,'discard'),exact:true}).click();await expect(w).toHaveCount(0);await expect(page.locator('.management-mobile-nav')).toBeVisible();expect(f.writes.filter(row=>row.path.endsWith('/products'))).toHaveLength(0);
});
async function spaceFixture(page:Page,count=2,denied=false){
 const shops=Array.from({length:count},(_,i)=>({public_ref:'WNZ_'+i,name:i?'Deuxième boutique':'Boutique avec un nom très long sans espace '+ 'A'.repeat(80),status:'active',visible:'true',catalog_ready:true}));
 await page.route('**/api/**',route=>{const path=new URL(route.request().url()).pathname.replace(/\/$/,'');const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Client Test'}});
  if(path.endsWith('/security/navigation'))return reply({can_manage:count>0,markets:count?['wenze','services','restaurants']:[],organization_management:false,travel_profiles:[]});
  if(path.endsWith('/wenze/stores'))return denied?reply({},403):reply({stores:shops}); // Both archived/current returning a duplicate must not duplicate cards.
  if(path.endsWith('/personal/restaurants'))return reply({items:count>1?[{public_ref:'RST_one',profile:{name:'Chez Mama'},status:'active'}]:[],total:count>1?1:0,actions:['create']});
  if(path.endsWith('/personal/services'))return reply({profiles:count>1?[{public_ref:'SVC_one',service_name:'Électricité',provider_ref:'PRV_one',professional_profile:{name:'Malamu'}},{public_ref:'SVC_two',service_name:'Plomberie',provider_ref:'PRV_two',professional_profile:{name:'Autre prestataire'}}]:[]});
  if(path.endsWith('/services/capabilities'))return reply({capabilities:['profile']});
  if(path.endsWith('/job-offer'))return reply({rows:[]});
  if(path.endsWith('/apartments/manage'))return reply({items:[],has_more:false});
  return reply({},404);
 });
}
for(const locale of ['fr','en','ln','sw'] as const)for(const width of widths)test(`space sections and management ${locale} ${width}`,async({page})=>{
 await spaceFixture(page);await page.setViewportSize({width,height:844});const prefix=locale==='en'?'':`/${locale}`;await page.goto(`${prefix}/shida/space?view=receipts`);
 const desktop=page.locator('.space-desktop-sections'),mobile=page.locator('.space-section-selector');
 expect(await desktop.locator('a').evaluateAll(rows=>rows.map(a=>a.getAttribute('href')))).toEqual(await mobile.locator('a').evaluateAll(rows=>rows.map(a=>a.getAttribute('href'))));
 if(width<=700){await expect(mobile).toBeVisible();await mobile.locator('summary').click();await expect(mobile.locator('a[aria-current]')).toHaveAttribute('href',`${prefix}/shida/space?view=transactions`);await page.keyboard.press('Escape');await expect(mobile.locator('summary')).toBeFocused();await expect(page.locator('.shida-navigation a[aria-current]')).toHaveAttribute('href',`${prefix}/shida/space`);await mobile.locator('summary').click();await page.screenshot({path:`${evidence}/space-${locale}-${width}.png`,fullPage:true});await mobile.locator('a').nth(1).click();await expect(page).toHaveURL(/view=management/);await expect(page.locator('.shida-navigation a[aria-current]')).toHaveAttribute('href',`${prefix}/shida/space`);await page.goBack();await expect(mobile.locator('a[aria-current]')).toHaveAttribute('href',`${prefix}/shida/space?view=transactions`);}
 else{await expect(desktop).toBeVisible();await expect(mobile).toBeHidden();}
 await page.goto(`${prefix}/shida/space?view=manage`);await expect(page.locator('.management-space-cards>a')).toHaveCount(5);await expect(page.locator('.management-space-cards')).not.toContainText('Appartements');await expect(page.locator('.management-space-cards>a').nth(1)).toHaveAttribute('href',`${prefix}/shida/seller/wenze?store=WNZ_1`);if(width<=700)await expect(page.locator('.shida-navigation a[aria-current]')).toHaveAttribute('href',`${prefix}/shida/space?view=manage`);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);if(locale==='fr')await page.screenshot({path:`${evidence}/manage-${width}.png`,fullPage:true});
});
test('empty, one shop and denied management source',async({page})=>{
 await spaceFixture(page,0);await page.goto('/fr/shida/space?view=manage');await expect(page.getByText('Vous n’avez pas encore d’espace de gestion.')).toBeVisible();await expect(page.locator('.management-space-cards>a')).toHaveCount(0);await page.unrouteAll();await spaceFixture(page,1);await page.reload();await expect(page.locator('.management-space-cards>a')).toHaveCount(1);await page.unrouteAll();await spaceFixture(page,2,true);await page.reload();await expect(page.locator('.management-space-selector [role=alert]')).toBeVisible();await expect(page.locator('.management-space-cards>a')).toHaveCount(3);await expect(page.locator('.management-space-cards a[href*="wenze"]')).toHaveCount(0);
});

test('orientation and enlarged text keep form actions usable',async({page})=>{
 const f=await productFixture(page,{locale:'fr'});await page.setViewportSize({width:390,height:844});await page.goto(f.url);await page.getByRole('button',{name:productText('fr','add'),exact:true}).click();
 await page.addStyleTag({content:'.product-action-footer button{font-size:24px!important}'});const w=page.locator('.wp-wizard'),bar=w.locator('.product-action-footer');await page.setViewportSize({width:844,height:390});await bar.locator('.seller-primary').click();
 await expect(w.locator('input:invalid:focus')).toHaveCount(1);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await w.evaluate(el=>parseFloat(getComputedStyle(el).paddingBottom))).toBeGreaterThan((await bar.boundingBox())!.height);const focused=await w.locator('input:focus').boundingBox();expect(focused!.y+focused!.height).toBeLessThan((await bar.boundingBox())!.y);
});
