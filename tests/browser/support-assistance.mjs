import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.SHIDA_TEST_URL||'http://127.0.0.1:3037';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw Error('Local fixture only');
const phase=process.env.SHIDA_SUPPORT_PHASE||'after';
const output=process.env.SHIDA_EVIDENCE;
if(!output)throw Error('Evidence directory required');
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
try{
 for(const width of [320,375,390,430,1440]){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
  const ticket={public_ref:'SCT_SUPPORT_FIXTURE',reference:'SCT_SUPPORT_FIXTURE',category:'jobs',message:'Je ne parviens pas à postuler. Pouvez-vous vérifier le bouton de candidature ?',status:'answered',created_at:'2026-11-16T16:32:00Z',updated_at:'2026-11-16T16:40:00Z',latest_at:'2026-11-16T16:40:00Z',preview:'Précisez le titre du poste concerné.',unread:true,can_reopen:false};
  const messages=[{id:1,sender_type:'user',message:ticket.message,created_at:ticket.created_at},{id:2,sender_type:'support',message:'Bonjour, pouvez-vous préciser le titre du poste concerné ?',created_at:ticket.updated_at}];
  const state={fail:false,posts:[],keys:new Set(),reads:0,empty:false,getFail:false};
  await page.route('**/*',route=>{
   const req=route.request(),url=new URL(req.url()),path=url.pathname.replace(/\/$/,'');
   if(url.origin!==base)return route.abort();
   if(!path.includes('/api/'))return route.continue();
   const send=json=>route.fulfill({json});
   if(path.endsWith('/employment/session'))return send({binding:'a'.repeat(64),user:{display_name:'Francis Mabala'}});
   if(path.endsWith('/security/profile'))return send({revision:'fixture',values:{preferred_language:'fr'}});
   if(path.includes('/personal/support')){
    if(path.endsWith('/read')){state.reads++;return send({ok:true});}
    if(req.method()==='POST'){
     const body=req.postDataJSON();state.posts.push({path,...body});
     if(state.fail)return route.fulfill({status:503,json:{detail:'unavailable'}});
     if(path.endsWith('/close'))ticket.status='closed';
     else if(body.message&&!state.keys.has(body.request_id)){
      state.keys.add(body.request_id);ticket.status='open';
      if(!path.endsWith('/reply')){ticket.message=body.message;ticket.category=body.category;messages.length=0;}
      messages.push({id:messages.length+1,sender_type:'user',message:body.message,created_at:'2026-11-16T17:00:00Z'});
     }
    }
    if(req.method()==='GET'&&state.getFail)return route.fulfill({status:503,json:{detail:'unavailable'}});
    if(path.endsWith('/support')&&req.method()==='GET')return send({tickets:state.empty?[]:[ticket],page:1,has_more:false});
    return send({ticket,messages});
   }
   if(path.includes('/notifications'))return send({items:[],unread_count:0});
   if(path.includes('/activities'))return send({activities:[],has_more:false});
   return send({});
  });
  const root=base+'/fr/shida/space?view=support';
  await page.goto(root);await page.locator('.space-support').waitFor();await page.waitForTimeout(250);
  await page.screenshot({path:`${output}/${phase}-list-${width}.png`,fullPage:true});
  await page.goto(root+'&case='+ticket.public_ref);await page.locator('.space-support textarea').waitFor();await page.waitForTimeout(250);
  await page.screenshot({path:`${output}/${phase}-conversation-${width}.png`,fullPage:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.goto(root+(phase==='after'?'&compose=1':''));await page.locator('.space-support textarea').waitFor();
  await page.screenshot({path:`${output}/${phase}-new-${width}.png`,fullPage:true});
  if(phase==='after'){
   assert(await page.getByRole('button',{name:'Envoyer la demande',exact:true}).isDisabled());
   await page.locator('#support-reply').fill('   ');assert(await page.getByRole('button',{name:'Envoyer la demande',exact:true}).isDisabled());
   const content='Une demande précise concernant une candidature. '+ 'mottrèslong'.repeat(32);
   await page.locator('#support-category').selectOption('jobs');await page.locator('#support-reply').fill(content);
   state.fail=true;await page.getByRole('button',{name:'Envoyer la demande',exact:true}).click();await page.locator('.assistance-error').waitFor();
   assert.equal(await page.locator('#support-reply').inputValue(),content);
   state.fail=false;await page.getByRole('button',{name:'Envoyer la demande',exact:true}).dblclick();await page.getByRole('status').filter({hasText:'Votre message a été enregistré.'}).waitFor();
   assert.equal(state.posts.length,2);assert.equal(state.posts[0].request_id,state.posts[1].request_id);assert.equal(state.keys.size,1);
   await page.reload();await page.locator('.assistance-history').waitFor();assert.match(await page.locator('.assistance-history').innerText(),/Une demande précise/);
   await page.locator('#support-reply').fill('Une précision conservée.');await page.reload();await page.locator('#support-reply').waitFor();await page.waitForTimeout(100);assert.equal(await page.locator('#support-reply').inputValue(),'Une précision conservée.');
   await page.getByRole('button',{name:'Envoyer',exact:true}).click();await page.getByRole('status').filter({hasText:'enregistré'}).waitFor();assert.equal(messages.length,2);
   assert(state.reads>0);
   if(width===390){await page.setViewportSize({width,height:430});await page.locator('#support-reply').focus();await page.getByRole('button',{name:'Envoyer',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:`${output}/after-keyboard-390.png`,fullPage:true});assert(await page.evaluate(()=>{const b=document.querySelector('.assistance-send button').getBoundingClientRect();return b.bottom<=innerHeight-60;}),'send action above bottom navigation');await page.setViewportSize({width,height:1000});}
   await page.locator('.assistance-actions summary').click();await page.getByRole('button',{name:'Marquer comme résolue',exact:true}).click();await page.locator('.assistance-closed').waitFor();assert.equal(ticket.status,'closed');assert.equal(await page.locator('#support-reply').count(),0);
   await page.reload();await page.locator('.assistance-closed').waitFor();
   await page.goto(root);await page.locator('.assistance-row').waitFor();await page.getByRole('button',{name:'En cours',exact:true}).click();await page.locator('.assistance-row').click();
   if(width<1101){await page.getByRole('button',{name:'← Mes demandes',exact:true}).click();assert.match(page.url(),/supportStatus=active/);}
   await page.goto(root);await page.locator('.assistance-row').waitFor();
   await page.evaluate(()=>{const sizes=Array.from(document.querySelectorAll('.assistance *')).map(el=>[el,parseFloat(getComputedStyle(el).fontSize)]);for(const [el,size] of sizes)el.style.fontSize=(size*2)+'px';});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'enlarged text must wrap');
   await page.screenshot({path:`${output}/after-enlarged-${width}.png`,fullPage:true});
   state.empty=true;await page.reload();await page.getByText('Aucune demande d’assistance.',{exact:true}).waitFor();
   state.getFail=true;await page.reload();await page.locator('.assistance-error').waitFor();assert.equal(await page.getByText('Aucune demande d’assistance.',{exact:true}).count(),0);
   state.getFail=false;await page.locator('.assistance-error').getByRole('button',{name:'Actualiser'}).click();await page.getByText('Aucune demande d’assistance.',{exact:true}).waitFor();
  }
  results.push({width,phase});await page.close();
 }
}finally{await browser.close();}
await fs.writeFile(`${output}/${phase}-results.json`,JSON.stringify(results,null,2));
console.log(`${results.length} ${phase} viewports captured`);
