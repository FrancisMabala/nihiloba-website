import {test,expect,type Page,type TestInfo} from '@playwright/test';
import {accountSpaceCopy} from '../../app/lib/account-space-copy';
import {PERSONAL_SESSION_EVENT} from '../../app/lib/personal-session-browser';
import {wenzeUX} from '../../app/lib/wenze-ux-copy';

type Locale='fr'|'en'|'ln'|'sw';
const origin='https://localhost:3046';
const prefix=(locale:Locale)=>locale==='en'?'':`/${locale}`;
const pause=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
function gate(){let release!:()=>void;const held=new Promise<void>(resolve=>{release=resolve;});return {held,release};}
async function attach(info:TestInfo,name:string,value:unknown){await info.attach(name,{body:JSON.stringify(value,null,2),contentType:'application/json'});}
async function noOverflow(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}

async function spaceFixture(page:Page,options:{heldShops?:ReturnType<typeof gate>;heldNavigation?:ReturnType<typeof gate>;locale?:Locale}={}){
 const requests:{path:string;binding:string;at:number}[]=[],unexpected:string[]=[],errors:string[]=[];
 const state={binding:'a'.repeat(64),signedIn:true,servicesFail:false,jobName:'Ready job',shopName:'Loading QA shop',retryHold:null as Promise<void>|null};
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/api/**',async route=>{
  const request=route.request(),url=new URL(request.url()),path=url.pathname.replace(/\/$/,'');
  if(url.origin!==origin)return route.abort('blockedbyclient');
  const binding=request.headers()['x-shida-session']??'';requests.push({path:url.pathname+url.search,binding,at:Date.now()});
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply(state.signedIn?{binding:state.binding,user:{display_name:'Loading QA'}}:{},state.signedIn?200:401);
  if(path.endsWith('/security/navigation')){const response={can_manage:true,markets:['wenze'],organization_management:false,travel_profiles:[]};if(options.heldNavigation&&binding==='a'.repeat(64))await options.heldNavigation.held;return reply(response);}
  if(path.endsWith('/wenze/stores')){const name=state.shopName;if(options.heldShops&&binding==='a'.repeat(64))await options.heldShops.held;if(state.retryHold)await state.retryHold;return reply({stores:url.searchParams.get('archived')==='true'?[]:[{public_ref:'WNZ_loading',name,status:'active',visible:true,catalog_ready:true}]});}
  if(path.endsWith('/personal/restaurants'))return reply({items:[],total:0,actions:[]});
  if(path.endsWith('/personal/services'))return reply(state.servicesFail?{}:{profiles:[]},state.servicesFail?503:200);
  if(path.endsWith('/services/capabilities'))return reply({capabilities:['profile']});
  if(path.endsWith('/apartments/manage'))return reply({items:[],has_more:false});
  if(path.endsWith('/job-offer')){
   if(url.searchParams.get('kind')==='catalogue')return reply({rows:[{type:'job',reference:'JOB_loading',title:state.jobName,status:'open',posted_offer:true}]});
   return reply({progress:[{public_ref:'DRF_loading',revision:1,state:'active',values:{job:'Draft loading QA'},result_job_ref:null}],capacity:{used:0,limit:5},identity:{name:'Loading QA',city:'Kinshasa'}});
  }
  if(path.endsWith('/personal/transactions'))return reply({counts:{all:1,orders:1,requests:0,documents:0},items:[{id:'wenze:loading',kind:'wenze',category:'orders',reference:'WZO_loading',related_reference:null,title:'Loading QA order',status:'delivered',date:'2026-11-15T10:00:00Z',amount:'25000',currency:'CDF'}],documents:[],page:1,page_size:10,has_more:false});
  if(path.endsWith('/notifications/count'))return reply({unread_count:0});
  if(path.endsWith('/notifications'))return reply({items:[],next_cursor:null});
  if(path.endsWith('/support'))return reply({tickets:[],has_more:false,page:1});
  if(path.endsWith('/recovery-review')||path.endsWith('/deletion-review'))return reply({},403);
  if(path.endsWith('/cart'))return reply({items:[],total_items:0});
  unexpected.push(path);return reply({},404);
 });
 return {state,requests,unexpected,errors};
}

test('comparison: useful overview before held shops and one overlapping navigation read',async({page},info)=>{
 const shops=gate(),navigation=gate(),f=await spaceFixture(page,{heldShops:shops,heldNavigation:navigation});
 await page.setViewportSize({width:390,height:844});const started=Date.now();
 await page.goto('/fr/shida/space/?view=overview');
 await expect.poll(()=>f.requests.filter(r=>r.path.includes('/wenze/stores/')).length).toBe(2);
 await expect.poll(()=>f.requests.filter(r=>r.path.includes('/security/navigation/')).length).toBeGreaterThan(0);
 await pause(1600);
 const firstBeforeRelease=await page.locator('.activity-overview a[data-kind="job"]').isVisible();
 const overlappingNavigation=f.requests.filter(r=>r.path.includes('/security/navigation/')).length;
 const pending=await page.locator('.activity-overview [role="status"]').count();
 const elapsedBeforeRelease=Date.now()-started;
 await page.screenshot({path:info.outputPath('held-overview-390.png'),fullPage:true});
 shops.release();navigation.release();
 await expect(page.locator('.activity-overview')).toContainText('Loading QA shop');
 await expect(page.locator('.activity-overview a[data-kind="job"]')).toContainText('Ready job');
 await expect(page.locator('.activity-overview [role="status"]')).toHaveCount(0);
 await expect(page.locator('.activity-overview [role="alert"]')).toHaveCount(0);
 await attach(info,'comparison',{mode:process.env.SHIDA_LOADING_PHASE??'candidate',held_ms:1600,firstBeforeRelease,overlappingNavigation,pending,elapsedBeforeRelease,completeMs:Date.now()-started,requests:f.requests});
 if(process.env.SHIDA_LOADING_PHASE!=='baseline'){expect(firstBeforeRelease).toBe(true);expect(overlappingNavigation).toBe(1);expect(pending).toBe(1);}
 expect(f.errors).toEqual([]);expect(f.unexpected).toEqual([]);await noOverflow(page);
});

for(const [locale,width] of [['fr',360],['fr',390],['fr',1440],['en',390],['ln',390],['sw',390]] as const)test(`progressive truthful pending ${locale} ${width}`,async({page},info)=>{
 const shops=gate(),f=await spaceFixture(page,{heldShops:shops,locale});
 await page.setViewportSize({width,height:844});await page.goto(`${prefix(locale)}/shida/space/?view=overview`);
 await expect(page.locator('.activity-overview a[data-kind="job"]')).toContainText('Ready job');
 await expect(page.locator('.activity-overview [role="status"]')).toHaveText(accountSpaceCopy[locale].loading);
 await expect(page.locator('.activity-overview [role="alert"]')).toHaveCount(0);
 await expect(page.locator('.overview-welcome')).toHaveCount(0);await expect(page.locator('.my-listings')).toHaveCount(0);
 await noOverflow(page);await page.screenshot({path:info.outputPath(`pending-${locale}-${width}.png`),fullPage:true});
 shops.release();await expect(page.locator('.activity-overview')).toContainText('Loading QA shop');await expect(page.locator('.activity-overview [role="status"]')).toHaveCount(0);
 expect(f.errors).toEqual([]);expect(f.unexpected).toEqual([]);
});

async function select(page:Page,view:string,mobile:boolean){const nav=page.locator(mobile?'.space-section-selector':'.space-desktop-sections');if(mobile)await nav.locator('summary').click();await nav.locator(`a[href$="view=${view}"]`).click();}
for(const width of [390,1440])test(`client navigation content history and focus ${width}`,async({page},info)=>{
 const f=await spaceFixture(page);const documents:string[]=[];page.on('request',r=>{if(r.isNavigationRequest()&&r.resourceType()==='document')documents.push(r.url());});
 await page.setViewportSize({width,height:844});await page.goto('/fr/shida/space/?view=overview');await expect(page.locator('.activity-overview')).toContainText('Loading QA shop');
 const before=documents.length,mobile=width<700;
 // Observe whether the application consumed a modified anchor click, then stop
 // the browser default in this harness so no second tab/session is created.
 const modified=await page.locator('.space-desktop-sections a[href$="view=transactions"]').evaluate(anchor=>{
  let consumed:boolean|null=null;const stop=(event:MouseEvent)=>{consumed=event.defaultPrevented;event.preventDefault();};
  document.addEventListener('click',stop,{once:true});anchor.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,ctrlKey:true,button:0}));
  return {consumed,href:anchor.getAttribute('href')};
 });
 expect(modified).toEqual({consumed:false,href:'/fr/shida/space?view=transactions'});
 await select(page,'transactions',mobile);await expect(page.locator('.tx-row')).toContainText('Loading QA order');await expect(page).toHaveURL(/view=transactions/);
 await select(page,'support',mobile);await expect(page.locator('.assistance-filters button')).toHaveCount(3);await expect(page.locator('.activity-overview')).toHaveCount(0);
 await page.goBack();await expect(page.locator('.tx-row')).toContainText('Loading QA order');
 await page.goBack();await expect(page.locator('.activity-overview')).toContainText('Loading QA shop');
 await page.goForward();await expect(page.locator('.tx-row')).toContainText('Loading QA order');
 expect(documents.length).toBe(before);await noOverflow(page);
 if(mobile){const summary=page.locator('.space-section-selector summary');await summary.click();await page.keyboard.press('Escape');await expect(summary).toBeFocused();await expect(page.locator('.space-section-selector')).not.toHaveAttribute('open','');}
 await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.activeElement!==document.body)).toBe(true);
 await attach(info,'navigation',{documentRequests:documents,errors:f.errors,unexpected:f.unexpected});expect(f.errors).toEqual([]);expect(f.unexpected).toEqual([]);
});

test('partial failure retry and late old-account reads stay truthful',async({page},info)=>{
 const f=await spaceFixture(page);f.state.servicesFail=true;await page.goto('/fr/shida/space/?view=overview');
 await expect(page.locator('.activity-overview [role="alert"]')).toBeVisible();await expect(page.locator('.activity-overview [role="status"]')).toHaveCount(0);await expect(page.locator('.overview-welcome')).toHaveCount(0);
 f.state.servicesFail=false;await page.locator('.activity-overview [role="alert"] button').click();await expect(page.locator('.activity-overview')).toContainText('Loading QA shop');await expect(page.locator('.activity-overview [role="status"]')).toHaveCount(0);await expect(page.locator('.activity-overview [role="alert"]')).toHaveCount(0);
 await attach(info,'retry-focus',{activeElement:await page.evaluate(()=>({tag:document.activeElement?.tagName,role:document.activeElement?.getAttribute('role')}))});
 await expect(page.locator('.activity-overview > header > h2[tabindex="-1"]')).toBeFocused();
 f.state.signedIn=false;await page.evaluate(event=>window.dispatchEvent(new Event(event)),PERSONAL_SESSION_EVENT);
 await expect(page.locator('.space-sign-in')).toBeVisible();await expect(page.locator('.activity-overview')).toHaveCount(0);expect(f.errors).toEqual([]);
});

test('completed retry respects focus deliberately moved elsewhere',async({page})=>{
 const f=await spaceFixture(page);f.state.servicesFail=true;await page.setViewportSize({width:1440,height:900});await page.goto('/fr/shida/space/?view=overview');
 const retry=page.locator('.activity-overview [role="alert"] button');await expect(retry).toBeVisible();
 const held=gate();f.state.retryHold=held.held;f.state.servicesFail=false;await retry.click();
 const destination=page.locator('.space-desktop-sections a[href$="view=transactions"]');await destination.focus();await expect(destination).toBeFocused();
 await expect(page.locator('.activity-overview [role="status"]')).toHaveCount(1);held.release();
 await expect(page.locator('.activity-overview [role="status"]')).toHaveCount(0);await expect(page.locator('.activity-overview [role="alert"]')).toHaveCount(0);await expect(destination).toBeFocused();
 expect(f.errors).toEqual([]);
});

test('old account held responses cannot appear after account change',async({page})=>{
 const shops=gate(),navigation=gate(),f=await spaceFixture(page,{heldShops:shops,heldNavigation:navigation});await page.goto('/fr/shida/space/?view=overview');
 await expect.poll(()=>f.requests.filter(r=>r.path.includes('/wenze/stores/')).length).toBe(2);
 f.state.binding='b'.repeat(64);f.state.shopName='Second account shop';f.state.jobName='Second account job';
 await page.evaluate(event=>window.dispatchEvent(new Event(event)),PERSONAL_SESSION_EVENT);
 await expect(page.locator('.activity-overview')).toContainText('Second account shop');shops.release();navigation.release();
 await expect(page.locator('.activity-overview')).not.toContainText('Loading QA shop');await expect(page.locator('.activity-overview')).not.toContainText('Ready job');expect(f.errors).toEqual([]);
});

test('sidebar respects a real unsaved mission draft',async({page})=>{
 await spaceFixture(page);await page.setViewportSize({width:390,height:844});await page.goto('/fr/shida/space/?view=job-offer&intent=mission&draft=DRF_loading');
 const input=page.locator('.personal-offer-workspace input[type="text"]').first();await expect(input).toBeVisible();await input.fill('Edited unsaved mission');
 await select(page,'overview',true);const dialog=page.locator('dialog[open]');await expect(dialog).toBeVisible();await dialog.getByRole('button',{name:wenzeUX('fr','keep'),exact:true}).click();
 await expect(page).toHaveURL(/view=job-offer/);await expect(input).toHaveValue('Edited unsaved mission');
 await select(page,'overview',true);await dialog.getByRole('button',{name:wenzeUX('fr','discard'),exact:true}).click();await expect(page.locator('.activity-overview')).toContainText('Loading QA shop');
});

async function wenzeFixture(page:Page){
 const shop={public_ref:'WNZ_loading',name:'Loading QA shop',city:'Kinshasa',store_type:'online_and_physical',status:'active',revision:1,visible:'true',category:'other',catalog_ready:true,order_ready:true};
 const products=['low','out','untracked'].map((kind,i)=>({public_ref:`WNP_${kind}`,name:`Product ${kind}`,revision:1,category:'other',status:'active',visible:'true',price:'15000',currency:'CDF',available_stock:i===0?1:i===1?0:null,photos:[],variants:[]}));
 const requests:string[]=[],errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('shida-wenze-language','en'));
 await page.route('**/api/**',route=>{
  const url=new URL(route.request().url()),path=url.pathname.replace(/\/$/,'');if(url.origin!==origin)return route.abort('blockedbyclient');requests.push(url.pathname+url.search);
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Loading QA'}});
  if(path.endsWith('/security/navigation'))return reply({can_manage:true,markets:['wenze'],organization_management:false,travel_profiles:[]});
  if(path.endsWith('/stores'))return reply({stores:[shop],categories:[],currencies:['CDF','USD']});
  if(path.endsWith('/WNZ_loading'))return reply(shop);
  if(path.endsWith('/products'))return reply({products,total:3});
  if(path.endsWith('/WNP_low'))return reply(products[0]);
  if(path.endsWith('/inventory/stock'))return reply({items:products.map((p,i)=>({item_ref:`INV_${i}`,catalog_ref:p.public_ref,available:p.available_stock,reserved:0,on_hand:p.available_stock,is_low_stock:i===0,tracking_state:i===2?'untracked_physical':'tracked',unit:'piece'})),next_cursor:null});
  if(path.endsWith('/inventory/summary'))return reply({items_in_stock:1,low_stock_items:1,items_out_of_stock:1,untracked_items:1,uninitialized_items:0});
  if(path.endsWith('/today'))return reply({date:'2026-11-21',timezone:'Africa/Kinshasa',followers:4,new_followers:0,orders_today:0,reviews:{count:0,average:null},financial_access:true,currency_summaries:[],sold_items:[]});
  if(path.endsWith('/orders'))return reply({counts:{action_required:0,in_progress:0},orders:[],total:0,stores:[shop]});
  if(path.endsWith('/plan'))return reply({plan:'pro',active_products:3,active_product_limit:1000});
  if(path.endsWith('/updates'))return reply({updates:[],unread_count:0});
  if(path.endsWith('/options'))return reply({stores:[shop],categories:[],issues:{}});
  if(path.endsWith('/notifications/count'))return reply({unread_count:0});
  if(path.endsWith('/cart'))return reply({items:[],total_items:0});
  return reply({});
 });return {requests,errors};
}
for(const width of [390,1440])test(`Wenze Today keeps stock counts without duplicate parent catalogue ${width}`,async({page},info)=>{
 const f=await wenzeFixture(page);await page.setViewportSize({width,height:900});await page.goto('/shida/seller/wenze/?store=WNZ_loading');
 await expect(page.locator('.wt-dashboard')).toHaveAttribute('aria-busy','false');
 for(const kind of ['low_stock_items','items_out_of_stock','untracked_items'])await expect(page.locator(`[data-stock="${kind}"] dd`)).toHaveText('1');
 const catalogue=f.requests.filter(p=>/\/products\/?\?/.test(p));
 const parentCatalogue=catalogue.filter(p=>new URL(p,origin).searchParams.get('limit')==='20');
 const todayCatalogue=catalogue.filter(p=>new URL(p,origin).searchParams.get('limit')==='100');
 const summaries=f.requests.filter(p=>/\/inventory\/summary\/?(?:\?|$)/.test(p));
 await attach(info,'wenze-requests',{requests:f.requests,parentCount:parentCatalogue.length,todayCount:todayCatalogue.length,summaryCount:summaries.length,
  limitation:'Accepted development runtime: unchanged Today effect may replay twice. This does not establish production Today transport count or fix its transport deduplication.'});
 // The removed startup read belonged to the parent (limit20). Today still
 // needs its existing full catalogue, once per effect setup; dev replay is bounded.
 expect(parentCatalogue).toHaveLength(0);expect(todayCatalogue.length).toBeGreaterThanOrEqual(1);expect(todayCatalogue.length).toBeLessThanOrEqual(2);
 expect(catalogue.length).toBe(todayCatalogue.length);expect(summaries.length).toBe(todayCatalogue.length);await noOverflow(page);expect(f.errors).toEqual([]);
 await page.screenshot({path:info.outputPath(`wenze-today-${width}.png`),fullPage:true});
});
test('Wenze shop destination does not wait for product catalogue and product deep link still opens',async({page})=>{
 const f=await wenzeFixture(page);await page.goto('/shida/seller/wenze/?store=WNZ_loading&view=shop');
  await expect(page.locator('.wz-shop-header')).toBeVisible();expect(f.requests.filter(p=>/\/products\/?\?/.test(p))).toHaveLength(0);
 await page.goto('/shida/seller/wenze/?store=WNZ_loading&view=catalog&product=WNP_low&status=hidden&search=Product&offset=20');
 await expect(page.getByText('Product low',{exact:true}).first()).toBeVisible();expect(f.requests.some(p=>p.includes('/products/WNP_low'))).toBe(true);
 expect(f.requests.some(p=>/\/products\/?\?/.test(p)&&p.includes('status=hidden')&&p.includes('offset=20')&&p.includes('search=Product'))).toBe(true);expect(f.errors).toEqual([]);
});
