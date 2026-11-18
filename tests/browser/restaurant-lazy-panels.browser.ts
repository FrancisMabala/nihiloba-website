import {test,expect,type Page} from '@playwright/test';
import {restaurantFixture} from './responsive-rollout-fixtures';
import {restaurantText} from '../../app/lib/restaurant-seller-copy';
import {managementNavigation} from './restaurant-management-navigation';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

const at='2026-11-18T12:00:00Z';
async function fixture(page:Page){
 await restaurantFixture(page);
 await page.route('**/today-orders/**',route=>route.fulfill({json:{version:1,intake_released:true,sections:Object.fromEntries(['pending','ready','preparing'].map(key=>[key,{items:[],total:0,as_of:at}]))}}));
 await page.route('**/service/daily/summary/**',route=>route.fulfill({json:{as_of:at,time_zone:'Africa/Kinshasa',currencies:{CDF:{recorded_net:'3000',balance_due:'0'},USD:{recorded_net:'5',balance_due:'0'}}}}));
 await page.route('**/RST_0/hours/**',route=>route.fulfill({json:{revision:at,result:{status:'known',timezone_name:'Africa/Kinshasa',schedule:{windows:[{weekday:0,start:'09:00',end:'17:00'}]},exceptional_closures:[]}}}));
 await page.route('**/service/financial/invoices/**',route=>route.fulfill({json:{items:[],has_more:false}}));
 await page.route('**/api/**',route=>{
  const p=new URL(route.request().url()).pathname.replace(/\/$/,'');
  if(p.endsWith('/time-zone'))return route.fulfill({json:{time_zone:'Africa/Kinshasa',time_zone_revision:1,confirmed_at:at}});
  if(p.endsWith('/reports'))return route.fulfill({json:{reports:[],next_before:null}});
  if(p.includes('/days/')&&p.endsWith('/preview')){
   const cash={opening:null,counted:null,cash_receipts_net:'3000',actual_cash_refunds:'0',cash_expense_effect:'0',cash_movements:'0',expected:null,discrepancy:null};
   return route.fulfill({json:{local_date:p.split('/days/')[1].split('/')[0],time_zone:'Africa/Kinshasa',revision:1,closed:false,preview_revision:'a'.repeat(64),currencies:{CDF:{opening:null,counted:null},USD:{opening:null,counted:null}},cash:{CDF:cash,USD:{...cash,cash_receipts_net:'0'}},expenses:{CDF:'0',USD:'0'},outstanding:{CDF:{balance_due:'0',refund_owed:'0'},USD:{balance_due:'0',refund_owed:'0'}},open_orders:{count:0,refs:[]},stock_exceptions:{count:0,refs:[]},methods:[],supplemental_adjustment_count:0,supplemental_adjustments:[]}});
  }
  if(p.endsWith('/service/financial/entries'))return route.fulfill({json:{entries:[],financial_revision:0,next_after_revision:null}});
  if(p.endsWith('/service/financial/activity'))return route.fulfill({json:{items:[],next_before:null}});
  if(p.endsWith('/service/payment-methods'))return route.fulfill({json:{items:[{method_ref:'RPM_cash',label:'Espèces',kind:'cash',currencies:['CDF','USD'],enabled:true}]}});
  // This destination deliberately exercises recoverable read failures. A 404
  // means access loss in this workflow and must retain its real denial behavior.
  if(p.endsWith('/insights')||p.endsWith('/order-summary'))return route.fulfill({status:503,json:{detail:'synthetic_read_failure'}});
  return route.fallback();
 });
}

const destinations=[
 ['orders','.rst-orders-screen'],['items','.rst-menu-workspace'],
 ['reservations','.rst-reservations'],['inventory','.rst-stock'],
 ['activity','.rst-statistics-design'],['recovery','.rst-invoices'],
 ['daily','.rst-daily'],['profile','.rst-profile-overview'],
 ['hours','.rst-hours-overview'],['settings','.rst-settings'],
 ['photos','.rst-photo-editor'],['reviews','.rst-reviews'],
] as const;

