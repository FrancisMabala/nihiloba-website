import {test,expect,type BrowserContext} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {managedActivityCopy} from '../../app/lib/managed-activity-copy';

const route='/fr/shida/space/?view=management';
const evidence=process.env.ACTIVITIES_EVIDENCE_DIR;
async function signIn(context:BrowserContext,kind:string){
 await context.addCookies([{name:'nihiloba_personal_session',value:'activities-acceptance-'+kind+'-session',domain:'127.0.0.1',path:'/'}]);
}
for(const kind of ['empty','one','overview'])for(const width of [390,1536])test('account layout '+kind+' '+width,async({page,context})=>{
 await signIn(context,kind);await page.setViewportSize({width,height:width===390?844:960});
 await page.goto(route);
 const list=page.locator('.managed-activities'),cards=list.locator('article');
 await expect(list.getByRole('heading',{level:1})).toHaveText('Mes activités');
 await expect(cards).toHaveCount(kind==='empty'?0:kind==='one'?1:5);
 await expect(list.locator('.activities-error')).toHaveCount(0);
 if(kind==='empty')await expect(list.getByText(managedActivityCopy.fr.empty)).toBeVisible();
 else await expect(list.getByRole('heading',{name:kind==='one'?'Boutique (1)':'Boutiques (2)',exact:true})).toBeVisible();
 const create=list.getByRole('button',{name:'+ Nouvelle activité',exact:true});await expect(create).toBeVisible();
 const avatar=page.locator('button.market-avatar:visible').first();await expect(avatar).toBeInViewport();
 await avatar.click();await expect(avatar).toHaveAttribute('aria-expanded','true');await avatar.click();
 if(width===1536)await expect(page.locator('.space-sidebar [aria-current=page]')).toHaveText('Mes activités');
 if(kind==='overview'){
  const shopGroup=list.locator('.managed-group').first(),first=await shopGroup.locator('article').first().boundingBox(),second=await shopGroup.locator('article').nth(1).boundingBox();
  if(width===390)expect(second!.y).toBeGreaterThan(first!.y);else expect(second!.y).toBe(first!.y);
  await expect(list.getByRole('heading',{name:'Profil professionnel (1)',exact:true})).toBeVisible();
  await expect(list.getByRole('heading',{name:'Vendeur en boutique',exact:true})).toBeVisible();
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(evidence&&kind!=='empty'){mkdirSync(evidence,{recursive:true});await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:join(evidence,kind+'-'+width+'.png'),animations:'disabled'});}
 await create.focus();await page.keyboard.press('Enter');
 const creation=list.locator('#new-activity-options');await expect(creation).toBeVisible();
 const link=creation.locator('a[href$="/seller/wenze"]');await expect(link).toBeVisible();
 await link.click();await expect(page).toHaveURL(/\/fr\/shida\/seller\/wenze\/?$/);
 if(kind==='empty'){
  await page.locator('.wz-seller-setup button.button-primary').click();
  await expect(page.locator('.wb-create input').first()).toBeVisible();
 }
 await page.goto(route);
 await list.locator('.space-legacy-help summary').click();await list.locator('.space-legacy-help a').click();
 await expect(page).toHaveURL(/view=support/);
});
test('both shops open their own management and public storefront',async({page,context})=>{
 await signIn(context,'overview');
 for(const name of ['Boutique Mwinda','Maison Kivu']){
  await page.goto(route);
  const card=page.locator('.managed-cards article').filter({has:page.getByRole('heading',{name,exact:true})});
  await expect(card).toBeVisible();const ref=await card.getAttribute('data-ref');
  await card.getByRole('link',{name:/Gérer ma boutique/}).click();
  await expect(page.locator('.wz-store-selector select')).toHaveValue(ref!);await expect(page.locator('.wz-store-selector option:checked')).toHaveText(name);
  await page.goto(route);await card.getByRole('link',{name:/Voir la boutique/}).click();
  await expect(page).toHaveURL(url=>url.pathname.replace(/\/$/,'').endsWith('/wenze/'+ref));
  await expect(page.getByRole('heading',{name,exact:true}).first()).toBeVisible();
 }
});
test('draft preview uses owner permissions',async({page,context})=>{
 await signIn(context,'many');await page.goto(route);
 const card=page.locator('.managed-cards article').filter({has:page.getByRole('heading',{name:'Draft Malewa'})});
 await expect(card.getByRole('link')).toHaveCount(1);
 const preview=card.getByRole('button',{name:/Aperçu/});
 const result=page.waitForResponse(r=>r.url().includes('/menu-preview/'));
 await preview.click();expect((await result).status()).toBe(200);await expect(card.locator('.rst-menu-preview')).toBeVisible();
 const ref=await card.getAttribute('data-ref');
 await signIn(context,'empty');const session=await (await page.request.get('/api/shida/employment/session/')).json();
 const denied=await page.request.get('/api/shida/personal/restaurants/'+ref+'/menu-preview/?language=fr&page=1&page_size=5',{headers:{'X-Shida-Session':session.binding}});
 expect([403,404]).toContain(denied.status());
});
for(const locale of ['en','ln','sw'] as const)test('localized empty account '+locale,async({page,context})=>{
 await signIn(context,'empty');await page.goto((locale==='en'?'':'/'+locale)+'/shida/space/?view=management');
 await expect(page.locator('.managed-empty')).toHaveText(managedActivityCopy[locale].empty);
});
test('a partial response cannot show welcome',async({page,context})=>{
 await signIn(context,'empty');await page.route('**/api/shida/personal/security/navigation/**',r=>r.fulfill({status:503,json:{}}));
 await page.goto(route);await expect(page.locator('.activities-error')).toBeVisible();await expect(page.locator('.managed-empty')).toHaveCount(0);
});
test('all pages of establishments appear immediately',async({page,context})=>{
 await signIn(context,'one');await page.route('**/api/shida/personal/restaurants/**',r=>{
  const second=new URL(r.request().url()).searchParams.get('page')==='2';
  return r.fulfill({json:{items:Array.from({length:second?1:20},(_,i)=>({public_ref:'RST_'+(second?20:i),profile:{name:'Long establishment name '+(second?20:i)},status:'draft'})),total:21,actions:['create']}});
 });
 await page.goto(route);await expect(page.locator('.managed-cards article')).toHaveCount(22);await expect(page.getByRole('heading',{name:'Restaurants / Malewas (21)'})).toBeVisible();
});

