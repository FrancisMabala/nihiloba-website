import {test,expect,type Page} from '@playwright/test';
import {fixture} from './restaurant-c1e-fixture';
import {managementNavigation} from './restaurant-management-navigation';
import {workText} from '../../app/lib/restaurant-work-copy';
import {receivingCopy} from '../../app/lib/restaurant-receiving';
import {intakeSetupCopy} from '../../app/lib/restaurant-intake-setup-copy';
import {scheduleCopy,emptySchedule} from '../../app/lib/restaurant-schedule';
async function base(page:Page,locale='en'){
 const base=await fixture(page);base.establishment.status='active';
 await page.route('**/RST_fixture/capabilities/**',route=>route.fulfill({json:{capabilities:[{capability:'restaurant.pos',available:true}]}}));
 return async(tab:string)=>{await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/restaurants`);await page.locator('.rst-grid .rst-card button').first().click();await managementNavigation(page,tab);};
}
async function intakeFixture(page:Page){
 const s={reads:0,fail:false,revision:1,uncertain:false,writes:[] as string[],enabled:false,schedule:{...emptySchedule(),revision:1,timezone_name:'Africa/Kinshasa',weekly_periods:[{weekday:0,start:'11:00',end:'14:00'}]}};
 const good={available:true,reasons:[]};
 await page.route('**/RST_fixture/order-configuration/**',route=>{
  s.reads++;if(s.fail)return route.abort();
  return route.fulfill({json:{revision:String(s.revision),intake_released:true,schedules:{pickup:s.schedule,delivery:null},pickup:{enabled:s.enabled,windows:[]},delivery:null,hours:{schedule:{timezone_name:'Africa/Kinshasa',windows:[{weekday:1,start:'10:00',end:'18:00'}]},exceptional_closures:[]},receiving:{evaluated_at:new Date().toISOString(),timezone:'Africa/Kinshasa',hours:'open',in_person:good,pickup:{web:{available:false,reasons:['paused','windows']},whatsapp:{available:false,reasons:['paused','windows']},activation_blockers:[],customer_windows:[]},delivery:{web:good,whatsapp:good,activation_blockers:[],customer_windows:[]}}}});
 });
 await page.route('**/RST_fixture/pickup-intake/**',route=>{s.writes.push(route.request().postData()!);const b=route.request().postDataJSON();s.enabled=b.enabled;s.schedule={...s.schedule,...b.schedule};s.revision++;if(s.uncertain){s.uncertain=false;return route.abort();}return route.fulfill({json:{revision:String(s.revision)}});});
 return s;
}

async function away(page:Page){await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('blur'));});}
async function back(page:Page){await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('focus'));});}
const terms={currency:'CDF',food_subtotal:'1000.00',delivery_fee:null,order_total:'1000.00',standalone:[{key:'one',item_ref:'RMI_one',name:'Fufu',quantity:1,subtotal:'1000.00'}],plates:[]};
const food={public_ref:'RMI_one',name:'Fufu',presentation:'fixed_dish',pricing_model:'UNIT_PRICED',unit_price:'1000.00',currency:'CDF',availability:'available'};
async function sellingFixture(page:Page){
 const s={reads:0,basketReads:0,fail:false,denied:false,released:true,uncertain:false,commitLost:true,conflict:false,price:'1000.00',available:true,writes:[] as {path:string;body:string}[],basket:{basket_ref:'RBA_one',revision:1,quote:null as typeof terms|null,quote_ref:null as string|null,order_ref:null as string|null}};
 await page.route('**/RST_*/pos/**',route=>{
  const p=new URL(route.request().url()).pathname.replace(/\/$/,''),method=route.request().method();
  if(method==='GET'){
   if(s.denied)return route.fulfill({status:403,json:{detail:'forbidden'}});
   if(s.fail)return route.abort();
   if(p.endsWith('/pos')){s.reads++;return route.fulfill({json:{intake_released:s.released,items:[{...food,unit_price:s.price,availability:s.available?'available':'sold_out'}],recent:[]}});}
   s.basketReads++;return route.fulfill({json:s.basket});
  }
  s.writes.push({path:p,body:route.request().postData()!});
  if(p.endsWith('/counter-baskets'))return route.fulfill({json:s.basket});
  if(p.endsWith('/quote')){s.basket={...s.basket,revision:s.basket.revision+1,quote:terms,quote_ref:'RQU_one'};return route.fulfill({json:{basket:s.basket}});}
  if(p.endsWith('/finalize')){
   if(s.conflict){s.conflict=false;s.basket={...s.basket,revision:s.basket.revision+1,quote:null,quote_ref:null};return route.fulfill({status:409,json:{detail:'restaurant_quote_changed'}});}
   if(s.uncertain){s.uncertain=false;if(s.commitLost)s.basket.order_ref='ROD_one';return route.abort();}
   s.basket.order_ref='ROD_one';return route.fulfill({json:{current_order:{order_ref:'ROD_one',revision:1,state:'completed',entry_source:'counter',fulfillment_method:'on_premise',submitted_at:'2026-10-16T10:00:00Z',receipt_terms:terms}}});
  }
  s.basket.revision++;return route.fulfill({json:{basket:s.basket}});
 });
 return s;
}

for(const locale of ['en','fr','ln','sw'] as const)for(const width of [360,820,1440])test(`receiving return and setup ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});const open=await base(page,locale),s=await intakeFixture(page);await open(workText(locale,'intake'));
 const root=page.locator('.rst-intake'),r=receivingCopy[locale],u=intakeSetupCopy[locale],c=scheduleCopy[locale];
 await expect(root.getByRole('button',{name:r.editPickup,exact:true})).toBeEnabled();
 const reads=s.reads;await away(page);await back(page);await expect.poll(()=>s.reads).toBeGreaterThan(reads);await expect(root.getByRole('button',{name:r.editPickup,exact:true})).toBeEnabled();
 await expect(root.getByText(u.noClosures,{exact:true})).toBeVisible();await expect(root.getByText(r.windows,{exact:true})).toHaveCount(0);
 await root.getByRole('button',{name:r.editPickup,exact:true}).click();await expect(root.getByLabel(u.enablePickup,{exact:true})).not.toBeChecked();
 await expect(root.getByLabel(c.lead,{exact:true})).not.toBeVisible();
 page.once('dialog',d=>d.accept());await root.getByRole('button',{name:u.useHours,exact:true}).click();
 await expect(root.locator('input[type=time]').first()).toHaveValue('10:00');await expect(root.getByLabel(u.enablePickup,{exact:true})).not.toBeChecked();
 await root.locator('input[type=time]').first().fill('10:30');await root.getByRole('button',{name:r.reviewPickup,exact:true}).click();
 await away(page);s.revision++;s.schedule.weekly_periods=[{weekday:5,start:'12:00',end:'16:00'}];await back(page);
 await expect(root.locator('input[type=time]').first()).toBeEnabled();await expect(root.locator('input[type=time]').first()).toHaveValue('10:30');await expect(root.locator('.rst-intake-confirm')).toHaveCount(0);expect(s.writes).toHaveLength(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`docs/evidence/restaurant-return-2026-10-16/receiving-${locale}-${width}.png`,fullPage:true});
 await root.getByRole('button',{name:r.reviewPickup,exact:true}).click();await root.getByRole('button',{name:r.confirm,exact:true}).click();await expect.poll(()=>s.writes.length).toBe(1);expect(JSON.parse(s.writes[0]).enabled).toBe(false);
});
test('receiving offline, failed refresh and uncertain save preserve edits and retry envelope',async({page,context})=>{
 const open=await base(page),s=await intakeFixture(page);await open(workText('en','intake'));const root=page.locator('.rst-intake'),r=receivingCopy.en;
 await root.getByRole('button',{name:r.editPickup,exact:true}).click();await root.locator('input[type=time]').first().fill('10:45');
 await away(page);await context.setOffline(true);await back(page);await expect(root.locator('input[type=time]').first()).toBeDisabled();await expect(root.locator('input[type=time]').first()).toHaveValue('10:45');
 s.fail=true;await context.setOffline(false);await expect(root.getByRole('button',{name:r.refresh,exact:true})).toBeEnabled();s.fail=false;await root.getByRole('button',{name:r.refresh,exact:true}).click();await expect(root.locator('input[type=time]').first()).toBeEnabled();
 await root.getByRole('button',{name:r.reviewPickup,exact:true}).click();s.uncertain=true;await root.getByRole('button',{name:r.confirm,exact:true}).click();await expect(root.getByRole('button',{name:workText('en','retry'),exact:true})).toBeEnabled();const original=s.writes[0];
 await away(page);await back(page);await expect(root.getByRole('button',{name:workText('en','retry'),exact:true})).toBeEnabled();expect(s.writes).toHaveLength(1);await expect(root.locator('input[type=time]').first()).toHaveValue('10:45');
 await root.getByRole('button',{name:workText('en','retry'),exact:true}).click();await expect.poll(()=>s.writes.length).toBe(2);expect(s.writes[1]).toBe(original);
});

