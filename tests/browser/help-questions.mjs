import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.SHIDA_TEST_URL||'http://127.0.0.1:3013';
const output=process.env.SHIDA_EVIDENCE||'C:/NIHILOBA/release-evidence/help-questions-20261115';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
try{
 for(const locale of ['fr','en','ln','sw'])for(const width of [320,390,820,1440]){
  const page=await browser.newPage({viewport:{width,height:950}});let submitted=0,fail=false;const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const question={reference:'SCT_HELP_TEST',display_reference:'Q123',topic:'using_shida',status:'answered',message:'Comment partager ma boutique avec les clients qui souhaitent découvrir tous mes produits et mes services ?',created_at:'2026-11-15T09:00:00Z'};
  const messages=[{id:1,author:'user',message:question.message,channel:'web',created_at:question.created_at},{id:2,author:'support',message:'Ouvrez Ma boutique, puis Partager pour copier votre lien. '+('UnLongTexteSansEspaces'.repeat(8)),channel:'web',created_at:'2026-11-15T10:00:00Z'}];
  await page.route('**/api/**',async route=>{
   const u=new URL(route.request().url()),path=u.pathname.replace(/\/$/,'');
   const send=json=>route.fulfill({json});
   if(path.endsWith('/employment/session'))return send({binding:'a'.repeat(64),user:{display_name:'Alex Test'}});
   if(path.endsWith('/security/profile'))return send({revision:'fixture',values:{preferred_language:locale}});
   if(path.includes('/support/questions')){
    if(route.request().method()==='POST'){
     if(fail)return route.fulfill({status:503,json:{detail:'unavailable'}});
     if(path.endsWith('/questions')){submitted++;return send({question:{...question,status:'open'}});}
     if(path.endsWith('/reply')){messages.push({id:messages.length+1,author:'user',message:route.request().postDataJSON().message,channel:'web',created_at:question.created_at});return send({question,messages});}
     return send({ok:true,question});
    }
    return path.endsWith('/questions')?send({questions:[question],page:1,has_more:false}):send({question,messages});
   }
   if(path.includes('/notifications'))return send({items:[],unread_count:0});
   if(path.includes('/activities'))return send({activities:[],has_more:false});
   return send({});
  });
  const prefix=locale==='en'?'':'/'+locale;
  await page.goto(base+prefix+'/shida/space?view=questions',{waitUntil:'networkidle'});
  await page.locator('#question-body').waitFor();
  await page.locator('#question-body').fill('Puis-je proposer plusieurs services avec mon compte personnel ?');
  await page.locator('.help-tabs button').nth(2).click();await page.locator('.help-tabs button').first().click();
  assert.match(await page.locator('#question-body').inputValue(),/plusieurs services/);
  await page.evaluate(()=>{document.activeElement?.blur();getSelection()?.removeAllRanges();});
  if(locale==='fr'&&[390,1440].includes(width))await page.screenshot({path:`${output}/questions-${width}.png`,fullPage:true});
  fail=true;await page.locator('.help-primary').click();await page.locator('.help-questions [role=alert]').waitFor();
  assert.match(await page.locator('#question-body').inputValue(),/plusieurs services/);
  fail=false;await page.locator('.help-primary').dblclick();await page.locator('#question-reply').waitFor();assert.equal(submitted,1);
  const link=page.locator('.help-actions a[target=_blank]');const href=new URL(await link.getAttribute('href'));
  assert.equal(href.hostname,'wa.me');assert.match(href.searchParams.get('text'),/Q123$/);assert(!href.href.includes('boutique'));
  await page.locator('#question-reply').fill('Mon suivi est conservé.');await page.locator('.help-back').click();await page.locator('.help-tabs button').first().click();await page.locator('.help-tabs button').nth(1).click();await page.locator('.help-question-link').click();assert.equal(await page.locator('#question-reply').inputValue(),'Mon suivi est conservé.');
  await page.evaluate(()=>{document.activeElement?.blur();getSelection()?.removeAllRanges();});
  if(locale==='fr'&&[390,1440].includes(width))await page.screenshot({path:`${output}/history-${width}.png`,fullPage:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.deepEqual(errors,[]);
  // Menu placement and keyboard closure on both desktop and narrow phones.
  await page.locator('.market-avatar').first().click();await page.locator('.auth-account-menu').waitFor();
  const links=await page.locator('.auth-account-menu a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
  assert.equal(links.findIndex(h=>h.includes('view=questions')),links.findIndex(h=>h.includes('view=settings'))+1);
  await page.keyboard.press('Escape');assert.equal(await page.locator('.auth-account-menu').count(),0);
  results.push({locale,width,submission:'deduplicated',draft:'preserved',overflow:false});await page.close();
 }
 await fs.writeFile(`${output}/browser-results.json`,JSON.stringify(results,null,2));console.log(`Passed ${results.length} desktop/tablet/mobile language checks`);
}finally{await browser.close();}
