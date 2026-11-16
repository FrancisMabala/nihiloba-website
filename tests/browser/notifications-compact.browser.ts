import {test,expect,type Page} from '@playwright/test';
import {fixture as wenzeFixture} from './wenze-checkout-fixture';
test.use({hasTouch:true});

async function setup(page:Page,long=false){
 await wenzeFixture(page);
 const question={reference:'SCT_test',display_reference:'Q123',topic:'other',status:'answered',message:'Comment partager ma boutique avec mes clients ?',created_at:'2026-11-15T10:00:00Z'};
 const records=[
  {reference:'NTF_report',marketplace:'wenze',title:'Votre rapport de ventes est prêt',description:'Boutique Mwinda · Rapport du 9 au 15 nov.',event_type:'private_report_ready',action_url:'https://nihiloba.com/fr/shida/seller/wenze/?view=reports&store=WNZ_fixture&artifact=WRA_test',read:false},
  {reference:'NTF_support',marketplace:'support',title:'SHIDA a répondu à votre question.',description:question.message,event_type:'question_answered',action_url:'https://nihiloba.com/fr/shida/space/?view=questions&question=SCT_test',read:false},
  {reference:'NTF_read',marketplace:'security',title:'Méthode de récupération ajoutée',description:'SHIDA',event_type:'method_added',action_url:'https://nihiloba.com/fr/shida/space/?view=settings',read:true},
  ...(long?Array.from({length:17},(_,i)=>({reference:'NTF_long'+i,marketplace:i%2?'wenze':'services',title:'Une activité importante pour votre organisation et ses établissements dans plusieurs communes',description:'Délégation de l’Union européenne en République démocratique du Congo — '+(i===0?'SansEspaces'.repeat(25):'Information conservée intégralement'),event_type:'notice',action_url:'https://nihiloba.com/fr/shida/space/?view=settings',read:false})):[])
 ].map(n=>({created_at:'2026-11-16T08:02:00Z',expired:false,acknowledged:false,action_required:n.reference==='NTF_report',...n}));
 const state={failRead:false,failList:false,failMore:false,delay:false,actions:[] as {action:string;references:string[]}[],requests:[] as string[],downloads:[] as string[]};
 await page.route('https://nihiloba.com/**',r=>{const u=new URL(r.request().url());return r.fulfill({status:302,headers:{Location:(process.env.NOTIFICATIONS_TEST_URL??'http://127.0.0.1:3047')+u.pathname+u.search}});});
 await page.route('**/api/**',async r=>{const req=r.request(),u=new URL(req.url()),p=u.pathname.replace(/\/$/,'');state.requests.push(p+u.search);const send=(json:unknown,status=200)=>r.fulfill({json,status});
  if(p.endsWith('/notifications/count'))return send({unread_count:records.filter(n=>!n.read).length});
  if(p.endsWith('/notifications/actions')){const body=req.postDataJSON();state.actions.push(body);if(body.action==='read'){if(state.failRead)return send({},503);for(const n of records)if(body.references.includes(n.reference))n.read=true;}return send({updated:body.references.length});}
  if(p.endsWith('/notifications')){if(state.failList||state.failMore&&u.searchParams.has('before'))return send({},503);if(state.delay)await new Promise(resolve=>setTimeout(resolve,700));
   const filtered=records.filter(n=>(!u.searchParams.get('marketplace')||n.marketplace===u.searchParams.get('marketplace'))&&(u.searchParams.get('mode')!=='unread'||!n.read)&&(u.searchParams.get('mode')!=='action_required'||n.action_required));
   // Cursor ordering remains valid after prior pages have been marked read.
   const before=records.findIndex(n=>n.reference===u.searchParams.get('before')),remaining=filtered.filter(n=>records.indexOf(n)>before),items=remaining.slice(0,4);
   return send({items,next_cursor:remaining.length>4?items.at(-1)!.reference:null});}
  if(p.endsWith('/notifications/preferences'))return send({preferences:[]});
  if(p.includes('/support/questions')){if(p.endsWith('/questions'))return send({questions:[question],has_more:false});return send({question,messages:[{id:1,author:'user',message:question.message,channel:'web',created_at:question.created_at},{id:2,author:'support',message:'Ouvrez Ma boutique, puis Partager pour copier votre lien.',channel:'web',created_at:'2026-11-16T08:02:00Z'}]});}
  if(p.endsWith('/pro/dashboard'))return send({currency_summaries:[],period:{date_from:'2026-11-09',date_to:'2026-11-15',timezone:'Africa/Kinshasa'}});
  if(p.includes('/reports/artifacts/')){state.downloads.push(p);return r.fulfill({body:'synthetic report',contentType:'application/pdf',headers:{'Content-Disposition':'attachment; filename="report.pdf"'}});}
  return r.fallback();
 });
 return {records,state};
}
const list=(page:Page)=>page.locator('.notification-panel');
const row=(page:Page,ref:string)=>list(page).locator(`[data-reference=${ref}]`);
const fit=async(page:Page)=>expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBe(0);

