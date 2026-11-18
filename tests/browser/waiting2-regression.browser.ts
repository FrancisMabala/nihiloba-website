import {test,expect} from '@playwright/test';
import {restaurantFixture} from './responsive-rollout-fixtures';
import {operationsCopy} from '../../app/lib/restaurant-operations-copy';
for(const locale of ['fr','en','ln','sw'] as const)for(const width of [390,1440])test(`Today prioritized serial reads and retry ${locale} ${width}`,async({page})=>{
 await restaurantFixture(page);await page.setViewportSize({width,height:900});
 await page.route('**/RST_0/service/daily/summary/**',route=>route.fulfill({json:{as_of:'2026-11-18T12:00:00Z',time_zone:'Africa/Kinshasa',currencies:{CDF:{recorded_net:'3000',balance_due:'0'},USD:{recorded_net:'5',balance_due:'0'}}}}));
 const reads:string[]=[];let release!:()=>void,pending=0;const hold=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/RST_0/orders/**',async route=>{
  const states=new URL(route.request().url()).searchParams.getAll('states').join(',');reads.push(states);
  if(states==='pending'&&++pending===1)return route.fulfill({status:503,json:{detail:'synthetic_unavailable'}});
  if(states==='ready')await hold;
  return route.fulfill({json:{items:[],total:0}});
 });
 const prefix=locale==='en'?'':`/${locale}`,c=operationsCopy[locale];
 await page.goto(`${prefix}/shida/seller/restaurants/?establishment=RST_0&tab=today`);
 await expect.poll(()=>reads).toEqual(['pending','ready']);
 const retry=page.locator('.rst-metric-incoming').getByRole('button',{name:c.retry});
 await expect(retry).toBeEnabled();await expect(page.getByText(c.empty,{exact:true})).toHaveCount(0);
 await retry.click();await expect(retry).toBeDisabled();expect(reads).toHaveLength(2);
 release();await expect.poll(()=>reads.slice(0,4)).toEqual(['pending','ready','pending','accepted,preparing']);
 await expect(page.locator('.rst-ops-panel').getByText(c.empty,{exact:true})).toBeVisible();
 await expect(page.locator('.rst-today-refresh')).toBeEnabled();
 await expect(page.locator('.rst-ops-updated')).toHaveCount(0); // one failed read is not a successful refresh
 await page.locator('.rst-today-refresh').click();await expect(page.locator('.rst-ops-updated')).toBeVisible();
 await page.locator('.rst-metric-incoming > button').click();await expect(page.locator('.rst-orders-screen')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
