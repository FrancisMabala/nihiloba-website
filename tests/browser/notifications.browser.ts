import {expect,test} from '@playwright/test';
import {messagesText} from '../../app/lib/messages-design-copy';
import {notificationCopy} from '../../app/lib/notification-center-copy';

for(const width of [360,1440])for(const locale of ['fr','en','ln','sw'] as const)test(`notification history and saved preferences ${locale} ${width}`,async({page})=>{
 const prefix=locale==='en'?'':'/'+locale, t=notificationCopy[locale];
 const records=[
  {reference:'NTF_first',marketplace:'services',event_type:'message',description:'Studio Rose',activity_reference:'RSV_one',can_handoff:true,read:false},
  {reference:'NTF_second',marketplace:'services',event_type:'message',description:'Studio Rose',activity_reference:'RSV_one',can_handoff:true,read:true},
  {reference:'NTF_report',marketplace:'wenze',event_type:'private_report_ready',description:'Boutique Mwinda',action_url:'https://nihiloba.com'+prefix+'/shida/seller/wenze/?view=reports&store=WS_test&artifact=WRA_test',read:true},
  {reference:'NTF_account',marketplace:'security',event_type:'method_added',description:'SHIDA',action_url:'https://nihiloba.com'+prefix+'/shida/space/?view=settings',read:true}
 ].map(n=>({title:n.event_type==='method_added'?({fr:'Méthode de récupération ajoutée',en:'Recovery method added',sw:'Njia ya urejeshaji imeongezwa',ln:'Nzela ya kozongisa konte ebakisami'}[locale]):'Update',created_at:'2026-11-10T12:00:00Z',expired:false,acknowledged:false,action_required:false,action_url:null,...n}));
 const handoffs:string[]=[],actions:string[]=[];
 let failLoad=false,empty=false,mode='two_hour',failSave=true;
 await page.addInitScript(()=>{window.open=()=>null;});
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname.replace(/\/$/,'');
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Test Recipient'}});
  if(path.endsWith('/notifications/count'))return reply({unread_count:empty?0:records.filter(n=>!n.read).length});
  if(path.endsWith('/notifications/actions')){
   const body=req.postDataJSON();actions.push(body.action);
   if(body.action==='read')for(const n of records)if(body.references.includes(n.reference))n.read=true;
   return reply({updated:body.references.length});
  }
  if(path.endsWith('/handoff')){
   const ref=path.split('/').at(-2)!;handoffs.push(ref);
   return reply({url:'https://wa.me/243899000000?text=SHIDA%20NOTIFICATION%20'+ref});
  }
  if(path.endsWith('/delivery-preferences')){
   if(req.method()==='PUT'){if(failSave){failSave=false;return reply({},503);}mode=req.postDataJSON().mode;}
   return reply({mode,daily_time:null,timezone_name:null,timezones:['Africa/Kinshasa']});
  }
  if(path.endsWith('/preferences'))return reply({preferences:[]});
  if(path.endsWith('/notifications')){
   if(failLoad)return reply({},503);
   return reply({items:empty?[]:records.filter(n=>(!url.searchParams.get('marketplace')||url.searchParams.get('marketplace')===n.marketplace)&&(url.searchParams.get('mode')!=='unread'||!n.read)),next_cursor:null});
  }
  return reply({},404);
 });
 await page.setViewportSize({width,height:900});await page.goto(prefix+'/shida/space/');
 await page.locator('.notification-bell:visible').first().click();
 await expect(page).toHaveURL(/view=messages/);
 const panel=page.locator('.notification-panel'),row=(ref:string)=>panel.locator('[data-reference="'+ref+'"]');
 await expect(panel.locator('article')).toHaveCount(4);await expect(panel.getByText(messagesText(locale,'sendHint'))).toHaveCount(1);
 await expect(row('NTF_second')).toContainText(messagesText(locale,'info'));
 await expect(page.locator('.space-notice-count')).toHaveText('1');
 const report=row('NTF_report').getByRole('link');await expect(report).toHaveAttribute('href',/store=WS_test&artifact=WRA_test/);
 await expect(row('NTF_account').getByRole('link')).toHaveAttribute('href',/view=settings/);
 await expect(page.locator('button.market-avatar:visible').first()).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(locale==='fr')await page.screenshot({path:`test-results/messages-evidence/notifications-${width}.png`,fullPage:true});
 for(const [ref,key] of [['NTF_first','readWa'],['NTF_second','openWa']] as const){
  await row(ref).getByRole('button',{name:messagesText(locale,key)}).click();
  const link=row(ref).getByRole('link');await expect(link).toHaveAttribute('href',new RegExp(ref+'$'));
 }
 expect(handoffs).toEqual(['NTF_first','NTF_second']);expect(actions).not.toContain('read');expect(records[0].read).toBe(false);
 await row('NTF_first').getByRole('button',{name:t[8]}).click();await expect(row('NTF_first')).toContainText(messagesText(locale,'info'));
 await expect(page.locator('.notification-bell:visible').first().locator('strong')).toHaveCount(0);
 if(locale==='fr'&&width===1440){
  // Resolve production-shaped destinations against this local test server.
  await page.route('https://nihiloba.com/**',r=>{const u=new URL(r.request().url());return r.fulfill({status:302,headers:{Location:'http://127.0.0.1:3047'+u.pathname+u.search}});});
  await row('NTF_account').getByRole('link').click();await expect(page).toHaveURL(/view=settings/);
  await expect(page.locator('.space-sidebar a[aria-current=page]')).toHaveAttribute('href',/view=settings/);
  await page.goBack();await row('NTF_report').getByRole('link').click();await expect(page).toHaveURL(/seller\/wenze.*store=WS_test&artifact=WRA_test/);
  await page.goBack();
 }
 await panel.getByRole('combobox').first().selectOption('unread');await expect(panel.getByText(t[6])).toBeVisible();
 await page.getByRole('button',{name:messagesText(locale,'preferences'),exact:true}).click();
 const form=page.locator('.messages-preferences'),save=form.getByRole('button',{name:locale==='fr'?'Enregistrer':locale==='sw'?'Hifadhi':locale==='ln'?'Bomba':'Save',exact:true});
 await expect(form.locator('[value=two_hour]')).toBeChecked();await expect(save).toBeDisabled();
 await form.locator('[value=immediate]').check();await form.locator('[value=two_hour]').check();await expect(save).toBeDisabled();
 await form.locator('[value=inbox_only]').check();await save.click();await expect(form.getByRole('alert')).toBeVisible();
 await expect(form.locator('[value=inbox_only]')).toBeChecked();await form.getByRole('alert').getByRole('button').click();
 await expect(save).toBeDisabled();expect(mode).toBe('inbox_only');
 await page.reload();await page.getByRole('button',{name:messagesText(locale,'preferences'),exact:true}).click();await expect(form.locator('[value=inbox_only]')).toBeChecked();
 if(locale==='fr')await page.screenshot({path:`test-results/messages-evidence/preferences-${width}.png`,fullPage:true});
 failLoad=true;await page.reload();await expect(panel.getByRole('alert')).toBeVisible();await expect(panel.locator('.messages-empty')).toHaveCount(0);
 failLoad=false;empty=true;await panel.getByRole('alert').getByRole('button').click();await expect(panel.locator('.messages-empty')).toBeVisible();
});