import {spaceSettingsCopy} from '../../app/lib/space-settings-copy';
import {test,expect,type Page} from '@playwright/test';
async function fixture(page:Page){
 await page.route('**/api/**',route=>{
  const p=new URL(route.request().url()).pathname.replace(/\/$/,'');const reply=(json:unknown)=>route.fulfill({json});
  if(p.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Demo Account'}});
  if(p.endsWith('/security/navigation'))return reply({can_manage:false,markets:[],organization_management:false});
  if(p.endsWith('/security/profile'))return reply({revision:'r1',values:{personal_name:'Demo Account',country_code:'CD',city:'Kinshasa',area:'Gombe'},primary_phone:{masked:'•••• 0001',verified:true},neighborhood:null});
  if(p.endsWith('/security'))return reply({email:null,email_ready_at:null,passkeys:[],protected:false});
  if(p.endsWith('/security/phone'))return reply({changes:[]});
  if(p.endsWith('/security/recovery'))return reply({methods:[]});
  if(p.endsWith('/notifications/delivery-preferences'))return reply({mode:'two_hour',daily_time:null,timezone_name:null,timezones:['Africa/Kinshasa','Europe/Stockholm','UTC']});
  if(p.endsWith('/notifications/count'))return reply({unread_count:0});
  if(p.endsWith('/notifications'))return reply({items:[],next_cursor:null});
  if(p.endsWith('/wenze/stores'))return reply({stores:[]});
  if(p.endsWith('/restaurants'))return reply({items:[],total:0,actions:['create']});
  if(p.endsWith('/services/capabilities'))return reply({capabilities:['profile']});
  if(p.endsWith('/services'))return reply({profiles:[]});
  if(p.endsWith('/briefs'))return reply({briefs:[],has_more:false});
  if(p.endsWith('/postings'))return reply({requests:[],next_ref:null});
  return route.fulfill({status:404,json:{}});
 });
}
const folder=process.env.MY_SPACE_EVIDENCE_DIR||'test-results/visual';
for(const width of [390,1440])for(const view of ['settings','messages','management','service-requests'])test(`visual ${view} ${width}`,async({page})=>{
 await fixture(page);
 await page.setViewportSize({width,height:900});await page.goto(view==='service-requests'?'/fr/shida/service-requests':`/fr/shida/space?view=${view}`);
 if(view==='settings')await expect(page.getByRole('button',{name:'Modifier',exact:true})).toBeVisible();
 if(view==='messages')await expect(page.getByText('Aucune notification pour le moment.',{exact:true})).toBeVisible();
 if(view==='management')await expect(page.locator('.space-empty')).toBeVisible();
 if(view==='service-requests')await expect(page.locator('.transaction-empty')).toBeVisible();
 if(view==='messages'&&process.env.SPACE_CAPTURE_PHASE!=='before')await page.locator('.space-delivery>summary').click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`${folder}/refinement-${process.env.SPACE_CAPTURE_PHASE||'after'}-${view}-${width}.png`,fullPage:true});
});

for(const locale of ['en','fr','ln','sw'] as const)test(`preference persistence and refresh ${locale}`,async({page})=>{
 await fixture(page);const t=spaceSettingsCopy[locale];let writes=0;let saved={mode:'daily',daily_time:'18:00',timezone_name:'Europe/Stockholm'};
 await page.route('**/notifications/delivery-preferences',route=>{if(route.request().method()==='PUT'){saved=route.request().postDataJSON();writes++;}return route.fulfill({json:{...saved,timezones:['Africa/Kinshasa','Europe/Stockholm','UTC']}});});
 await page.goto(`${locale==='en'?'':'/'+locale}/shida/space?view=messages`);
 await page.locator('.space-delivery>summary').click();const panel=page.locator('.space-delivery');
 await expect(panel.getByLabel(t.daily,{exact:true})).toBeChecked();await expect(panel.getByLabel(t.time,{exact:true})).toHaveValue('18:00');expect(writes).toBe(0);
 for(const mode of ['inbox_only','immediate','two_hour','daily'] as const){await panel.getByLabel(t[mode],{exact:true}).check();if(mode==='daily'){await panel.getByLabel(t.time,{exact:true}).fill('08:30');await panel.getByRole('combobox',{name:t.timezone,exact:true}).selectOption('UTC');}await panel.getByRole('button',{name:t.save,exact:true}).click();await expect(panel.getByRole('status')).toHaveText(t.saved);expect(saved.mode).toBe(mode);}
 expect(writes).toBe(4);saved={mode:'two_hour',daily_time:null!,timezone_name:null!};await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(panel.getByLabel(t.two_hour,{exact:true})).toBeChecked();expect(writes).toBe(4);
});
test('profile cancel discards edits and security forms start collapsed',async({page})=>{
 await fixture(page);await page.goto('/shida/space?view=settings');const profile=page.locator('.space-profile');
 await profile.getByRole('button',{name:'Edit',exact:true}).click();await profile.locator('#profile-personal_name').fill('Unsaved');await profile.getByRole('button',{name:'Cancel',exact:true}).click();await expect(profile).toContainText('Demo Account');await profile.getByRole('button',{name:'Edit',exact:true}).click();await expect(profile.locator('#profile-personal_name')).toHaveValue('Demo Account');
 await expect(page.locator('.space-security-setting[open]')).toHaveCount(0);const setting=page.locator('.space-security-setting').first();await expect(setting.locator('summary')).toContainText('Not configured');await setting.locator('summary').focus();await page.keyboard.press('Enter');await expect(setting).toHaveAttribute('open');await expect(setting.getByRole('button',{name:'Add a passkey',exact:true})).toBeVisible();
});

test('preference failure does not claim a default or save',async({page})=>{
 await fixture(page);await page.route('**/notifications/delivery-preferences',r=>r.fulfill({status:503,json:{}}));await page.goto('/shida/space?view=messages');await page.locator('.space-delivery>summary').click();await expect(page.locator('.space-delivery [role=alert]')).toBeVisible();await expect(page.locator('.space-delivery input[type=radio]')).toHaveCount(0);
});
test('configured and pending security methods reflect backend dates',async({page})=>{
 await fixture(page);await page.route('**/personal/security/',r=>r.fulfill({json:{email:'d***@example.test',email_ready_at:'2099-01-01',passkeys:[{reference:'KEY_test',ready_at:'2020-01-01'}],protected:true}}));await page.goto('/shida/space?view=settings');const rows=page.locator('.space-security-setting');await expect(rows.nth(0).locator('small')).toHaveText('Configured');await expect(rows.nth(1).locator('small')).toHaveText('Activation pending');await expect(rows.nth(2).locator('small')).toHaveText('Not configured');
});

for(const width of [390,1440])test(`populated service requests ${width}`,async({page})=>{
 await fixture(page);await page.route('**/briefs**',r=>r.fulfill({json:{briefs:[{brief_ref:'BRF_demo',status:'DRAFT',content:{category:'plumbing'},summary:{description:'Repair the kitchen tap'},expires_at:'2099-01-01T12:00:00Z'}],has_more:false}}));await page.setViewportSize({width,height:900});await page.goto('/shida/service-requests');await expect(page.locator('.svc-brief-card')).toContainText('Repair the kitchen tap');await expect(page.locator('.svc-brief-card button')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
