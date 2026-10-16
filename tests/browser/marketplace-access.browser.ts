import {test,expect,type Page} from '@playwright/test';

type Market='services'|'restaurants'|'wenze';
const markets:Market[]=['services','restaurants','wenze'];
const setupTitles={services:'Start offering services',restaurants:'Start selling with Restaurants & Malewa',wenze:'Start selling on Wenze'};
const nav={services:'.svc-sidebar',restaurants:'.rst-management-nav',wenze:'.rst-management-nav'};
const store={public_ref:'WNS_access',revision:1,name:'My Wenze shop',status:'active',visible:'true',category:'other',city:'Kinshasa'};
const restaurant={public_ref:'RST_access',revision:'2026-10-16T10:00:00+00:00',status:'draft',profile:{name:'My restaurant',food_business_type:'restaurant',timezone_name:'Africa/Kinshasa'},menu_currency:null,missing_publication_fields:[],actions:['read','edit','menu']};
const provider={public_ref:'SVC_access',provider_ref:'SVI_access',name:'My provider profile',service_name:'My service',category:'repair_maintenance',is_active:'yes',revision:1,missing_fields:[],packages:[],rating:{average:null,count:0},publication_origin:'pilot',requests_enabled:false};
const capabilities=['profile','reservations','messages','manual_journal','basic_totals','operational_reports','financial_reports','quote_templates','bill_templates','bills'];

async function fixture(page:Page,market:Market|null=null){
 const state={market,session:true,binding:'a'.repeat(64),failure:0,malformed:false,calls:[] as string[],writes:[] as string[]};
 await page.route('**/api/shida/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.replace(/\/$/,'');
  state.calls.push(path);if(req.method()!=='GET')state.writes.push(path);
  if(path==='/api/shida/employment/session')return route.fulfill({status:state.session?200:401,json:state.session?{binding:state.binding,user:{display_name:'Same SHIDA user'}}:{}});
  if(path==='/api/shida/employment/logout'){state.session=false;return route.fulfill({json:{authenticated:false}});}
  if(!path.startsWith('/api/shida/personal/'))return route.fulfill({status:404,json:{detail:'cart_not_found'}});
  if(req.headers()['x-shida-session']!==state.binding)return route.fulfill({status:401,json:{}});
  if(state.failure)return route.fulfill({status:state.failure,json:{}});
  if(state.malformed)return route.fulfill({json:{}});
  const reply=(json:unknown)=>route.fulfill({json});
  if(path==='/api/shida/personal/services/capabilities')return reply({capabilities,access_policy:'pilot'});
  if(path==='/api/shida/personal/services'){
   if(req.method()==='POST'){state.market='services';return reply(provider);}
   return reply({profiles:state.market==='services'?[provider]:[]});
  }
  if(path==='/api/shida/personal/restaurants'){
   if(req.method()==='POST'){state.market='restaurants';return reply(restaurant);}
   return reply({items:state.market==='restaurants'?[restaurant]:[],total:state.market==='restaurants'?1:0,page:1,page_size:20,actions:['create']});
  }
  if(path==='/api/shida/personal/wenze/stores')return reply({stores:state.market==='wenze'?[store]:[],categories:[{code:'other',labels:{en:'Other',fr:'Autre',ln:'Mosusu',sw:'Nyingine'}}]});
  if(path.endsWith('/RST_access'))return reply(restaurant);
  if(path.endsWith('/capabilities'))return reply({capabilities:[]});
  if(path.endsWith('/products'))return reply({products:[],total:0});
  if(path.endsWith('/reviews'))return reply({reviews:[]});
  if(path.endsWith('/plan'))return reply({plan:'free'});
  return route.fulfill({status:403,json:{detail:'unavailable'}});
 });
 return state;
}

for(const owned of [null,...markets])test(`management is isolated for ${owned??'a regular user'}`,async({page})=>{
 const state=await fixture(page,owned);
 for(const market of markets){
  state.calls=[];
  await page.goto(`/shida/seller/${market}?view=${market==='services'?'finance':'reports'}`);
  if(market===owned){await expect(page.locator(nav[market])).toBeAttached();await expect(page.getByRole('heading',{name:setupTitles[market],exact:true})).toHaveCount(0);}
  else{
   await expect(page.getByRole('heading',{name:setupTitles[market],exact:true})).toBeVisible();
   await expect(page.locator(nav[market])).toHaveCount(0);
   expect(state.calls.filter(path=>path.includes('/personal/'))).toEqual(expect.arrayContaining([market==='services'?'/api/shida/personal/services':market==='restaurants'?'/api/shida/personal/restaurants':'/api/shida/personal/wenze/stores']));
   expect(state.calls.some(path=>/transactions|\/orders|\/inventory|\/reports|\/templates/.test(path))).toBe(false);
  }
 }
 expect(state.writes).toEqual([]);
});

