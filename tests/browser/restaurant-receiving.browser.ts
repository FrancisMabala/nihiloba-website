import {test,expect,type Page} from '@playwright/test';
import {fixture} from './restaurant-c1e-fixture';
import {managementNavigation} from './restaurant-management-navigation';
import {receivingCopy as copy,type Receiving} from '../../app/lib/restaurant-receiving';
import {workText} from '../../app/lib/restaurant-work-copy';

async function seed(page:Page) {
 const base=await fixture(page);base.establishment.status='active';await page.clock.setFixedTime(new Date('2026-10-15T08:00:00Z'));
 const good={available:true,reasons:[]};
 const status:Receiving={evaluated_at:'2026-10-15T08:00:00Z',timezone:'Africa/Kinshasa',hours:'open',in_person:good,pickup:{web:good,whatsapp:good,activation_blockers:[]},delivery:{web:good,whatsapp:good,activation_blockers:[]}};
 const state={released:true,enabled:true,status,revision:1,stale:false,uncertain:false,failRead:false,writes:[] as string[],windows:[{starts_at:'2026-10-15T20:00:00Z',ends_at:'2026-10-16T01:00:00Z'}]};
 const operations=new Set<string>();
 await page.route('**/RST_fixture/order-configuration/**',route=>state.failRead?route.abort():route.fulfill({json:{revision:String(state.revision),intake_released:state.released,receiving:state.status,pickup:{enabled:state.enabled,windows:state.windows},delivery:{enabled:true,windows:state.windows,areas:[{country:'CD',city:'Kinshasa',commune:'Gombe',quartier:null,scope:'whole_commune'}],fee:{amount:'1000',currency:'CDF'}}}}));
 await page.route('**/RST_fixture/pickup-intake/**',route=>{
  const body=route.request().postDataJSON();state.writes.push(route.request().postData()!);
  if(state.stale){state.stale=false;state.revision++;return route.fulfill({status:409,json:{detail:'restaurant_stale'}});}
  if(!operations.has(body.operation_key)){state.enabled=body.enabled;state.revision++;operations.add(body.operation_key);}
  if(state.uncertain){state.uncertain=false;return route.abort();}
  return route.fulfill({json:{enabled:state.enabled}});
 });
 return state;
}
async function open(page:Page,locale:keyof typeof copy='en'){
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/restaurants`);await page.locator('.rst-grid .rst-card button').first().click();await managementNavigation(page,workText(locale,'intake'));await expect(page.locator('.rst-intake')).toBeVisible();
}
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [360,820,1440])test(`ready and overnight ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await seed(page);await open(page,locale);
 const r=copy[locale],root=page.locator('.rst-intake');await expect(root.getByRole('heading',{name:r.available,exact:true})).toBeVisible();
 await expect(root.locator('[data-service=pickup]').getByText(r.overnight,{exact:true})).toBeVisible();await expect(root.locator('input')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`docs/evidence/restaurant-receiving-2026-10-15/ready-${locale}-${width}.png`,fullPage:true});
});
test('release restriction, missing setup, expired periods and exceptional closure',async({page})=>{
 const s=await seed(page);s.released=false;s.status.in_person={available:false,reasons:['release']};s.status.pickup.activation_blockers=['release'];await open(page);
 const root=page.locator('.rst-intake'),r=copy.en;
 await expect(root.getByRole('heading',{name:r.unavailable,exact:true})).toBeVisible();await expect(root.getByText(r.release,{exact:true})).toBeVisible();
 await root.getByRole('button',{name:r.editPickup,exact:true}).click();await expect(root.getByRole('checkbox')).toBeChecked();await root.getByRole('checkbox').uncheck();await expect(root.getByRole('checkbox')).toBeDisabled();
 await root.getByRole('button',{name:r.cancel,exact:true}).click();s.released=true;s.status.pickup.activation_blockers=['address'];s.status.pickup.web={available:false,reasons:['address','closure','expired']};s.status.pickup.whatsapp=s.status.pickup.web;
 s.windows=[{starts_at:'2026-10-14T10:00:00Z',ends_at:'2026-10-14T12:00:00Z'}];await root.getByRole('button',{name:r.refresh,exact:true}).click();
 await expect(root.getByText(r.closure,{exact:true})).toBeVisible();await expect(root.locator('[data-service=pickup]').getByText(r.expiredLabel,{exact:true})).toBeVisible();await expect(root.getByRole('button',{name:r.goProfile,exact:true})).toBeVisible();
 await root.getByRole('button',{name:r.editPickup,exact:true}).click();await root.getByRole('checkbox').uncheck();await root.getByRole('button',{name:r.reviewPickup,exact:true}).click();await root.getByRole('button',{name:r.confirm,exact:true}).click();expect(JSON.parse(s.writes[0]).windows).toEqual([]);
});
test('confirmation, stale review, immutable uncertain retry, offline and failed reread',async({page,context})=>{
 const s=await seed(page);await open(page);const root=page.locator('.rst-intake'),r=copy.en;
 await root.getByRole('button',{name:r.editPickup,exact:true}).click();await root.getByRole('checkbox').uncheck();await root.getByRole('button',{name:r.reviewPickup,exact:true}).click();expect(s.writes).toHaveLength(0);await expect(root.locator('[data-service=pickup]').getByText(r.savedOn,{exact:true})).toBeVisible();
 s.stale=true;await root.getByRole('button',{name:r.confirm,exact:true}).click();await expect(root.getByRole('button',{name:workText('en','retry'),exact:true})).toBeDisabled();await root.getByRole('button',{name:r.refresh,exact:true}).click();await expect(root.getByRole('checkbox')).not.toBeChecked();
 await root.getByRole('button',{name:r.reviewPickup,exact:true}).click();s.uncertain=true;await root.getByRole('button',{name:r.confirm,exact:true}).click();await expect(root.getByRole('button',{name:workText('en','retry'),exact:true})).toBeEnabled();const original=s.writes.at(-1);
 await root.getByRole('button',{name:workText('en','retry'),exact:true}).click();await expect(root.locator('form')).toHaveCount(0);expect(s.writes.at(-1)).toBe(original);await expect(root.locator('[data-service=pickup]').getByText(r.savedOff,{exact:true})).toBeVisible();
 await context.setOffline(true);await expect(root.getByText(r.offline,{exact:true})).toBeVisible();await context.setOffline(false);await root.getByRole('button',{name:r.refresh,exact:true}).click();await root.getByRole('button',{name:r.editPickup,exact:true}).click();await root.getByRole('checkbox').check();await root.getByRole('button',{name:r.reviewPickup,exact:true}).click();s.failRead=true;await root.getByRole('button',{name:r.confirm,exact:true}).click();await expect(root.getByText(r.stale,{exact:true})).toBeVisible();await expect(root.getByRole('checkbox')).toBeDisabled();s.failRead=false;await root.getByRole('button',{name:r.refresh,exact:true}).click();await expect(root.locator('[data-service=pickup]').getByText(r.savedOn,{exact:true})).toBeVisible();
});
test('delivery review preserves its fee, areas and overnight periods',async({page})=>{
 await seed(page);const writes:Record<string,unknown>[]=[];
 await page.route('**/RST_fixture/delivery-intake/**',route=>{writes.push(route.request().postDataJSON());return route.fulfill({json:{revision:2}});});
 await open(page);const root=page.locator('.rst-intake'),r=copy.en;
 await root.getByRole('button',{name:r.editDelivery,exact:true}).click();await root.getByLabel(workText('en','amount'),{exact:true}).fill('1500.25');
 await root.getByRole('button',{name:r.reviewDelivery,exact:true}).click();expect(writes).toHaveLength(0);await root.getByRole('button',{name:r.confirm,exact:true}).click();await expect.poll(()=>writes.length).toBe(1);
 expect(writes[0].fee).toEqual({amount:'1500.25',currency:'CDF'});expect(writes[0].areas).toEqual([{country:'CD',city:'Kinshasa',commune:'Gombe',quartier:null,scope:'whole_commune'}]);expect(writes[0].windows).toEqual([{starts_at:'2026-10-15T21:00:00+01:00',ends_at:'2026-10-16T02:00:00+01:00'}]);
});