test('a hidden boutique has an owner preview and no public link',async({page,context})=>{
 await signIn(context,'private');await page.goto(route);
 const card=page.locator('.managed-cards article').filter({has:page.getByRole('heading',{name:'Atelier privé'})});
 await expect(card.getByRole('link')).toHaveCount(1);
 const result=page.waitForResponse(r=>r.url().includes('/preview/'));
 await card.getByRole('button',{name:/Aperçu/}).click();expect((await result).status()).toBe(200);
 await expect(card.locator('.managed-preview')).toContainText('Atelier privé');
 const ref=await card.getAttribute('data-ref');
 await signIn(context,'empty');const session=await (await page.request.get('/api/shida/employment/session/')).json();
 const denied=await page.request.get('/api/shida/personal/wenze/stores/'+ref+'/preview/',{headers:{'X-Shida-Session':session.binding}});
 expect([403,404]).toContain(denied.status());
});
test('long names wrap and the account menu stays reachable',async({page,context})=>{
 await signIn(context,'one');
 const longName='Boutique '+'Mwinda'.repeat(32);
 await page.route('**/api/shida/personal/wenze/stores/**',r=>r.fulfill({json:{stores:new URL(r.request().url()).searchParams.get('archived')==='true'?[]:[{public_ref:'WNZ_wrap',name:longName,city:'Kinshasa',catalog_ready:true,status:'active',visible:'true'}]}}));
 await page.goto(route);await expect(page.getByRole('heading',{name:longName})).toBeVisible();
 for(const width of [320,360,390,600,768,820,1024,1280,1440,1920]){
   await page.setViewportSize({width,height:900});
   const avatar=page.locator('button.market-avatar:visible').first();await expect(avatar).toBeInViewport();
   const rect=await avatar.boundingBox();expect(rect!.x+rect!.width).toBeLessThanOrEqual(width);
   await avatar.click();await expect(avatar).toHaveAttribute('aria-expanded','true');await avatar.click();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});

test('named properties, hotels and transport use their authorized destinations',async({page,context})=>{
 await signIn(context,'properties');await page.goto(route);
 const cards=page.locator('.managed-cards article');
 await expect(cards).toHaveCount(4);
 for(const [name,kind] of [['Hôtel du fleuve','hotel'],['Transport Kivu','driver']]){
   const action=cards.filter({has:page.getByRole('heading',{name,exact:true})}).getByRole('link');
   await expect(action).toHaveCount(1);
   const command=new URL((await action.getAttribute('href'))!).searchParams.get('text');
   expect(command).toMatch(new RegExp('^shida '+kind+' [a-f0-9]{64} fr$'));
 }
 const home=cards.filter({has:page.getByRole('heading',{name:'Résidence du parc'})});
 await expect(home).toContainText('Kinshasa · Lemba');
 await home.getByRole('link',{name:/Gérer le logement/}).click();
 await expect(page.getByRole('heading',{name:/Résidence du parc.*APT_overview1/})).toBeVisible();
});
