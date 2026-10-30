import {test,expect,type Page} from '@playwright/test';
import {spaceSettingsCopy} from '../../app/lib/space-settings-copy';
import {messagesText} from '../../app/lib/messages-design-copy';
const output=process.env.MESSAGES_EVIDENCE_DIR||'test-results/messages-evidence';
const markets=['wenze','restaurants','services','employment'];
const titles=['Order confirmed','Your order is ready','New service request','New application'];
const urls=['https://nihiloba.com/shida/wenze/orders','https://nihiloba.com/shida/restaurant-orders/ROD_fixture','https://nihiloba.com/shida/service-requests?request=SWR_fixture','https://nihiloba.com/shida/my-applications/APP_fixture'];
function notice(i:number){return {reference:`NTF_fixture_${i}`,marketplace:markets[i%4],title:titles[i%4],description:['Your order has been confirmed.','Your order is ready for pickup.','A new service request needs your attention.','There is an update to your job application.'][i%4],created_at:`2026-10-${String(30-i%20).padStart(2,'0')}T10:30:00Z`,read:i%2===1,action_required:i%4===2,expired:false,acknowledged:false,can_handoff:i%4===2,action_url:urls[i%4]};}
async function fixture(page:Page,count=4){
 const state={rows:Array.from({length:count},(_,i)=>notice(i)),signedIn:true,failed:false,partial:false,slow:false,preference:{mode:'two_hour',daily_time:null as string|null,timezone_name:null as string|null},writes:[] as string[],securityWrites:0};
 await page.route('**/api/**',async route=>{
  const req=route.request(),u=new URL(req.url()),p=u.pathname.replace(/\/$/,'');const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(p.endsWith('/employment/session'))return state.signedIn?reply({binding:'a'.repeat(64),user:{display_name:'Review account'}}):reply({},401);
  if(p.includes('/security/')&&req.method()==='POST')state.securityWrites++;
  if(p.endsWith('/security/navigation'))return reply({can_manage:false,markets:[],organization_management:false});
  if(p.endsWith('/security/profile'))return reply({revision:'r1',values:{personal_name:'Review account',country_code:'CD',city:'Kinshasa',area:'Gombe'},primary_phone:{masked:'•••• 0001',verified:true},neighborhood:null});
  if(p.endsWith('/security'))return reply({email:null,email_ready_at:null,passkeys:[],protected:false});
  if(p.endsWith('/security/phone'))return reply({changes:[]});
  if(p.endsWith('/security/recovery'))return reply({methods:[]});
  if(p.endsWith('/notifications/delivery-preferences')){if(req.method()==='PUT'){state.preference=req.postDataJSON();state.writes.push('preference');}return reply({...state.preference,timezones:['Africa/Kinshasa','Europe/Stockholm','UTC']});}
  if(p.endsWith('/notifications/count'))return reply({unread_count:state.rows.filter(r=>!r.read).length});
  if(p.endsWith('/notifications/actions')){const {action,references}=req.postDataJSON();state.writes.push(action);expect(references.length).toBeLessThanOrEqual(50);if(action==='read')state.rows.forEach(r=>{if(references.includes(r.reference))r.read=true;});return reply({updated:references.length});}
  if(p.endsWith('/handoff')){state.writes.push('handoff');return reply({url:'https://wa.me/243899000000?text=SHIDA%20NOTIFICATION%20NHT_disposable_fixture'});}
  if(p.endsWith('/notifications')){
   if(state.slow)await new Promise(resolve=>setTimeout(resolve,700));
   if(state.failed)return reply({},503);if(state.partial)return reply({items:[]});
   const start=u.searchParams.get('before')?state.rows.findIndex(r=>r.reference===u.searchParams.get('before'))+1:0;
   let rows=state.rows.slice(start);const mode=u.searchParams.get('mode'),market=u.searchParams.get('marketplace');
   rows=rows.filter(r=>(mode!=='unread'||!r.read)&&(mode!=='action_required'||r.action_required)&&(!market||r.marketplace===market));const limit=Number(u.searchParams.get('limit')||20),items=rows.slice(0,limit);return reply({items,next_cursor:rows.length>limit?items.at(-1)!.reference:null});
  }
  if(p.endsWith('/wenze/stores'))return reply({stores:[]});if(p.endsWith('/restaurants'))return reply({items:[],total:0,actions:['create']});if(p.endsWith('/services'))return reply({profiles:[]});if(p.endsWith('/services/capabilities'))return reply({capabilities:['profile']});
  return reply({},404);
 });return state;
}
for(const width of [360,390,768,1440])for(const view of ['populated','empty','preferences','default','settings'])test(`visual ${view} ${width}`,async({page})=>{
 const state=await fixture(page,view==='empty'?0:4);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:900});
 await page.goto('/shida/space/'+(view==='default'?'':`?view=${view==='settings'?'settings':'messages'}`));
 if(view==='default'){await expect(page.getByRole('heading',{name:'My activities',exact:true})).toBeVisible();await expect(page.locator('.space-links-overview,.personal-activity-overview')).toHaveCount(0);}
 else if(view==='settings'){await expect(page.locator('.account-protection a')).toBeVisible();await expect(page.locator('.space-danger a[href="?view=recovery"]')).toHaveCount(0);await expect(page.locator('.space-danger')).toContainText('Delete my account');expect(state.securityWrites).toBe(0);}
 else{await expect(page.locator('.messages-tabs button')).toHaveCount(2);await expect(page.getByRole('button',{name:'Conversations',exact:true})).toHaveCount(0);
 if(view==='preferences'){await page.getByRole('button',{name:'Preferences',exact:true}).click();await expect(page.getByLabel('Every two hours',{exact:true})).toBeChecked();await expect(page.locator('.messages-preferences input[type=email]')).toHaveCount(0);expect(state.writes).not.toContain('preference');}
 else if(view==='empty'){await expect(page.locator('.messages-empty')).toBeVisible();await expect(page.locator('.notification-filters')).toHaveCount(0);}
 else await expect(page.locator('.notification-card')).toHaveCount(4);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);await page.screenshot({path:`${output}/messages-${view}-${width}.png`,fullPage:true});
});
test('one notification, read versus action, filters and secure handoff',async({page})=>{
 const state=await fixture(page,1);await page.goto('/shida/space/?view=messages');await expect(page.locator('.notification-card')).toHaveCount(1);await expect.poll(()=>state.writes.includes('view')).toBe(true);expect(state.writes).not.toContain('read');expect(state.writes).not.toContain('acknowledge');await expect(page.getByRole('link',{name:'View order',exact:true})).toHaveAttribute('href',urls[0]);
 state.rows=[notice(0),notice(1),notice(2),notice(3)];await page.reload();await expect(page.locator('.notification-card')).toHaveCount(4);await page.getByRole('combobox',{name:'All marketplaces'}).selectOption('services');await expect(page.locator('.notification-card')).toHaveCount(1);
 await page.getByRole('button',{name:'Mark read',exact:true}).click();await expect(page.locator('.notification-card')).toContainText('Action required');expect(state.writes).not.toContain('acknowledge');
 await page.getByRole('button',{name:'Continue in WhatsApp',exact:true}).click();await expect(page.locator('a[href^="https://wa.me/"]')).toBeVisible();expect(state.writes).toContain('handoff');expect(state.writes).not.toContain('acknowledge');
 await page.getByRole('combobox',{name:'All activity'}).selectOption('unread');await expect(page.locator('.notification-card')).toHaveCount(0);await expect(page.locator('.messages-empty')).toHaveCount(0);
 state.signedIn=false;await page.evaluate(()=>window.dispatchEvent(new Event('shida-personal-session-changed')));await expect(page.locator('.messages-space')).toHaveCount(0);await expect(page.getByRole('link',{name:'Report a lost or stolen phone'})).toBeVisible();
});
test('mark all spans bounded pages and never acknowledges',async({page})=>{
 const state=await fixture(page,65);state.rows.forEach(r=>r.read=false);await page.goto('/shida/space/?view=messages');await expect(page.locator('.notification-card')).toHaveCount(20);await page.getByRole('button',{name:'Mark all as read',exact:true}).click();await expect.poll(()=>state.rows.filter(r=>!r.read).length).toBe(0);expect(state.writes.filter(x=>x==='read')).toHaveLength(2);expect(state.writes).not.toContain('acknowledge');
});
test('loading and failure never assert empty; partial response retry',async({page})=>{
 const state=await fixture(page,0);state.slow=true;state.failed=true;await page.goto('/shida/space/?view=messages');await expect(page.locator('.notification-panel [role=status]')).toBeVisible();await expect(page.locator('.messages-empty')).toHaveCount(0);await expect(page.locator('.notification-panel [role=alert]')).toBeVisible();state.failed=false;state.partial=true;await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.locator('.notification-panel [role=alert]')).toBeVisible();await expect(page.locator('.messages-empty')).toHaveCount(0);state.partial=false;await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.locator('.messages-empty')).toBeVisible();
});
for(const locale of ['en','fr','ln','sw'] as const)test(`preferences and compatible navigation ${locale}`,async({page})=>{
 const state=await fixture(page),prefix=locale==='en'?'':'/'+locale,t=spaceSettingsCopy[locale];
 await page.goto(`${prefix}/shida/space/?view=home`);await expect(page.locator('.account-activities-page')).toBeVisible();
 await page.goto(`${prefix}/shida/space/?view=messages`);const tab=page.getByRole('button',{name:messagesText(locale,'preferences'),exact:true});await tab.focus();await page.keyboard.press('Enter');await expect(page.getByLabel(t.two_hour,{exact:true})).toBeChecked();
 await page.getByLabel(t.daily,{exact:true}).check();await page.getByLabel(t.time,{exact:true}).fill('18:00');await page.getByLabel(t.timezone,{exact:true}).selectOption('UTC');await page.getByRole('button',{name:t.save,exact:true}).click();await expect(page.locator('.space-delivery [role=status]')).toHaveText(t.saved);expect(state.preference).toEqual({mode:'daily',daily_time:'18:00',timezone_name:'UTC'});
 state.preference={mode:'immediate',daily_time:null,timezone_name:null};await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(page.getByLabel(t.immediate,{exact:true})).toBeChecked();expect(state.writes.filter(x=>x==='preference')).toHaveLength(1);
});
