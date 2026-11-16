import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

// The live audit loads public frontend assets, but EVERY API request is intercepted.
// No real session, notification body, read/view action or preference is used.
test('390px release audit uses the same synthetic records on live and local frontends',async({page})=>{
 const live=process.env.NOTIFICATIONS_AUDIT_LIVE==='1';
 const origin=new URL(process.env.NOTIFICATIONS_TEST_URL??'http://127.0.0.1:3047').origin;
 const evidence='C:/NIHILOBA/release-evidence/notifications-release-audit-20261116';
 const records=[
  {reference:'NTF_support',marketplace:'support',title:'SHIDA a répondu à votre question.',description:'comment utilisez shida',event_type:'question_answered',action_url:'https://nihiloba.com/fr/shida/space/?view=questions&question=SCT_test',read:false,created_at:'2026-11-15T15:22:00Z'},
  {reference:'NTF_report',marketplace:'wenze',title:'Votre rapport de ventes est prêt',description:'Wenze · SHIDA Boutique Test · 2 nov au 8 nov 2026',event_type:'private_report_ready',action_url:'https://nihiloba.com/fr/shida/seller/wenze/?view=reports&store=WNZ_fixture&artifact=WRA_test',read:true,created_at:'2026-11-09T08:01:00Z'},
  {reference:'NTF_security',marketplace:'security',title:'Nouvelle activité',description:'Sécurité du compte · Consultez cette activité dans votre espace SHIDA.',event_type:'notice',action_url:'https://nihiloba.com/fr/shida/space/?view=settings',read:true,created_at:'2026-11-08T08:01:00Z'}
 ].map(row=>({...row,expired:false,acknowledged:false,action_required:false}));
 const intercepted:string[]=[],assets:string[]=[];
 page.on('response',response=>{if(response.url().includes('/_next/static/')&&response.ok())assets.push(response.url());});
 await page.route('**/*',route=>{
  const request=route.request(),url=new URL(request.url()),path=url.pathname.replace(/\/$/,'');
  if(path.startsWith('/api/')){
   intercepted.push(request.method()+' '+path);
   const send=(json:unknown)=>route.fulfill({json});
   if(path.endsWith('/employment/session'))return send({binding:'a'.repeat(64),user:{display_name:'Synthetic audit'}});
   if(path.endsWith('/notifications/count'))return send({unread_count:1});
   if(path.endsWith('/notifications/actions'))return send({updated:request.postDataJSON().references.length});
   if(path.endsWith('/notifications'))return send({items:records,next_cursor:null});
   if(path.endsWith('/notifications/preferences'))return send({preferences:[]});
   return send({});
  }
  if(url.origin!==origin||request.method()!=='GET')return route.abort();
  return route.continue();
 });
 await page.setViewportSize({width:390,height:844});
 await page.goto('/fr/shida/space/?view=messages');
 const panel=page.locator('.notification-panel'),rows=panel.locator('.notification-card');
 await expect(rows).toHaveCount(3);
 if(live){await expect(panel.getByText('Nouvelle',{exact:true})).toBeVisible();await expect(panel.getByText('Notification lue',{exact:true})).toHaveCount(2);await expect(panel.locator('.notice-main')).toHaveCount(0);}
 else{
  await expect(panel.locator('.notice-state,.notice-new')).toHaveCount(0);
  await expect(panel.getByText('Nouvelle',{exact:true})).toHaveCount(0);
  await expect(panel.locator('.notice-unread-dot')).toHaveCount(1);
  await expect(rows.first().getByRole('link',{name:/Notification non lue.*Lire la réponse/})).toHaveAttribute('href',/view=questions&question=SCT_test/);
  await expect(rows.nth(1).getByRole('link',{name:/Notification lue.*Voir le rapport/})).toBeVisible();
  await expect(rows.nth(1).locator('.sr-only')).toContainText('Notification lue.');
  await expect(rows.first().getByRole('button',{name:'Marquer comme lue',exact:true})).toHaveCount(0);
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
 await page.addStyleTag({content:'nextjs-portal{display:none!important}'});
 await mkdir(evidence,{recursive:true});
 const label=live?'before-live':origin.includes('127.0.0.1')?'after-local':'after-deployed';
 await page.screenshot({path:`${evidence}/${label}-390.png`});
 await rows.first().evaluate(element=>window.scrollTo(0,element.getBoundingClientRect().top+scrollY-100));
 await page.screenshot({path:`${evidence}/${label}-list-390.png`});
 const layout=await rows.evaluateAll(elements=>elements.map(element=>{const box=element.getBoundingClientRect();return {reference:(element as HTMLElement).dataset.reference,height:box.height,width:box.width,columns:getComputedStyle(element).gridTemplateColumns};}));
 await writeFile(`${evidence}/${label}.json`,JSON.stringify({origin,route:'/fr/shida/space/?view=messages',viewport:{width:390,height:844},intercepted,assets:[...new Set(assets)],layout},null,2));
});
