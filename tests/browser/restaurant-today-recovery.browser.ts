import {test,expect,type Page,type Route} from '@playwright/test';
import {restaurantFixture} from './responsive-rollout-fixtures';
import {operationsCopy} from '../../app/lib/restaurant-operations-copy';
import {todayRecoveryCopy} from '../../app/lib/restaurant-today-recovery-copy';
import {managementCopy} from '../../app/lib/restaurant-management-copy';

const at='2026-11-18T12:00:00Z';
const keys=['pending','ready','preparing'] as const;
type Key=typeof keys[number];
async function freezeClock(page:Page){
 await page.clock.install({time:new Date(Date.parse(at)-60_000)});
 await page.clock.pauseAt(new Date(at));
}
function orderPage(key:Key,total=0){return {items:total?[{order_ref:`ROD_RECOVERY_${key.toUpperCase()}`,state:key,submitted_at:at,fulfillment_method:'pickup'}]:[],total,as_of:at};}
function summary(intake:boolean|undefined,total=0){return {version:1,...(intake===undefined?{}:{intake_released:intake}),sections:Object.fromEntries(keys.map(key=>[key,orderPage(key,total)]))};}
async function fixture(page:Page,count=1){
 const account=await restaurantFixture(page,count);
 const state={status:200,detail:'restaurant_unavailable',body:summary(true) as unknown,headers:{} as Record<string,string>,reads:[] as string[],legacy:[] as string[],config:0,money:0,stock:0};
 await page.route('**/today-orders/**',route=>{
  state.reads.push(new URL(route.request().url()).pathname);
  return route.fulfill({status:state.status,headers:state.headers,json:state.status===200?state.body:{detail:state.detail}});
 });
 await page.route('**/order-configuration/**',route=>{state.config++;return route.fulfill({status:503,json:{detail:'restaurant_unavailable'}});});
 await page.route('**/RST_*/orders/**',route=>{
  const states=new URL(route.request().url()).searchParams.getAll('states').join(',');state.legacy.push(states);
  return route.fulfill({json:orderPage(states==='accepted,preparing'?'preparing':states as Key)});
 });
 await page.route('**/service/daily/summary/**',route=>{state.money++;return route.fulfill({json:{as_of:at,time_zone:'Africa/Kinshasa',currencies:{CDF:{recorded_net:'3000',balance_due:'500'},USD:{recorded_net:'5',balance_due:'0'}}}});});
 await page.route('**/inventory/**',route=>{state.stock++;return route.fulfill({json:{items:[],total:0,has_more:false}});});
 return {state,account};
}
async function visit(page:Page,locale:'fr'|'en'|'ln'|'sw'='fr'){
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/restaurants/?establishment=RST_0&tab=today`);
 await expect(page.locator('.rst-today')).toBeVisible();
}
async function settled(page:Page,state:{reads:string[]},expectedReads=1){
 await expect.poll(()=>state.reads.length).toBe(expectedReads);
 await expect(page.locator('.rst-today-refresh')).toBeEnabled();
}
async function unavailableOrders(page:Page){
 await expect(page.locator('.rst-metric-incoming strong')).toHaveText('—');
 await expect(page.locator('.rst-metric-preparing strong')).toHaveText('—');
 await expect(page.locator('.rst-ops-secondary-count b')).toHaveText('—');
 await expect(page.locator('.rst-ops-incomplete')).toBeVisible();
 await expect(page.locator('.rst-ops-panel').getByText(operationsCopy.fr.empty,{exact:true})).toHaveCount(0);
 await expect(page.locator('.rst-ops-updated')).toHaveCount(0);
}

for(const intake of [true,false,undefined])test(`summary intake ${String(intake)} never loads full configuration`,async({page})=>{
 const {state}=await fixture(page);state.body=summary(intake);
 await page.setViewportSize({width:390,height:844});await visit(page);await settled(page,state);
 expect(state.config).toBe(0);expect(state.legacy).toEqual([]);
 await expect(page.locator('.rst-metric-incoming strong')).toHaveText('0');
 await expect(page.locator('.rst-today').getByText(operationsCopy.fr.closed,{exact:false})).toHaveCount(intake===false?1:0);
 await expect(page.locator('.rst-today').getByText(todayRecoveryCopy.fr.intakeUnknown,{exact:false})).toHaveCount(intake===undefined?1:0);
 await expect(page.locator('.rst-ops-updated')).toHaveCount(intake===undefined?0:1);
});

for(const [status,detail] of [[401,'restaurant_unavailable'],[403,'restaurant_unavailable'],[404,'restaurant_unavailable'],[409,'restaurant_today_limit'],[429,'restaurant_unavailable'],[503,'restaurant_unavailable']] as const){
 test(`${status} ${detail} has no legacy fanout or false empty state`,async({page})=>{
  await freezeClock(page);
  const {state}=await fixture(page);state.status=status;state.detail=detail;
  await visit(page);await settled(page,state);await unavailableOrders(page);
  await page.clock.fastForward(35_000);expect(state.reads).toHaveLength(1);
  expect(state.legacy).toEqual([]);expect(state.config).toBe(0);
  await expect(page.locator('.rst-metric-stock strong')).toHaveText('0');
  await expect(page.locator('.rst-ops-money > dl')).toContainText('CDF');
  await expect(page.locator('.rst-ops-money > dl')).toContainText('USD');
  await expect(page.locator('.rst-today-summary-error button')).toBeEnabled();
 });
}
test('malformed summary leaves the three order sections unavailable while independent sections render',async({page})=>{
 const {state}=await fixture(page);state.body={version:1,sections:{pending:orderPage('pending')}};
 await visit(page);await settled(page,state);await unavailableOrders(page);
 expect(state.legacy).toEqual([]);expect(state.config).toBe(0);
 await expect(page.locator('.rst-ops-money > dl')).toContainText('CDF');
});

for(const status of [404,405])test(`only typed unsupported ${status} enables three legacy reads`,async({page})=>{
 const {state}=await fixture(page);state.status=status;state.detail='restaurant_today_unsupported';
 await visit(page);await settled(page,state);
 expect(state.legacy).toEqual(['pending','ready','accepted,preparing']);expect(state.config).toBe(0);
 await expect(page.locator('.rst-ops-panel').getByText(operationsCopy.fr.empty,{exact:true})).toBeVisible();
 await expect(page.locator('.rst-today').getByText(todayRecoveryCopy.fr.intakeUnknown,{exact:false})).toBeVisible();
 await expect(page.locator('.rst-ops-updated')).toHaveCount(0);
});

for(const locale of ['fr','en','ln','sw'] as const)test(`explicit grouped retry respects cooldown with no automatic retry in ${locale}`,async({page})=>{
 await freezeClock(page);
 const {state}=await fixture(page);state.status=locale==='en'?429:409;state.detail='restaurant_today_limit';
 state.headers={'Retry-After':locale==='fr'?'2':'Wed, 18 Nov 2026 12:00:02 GMT'};
 await visit(page,locale);await settled(page,state);
 const retry=page.locator('.rst-today-summary-error button');
 await expect(retry).toBeDisabled();
 await expect(retry).toHaveText(todayRecoveryCopy[locale].retryWait.replace('{seconds}','2'));
 await page.clock.fastForward(1000);await expect(retry).toBeDisabled();
 await page.clock.fastForward(1200);await expect(retry).toBeEnabled();
 await expect(retry).toHaveText(operationsCopy[locale].retry);
 await page.clock.fastForward(30_000);expect(state.reads).toHaveLength(1);expect(state.legacy).toEqual([]);
 const independent={money:state.money,stock:state.stock};state.status=200;state.body=summary(true,1);
 await retry.click();await settled(page,state,2);
 await expect(page.locator('.rst-metric-incoming strong')).toHaveText('1');
 await expect(page.locator('.rst-today-summary-error')).toHaveCount(0);
 expect({money:state.money,stock:state.stock}).toEqual(independent);expect(state.config).toBe(0);
});

test('group retry queues once behind a held stock read without overlapping requests',async({page})=>{
 const {state}=await fixture(page);state.status=503;
 let release!:()=>void,stockStarted=false;const hold=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/inventory/**',async route=>{stockStarted=true;await hold;await route.fulfill({json:{items:[],total:0,has_more:false}});});
 try{
  await visit(page);await expect.poll(()=>stockStarted).toBe(true);
  const retry=page.locator('.rst-today-summary-error button');await expect(retry).toBeEnabled();
  await expect(page.locator('.rst-today-refresh')).toBeDisabled();
  state.status=200;state.body=summary(true,1);await retry.click();await expect(retry).toBeDisabled();
  expect(state.reads).toHaveLength(1);expect(state.money).toBe(0);
  release();await settled(page,state,2);
  await expect(page.locator('.rst-metric-incoming strong')).toHaveText('1');
  expect(state.legacy).toEqual([]);expect(state.config).toBe(0);expect(state.money).toBe(1);
 }finally{release();}
});

test('failed refresh preserves stale valid orders and independent totals until explicit retry',async({page})=>{
 const {state}=await fixture(page);state.body=summary(true,1);
 await visit(page);await settled(page,state);
 const successfulTime=await page.locator('.rst-ops-updated').textContent();
 state.status=503;await page.locator('.rst-today-refresh').click();await settled(page,state,2);
 await expect(page.locator('.rst-metric-incoming strong')).toHaveText('1');
 await expect(page.locator('.rst-metric-preparing strong')).toHaveText('1');
 await expect(page.locator('.rst-ops-work')).toHaveCount(2);
 await expect(page.locator('.rst-today-summary-error')).toContainText(operationsCopy.fr.stale);
 await expect(page.locator('.rst-ops-updated')).toHaveText(successfulTime!);
 state.status=200;state.body=summary(true);
 await page.locator('.rst-today-summary-error button').click();await settled(page,state,3);
 await expect(page.locator('.rst-ops-panel').getByText(operationsCopy.fr.empty,{exact:true})).toBeVisible();
 expect(state.legacy).toEqual([]);expect(state.config).toBe(0);
});

async function heldSummary(page:Page){
 let release!:()=>void,settle!:()=>void,started=false;const hold=new Promise<void>(resolve=>{release=resolve;});
 const completed=new Promise<void>(resolve=>{settle=resolve;});
 await page.route('**/RST_0/today-orders/**',async(route:Route)=>{
  started=true;await hold;await route.fulfill({json:summary(true,777)}).catch(()=>{});settle();
 });
 return {release:()=>{release();return started?completed:Promise.resolve();},started:()=>started};
}
test('summary deadline does not fan out or accept a late response',async({page})=>{
 await freezeClock(page);const {state}=await fixture(page);const held=await heldSummary(page);
 try{
  await visit(page);await expect.poll(held.started).toBe(true);
  await page.clock.fastForward(12_100);await expect(page.locator('.rst-today-refresh')).toBeEnabled();
  await unavailableOrders(page);expect(state.legacy).toEqual([]);expect(state.config).toBe(0);
  await held.release();await expect(page.locator('.rst-metric-incoming strong')).toHaveText('—');
 }finally{await held.release();}
});
test('restaurant switch rejects the held prior context result',async({page})=>{
 const {state}=await fixture(page,2);const held=await heldSummary(page);
 try{
  await visit(page);await expect.poll(held.started).toBe(true);
  await page.locator('.rst-restaurant-identity:visible button').click();
  await page.locator('.rst-grid .rst-card').filter({has:page.getByRole('heading',{name:'Restaurant 2',exact:true})}).getByRole('button').click();
  await expect.poll(()=>state.reads.length).toBe(1);await expect(page.locator('.rst-today-refresh')).toBeEnabled();
  await held.release();await expect(page.locator('.rst-metric-incoming strong')).toHaveText('0');
  await expect(page.locator('.management-restaurant-context')).toContainText('Restaurant 2');
  expect(state.legacy).toEqual([]);expect(state.config).toBe(0);
 }finally{await held.release();}
});
test('logout removes the private dashboard while a summary is held',async({page})=>{
 const {account,state}=await fixture(page);const held=await heldSummary(page);
 try{
  await visit(page);await expect.poll(held.started).toBe(true);
  await page.locator('.wz-header .market-avatar').click();
  await page.locator('.auth-account-menu').getByRole('button',{name:/déconnexion|déconnecter/i}).click();
  await expect.poll(()=>account.logout).toBe(true);await expect(page.locator('.rst-today')).toHaveCount(0);
  await held.release();await expect(page.getByText(managementCopy.fr.signedOut,{exact:true})).toBeVisible();
  await expect(page.locator('.rst-today')).toHaveCount(0);expect(state.legacy).toEqual([]);
 }finally{await held.release();}
});