for(const locale of ['en','fr','ln','sw'] as const)for(const width of [360,820,1440])test(`selling return draft quote uncertain ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});const open=await base(page,locale),s=await sellingFixture(page);await open(workText(locale,'pos'));
 const root=page.locator('.rst-selling'),t=(k:string)=>workText(locale,k);
 const add=root.getByRole('button',{name:t('add')+' Fufu',exact:true});await expect(add).toBeEnabled();const reads=s.reads;
 await away(page);await back(page);await expect.poll(()=>s.reads).toBeGreaterThan(reads);await expect(add).toBeEnabled();
 await add.click();if(width===360)await root.locator('.rst-selling-mobile-summary').click();
 const quantity=root.getByLabel(t('quantity'),{exact:true}),preference=root.getByLabel(t('foodPreference'),{exact:true});await quantity.fill('3');await preference.fill('Sans piment');
 await away(page);await back(page);await expect(quantity).toBeEnabled();await expect(quantity).toHaveValue('3');await expect(preference).toHaveValue('Sans piment');expect(s.basketReads).toBeGreaterThan(0);expect(s.writes).toHaveLength(1);
 await root.getByRole('button',{name:t('quote'),exact:true}).click();await expect(root.getByRole('button',{name:t('complete'),exact:true})).toBeEnabled();
 const quoted=s.writes.length;await away(page);await back(page);await expect(root.getByRole('button',{name:t('complete'),exact:true})).toBeEnabled();expect(s.writes).toHaveLength(quoted);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`docs/evidence/restaurant-return-2026-10-16/selling-${locale}-${width}.png`,fullPage:true});
 s.uncertain=true;await root.getByRole('button',{name:t('complete'),exact:true}).click();await expect(root.getByRole('button',{name:t('retry'),exact:true})).toBeEnabled();const original=s.writes.at(-1)!.body;
 await away(page);await back(page);await expect(root.getByRole('button',{name:t('retry'),exact:true})).toBeEnabled();expect(s.writes).toHaveLength(quoted+1);
 await root.getByRole('button',{name:t('retry'),exact:true}).click();await expect.poll(()=>s.writes.length).toBe(quoted+2);expect(s.writes.at(-1)!.body).toBe(original);await expect(root.locator('.rst-selling-result')).toContainText('ROD_one');
});
test('selling offline failure, changed basket and stock, exact conflict review and revoked access',async({page,context})=>{
 const open=await base(page),s=await sellingFixture(page);await open(workText('en','pos'));const root=page.locator('.rst-selling'),t=(k:string)=>workText('en',k);
 await root.getByRole('button',{name:t('add')+' Fufu',exact:true}).click();const quantity=root.getByLabel(t('quantity'),{exact:true});await quantity.fill('4');
 await away(page);await context.setOffline(true);await back(page);await expect(quantity).toBeDisabled();await expect(quantity).toHaveValue('4');
 s.fail=true;await context.setOffline(false);await expect(root.getByRole('button',{name:t('refresh'),exact:true})).toBeEnabled();s.fail=false;await root.getByRole('button',{name:t('refresh'),exact:true}).click();await expect(quantity).toBeEnabled();
 await away(page);s.basket.revision++;s.price='2000.00';s.available=false;await back(page);await expect(root.getByRole('button',{name:t('review'),exact:true})).toBeVisible();await expect(quantity).toHaveValue('4');await expect(root.getByRole('button',{name:t('add')+' Fufu',exact:true})).toBeDisabled();await expect(root.locator('.rst-selling-item-body')).toContainText('2000.00');
 await root.getByRole('button',{name:t('review'),exact:true}).click();await expect(quantity).toBeEnabled();await root.getByRole('button',{name:t('quote'),exact:true}).click();s.conflict=true;await root.getByRole('button',{name:t('complete'),exact:true}).click();await expect(root.getByRole('button',{name:t('review'),exact:true})).toBeVisible();
 const writes=s.writes.length;await away(page);await back(page);await expect(root.getByRole('button',{name:t('review'),exact:true})).toBeVisible();expect(s.writes).toHaveLength(writes);await root.getByRole('button',{name:t('review'),exact:true}).click();await expect(quantity).toBeEnabled();await expect(root.getByRole('button',{name:t('complete'),exact:true})).toHaveCount(0);
 await away(page);s.denied=true;await back(page);await expect(page.getByRole('alert')).toContainText(t('posAccessLost'));
});
