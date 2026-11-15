// Actual customer components, isolated API fixtures and blocked external navigation.
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import http from 'node:http';
import assert from 'node:assert/strict';
const repo=process.cwd(),modules=process.env.SHIDA_NODE_MODULES;
if(!modules)throw Error('Set SHIDA_NODE_MODULES to existing dependencies');
const require=createRequire(path.join(modules,'package.json'));
const {build}=await import(pathToFileURL(path.join(modules,'vite/dist/node/index.js')).href);
const {chromium}=require('@playwright/test');
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'shida-question-continuation-'));
const output=process.env.SHIDA_EVIDENCE||'C:/NIHILOBA/release-evidence/question-continuation-20261115';
await fs.mkdir(output,{recursive:true});
const slash=s=>s.replaceAll('\\','/');
await fs.writeFile(path.join(temp,'index.html'),'<html><head><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body><div id="root"></div><script type="module" src="/entry.tsx"></script></body></html>');
await fs.writeFile(path.join(temp,'image.tsx'),`import React from 'react';export default function Image({unoptimized,...props}){return <img {...props}/>}`);
await fs.writeFile(path.join(temp,'entry.tsx'),`import React from 'react';import {createRoot} from 'react-dom/client';import {HelpQuestions} from '${slash(path.join(repo,'app/components/shida/help-questions.tsx'))}';import NotificationCenter from '${slash(path.join(repo,'app/components/shida/notification-center.tsx'))}';import '${slash(path.join(repo,'app/components/shida/messages-design.css'))}';import './shell.css';const params=new URLSearchParams(location.search),locale=params.get('lang')||location.pathname.split('/')[1]||'en';createRoot(document.getElementById('root')!).render(<><header className="fixture-header">SHIDA</header><main>{params.has('question')?<HelpQuestions locale={locale} binding="isolated-test-binding"/>:<section className="messages-space"><h1>Notifications</h1><NotificationCenter binding="isolated-test-binding" apiBase="/api/shida/personal/notifications" locale={locale} inline/></section>}</main></>);`);
await fs.writeFile(path.join(temp,'shell.css'),' *{box-sizing:border-box}body{margin:0;background:#faf8f2;color:#173e32;font:16px Arial,sans-serif}.fixture-header{font:bold 32px Georgia,serif;padding:18px 24px;border-bottom:1px solid #ddd6c9}main{max-width:1100px;margin:24px auto;padding:0 16px}h1,h2{font-family:Georgia,serif}a{color:#173e32}');
let server,browser;
try{
 await build({configFile:false,root:temp,resolve:{alias:[{find:'next/image',replacement:path.join(temp,'image.tsx')},{find:/^react-dom(\/.*)?$/,replacement:slash(path.join(modules,'react-dom'))+'$1'},{find:/^react(\/.*)?$/,replacement:slash(path.join(modules,'react'))+'$1'}]},build:{outDir:path.join(temp,'dist'),emptyOutDir:true},logLevel:'warn'});
 server=http.createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname;const file=path.join(temp,'dist',pathname.startsWith('/assets/')?pathname:'index.html');if(!file.startsWith(path.join(temp,'dist')+path.sep))throw Error();res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'application/javascript':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404).end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({channel:'chrome',headless:true});
 const results=[];
 for(const locale of ['fr','en','ln','sw'])for(const width of [320,360,390,820,1440]){
  const page=await browser.newPage({viewport:{width,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const question={reference:'SCT_PRIVATE_TEST',display_reference:'Q4',topic:'other',status:'answered',message:'Comment utiliser SHIDA pour présenter tous les services de mon établissement et retrouver les demandes de mes clients ? '+('LongTexteSansEspace'.repeat(5)),created_at:'2026-11-15T12:00:00Z'};
  const messages=[{id:1,author:'user',message:question.message,channel:'web',created_at:question.created_at},{id:2,author:'support',message:'Ouvrez Mon espace pour gérer vos activités.',channel:'web',created_at:question.created_at},{id:3,author:'user',message:'Merci, puis-je aussi publier mes produits ?',channel:'whatsapp',created_at:question.created_at}];
  const prefix=locale==='en'?'':'/'+locale;const target='https://nihiloba.com'+prefix+'/shida/space?view=questions&question='+question.reference;
  await page.route('https://nihiloba.com/**',route=>route.fulfill({status:302,headers:{location:base+'/?lang='+locale+'&question='+question.reference}}));
  await page.route('**/api/**',route=>{const request=route.request(),url=new URL(request.url());if(url.pathname.includes('/notifications'))return route.fulfill({json:{unread_count:1,next_cursor:null,items:[{reference:'NTF_QUESTION_TEST',marketplace:'support',event_type:'question_answered',title:'SHIDA a répondu à votre question.',description:question.message,activity_reference:question.reference,created_at:question.created_at,read:false,action_required:false,expired:false,acknowledged:false,action_url:target}]}});if(url.pathname.endsWith('/reply'))messages.push({id:4,author:'user',message:request.postDataJSON().message,channel:'web',created_at:question.created_at});return route.fulfill({json:url.pathname.endsWith('/questions')?{questions:[question],has_more:false}:{question,messages}});});
  await page.goto(base+'/?lang='+locale);await page.locator('.notification-card').waitFor();
  assert(!(await page.locator('.notification-card').innerText()).includes('SCT_'));
  const link=page.locator('.notification-actions a');assert.equal(await link.getAttribute('href'),target);
  if(locale==='fr')assert.equal(await link.innerText(),'Lire la réponse');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if(locale==='fr'&&[390,1440].includes(width))await page.screenshot({path:`${output}/notification-${width}.png`,fullPage:true});
  await link.click();await page.locator('#question-reply').waitFor();
  assert.match(await page.locator('.help-card h2').innerText(),/^Comment utiliser SHIDA/);assert((await page.locator('.help-card h2').innerText()).length<=141);assert((await page.locator('.help-history').innerText()).includes(question.message));
  assert(!/SCT_|Q4/.test(await page.locator('.help-questions').innerText()));
  assert.match(await page.locator('.help-history').innerText(),/WhatsApp/);
  const wa=new URL(await page.locator('.help-actions a[target=_blank]').getAttribute('href'));assert.match(wa.searchParams.get('text'),/Q4$/);
  await page.locator('#question-reply').fill('Une précision depuis le site.');await page.locator('.help-card form button').click();await page.getByText('Une précision depuis le site.',{exact:true}).waitFor();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if(locale==='fr'&&[390,1440].includes(width))await page.screenshot({path:`${output}/question-${width}.png`,fullPage:true});
  await page.locator('.help-back').click();await page.locator('.help-question-link').waitFor();assert(!/SCT_|Q4/.test(await page.locator('.help-list').innerText()));
  assert.deepEqual(errors,[]);results.push({locale,width,notificationLink:true,privateIdentifiersHidden:true,sharedChannelHistory:true,overflow:false});await page.close();
 }
 await fs.writeFile(path.join(output,'customer-browser-results.json'),JSON.stringify(results,null,2));console.log('Passed 20 customer notification/history checks across four languages and five widths.');
}finally{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));if(!path.resolve(temp).startsWith(path.resolve(os.tmpdir())+path.sep+'shida-question-continuation-'))throw Error('Unexpected temporary path');await fs.rm(temp,{recursive:true,force:true});}
