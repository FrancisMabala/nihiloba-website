import {test,expect,type Page} from '@playwright/test';
import {fixture} from './restaurant-c1e-fixture';
import {managementNavigation} from './restaurant-management-navigation';
import {receivingCopy as r} from '../../app/lib/restaurant-receiving';
import {scheduleCopy as c,type SavedSchedule} from '../../app/lib/restaurant-schedule';
import {workText} from '../../app/lib/restaurant-work-copy';
async function seed(page:Page){
 const base=await fixture(page);base.establishment.status='active';await page.clock.setFixedTime(new Date('2026-10-15T08:00:00Z'));
 const schedule:SavedSchedule={revision:1,timezone_name:'Africa/Kinshasa',weekly_periods:[{weekday:3,start:'11:00',end:'14:00'},{weekday:3,start:'18:00',end:'02:00'}],minimum_lead_minutes:15,cutoff_minutes:30,allow_tomorrow:false};
 const s={schedule,enabled:true,released:false,revision:1,stale:false,uncertain:false,writes:[] as string[]};
 await page.route('**/RST_fixture/order-configuration/**',route=>{const state={available:s.released,reasons:s.released?[]:['release']};return route.fulfill({json:{revision:String(s.revision),intake_released:s.released,schedules:{pickup:s.schedule,delivery:null},hours:{exceptional_closures:[]},receiving:{evaluated_at:'2026-10-15T08:00:00Z',timezone:'Africa/Kinshasa',hours:'open',in_person:state,pickup:{web:state,whatsapp:state,activation_blockers:s.released?[]:['release'],customer_windows:s.released?[{starts_at:'2026-10-15T10:00:00Z',ends_at:'2026-10-15T10:15:00Z'}]:[]},delivery:{web:state,whatsapp:state,activation_blockers:[],customer_windows:[]}},pickup:{enabled:s.enabled,windows:[]},delivery:null}});});
 const keys=new Set<string>();
 await page.route('**/RST_fixture/pickup-intake/**',route=>{const b=route.request().postDataJSON();s.writes.push(route.request().postData()!);if(s.stale){s.stale=false;s.revision++;return route.fulfill({status:409,json:{detail:'restaurant_stale'}});}if(!keys.has(b.operation_key)){keys.add(b.operation_key);s.schedule={...b.schedule,revision:s.schedule.revision+1,timezone_name:s.schedule.timezone_name};s.enabled=b.enabled;s.revision++;}if(s.uncertain){s.uncertain=false;return route.abort();}return route.fulfill({json:{revision:String(s.revision)}});});
 return s;
}
async function open(page:Page,locale:keyof typeof r){await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/restaurants`);await page.locator('.rst-grid .rst-card button').first().click();await managementNavigation(page,workText(locale,'intake'));}
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [360,820,1440])test(`weekly schedule ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});const state=await seed(page);await open(page,locale);const root=page.locator('.rst-intake');
 await expect(root.getByRole('heading',{name:r[locale].unavailable,exact:true})).toBeVisible();await expect(root.getByText(c[locale].saved,{exact:true})).toBeVisible();
 await page.screenshot({path:`docs/evidence/restaurant-schedules-2026-10-15/saved-${locale}-${width}.png`,fullPage:true});
 await root.getByRole('button',{name:r[locale].editPickup,exact:true}).click();await root.getByLabel(c[locale].lead,{exact:true}).fill('25');await root.getByLabel(c[locale].tomorrow,{exact:true}).check();
 await expect(root.getByText(r[locale].editing,{exact:true})).toBeVisible();expect(state.writes).toHaveLength(0);
 await root.getByRole('button',{name:r[locale].reviewPickup,exact:true}).click();await expect(root.locator('.rst-intake-confirm')).toContainText('25');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`docs/evidence/restaurant-schedules-2026-10-15/review-${locale}-${width}.png`,fullPage:true});
 await root.getByRole('button',{name:r[locale].confirm,exact:true}).click();await expect.poll(()=>state.writes.length).toBe(1);await expect(root.locator('form')).toHaveCount(0);
 expect(JSON.parse(state.writes[0]).schedule.minimum_lead_minutes).toBe(25);await expect(root.getByRole('heading',{name:r[locale].unavailable,exact:true})).toBeVisible();
});
test('weekly stale review and identical uncertain retry',async({page})=>{
 const state=await seed(page);await open(page,'en');const root=page.locator('.rst-intake');await root.getByRole('button',{name:r.en.editPickup,exact:true}).click();await root.getByLabel(c.en.lead,{exact:true}).fill('35');await root.getByRole('button',{name:r.en.reviewPickup,exact:true}).click();state.stale=true;await root.getByRole('button',{name:r.en.confirm,exact:true}).click();await root.getByRole('button',{name:r.en.refresh,exact:true}).click();await expect(root.getByLabel(c.en.lead,{exact:true})).toHaveValue('35');await expect(root.locator('.rst-intake-confirm')).toHaveCount(0);
 await root.getByRole('button',{name:r.en.reviewPickup,exact:true}).click();state.uncertain=true;await root.getByRole('button',{name:r.en.confirm,exact:true}).click();await expect(root.getByRole('button',{name:workText('en','retry'),exact:true})).toBeEnabled();const original=state.writes.at(-1);await root.getByRole('button',{name:workText('en','retry'),exact:true}).click();await expect(root.locator('form')).toHaveCount(0);expect(state.writes.at(-1)).toBe(original);
});
