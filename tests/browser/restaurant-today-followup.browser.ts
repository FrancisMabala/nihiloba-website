import {test,expect,type Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {restaurantFixture} from './responsive-rollout-fixtures';
import {operationsCopy} from '../../app/lib/restaurant-operations-copy';

const at='2026-11-18T12:00:00Z';
async function fixture(page:Page,count=1){
 await restaurantFixture(page,count);
 await page.clock.setFixedTime(new Date(at));
 const state={empty:false,moneyError:false,summaryStatus:200,legacyReadyError:false,summaryReads:0,orderReads:[] as string[]};
 const section=(key:string)=>({items:state.empty?[]:key==='pending'?[{order_ref:'ROD_TODAY_LONG_REFERENCE_12345678',state:'pending',submitted_at:at,fulfillment_method:'pickup'}]:[],total:!state.empty&&key==='pending'?1:0,as_of:at});
 await page.route('**/today-orders/**',route=>{state.summaryReads++;return route.fulfill({status:state.summaryStatus,json:state.summaryStatus===200?{version:1,intake_released:true,sections:Object.fromEntries(['pending','ready','preparing'].map(key=>[key,section(key)]))}:{detail:state.summaryStatus===404?'restaurant_today_unsupported':state.summaryStatus===409?'restaurant_today_limit':'restaurant_unavailable'}});});
 await page.route('**/RST_0/orders/**',route=>{const states=new URL(route.request().url()).searchParams.getAll('states').join(',');state.orderReads.push(states);return route.fulfill({status:states==='ready'&&state.legacyReadyError?503:200,json:section(states==='accepted,preparing'?'preparing':states)});});
 await page.route('**/service/daily/summary/**',route=>route.fulfill({status:state.moneyError?503:200,json:state.moneyError?{detail:'restaurant_unavailable'}:{as_of:at,time_zone:'Africa/Kinshasa',currencies:{CDF:{recorded_net:'3000',balance_due:'1500'},USD:{recorded_net:'5',balance_due:'2'}}}}));
 return state;
}
for(const width of [390,1440])test(`paired Today screenshot ${width}`,async({page})=>{
 await fixture(page);await page.setViewportSize({width,height:900});
 await page.goto('/fr/shida/seller/restaurants/?establishment=RST_0&tab=today');
 await expect(page.locator('.rst-today-refresh')).toBeEnabled();
 await expect(page.locator('.rst-ops-work')).toHaveCount(1);
 const output=process.env.PERF_OUTPUT!;mkdirSync(output,{recursive:true});
 await page.screenshot({path:`${output}/restaurant-${width}.png`,fullPage:true});
});
for(const locale of ['fr','en','ln','sw'] as const)for(const width of [390,1440])test(`summary partial errors and retries ${locale} ${width}`,async({page})=>{
 const state=await fixture(page);state.moneyError=true;
 await page.setViewportSize({width,height:900});
 const c=operationsCopy[locale],prefix=locale==='en'?'':`/${locale}`;
 await page.goto(`${prefix}/shida/seller/restaurants/?establishment=RST_0&tab=today`);
 await expect.poll(()=>state.summaryReads).toBe(1);
 await expect(page.locator('.rst-today-refresh')).toBeEnabled();
 expect(state.summaryReads).toBe(1);expect(state.orderReads).toEqual([]);
 await expect(page.locator('.rst-metric-incoming strong')).toHaveText('1');
 await expect(page.locator('.rst-ops-work')).toHaveCount(1);
 await expect(page.locator('.rst-ops-updated')).toHaveCount(0);
 state.moneyError=false;await page.locator('.rst-ops-money').getByRole('button',{name:c.retry}).click();
 await expect(page.locator('.rst-ops-money > dl')).toContainText('CDF');
 await expect(page.locator('.rst-ops-money > dl')).toContainText('USD');
 expect(state.summaryReads).toBe(1);await expect(page.locator('.rst-ops-updated')).toHaveCount(0);
 state.empty=true;await page.locator('.rst-today-refresh').click();
 await expect(page.locator('.rst-ops-updated')).toBeVisible();
 await expect(page.locator('.rst-ops-panel').getByText(c.empty,{exact:true})).toBeVisible();
 expect(state.summaryReads).toBe(2);
 await page.locator('.rst-metric-incoming > button').click();
 await expect(page.locator('.rst-orders-screen')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
for(const status of [404,409,503])test(`summary ${status} preserves bounded recovery and retry`,async({page})=>{
 const state=await fixture(page);state.summaryStatus=status;state.legacyReadyError=true;
 await page.goto('/fr/shida/seller/restaurants/?establishment=RST_0&tab=today');
 if(status!==404){
  await expect(page.locator('.rst-today-summary-error')).toBeVisible();
  await expect(page.locator('.rst-today-refresh')).toBeEnabled();
  expect(state.orderReads).toEqual([]);expect(state.summaryReads).toBe(1);
  await expect(page.locator('.rst-ops-work')).toHaveCount(0);
  await expect(page.locator('.rst-ops-updated')).toHaveCount(0);
  state.summaryStatus=200;await page.locator('.rst-today-summary-error').getByRole('button',{name:'Réessayer'}).click();
  await expect(page.locator('.rst-today-summary-error')).toHaveCount(0);
  await expect(page.locator('.rst-ops-work')).toHaveCount(1);
  expect(state.summaryReads).toBe(2);expect(state.orderReads).toEqual([]);return;
 }
 await expect.poll(()=>state.orderReads.length).toBe(3);
 await expect(page.locator('.rst-today-refresh')).toBeEnabled();
 expect(state.orderReads).toEqual(['pending','ready','accepted,preparing']);
 await expect(page.locator('.rst-ops-work')).toHaveCount(1);
 await expect(page.locator('.rst-ops-incomplete')).toBeVisible();
 await expect(page.locator('.rst-ops-updated')).toHaveCount(0);
 state.legacyReadyError=false;await page.locator('.rst-metric-preparing').getByRole('button',{name:'Réessayer'}).click();
 await expect(page.locator('.rst-ops-incomplete')).toHaveCount(0);
 expect(state.summaryReads).toBe(1);expect(state.orderReads.at(-1)).toBe('ready');
});
test('leaving during a held summary aborts the old context',async({page})=>{
 await fixture(page,2);await page.setViewportSize({width:320,height:900});
 let release!:()=>void;const hold=new Promise<void>(resolve=>{release=resolve;});let started=false;
 await page.route('**/RST_0/today-orders/**',async route=>{started=true;await hold;await route.fulfill({json:{version:1,sections:Object.fromEntries(['pending','ready','preparing'].map(key=>[key,{items:[],total:777,as_of:at}]))}}).catch(()=>{});});
 await page.goto('/fr/shida/seller/restaurants/?establishment=RST_0&tab=today');
 await expect.poll(()=>started).toBe(true);
 await page.locator('.management-restaurant-context .rst-restaurant-identity button').click();
 await page.locator('.rst-grid .rst-card').filter({has:page.getByRole('heading',{name:'Restaurant 2',exact:true})}).getByRole('button').click();
 release();await expect(page.locator('.rst-today-refresh')).toBeEnabled();
 await expect(page.locator('.rst-metric-incoming strong')).not.toHaveText('777');
 await page.setViewportSize({width:430,height:900});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