test('compact rows, long content, touch menus, enlarged text, tablet and desktop',async({page})=>{
 await setup(page,true);
 for(const width of [320,375,390,430,768,1440]){
  await page.setViewportSize({width,height:844});await page.goto('/fr/shida/space/?view=messages');await expect(list(page).locator('article')).toHaveCount(4);await fit(page);
  await expect(row(page,'NTF_report').getByRole('link',{name:/Notification non lue.*Voir le rapport/})).toHaveAttribute('href',/store=WNZ_fixture&artifact=WRA_test/);
  await expect(row(page,'NTF_read').locator('.notice-unread-dot')).toHaveCount(0);await expect(row(page,'NTF_support').getByText('Notification non lue.')).toHaveCount(1);
  expect(await row(page,'NTF_report').locator('a button').count()).toBe(0);
  const menu=row(page,'NTF_report').getByRole('button',{name:/Autres actions/});await menu.tap();await expect(page.getByRole('menuitem',{name:'Marquer comme lue'})).toBeFocused();await page.keyboard.press('Escape');await expect(menu).toBeFocused();await expect(page.getByRole('menu')).toHaveCount(0);
  await menu.click();await page.getByRole('heading',{name:'Notifications',exact:true}).click();await expect(page.getByRole('menu')).toHaveCount(0);
  await menu.focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Home');await expect(page.getByRole('menuitem')).toBeFocused();await page.keyboard.press('Shift+Tab');await expect(row(page,'NTF_report').getByRole('link')).toBeFocused();await expect(page.getByRole('menu')).toHaveCount(0);
  if(width<=430){await list(page).getByRole('button',{name:'Filtres',exact:true}).click();await expect(list(page).getByRole('combobox').first()).toBeVisible();await list(page).getByRole('combobox').first().selectOption('action_required');await expect(list(page).locator('article')).toHaveCount(1);await list(page).getByRole('button',{name:'Effacer les filtres'}).click();await expect(list(page).locator('article')).toHaveCount(4);}
 }
 await page.setViewportSize({width:320,height:844});await page.evaluate(()=>document.documentElement.style.fontSize='200%');await fit(page);await row(page,'NTF_long0').scrollIntoViewIfNeeded();await fit(page);
 await page.evaluate(()=>document.documentElement.style.fontSize='');
 for(const height of [600,844]){await page.setViewportSize({width:375,height});const last=row(page,'NTF_long0');await last.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));
  const clear=await last.evaluate(e=>{const box=e.getBoundingClientRect(),navs=[...document.querySelectorAll('nav')].filter(n=>getComputedStyle(n).position==='fixed'&&n.getBoundingClientRect().height>0);return navs.every(n=>box.bottom<=n.getBoundingClientRect().top||box.top>=n.getBoundingClientRect().bottom);});expect(clear).toBe(true);
  const trigger=last.getByRole('button',{name:/Autres actions/});await trigger.evaluate(e=>window.scrollBy({top:e.getBoundingClientRect().bottom-(innerHeight-100),behavior:'instant'}));
  await trigger.tap();await expect(page.getByRole('menuitem')).toBeVisible();expect(await page.getByRole('menu').evaluate(e=>{const box=e.getBoundingClientRect();return box.bottom<=innerHeight&&[...document.querySelectorAll('nav')].filter(n=>getComputedStyle(n).position==='fixed'&&n.getBoundingClientRect().height>0).every(n=>box.bottom<=n.getBoundingClientRect().top||box.top>=n.getBoundingClientRect().bottom);})).toBe(true);await page.keyboard.press('Escape');await fit(page);
 }
});

