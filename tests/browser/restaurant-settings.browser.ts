import {soloCopy} from '../../app/lib/restaurant-solo-copy';
import {receivingCopy} from '../../app/lib/restaurant-receiving';
import {test,expect,type Page} from '@playwright/test';
import {fixture} from './restaurant-c1e-fixture';
import {managementNavigation} from './restaurant-management-navigation';
import {settingsCopy} from '../../app/lib/restaurant-settings-copy';
import {managementCopy} from '../../app/lib/restaurant-management-copy';
import {workText} from '../../app/lib/restaurant-work-copy';
import {reservationCopy} from '../../app/lib/restaurant-reservation-copy';

async function seed(page:Page,kind='malewa',paid=true) {
 await page.clock.setFixedTime(new Date('2026-10-16T08:00:00Z')); const base=await fixture(page);
 Object.assign(base.establishment,{status:'active'});Object.assign(base.establishment.profile,{service_modes:kind==='malewa'?'':'eat_there',food_business_type:kind});
 const state={enabled:false,revision:1,stale:false,uncertain:false,failRead:false,reservation:false,resRevision:0,resStale:false,resUncertain:false,writes:[] as string[]};
 const committed=new Map<string,string>();
 await page.route('**/RST_fixture/**',async route=>{
  const p=new URL(route.request().url()).pathname.replace(/\/$/,'');
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(p.endsWith('/capabilities'))return reply({capabilities:['restaurant.reservations',...(paid?['restaurant.pos']:[])].map(capability=>({capability,available:true}))});
  if(p.endsWith('/hours'))return reply({revision:'hours-1',result:{schedule:{windows:[{weekday:3,start:'08:00',end:'20:00'}]},exceptional_closures:[],status:'open',confirmed_at:'2026-10-15T08:00:00Z',timezone_name:'Africa/Kinshasa'}});
  if(p.endsWith('/service/payment-methods'))return reply({items:[{method_ref:'cash',label:'Cash CDF',enabled:true,currencies:['CDF']},{method_ref:'mobile',label:'Mobile USD',enabled:false,currencies:['USD']}]});
  if(p.endsWith('/guest-auto-accept'))return reply({enabled:false,revision:'auto-1'});
  if(p.endsWith('/order-configuration'))return state.failRead?reply({},503):reply({revision:String(state.revision),intake_released:true,pickup:{enabled:state.enabled,windows:[{starts_at:'2026-10-16T09:00:00+00:00',ends_at:'2026-10-16T12:00:00+00:00'}]},delivery:null});
  if(p.endsWith('/pickup-intake')){
   state.writes.push(route.request().postData()!);
   if(state.stale){state.stale=false;state.revision++;return reply({detail:'restaurant_stale'},409);}
   const body=route.request().postDataJSON();
   if(committed.has(body.operation_key))return reply({enabled:state.enabled});
   state.enabled=body.enabled;state.revision++;committed.set(body.operation_key,route.request().postData()!);
   if(state.uncertain){state.uncertain=false;return route.abort();}
   return reply({enabled:state.enabled});
  }
  if(p.endsWith('/reservations/setting')){
   if(route.request().method()==='PUT'){
    const body=route.request().postDataJSON();state.writes.push(route.request().postData()!);
    if(state.resStale){state.resStale=false;state.resRevision++;return reply({detail:'restaurant_stale'},409);}
    if(!committed.has(body.operation_key)){state.reservation=body.enabled;state.resRevision++;committed.set(body.operation_key,route.request().postData()!);}
    if(state.resUncertain){state.resUncertain=false;return route.abort();}
   }
   return reply({enabled:state.reservation,available:state.reservation&&kind!=='malewa',revision:state.resRevision});
  }
  return route.fallback();
 });
 return state;
}
async function open(page:Page,locale:keyof typeof settingsCopy='en'){
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/restaurants`);await page.locator('.rst-grid .rst-card button').first().click();await managementNavigation(page,managementCopy[locale].settings);await expect(page.locator('.rst-settings')).toBeVisible();await page.locator('.rst-settings > details > summary').click();
}
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [360,820,1440])test(`Settings ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await seed(page,width===360?'malewa':width===820?'fast_food':'cafe');await open(page,locale);
 const c=settingsCopy[locale],root=page.locator('.rst-settings');await expect(root.getByText('Cash CDF',{exact:true})).toBeVisible();await expect(root.getByText('Mobile USD',{exact:true})).toBeVisible();
 await expect(root.getByRole('heading',{name:soloCopy[locale].reservation,exact:true})).toBeVisible();await expect(root.getByText(c.preserved,{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(root.locator('.rst-settings-reservation').getByText(''+c.saved+': '+c.off,{exact:true})).toBeVisible();
 if(locale==='en')await root.locator('#settings-intake').screenshot({path:`docs/evidence/seller-workspace/restaurant-settings-intake-${width}.png`});
 await page.evaluate(()=>{window.scrollTo({top:0,behavior:'instant'});(document.activeElement as HTMLElement)?.blur();});
 await page.screenshot({path:`docs/evidence/seller-workspace/restaurant-settings-after-${locale}-${width}.png`,fullPage:true});
});
for(const width of [360,820,1440])test(`intake confirmation, save/reload, stale recovery, exact uncertain retry and offline ${width}`,async({page,context})=>{
 await page.setViewportSize({width,height:1000});
 const state=await seed(page,'restaurant');page.on('dialog',d=>d.accept());await open(page);
 const form=page.locator('#settings-intake .rst-intake'),toggle=form.getByRole('checkbox',{name:receivingCopy.en.enable,exact:true});
 const saved=()=>form.locator('[data-service=pickup]').getByText(state.enabled?receivingCopy.en.savedOn:receivingCopy.en.savedOff,{exact:true});
 await expect(saved()).toBeVisible();await form.getByRole('button',{name:receivingCopy.en.editPickup,exact:true}).click();await toggle.check();expect(state.writes).toHaveLength(0);await expect(form.locator('[data-service=pickup]').getByText(receivingCopy.en.savedOff,{exact:true})).toBeVisible();
 await form.getByRole('button',{name:receivingCopy.en.reviewPickup,exact:true}).click();expect(state.writes).toHaveLength(0);
 await form.getByRole('button',{name:receivingCopy.en.confirm,exact:true}).click();await expect(saved()).toBeVisible();expect(state.enabled).toBe(true);
 await open(page);await expect(form.locator('[data-service=pickup]').getByText(receivingCopy.en.savedOn,{exact:true})).toBeVisible();
 state.stale=true;await form.getByRole('button',{name:receivingCopy.en.editPickup,exact:true}).click();await toggle.uncheck();await form.getByRole('button',{name:receivingCopy.en.reviewPickup,exact:true}).click();await form.getByRole('button',{name:receivingCopy.en.confirm,exact:true}).click();
 await expect(form.getByRole('button',{name:workText('en','retry'),exact:true})).toBeDisabled();await form.getByRole('button',{name:receivingCopy.en.refresh,exact:true}).click();await expect(toggle).not.toBeChecked();
 await form.getByRole('button',{name:receivingCopy.en.reviewPickup,exact:true}).click();await form.getByRole('button',{name:receivingCopy.en.confirm,exact:true}).click();await expect(form.locator('[data-service=pickup]').getByText(receivingCopy.en.savedOff,{exact:true})).toBeVisible();
 state.uncertain=true;await form.getByRole('button',{name:receivingCopy.en.editPickup,exact:true}).click();await toggle.check();await form.getByRole('button',{name:receivingCopy.en.reviewPickup,exact:true}).click();await form.getByRole('button',{name:receivingCopy.en.confirm,exact:true}).click();await expect(form.locator('[data-service=pickup]').getByText(receivingCopy.en.savedOff,{exact:true})).toBeVisible();
 const original=state.writes.at(-1);await form.getByRole('button',{name:workText('en','retry'),exact:true}).click();await expect(form.locator('[data-service=pickup]').getByText(receivingCopy.en.savedOn,{exact:true})).toBeVisible();expect(state.writes.at(-1)).toBe(original);
 await form.getByRole('button',{name:receivingCopy.en.editPickup,exact:true}).click();await context.setOffline(true);await expect(toggle).toBeDisabled();await context.setOffline(false);await form.getByRole('button',{name:receivingCopy.en.refresh,exact:true}).click();await expect(toggle).toBeEnabled();
 await open(page);await expect(form.locator('[data-service=pickup]').getByText(receivingCopy.en.savedOn,{exact:true})).toBeVisible();
});
test('reservation requests require confirmation and show saved authority after reload',async({page})=>{
 const state=await seed(page,'restaurant');await open(page);const scope=page.locator('.rst-settings-reservation'),c=settingsCopy.en;
 await scope.getByRole('button',{name:reservationCopy.en.enable,exact:true}).click();expect(state.reservation).toBe(false);await scope.getByRole('button',{name:c.cancel,exact:true}).click();expect(state.reservation).toBe(false);
 await scope.getByRole('button',{name:reservationCopy.en.enable,exact:true}).click();await scope.getByRole('button',{name:c.confirm,exact:true}).click();await expect(scope.getByText('Saved: Enabled',{exact:true})).toBeVisible();await open(page);await expect(scope.getByText('Saved: Enabled',{exact:true})).toBeVisible();
 await scope.getByRole('button',{name:reservationCopy.en.disable,exact:true}).click();await scope.getByRole('button',{name:c.confirm,exact:true}).click();await expect(scope.getByText('Saved: Disabled',{exact:true})).toBeVisible();
});
test('free Malewa retains explicit service and payment requirements',async({page})=>{
 await seed(page,'malewa',false);await open(page);await expect(page.getByText(settingsCopy.en.paymentAccess,{exact:true})).toBeVisible();await expect(page.locator('#settings-reservations .rst-details dd').first()).toContainText('Disabled');await expect(page.locator('#settings-payments button')).toHaveCount(0);
});
test('reservation stale recovery, uncertain replay and Settings refresh preserve pending work',async({page})=>{
 const state=await seed(page,'restaurant');await open(page);const scope=page.locator('.rst-settings-reservation'),c=settingsCopy.en;
 state.resStale=true;
 await scope.getByRole('button',{name:reservationCopy.en.enable,exact:true}).click();await scope.getByRole('button',{name:c.confirm,exact:true}).click();
 await expect(scope.getByRole('button',{name:workText('en','retry'),exact:true})).toBeDisabled();
 await scope.getByRole('button',{name:c.refresh,exact:true}).click();await expect(scope.getByText('Saved: Disabled',{exact:true})).toBeVisible();
 state.resUncertain=true;await scope.getByRole('button',{name:reservationCopy.en.enable,exact:true}).click();await scope.getByRole('button',{name:c.confirm,exact:true}).click();
 await expect(scope.getByText('Saved: Disabled',{exact:true})).toBeVisible();const original=state.writes.at(-1);
 page.once('dialog',d=>d.dismiss());await page.locator('.rst-settings > header').getByRole('button',{name:c.refresh,exact:true}).click();
 await expect(scope.getByRole('button',{name:workText('en','retry'),exact:true})).toBeEnabled();await scope.getByRole('button',{name:workText('en','retry'),exact:true}).click();await expect(scope.getByText('Saved: Enabled',{exact:true})).toBeVisible();expect(state.writes.at(-1)).toBe(original);
});
test('failed reread leaves saved state unconfirmed until refresh',async({page})=>{
 const state=await seed(page);await open(page);const form=page.locator('#settings-intake .rst-intake');
 await form.getByRole('button',{name:receivingCopy.en.editPickup,exact:true}).click();await form.getByRole('checkbox',{name:receivingCopy.en.enable,exact:true}).check();await form.getByRole('button',{name:receivingCopy.en.reviewPickup,exact:true}).click();state.failRead=true;await form.getByRole('button',{name:receivingCopy.en.confirm,exact:true}).click();
 await expect(form.getByText(receivingCopy.en.stale,{exact:true})).toBeVisible();await expect(form.getByRole('checkbox')).toBeDisabled();state.failRead=false;await form.getByRole('button',{name:receivingCopy.en.refresh,exact:true}).click();await expect(form.locator('[data-service=pickup]').getByText(receivingCopy.en.savedOn,{exact:true})).toBeVisible();
});
test('lost exact-establishment access removes Settings',async({page})=>{
 await seed(page);await page.route('**/RST_fixture/hours**',route=>route.fulfill({status:403,json:{detail:'restaurant_unavailable'}}));
 await page.goto('/shida/seller/restaurants');await page.locator('.rst-grid .rst-card button').first().click();await managementNavigation(page,managementCopy.en.settings);
 await expect(page.locator('.rst-settings')).toHaveCount(0);await expect(page.locator('.rst [role=alert]')).toBeVisible();
});
test('unconfirmed hours and closed rollout gate cannot be opened by business label',async({page})=>{
 await seed(page,'restaurant');await page.route('**/RST_fixture/hours**',route=>route.fulfill({json:{revision:'hours',result:{schedule:{windows:[]},confirmed_at:null,exceptional_closures:[],status:'closed',timezone_name:'Africa/Kinshasa'}}}));
 await page.route('**/RST_fixture/order-configuration/**',route=>route.fulfill({json:{revision:'1',intake_released:false,pickup:null,delivery:null}}));
 await open(page);await expect(page.locator('.rst-settings-reservation').getByRole('button',{name:reservationCopy.en.enable,exact:true})).toBeDisabled();await page.locator('#settings-intake .rst-intake').getByRole('button',{name:receivingCopy.en.editPickup,exact:true}).click();await expect(page.locator('#settings-intake .rst-intake').getByRole('checkbox')).toBeDisabled();await expect(page.locator('#settings-reservations .rst-details')).toContainText(settingsCopy.en.setup);
});

test('simple QR activation uses opening hours and exact retry without enabling reservations',async({page})=>{
 await page.setViewportSize({width:390,height:844});const state=await seed(page,'restaurant');await open(page,'fr');
 const qr=page.locator('.rst-quick-qr');await expect(qr).toContainText('sans compte SHIDA');
 await qr.getByRole('button',{name:soloCopy.fr.enableQr,exact:true}).click();expect(state.writes).toHaveLength(0);
 state.uncertain=true;await qr.getByRole('button',{name:workText('fr','confirm'),exact:true}).click();
 await qr.getByRole('button',{name:soloCopy.fr.retry,exact:true}).click();
 await expect(qr.getByText(soloCopy.fr.enabled,{exact:true})).toBeVisible();
 expect(state.writes).toHaveLength(2);expect(state.writes[0]).toBe(state.writes[1]);
 expect(JSON.parse(state.writes[0]).schedule).toEqual({weekly_periods:[{weekday:3,start:'08:00',end:'20:00'}],minimum_lead_minutes:0,cutoff_minutes:0,allow_tomorrow:false});
 expect(state.reservation).toBe(false);
 await page.screenshot({path:'docs/evidence/counter-2026-10-21/personal-options-phone.png',fullPage:true});
});