for(const market of markets){
 test(`${market}: signed-out visitors must authenticate before profile discovery`,async({page})=>{
  const state=await fixture(page);state.session=false;
  await page.goto(`/shida/seller/${market}`);if(market==='services')await expect(page.getByRole('button',{name:'Continue with WhatsApp',exact:true})).toBeVisible();else await expect(page.locator('.rst-signin')).toBeVisible();
  await expect(page.locator(nav[market])).toHaveCount(0);expect(state.calls.some(path=>path.includes('/personal/'))).toBe(false);
 });
 for(const failure of [403,503,'malformed'] as const)test(`${market}: ${failure} discovery stays closed`,async({page})=>{
  const state=await fixture(page);if(failure==='malformed')state.malformed=true;else state.failure=failure;
  await page.goto(`/shida/seller/${market}`);await expect(page.getByRole('alert').first()).toBeVisible();
  await expect(page.locator(nav[market])).toHaveCount(0);await expect(page.getByRole('heading',{name:setupTitles[market],exact:true})).toHaveCount(0);
  expect(state.writes).toEqual([]);
 });
 test(`${market}: changing to a regular account removes management`,async({page})=>{
  const state=await fixture(page,market);await page.goto(`/shida/seller/${market}`);await expect(page.locator(nav[market])).toBeAttached();
  state.market=null;state.binding='b'.repeat(64);
  await page.evaluate(()=>window.dispatchEvent(new Event('shida-personal-session-changed')));
  await expect(page.getByRole('heading',{name:setupTitles[market],exact:true})).toBeVisible();await expect(page.locator(nav[market])).toHaveCount(0);
 });
}

for(const market of ['services','restaurants'] as const)test(`${market}: explicit setup opens only after the user chooses it`,async({page})=>{
 const state=await fixture(page);await page.goto(`/shida/seller/${market}`);
 await expect(page.getByRole('heading',{name:setupTitles[market],exact:true})).toBeVisible();await expect(page.locator('form')).toHaveCount(0);
 await page.getByRole('button',{name:market==='services'?'Create my provider profile':'Create my restaurant or malewa',exact:true}).click();
 await expect(page.locator(nav[market])).toHaveCount(0);
 if(market==='services'){
  await page.getByLabel('Public provider name',{exact:true}).fill('My provider profile');await page.getByLabel('Service name',{exact:true}).fill('My service');await page.getByRole('combobox',{name:'Category',exact:true}).selectOption('repair_maintenance');
  await page.getByRole('button',{name:'Create my service',exact:true}).click();
 }else{
  await page.getByLabel('Name',{exact:true}).fill('My restaurant');await page.getByRole('button',{name:'Create private draft',exact:true}).click();
 }
 await expect(page.locator(nav[market])).toBeAttached();expect(state.writes).toHaveLength(1);
});

for(const market of markets)test(`${market}: management waits for ownership discovery`,async({page})=>{
 await fixture(page);let started=false;let release!:()=>void;
 const pending=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/api/shida/personal/**',async route=>{started=true;await pending;return route.fallback();});
 await page.goto(`/shida/seller/${market}?view=reports`);await expect.poll(()=>started).toBe(true);
 await expect(page.locator(nav[market])).toHaveCount(0);await expect(page.getByRole('heading',{name:setupTitles[market],exact:true})).toHaveCount(0);
 release();await expect(page.getByRole('heading',{name:setupTitles[market],exact:true})).toBeVisible();
});

for(const locale of ['fr','ln','sw'])test(`setup invitations are localized and fit mobile: ${locale}`,async({page})=>{
 await fixture(page);await page.setViewportSize({width:360,height:800});
 for(const market of ['services','restaurants'] as const){
  await page.goto(`/${locale}/shida/seller/${market}`);await expect(page.locator(market==='services'?'.svc-provider-setup':'.rst-seller-setup')).toBeVisible();
  await expect(page.getByRole('heading',{name:setupTitles[market],exact:true})).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(locale==='fr')await page.screenshot({path:`test-results/marketplace-access/${market}-setup-fr.png`,fullPage:true});
 }
});