test('read failures, persisted counts, global bulk scope and pagination',async({page})=>{
 const {state,records}=await setup(page,true);await page.setViewportSize({width:390,height:844});await page.goto('/fr/shida/space/?view=messages');await expect(list(page).locator('article')).toHaveCount(4);
 expect(state.actions.every(a=>a.action==='view')).toBe(true);expect(records.filter(n=>!n.read)).toHaveLength(19);
 await list(page).getByRole('button',{name:'Voir la suite'}).click();await expect(list(page).locator('article')).toHaveCount(8);
 state.failRead=true;const menu=row(page,'NTF_report').getByRole('button',{name:/Autres actions/});await menu.click();await page.getByRole('menuitem',{name:'Marquer comme lue'}).click();await expect(list(page).getByRole('alert')).toBeVisible();await expect(row(page,'NTF_report').locator('.notice-unread-dot')).toHaveCount(1);await expect(list(page).getByRole('button',{name:'Non lues (19)',exact:true})).toBeVisible();
 state.failRead=false;await menu.click();await page.getByRole('menuitem',{name:'Marquer comme lue'}).click();await expect(list(page).getByRole('button',{name:'Non lues (18)',exact:true})).toBeVisible();await expect(list(page).locator('article')).toHaveCount(8);await expect(row(page,'NTF_report').getByRole('link')).toBeFocused();
 await expect(page.locator('.notification-header-link strong').first()).toHaveText('18');
 await list(page).getByRole('button',{name:'Filtres',exact:true}).click();await list(page).getByRole('combobox').last().selectOption('support');await expect(list(page).locator('article')).toHaveCount(1);
 await list(page).getByRole('button',{name:'Tout marquer comme lu',exact:true}).click();await expect(list(page).getByRole('button',{name:'Non lues (0)',exact:true})).toBeVisible();expect(records.every(n=>n.read)).toBe(true);await expect(list(page).getByRole('button',{name:'Tout marquer comme lu',exact:true})).toBeDisabled();
 await page.reload();await expect(list(page).getByRole('button',{name:'Non lues (0)',exact:true})).toBeVisible();await expect(list(page).locator('article')).toHaveCount(1);expect(new URL(page.url()).searchParams.get('notice_market')).toBe('support');
});

test('support and report destinations, back navigation, restored pages and scroll',async({page})=>{
 const {state}=await setup(page,true);await page.setViewportSize({width:390,height:844});await page.goto('/fr/shida/space/?view=messages');await expect(row(page,'NTF_support')).toBeVisible();
 state.failRead=true;await row(page,'NTF_support').getByRole('link').click();await expect(list(page).getByRole('alert')).toBeVisible();await expect(page).toHaveURL(/view=messages/);
 state.failRead=false;await row(page,'NTF_support').getByRole('link').tap();await expect(page.locator('#help-subject')).toHaveText('Comment partager ma boutique avec mes clients ?');await expect(page.locator('.help-conversation')).toContainText('Ouvrez Ma boutique, puis Partager pour copier votre lien.');
 await page.goBack();await expect(row(page,'NTF_support').locator('.notice-unread-dot')).toHaveCount(0);
 await list(page).getByRole('button',{name:'Filtres',exact:true}).click();await list(page).getByRole('combobox').last().selectOption('wenze');await expect(row(page,'NTF_support')).toHaveCount(0);
 await row(page,'NTF_report').getByRole('link').tap();await expect(page).toHaveURL(/store=WNZ_fixture&artifact=WRA_test/);await expect(page.locator('.seller-workspace')).toContainText('Boutique du Fleuve');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Voir le rapport',exact:true}).click();await download;expect(state.downloads.at(-1)).toContain('/WNZ_fixture/reports/artifacts/WRA_test');
 await page.goBack();await expect(row(page,'NTF_report')).toBeVisible();await expect(page).toHaveURL(/notice_market=wenze/);await list(page).getByRole('button',{name:/^Filtres/}).click();await expect(list(page).getByRole('combobox').last()).toHaveValue('wenze');await list(page).getByRole('button',{name:'Effacer les filtres'}).click();await expect(list(page).locator('article')).toHaveCount(4);await list(page).getByRole('button',{name:'Voir la suite'}).click();await expect(list(page).locator('article')).toHaveCount(8);
 await row(page,'NTF_long4').scrollIntoViewIfNeeded();const y=await page.evaluate(()=>scrollY);await row(page,'NTF_long4').getByRole('link').click();await expect(page).toHaveURL(/view=settings/);await page.goBack();await expect(list(page).locator('article')).toHaveCount(8);await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(y-80);await fit(page);
});

test('load failures, no matches, empty state, loading and page failure preserve data',async({page})=>{
 const {state,records}=await setup(page,true);state.failList=true;await page.goto('/fr/shida/space/?view=messages');await expect(list(page).getByRole('alert')).toBeVisible();await expect(list(page).locator('.messages-empty')).toHaveCount(0);
 state.failList=false;state.delay=true;await list(page).getByRole('alert').getByRole('button').click();await expect(list(page).getByRole('status')).toBeVisible();await expect(list(page).locator('article')).toHaveCount(4);state.delay=false;state.failMore=true;
 await list(page).getByRole('button',{name:'Voir la suite'}).click();await expect(list(page).getByRole('alert')).toBeVisible();await expect(list(page).locator('article')).toHaveCount(4);state.failMore=false;await list(page).getByRole('button',{name:'Voir la suite'}).click();await expect(list(page).locator('article')).toHaveCount(8);
 await list(page).getByRole('combobox').last().selectOption('hotels');await expect(list(page)).toContainText('Aucune alerte dans cette vue.');await expect(list(page).locator('.messages-empty')).toHaveCount(0);records.splice(0);await list(page).getByRole('button',{name:'Effacer les filtres'}).click();await expect(list(page).locator('.messages-empty')).toBeVisible();
});
