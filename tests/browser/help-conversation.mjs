// Built account page, real shared branding/navigation, isolated network data only.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {offlinePage} from './help-conversation-offline.mjs';
const base=process.env.SHIDA_TEST_URL||'http://127.0.0.1:3017';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw Error('Local test server required');
const output=process.env.SHIDA_EVIDENCE||'C:/NIHILOBA/release-evidence/help-conversation-20261115';
await fs.mkdir(output,{recursive:true});
const offline=process.env.SHIDA_OFFLINE==='1'?await offlinePage():null;
if(offline)await fs.writeFile(`${output}/offline-path.txt`,offline.temp);
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
async function fixture(locale,width){
 const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const state={binding:'a'.repeat(64),fail:false,denied:false,empty:false,delay:0,getDelay:0,posts:[],keys:new Set(),reads:0,detailGets:0};
 const question={reference:'SCT_LAYOUT_TEST',display_reference:'Q123',topic:'other',status:'answered',message:'Comment utiliser SHIDA pour présenter mon établissement ?',created_at:'2026-11-14T09:13:00Z'};
 state.question=question;state.messages=[{id:1,author:'user',message:question.message,channel:'web',created_at:question.created_at},{id:2,author:'support',message:'Bonjour ! Choisissez un marché comme Emplois, Wenze ou Services, puis recherchez ce qui vous intéresse.\nVous pouvez aussi gérer vos activités depuis Mon espace.',channel:'web',created_at:'2026-11-15T15:22:31Z'}];
 await page.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.origin!==base)return route.abort();
  if(!url.pathname.includes('/api/'))return offline?offline.serve(route):route.continue();
  const path=url.pathname.replace(/\/$/,''),send=json=>route.fulfill({json});
  if(path.endsWith('/employment/session'))return send({binding:state.binding,user:{display_name:'Francis Mabala'}});
  if(path.endsWith('/security/profile'))return send({revision:'fixture',values:{preferred_language:locale}});
  if(path.includes('/support/questions')){
   if(state.denied)return route.fulfill({status:403,json:{detail:'forbidden'}});
   if(path.endsWith('/questions'))return send({questions:state.empty?[]:[question],has_more:false});
   if(request.method()==='POST'){
    if(path.endsWith('/read')){state.reads++;return send({ok:true});}
    const body=request.postDataJSON();state.posts.push({path,...body});
    if(state.delay)await new Promise(resolve=>setTimeout(resolve,state.delay));
    if(state.fail)return route.fulfill({status:503,json:{detail:'unavailable'}});
    if(path.endsWith('/reply')&&!state.keys.has(body.request_id)){
     state.keys.add(body.request_id);state.messages.push({id:state.messages.length+1,author:'user',message:body.message,channel:'web',created_at:'2026-11-15T17:00:00Z'});question.status='open';
    }
    if(path.endsWith('/close'))question.status='closed';
    if(path.endsWith('/reopen'))question.status='open';
   }else {state.detailGets++;if(state.getDelay)await new Promise(resolve=>setTimeout(resolve,state.getDelay));}
   return send({question,messages:state.messages});
  }
  if(path.includes('/notifications'))return send({items:[],unread_count:0});
  if(path.includes('/activities'))return send({activities:[],has_more:false});
  return send({});
 });
 const url=base+(locale==='en'?'':'/'+locale)+'/shida/space?view=questions&question='+question.reference;
 const open=async()=>{await page.goto(url);await page.locator('#question-reply').waitFor();await page.waitForFunction(()=>!document.querySelector('#question-reply').disabled);};
 return {page,state,errors,open,url};
}
const noOverflow=async page=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');
const incoming=async(page,state)=>{const count=state.detailGets;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForFunction(()=>true);for(let n=0;n<50&&state.detailGets===count;n++)await page.waitForTimeout(20);assert(state.detailGets>count);};
try{
 for(const locale of ['fr','en','ln','sw'])for(const width of [320,360,390,820,1440]){
  const {page,state,errors,open}=await fixture(locale,width);await open();
  assert.equal(await page.locator('.help-avatar').first().innerText(),'FM');
  assert.equal(await page.locator('.help-status').count(),1);
  assert(!/SCT_|Q123/.test(await page.locator('.help-questions').innerText()));
  assert.match(await page.locator('.help-message time').last().innerText(),/^\d{2}:\d{2}(?: [AP]M)?$/);
  assert(await page.locator('.help-message time').last().getAttribute('title'));
  assert.equal(state.posts.length,0);assert(state.reads>0);
  const wa=new URL(await page.locator('.help-conversation-actions a').getAttribute('href'));
  assert.equal(wa.hostname,'wa.me');assert.match(wa.searchParams.get('text'),/Q123$/);
  await noOverflow(page);
  if(locale==='fr'&&width===390)await fs.writeFile(`${output}/layout-debug.json`,JSON.stringify(await page.locator('.help-history, .help-message, .help-message-meta, .help-date').evaluateAll(els=>els.map(el=>({cls:el.className,tag:el.tagName,rect:el.getBoundingClientRect().toJSON(),style:Object.fromEntries(['display','margin','padding','minHeight','height','fontFamily'].map(key=>[key,getComputedStyle(el)[key]]))}))),null,2));
  if(locale==='fr'&&[390,1440].includes(width)){await page.screenshot({path:`${output}/conversation-${width}.png`,fullPage:true});if(width===390){await page.locator('.help-composer button').scrollIntoViewIfNeeded();await page.screenshot({path:`${output}/conversation-mobile-composer.png`});}}
  // Draft survives a reload, polling and navigating away/back, with an unchanged retry key.
  const reply=page.locator('#question-reply');await reply.fill('Une précision\navec une seconde ligne.');
  await page.reload();await page.waitForFunction(()=>document.querySelector('#question-reply')?.value.startsWith('Une précision'));
  await incoming(page,state);assert.match(await reply.inputValue(),/seconde ligne/);
  await page.locator('.help-back').click();await page.waitForFunction(()=>document.activeElement?.classList.contains('help-question-link'));await page.locator('.help-question-link').click();assert.match(await reply.inputValue(),/seconde ligne/);
  state.fail=true;await page.locator('.help-composer button').click();await page.locator('.help-questions [role=alert]').waitFor();
  const key=state.posts.at(-1).request_id;assert.match(await reply.inputValue(),/seconde ligne/);
  state.fail=false;state.delay=150;
  await page.locator('.help-questions [role=alert] button').click();await page.waitForFunction(()=>document.querySelector('#question-reply')?.value==='');
  assert.equal(state.posts.at(-1).request_id,key);assert.equal(state.keys.size,1);
  assert.equal(state.question.status,'open');
  // IME and normal multiline Enter must not send. A repeated synchronous submit sends once.
  await reply.fill('Test IME');const count=state.posts.length;
  await reply.dispatchEvent('compositionstart');await page.locator('.help-reply-form').evaluate(form=>form.requestSubmit());assert.equal(state.posts.length,count);
  await reply.dispatchEvent('compositionend');await reply.focus();await page.keyboard.press('Enter');assert.equal(state.posts.length,count);
  await page.locator('.help-reply-form').evaluate(form=>{form.requestSubmit();form.requestSubmit();});await page.waitForFunction(()=>document.querySelector('#question-reply')?.value==='');
  assert.equal(state.posts.length,count+1);
  await reply.fill('Brouillon après réouverture');
  await page.locator('.help-conversation-actions button').click();await page.waitForFunction(()=>!document.querySelector('#question-reply'));
  assert.equal(state.question.status,'closed');await page.locator('.help-conversation-actions button').click();await reply.waitFor();assert.equal(await reply.inputValue(),'Brouillon après réouverture');
  // Long, unbroken content and URLs remain complete and contained in every translation.
  state.question.message='Un très long sujet '+('ÉtablissementSansEspaces'.repeat(12));
  state.messages.push({id:state.messages.length+1,author:'support',message:'https://example.invalid/'+('long-link'.repeat(30)),channel:'whatsapp',created_at:'2026-11-15T17:22:31Z'});
  await incoming(page,state);await page.getByText(state.messages.at(-1).message,{exact:true}).waitFor();await noOverflow(page);
  await page.addStyleTag({content:'html{font-size:200%}'});await noOverflow(page);
  await page.setViewportSize({width,height:420});await reply.focus();await reply.scrollIntoViewIfNeeded();await noOverflow(page);
  const box=await reply.boundingBox();assert(box.width>=180&&box.height>=44);assert(await reply.evaluate(el=>{const box=el.getBoundingClientRect();return document.elementFromPoint(box.x+box.width/2,box.y+box.height/2)===el;}),'Composer obscured by fixed navigation');
  assert.deepEqual(errors,[]);results.push({locale,width,draftReload:true,retryKey:true,ime:true,duplicateSubmit:true,closeReopen:true,largeText:true,keyboardHeight:true,overflow:false});await page.close();
 }
 // Long history: initial latest, incoming while reading, explicit jump and earlier position.
 const {page,state,open}=await fixture('fr',390);
 state.messages=Array.from({length:70},(_,i)=>({id:i+1,author:i%2?'support':'user',message:`Message ${i+1} : contenu de test conservé.`,channel:'web',created_at:new Date(Date.UTC(2026,10,14,8,i)).toISOString()}));
 await open();const history=page.locator('.help-history');assert(await history.evaluate(el=>el.scrollTop>0));
 await history.evaluate(el=>{el.scrollTop=0;el.dispatchEvent(new Event('scroll'));});
 state.messages.push({id:71,author:'support',message:'Nouveau message pendant la lecture.',channel:'whatsapp',created_at:'2026-11-15T17:22:00Z'});
 await incoming(page,state);await page.locator('.help-new-messages').waitFor();assert.equal(await history.evaluate(el=>el.scrollTop),0);
 const anchor=page.getByText('Message 41 : contenu de test conservé.',{exact:true}),before=(await anchor.boundingBox()).y;
 await page.locator('.help-earlier').click();assert(Math.abs((await anchor.boundingBox()).y-before)<3);
 await page.locator('.help-new-messages').click();assert(await history.evaluate(el=>el.scrollHeight-el.scrollTop-el.clientHeight<3));
 assert.equal(await page.locator('.help-new-messages').count(),0);assert.equal(await page.locator('.help-announcement').innerText(),'Nouveaux messages (1)');state.messages.push({id:72,author:'support',message:'Encore une réponse.',channel:'web',created_at:'2026-11-15T17:23:00Z'});await incoming(page,state);await page.waitForFunction(()=>document.querySelector('.help-announcement')?.textContent==='Nouveaux messages (2)');
 // Account change discards saved text; private storage contains neither binding nor history.
 await page.locator('#question-reply').fill('Privé : brouillon de ce compte');
 await page.waitForFunction(()=>Object.keys(sessionStorage).some(key=>key.startsWith('shida-help-draft')));
 const saved=await page.evaluate(()=>JSON.stringify(sessionStorage));assert(!saved.includes(state.binding));assert(!saved.includes('Message 41'));
 state.binding='b'.repeat(64);await page.evaluate(()=>window.dispatchEvent(new Event('shida-personal-session-changed')));await page.waitForFunction(()=>document.querySelector('#question-reply')?.value==='');
 assert(!JSON.stringify(await page.evaluate(()=>({...sessionStorage}))).includes('Privé'));
 await page.close();results.push({longHistory:true,incomingPosition:true,earlierPosition:true,accountIsolation:true});
 const loading=await fixture('fr',360);loading.state.getDelay=700;await loading.page.goto(loading.url);await loading.page.locator('.help-questions').getByText('Chargement…',{exact:true}).waitFor();await loading.page.locator('#question-reply').waitFor();await loading.page.close();
 const storage=await fixture('fr',360);await storage.page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Storage unavailable','SecurityError');};});await storage.open();await storage.page.locator('#question-reply').fill('Reste disponible dans cette page.');await storage.page.getByText(/Ce navigateur ne peut pas le restaurer/).waitFor();await incoming(storage.page,storage.state);assert.equal(await storage.page.locator('#question-reply').inputValue(),'Reste disponible dans cette page.');await storage.page.close();results.push({initialLoading:true,storageUnavailable:true});
 // Loading/denied/empty states do not invent a conversation or leak another customer's text.
 const denied=await fixture('fr',320);denied.state.denied=true;await denied.page.goto(denied.url);await denied.page.locator('.help-questions [role=alert]').waitFor();assert.equal(await denied.page.locator('.help-history').count(),0);
 denied.state.denied=false;denied.state.messages=[];await denied.page.locator('.help-questions [role=alert] button').click();await denied.page.getByText('Aucun message pour le moment.').waitFor();
 await denied.page.locator('.help-back').click();denied.state.empty=true;await denied.page.locator('.help-card header button').click();await denied.page.getByText('Aucune question pour le moment.').waitFor();await denied.page.close();results.push({denied:true,emptyHistory:true,emptyList:true});
 await fs.writeFile(`${output}/conversation-results.json`,JSON.stringify(results,null,2));console.log(`Passed ${results.length} conversation scenarios (20 locale/viewport combinations plus history/state checks).`);
}finally{await browser.close();}
