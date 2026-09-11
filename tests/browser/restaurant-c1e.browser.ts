import {test,expect} from '@playwright/test';
import {fixture,open} from './restaurant-c1e-fixture';
import {workText} from '../../app/lib/restaurant-work-copy';
test('atomic batch: frozen retry and explicit collision review; local intake time forms',async({page},info)=>{
 const state=await fixture(page);await open(page);
 const bodies:string[]=[];let fail=true;
 await page.route('**/RST_fixture/menu-batches/',async route=>{bodies.push(route.request().postData()!);if(fail){fail=false;return route.abort();}return route.fulfill({json:{operation_outcome:{committed:2},revision:'new'}});});
 await page.getByRole('button',{name:'My menu',exact:true}).click();await page.getByRole('button',{name:'Add several foods',exact:true}).click();
 await page.getByRole('combobox',{name:'Category',exact:true}).selectOption('RMC_fixture');
 const rows=page.locator('.rst-batch-row');
 for(let i=0;i<2;i++){await rows.nth(i).getByLabel('Food name',{exact:true}).fill(['Fufu','Pondu'][i]);await rows.nth(i).getByRole('textbox',{name:'Price',exact:true}).fill('1000.25');await rows.nth(i).getByLabel('Unit (e.g. bowl)',{exact:true}).fill('bowl');}
 await page.getByRole('button',{name:'Review',exact:true}).click();await page.getByRole('button',{name:'Confirm',exact:true}).click();
 await expect(page.getByText('Confirmation is missing. Retry the same request to recover its outcome.')).toBeVisible();await expect(rows.first().getByLabel('Food name',{exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Retry the original request',exact:true}).click();expect(bodies).toHaveLength(2);expect(bodies[0]).toBe(bodies[1]);expect(JSON.parse(bodies[0]).expected_updated_at).toBe(state.establishment.revision);
 await page.route('**/RST_fixture/order-configuration/',route=>route.fulfill({json:{revision:state.establishment.revision,intake_released:false,pickup:{enabled:false,windows:[{starts_at:'2027-01-01T10:00:00Z',ends_at:'2027-01-01T12:00:00Z'},{starts_at:'2027-01-02T10:00:00Z',ends_at:'2027-01-02T12:00:00Z'}]},delivery:null}}));
 await page.getByRole('button',{name:'Order intake',exact:true}).click();await expect(page.getByLabel('Accept new orders',{exact:true})).toBeDisabled();expect(await page.locator('input[type=datetime-local]').count()).toBe(4);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:info.outputPath('intake-phone.png'),fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
for(const locale of ['en','fr','ln','sw'] as const)test(`C1-E localized work navigation / ${locale}`,async({page},info)=>{
 await fixture(page);await page.route('**/RST_fixture/order-configuration/',r=>r.fulfill({json:{revision:'r',intake_released:false,pickup:null,delivery:null}}));
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/restaurants`);await page.locator('.rst-grid .rst-card button').first().click();
 await page.getByRole('button',{name:workText(locale,'intake'),exact:true}).click();await expect(page.getByLabel(workText(locale,'enabled'),{exact:true})).toBeDisabled();
 await page.getByRole('button',{name:workText(locale,'activity'),exact:true}).click();await expect(page.getByText(workText(locale,'measurementHelp'))).toBeVisible();
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:info.outputPath(`activity-${locale}.png`),fullPage:true});
});
test('feed idle, removal, offline reconciliation and wake-lock fallback',async({page,context},info)=>{
 await fixture(page);let feeds=0,changed=false;const reads:string[]=[];
 await page.addInitScript(()=>{Object.defineProperty(navigator,'wakeLock',{value:undefined,configurable:true});});
 await page.route('**/RST_fixture/order-configuration/',r=>r.fulfill({json:{revision:'r',intake_released:false,pickup:null,delivery:null}}));
 const order={order_ref:'ROR_test',state:'pending',revision:1,entry_source:'customer',fulfillment_method:'pickup',order_total:'1234.56',currency:'CDF',submitted_at:'2026-09-11T12:00:00Z',cancellation_pending:false};
 await page.route('**/RST_fixture/order-feed/**',r=>{feeds++;reads.push('feed');return r.fulfill({json:{changed:[],removed:changed?['ROR_test']:[],cursor:'RFC_test',as_of:'2026-09-11T12:00:00Z'}});});
 await page.route('**/RST_fixture/orders/**',r=>{reads.push('list');return r.fulfill({json:{items:changed?[]:[order],total:changed?0:1,as_of:'2026-09-11T12:00:00Z'}});});
 await open(page);await page.getByRole('button',{name:'Orders',exact:true}).click();await expect(page.getByText('1234.56 CDF')).toBeVisible();await page.waitForLoadState('networkidle');expect(reads.slice(-3)).toEqual(['feed','list','feed']);
 await page.getByLabel('Keep the screen awake',{exact:true}).check();await expect(page.getByText(/If unavailable, adjust your device screen settings/)).toBeVisible();
 await context.setOffline(true);await expect(page.getByText(/Connection interrupted/)).toBeVisible();changed=true;await context.setOffline(false);await expect(page.getByText('No orders in this view.')).toBeVisible();expect(feeds).toBeGreaterThan(2);
 await page.screenshot({path:info.outputPath('orders-reconnected.png'),fullPage:true});
});
test('delivery save preserves every area/window; D6 partial is not zero and currencies stay separate',async({page})=>{
 await fixture(page);const writes:Record<string,unknown>[]=[];
 const areas=[{country:'CD',city:'Kinshasa',commune:'Gombe',quartier:null,scope:'whole_commune'},{country:'CD',city:'Kinshasa',commune:'Limete',quartier:'Synthetic',scope:'quartier'}];
 const windows=[{starts_at:'2027-01-01T10:00:00Z',ends_at:'2027-01-01T11:00:00Z'},{starts_at:'2027-01-02T10:00:00Z',ends_at:'2027-01-02T11:00:00Z'}];
 await page.route('**/RST_fixture/order-configuration/',r=>r.fulfill({json:{revision:'2026-09-11T10:00:00.123456+00:00',intake_released:false,pickup:null,delivery:{enabled:false,fee:{amount:'1000.50',currency:'CDF'},windows,areas}}}));
 await page.route('**/RST_fixture/delivery-intake/',r=>{writes.push(r.request().postDataJSON());return r.fulfill({json:{revision:'saved'}});});
 await open(page);await page.getByRole('button',{name:'Order intake',exact:true}).click();await page.getByRole('button',{name:'Delivery',exact:true}).click();await page.getByLabel('Amount portion',{exact:true}).fill('2000.25');await page.getByRole('button',{name:'Review',exact:true}).click();await page.getByRole('button',{name:'Confirm',exact:true}).click();
 await expect.poll(()=>writes.length).toBe(1);expect(writes[0].areas).toEqual(areas);expect(writes[0].windows).toHaveLength(2);expect(writes[0].expected_updated_at).toBe('2026-09-11T10:00:00.123456+00:00');expect(writes[0].fee).toEqual({amount:'2000.25',currency:'CDF'});
 let available=false;
 await page.route('**/RST_fixture/order-summary/**',r=>r.fulfill({json:{measurement_status:available?'available':'partial',coverage_from:'2026-09-11T10:00:00Z',coverage_to:'2026-09-11T12:00:00Z',as_of:'2026-09-11T12:00:00Z',metrics:available?{submitted_orders:2,completed_in_period:2,completed_food_value:{CDF:'2000.50',USD:'10.25'},completed_delivery_fees:{CDF:'100.25'},status_breakdown:{completed:2},item_summary:{items:[],total:0}}:null}}));
 await page.getByRole('button',{name:'Basic activity',exact:true}).click();await page.getByLabel('From',{exact:true}).fill('2026-09-11');await page.getByLabel('Until (exclusive)',{exact:true}).fill('2026-09-12');await page.getByRole('button',{name:'Review',exact:true}).click();await expect(page.getByText(/Partial coverage/)).toBeVisible();await expect(page.getByText('Completed food value',{exact:true})).toHaveCount(0);
 available=true;await page.getByRole('button',{name:'Review',exact:true}).click();await expect(page.getByText('2000.50 CDF',{exact:true})).toBeVisible();await expect(page.getByText('10.25 USD',{exact:true})).toBeVisible();
});