for(const width of [390,1440])for(const [tab,selector] of destinations){
 test(`deferred direct destination ${tab} ${width}`,async({page})=>{
  await fixture(page);await page.setViewportSize({width,height:900});
  await page.goto(`/fr/shida/seller/restaurants/?establishment=RST_0&tab=${tab}`);
  await expect(page.locator(selector)).toBeVisible();
  await expect(page.locator('.rst-panel-loading')).toHaveCount(0);
  await expect(page.locator('.rst-today')).toHaveCount(0);
  await expect(page.locator('.rst-restaurant-identity:visible strong').first()).toContainText('Chez maman');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  // Error-only fixtures still must render the destination's real controls; a
  // selected label or a fallback overview alone does not satisfy this check.
  await expect(page.locator(selector).getByRole('button').first()).toBeVisible();
  if(tab==='activity'){
   await expect(page.locator('.rst-stats-presets button')).toHaveCount(4);
   await expect(page.locator(selector).getByRole('alert').first()).toBeVisible();
   await expect(page.locator('.rst-stats-three')).toHaveCount(0);
  }
 });
}

for(const locale of ['fr','en','ln','sw'] as const)test(`deferred loading preserves navigation and locale ${locale}`,async({page})=>{
 await fixture(page);await page.setViewportSize({width:390,height:900});
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/restaurants/?establishment=RST_0&tab=today`);
 await expect(page.locator('.rst-ops-updated')).toBeVisible();
 let release!:()=>void;const hold=new Promise<void>(resolve=>{release=resolve;});let chunks=0;
 await page.route('**/_next/static/chunks/**/*.js',async route=>{chunks++;await hold;await route.continue();});
 await page.locator('.rst-metric-incoming > button').click();
 await expect(page.locator('.rst-panel-loading')).toHaveText(restaurantText(locale,'loading'));
 await expect(page.locator('.management-mobile-nav')).toBeVisible();
 expect(chunks).toBeGreaterThan(0);
 release();await expect(page.locator('.rst-orders-screen')).toBeVisible();
 await expect(page.locator('.rst-panel-loading')).toHaveCount(0);
});

for(const width of [390,1440])test(`first menu and finance openings render useful content ${width}`,async({page},testInfo)=>{
 await fixture(page);await page.setViewportSize({width,height:900});
 await page.goto('/fr/shida/seller/restaurants/?establishment=RST_0&tab=today');
 await expect(page.locator('.rst-ops-updated')).toBeVisible();
 if(process.env.PERF_OUTPUT){mkdirSync(process.env.PERF_OUTPUT,{recursive:true});await page.screenshot({path:join(process.env.PERF_OUTPUT,`today-lazy-${width}.png`),fullPage:true});}
 const costs=[];
 for(const [name,selector] of [['Mon menu','.rst-menu-workspace'],['Finances','.rst-daily']] as const){
  const scripts:string[]=[];const received=(response:import('@playwright/test').Response)=>{if(response.request().resourceType()==='script')scripts.push(response.url());};
  page.on('response',received);const start=Date.now();await managementNavigation(page,name);
  await expect(page.locator(selector)).toBeVisible();
  if(name==='Mon menu')await expect(page.locator(selector)).toContainText('Pondu, poisson et accompagnement au choix');
  else await expect(page.locator('[data-metric=received] strong')).toContainText('3');
  costs.push({name,firstUsefulMs:Date.now()-start,asyncScripts:scripts.length});page.off('response',received);
 }
 const evidence=JSON.stringify({width,network:'local routed synthetic responses; HTTP cache disabled by routing',costs},null,2);
 await testInfo.attach('first-opening-costs',{body:evidence,contentType:'application/json'});
 if(process.env.PERF_OUTPUT){mkdirSync(process.env.PERF_OUTPUT,{recursive:true});writeFileSync(join(process.env.PERF_OUTPUT,`first-menu-finance-${width}.json`),evidence);}
 await managementNavigation(page,'Commandes');await expect(page.locator('.rst-orders-screen')).toContainText('Aucune commande à traiter');
});

test('counter draft survives lazy panel navigation and keeps leave protection',async({page})=>{
 await fixture(page);await page.setViewportSize({width:1440,height:900});
 const dish={public_ref:'RMI_1',name:'Pondu',pricing_model:'UNIT_PRICED',currency:'CDF',unit_price:'3000',sale_unit_label:'assiette',availability:'available',presentation:'fixed_dish',counter_options:{portions:[],extras:[]}};
 const basket={basket_ref:'RBA_draft',revision:1,quote:null,quote_ref:null,order_ref:null};let creates=0;
 await page.route('**/RST_0/pos/**',route=>{
  const p=new URL(route.request().url()).pathname.replace(/\/$/,'');
  if(p.endsWith('/pos'))return route.fulfill({json:{intake_released:true,items:[dish],recent:[]}});
  if(p.endsWith('/counter-unpaid'))return route.fulfill({json:{items:[],total:0,has_more:false}});
  if(p.endsWith('/counter-baskets')){if(route.request().method()==='POST'){creates++;return route.fulfill({json:basket});}return route.fulfill({json:{items:[],total:0,has_more:false}});}
  if(p.endsWith('/RBA_draft'))return route.fulfill({json:basket});
  return route.fallback();
 });
 await page.goto('/fr/shida/seller/restaurants/?establishment=RST_0&tab=pos');
 await page.getByRole('button',{name:'Ajouter Pondu',exact:true}).click();
 await expect(page.locator('.rst-selling-line input')).toHaveValue('1');
 await managementNavigation(page,'Commandes');await expect(page.locator('.rst-orders-screen')).toBeVisible();
 await managementNavigation(page,'Vendre');await expect(page.locator('.rst-selling-line input')).toHaveValue('1');
 expect(creates).toBe(1);
 await page.locator('.wz-header .market-avatar').click();
 await page.locator('.auth-account-menu').getByRole('button',{name:/déconnexion|déconnecter/i}).click();
 await expect(page.getByRole('dialog')).toContainText('Quitter ce formulaire');
 await page.getByRole('button',{name:'Rester ici',exact:true}).click();
 await expect(page.locator('.rst-selling-line input')).toHaveValue('1');
});

test('deferred signed-out entry preserves login and marketplace links',async({page})=>{
 await fixture(page);await page.route('**/employment/session/**',route=>route.fulfill({status:401,json:{}}));
 await page.goto('/fr/shida/seller/restaurants/');
 await expect(page.locator('.shida-seller-landing')).toBeVisible();
 await expect(page.locator('.ssl-marketplaces a')).toHaveCount(3);
 await expect(page.locator('.ssl-entry').getByRole('button',{name:/WhatsApp/i})).toBeVisible();
 await expect(page.locator('.rst-management')).toHaveCount(0);
});

test('deferred protected receipt keeps its canonical destination and terms',async({page})=>{
 await fixture(page);await page.route('**/orders/ROD_receipt/receipt/**',route=>route.fulfill({json:{order_ref:'ROD_receipt',state:'accepted',entry_source:'counter',fulfillment_method:'takeaway',submitted_at:at,receipt_terms:{establishment_name:'Chez maman',currency:'CDF',order_total:'3000',food_subtotal:'3000',delivery_fee:null,standalone:[{key:'line',name:'Pondu',quantity:1,sale_unit_label:'assiette',subtotal:'3000'}],plates:[]}}}));
 await page.goto('/fr/shida/seller/restaurants/RST_0/receipts/ROD_receipt/');
 await expect(page.getByRole('heading',{name:/Chez maman/})).toBeVisible();
 await expect(page.locator('.rst-selling-reference')).toContainText('ROD_receipt');
 await expect(page.locator('.rst-details')).toContainText('3000 CDF');
 await expect(page.locator('.rst-management')).toHaveCount(0);
});
