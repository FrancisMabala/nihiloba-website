import {test,expect,type Page} from '@playwright/test';
import {mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {restaurantPanelFixture} from './restaurant-panel-fixtures';
import {managementNavigation} from './restaurant-management-navigation';
import {restaurantPanelRecoveryCopy} from '../../app/lib/restaurant-panel-recovery-copy';
import {managementCopy} from '../../app/lib/restaurant-management-copy';
import {sellerDesignCopy} from '../../app/lib/restaurant-seller-design-copy';
import {workflowText} from '../../app/lib/restaurant-workflow-copy';
import {workText} from '../../app/lib/restaurant-work-copy';
import {restaurantText} from '../../app/lib/restaurant-seller-copy';
import {restaurantPath} from '../../app/lib/restaurant-i18n';

type Locale=keyof typeof restaurantPanelRecoveryCopy;
const destinations=[
 {tab:'orders',marker:'rst-orders-screen',name:(locale:Locale)=>workText(locale,'orders')},
 {tab:'items',marker:'rst-menu-workspace',name:(locale:Locale)=>sellerDesignCopy[locale].menu},
 {tab:'daily',marker:'rst-daily',name:(locale:Locale)=>workflowText(locale,'finances')},
] as const;

function chunkFor(marker:string){
 const root=join(process.cwd(),'.next','static','chunks');
 const matches=readdirSync(root,{recursive:true}).map(String).filter(file=>file.endsWith('.js')&&readFileSync(join(root,file),'utf8').includes(marker));
 expect(matches,`unique production panel chunk for ${marker}`).toHaveLength(1);
 return '/_next/static/chunks/'+matches[0].replaceAll('\\','/');
}

async function today(page:Page,locale:Locale='fr'){
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/restaurants/?establishment=RST_0&tab=today`);
 await expect(page.locator('.rst-ops-updated')).toBeVisible();
 await expect(page.locator('.rst-today-refresh')).toBeEnabled();
}
async function failDownload(page:Page,marker='rst-orders-screen',status=0){
 const path=chunkFor(marker),state={attempts:0,fail:true,release:null as null|Promise<void>};
 await page.route('**'+path,async route=>{
  state.attempts++;
  if(state.release)await state.release;
  if(!state.fail)return route.continue();
  return status?route.fulfill({status,contentType:'text/plain',body:'Synthetic unavailable asset'}):route.abort('failed');
 });
 return state;
}
async function shell(page:Page){
 await expect(page.locator('.wz-header')).toBeVisible();
 await expect(page.locator('.rst-restaurant-identity:visible strong').first()).toContainText('Chez maman');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}

async function failLandingDownload(page:Page){
 const state={fail:true};
 // SellerLanding also appears in other marketplace entry bundles. Inspect the
 // requested local asset instead of assuming its marker is unique on disk.
 await page.route((process.env.ROLLOUT_BASE_URL??'http://127.0.0.1:3017')+'/_next/static/chunks/**',async route=>{
  if(!new URL(route.request().url()).pathname.endsWith('.js'))return route.fallback();
  const response=await route.fetch();
  if(state.fail&&(await response.text()).includes('ssl-entry'))return route.abort('failed');
  return route.fulfill({response});
 });
 return state;
}

if(process.env.PANEL_RECOVERY_BASELINE==='1')for(const width of [390,1440])test(`baseline actual Orders chunk failure ${width}`,async({page})=>{
 await restaurantPanelFixture(page);await page.setViewportSize({width,height:900});
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/fr/shida/seller/restaurants/?establishment=RST_0&tab=today');
 await expect(page.locator('.rst-ops-updated')).toBeVisible();
 const path=chunkFor('rst-orders-screen');let attempts=0;let fail=true;
 await page.route('**'+path,route=>{attempts++;return fail?route.abort('failed'):route.continue();});
 await page.locator('.rst-metric-incoming > button').click();
 await expect.poll(()=>attempts).toBe(1);
 await expect(page.getByText(/This page couldn.t load/)).toBeVisible();
 fail=false;await page.waitForTimeout(1000);
 await expect(page.locator('.rst-management')).toHaveCount(0);
 const output=process.env.PERF_OUTPUT!;mkdirSync(output,{recursive:true});
 await page.screenshot({path:join(output,`download-failed-${width}.png`),fullPage:true});
 const observation={width,path,attempts,errors,headerVisible:await page.locator('.wz-header').count(),workspaceVisible:await page.locator('.rst-management').count(),retryButtons:await page.getByRole('button').allTextContents(),restoredDownloadDidNotRecover:await page.getByText(/This page couldn.t load/).isVisible()};
 writeFileSync(join(output,`download-failed-${width}.json`),JSON.stringify(observation,null,2));
 await page.reload();await expect(page.locator('.rst-orders-screen')).toBeVisible();
});

// Next 16.4.6 Turbopack already retries one failed asset internally (200–600ms).
// The application must not add retries; assert the exact runtime-specific bound.
const requestsPerFailure=readdirSync('.next/static/chunks').some(file=>file.startsWith('turbopack-'))?2:1;
if(process.env.PANEL_RECOVERY_BASELINE!=='1'){
 const publicHelp={fr:'Réessayez ou revenez au marché.',en:'Try again or return to the marketplace.',ln:'Meka lisusu to zonga na zando.',sw:'Jaribu tena au rudi sokoni.'};
 for(const locale of ['fr','en','ln','sw'] as const)for(const width of [390,1440])test(`signed-out recovery returns to the public marketplace ${locale} ${width}`,async({page})=>{
  const account=await restaurantPanelFixture(page);account.logout=true;
  await page.setViewportSize({width,height:900});
  const state=await failLandingDownload(page);
  const entry=`${locale==='en'?'':`/${locale}`}/shida/seller/restaurants/`;
  await page.goto(entry);
  const recovery=page.locator('.rst-panel-recovery'),copy=restaurantPanelRecoveryCopy[locale];
  await expect(recovery).toContainText(publicHelp[locale]);
  await expect(recovery).not.toContainText(copy.help);
  await expect(recovery).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(process.env.PERF_OUTPUT){
   mkdirSync(process.env.PERF_OUTPUT,{recursive:true});
   await page.screenshot({path:join(process.env.PERF_OUTPUT,`signed-out-recovery-${locale}-${width}.png`),fullPage:true});
  }
  state.fail=false;
  await recovery.getByRole('button',{name:copy.retry,exact:true}).click();
  await expect(page.locator('.ssl-entry')).toBeVisible();
  await expect(page.locator('.ssl-browse')).toHaveAttribute('href',new RegExp('^'+restaurantPath(locale)+'/?$'));
  await expect(page).toHaveURL(new RegExp(entry+'$'));
  // A fresh document makes the lazy asset unavailable again, so the recovery
  // action itself must reach the existing public destination in this locale.
  state.fail=true;await page.reload();
  await expect(recovery).toContainText(publicHelp[locale]);
  await recovery.getByRole('button',{name:copy.back,exact:true}).click();
  await expect(page).toHaveURL(new RegExp(restaurantPath(locale)+'/?$'));
  await expect(page.locator('.rst-panel-recovery')).toHaveCount(0);
 });

 for(const width of [390,1440])for(const destination of destinations)test(`failed ${destination.tab} download retries in place ${width}`,async({page})=>{
  await restaurantPanelFixture(page);await page.setViewportSize({width,height:900});
  const scripts:string[]=[];page.on('request',request=>{if(request.resourceType()==='script')scripts.push(new URL(request.url()).pathname);});
  await today(page);expect(scripts).not.toContain(chunkFor(destination.marker));
  const state=await failDownload(page,destination.marker);
  await managementNavigation(page,destination.name('fr'));
  const recovery=page.locator('.rst-panel-recovery');
  await expect(recovery).toContainText(restaurantPanelRecoveryCopy.fr.title);
  await expect(recovery).toContainText(restaurantPanelRecoveryCopy.fr.help);
  await expect(recovery).not.toContainText(restaurantPanelRecoveryCopy.fr.publicHelp);
  await expect(recovery).toBeFocused();await shell(page);
  await expect(recovery).not.toContainText(/chunk|\.js|offline|hors ligne/i);
  await page.waitForTimeout(800);expect(state.attempts).toBe(requestsPerFailure);
  if(process.env.PERF_OUTPUT&&destination.tab==='orders'){
   mkdirSync(process.env.PERF_OUTPUT,{recursive:true});
   await page.screenshot({path:join(process.env.PERF_OUTPUT,`download-failed-${width}.png`),fullPage:true});
  }
  state.fail=false;await recovery.getByRole('button',{name:'Réessayer',exact:true}).click();
  await expect(page.locator(`.${destination.marker}`)).toBeVisible();
  await expect(recovery).toHaveCount(0);expect(state.attempts).toBe(requestsPerFailure+1);
  if(destination.tab==='items')await expect(page.locator('.rst-menu-workspace')).toContainText('Pondu, poisson et accompagnement au choix');
  if(destination.tab==='daily')await expect(page.locator('[data-metric=received] strong')).toContainText('3');
  if(destination.tab==='orders')await expect(page.locator('.rst-orders-screen')).toContainText('Aucune commande à traiter');
  await managementNavigation(page,managementCopy.fr.work);await expect(page.locator('.rst-ops-updated')).toBeVisible();
  await managementNavigation(page,destination.name('fr'));await expect(page.locator(`.${destination.marker}`)).toBeVisible();
  expect(state.attempts).toBe(requestsPerFailure+1);await shell(page);
 });

 for(const locale of ['en','ln','sw'] as const)for(const width of [390,1440])test(`localized keyboard recovery ${locale} ${width}`,async({page})=>{
  await restaurantPanelFixture(page);await page.setViewportSize({width,height:900});await today(page,locale);
  const state=await failDownload(page);await managementNavigation(page,workText(locale,'orders'));
  const recovery=page.locator('.rst-panel-recovery'),copy=restaurantPanelRecoveryCopy[locale];
  await expect(recovery).toContainText(copy.title);await expect(recovery).toBeFocused();
  await expect(recovery).toContainText(copy.help);await expect(recovery).not.toContainText(copy.publicHelp);
  await page.keyboard.press('Tab');await expect(recovery.getByRole('button',{name:copy.retry,exact:true})).toBeFocused();
  await page.keyboard.press('Enter');await expect(recovery).toContainText(copy.reloadHelp);
  await expect(recovery.getByRole('button',{name:copy.reload,exact:true})).toBeVisible();
  state.fail=false;await recovery.getByRole('button',{name:copy.retry,exact:true}).click();await expect(page.locator('.rst-orders-screen')).toBeVisible();
  expect(state.attempts).toBe(requestsPerFailure*2+1);await shell(page);
 });

 test('repeated unavailable asset has no request storm and offers deliberate reload',async({page})=>{
  await restaurantPanelFixture(page);await page.setViewportSize({width:390,height:900});await today(page);
  const state=await failDownload(page,'rst-orders-screen',404);await managementNavigation(page,'Commandes');
  const recovery=page.locator('.rst-panel-recovery');await expect(recovery).toBeVisible();
  await recovery.getByRole('button',{name:'Réessayer',exact:true}).click();
  await expect(recovery.getByRole('button',{name:'Recharger la page',exact:true})).toBeVisible();
  await expect(recovery).toContainText('modifications non enregistrées');
  await page.waitForTimeout(1200);expect(state.attempts).toBe(requestsPerFailure*2);await shell(page);
  // Represents a document reload obtaining assets from the current deployment;
  // this is not a production rolling-deploy/CDN test.
  state.fail=false;let documents=0;page.on('request',request=>{if(request.resourceType()==='document')documents++;});
  await recovery.getByRole('button',{name:'Recharger la page',exact:true}).click();
  await expect(page.locator('.rst-orders-screen')).toBeVisible();expect(documents).toBe(1);
  await expect(page).toHaveURL(/establishment=RST_0.*tab=orders/);
 });

 test('leave a failed destination without downloading it again',async({page})=>{
  await restaurantPanelFixture(page);await page.setViewportSize({width:390,height:900});await today(page);
  const state=await failDownload(page);await managementNavigation(page,'Commandes');
  await page.locator('.rst-panel-recovery').getByRole('button',{name:'Aujourd’hui',exact:true}).click();
  await expect(page.locator('.rst-ops-updated')).toBeVisible();
  await managementNavigation(page,'Mon menu');await expect(page.locator('.rst-menu-workspace')).toContainText('Pondu');
  await managementNavigation(page,'Commandes');await expect(page.locator('.rst-panel-recovery')).toBeVisible();
  expect(state.attempts).toBe(requestsPerFailure);
 });

 test('counter basket survives another panel failure and cancelled full reload',async({page})=>{
  await restaurantPanelFixture(page);await page.setViewportSize({width:1440,height:900});
  const basket={basket_ref:'RBA_draft',revision:1,quote:null,quote_ref:null,order_ref:null};let creates=0;
  await page.route('**/RST_0/pos/**',route=>{
   const p=new URL(route.request().url()).pathname.replace(/\/$/,'');
   if(p.endsWith('/pos'))return route.fulfill({json:{intake_released:true,items:[{public_ref:'RMI_1',name:'Pondu',pricing_model:'UNIT_PRICED',currency:'CDF',unit_price:'3000',sale_unit_label:'assiette',availability:'available',presentation:'fixed_dish',counter_options:{portions:[],extras:[]}}],recent:[]}});
   if(p.endsWith('/counter-unpaid'))return route.fulfill({json:{items:[],total:0,has_more:false}});
   if(p.endsWith('/counter-baskets')){if(route.request().method()==='POST'){creates++;return route.fulfill({json:basket});}return route.fulfill({json:{items:[],total:0,has_more:false}});}
   if(p.endsWith('/RBA_draft'))return route.fulfill({json:basket});
   return route.fallback();
  });
  await today(page);await managementNavigation(page,'Vendre');
  await page.getByRole('button',{name:'Ajouter Pondu',exact:true}).click();
  await page.locator('.rst-selling-line input').fill('3');
  const state=await failDownload(page);await managementNavigation(page,'Commandes');
  const recovery=page.locator('.rst-panel-recovery');await expect(recovery).toBeVisible();
  await expect(page.locator('.rst-selling-line input')).toHaveValue('3');
  await recovery.getByRole('button',{name:'Réessayer',exact:true}).click();
  await recovery.getByRole('button',{name:'Recharger la page',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('Quitter ce formulaire');
  await page.getByRole('button',{name:'Rester ici',exact:true}).click();
  await expect(recovery.getByRole('button',{name:'Réessayer',exact:true})).toBeEnabled();
  state.fail=false;await recovery.getByRole('button',{name:'Réessayer',exact:true}).click();
  await expect(page.locator('.rst-orders-screen')).toBeVisible();
  await managementNavigation(page,'Vendre');await expect(page.locator('.rst-selling-line input')).toHaveValue('3');
  expect(creates).toBe(1);
  await page.locator('.wz-header .market-avatar').click();
  await page.locator('.auth-account-menu').getByRole('button',{name:/déconnexion|déconnecter/i}).click();
  await expect(page.getByRole('dialog')).toContainText('Quitter ce formulaire');
  await page.getByRole('button',{name:'Rester ici',exact:true}).click();
  await expect(page.locator('.rst-selling-line input')).toHaveValue('3');
 });

 for(const action of ['navigate','switch','logout'] as const)test(`late download completion cannot undo ${action}`,async({page})=>{
  const account=await restaurantPanelFixture(page,2);await page.setViewportSize({width:390,height:900});await today(page);
  const state=await failDownload(page);await managementNavigation(page,'Commandes');
  const recovery=page.locator('.rst-panel-recovery');await expect(recovery).toBeVisible();
  let release!:()=>void;state.release=new Promise<void>(resolve=>{release=resolve;});state.fail=false;
  try{
   await recovery.getByRole('button',{name:'Réessayer',exact:true}).click();
   await expect.poll(()=>state.attempts).toBe(requestsPerFailure+1);await expect(page.locator('.rst-panel-loading')).toBeVisible();
   if(action==='navigate')await managementNavigation(page,'Aujourd’hui');
   if(action==='switch'){
    await page.locator('.rst-restaurant-identity:visible button').click();
    await page.locator('.rst-grid .rst-card').filter({has:page.getByRole('heading',{name:'Restaurant 2',exact:true})}).getByRole('button').click();
   }
   if(action==='logout'){
    await page.locator('.wz-header .market-avatar').click();
    await page.locator('.auth-account-menu').getByRole('button',{name:/déconnexion|déconnecter/i}).click();
    await expect.poll(()=>account.logout).toBe(true);
   }
   release();await page.waitForTimeout(300);
   await expect(page.locator('.rst-orders-screen')).toHaveCount(0);
   if(action==='logout')await expect(page.getByText(managementCopy.fr.signedOut,{exact:true})).toBeVisible();
   else {await expect(page.locator('.rst-today')).toBeVisible();if(action==='switch')await expect(page.locator('.management-restaurant-context')).toContainText('Restaurant 2');}
  }finally{release();}
 });

 test('narrow enlarged-text recovery controls remain reachable',async({page})=>{
  await restaurantPanelFixture(page);await page.setViewportSize({width:320,height:900});await today(page);
  await page.addStyleTag({content:'html{font-size:32px!important}'});
  await failDownload(page);await managementNavigation(page,'Commandes');
  const recovery=page.locator('.rst-panel-recovery');await expect(recovery).toBeVisible();await shell(page);
  for(const button of await recovery.getByRole('button').all()){
   await button.scrollIntoViewIfNeeded();const box=await button.boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);
   const nav=await page.locator('.management-mobile-nav').boundingBox();expect(box!.y+box!.height).toBeLessThanOrEqual(nav!.y);
  }
 });

 test('application rendering defects are not disguised as recoverable downloads',async({page})=>{
  await restaurantPanelFixture(page);await today(page);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**'+chunkFor('rst-orders-screen'),async route=>{
   const response=await route.fetch(),body=await response.text();
   // Inject a render exception into the actual compiled Orders function, after a
   // successful script download. This is deliberately not an API-error fixture.
   const signature=/function(?: [\w$]+)?\(\{path:[^}]+onIntake:[^}]+\}\)\{/g;
   expect(body.match(signature)).toHaveLength(1);
   await route.fulfill({response,body:body.replace(signature,'$&throw new Error("Synthetic panel render defect");')});
  });
  await managementNavigation(page,'Commandes');
  await expect(page.getByRole('heading',{name:/This page couldn.t load/})).toBeVisible();
  await expect(page.locator('.rst-panel-recovery')).toHaveCount(0);
  expect(errors).toContain('Synthetic panel render defect');
 });

 test('shared editor remains mounted when its hours module fails',async({page})=>{
  await restaurantPanelFixture(page);await page.setViewportSize({width:1440,height:900});await today(page);
  await managementNavigation(page,sellerDesignCopy.fr.hours);
  await expect(page.locator('.rst-hours-overview')).toBeVisible();
  const state=await failDownload(page,'rst-week-editor');
  await page.locator('.rst-hours-overview').getByRole('button',{name:restaurantText('fr','edit'),exact:true}).click();
  const editor=page.locator('.rst-editor'),recovery=page.locator('.rst-panel-recovery');
  await expect(recovery).toBeVisible();await expect(editor).toBeVisible();
  await editor.getByRole('button',{name:restaurantText('fr','addClosure'),exact:true}).click();
  const field=editor.locator('input[type="datetime-local"]').first();
  await field.fill('2026-12-01T09:00');
  state.fail=false;await recovery.getByRole('button',{name:'Réessayer',exact:true}).click();
  await expect(page.locator('.rst-week-editor')).toBeVisible();
  await expect(field).toHaveValue('2026-12-01T09:00');
  await page.locator('#restaurant-navigation').getByRole('button',{name:'Aujourd’hui',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button',{name:'Rester ici',exact:true}).click();
  await expect(field).toHaveValue('2026-12-01T09:00');
 });
}
